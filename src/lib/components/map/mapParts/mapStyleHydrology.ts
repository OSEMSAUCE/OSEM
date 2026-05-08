/**
 * Hydrology enhancement layer — bright blue line art for rivers + lake
 * outlines, drawn ON TOP of whatever basemap is active (satellite,
 * streets, offline raster — doesn't matter).
 *
 * Why: roads pop out on satellite imagery because they're artificial /
 * high-contrast linear features. Rivers don't — they blend into the
 * surrounding vegetation/terrain. Adding a synthetic blue line over the
 * satellite (the way roads naturally are over the satellite) makes
 * rivers visually pop the same way roads do. Enhancement, not a
 * basemap replacement.
 *
 * Source data: Natural Earth 10m (download via
 * `scripts/fetch-hydrology.sh`). Whole-planet vector ~3 MB. Crisp at
 * any zoom because it's geometry, not pixels.
 *
 * NOT included on purpose:
 *   - ocean fill (skipped — eats bytes, satellite already shows it)
 *   - lake fills (lakes render as blue OUTLINE only, matching the
 *     "lines, not images" framing)
 *   - country borders, roads, labels (out of scope)
 *
 * Idempotent: safe to call after every `style.load`.
 */
import type mapboxgl from "mapbox-gl";

const RIVER_SOURCE = "hydrology-rivers";
const RIVER_LAYER = "hydrology-rivers-line";
const LAKE_SOURCE = "hydrology-lakes";
const LAKE_LAYER = "hydrology-lakes-line";

const RIVER_URL = "/offlineVector/ne_10m_rivers_lake_centerlines.geojson";
const LAKE_URL = "/offlineVector/ne_10m_lakes.geojson";

// Bright cyan-blue — pops against forest greens, agricultural browns,
// and snow whites alike. Slightly more cyan than pure blue so it
// reads as "water" without competing with the gold/terracotta accent
// palette used elsewhere.
const HYDRO_COLOR = "#3da9d9";

export function addHydrologyOverlay(map: mapboxgl.Map): void {
    try {
        if (!map.getSource(RIVER_SOURCE)) {
            map.addSource(RIVER_SOURCE, {
                type: "geojson",
                data: RIVER_URL,
                attribution:
                    'Hydrology &copy; <a href="https://www.naturalearthdata.com/">Natural Earth</a>',
            });
        }
        if (!map.getLayer(RIVER_LAYER)) {
            map.addLayer({
                id: RIVER_LAYER,
                type: "line",
                source: RIVER_SOURCE,
                paint: {
                    "line-color": HYDRO_COLOR,
                    // Subtle taper from low to high zoom so it's
                    // a hairline at world view but visible up close.
                    "line-width": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        2, 0.4,
                        6, 1.0,
                        10, 1.6,
                        14, 2.2,
                    ],
                    "line-opacity": 0.85,
                },
            });
        }

        if (!map.getSource(LAKE_SOURCE)) {
            map.addSource(LAKE_SOURCE, {
                type: "geojson",
                data: LAKE_URL,
            });
        }
        if (!map.getLayer(LAKE_LAYER)) {
            map.addLayer({
                id: LAKE_LAYER,
                type: "line", // OUTLINE only — no fill (matches the "lines, not images" design)
                source: LAKE_SOURCE,
                paint: {
                    "line-color": HYDRO_COLOR,
                    "line-width": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        2, 0.6,
                        6, 1.4,
                        10, 2.0,
                        14, 2.6,
                    ],
                    "line-opacity": 0.9,
                },
            });
        }
        console.log("[Hydrology] mounted");
    } catch (err) {
        // Most likely cause: tiles not yet generated. Run
        // scripts/fetch-hydrology.sh. Layer is non-essential — log and
        // continue.
        console.warn("[Hydrology] failed:", err);
    }
}

export function removeHydrologyOverlay(map: mapboxgl.Map): void {
    for (const id of [RIVER_LAYER, LAKE_LAYER]) {
        if (map.getLayer(id)) {
            try {
                map.removeLayer(id);
            } catch {
                /* ignore */
            }
        }
    }
    for (const id of [RIVER_SOURCE, LAKE_SOURCE]) {
        if (map.getSource(id)) {
            try {
                map.removeSource(id);
            } catch {
                /* ignore */
            }
        }
    }
}
