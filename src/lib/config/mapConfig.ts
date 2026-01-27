import { env } from "$env/dynamic/public";

const markerSize = 18;

export const MAP_CONFIG = {
	markerSize,
	markers: {
		default: env.PUBLIC_MAP_MARKER_URL ?? "/map_marker_OSEM.svg",
	},
	styles: {
		defaultSat: "mapbox://styles/mapbox/satellite-streets-v12",
		defaultOptions: [
			{ title: "Satellite", url: "mapbox://styles/mapbox/satellite-streets-v12" },
			{ title: "Streets", url: "mapbox://styles/mapbox/streets-v12" },
			{ title: "Outdoors", url: "mapbox://styles/mapbox/outdoors-v12" },
			{ title: "Light", url: "mapbox://styles/mapbox/light-v11" },
			{ title: "Dark", url: "mapbox://styles/mapbox/dark-v11" },
		],
	},
	cluster: {
		maxZoom: 14,
		radius: 50,
		colors: {
			whiteCore: "#ffffff",
			radius: 15,
			strokeWidth: 10,
			strokeColors: [
				{ threshold: 10, color: "rgba(81, 187, 214, 0.6)" }, // Transparent Blue
				{ threshold: 50, color: "rgba(241, 240, 117, 0.6)" }, // Transparent Yellow
				{ threshold: 100, color: "rgba(242, 140, 177, 0.6)" }, // Transparent Pink
			],
		},
		text: {
			font: ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
			size: 12,
		},
	},
	polygons: {
		fillColor: "#d1ae00",
		fillOpacity: 0.4,
		outlineColor: "#008B8B",
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
