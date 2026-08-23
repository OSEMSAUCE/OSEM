// Map overlay — two render paths. Both share one id NAMING SCHEME so opacity /
// removal / z-order plumbing doesn't need to know which path is active; each
// mounted overlay gets its own suffixed ids (see `slot`) so a map can show
// MANY overlays at once. Omitting the slot yields the original bare ids.
//
//   PDF (single-WebP):    ImageSource + 4 corners. The production path for
//     PDF imports — one WebP per overlay, mounted with axis-aligned corners
//     derived from the [w,s,e,n] bounds the server returns. See
//     MAP_IMPORTS_UNIFIED.md §3.1.
//
//   KML/KMZ (vector tile pyramid — Phase 5): VectorSource pointing at a local
//     file:// .pbf tile tree in mobMapStorage/{mapKey}/vtiles/{z}/{x}/{y}.pbf.
//     Lets multi-thousand-feature KMLs render without flooding the synced
//     TinyBase DB ([[big-map-storage-split]]).
//
// (A raster tile-pyramid PDF path lived here briefly — Phase 4, 2026-05-24 —
// and was reverted the same day. The single-WebP path is what shipped before
// and what ships now.)

import type { ImageSource, Map as MapboxMap } from "mapbox-gl";
import type { Coord } from "./coord";
import { glyphStack } from "$osem/components/map/mapShared/glyphStack";
import {
	getMapUrl,
	getVectorTileUrlTemplate,
	type OverlayHandle,
	readVectorTileSidecar,
} from "./mobMapStorage";

const IMAGE_SOURCE_ID = "map-overlay-image";
const RASTER_LAYER_ID = "map-overlay-raster";
const LABELS_SOURCE_ID = "map-overlay-labels";
const LABELS_LAYER_ID = "map-overlay-labels-text";

// Vector tile pyramid (Phase 5) — distinct source + layer ids from the
// raster path. Vector tiles can carry MIXED geometry types (fills, lines,
// circles) so we always lay down three layers; unused layer types render
// nothing because the source-layer + filter pull only matching features.
// All three layers are stacked at the same z-position via pickBeforeId.
const VECTOR_SOURCE_ID = "map-overlay-vector";
const VECTOR_FILL_LAYER_ID = "map-overlay-vector-fill";
const VECTOR_LINE_LAYER_ID = "map-overlay-vector-line";
const VECTOR_CIRCLE_LAYER_ID = "map-overlay-vector-circle";
// tippecanoe's default source-layer name when emitting a directory of .pbf
// tiles. The bake pipeline MUST keep this in sync; if it changes, the
// renderer mounts the layers against the wrong name and nothing draws.
// Document loudly so a future bake-pipeline tweak (Phase 5 server work)
// doesn't silently break the client.
const VECTOR_SOURCE_LAYER = "features";

export interface OverlaySpec {
	/** Storage key returned by `saveMap(webpFile)`. */
	key: string;
	/** Image corners in Mapbox order: [topLeft, topRight, bottomRight, bottomLeft]. */
	corners: readonly [Coord, Coord, Coord, Coord];
	/** Distinguishes THIS overlay's source/layer ids from every other overlay
	 *  mounted on the same map. Omit for the solo overlay (the ids stay the
	 *  bare constants, so existing callers and any style/plumbing that
	 *  hardcodes `map-overlay-raster` keep working unchanged). */
	slot?: string;
}

/** A map may carry MANY overlays at once — two PDF sheets covering adjacent
 *  ground both belong to the map you're standing on. Every source/layer id is
 *  therefore suffixed per overlay; without that they'd collide on one Mapbox
 *  source and only the last-added would draw. An omitted slot yields the bare
 *  constant, preserving the original single-overlay ids. */
function slotSuffix(slot?: string): string {
	return slot ? `-${slot}` : "";
}
const imageSourceId = (slot?: string) =>
	`${IMAGE_SOURCE_ID}${slotSuffix(slot)}`;
const rasterLayerId = (slot?: string) =>
	`${RASTER_LAYER_ID}${slotSuffix(slot)}`;
const labelsSourceId = (slot?: string) =>
	`${LABELS_SOURCE_ID}${slotSuffix(slot)}`;
const labelsLayerId = (slot?: string) =>
	`${LABELS_LAYER_ID}${slotSuffix(slot)}`;

