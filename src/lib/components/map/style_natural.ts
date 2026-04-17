/**
 * Natural Dark style — runtime overrides on top of Mapbox dark-v11.
 *
 * Turns the grey "Death Star" globe into a natural-looking Earth:
 *   - Dark ocean blue water
 *   - Muted green land
 *   - Subtle landcover variation (forest, grass, crop, scrub, snow)
 *   - Faint hillshade for terrain texture (zoom 4+)
 *   - No labels, roads, POIs, buildings, or transit
 *   - Barely-visible admin borders
 *
 * All changes are vector/paint-property manipulations — no heavy raster
 * layers, no extra tile fetches at globe zoom. The landcover source
 * (mapbox-terrain-v2) is a tiny vector tileset; hillshade DEM tiles
 * only load past zoom 4.
 */
import type mapboxgl from "mapbox-gl";

// ── Palette ────────────────────────────────────────────────────────────
// Tweak these to adjust the look. Keep values dark — the gold heatmap
// and white cluster rings need to pop against the background.
const P = {
    land: "#1a2e1a", // dark muted green
    ocean: "#0d2140", // deep navy
    lc: {
        wood: "rgba(18, 50, 22, 0.55)",
        grass: "rgba(28, 48, 18, 0.45)",
        crop: "rgba(34, 42, 16, 0.38)",
        scrub: "rgba(24, 40, 20, 0.38)",
        snow: "rgba(38, 48, 62, 0.32)",
    },
    hs: {
        shadow: "rgba(0, 0, 0, 0.12)",
        highlight: "rgba(255, 255, 255, 0.035)",
    },
    border: "rgba(255, 255, 255, 0.04)",
} as const;

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
];

function shouldHide(id: string, type: string): boolean {
    if (type === "symbol") return true; // all labels
    return HIDE_PREFIXES.some((p) => id.startsWith(p));
}

// ── Safe setters (layers may not exist in every style version) ─────────
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

    // 2. Hide clutter (roads, labels, POIs, transit, buildings)
    for (const l of layers) {
        if (shouldHide(l.id, l.type)) hide(map, l.id);
    }

    // 3. Dim admin borders to near-invisible
    for (const l of layers) {
        if (/^admin/.test(l.id) && l.type === "line") {
            setPaint(map, l.id, "line-color", P.border);
            setPaint(map, l.id, "line-width", 0.5);
        }
    }

    // 4. Tint existing landuse layers (parks, etc.) if present
    for (const l of layers) {
        if (/^landuse/.test(l.id) && l.type === "fill") {
            setPaint(map, l.id, "fill-color", "rgba(22, 42, 20, 0.25)");
        }
    }

    // 5. Add landcover variation from terrain tileset
    addLandcover(map);

    // 6. Add hillshade for subtle terrain depth (zoom 4+)
    addHillshade(map);
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

    // Insert landcover below data layers. Find the first layer we
    // DIDN'T hide — that's likely an admin border or similar. Landcover
    // sits just above water, below everything else.
    let insertBefore: string | undefined;
    const visible = map.getStyle()?.layers?.filter((l) => {
        try {
            return (
                map.getLayoutProperty(l.id, "visibility") !== "none" &&
                l.id !== "background" &&
                !/^water/.test(l.id)
            );
        } catch {
            return false;
        }
    });
    if (visible && visible.length > 0) insertBefore = visible[0].id;

    for (const [cls, color] of Object.entries(P.lc)) {
        const id = `natural-lc-${cls}`;
        if (map.getLayer(id)) continue;
        map.addLayer(
            {
                id,
                type: "fill",
                source: src,
                "source-layer": "landcover",
                filter: ["==", "class", cls],
                paint: {
                    "fill-color": color,
                    "fill-antialias": false,
                },
            },
            insertBefore,
        );
    }
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

    // Insert hillshade right after landcover (above landcover, below data)
    const lastLc = map.getLayer("natural-lc-snow")
        ? "natural-lc-snow"
        : undefined;

    map.addLayer(
        {
            id,
            type: "hillshade",
            source: src,
            minzoom: 4,
            paint: {
                "hillshade-shadow-color": P.hs.shadow,
                "hillshade-highlight-color": P.hs.highlight,
                "hillshade-accent-color": "rgba(0, 0, 0, 0)",
                "hillshade-exaggeration": 0.25,
            },
        },
        lastLc,
    );
}
