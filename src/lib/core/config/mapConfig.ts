const defaultMarkerUrl = "/pub-OSEM/map-marker-osem-trees.svg";

const markerSize = 28;

export const MAP_CONFIG = {
    markerSize,
    markers: {
        default: defaultMarkerUrl,
    },
    styles: {
        defaultSat: "mapbox://styles/mapbox/satellite-streets-v12",
        defaultDark: "mapbox://styles/mapbox/dark-v11",
    },
    cluster: {
        maxZoom: 14,
        radius: 40,
        clickZoom: 14,
        // Graduated circle stops: [point_count, radius_px, color]
        // Transparent fill — only the white stroke ring shows. The gold glow
        // underneath shines through the empty center.
        circleStops: [
            { count: 1, radius: 8, color: "rgba(255, 255, 255, 0)" },
            { count: 10, radius: 14, color: "rgba(255, 255, 255, 0)" },
            { count: 50, radius: 22, color: "rgba(255, 255, 255, 0)" },
            { count: 200, radius: 34, color: "rgba(255, 255, 255, 0)" },
        ],
        stroke: {
            color: "rgba(255, 255, 255, 0.95)",
            width: 1.5,
        },
        // Soft oversized underlay that gives the "gold cloud" glow feel.
        // radiusScale = 2.2× core, blur = 0.55 means the inner half of the
        // glow stays bright (filling up to the white ring) and the outer half
        // fades out past the ring for the cloud effect.
        glow: {
            color: "rgba(255, 200, 0, 0.45)",
            radiusScale: 1.25,
            blur: 0.35,
        },
        // Heatmap color ramp keyed by heatmap-density (0..1) — gold ramp
        heatmap: {
            minZoom: 0,
            maxZoom: 7,
            ramp: [
                { stop: 0, color: "rgba(0, 0, 0, 0)" },
                { stop: 0.2, color: "rgba(120, 80, 0, 0.55)" },
                { stop: 0.4, color: "rgba(255, 180, 0, 0.75)" },
                { stop: 0.7, color: "rgba(255, 215, 0, 0.9)" },
                { stop: 1, color: "rgba(255, 245, 200, 0.9)" },
            ],
        },
    },
    polygons: {
        fillColor: "rgba(255, 215, 0, 0.25)",
        fillOpacity: 0.3,
        outlineColor: "rgba(255, 255, 255, 0.85)",
        outlineWidth: 1.5,
        minZoom: 7,
    },
    marker: {
        width: markerSize,
        height: markerSize,
        alt: "map Pin",
        iconPixelSize: 56, // rasterized size for symbol layer icon
        iconSize: 1.1, // base symbol-layer scale (multiplied per zoom in layer)
    },
    globe: {
        rotationSpeed: 1.5,
        maxSpinZoom: 4,
        duration: 1000,
    },
    // Elastic zoom: user can pinch past soft.min / soft.max by `overshoot`
    // zoom levels, then the map eases back to the soft limit on release.
    // See MAP_UX_PRINCIPLES.md — gesture feedback over hard limits.
    zoom: {
        softMin: 0.5,
        softMax: 20,
        overshoot: 0.6,
        easeMs: 250,
    },
} as const;