// One blob handle PER MOUNTED OVERLAY, keyed by slot — held so removal can
// revoke the object URL on web (no-op on native). A single module-level
// handle would leak every overlay but the last.
const activeHandles = new Map<string, OverlayHandle>();

// Where to insert the overlay so it sits below the right things on EVERY
// basemap style.
//
// Priority order:
//  1. Below the draw layers if they exist (so user draws on top of the
//     overlay, not under it).
//  2. Otherwise below the first symbol layer (labels are symbol layers in
//     Mapbox styles — putting the overlay below them keeps street/place
//     names readable on top of the imagery). This is what fixes Street
//     View: on that style our `draw-edges-halo` doesn't exist yet, so
//     before the fallback we ended up at the TOP of the stack —
//     ABOVE the satellite/street basemap labels, so the overlay
//     covered them. Now we land below labels regardless of style.
//  3. Last resort: top of stack (undefined). Shouldn't happen with
//     standard Mapbox styles.
function pickBeforeId(map: MapboxMap): string | undefined {
	const drawCandidates = ["draw-edges-halo", "completed-fill"];
	for (const id of drawCandidates) {
		if (map.getLayer(id)) return id;
	}
	const layers = map.getStyle()?.layers ?? [];
	const firstSymbol = layers.find((l) => l.type === "symbol");
	return firstSymbol?.id;
}

export async function addMapOverlay(
	map: MapboxMap,
	spec: OverlaySpec,
): Promise<void> {
	// Tear down only THIS slot — mounting a second overlay must not unmount
	// the first. (Before per-slot ids this was an unconditional
	// removeMapOverlay(map), which is why a map could only ever show one PDF.)
	removeMapOverlay(map, spec.slot);

	const handle = await getMapUrl(spec.key);
	activeHandles.set(spec.slot ?? "", handle);

	map.addSource(imageSourceId(spec.slot), {
		type: "image",
		url: handle.url,
		coordinates: spec.corners as unknown as [
			[number, number],
			[number, number],
			[number, number],
			[number, number],
		],
	});

	map.addLayer(
		{
			id: rasterLayerId(spec.slot),
			type: "raster",
			source: imageSourceId(spec.slot),
			// 0.5 default — a freshly added overlay sits half-transparent
			// so the basemap underneath stays readable. Kept in sync with
			// the overlayOpacity store's default; tunable live via
			// setMapOverlayOpacity() / the opacity slider.
			paint: { "raster-opacity": 0.5 },
		},
		pickBeforeId(map),
	);

	// Render and framing are separate concerns. This function deliberately
	// does NOT move the camera — the importer / route is responsible for
	// framing a freshly imported overlay.
}

/** One crisp label to draw over the raster. Mirrors the proprietary
 *  OverlayLabel shape (mapStore/pdfTextLabels) structurally — OSEM stays
 *  UI-only, so it declares its own type instead of importing it. */
export interface OverlayLabelSpec {
	/** Text, e.g. "2427". */
	t: string;
	/** Centre [lng, lat]. */
	p: [number, number];
	/** Text height in ground metres — drives zoom-proportional sizing. */
	m: number;
	/** Rotation, degrees clockwise, map-aligned. */
	r: number;
}

/**
 * Mount the overlay's crisp text labels as a symbol layer ABOVE the raster.
 *
 * The label text was extracted from the PDF's own text objects, so instead of
 * zooming into pixel soup the user reads real font at every zoom. Sizing is
 * GROUND-anchored: each label carries its height in metres, converted to a
 * screen size that doubles per zoom level (exponential base 2) — the text
 * scales exactly like the raster underneath, welded to the map, never a
 * floating HUD. The paper-coloured halo is the "plate" that masks the blurry
 * raster original beneath each label.
 */
