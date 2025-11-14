import mapboxgl from 'mapbox-gl';
import StylesControl from '@mapbox-controls/styles';
import { addgeoToggle } from './mapPlugins/geoToggle';
import { addDrawControls } from './mapPlugins/drawToolTip';
import { getGeographicLayerConfigs } from './mapPlugins/geographicLayers';
import { addClaimLayers } from './mapPlugins/claimLayers';
import { supabase } from '$lib/supabase';
import type { FeatureCollection, Feature, Point, GeoJsonProperties } from 'geojson';
// 🔥️ https://docs.mapbox.com/mapbox-gl-js/plugins/

const streetStyle = 'mapbox://styles/mapbox/streets-v12';
const defaultSatStyle = 'mapbox://styles/mapbox/satellite-streets-v12';

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
async function addMarkersLayer(map: mapboxgl.Map): Promise<void> {
	try {
		// Fetch polygons directly from Supabase
		const { data: polygons, error } = await supabase.from('polygonTable').select(`
				polygonId,
				landId,
				landName,
				polygonNotes,
				coordinates,
				landTable (
					gpsLat,
					gpsLon
				)
			`);

		if (error) {
			console.error('Failed to fetch polygon markers:', error);
			return;
		}

		// Calculate centroids for global view markers
		const markers = (polygons || [])
			.map((polygon) => {
				const coords = polygon.coordinates ? JSON.parse(polygon.coordinates) : [[]];
				const points = coords[0] || [];

				// Calculate centroid from polygon coordinates
				let centroid: [number, number];
				if (points.length > 0) {
					const sum = points.reduce(
						(acc: [number, number], pt: number[]) => {
							return [acc[0] + pt[0], acc[1] + pt[1]];
						},
						[0, 0]
					);
					centroid = [sum[0] / points.length, sum[1] / points.length];
				} else {
					// Fallback to land GPS coordinates
					const land = polygon.landTable?.[0];
					centroid = [land?.gpsLon || 0, land?.gpsLat || 0];
				}

				return {
					type: 'Feature',
					geometry: { type: 'Point', coordinates: centroid },
					properties: {
						polygonId: polygon.polygonId,
						landId: polygon.landId,
						landName: polygon.landName,
						polygonNotes: polygon.polygonNotes
					}
				} satisfies Feature<Point, GeoJsonProperties>;
			})
			.filter((marker) => {
				// Only include markers with valid coordinates
				const coords = marker.geometry.coordinates;
				return coords[0] !== 0 || coords[1] !== 0;
			});

		const geojson: FeatureCollection<Point, GeoJsonProperties> = {
			type: 'FeatureCollection',
			features: markers
		};

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
						`<div class="tooltip-container">
							<div class="marker-popup-title">${properties.landName || 'Unnamed Area'}</div>
							<div class="marker-popup-subtitle">${properties.landId}</div>
						</div>`
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

		// Load core business claim layers (with viewport-based fetching)
		await addClaimLayers(map);

		// Get geographic layer configs (data will be lazy-loaded when user toggles on)
		const geoConfigs = getGeographicLayerConfigs();

		// Add markers layer for global view
		await addMarkersLayer(map);

		// Add geographic layer toggle control (only for geographic reference layers)
		addgeoToggle(map, geoConfigs);

		// Add draw controls for creating and editing features
		addDrawControls(map);

		console.log('🎉 Map initialization complete!');
	});

	// Return cleanup function
	return () => map.remove();
}
