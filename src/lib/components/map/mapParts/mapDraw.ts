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
import type { Map as MapboxMap } from "mapbox-gl";

export type DrawIntent = "polygon" | "line" | "pin" | null;
export type Lnglat = [number, number];

export const DRAW_SOURCE_IDS = [
    "draw-edges",
    "draw-vertices",
    "provisional-polygon",
] as const;
export const COMPLETED_SOURCE_ID = "completed-features";

export function emptyFC(): FeatureCollection {
    return { type: "FeatureCollection", features: [] };
}

export function getAccentColor(fallback = "#C9825B"): string {
    if (typeof document === "undefined") return fallback;
    return (
        getComputedStyle(document.documentElement)
            .getPropertyValue("--color-draw")
            .trim() || fallback
    );
}

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
        paint: { "fill-color": "#e8a06a", "fill-opacity": 0.35 },
    });
    map.addLayer({
        id: "provisional-polygon-closing-edge",
        type: "line",
        source: "provisional-polygon",
        filter: ["==", "$type", "LineString"],
        paint: {
            "line-color": accent,
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
        paint: { "fill-color": "#e8a06a", "fill-opacity": 0.3 },
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
        paint: { "line-color": accent, "line-width": 3 },
    });
    // Vertex halos/dots render for ALL Point features in the source.
    // Pins (the user's actual data) are NOT in the source — they're
    // rendered as DOM markers (mapboxgl.Marker), so click handling is
    // native and click-through-style-swap is automatic.
    map.addLayer({
        id: "completed-vertices-halo",
        type: "circle",
        source: COMPLETED_SOURCE_ID,
        filter: ["==", "$type", "Point"],
        paint: { "circle-radius": 7, "circle-color": "#ffffff" },
    });
    map.addLayer({
        id: "completed-vertices-dot",
        type: "circle",
        source: COMPLETED_SOURCE_ID,
        filter: ["==", "$type", "Point"],
        paint: { "circle-radius": 4, "circle-color": accent },
    });
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
        out.push({
            ...feat,
            properties: { ...(feat.properties ?? {}), _idx: i },
        });

        if (feat.geometry?.type === "Polygon") {
            const ring = (feat.geometry as Polygon).coordinates[0];
            for (const coord of ring) {
                out.push({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: coord } as Point,
                    properties: { _idx: i },
                });
            }
        } else if (feat.geometry?.type === "LineString") {
            const coords = (feat.geometry as LineString).coordinates;
            for (const coord of coords) {
                out.push({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: coord } as Point,
                    properties: { _idx: i },
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
 */
export function hitTestCompleted(
    map: MapboxMap,
    point: { x: number; y: number },
): number | null {
    const layers = [
        "completed-fill",
        "completed-stroke",
        "completed-vertices-halo",
        "completed-vertices-dot",
    ];
    const hits = map.queryRenderedFeatures([point.x, point.y], {
        layers,
    });
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
    const id = crypto.randomUUID();
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