export function addMapOverlayLabels(
	map: MapboxMap,
	labels: readonly OverlayLabelSpec[],
	slot?: string,
): void {
	if (!map || !(map as unknown as { style?: unknown }).style) return;
	removeMapOverlayLabels(map, slot);
	if (!labels.length) return;
	// Screen pixels a label's height works out to at zoom 14 — the anchor for
	// the exponential zoom curve below. m/px at z14 = 78271.517·cos(lat)/2^14.
	const px14 = (l: OverlayLabelSpec) =>
		(l.m * 16384) / (78271.517 * Math.cos((l.p[1] * Math.PI) / 180));
	// ONE power law for the whole layer, anchored on the MEDIAN label size.
	// Per-feature sizing (["get","px14"] inside the zoom interpolate) is the
	// obvious spelling and it fails SILENTLY — the layer mounts, features
	// exist, nothing draws (verified live: constant size renders instantly).
	// Map sheets use near-uniform label sizes, so a single per-layer curve
	// loses almost nothing.
	const sizes = labels.map(px14).sort((a, b) => a - b);
	const med = sizes[Math.floor(sizes.length / 2)];
	const fc: GeoJSON.FeatureCollection = {
		type: "FeatureCollection",
		features: labels.map((l) => ({
			type: "Feature",
			properties: { t: l.t, rot: l.r },
			geometry: { type: "Point", coordinates: l.p },
		})),
	};
	map.addSource(labelsSourceId(slot), { type: "geojson", data: fc });
	map.addLayer(
		{
			id: labelsLayerId(slot),
			type: "symbol",
			source: labelsSourceId(slot),
			layout: {
				"text-field": ["get", "t"],
				// ⛔ NEVER a literal stack — the two maps' glyph endpoints are
			// DISJOINT, so any fixed array 404s forever on one of them (once per
			// tile, flooding the console and killing the label). Ask the live
			// style instead; see glyphStack.ts.
			"text-font": glyphStack(map),
				// size = med * 2^(zoom-14): exponential base-2 interpolation
				// between matching endpoints IS that power law — text doubles
				// per zoom step, exactly like the ground (mounted, not HUD).
				"text-size": [
					"interpolate",
					["exponential", 2],
					["zoom"],
					6,
					med * 0.00390625,
					22,
					med * 256,
				],
				"text-rotate": ["get", "rot"],
				"text-rotation-alignment": "map",
				"text-pitch-alignment": "map",
				// Positions are exact (from the PDF) — never let Mapbox's
				// collision pass hide one label because another is near.
				"text-allow-overlap": true,
				"text-ignore-placement": true,
				"text-padding": 0,
			},
			paint: {
				"text-color": "#14181c",
				"text-halo-color": "rgba(247, 245, 239, 0.92)",
				"text-halo-width": 1.6,
			},
		},
		pickBeforeId(map),
	);
}

/** Tear down the crisp-label layer. Safe when nothing is mounted. */
export function removeMapOverlayLabels(map: MapboxMap, slot?: string): void {
	if (!map || !(map as unknown as { style?: unknown }).style) return;
	const slots =
		slot !== undefined ? [slot] : [...new Set([...activeHandles.keys(), ""])];
	for (const s of slots) {
		if (map.getLayer(labelsLayerId(s))) map.removeLayer(labelsLayerId(s));
		if (map.getSource(labelsSourceId(s))) map.removeSource(labelsSourceId(s));
	}
}

/** Unmount overlays. Pass a `slot` to remove exactly that one; omit it to
 *  remove EVERY mounted overlay (map switch, style reload, teardown). The
 *  all-slots default preserves the original call-sites' meaning — they used
 *  to mean "remove the overlay" when only one could exist. */
export function removeMapOverlay(map: MapboxMap, slot?: string): void {
	// Which slots this call is responsible for. An explicit slot narrows to
	// one; otherwise every slot we currently hold a handle for, plus "" so a
	// solo overlay mounted before any handle was recorded still gets swept.
	const slots =
		slot !== undefined ? [slot] : [...new Set([...activeHandles.keys(), ""])];
	// On slow / low-end devices this can fire before the style has loaded or
	// after the map was torn down during navigation. In both cases the map's
	// internal style is undefined and every getLayer/getSource call throws
	// "Cannot read property 'getOwnLayer' of undefined". Bail, but still drop
	// our object-URL handles so we don't leak them.
	if (!map || !(map as unknown as { style?: unknown }).style) {
		for (const s of slots) {
			const h = activeHandles.get(s);
			if (h) {
				h.revoke();
				activeHandles.delete(s);
			}
		}
		return;
	}
	for (const s of slots) {
		removeMapOverlayLabels(map, s);
		if (map.getLayer(rasterLayerId(s))) {
			map.removeLayer(rasterLayerId(s));
		}
		if (map.getSource(imageSourceId(s))) {
			map.removeSource(imageSourceId(s));
		}
	}
	// Vector pyramid teardown: three layers, one source. Order matters —
	// Mapbox refuses to remove a source while any layer still references it.
	for (const id of [
		VECTOR_FILL_LAYER_ID,
		VECTOR_LINE_LAYER_ID,
		VECTOR_CIRCLE_LAYER_ID,
	]) {
		if (map.getLayer(id)) map.removeLayer(id);
	}
	if (map.getSource(VECTOR_SOURCE_ID)) {
		map.removeSource(VECTOR_SOURCE_ID);
	}
	for (const s of slots) {
		const h = activeHandles.get(s);
		if (h) {
			h.revoke();
			activeHandles.delete(s);
		}
	}
}

