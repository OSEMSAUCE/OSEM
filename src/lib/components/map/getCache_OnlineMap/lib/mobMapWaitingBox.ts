// Waiting-box — the on-map "your PDF is coming" placeholder.
//
// A raw PDF map has to round-trip the cloud converter (~20-30s on weak field
// signal) and there's no on-device preview for the JPX/ArcMap case pdf.js
// can't draw. A tiny inbox spinner isn't reassuring there — a planter on one
// bar reads "nothing happened" and gives up, OR (worse) we show a half-drawn
// map they mistake for the finished thing. Both kill trust.
//
// So instead we drop a placeholder AT THE TRUE SPOT the instant they import,
// using the corners we already read on-device (geoPdfBounds). It is an
// UNMISTAKABLE "waiting" state, never a partial map:
//   • a DARK-SLATE fill with a WHITE border on the real footprint (matches
//     the white-paper map they expect; scales with zoom because it's a
//     GeoJSON polygon, not a screen-space chip), and
//   • the cleanCache animation MOUNTED ON the slab via a georeferenced
//     CanvasSource — it is part of the map image, so it pans/zooms/scales
//     welded to the slab instead of floating over it as a screen-space
//     sticker (which visibly slid against the box and read as "thrown at
//     the page, not mounted").
// When the server WebP arrives the real overlay mounts and this is torn down.
// If it never arrives (offline/trickle) the user is left on the honest
// waiting box, not a broken map.
//
// Distinct source/layer ids from mobMapOverlay so the two never collide (the
// box can be up WHILE the real overlay mounts, for the no-blink handoff).

import type { Map as MapboxMap } from "mapbox-gl";
import type { Coord } from "$harness/components/map/mapShared/coord";

const BOX_SOURCE_ID = "map-waiting-box";
const BOX_FILL_LAYER_ID = "map-waiting-box-fill";
const BOX_LINE_LAYER_ID = "map-waiting-box-line";
const ANIM_SOURCE_ID = "map-waiting-anim";
const ANIM_LAYER_ID = "map-waiting-anim-layer";

// The cleanCache animation as INDIVIDUAL FRAMES (same folder the animated
// .webp is built from — see the animated-webp memory). A CanvasSource needs
// us to draw each frame ourselves: drawImage() of an *animated* image only
// ever draws its first frame (per spec), so the single-file .webp can't be
// used here. Symlinked into ReTreever/static, so the absolute web path
// resolves in every runtime context.
const ANIM_FRAME_URL = (n: number) =>
	`/mobileAssets/animations/cleanCache_anime/${n}_cleanCache_anime.webp`;
const ANIM_FRAME_COUNT = 11;
const ANIM_FRAME_MS = 500; // matches the built .webp's per-frame duration
const ANIM_CANVAS_PX = 500; // native frame resolution

// One waiting box at a time (a single import blocks the map anyway). The
// frame ticker + canvas are held so hideWaitingBox can stop and drop them.
let animTimer: ReturnType<typeof setInterval> | null = null;
let animCanvas: HTMLCanvasElement | null = null;
let animFrames: HTMLImageElement[] = [];

// A show requested before the style finished loading — queued for the map's
// `load` event rather than silently dropped (the box must appear the moment
// an import starts, even on a cold map). Cancelled by hideWaitingBox.
let pendingShowCorners: readonly [Coord, Coord, Coord, Coord] | null = null;

function styleReady(map: MapboxMap): boolean {
	return !!map && !!(map as unknown as { style?: unknown }).style;
}

/** [TL, TR, BR, BL] → a closed GeoJSON ring [TL, TR, BR, BL, TL]. */
function ringFromCorners(
	corners: readonly [Coord, Coord, Coord, Coord],
): [number, number][] {
	const [tl, tr, br, bl] = corners;
	return [
		[tl[0], tl[1]],
		[tr[0], tr[1]],
		[br[0], br[1]],
		[bl[0], bl[1]],
		[tl[0], tl[1]],
	];
}

/** Centre of the quad (average of the 4 corners) — where the animation sits. */
function centreOf(
	corners: readonly [Coord, Coord, Coord, Coord],
): [number, number] {
	let lng = 0;
	let lat = 0;
	for (const c of corners) {
		lng += c[0];
		lat += c[1];
	}
	return [lng / 4, lat / 4];
}

/** A geographic SQUARE centred on the quad, sized to ~3/4 of the slab's
 *  shorter side — where the animation canvas is draped. Metres-based so it
 *  renders square on screen regardless of latitude (raw degrees would
 *  squash it: 1° of longitude shrinks with cos(lat)). */
