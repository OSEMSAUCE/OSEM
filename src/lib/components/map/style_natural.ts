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
const SAT_MIN_ZOOM = 14;
const SAT_FULL_ZOOM = 16;
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

    // 5. Add geographic detail layers
    addLandcover(map);
    addContours(map);
    addHillshade(map);

    // 6. Lazy satellite at site zoom — registers idle listener
    setupLazySatellite(map);
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

// ── Contour lines (vector, major contours only) ────────────────────────
function addContours(map: mapboxgl.Map): void {
    const src = "natural-terrain";
    // Source already added by addLandcover

    const id = "natural-contours";
    if (map.getLayer(id)) return;

    map.addLayer({
        id,
        type: "line",
        source: src,
        "source-layer": "contour",
        filter: ["==", "index", 5], // major contours only (every 5th)
        minzoom: 5,
        paint: {
            "line-color": P.contour,
            "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                5,
                0.3,
                10,
                0.6,
                14,
                0.8,
            ],
        },
    });
}

// ── Hillshade (DEM tiles only fetched at zoom ≥ 4) ────────────────────
function addHillshade(map: mapboxgl.Map): void {
    const src = "natural-dem";
    if (!map.getSource(src)) {
        map.addSource(src, {
            type: "raster-dem",
            url: "mapbox://mapbox.terrain-rgb",
            tileSize: 256,
        });
    }

    const id = "natural-hillshade";
    if (map.getLayer(id)) return;

    map.addLayer({
        id,
        type: "hillshade",
        source: src,
        minzoom: 4,
        paint: {
            "hillshade-shadow-color": P.hs.shadow,
            "hillshade-highlight-color": P.hs.highlight,
            "hillshade-accent-color": "rgba(0, 0, 0, 0)",
            "hillshade-exaggeration": 0.4,
        },
    });
}

// ── Lazy satellite at site zoom ────────────────────────────────────────
// The satellite raster source + layer are only added on the FIRST idle
// event at zoom ≥ SAT_MIN_ZOOM. This means:
//   - Globe/medium zoom: zero satellite tile fetches. Pure vector. Fast.
//   - Site zoom: satellite tiles lazy-load while the user is idle.
//   - Zoom back out: minzoom hides the layer. Tiles stay cached.
//   - Zoom back in: tiles are cached, instant display.
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
            // Insert satellite below data layers but above landcover/hillshade.
            // Find the first data layer (hero-marker, polygon, etc.) to insert before.
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
