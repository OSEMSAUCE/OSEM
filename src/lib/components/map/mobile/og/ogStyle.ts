/**
 * Builds the air-gapped Mapbox style for the Offline Gopher map.
 *
 * Hand-crafted style object. NEVER a `mapbox://styles/...` URL — that
 * would trigger a network fetch the moment the Map is constructed.
 *
 * Sources baked in:
 *   - og-world-floor: CartoDB Dark Matter raster, z0-7, served from
 *     /offlineTiles/{z}/{x}/{y}.png (bundled with the app, ~38 MB).
 *
 * Glyphs/sprite: omitted in v1. Adding road labels is a follow-up
 * (would require self-hosted glyph PBFs and a sprite sheet).
 */

import type mapboxgl from "mapbox-gl";

export const OG_WORLD_SOURCE = "og-world-floor";
export const OG_WORLD_LAYER = "og-world-floor-layer";

export function buildOgStyle(): mapboxgl.StyleSpecification {
    return {
        version: 8,
        sources: {
            [OG_WORLD_SOURCE]: {
                type: "raster",
                tiles: ["/offlineTiles/{z}/{x}/{y}.png"],
                tileSize: 256,
                minzoom: 0,
                maxzoom: 7,
                attribution: "© OpenStreetMap contributors © CARTO",
            },
        },
        layers: [
            {
                id: "og-bg",
                type: "background",
                paint: { "background-color": "#000000" },
            },
            {
                id: OG_WORLD_LAYER,
                type: "raster",
                source: OG_WORLD_SOURCE,
                paint: { "raster-fade-duration": 0 },
            },
        ],
    };
}