function innerSquareQuad(
	corners: readonly [Coord, Coord, Coord, Coord],
): [[number, number], [number, number], [number, number], [number, number]] {
	const [clng, clat] = centreOf(corners);
	const mPerDegLat = 110_540;
	const mPerDegLng = 111_320 * Math.cos((clat * Math.PI) / 180);
	const lngs = corners.map((c) => c[0]);
	const lats = corners.map((c) => c[1]);
	const widthM = (Math.max(...lngs) - Math.min(...lngs)) * mPerDegLng;
	const heightM = (Math.max(...lats) - Math.min(...lats)) * mPerDegLat;
	const sideM = Math.min(widthM, heightM) * 0.75;
	const halfLng = sideM / 2 / mPerDegLng;
	const halfLat = sideM / 2 / mPerDegLat;
	return [
		[clng - halfLng, clat + halfLat],
		[clng + halfLng, clat + halfLat],
		[clng + halfLng, clat - halfLat],
		[clng - halfLng, clat - halfLat],
	];
}

/** Insert the box below labels (same rule as the real overlay) so place names
 *  stay readable on top of it. */
function pickBeforeId(map: MapboxMap): string | undefined {
	for (const id of ["draw-edges-halo", "completed-fill"]) {
		if (map.getLayer(id)) return id;
	}
	const layers = map.getStyle()?.layers ?? [];
	return layers.find((l) => l.type === "symbol")?.id;
}

/**
 * Show the waiting placeholder on `corners` ([TL,TR,BR,BL], the same order the
 * real overlay uses). Idempotent: calling again re-points an existing box.
 * Does NOT move the camera — the importer frames the spot.
 */
export function showWaitingBox(
	map: MapboxMap,
	corners: readonly [Coord, Coord, Coord, Coord],
): void {
	if (!styleReady(map)) {
		const firstQueued = pendingShowCorners === null;
		pendingShowCorners = corners;
		if (firstQueued) {
			map.once("load", () => {
				const queued = pendingShowCorners;
				pendingShowCorners = null;
				if (queued) showWaitingBox(map, queued);
			});
		}
		return;
	}
	pendingShowCorners = null;

	const fc: GeoJSON.FeatureCollection = {
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				properties: {},
				geometry: {
					type: "Polygon",
					coordinates: [ringFromCorners(corners)],
				},
			},
		],
	};

	const existing = map.getSource(BOX_SOURCE_ID);
	if (existing && "setData" in existing) {
		(existing as mapboxgl.GeoJSONSource).setData(fc);
	} else {
		map.addSource(BOX_SOURCE_ID, { type: "geojson", data: fc });
		const beforeId = pickBeforeId(map);
		map.addLayer(
			{
				id: BOX_FILL_LAYER_ID,
				type: "fill",
				source: BOX_SOURCE_ID,
				// Dark slate grey — "here's where it's supposed to be, here's a
				// slate" (the user's framing): an obvious placeholder slab,
				// not a black hole punched in the map. Dark + near-opaque so it
				// never reads faint over a bright basemap; the sliver of
				// transparency keeps it reading as an overlay, not a hole.
				paint: { "fill-color": "#31383f", "fill-opacity": 0.92 },
			},
			beforeId,
		);
		map.addLayer(
			{
				id: BOX_LINE_LAYER_ID,
				type: "line",
				source: BOX_SOURCE_ID,
				paint: { "line-color": "#ffffff", "line-width": 2 },
			},
			beforeId,
		);
	}

	// The animation MOUNTED ON the slab: a canvas draped over a geographic
	// square in the slab's centre (~3/4 of its shorter side). Because it is a
	// map source — not a DOM overlay — it moves and scales as one object with
	// the box through every pan and zoom: welded, not floating. We tick the
	// 11 source frames onto the canvas ourselves (drawImage of an animated
	// image only ever yields frame 1) and `animate: true` keeps Mapbox
	// re-uploading the canvas texture.
	const animQuad = innerSquareQuad(corners);
	const existingAnim = map.getSource(ANIM_SOURCE_ID);
	if (existingAnim && "setCoordinates" in existingAnim) {
		(
			existingAnim as unknown as {
				setCoordinates: (c: number[][]) => void;
			}
		).setCoordinates(animQuad as unknown as number[][]);
		return;
	}
	if (!animCanvas) {
		animCanvas = document.createElement("canvas");
		animCanvas.width = ANIM_CANVAS_PX;
		animCanvas.height = ANIM_CANVAS_PX;
	}
	if (animFrames.length === 0) {
		animFrames = Array.from({ length: ANIM_FRAME_COUNT }, (_, i) => {
			const img = new Image();
			img.src = ANIM_FRAME_URL(i + 1);
			return img;
		});
	}
	const ctx = animCanvas.getContext("2d");
	let frame = 0;
	if (animTimer) clearInterval(animTimer);
	const drawFrame = () => {
		const img = animFrames[frame % ANIM_FRAME_COUNT];
		frame += 1;
		if (!ctx || !img?.complete || img.naturalWidth === 0) return;
		ctx.clearRect(0, 0, ANIM_CANVAS_PX, ANIM_CANVAS_PX);
		ctx.drawImage(img, 0, 0, ANIM_CANVAS_PX, ANIM_CANVAS_PX);
	};
	drawFrame();
	animTimer = setInterval(drawFrame, ANIM_FRAME_MS);
	map.addSource(ANIM_SOURCE_ID, {
		type: "canvas",
		canvas: animCanvas,
		coordinates: animQuad,
		animate: true,
	});
	map.addLayer(
		{
			id: ANIM_LAYER_ID,
			type: "raster",
			source: ANIM_SOURCE_ID,
			paint: { "raster-fade-duration": 0 },
		},
		pickBeforeId(map),
	);
}

