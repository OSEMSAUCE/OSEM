// Map overlay — renders a server-converted WebP as a georeferenced image on
// the Mapbox map. The WebP came from the GDAL container (see
// `services/gdal-pdf/server.py`) with `-t_srs EPSG:4326 -dstalpha`, so it is
// axis-aligned WGS84 with transparent wedges where the source PDF was rotated.
//
// We use Mapbox `ImageSource` (4 corner coordinates) rather than a raster
// source: raster sources need an XYZ tile template, not a single image URL.
// See gdalMapPlan.md "Locked decisions".

import type { Map } from "mapbox-gl";
import type { Coord } from "./coord";
import { getMapUrl, type OverlayHandle } from "./mobMapStorage";

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

// Insert below the first draw layer present (see mapDraw.ts:
// setupDrawSourcesAndLayers). Falls back to the completed-fill layer, then
// to no beforeId (top of stack) if neither exists yet.
function pickBeforeId(map: Map): string | undefined {
	const candidates = ["draw-edges-halo", "completed-fill"];
	for (const id of candidates) {
		if (map.getLayer(id)) return id;
	}
	return undefined;
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
			// 0.7 default — high enough that the overlay stays the dominant
			// surface but low enough that satellite features (water, roads,
			// treeline) read through. Tunable per-overlay via setMapOverlayOpacity().
			paint: { "raster-opacity": 0.7 },
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
