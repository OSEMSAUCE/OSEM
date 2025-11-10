import type mapboxgl from 'mapbox-gl';

export interface GeographicLayerConfig {
	id: string;
	path: string;
	name: string;
	fillColor: string;
	outlineColor: string;
	opacity: number;
	initiallyVisible?: boolean;
}

// Static geographic reference layers
const geographicLayers: GeographicLayerConfig[] = [
	{
		id: 'usEco',
		path: '/polygons/usEco.geojson',
		name: 'US Eco',
		fillColor: '#8028DE',
		outlineColor: '#fff',
		opacity: 0.3,
		initiallyVisible: false
	},
	{
		id: 'bcTest',
		path: '/polygons/bc_test_poly.geojson',
		name: 'BC Test',
		fillColor: '#f84',
		outlineColor: '#a52',
		opacity: 0.5,
		initiallyVisible: false
	}
];

// Helper function to add a geographic layer
async function addGeographicLayer(
	map: mapboxgl.Map,
	config: GeographicLayerConfig
): Promise<void> {
	const response = await fetch(config.path);
	const geojson = await response.json();

	map.addSource(config.id, { type: 'geojson', data: geojson });

	map.addLayer({
		id: `${config.id}-fill`,
		type: 'fill',
		source: config.id,
		layout: {
			visibility: config.initiallyVisible ? 'visible' : 'none'
		},
		paint: {
			'fill-color': config.fillColor,
			'fill-opacity': config.opacity
		}
	});

	map.addLayer({
		id: `${config.id}-outline`,
		type: 'line',
		source: config.id,
		layout: {
			visibility: config.initiallyVisible ? 'visible' : 'none'
		},
		paint: {
			'line-color': config.outlineColor,
			'line-width': 1.5,
			'line-opacity': 1
		}
	});

	console.log(`🗺️ Geographic layer loaded: ${config.name}`);
}

/**
 * Adds static geographic reference layers to the map
 * These are toggleable layers for context/reference, not core business data
 */
export async function addGeographicLayers(map: mapboxgl.Map): Promise<GeographicLayerConfig[]> {
	console.log('📍 Loading geographic reference layers...');

	await Promise.all(geographicLayers.map((layer) => addGeographicLayer(map, layer)));

	console.log('✅ All geographic layers loaded');
	return geographicLayers;
}
