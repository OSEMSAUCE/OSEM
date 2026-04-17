/**
 * Natural Dark style — runtime overrides on top of Mapbox dark-v11.
 *
 * Turns the grey "Death Star" globe into a natural-looking Earth:
 *   - Dark ocean blue water, visible waterways
 *   - Muted green land with landcover variation
 *   - Faint contour lines + hillshade for terrain texture
 *   - Lazy satellite imagery at site zoom (≥14, loaded on idle)
 *   - No labels, roads, POIs, buildings, transit, or admin borders
 *
 * Performance: all changes are vector/paint-property at globe zoom.
 * The only raster sources (DEM hillshade, satellite) are gated behind
 * minzoom thresholds, so they never fetch tiles at globe scale.
 */
import type mapboxgl from "mapbox-gl";

// ── Palette ────────────────────────────────────────────────────────────
const P = {
    land: "#1e3a1e", // dark green — clearly Earth, not Death Star
    ocean: "#0d2140", // deep navy
    waterway: "rgba(13, 40, 80, 0.7)", // lighter blue for rivers
    lc: {
        wood: "rgba(22, 62, 28, 0.55)",
        grass: "rgba(32, 54, 22, 0.45)",
        crop: "rgba(40, 50, 20, 0.38)",
        scrub: "rgba(28, 46, 24, 0.38)",
        snow: "rgba(42, 52, 68, 0.32)",
    },
    contour: "rgba(255, 255, 255, 0.06)",
    hs: {
        shadow: "rgba(0, 0, 0, 0.15)",
        highlight: "rgba(255, 255, 255, 0.05)",
    },
} as const;

// Satellite fades in at site zoom — only loaded on idle.
const SAT_MIN_ZOOM = 12;
const SAT_FULL_ZOOM = 15;
const SAT_OPACITY = 0.85;

// Fog preset tuned to complement the natural palette
export const NATURAL_FOG: mapboxgl.FogSpecification = {
    color: "rgba(12, 30, 22, 0.28)",
    "high-color": "rgba(8, 20, 55, 0.22)",
    "horizon-blend": 0.02,
    "space-color": "rgb(8, 10, 20)",
    "star-intensity": 0.5,
};

// ── Layer hide rules ───────────────────────────────────────────────────
const HIDE_PREFIXES = [
    "road",
    "bridge",
    "tunnel",
    "transit",
    "aeroway",
    "building",
    "poi",
    "place-",
    "settlement",
    "natural-point",
    "natural-line",
    "waterway-label",
    "water-point",
    "water-line",
    "admin", // hide borders entirely — replaced by contours + waterways
];

function shouldHide(id: string, type: string): boolean {
    if (type === "symbol") return true;
    return HIDE_PREFIXES.some((p) => id.startsWith(p));
}

// ── Safe setters ───────────────────────────────────────────────────────
function setPaint(
    map: mapboxgl.Map,
    id: string,
    prop: string,
    value: unknown,
): void {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.setPaintProperty(id, prop as any, value);
    } catch {
        /* layer absent */
    }
}

function hide(map: mapboxgl.Map, id: string): void {
    try {
        map.setLayoutProperty(id, "visibility", "none");
    } catch {
        /* layer absent */
    }
}

// ── Main entry point ───────────────────────────────────────────────────
export function applyNaturalOverrides(map: mapboxgl.Map): void {
    const layers = map.getStyle()?.layers;
    if (!layers) return;

    // 1. Recolor base surfaces
    setPaint(map, "background", "background-color", P.land);
    for (const l of layers) {
        if (/^water/.test(l.id) && l.type === "fill") {
            setPaint(map, l.id, "fill-color", P.ocean);
        }
    }

    // 2. Show waterways as lighter blue geographic detail
    for (const l of layers) {
        if (/^waterway/.test(l.id) && l.type === "line") {
            setPaint(map, l.id, "line-color", P.waterway);
            setPaint(map, l.id, "line-opacity", 0.8);
        }
    }

    // 3. Hide clutter (roads, labels, POIs, transit, buildings, borders)
    for (const l of layers) {
        if (shouldHide(l.id, l.type)) hide(map, l.id);
    }

    // 4. Tint existing landuse layers (parks, etc.)
    for (const l of layers) {
        if (/^landuse/.test(l.id) && l.type === "fill") {
            setPaint(map, l.id, "fill-color", "rgba(26, 48, 24, 0.25)");
        }
    }

    // 5. Landcover fills — lightweight vector, added immediately
    addLandcover(map);

    // 6. Heavy layers lazy-loaded on idle — no raster work during gestures
    setupLazyTerrain(map); // hillshade + contours at zoom ≥ 9
    setupLazySatellite(map); // satellite imagery at zoom ≥ 12
}

