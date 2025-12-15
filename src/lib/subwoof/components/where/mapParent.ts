import mapboxgl from 'mapbox-gl';
import { CustomStyleControl, defaultStyleOptions } from './mapPlugins/styleControl';
import { addgeoToggle } from './mapPlugins/geoToggleFeature/geoToggle';
import { addDrawControls } from './mapPlugins/drawToolTip';
import { getGeographicLayerConfigs } from './mapPlugins/geoToggleFeature/geographicLayers';
import { addClusteredPins, type ClusteredPinsConfig } from './mapPlugins/clusteredPins';
import type { FeatureCollection, Feature, Point, GeoJsonProperties } from 'geojson';
import { addClaimLayers } from './mapPlugins/claimLayers';
// 🔥️ https://docs.mapbox.com/mapbox-gl-js/plugins/

const defaultSatStyle = 'mapbox://styles/mapbox/satellite-streets-v12';

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
	/** Load claim layers with viewport fetching */
	loadClaimLayers?: boolean;
	/** Load polygon markers */
	loadMarkers?: boolean;

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
	try {
		const apiBase = options.apiBaseUrl || '';
		// Fetch polygons from public API (returns GeoJSON FeatureCollection)
		const response = await fetch(`${apiBase}/api/where/polygons`);
		if (!response.ok) {
			console.error('Failed to fetch polygon markers:', response.status);
			return;
		}

		const polygonData = await response.json();

		// Calculate centroids for global view markers from the GeoJSON features
		const markers = (polygonData.features || [])
			.map(
				(feature: {
					id: string;
					geometry: { coordinates: number[][][] };
					properties: Record<string, unknown>;
				}) => {
					const coords = feature.geometry?.coordinates || [[]];
					const points = coords[0] || [];

					// Calculate centroid from polygon coordinates
					let centroid: [number, number];
					if (points.length > 0) {
						const sum = points.reduce(
							(acc, pt) => {
								return [acc[0] + pt[0], acc[1] + pt[1]] as [number, number];
							},
							[0, 0] as [number, number]
						);
						centroid = [sum[0] / points.length, sum[1] / points.length];
					} else {
						// Fallback to land GPS coordinates from properties
						const props = feature.properties || {};
						centroid = [Number(props.gpsLon) || 0, Number(props.gpsLat) || 0];
					}

					return {
						type: 'Feature',
						geometry: { type: 'Point', coordinates: centroid },
						properties: {
							polygonId: feature.id,
							landId: feature.properties?.landId,
							landName: feature.properties?.landName,
							polygonNotes: feature.properties?.polygonNotes
						}
					} satisfies Feature<Point, GeoJsonProperties>;
				}
			)
			.filter((marker: Feature<Point, GeoJsonProperties>) => {
				// Only include markers with valid coordinates
				const coords = marker.geometry.coordinates;
				return Math.abs(coords[0]) >= 1 && Math.abs(coords[1]) >= 1;
			});

		const geojson: FeatureCollection<Point, GeoJsonProperties> = {
			type: 'FeatureCollection',
			features: markers
		};

		const sourceId = options.compact ? 'hero-markers' : 'polygon-markers';

		console.log(`📍 Loaded ${geojson.features.length} polygon markers`);

		const pinConfig: ClusteredPinsConfig = {
			id: sourceId,
			data: geojson,
			maxZoom: options.compact ? undefined : 8,
			pointColor: '#11b4da',
			onPointClick: (feature) => {
				// Only enable click actions in non-compact (full map) mode
				if (!options.compact) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const coordinates = (feature.geometry as any).coordinates.slice();
					const properties = feature.properties;

					if (!properties) return;

					// Fly to the marker location
					map.flyTo({
						center: coordinates,
						zoom: 12,
						essential: true
					});

					// Show popup with polygon info
					new mapboxgl.Popup()
						.setLngLat(coordinates)
						.setHTML(
							`<div class="tooltip-container">
								<div class="marker-popup-title">${properties.landName || 'Unnamed Area'}</div>
								<span>______________</span>
								
								<div class="marker-popup-subtitle">${properties.landId}</div>
							</div>`
						)
						.addTo(map);
				}
			}
		};

		addClusteredPins(map, pinConfig);
		console.log('✅ Polygon markers layer added successfully (Clustered via Shared Utility)');
	} catch (error) {
		console.error('Error adding markers layer:', error);
	}
}

/**
 * Helper to start globe auto-rotation
 */
