/**
 * Water overlay — sparse-raster tile pyramid drawn on top of the
 * basemap. Same purpose as the reverted vector hydrology layer:
 * make rivers/lakes pop visually so they stand out the way roads
 * already do on satellite imagery.
 *
 * Why raster (not vector) for this version: at the detail level
 * forestry users need (every drainage ditch, every named creek), the
 * vertex count for whole-region OSM vector data was infeasible to
 * bundle. Sparse PNG tiles compress runs of transparent pixels to a
 * few hundred bytes each, so a regional pyramid (z6–12) is ~10–60 MB
 * total — comparable to the existing offline raster basemap.
 *
 * Why "function like vector": tiles only render at their natural zoom
 * level, so they look crisp and don't pixelate the way satellite does
 * past z7. And because the overlay is single-color (cyan-blue) on
 * transparent, there's no detail to lose at zoom-level boundaries.
 *
 * Tile pipeline: scripts/fetch-water-tiles.sh + rasterize-water.py.
 * Output: static/offlineWaterTiles/{z}/{x}/{y}.png. Empty tiles are
 * NOT written — Mapbox's tile loader handles 404s gracefully by
 * skipping them (cheaper than serving a transparent placeholder).
 *
 * Zoom range matches the rasterizer output. Outside that range the
 * layer is invisible (Mapbox doesn't request out-of-range tiles).
 *
 * Idempotent: safe to call after every `style.load`.
 */
import type mapboxgl from "mapbox-gl";

const SOURCE_ID = "water-overlay";
const LAYER_ID = "water-overlay-raster";
const TILE_URL = "/offlineWaterTiles/{z}/{x}/{y}.png";

// Match the rasterizer config in rasterize-water.py. If you change
// the pyramid depth in the script, change these together.
const MIN_ZOOM = 6;
const MAX_ZOOM = 12;

export function addWaterOverlay(map: mapboxgl.Map): void {
    if (map.getSource(SOURCE_ID)) return;

    try {
        map.addSource(SOURCE_ID, {
            type: "raster",
            tiles: [TILE_URL],
            tileSize: 256,
            minzoom: MIN_ZOOM,
            maxzoom: MAX_ZOOM,
            attribution:
                'Water &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        });

        map.addLayer({
            id: LAYER_ID,
            type: "raster",
            source: SOURCE_ID,
            // No paint adjustments — the rasterizer already produced
            // the exact color and stroke we want. Letting Mapbox blend
            // PNG alpha onto whatever's below preserves the cyan-blue
            // perfectly without washing out.
            paint: {
                "raster-opacity": 1,
                "raster-fade-duration": 200,
            },
        });
        console.log("[Water overlay] mounted");
    } catch (err) {
        // Most likely cause: tiles not yet generated. Run
        // scripts/fetch-water-tiles.sh. Layer is non-essential — log
        // and continue.
        console.warn("[Water overlay] failed (run fetch-water-tiles.sh?):", err);
    }
}

export function removeWaterOverlay(map: mapboxgl.Map): void {
    if (map.getLayer(LAYER_ID)) {
        try {
            map.removeLayer(LAYER_ID);
        } catch {
            /* ignore */
        }
    }
    if (map.getSource(SOURCE_ID)) {
        try {
            map.removeSource(SOURCE_ID);
        } catch {
            /* ignore */
        }
    }
}