/** Set raster opacity. With a `slot`, only that overlay changes; without one
 *  the value is applied to EVERY mounted overlay (the global slider). */
export function setMapOverlayOpacity(
	map: MapboxMap,
	opacity: number,
	slot?: string,
): void {
	if (!map || !(map as unknown as { style?: unknown }).style) return;
	const slots =
		slot !== undefined ? [slot] : [...new Set([...activeHandles.keys(), ""])];
	for (const s of slots) {
		if (map.getLayer(rasterLayerId(s))) {
			map.setPaintProperty(rasterLayerId(s), "raster-opacity", opacity);
		}
	}
}

/**
 * Show / hide the mounted overlay WITHOUT unmounting it — flips layout
 * `visibility` on whichever overlay layers exist (raster WebP or the vector
 * pyramid's three). Cheap and reversible, so a toggle never pays the
 * re-decode/re-mount cost of removeMapOverlay + addMapOverlay.
 */
export function setMapOverlayVisibility(
	map: MapboxMap,
	visible: boolean,
	slot?: string,
): void {
	if (!map || !(map as unknown as { style?: unknown }).style) return;
	const value = visible ? "visible" : "none";
	const slots =
		slot !== undefined ? [slot] : [...new Set([...activeHandles.keys(), ""])];
	const ids = slots.flatMap((s) => [rasterLayerId(s), labelsLayerId(s)]);
	// The vector pyramid is per-map (one bake), not per-slot — toggled once.
	if (slot === undefined) {
		ids.push(
			VECTOR_FILL_LAYER_ID,
			VECTOR_LINE_LAYER_ID,
			VECTOR_CIRCLE_LAYER_ID,
		);
	}
	for (const id of ids) {
		if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", value);
	}
}

/**
 * Swap the image overlay's backing blob (and corners) IN PLACE — gap-free.
 *
 * This is the "render the raw local PDF now, drop in the optimized server WebP
 * when it lands" path. Mapbox `ImageSource.updateImage` keeps the current
 * texture on screen until the new image decodes, so the overlay never blinks
 * out (OFFLINE_PLAN.md law 3 — NO BLINK). Contrast `addMapOverlay`, which
 * removes-then-adds and would flash the basemap through the gap.
 *
 * Returns false if there's no live image source to swap (e.g. the map switched
 * away, or the overlay was a vector-tile pyramid) — caller does a full
 * `addMapOverlay` instead.
 */
export async function swapMapOverlayImage(
	map: MapboxMap,
	spec: OverlaySpec,
): Promise<boolean> {
	const source = map.getSource(imageSourceId(spec.slot));
	if (!source || (source as { type?: string }).type !== "image") return false;
	const handle = await getMapUrl(spec.key);
	const prev = activeHandles.get(spec.slot ?? "");
	(source as ImageSource).updateImage({
		url: handle.url,
		coordinates: spec.corners as unknown as [
			[number, number],
			[number, number],
			[number, number],
			[number, number],
		],
	});
	activeHandles.set(spec.slot ?? "", handle);
	// The old texture is already in the GPU and Mapbox is now fetching the new
	// url, so the old objectURL is safe to revoke — no gap on screen.
	if (prev) prev.revoke();
	return true;
}

// ── Vector-tile-pyramid overlay (Phase 5) ───────────────────────────────────

export interface VectorTileOverlaySpec {
	/** mapKey — used to locate the on-disk vtiles tree. */
	mapKey: string;
}

