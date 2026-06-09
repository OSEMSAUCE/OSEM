// Map overlay — two render paths, both deliberately use the SAME source/layer
// ids so opacity / removal / z-order plumbing doesn't need to know which path
// is active.
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

import type { ImageSource, Map } from "mapbox-gl";
import type { Coord } from "./coord";
import {
	getMapUrl,
	getVectorTileUrlTemplate,
	readVectorTileSidecar,
	type OverlayHandle,
} from "./mobMapStorage";

const IMAGE_SOURCE_ID = "map-overlay-image";
const RASTER_LAYER_ID = "map-overlay-raster";

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
}

// One overlay at a time per map. The handle is held so `removeMapOverlay`
// can revoke the blob URL on web (no-op on native).
let activeHandle: OverlayHandle | null = null;

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
function pickBeforeId(map: Map): string | undefined {
	const drawCandidates = ["draw-edges-halo", "completed-fill"];
	for (const id of drawCandidates) {
		if (map.getLayer(id)) return id;
	}
	const layers = map.getStyle()?.layers ?? [];
	const firstSymbol = layers.find((l) => l.type === "symbol");
	return firstSymbol?.id;
}

export async function addMapOverlay(
	map: Map,
	spec: OverlaySpec,
): Promise<void> {
	removeMapOverlay(map);

	const handle = await getMapUrl(spec.key);
	activeHandle = handle;

	map.addSource(IMAGE_SOURCE_ID, {
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
			id: RASTER_LAYER_ID,
			type: "raster",
			source: IMAGE_SOURCE_ID,
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

export function removeMapOverlay(map: Map): void {
	// On slow / low-end devices this can fire before the style has loaded or
	// after the map was torn down during navigation. In both cases the map's
	// internal style is undefined and every getLayer/getSource call throws
	// "Cannot read property 'getOwnLayer' of undefined". Bail, but still drop
	// our object-URL handle so we don't leak it.
	if (!map || !(map as unknown as { style?: unknown }).style) {
		if (activeHandle) {
			activeHandle.revoke();
			activeHandle = null;
		}
		return;
	}
	if (map.getLayer(RASTER_LAYER_ID)) {
		map.removeLayer(RASTER_LAYER_ID);
	}
	if (map.getSource(IMAGE_SOURCE_ID)) {
		map.removeSource(IMAGE_SOURCE_ID);
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
	if (activeHandle) {
		activeHandle.revoke();
		activeHandle = null;
	}
}

export function setMapOverlayOpacity(map: Map, opacity: number): void {
	if (map.getLayer(RASTER_LAYER_ID)) {
		map.setPaintProperty(RASTER_LAYER_ID, "raster-opacity", opacity);
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
	map: Map,
	spec: OverlaySpec,
): Promise<boolean> {
	const source = map.getSource(IMAGE_SOURCE_ID);
	if (!source || (source as { type?: string }).type !== "image") return false;
	const handle = await getMapUrl(spec.key);
	const prev = activeHandle;
	(source as ImageSource).updateImage({
		url: handle.url,
		coordinates: spec.corners as unknown as [
			[number, number],
			[number, number],
			[number, number],
			[number, number],
		],
	});
	activeHandle = handle;
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
	map: Map,
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
				"fill-color": [
					"coalesce",
					["get", "fill"],
					"#c4744a",
				],
				"fill-opacity": [
					"coalesce",
					["to-number", ["get", "fill-opacity"]],
					0.35,
				],
				"fill-outline-color": [
					"coalesce",
					["get", "stroke"],
					"#7b3f1f",
				],
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
				"line-color": [
					"coalesce",
					["get", "stroke"],
					"#7b3f1f",
				],
				"line-width": [
					"coalesce",
					["to-number", ["get", "stroke-width"]],
					2,
				],
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
				"circle-color": [
					"coalesce",
					["get", "marker-color"],
					"#c4744a",
				],
				"circle-radius": 5,
				"circle-stroke-color": "#ffffff",
				"circle-stroke-width": 1.5,
			},
		},
		beforeId,
	);

	return true;
}
