/**
 * Offline raster basemap — bundled PNG tiles served from `static/offlineTiles/`.
 * Always-on bottom layer. When Mapbox satellite/streets are online they
 * composite on top; in airplane mode this is what the user sees so the
 * screen is never black.
 *
 * Source:    CartoDB Dark Matter (free, attribution required)
 * Coverage:  world land only — oceans skipped, Antarctica clipped
 * Zoom:      z0–z7 (regional rivers, smaller roads visible)
 * Size:      ~25–40 MB
 * Generated: `scripts/fetch-basemap.sh`
 *
 * Why raster, not PMTiles vector: mapbox-gl 3.23.1's PMTiles support is
 * not actually wired through end-to-end (the `provider` field is stripped,
 * URL auto-detect doesn't reach the dynamic plugin loader). Raster sources
 * have been first-class Mapbox citizens forever — they Just Work.
 */
import type mapboxgl from "mapbox-gl";

const SOURCE_ID = "offline-basemap";
const LAYER_ID = "offline-basemap";
const TILE_URL = "/offlineTiles/{z}/{x}/{y}.png";

/**
 * Add the offline raster basemap as the bottom layer of the map.
 * Idempotent: safe to call after every `setStyle` / `style.load`.
 * Failures are logged but never thrown.
 */
export function addOfflineBasemap(map: mapboxgl.Map): void {
    if (map.getSource(SOURCE_ID)) return;

    try {
        map.addSource(SOURCE_ID, {
            type: "raster",
            tiles: [TILE_URL],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 7,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        });

        // Insert beneath the lowest existing layer so satellite/streets composite on top.
        const beforeId = map.getStyle()?.layers?.[0]?.id;
        map.addLayer(
            {
                id: LAYER_ID,
                type: "raster",
                source: SOURCE_ID,
                paint: {
                    // Slightly desaturated/dimmed so it reads as "background"
                    // when the online layers haven't loaded yet.
                    "raster-opacity": 1,
                    "raster-fade-duration": 0,
                },
            },
            beforeId,
        );
        console.log("[OfflineBasemap] mounted");
    } catch (err) {
        console.warn("[OfflineBasemap] failed:", err);
    }
}

/** Remove the offline basemap source + layer. */
export function removeOfflineBasemap(map: mapboxgl.Map): void {
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