// ── Landcover (vector, very lightweight) ───────────────────────────────
function addLandcover(map: mapboxgl.Map): void {
    const src = "natural-terrain";
    if (!map.getSource(src)) {
        map.addSource(src, {
            type: "vector",
            url: "mapbox://mapbox.mapbox-terrain-v2",
        });
    }

    for (const [cls, color] of Object.entries(P.lc)) {
        const id = `natural-lc-${cls}`;
        if (map.getLayer(id)) continue;
        map.addLayer({
            id,
            type: "fill",
            source: src,
            "source-layer": "landcover",
            filter: ["==", "class", cls],
            paint: {
                "fill-color": color,
                "fill-antialias": false,
            },
        });
    }
}

// ── Lazy terrain (hillshade + contours) ─────────────────────────────────
// DEM source + layers only added on first idle at zoom ≥ 9. Before that,
// the map is pure vector — zero raster tile processing during gestures.
const TERRAIN_MIN_ZOOM = 9;

function setupLazyTerrain(map: mapboxgl.Map): void {
    let added = false;

    function onIdle() {
        if (added) return;
        if (map.getZoom() < TERRAIN_MIN_ZOOM) return;

        added = true;
        map.off("idle", onIdle);

        // Hillshade — DEM raster source, only fetched now
        if (!map.getSource("natural-dem")) {
            map.addSource("natural-dem", {
                type: "raster-dem",
                url: "mapbox://mapbox.terrain-rgb",
                tileSize: 256,
            });
        }
        if (!map.getLayer("natural-hillshade")) {
            map.addLayer({
                id: "natural-hillshade",
                type: "hillshade",
                source: "natural-dem",
                minzoom: TERRAIN_MIN_ZOOM,
                paint: {
                    "hillshade-shadow-color": P.hs.shadow,
                    "hillshade-highlight-color": P.hs.highlight,
                    "hillshade-accent-color": "rgba(0, 0, 0, 0)",
                    "hillshade-exaggeration": 0.4,
                },
            });
        }

        // Contour lines — uses the terrain vector source (already added by landcover)
        if (!map.getLayer("natural-contours")) {
            map.addLayer({
                id: "natural-contours",
                type: "line",
                source: "natural-terrain",
                "source-layer": "contour",
                filter: ["==", "index", 5],
                minzoom: TERRAIN_MIN_ZOOM,
                paint: {
                    "line-color": P.contour,
                    "line-width": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        9,
                        0.3,
                        12,
                        0.6,
                        14,
                        0.8,
                    ],
                },
            });
        }
    }

    map.on("idle", onIdle);
}

// ── Lazy satellite at site zoom ────────────────────────────────────────
// Source + layer added on the FIRST idle at zoom ≥ SAT_MIN_ZOOM.
// After that, the layer persists — Mapbox handles the zoom-based opacity
// fade and minzoom cutoff smoothly via GPU interpolation. No hide/show
// toggling on gestures (that causes flashing).
function setupLazySatellite(map: mapboxgl.Map): void {
    let added = false;

    function onIdle() {
        if (added) return;
        if (map.getZoom() < SAT_MIN_ZOOM) return;

        added = true;
        map.off("idle", onIdle);

        if (!map.getSource("natural-satellite")) {
            map.addSource("natural-satellite", {
                type: "raster",
                url: "mapbox://mapbox.satellite",
                tileSize: 256,
            });
        }

        if (!map.getLayer("natural-sat")) {
            // Insert below data layers but above landcover/hillshade.
            const dataLayer = map.getStyle()?.layers?.find(
                (l) =>
                    l.id.startsWith("hero-marker") ||
                    l.id.startsWith("polygon") ||
                    l.id.startsWith("large-polygon"),
            );

            map.addLayer(
                {
                    id: "natural-sat",
                    type: "raster",
                    source: "natural-satellite",
                    minzoom: SAT_MIN_ZOOM,
                    paint: {
                        "raster-opacity": [
                            "interpolate",
                            ["linear"],
                            ["zoom"],
                            SAT_MIN_ZOOM,
                            0,
                            SAT_FULL_ZOOM,
                            SAT_OPACITY,
                        ],
                    },
                },
                dataLayer?.id,
            );
        }
    }

    map.on("idle", onIdle);
}
