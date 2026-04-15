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
        // White core (size encodes density). Gold lives in the glow halo only.
        circleStops: [
            { count: 1, radius: 8, color: "rgba(255, 255, 255, 0.9)" },
            { count: 10, radius: 14, color: "rgba(255, 255, 255, 0.92)" },
            { count: 50, radius: 22, color: "rgba(255, 255, 255, 0.95)" },
            { count: 200, radius: 34, color: "rgba(255, 255, 255, 0.98)" },
        ],
        stroke: {
            color: "rgba(255, 255, 255, 0.95)",
            width: 1.5,
        },
        // Soft oversized underlay that gives the "gold cloud" glow feel
        glow: {
            color: "rgba(255, 200, 0, 0.6)",
            radiusScale: 1.75,
            blur: 0.95,
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
                { stop: 1, color: "rgba(255, 245, 200, 1)" },
            ],
        },
    },
    polygons: {
        fillColor: "#a78bfa",
        fillOpacity: 0.3,
        outlineColor: "#8b5cf6",
        outlineWidth: 2,
        minZoom: 7,
    },
    marker: {
        width: markerSize,
        height: markerSize,
        alt: "map Pin",
        iconPixelSize: 56, // rasterized size for symbol layer icon
    },
    globe: {
        rotationSpeed: 1.5,
        maxSpinZoom: 4,
        duration: 1000,
    },
} as const;
