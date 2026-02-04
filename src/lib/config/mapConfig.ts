import { env } from "$env/dynamic/public";

const markerSize = 28;

export const MAP_CONFIG = {
    markerSize,
    markers: {
        default: env.PUBLIC_MAP_MARKER_URL ?? "/map_marker_OSEM.svg",
    },
    styles: {
        defaultSat: "mapbox://styles/mapbox/satellite-streets-v12",
        defaultOptions: [
            {
                title: "Satellite",
                url: "mapbox://styles/mapbox/satellite-streets-v12",
            },
            { title: "Streets", url: "mapbox://styles/mapbox/streets-v12" },
            { title: "Outdoors", url: "mapbox://styles/mapbox/outdoors-v12" },
            { title: "Light", url: "mapbox://styles/mapbox/light-v11" },
            { title: "Dark", url: "mapbox://styles/mapbox/dark-v11" },
        ],
    },
    cluster: {
        maxZoom: 14,
        radius: 30,
        clickZoom: 14,
        colors: {
            whiteCore: "#ffffff",
            radius: 10,
            strokeWidth: 10,
            strokeColors: [
                { threshold: 10, color: "rgba(167, 139, 250, 0.6)" }, // Light purple
                { threshold: 50, color: "rgba(139, 92, 246, 0.7)" }, // Medium purple
                { threshold: 100, color: "rgba(109, 40, 217, 0.8)" }, // Deep purple
            ],
        },
        text: {
            font: ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            size: 12,
        },
    },
    polygons: {
        fillColor: "#a78bfa",
        fillOpacity: 0.3,
        outlineColor: "#8b5cf6",
        outlineWidth: 2,
    },
    marker: {
        width: markerSize,
        height: markerSize,
        alt: "map Pin",
    },
    globe: {
        rotationSpeed: 1.5,
        maxSpinZoom: 4,
        duration: 1000,
    },
} as const;
