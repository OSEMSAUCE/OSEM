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
	type?: string;
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
	console.log("🌏️"+JSON.stringify( geojson)) 
}

// Helper function to add markers layer for polygons
async function addMarkersLayer(map: mapboxgl.Map): Promise<void> {
	try {
		const response = await fetch('/api/polygons/markers');
		if (!response.ok) {
			console.error('Failed to fetch markers:', response.status);
			return;
		}
		const geojson = await response.json();
		console.log(`📍 Loaded ${geojson.features.length} polygon markers`);

		// Add source for markers
		map.addSource('polygon-markers', { type: 'geojson', data: geojson });

		// Add circle layer for markers (visible at low zoom)
		map.addLayer({
			id: 'polygon-markers-circle',
			type: 'circle',
			source: 'polygon-markers',
			maxzoom: 8, // Hide markers when zoomed in past zoom level 8
			paint: {
				'circle-radius': 6,
				'circle-color': '#00CED1',
				'circle-stroke-width': 2,
				'circle-stroke-color': '#fff',
				'circle-opacity': 0.9
			}
		});

		// Add click handler to fly to polygon
		map.on('click', 'polygon-markers-circle', (e) => {
			if (e.features && e.features.length > 0) {
				const feature = e.features[0];
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
						`<strong>${properties.landName || 'Unnamed Area'}</strong><br/>
						<small>${properties.landId}</small>`
					)
					.addTo(map);
			}
		});

		// Change cursor on hover
		map.on('mouseenter', 'polygon-markers-circle', () => {
			map.getCanvas().style.cursor = 'pointer';
		});

		map.on('mouseleave', 'polygon-markers-circle', () => {
			map.getCanvas().style.cursor = '';
		});

		console.log('✅ Polygon markers layer added successfully');
	} catch (error) {
		console.error('Error adding markers layer:', error);
	}
}

// Define polygon configurations
const polygons: PolygonConfig[] = [
	{
		id: 'restorPoly',
		path: '/polygons/restorPoly2.geojson',
		name: 'Restoration',
		fillColor: '#088',
		outlineColor: '#000',
		opacity: 0.3,
		type: 'claim'

	},
	{
		id: 'usEco',
		path: '/polygons/usEco.geojson',
		name: 'US Eco',
		fillColor: '#8028DE',
		outlineColor: '#fff',
		opacity: 0.3,
		type: 'geography'
	},
	{
		id: 'bcTest',
		path: '/polygons/bc_test_poly.geojson',
		name: 'BC Test',
		fillColor: '#f84',
		outlineColor: '#a52',
		opacity: 0.5,
		type: 'geography'
	},
	{
		id: 'stagingPolygons',
		path: '/api/polygons',
		name: 'Staging Projects',
		fillColor: '#00CED1',
		outlineColor: '#008B8B',
		opacity: 0.4,
		type: 'claim'
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
		center: [38.32379156163088, -4.920169086710128], // Tanzania - staging polygons location
		zoom: 9
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
		console.log('🗺️ Map loaded, starting to load layers...');

		const defaultPolygons = polygons.filter( item => item.type == 'claim' );

		// Load default polygons
		await Promise.all(defaultPolygons.map((p) => addPolygonLayer(map, p)));
		console.log('✅ All polygon layers loaded');

		// Add markers layer for global view
		await addMarkersLayer(map);

		// Check if marker source was added
		const markerSource = map.getSource('polygon-markers');
		console.log('🔍 Marker source exists:', !!markerSource);

		// Check if marker layer was added
		const markerLayer = map.getLayer('polygon-markers-circle');
		console.log('🔍 Marker layer exists:', !!markerLayer);

		// List all sources
		const style = map.getStyle();
		console.log('📋 All sources:', Object.keys(style.sources));
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		console.log('📋 All layers:', style.layers.map((l: any) => l.id));

		// Make staging polygons only visible at zoom 8+ (when markers hide)
		map.setLayoutProperty('stagingPolygons-fill', 'visibility', 'visible');
		map.setLayoutProperty('stagingPolygons-outline', 'visibility', 'visible');
		if (map.getLayer('stagingPolygons-fill')) {
			map.setLayerZoomRange('stagingPolygons-fill', 8, 22);
			console.log('✅ Staging polygons zoom range set (8-22)');
		}
		if (map.getLayer('stagingPolygons-outline')) {
			map.setLayerZoomRange('stagingPolygons-outline', 8, 22);
		}

		// Add polygon toggle plugin (handles opacity control and outline syncing)
		addPolygonToggle(map, polygons);

		// Add draw controls for creating and editing features
		addDrawControls(map);

		console.log('🎉 Map initialization complete!');
	});

	// Return cleanup function
	return () => map.remove();
}
