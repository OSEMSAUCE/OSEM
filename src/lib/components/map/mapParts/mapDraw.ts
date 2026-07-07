// Shared draw-engine helpers.
//
// Pure, side-effect-free builders for GeoJSON FeatureCollections that feed the
// Mapbox sources used by the draw UX (polygon + line). The reactive state
// (drawIntent, drawnVertices, completedFeatures, …) stays in the Svelte
// component that owns the draw UI. This module only knows about geometry.
//
// Consumers: `mobMapPage.svelte` today. `mapPage.svelte` when the desktop
// draw UI lands (see mapDocs.md).

import type {
    Feature,
    FeatureCollection,
    LineString,
    Point,
    Polygon,
} from "geojson";
import type {
    ExpressionSpecification,
    FilterSpecification,
    Map as MapboxMap,
} from "mapbox-gl";
import { newId } from "./newId";
import { measureFeature } from "./mapDrawUtils";

export type DrawIntent = "polygon" | "line" | "pin" | null;
export type Lnglat = [number, number];

const DRAW_SOURCE_IDS = [
    "draw-edges",
    "draw-vertices",
    "provisional-polygon",
] as const;
const COMPLETED_SOURCE_ID = "completed-features";

// Polygon draw colours. The fill is a light orange; the outline + vertex
// dots are a deeper orange rust so a polygon reads as orange — distinct
// from lines, which keep the brown `accent` rust. The completed-stroke
// and completed-vertices-dot layers are shared by both shape types, so
// they switch colour with a data-driven `case` expression.
const POLYGON_FILL = "#e8a06a";
const POLYGON_OUTLINE = "#d97c33";
// Recorded GPS tracks render SAGE so they read apart from hand-drawn lines
// (brown accent) at a glance. Matches the app's --palette-sage token
// (Mapbox paint can't read CSS vars, so the hex is duplicated here).
const TRACK_SAGE = "#838963";

/** Fill opacity for a completed polygon with no per-feature override.
 *  Exported so the fill-opacity slider UI shows the same resting value
 *  the layer paints with. Per-feature override = a `fillOpacity` (0–1)
 *  property on the feature, persisted in its geometry JSON. */
export const POLYGON_FILL_OPACITY_DEFAULT = 0.3;

/** Data-driven fill-opacity: a polygon's own `fillOpacity` property wins;
 *  features without one paint at the default. `to-number` guards string
 *  values that survive a KML share round-trip. */
const POLYGON_FILL_OPACITY_EXPR: ExpressionSpecification = [
    "case",
    ["has", "fillOpacity"],
    ["to-number", ["get", "fillOpacity"], POLYGON_FILL_OPACITY_DEFAULT],
    POLYGON_FILL_OPACITY_DEFAULT,
];

function emptyFC(): FeatureCollection {
    return { type: "FeatureCollection", features: [] };
}

export function getAccentColor(fallback = "#b36940"): string {
    if (typeof document === "undefined") return fallback;
    return (
        getComputedStyle(document.documentElement)
            .getPropertyValue("--color-draw")
            .trim() || fallback
    );
}

const VERTEX_HANDLE_LAYERS = [
    "completed-vertices-halo",
    "completed-vertices-dot",
] as const;

// Default filter for the vertex-handle layers: matches Point geometries
// whose `_idx` is -1 — i.e. nothing, since every real feature's `_idx` is
// >= 0. `setVertexHandlesForFeature` swaps in the selected feature's index.
const VERTEX_HANDLES_HIDDEN: FilterSpecification = [
    "all",
    ["==", ["geometry-type"], "Point"],
    ["==", ["get", "_idx"], -1],
];

/**
 * Adds all sources + layers required by the draw UX to the given map.
 * Truly idempotent — safe to call multiple times on the same map instance.
 */
