import mapboxgl from "mapbox-gl";
import { addOrgPins, type OrgPinConfig } from "../map/layers_orgPins";

const defaultSatStyle = "mapbox://styles/mapbox/satellite-streets-v12";

// Helper to start globe auto-rotation
function startRotation(map: mapboxgl.Map, options: OrgMapOptions, userInteractingRef: { current: boolean }): void {
	const degreesPerSecond = options.rotationSpeed ?? 2;
	const maxSpinZoom = 4; // Stop rotating at zoom 4 and above

	function spinGlobe() {
		if (!map || userInteractingRef.current) return;
		if (map.getZoom() >= maxSpinZoom) return;

		const center = map.getCenter();
		center.lng -= degreesPerSecond;
		map.easeTo({ center, duration: 1000, easing: (n) => n });
	}

	// When animation finishes, spin again
	map.on("moveend", spinGlobe);

	// Start spinning
	spinGlobe();
}

/**
 * Options for the org map
 */
export interface OrgMapOptions {
	/** Initial zoom level (default: 2.5 desktop, adjust for mobile) */
	initialZoom?: number;
	/** Initial center [lng, lat] */
	initialCenter?: [number, number];
	/** Fog horizon-blend (0.004 = thin like /where, 0.02 = thick) */
	horizonBlend?: number;
	/** Enable auto-rotation */
	autoRotate?: boolean;
	/** Rotation speed in degrees per second */
	rotationSpeed?: number;
}

/** Default options - matches ReTreever's /where page fog */
const defaultOrgMapOptions: OrgMapOptions = {
	initialZoom: 2.5,
	initialCenter: [0, 20],
	horizonBlend: 0.004, // Thin fog like /where page
	autoRotate: true,
	rotationSpeed: 2,
};

export function initializeOrgMap(container: HTMLDivElement, orgData: any[], onPinClick: (orgId: string) => void, options: OrgMapOptions = {}): () => void {
	const opts = { ...defaultOrgMapOptions, ...options };
	const mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;

	if (!mapboxAccessToken) {
		console.error("Mapbox access token is required");
		return () => {};
	}

	mapboxgl.accessToken = mapboxAccessToken;

	// Track user interaction for rotation pause
	const userInteractingRef = { current: false };

	const map = new mapboxgl.Map({
		container,
		style: defaultSatStyle,
		center: opts.initialCenter,
		zoom: opts.initialZoom,
		projection: "globe",
	});

	// Track user interaction for auto-rotation
	if (opts.autoRotate) {
		map.on("mousedown", () => {
			userInteractingRef.current = true;
		});
		map.on("mouseup", () => {
			userInteractingRef.current = false;
		});
		map.on("dragend", () => {
			userInteractingRef.current = false;
		});
	}

	// Add navigation control
	const nc = new mapboxgl.NavigationControl();
	map.addControl(nc, "top-right");

	map.on("style.load", () => {
		map.setFog({
			color: "rgb(186, 210, 235)",
			"high-color": "rgb(36, 92, 223)",
			"horizon-blend": opts.horizonBlend,
			"space-color": "rgb(11, 11, 25)",
			"star-intensity": 0.6,
		});
	});

	map.on("load", async () => {
		console.log("🗺️ Org Map loaded");

		const pinConfig: OrgPinConfig = {
			id: "org-pins",
			data: orgData,
			onPinClick,
		};

		await addOrgPins(map, pinConfig);

		// Start auto-rotation for globe mode
		if (opts.autoRotate) {
			startRotation(map, opts, userInteractingRef);
		}
	});

	return () => map.remove();
}
