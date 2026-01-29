import type { Feature, FeatureCollection, GeoJsonProperties, Point } from "geojson";
import mapboxgl from "mapbox-gl";
import { PUBLIC_API_URL } from "$env/static/public";
import { MAP_CONFIG } from "../../config/mapConfig";
import { addClusteredPins, type ClusteredPinsConfig } from "../map/mapPlugins/clusteredPins";
import { addDrawControls } from "../map/mapPlugins/drawToolTip";
import { addgeoToggle } from "../map/mapPlugins/geoToggleFeature/geoToggle";
import { CustomStyleControl, defaultStyleOptions } from "../map/mapPlugins/styleControl";

// 🔥️ https://docs.mapbox.com/mapbox-gl-js/plugins/

const defaultSatStyle = MAP_CONFIG.styles.defaultSat;

function parseMapHash(hash: string): { zoom: number; center: [number, number] } | null {
	const trimmed = hash.replace(/^#/, "").trim();
	if (!trimmed) return null;

	const parts = trimmed.split("/");
	if (parts.length < 3) return null;

	const zoom = Number(parts[0]);
	const lat = Number(parts[1]);
	const lng = Number(parts[2]);
	if (!Number.isFinite(zoom) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

	return { zoom, center: [lng, lat] };
}

function setMapHash(map: mapboxgl.Map): void {
	const zoom = map.getZoom();
	const center = map.getCenter();

	const next = `#${zoom.toFixed(2)}/${center.lat.toFixed(5)}/${center.lng.toFixed(5)}`;
	if (typeof window === "undefined") return;
	if (window.location.hash === next) return;

	history.replaceState(null, "", next);
}

/**
 * Options for initializing the map.
 *
 * DEFAULTS: All features OFF. Pass options explicitly to enable.
 * - /where page: use `fullMapOptions` (all controls + data layers)
 * - Homepage: use `compactGlobeOptions` (rotating globe + markers only)
 */
export interface MapOptions {
	// ─── /WHERE PAGE FEATURES (off by default, on for fullMapOptions) ───
	/** Show navigation controls (zoom, compass) */
	showNavigation?: boolean;
	/** Show style switcher control */
	showStyleControl?: boolean;
	/** Show geographic layer toggles */
	showGeoToggle?: boolean;
	/** Show draw tools */
	showDrawTools?: boolean;
	/** Load polygon markers */
	loadMarkers?: boolean;

	/** Sync zoom/center into the URL hash (e.g. #1.2/-4.9/12.8) */
	enableHash?: boolean;

	// ─── HOMEPAGE GLOBE FEATURES (off by default, on for compactGlobeOptions) ───
	/** Compact mode flag (affects marker interactivity) */
	compact?: boolean;
	/** Enable globe projection (vs flat map) */
	globeProjection?: boolean;
	/** Enable auto-rotation */
	autoRotate?: boolean;
	/** Rotation speed in degrees per second */
	rotationSpeed?: number;
	/** Hide map labels (country/continent names) */
	hideLabels?: boolean;
	/** Make background/space transparent (or white) */
	transparentBackground?: boolean;

	// ─── SHARED / GENERAL ───
	/** Enable scroll zoom */
	scrollZoom?: boolean;
	/** Initial zoom level */
	initialZoom?: number;
	/** Initial center [lng, lat] */
	initialCenter?: [number, number];
	/** API base URL for fetching data */
	apiBaseUrl?: string;
	/** Override marker image URL */
	markerUrl?: string;
	/** Mapbox style URL */
	style?: string;

	// ─── CALLBACKS ───
	/** Callback when user starts interacting (pauses rotation) */
	onUserInteractionStart?: () => void;
	/** Callback when user stops interacting */
	onUserInteractionEnd?: () => void;
}

// Re-export interface for backward compatibility with geoToggle plugin
export interface PolygonConfig {
	id: string;
	path: string;
	name: string;
	fillColor: string;
	outlineColor: string;
	opacity: number;
	type?: string;
	initiallyVisible?: boolean;
}

// Helper function to add markers layer for polygons
async function addMarkersLayer(map: mapboxgl.Map, options: MapOptions = {}): Promise<void> {
	console.log("🔧 addMarkersLayer received options:", options);
	try {
		const apiBase = options.apiBaseUrl || PUBLIC_API_URL.replace(/\/$/, "");
		if (!apiBase) {
			throw new Error("Missing apiBaseUrl. Refusing to fetch /api/where/polygons without an explicit API base. Set PUBLIC_API_URL in the environment and pass it into initializeMap().");
		}
		// Fetch polygons from public API (returns GeoJSON FeatureCollection)
		const response = await fetch(`${apiBase}/api/where/polygons`);
		if (!response.ok) {
			console.error("Failed to fetch polygon markers:", response.status);
			return;
		}

		const polygonData = await response.json();

		// Add polygon shapes to map FIRST
		if (polygonData.features && polygonData.features.length > 0) {
			console.log(`🔷 Adding ${polygonData.features.length} polygon shapes to map`);

			map.addSource("polygons", { type: "geojson", data: polygonData });

			map.addLayer({
				id: "polygons-fill",
				type: "fill",
				source: "polygons",
				paint: {
					"fill-color": MAP_CONFIG.polygons.fillColor,
					"fill-opacity": MAP_CONFIG.polygons.fillOpacity,
				},
			});

			map.addLayer({
				id: "polygons-outline",
				type: "line",
				source: "polygons",
				paint: {
					"line-color": MAP_CONFIG.polygons.outlineColor,
					"line-width": MAP_CONFIG.polygons.outlineWidth,
				},
			});
		}

		// Then create pins from stored centroids (much faster!)
		console.log(
			"🔍 Debug: First few polygon features:",
			(polygonData.features || []).slice(0, 3).map((f) => ({
				id: f.id,
				centroid: f.properties?.centroid,
				landName: f.properties?.landName,
			})),
		);

		const markers = (polygonData.features || [])
			.map((feature: { id: string; properties: Record<string, unknown> }) => {
				const props = feature.properties || {};

				// Use stored centroid from database (GeoJSON Point)
				let centroid: [number, number] | null = null;
				if (props.centroid && typeof props.centroid === "object" && "coordinates" in props.centroid) {
					const centroidData = props.centroid as { coordinates: [number, number] };
					centroid = centroidData.coordinates;
				}

				// If no centroid, we can't create a marker
				if (!centroid) {
					return null;
				}

				return {
					type: "Feature",
					geometry: { type: "Point", coordinates: centroid },
					properties: {
						polygonId: feature.id,
						landName: feature.properties?.landName,
						projectId: feature.properties?.projectId,
						projectName: feature.properties?.projectName,
						organizationLocalName: feature.properties?.organizationLocalName,
						polygonNotes: feature.properties?.polygonNotes,
					},
				} satisfies Feature<Point, GeoJsonProperties>;
			})
			.filter((marker: Feature<Point, GeoJsonProperties> | null): marker is Feature<Point, GeoJsonProperties> => {
				// Filter out null markers and validate coordinates
				if (!marker) return false;
				const coords = marker.geometry.coordinates;
				return Array.isArray(coords) && coords.length === 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1]) && Math.abs(coords[0]) >= 1 && Math.abs(coords[1]) >= 1;
			});

		const geojson: FeatureCollection<Point, GeoJsonProperties> = {
			type: "FeatureCollection",
			features: markers,
		};

		const sourceId = "hero-markers";

		console.log(`📍 Loaded ${geojson.features.length} polygon markers`);

		const pinConfig: ClusteredPinsConfig = {
			id: sourceId,
			data: geojson,
			maxZoom: undefined, // Keep pins visible at all zoom levels
			pointColor: "#11b4da",
			markerUrl: options.markerUrl,
			onPointClick: (feature) => {
				// Only enable click actions in non-compact (full map) mode
				if (!options.compact) {
					console.log("🔍 Clicked feature properties:", feature.properties);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const coordinates = (feature.geometry as any).coordinates.slice() as [number, number];
					const properties = feature.properties;

					if (!properties) return;

					// Fly to the marker location
					map.flyTo({
						center: coordinates,
						zoom: 12,
						essential: true,
					});

					// Show popup with polygon info
					new mapboxgl.Popup()
						.setLngLat(coordinates)
						.setHTML(
							`<div class="tooltip-container">
								<div class="marker-popup-title">${properties.landName || "Unnamed Area"}</div>
								<span>______________</span>
								${properties.projectName ? `<div class="marker-popup-subtitle">Project: <a href="/what?project=${encodeURIComponent(properties.projectId || "")}" class="tooltip-link">${properties.projectName}</a></div>` : ""}
								${properties.organizationLocalName ? `<div class="marker-popup-subtitle">Organization: <a href="/who/${encodeURIComponent(properties.organizationLocalName)}" class="tooltip-link">${properties.organizationLocalName}</a></div>` : '<div class="marker-popup-subtitle">Org: None</div>'}
							</div>`,
						)
						.addTo(map);
				}
			},
		};

		addClusteredPins(map, pinConfig);
		console.log("✅ Polygon markers layer added successfully (Clustered via Shared Utility)");
	} catch (error) {
		console.error("Error adding markers layer:", error);
	}
}

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
 * Default options - minimal map with nothing enabled by default.
 * Pass explicit options to enable features.
 */