export function setupDrawSourcesAndLayers(
    map: MapboxMap,
    accent: string,
): void {
    if (map.getSource("draw-edges")) return;

    const empty = emptyFC();

    // In-progress drawing
    map.addSource("draw-edges", { type: "geojson", data: empty });
    map.addSource("draw-vertices", { type: "geojson", data: empty });
    map.addSource("provisional-polygon", { type: "geojson", data: empty });

    map.addLayer({
        id: "draw-edges-halo",
        type: "line",
        source: "draw-edges",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
            "line-color": "#1a1a1a",
            "line-width": 6,
            "line-opacity": 0.55,
        },
    });
    map.addLayer({
        id: "draw-edges-line",
        type: "line",
        source: "draw-edges",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": accent, "line-width": 4 },
    });
    map.addLayer({
        id: "provisional-polygon-fill",
        type: "fill",
        source: "provisional-polygon",
        filter: ["==", "$type", "Polygon"],
        paint: { "fill-color": POLYGON_FILL, "fill-opacity": 0.35 },
    });
    map.addLayer({
        id: "provisional-polygon-closing-edge",
        type: "line",
        source: "provisional-polygon",
        filter: ["==", "$type", "LineString"],
        // The provisional-polygon source only ever holds polygon geometry,
        // so this closing edge is always a polygon's — colour it orange.
        paint: {
            "line-color": POLYGON_OUTLINE,
            "line-width": 2.5,
            "line-dasharray": [6, 4],
        },
    });
    map.addLayer({
        id: "draw-vertices-halo",
        type: "circle",
        source: "draw-vertices",
        paint: { "circle-radius": 7, "circle-color": "#ffffff" },
    });
    map.addLayer({
        id: "draw-vertices-dot",
        type: "circle",
        source: "draw-vertices",
        paint: { "circle-radius": 4, "circle-color": accent },
    });

    // Completed features
    map.addSource(COMPLETED_SOURCE_ID, { type: "geojson", data: empty });

    map.addLayer({
        id: "completed-fill",
        type: "fill",
        source: COMPLETED_SOURCE_ID,
        filter: ["==", "$type", "Polygon"],
        paint: {
            "fill-color": POLYGON_FILL,
            "fill-opacity": POLYGON_FILL_OPACITY_EXPR,
        },
    });
    // Area label — the "X ha" stamped in the middle of every saved polygon.
    // `_haLabel` is pre-computed per polygon in buildCompletedFC; a symbol layer
    // with default ("point") placement drops it at the polygon's centroid. Dark
    // ink with a light halo so it reads on the orange body without a pill.
    map.addLayer({
        id: "completed-area-label",
        type: "symbol",
        source: COMPLETED_SOURCE_ID,
        filter: ["all", ["==", "$type", "Polygon"], ["has", "_haLabel"]],
        layout: {
            "text-field": ["get", "_haLabel"],
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 13,
            "text-allow-overlap": false,
            "text-ignore-placement": false,
        },
        paint: {
            "text-color": "#3a2410",
            "text-halo-color": "#ffe9c2",
            "text-halo-width": 1.6,
        },
    });
    map.addLayer({
        id: "completed-stroke-halo",
        type: "line",
        source: COMPLETED_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
            "line-color": "#1a1a1a",
            "line-width": 5.5,
            "line-opacity": 0.5,
        },
    });
    map.addLayer({
        id: "completed-stroke",
        type: "line",
        source: COMPLETED_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        // Polygon outlines render orange; line strokes keep the brown
        // `accent` rust; recorded TRACKS go sage. One layer draws all
        // three, so switch on featureType then geometry type.
        paint: {
            "line-color": [
                "case",
                ["==", ["get", "featureType"], "track"],
                TRACK_SAGE,
                ["==", ["geometry-type"], "Polygon"],
                POLYGON_OUTLINE,
                accent,
            ],
            "line-width": 3,
        },
    });
    // Vertex handles (white halo + accent dot) are an EDITING affordance.
    // The completed-features source carries a synthesized Point per vertex
    // of every polygon/line, so rendering them all at once turns a map of
    // many shapes into a field of orbs. They start hidden and are revealed
    // one feature at a time via `setVertexHandlesForFeature` while that
    // feature is selected for editing.
    // Pins (the user's actual data) are NOT in this source — they're
    // rendered as DOM markers (mapboxgl.Marker), so click handling is
    // native and click-through-style-swap is automatic.
    map.addLayer({
        id: "completed-vertices-halo",
        type: "circle",
        source: COMPLETED_SOURCE_ID,
        filter: VERTEX_HANDLES_HIDDEN,
        // TRACK vertices carry no halo — they're breadcrumbs, not editing
        // handles, and a white ring on every GPS point reads as clutter.
        paint: {
            "circle-radius": ["case", ["==", ["get", "_isTrack"], true], 0, 7],
            "circle-color": "#ffffff",
        },
    });
    map.addLayer({
        id: "completed-vertices-dot",
        type: "circle",
        source: COMPLETED_SOURCE_ID,
        filter: VERTEX_HANDLES_HIDDEN,
        // A vertex dot matches its parent shape: orange for polygon
        // corners, brown `accent` for line vertices. `_parentType` is
        // stamped on each synthesized vertex Point by `buildCompletedFC`.
        // Track breadcrumbs go slightly bigger (they have no halo) so the
        // path keeps its texture.
        paint: {
            "circle-radius": ["case", ["==", ["get", "_isTrack"], true], 5.5, 4],
            "circle-color": [
                "case",
                ["==", ["get", "_isTrack"], true],
                TRACK_SAGE,
                ["==", ["get", "_parentType"], "Polygon"],
                POLYGON_OUTLINE,
                accent,
            ],
        },
    });
}

