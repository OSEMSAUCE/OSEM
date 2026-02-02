import mapboxgl from "mapbox-gl";
import { MAP_CONFIG } from "../../config/mapConfig";
import { compactGlobeOptions, defaultOptions, fullMapOptions } from "./config";
import { addDrawControls } from "./controls_drawToolTip";
import { CustomStyleControl, defaultStyleOptions } from "./controls_styleControl";
import { addMarkersLayer } from "./layers_polygonLayers";
import type { MapOptions } from "./types";
import { parseMapHash, setMapHash } from "./utils_hash";

const defaultSatStyle = MAP_CONFIG.styles.defaultSat;

// Helper to start globe auto-rotation
function startRotation(map: mapboxgl.Map, options: MapOptions, userInteractingRef: { current: boolean }): void {
	const degreesPerSecond = options.rotationSpeed ?? MAP_CONFIG.globe.rotationSpeed;
	const maxSpinZoom = MAP_CONFIG.globe.maxSpinZoom; // Stop rotating at zoom 4 and above

	function spinGlobe() {
		if (!map || userInteractingRef.current) return;
		if (map.getZoom() >= maxSpinZoom) return;

		const center = map.getCenter();
		center.lng -= degreesPerSecond;
		map.easeTo({ center, duration: MAP_CONFIG.globe.duration, easing: (n) => n });
	}

	// When animation finishes, spin again
	map.on("moveend", spinGlobe);

	// Start spinning
	spinGlobe();
}

/**
 * Initialize a Mapbox map with configurable options.
 * @param container - The HTML container element for the map
 * @param options - Configuration options (use compactGlobeOptions for hero globe)
 * @returns Cleanup function to remove the map
 */
export function initializeMap(container: HTMLDivElement, options: MapOptions = {}): () => void {
	const opts = { ...defaultOptions, ...options };
	const mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;
	const maxSpinZoom = MAP_CONFIG.globe.maxSpinZoom; // Stop rotating (and start URL sync) at zoom 4 and above

	if (opts.enableHash && typeof window !== "undefined") {
		const parsed = parseMapHash(window.location.hash);
		if (parsed) {
			opts.initialZoom = parsed.zoom;
			opts.initialCenter = parsed.center;
		}
	}

	if (!mapboxAccessToken) {
		console.error("Mapbox access token is required");
		return () => {};
	}

	mapboxgl.accessToken = mapboxAccessToken;

	// Track user interaction for rotation pause
	const userInteractingRef = { current: false };

	const map = new mapboxgl.Map({
		container,
		style: opts.style || defaultSatStyle,
		hash: false,
		center: opts.initialCenter,
		zoom: opts.initialZoom,
		projection: opts.globeProjection ? "globe" : "mercator",
		interactive: true,
	});

	if (opts.enableHash) {
		map.on("moveend", () => {
			if (map.getZoom() < maxSpinZoom) return;
			setMapHash(map);
		});
	}

	// Configure scroll zoom
	if (!opts.scrollZoom) {
		map.scrollZoom.disable();
	}

	// Track user interaction for auto-rotation
	if (opts.autoRotate) {
		map.on("mousedown", () => {
			userInteractingRef.current = true;
			opts.onUserInteractionStart?.();
		});
		map.on("mouseup", () => {
			userInteractingRef.current = false;
			opts.onUserInteractionEnd?.();
		});
		map.on("dragend", () => {
			userInteractingRef.current = false;
			opts.onUserInteractionEnd?.();
		});
	}

	// Add fog for globe projection
	if (opts.globeProjection) {
		map.on("style.load", () => {
			// If explicitly requesting transparent/white background (custom flag)
			if (opts["transparentBackground"]) {
				map.setFog({
					color: "white", // Lower atmosphere white
					"high-color": "white", // Upper atmosphere white
					"horizon-blend": 0.015,
					"space-color": "white", // Space white
					"star-intensity": 0.4, // No stars
				});
				return;
			}

			// Single fog preset for consistent tuning across styles
			map.setFog({
				color: "rgba(186, 210, 235, 0.35)",
				"high-color": "rgba(36, 92, 223, 0.18)",
				"horizon-blend": 0.015,
				"space-color": "rgb(11, 11, 25)",
				"star-intensity": 0.4,
			});
		});
	}

	// Add controls (only in non-compact mode)
	if (opts.showStyleControl) {
		map.addControl(new CustomStyleControl(defaultStyleOptions, "satellite"), "top-left");
	}

	if (opts.showNavigation) {
		const nc = new mapboxgl.NavigationControl();
		map.addControl(nc, "top-left");
	}

	// Hide labels (country/continent/place names) if requested
	if (opts.hideLabels) {
		const minLabelZoom = 5;
		map.on("style.load", () => {
			const layers = map.getStyle()?.layers || [];
			layers.forEach((layer) => {
				if (layer.type !== "symbol") return;

				// Only target symbol layers that render text (labels).
				const hasText = map.getLayoutProperty(layer.id, "text-field") != null;
				if (!hasText) return;

				try {
					map.setPaintProperty(layer.id, "text-opacity", ["interpolate", ["linear"], ["zoom"], minLabelZoom - 0.01, 0, minLabelZoom, 1]);

					map.setPaintProperty(layer.id, "icon-opacity", ["interpolate", ["linear"], ["zoom"], minLabelZoom - 0.01, 0, minLabelZoom, 1]);
				} catch {
					// ignore
				}
			});
		});
	}

	// Setup map layers on load
	map.on("load", async () => {
		map.resize(); // Force resize to ensure canvas fills container
		console.log(opts.compact ? "🌍 Hero globe loaded" : "🗺️ Map loaded, starting to load layers...");

		// Add markers layer for global view
		if (opts.loadMarkers) {
			await addMarkersLayer(map, opts);
		}

		// Add draw controls for creating and editing features
		if (opts.showDrawTools) {
			addDrawControls(map);
		}

		// Start auto-rotation for globe mode
		if (opts.autoRotate) {
			startRotation(map, opts, userInteractingRef);
		}

		console.log(opts.compact ? "🌍 Hero globe ready!" : "🎉 Map initialization complete!");
	});

	// Return cleanup function
	return () => map.remove();
}

// Re-export config options for backward compatibility
export { fullMapOptions, compactGlobeOptions };

export type { ClusteredPinsConfig } from "./layers_clusteredPins";
// Re-export types for backward compatibility
export type { MapOptions, PolygonConfig } from "./types";