const defaultOptions: MapOptions = {
	compact: false,
	showNavigation: false,
	showStyleControl: false,
	showGeoToggle: false,
	showDrawTools: false,
	loadMarkers: false,
	enableHash: false,
	globeProjection: false,
	autoRotate: false,
	rotationSpeed: 2,
	scrollZoom: true,
	initialZoom: 2,
	initialCenter: [38.32379156163088, -4.920169086710128], // Tanzania
};

/**
 * Preset options for full-featured map - ALL options enabled
 */
export const fullMapOptions: MapOptions = {
	// Controls
	showNavigation: true,
	showStyleControl: true,
	showGeoToggle: false, // PAUSED: Large GeoJSON layers disabled for now
	showDrawTools: true,
	hideLabels: true,
	// Data layers
	loadMarkers: true,
	// URL sync
	enableHash: true,
	// Globe features
	globeProjection: true,
	autoRotate: true,
	rotationSpeed: 2,
	// General
	scrollZoom: true,
	initialZoom: 2,
	initialCenter: [38.32379156163088, -4.920169086710128],
};

/**
 * Preset options for compact hero globe mode (homepage)
 */
export const compactGlobeOptions: MapOptions = {
	// // Controls
	// showNavigation: true,
	// showStyleControl: true,
	// showGeoToggle: false, // PAUSED: Large GeoJSON layers disabled for now
	// showDrawTools: true,
	hideLabels: true,
	// Data layers
	loadMarkers: true,
	// URL sync
	// enableHash: true,
	// Globe features
	globeProjection: true,
	autoRotate: true,
	rotationSpeed: 1.5,
	// // General
	// scrollZoom: true,
	// initialZoom: 2,
	// initialCenter: [38.32379156163088, -4.920169086710128],
};

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

		// // Get geographic layer configs (data will be lazy-loaded when user toggles on)
		// if (opts.showGeoToggle) {
		// 	const geoConfigs = getGeographicLayerConfigs();
		// 	addgeoToggle(map, geoConfigs);
		// }

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
// 2026-01-25 omg update tooltip 3:24AM