/**
 * Reveal the draggable vertex handles for exactly one completed feature.
 *
 * Handles are an *editing* affordance — without this gate, a map of 50
 * polygons renders as a field of white-haloed orbs. They show only for the
 * feature the user has selected (`idx` = its `_idx` in the completed-features
 * source); pass `null` to hide every handle once editing is finished.
 *
 * Edit-state ownership stays in the consuming route — this helper only maps
 * an index onto the two GL layer filters.
 */
export function setVertexHandlesForFeature(
    map: MapboxMap,
    idx: number | null,
): void {
    const filter: FilterSpecification =
        idx === null
            ? VERTEX_HANDLES_HIDDEN
            : [
                  "all",
                  ["==", ["geometry-type"], "Point"],
                  ["==", ["get", "_idx"], idx],
              ];
    for (const id of VERTEX_HANDLE_LAYERS) {
        if (map.getLayer(id)) map.setFilter(id, filter);
    }
}

export function buildDrawEdgesFC(vertices: Lnglat[]): FeatureCollection {
    if (vertices.length < 2) return emptyFC();
    return {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                geometry: { type: "LineString", coordinates: vertices },
                properties: {},
            },
        ],
    };
}

export function buildDrawVerticesFC(vertices: Lnglat[]): FeatureCollection {
    return {
        type: "FeatureCollection",
        features: vertices.map((coord) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: coord },
            properties: {},
        })),
    };
}

export function buildProvisionalPolygonFC(
    vertices: Lnglat[],
    intent: DrawIntent,
): FeatureCollection {
    if (intent !== "polygon" || vertices.length < 2) return emptyFC();

    const ring = [...vertices, vertices[0]];
    const closingEdge = [vertices[vertices.length - 1], vertices[0]];

    const features: Feature[] = [
        {
            type: "Feature",
            geometry: { type: "LineString", coordinates: closingEdge },
            properties: {},
        },
    ];
    if (vertices.length >= 3) {
        features.push({
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [ring] },
            properties: {},
        });
    }
    return { type: "FeatureCollection", features };
}

/**
 * Builds the completed-features FC for the GL source. Pins (Point geometries)
 * are intentionally EXCLUDED — they're rendered as DOM markers
 * (mapboxgl.Marker) by the consumer, not as a symbol layer. Polygons, lines,
 * and the synthesized vertex Points stay here.
 */
export function buildCompletedFC(features: Feature[]): FeatureCollection {
    const out: Feature[] = [];
    for (let i = 0; i < features.length; i++) {
        const feat = features[i];
        if (feat.geometry?.type === "Point") continue; // pins → DOM markers
        // Stamp the hectare area onto each polygon so the `completed-area-label`
        // symbol layer can paint it at the centroid (the "X ha" in the middle of
        // a saved plot — no per-side measurements, just the area).
        const _haLabel =
            feat.geometry?.type === "Polygon"
                ? (measureFeature(feat) ?? undefined)
                : undefined;
        out.push({
            ...feat,
            properties: { ...(feat.properties ?? {}), _idx: i, _haLabel },
        });

        if (feat.geometry?.type === "Polygon") {
            const ring = (feat.geometry as Polygon).coordinates[0];
            // Skip the closing-duplicate vertex (last === first) so we
            // don't emit two overlapping draggable points at vertex 0.
            const last = ring.length - 1;
            const closes =
                ring.length > 1 &&
                ring[0][0] === ring[last][0] &&
                ring[0][1] === ring[last][1];
            const stop = closes ? last : ring.length;
            for (let v = 0; v < stop; v++) {
                out.push({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: ring[v],
                    } as Point,
                    properties: {
                        _idx: i,
                        _vertexIdx: v,
                        _isEndpoint: false,
                        _parentType: "Polygon",
                    },
                });
            }
        } else if (feat.geometry?.type === "LineString") {
            const coords = (feat.geometry as LineString).coordinates;
            // A recorded TRACK's vertices are breadcrumbs, not editing
            // handles — they render as plain accent balls (no white halo,
            // slightly bigger) purely for texture. Stamped here so the
            // vertex layers can style them apart from drawn lines.
            const isTrack = feat.properties?.featureType === "track";
            for (let v = 0; v < coords.length; v++) {
                const coord = coords[v];
                const isEndpoint = v === 0 || v === coords.length - 1;
                out.push({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: coord } as Point,
                    properties: {
                        _idx: i,
                        _vertexIdx: v,
                        _isEndpoint: isEndpoint,
                        _parentType: "LineString",
                        ...(isTrack ? { _isTrack: true } : {}),
                    },
                });
            }
        }
    }
    return { type: "FeatureCollection", features: out };
}

