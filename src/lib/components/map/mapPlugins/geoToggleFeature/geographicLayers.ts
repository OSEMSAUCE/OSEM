// import type mapboxgl from 'mapbox-gl';

// export interface GeographicLayerConfig {
// 	id: string;
// 	path: string;
// 	name: string;
// 	fillColor: string;
// 	outlineColor: string;
// 	opacity: number;
// 	initiallyVisible?: boolean;
// }

// // Static geographic reference layers
// const geographicLayers: GeographicLayerConfig[] = [
// 	{
// 		id: 'usEco',
// 		path: '/geographic/usEco.geojson',
// 		name: 'US Eco',
// 		fillColor: '#8028DE',
// 		outlineColor: '#fff',
// 		opacity: 0.3,
// 		initiallyVisible: false
// 	},
// 	{
// 		id: 'bcTest',
// 		path: '/geographic/bc_test_poly.geojson',
// 		name: 'BC Test',
// 		fillColor: '#f84',
// 		outlineColor: '#a52',
// 		opacity: 0.5,
// 		initiallyVisible: false
// 	}
// ];

// /**
//  * Lazy loads and adds a geographic layer to the map
//  * Only fetches data when first called - use for on-demand loading
//  */
// export async function loadGeographicLayer(
// 	map: mapboxgl.Map,
// 	config: GeographicLayerConfig
// ): Promise<void> {
// 	// Check if source already exists (already loaded)
// 	if (map.getSource(config.id)) {
// 		console.log(`📍 Layer ${config.name} already loaded, skipping fetch`);
// 		return;
// 	}

// 	console.log(`📥 Fetching geographic layer: ${config.name}...`);
// 	const response = await fetch(config.path);
// 	const geojson = await response.json();

// 	map.addSource(config.id, { type: 'geojson', data: geojson });

// 	map.addLayer({
// 		id: `${config.id}-fill`,
// 		type: 'fill',
// 		source: config.id,
// 		layout: {
// 			visibility: 'visible' // Always visible when loaded
// 		},
// 		paint: {
// 			'fill-color': config.fillColor,
// 			'fill-opacity': config.opacity
// 		}
// 	});

// 	map.addLayer({
// 		id: `${config.id}-outline`,
// 		type: 'line',
// 		source: config.id,
// 		layout: {
// 			visibility: 'visible' // Always visible when loaded
// 		},
// 		paint: {
// 			'line-color': config.outlineColor,
// 			'line-width': 1.5,
// 			'line-opacity': 1
// 		}
// 	});

// 	console.log(`✅ Geographic layer loaded: ${config.name}`);
// }

// /**
//  * Returns the configuration for geographic layers WITHOUT loading data
//  * Data will be lazy-loaded when user toggles layers on
//  *
//  * TODO: Re-enable when ready to use large GeoJSON layers
//  * See: https://docs.mapbox.com/help/troubleshooting/working-with-large-geojson-data/
//  * Consider adding: tolerance, maxzoom, buffer options to addSource for performance
//  */
// export function getGeographicLayerConfigs(): GeographicLayerConfig[] {
// 	// PAUSED: Return empty array to disable geographic layers UI
// 	// Uncomment to re-enable:
// 	// return geographicLayers;
// 	return [];
// }