/**
 * Tear down the waiting box only once the real overlay is actually ON SCREEN.
 *
 * `addMapOverlay` adds the ImageSource synchronously, but Mapbox loads +
 * decodes the WebP asynchronously — hiding the box when addMapOverlay
 * *resolves* leaves a blank beat before the image paints (the "it disappeared
 * for a second" bug). So we hide on the first RENDERED FRAME after the
 * overlay source reports loaded: image decoded + drawn ⇒ pixels visible.
 *
 * NEVER gate this on `idle`: the waiting animation itself is an animated
 * CanvasSource that keeps the map perpetually re-rendering, so idle can't
 * arrive while the box is up — an idle gate only fires via the guard timeout
 * and the animation overstays on top of the finished map by ~10s (the
 * "animation runs way longer than it should" bug).
 *
 * The timeout is a never-strand guard only: if the overlay somehow never
 * loads, we still hide rather than leave the box up forever on a working map.
 */
export function hideWaitingBoxOnceRendered(
	map: MapboxMap,
	overlaySourceId = "map-overlay-image",
): void {
	if (!styleReady(map)) {
		hideWaitingBox(map);
		return;
	}
	let settled = false;
	const done = () => {
		if (settled) return;
		settled = true;
		map.off("sourcedata", onSourceData);
		map.off("render", onPainted);
		clearTimeout(guard);
		hideWaitingBox(map);
	};
	// One rendered frame AFTER the overlay image is loaded ⇒ it's on screen.
	const onPainted = () => done();
	const armPaint = () => {
		map.off("sourcedata", onSourceData);
		map.once("render", onPainted);
	};
	const onSourceData = (e: { sourceId?: string }) => {
		if (e.sourceId !== overlaySourceId) return;
		if (map.isSourceLoaded(overlaySourceId)) armPaint();
	};
	const guard = setTimeout(done, 10_000);
	if (map.getSource(overlaySourceId) && map.isSourceLoaded(overlaySourceId)) {
		armPaint();
	} else {
		map.on("sourcedata", onSourceData);
	}
}

/** Tear down the waiting box + its animation marker. Safe to call when nothing
 *  is shown, or after the map/style was torn down during navigation. */
export function hideWaitingBox(map: MapboxMap): void {
	pendingShowCorners = null;
	if (animTimer) {
		clearInterval(animTimer);
		animTimer = null;
	}
	animCanvas = null;
	animFrames = [];
	if (!styleReady(map)) return;
	if (map.getLayer(ANIM_LAYER_ID)) map.removeLayer(ANIM_LAYER_ID);
	if (map.getSource(ANIM_SOURCE_ID)) map.removeSource(ANIM_SOURCE_ID);
	if (map.getLayer(BOX_LINE_LAYER_ID)) map.removeLayer(BOX_LINE_LAYER_ID);
	if (map.getLayer(BOX_FILL_LAYER_ID)) map.removeLayer(BOX_FILL_LAYER_ID);
	if (map.getSource(BOX_SOURCE_ID)) map.removeSource(BOX_SOURCE_ID);
}