function startRotation(
	map: mapboxgl.Map,
	options: MapOptions,
	userInteractingRef: { current: boolean }
): void {
	const degreesPerSecond = options.rotationSpeed ?? 1.5;
	const maxSpinZoom = 4; // Stop rotating at zoom 4 and above

	function spinGlobe() {
		if (!map || userInteractingRef.current) return;
		if (map.getZoom() >= maxSpinZoom) return;

		const center = map.getCenter();
		center.lng -= degreesPerSecond;
		map.easeTo({ center, duration: 1000, easing: (n) => n });
	}

	// When animation finishes, spin again
	map.on('moveend', spinGlobe);

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
	loadClaimLayers: false,
	loadMarkers: false,
	globeProjection: false,
	autoRotate: false,
	rotationSpeed: 2,
	scrollZoom: true,
	initialZoom: 2,
	initialCenter: [38.32379156163088, -4.920169086710128] // Tanzania
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
	// Data layers
	loadClaimLayers: true,
	loadMarkers: true,
	// Globe features
	globeProjection: true,
	autoRotate: true,
	rotationSpeed: 2,
	// General
	scrollZoom: true,
	initialZoom: 2,
	initialCenter: [38.32379156163088, -4.920169086710128]
};

/**
 * Preset options for compact hero globe mode (homepage)
 */
export const compactGlobeOptions: MapOptions = {
	compact: true,
	loadMarkers: true,
	globeProjection: true,
	autoRotate: true,
	rotationSpeed: 1.5,
	scrollZoom: false,
	hideLabels: true,
	initialZoom: 1,
	initialCenter: [38.32, -4.92]
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

	if (!mapboxAccessToken) {
		console.error('Mapbox access token is required');
		return () => {};
	}

	mapboxgl.accessToken = mapboxAccessToken;

	// Track user interaction for rotation pause
	const userInteractingRef = { current: false };

	const map = new mapboxgl.Map({
		container,
		style: opts.style || defaultSatStyle,
		center: opts.initialCenter,
		zoom: opts.initialZoom,
		...(opts.globeProjection ? { projection: 'globe' } : {}),
		interactive: true
	});

	// Configure scroll zoom
	if (!opts.scrollZoom) {
		map.scrollZoom.disable();
	}

	// Track user interaction for auto-rotation
	if (opts.autoRotate) {
		map.on('mousedown', () => {
			userInteractingRef.current = true;
			opts.onUserInteractionStart?.();
		});
		map.on('mouseup', () => {
			userInteractingRef.current = false;
			opts.onUserInteractionEnd?.();
		});
		map.on('dragend', () => {
			userInteractingRef.current = false;
			opts.onUserInteractionEnd?.();
		});
	}

	// Add fog for globe projection
	if (opts.globeProjection) {
		map.on('style.load', () => {
			// If explicitly requesting transparent/white background (custom flag)
			if (opts['transparentBackground']) {
				map.setFog({
					color: 'white', // Lower atmosphere white
					'high-color': 'white', // Upper atmosphere white
					'horizon-blend': 0.05,
					'space-color': 'white', // Space white
					'star-intensity': 0 // No stars
				});
				return;
			}

			const isSatellite = (opts.style || defaultSatStyle).includes('satellite');
			if (isSatellite) {
				map.setFog({
					color: 'rgb(186, 210, 235)',
					'high-color': 'rgb(36, 92, 223)',
					'horizon-blend': 0.004,
					'space-color': 'rgb(11, 11, 25)',
					'star-intensity': 0.6
				});
			} else {
				// Fallback generic light fog
				map.setFog({
					color: 'white',
					'high-color': 'white',
					'horizon-blend': 0.05,
					'space-color': '#f8f9fa',
					'star-intensity': 0
				});
			}
		});
	}

	// Add controls (only in non-compact mode)
	if (opts.showStyleControl) {
		map.addControl(new CustomStyleControl(defaultStyleOptions, 'satellite'), 'top-left');
	}

	if (opts.showNavigation) {
		const nc = new mapboxgl.NavigationControl();
		map.addControl(nc, 'top-left');
	}

	// Hide labels (country/continent/place names) if requested
	if (opts.hideLabels) {
		map.on('style.load', () => {
			const layers = map.getStyle()?.layers || [];
			layers.forEach((layer) => {
				// Hide all label/symbol layers
				if (layer.type === 'symbol' && layer.id.includes('label')) {
					map.setLayoutProperty(layer.id, 'visibility', 'none');
				}
			});
		});
	}

	// Setup map layers on load
	map.on('load', async () => {
		map.resize(); // Force resize to ensure canvas fills container
		console.log(
			opts.compact ? '🌍 Hero globe loaded' : '🗺️ Map loaded, starting to load layers...'
		);

		// Load core business claim layers (with viewport-based fetching)
		if (opts.loadClaimLayers) {
			await addClaimLayers(map);
		}

		// Add markers layer for global view
		if (opts.loadMarkers) {
			await addMarkersLayer(map, opts);
		}

		// Get geographic layer configs (data will be lazy-loaded when user toggles on)
		if (opts.showGeoToggle) {
			const geoConfigs = getGeographicLayerConfigs();
			addgeoToggle(map, geoConfigs);
		}

		// Add draw controls for creating and editing features
		if (opts.showDrawTools) {
			addDrawControls(map);
		}

		// Start auto-rotation for globe mode
		if (opts.autoRotate) {
			startRotation(map, opts, userInteractingRef);
		}

		console.log(opts.compact ? '🌍 Hero globe ready!' : '🎉 Map initialization complete!');
	});

	// Return cleanup function
	return () => map.remove();
}
