import type mapboxgl from 'mapbox-gl';

export interface ClaimLayerConfig {
	id: string;
	path: string;
	name: string;
	fillColor: string;
	outlineColor: string;
	opacity: number;
	isDynamic?: boolean;
	minZoom?: number;
	maxZoom?: number;
}

// Core business claim layers
const claimLayers: ClaimLayerConfig[] = [
	{
		id: 'restorPoly',
		path: '/claims/restorPoly2.geojson',
		name: 'Restoration',
		fillColor: '#088',
		outlineColor: '#000',
		opacity: 0.3,
		isDynamic: false
	},
	{
		id: 'stagingPolygons',
		path: '/api/polygons',
		name: 'Staging Projects',
		fillColor: '#00CED1',
		outlineColor: '#008B8B',
		opacity: 0.4,
		isDynamic: true,
		minZoom: 8,
		maxZoom: 22
	}
];

// Helper function to add a static claim layer
async function addStaticClaimLayer(
	map: mapboxgl.Map,
	config: ClaimLayerConfig
): Promise<void> {
	const response = await fetch(config.path);
	const geojson = await response.json();

	map.addSource(config.id, { type: 'geojson', data: geojson });

	map.addLayer({
		id: `${config.id}-fill`,
		type: 'fill',
		source: config.id,
		paint: {
			'fill-color': config.fillColor,
			'fill-opacity': config.opacity
		}
	});

	map.addLayer({
		id: `${config.id}-outline`,
		type: 'line',
		source: config.id,
		paint: {
			'line-color': config.outlineColor,
			'line-width': 1.5,
			'line-opacity': 1
		}
	});

	console.log(`🏞️ Static claim layer loaded: ${config.name}`);
}

// Helper function to add a dynamic claim layer (viewport-based)
async function addDynamicClaimLayer(
	map: mapboxgl.Map,
	config: ClaimLayerConfig
): Promise<void> {
	// Initialize with empty GeoJSON
	map.addSource(config.id, {
		type: 'geojson',
		data: { type: 'FeatureCollection', features: [] }
	});

	map.addLayer({
		id: `${config.id}-fill`,
		type: 'fill',
		source: config.id,
		paint: {
			'fill-color': config.fillColor,
			'fill-opacity': config.opacity
		}
	});

	map.addLayer({
		id: `${config.id}-outline`,
		type: 'line',
		source: config.id,
		paint: {
			'line-color': config.outlineColor,
			'line-width': 1.5,
			'line-opacity': 1
		}
	});

	// Set zoom range if specified
	if (config.minZoom !== undefined && config.maxZoom !== undefined) {
		map.setLayerZoomRange(`${config.id}-fill`, config.minZoom, config.maxZoom);
		map.setLayerZoomRange(`${config.id}-outline`, config.minZoom, config.maxZoom);
		console.log(`✅ ${config.name} zoom range set (${config.minZoom}-${config.maxZoom})`);
	}

	console.log(`📐 Dynamic claim layer initialized: ${config.name}`);
}

// Helper function to update URL with current viewport
function updateViewportURL(map: mapboxgl.Map): void {
	const zoom = map.getZoom();
	const bounds = map.getBounds();

	if (!bounds) return;

	const sw = bounds.getSouthWest();
	const ne = bounds.getNorthEast();

	const params = new URLSearchParams({
		zoom: zoom.toFixed(1),
		minLat: sw.lat.toFixed(6),
		maxLat: ne.lat.toFixed(6),
		minLng: sw.lng.toFixed(6),
		maxLng: ne.lng.toFixed(6)
	});

	const newUrl = `${window.location.pathname}?${params.toString()}`;
	window.history.replaceState({}, '', newUrl);
}

// Helper function to fetch polygons based on viewport bounds
async function fetchPolygonsByBounds(
	map: mapboxgl.Map,
	config: ClaimLayerConfig,
	minZoomThreshold: number = 8
): Promise<void> {
	const zoom = map.getZoom();

	// Only fetch if zoom is at or above threshold
	if (zoom < minZoomThreshold) {
		console.log(`⏸️ Zoom ${zoom.toFixed(1)} below threshold ${minZoomThreshold}, skipping fetch`);
		return;
	}

	const bounds = map.getBounds();
	if (!bounds) {
		console.error('Unable to get map bounds');
		return;
	}

	const sw = bounds.getSouthWest();
	const ne = bounds.getNorthEast();

	const params = new URLSearchParams({
		zoom: zoom.toFixed(1),
		minLat: sw.lat.toFixed(6),
		maxLat: ne.lat.toFixed(6),
		minLng: sw.lng.toFixed(6),
		maxLng: ne.lng.toFixed(6)
	});

	console.log(`🔄 Fetching ${config.name} for viewport: ${params.toString()}`);

	try {
		const response = await fetch(`${config.path}?${params.toString()}`);
		if (!response.ok) {
			console.error(`Failed to fetch ${config.name}:`, response.status);
			return;
		}
		const geojson = await response.json();
		console.log(`📐 Loaded ${geojson.features?.length || 0} ${config.name} for viewport`);

		// Update the source
		const source = map.getSource(config.id) as mapboxgl.GeoJSONSource;
		if (source) {
			source.setData(geojson);
		}
	} catch (error) {
		console.error(`Error fetching ${config.name} by bounds:`, error);
	}
}

/**
 * Adds core business claim layers to the map
 * Includes both static claims and dynamic viewport-based loading
 */
export async function addClaimLayers(map: mapboxgl.Map): Promise<ClaimLayerConfig[]> {
	console.log('🏞️ Loading claim layers...');

	// Load static claim layers
	const staticLayers = claimLayers.filter((layer) => !layer.isDynamic);
	await Promise.all(staticLayers.map((layer) => addStaticClaimLayer(map, layer)));

	// Initialize dynamic claim layers
	const dynamicLayers = claimLayers.filter((layer) => layer.isDynamic);
	await Promise.all(dynamicLayers.map((layer) => addDynamicClaimLayer(map, layer)));

	// Setup viewport-based fetching for dynamic layers
	dynamicLayers.forEach((config) => {
		// Initial fetch
		fetchPolygonsByBounds(map, config);

		// Add event listeners for viewport changes
		map.on('moveend', () => {
			updateViewportURL(map);
			fetchPolygonsByBounds(map, config);
		});

		map.on('zoomend', () => {
			updateViewportURL(map);
			fetchPolygonsByBounds(map, config);
		});
	});

	// Initial URL update
	updateViewportURL(map);

	console.log('✅ All claim layers loaded');
	return claimLayers;
}
