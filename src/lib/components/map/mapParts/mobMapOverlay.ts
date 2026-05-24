// Map overlay — two render paths, both deliberately use the SAME layer id
// so opacity / removal / z-order plumbing doesn't need to know which path
// is active.
//
//   Legacy (single-WebP):  ImageSource + 4 corners. Used today; transitional
//     until Phase 4 ships. See MAP_IMPORTS_UNIFIED.md §3.1.
//
//   Tile pyramid (Phase 4): RasterTileSource pointing at a local file:// tile
//     tree in mobMapStorage/{mapKey}/tiles/{z}/{x}/{y}.webp. Memory is bounded
//     — Mapbox evicts off-screen tiles automatically, which is the whole win
//     for the "10 PDFs in inbox" scaling case.
//
// Why ImageSource at all? Mapbox's raster source needs an XYZ tile template,
// not a single image URL. For a single un-tiled image, ImageSource with 4
// corners is the only option. Once the tile pyramid is the default for all
// new imports, we delete the ImageSource branch in Phase 6.

import type { Map } from "mapbox-gl";
import type { Coord } from "./coord";
import {
	getMapUrl,
	getTileUrlTemplate,
	readTileSidecar,
	type OverlayHandle,
} from "./mobMapStorage";

const IMAGE_SOURCE_ID = "map-overlay-image";
const RASTER_LAYER_ID = "map-overlay-raster";

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
			// 0.9 default — overlay reads as the dominant surface (user
			// feedback 2026-05-23 was that 0.7 looked too washed out).
			// Tunable per-overlay via setMapOverlayOpacity().
			paint: { "raster-opacity": 0.9 },
		},
		pickBeforeId(map),
	);

	// Render and framing are separate concerns. This function deliberately
	// does NOT move the camera — the importer / route is responsible for
	// framing a freshly imported overlay.
}

export function removeMapOverlay(map: Map): void {
	if (map.getLayer(RASTER_LAYER_ID)) {
		map.removeLayer(RASTER_LAYER_ID);
	}
	if (map.getSource(IMAGE_SOURCE_ID)) {
		map.removeSource(IMAGE_SOURCE_ID);
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

// ── Tile-pyramid overlay (Phase 4) ──────────────────────────────────────────

export interface TileOverlaySpec {
	/** mapKey — used to locate the tile tree on disk. */
	mapKey: string;
}

/** Render a tile-pyramid overlay using RasterTileSource pointed at the
 * on-disk tile tree. Replaces any existing overlay (image or tile) on
 * this map. Returns `true` on success, `false` if no tile package is on
 * disk for this map — the caller should then surface
 * `ImportErrors.TILES_NOT_ON_DEVICE` (per MAP_IMPORTS_UNIFIED.md §11) or
 * route to the legacy ImageSource path during the transition. */
export async function addMapTileOverlay(
	map: Map,
	spec: TileOverlaySpec,
): Promise<boolean> {
	const sidecar = await readTileSidecar(spec.mapKey);
	if (!sidecar) return false;

	removeMapOverlay(map);

	const template = await getTileUrlTemplate(spec.mapKey);

	map.addSource(IMAGE_SOURCE_ID, {
		type: "raster",
		tiles: [template],
		tileSize: 256,
		minzoom: sidecar.minzoom,
		maxzoom: sidecar.maxzoom,
		bounds: [
			sidecar.bounds.w,
			sidecar.bounds.s,
			sidecar.bounds.e,
			sidecar.bounds.n,
		],
	});

	map.addLayer(
		{
			id: RASTER_LAYER_ID,
			type: "raster",
			source: IMAGE_SOURCE_ID,
			paint: { "raster-opacity": 0.9 },
		},
		pickBeforeId(map),
	);

	return true;
}