export interface PixelBbox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/**
 * Projects a set of lng/lat pairs to screen pixels and returns the bbox.
 * Returns null if the input is empty.
 */
export function projectLnglatBbox(
    map: MapboxMap,
    coords: ReadonlyArray<Lnglat | number[]>,
): PixelBbox | null {
    if (coords.length === 0) return null;
    let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
    for (const c of coords) {
        const pt = map.project({ lng: c[0], lat: c[1] });
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
    }
    return { minX, minY, maxX, maxY };
}

/** Screen-space bbox of a completed feature's geometry. */
export function projectFeatureBbox(
    map: MapboxMap,
    feature: Feature,
): PixelBbox | null {
    if (!feature.geometry) return null;
    let coords: number[][] = [];
    if (feature.geometry.type === "Polygon") {
        coords = (feature.geometry as Polygon).coordinates[0];
    } else if (feature.geometry.type === "LineString") {
        coords = (feature.geometry as LineString).coordinates;
    } else if (feature.geometry.type === "Point") {
        coords = [(feature.geometry as Point).coordinates];
    }
    return projectLnglatBbox(map, coords);
}

/**
 * Hit tests the completed-features layers (polygons + lines + their
 * vertices) at a screen point. Pins are NOT in this set — they're DOM
 * markers and own their own click events.
 * Returns the `_idx` of the topmost feature hit, or null.
 *
 * `tolerancePx` widens the hit query into a square around the point.
 * Defaults to 12 px — lines render thin (~3 px) and are unhittable at
 * single-pixel tap precision on a phone; the wider window catches them
 * without changing polygon behavior (a tap already inside the fill still
 * resolves to that fill, since fill renders below stroke).
 */
export function hitTestCompleted(
    map: MapboxMap,
    point: { x: number; y: number },
    tolerancePx = 12,
): number | null {
    const layers = [
        "completed-fill",
        "completed-stroke",
        "completed-vertices-halo",
        "completed-vertices-dot",
    ];
    const r = Math.max(0, tolerancePx);
    const bbox: [[number, number], [number, number]] = [
        [point.x - r, point.y - r],
        [point.x + r, point.y + r],
    ];
    const hits = map.queryRenderedFeatures(bbox, { layers });
    if (hits.length === 0) return null;
    const idx = hits[0].properties?._idx;
    return typeof idx === "number" ? idx : null;
}

/**
 * Resets the three in-progress drawing sources to empty FCs. Doesn't touch
 * the completed-features source.
 */
export function clearInProgressSources(map: MapboxMap): void {
    const empty = emptyFC();
    for (const id of DRAW_SOURCE_IDS) {
        const src = map.getSource(id);
        if (src && "setData" in src) {
            (
                src as unknown as { setData: (d: FeatureCollection) => void }
            ).setData(empty);
        }
    }
}

/**
 * Build a new feature from the currently drawn vertices.
 *
 * `properties.name` is left empty on purpose — the proprietary mobile
 * layer (`ReTreever/src/lib/mobile/stores/mapStore.svelte.ts`) supplies
 * the canonical default via `defaultFeatureName` per
 * `ReTreever/src/lib/mobile/docs/NAMING_CONVENTIONS.md`. Don't fill it
 * here; OSEM is naming-convention-agnostic.
 */
export function finalizeFeature(
    intent: Exclude<DrawIntent, null>,
    vertices: Lnglat[],
): Feature {
    const id = newId();
    if (intent === "polygon") {
        const ring = [...vertices, vertices[0]];
        return {
            type: "Feature",
            id,
            geometry: { type: "Polygon", coordinates: [ring] },
            properties: { name: "", notes: "" },
        };
    }
    if (intent === "pin") {
        return {
            type: "Feature",
            id,
            geometry: { type: "Point", coordinates: vertices[0] },
            properties: { name: "", notes: "" },
        };
    }
    return {
        type: "Feature",
        id,
        geometry: { type: "LineString", coordinates: [...vertices] },
        properties: { name: "", notes: "" },
    };
}