/** Render a vector-tile-pyramid overlay by mounting a Mapbox `VectorSource`
 * pointed at the on-disk `.pbf` tree. Three layers are added — fill, line,
 * circle — because a vector tile bake from a foreign KML can mix polygons,
 * lines and points in the same source-layer. Unused layer types render
 * nothing (the source-layer simply has no matching features).
 *
 * Replaces any existing overlay (raster image, raster tiles, or a previous
 * vector pyramid) on this map. Returns `true` on success, `false` if no
 * vector tile package is on disk for this map — caller surfaces
 * `ImportErrors.TILES_NOT_ON_DEVICE` (per MAP_IMPORTS_UNIFIED.md §11).
 *
 * Paint expressions are default-only for v1 — reading per-feature
 * `featureSource:"kmz"`) is a later step. Today the paint reads
 * simplestyle-spec properties directly off the vector-tile features when
 * present (`["get", "fill"]` etc.), so a tippecanoe bake that preserves
 * those properties via `-y fill -y stroke ...` (see §3.2 of
 * MAP_IMPORTS_UNIFIED.md) will already render with KML colours. */
export async function addMapVectorTileOverlay(
	map: MapboxMap,
	spec: VectorTileOverlaySpec,
): Promise<boolean> {
	const sidecar = await readVectorTileSidecar(spec.mapKey);
	if (!sidecar) return false;

	removeMapOverlay(map);

	const template = await getVectorTileUrlTemplate(spec.mapKey);

	map.addSource(VECTOR_SOURCE_ID, {
		type: "vector",
		tiles: [template],
		minzoom: sidecar.minzoom,
		maxzoom: sidecar.maxzoom,
		bounds: [
			sidecar.bounds.w,
			sidecar.bounds.s,
			sidecar.bounds.e,
			sidecar.bounds.n,
		],
	});

	const beforeId = pickBeforeId(map);

	// Polygons. `fill-color`/`fill-opacity` read simplestyle-spec props
	// when present (KML preserved via tippecanoe -y), fall back to a
	// neutral terracotta-hint tint so unstyled polygons are still visible.
	map.addLayer(
		{
			id: VECTOR_FILL_LAYER_ID,
			type: "fill",
			source: VECTOR_SOURCE_ID,
			"source-layer": VECTOR_SOURCE_LAYER,
			filter: ["==", ["geometry-type"], "Polygon"],
			paint: {
				"fill-color": ["coalesce", ["get", "fill"], "#c4744a"],
				"fill-opacity": [
					"coalesce",
					["to-number", ["get", "fill-opacity"]],
					0.35,
				],
				"fill-outline-color": ["coalesce", ["get", "stroke"], "#7b3f1f"],
			},
		},
		beforeId,
	);

	// Lines (LineString) AND polygon outlines (Mapbox renders polygon
	// outlines via fill-outline-color above, but explicit line layer is
	// still needed for true LineString features).
	map.addLayer(
		{
			id: VECTOR_LINE_LAYER_ID,
			type: "line",
			source: VECTOR_SOURCE_ID,
			"source-layer": VECTOR_SOURCE_LAYER,
			filter: ["==", ["geometry-type"], "LineString"],
			paint: {
				"line-color": ["coalesce", ["get", "stroke"], "#7b3f1f"],
				"line-width": ["coalesce", ["to-number", ["get", "stroke-width"]], 2],
				"line-opacity": [
					"coalesce",
					["to-number", ["get", "stroke-opacity"]],
					0.9,
				],
			},
		},
		beforeId,
	);

	// Points. Rendered as circles for v1 — custom KMZ icon support
	// (`addImage` + a symbol layer reading `icon-image`) is Phase 5
	// styling work; native pin DOM-markers are a separate, parallel
	// rendering path (see MapDrawControls.svelte pinMarkers).
	map.addLayer(
		{
			id: VECTOR_CIRCLE_LAYER_ID,
			type: "circle",
			source: VECTOR_SOURCE_ID,
			"source-layer": VECTOR_SOURCE_LAYER,
			filter: ["==", ["geometry-type"], "Point"],
			paint: {
				"circle-color": ["coalesce", ["get", "marker-color"], "#c4744a"],
				"circle-radius": 5,
				"circle-stroke-color": "#ffffff",
				"circle-stroke-width": 1.5,
			},
		},
		beforeId,
	);

	return true;
}
