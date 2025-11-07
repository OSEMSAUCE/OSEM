import mapboxgl from 'mapbox-gl';
import StylesControl from '@mapbox-controls/styles';
import { addPolygonToggle } from './mapPlugins/polygonToggle';
import { addDrawControls } from './mapPlugins/drawToolTip';

// 🔥️ https://docs.mapbox.com/mapbox-gl-js/plugins/


const streetStyle = 'mapbox://styles/mapbox/streets-v12';
const defaultSatStyle = 'mapbox://styles/mapbox/satellite-streets-v12';



export interface PolygonConfig {
	id: string;
	path: string;
	name: string;
	fillColor: string;
	outlineColor: string;
	opacity: number;
}

// Helper function to add a polygon source and layers
async function addPolygonLayer(map: mapboxgl.Map, config: PolygonConfig): Promise<void> {
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
}

// Define polygon configurations
const polygons: PolygonConfig[] = [
	{
		id: 'restorPoly',
		path: '/polygons/restorPoly2.geojson',
		name: 'Restoration',
		fillColor: '#088',
		outlineColor: '#000',
		opacity: 0.3
	},
	{
		id: 'usEco',
		path: '/polygons/usEco.geojson',
		name: 'US Eco',
		fillColor: '#8028DE',
		outlineColor: '#fff',
		opacity: 0.5
	},
	{
		id: 'bcTest',
		path: '/polygons/bc_test_poly.geojson',
		name: 'BC Test',
		fillColor: '#f84',
		outlineColor: '#a52',
		opacity: 0.5
	},
	{
		id: 'stagingPolygons',
		path: '/api/polygons',
		name: 'Staging Projects',
		fillColor: '#00CED1',
		outlineColor: '#008B8B',
		opacity: 0.4
	}
];

export function initializeMap(container: HTMLDivElement): () => void {
	const mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;

	if (!mapboxAccessToken) {
		console.error('Mapbox access token is required');
		return () => {};
	}

	mapboxgl.accessToken = mapboxAccessToken;

	const map = new mapboxgl.Map({
		container,
		style: defaultSatStyle,
		center: [-118.842506, 47.58635],
		zoom: 5
	});

	// Add style control
	map.addControl(
		new StylesControl({
			styles: [
				{
					label: 'Streets',
					styleName: 'Mapbox Streets',
					styleUrl: streetStyle
				},
				{
					label: 'Satellite',
					styleName: 'Mapbox Satellite Streets',
					styleUrl: defaultSatStyle
				}
			]
		}),
		'top-left'
	);

	// Add navigation control
	const nc = new mapboxgl.NavigationControl();
	map.addControl(nc, 'top-left');

	// Setup map layers on load
	map.on('load', async () => {
		// Load all polygons
		await Promise.all(polygons.map((p) => addPolygonLayer(map, p)));

		// Add polygon toggle plugin (handles opacity control and outline syncing)
		addPolygonToggle(map, polygons);

		// Add draw controls for creating and editing features
		addDrawControls(map);
	});

	// Return cleanup function
	return () => map.remove();
}
