<script lang="ts">
	import { onMount } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import StylesControl from '@mapbox-controls/styles';
	import '@mapbox-controls/styles/src/index.css';
	// module import
	import 'mapbox-gl-opacity/dist/mapbox-gl-opacity.css';
	import OpacityControl from 'mapbox-gl-opacity';
	// Removed turf import as it's not currently used
	// import type { Feature, FeatureCollection, Polygon } from 'geojson';

	const mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;
	let mapContainer: HTMLDivElement;
	let map: mapboxgl.Map;

	const streetStyle = 'mapbox://styles/mapbox/streets-v12';
	const defaultSatStyle = 'mapbox://styles/mapbox/satellite-streets-v12';

	onMount(() => {
		if (!mapboxAccessToken) {
			console.error('Mapbox access token is required');
			return;
		}
		mapboxgl.accessToken = mapboxAccessToken;
		map = new mapboxgl.Map({
			container: mapContainer,
			style: defaultSatStyle,
			center: [-118.842506, 47.58635],
			zoom: 6
		});
		map.addControl(new mapboxgl.NavigationControl(), 'top-right');
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

		// Fetch GeoJSON and add to map
		map.on('load', async () => {
			interface PolygonConfig {
				id: string;
				path: string;
				name: string;
				fillColor: string;
				outlineColor: string;
				opacity: number;
			}

			// Helper function to add a polygon source and layers
			const addPolygonLayer = async (config: PolygonConfig) => {
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
			};

			// Define polygon configurations
			const polygons = [
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
				}
			];

			// Load all polygons
			await Promise.all(polygons.map((p) => addPolygonLayer(p)));

			// Configure OpacityControl with all layers
			const mapOverLayer: { [key: string]: string } = {};
			polygons.forEach((p) => {
				mapOverLayer[`${p.id}-fill`] = p.name;
			});

			// Add OpacityControl
			try {
				const opacityControl = new OpacityControl({
					overLayers: mapOverLayer,
					opacityControl: true
				});
				map.addControl(opacityControl, 'top-right');
				console.log('OpacityControl added successfully with combined layers.');
			} catch (e) {
				console.error('Failed to add OpacityControl:', e);
			}

			// Listen for changes and sync outline layers
			map.on('styledata', () => {
				polygons.forEach((p) => {
					const fillLayerId = `${p.id}-fill`;
					const outlineLayerId = `${p.id}-outline`;

					// Ensure both layers exist before trying to sync them
					if (map.getLayer(fillLayerId) && map.getLayer(outlineLayerId)) {
						const fillVisibility = map.getLayoutProperty(fillLayerId, 'visibility');

						// Force the outline to match the fill's visibility but keep full opacity
						map.setPaintProperty(outlineLayerId, 'line-opacity', 1); // Always fully opaque
						map.setLayoutProperty(outlineLayerId, 'visibility', fillVisibility);
					}
				});
			});

			// NavigationControl
			let nc = new mapboxgl.NavigationControl();
			map.addControl(nc, 'top-left');
		});

		return () => map.remove();
	});
</script>

<div class="viewport-layout">
	<div>
		<!-- <button onclick={toggleSatellite}>
      {isSatellite ? 'Street' : 'Satellite'}
    </button> -->
		<div id="map"></div>
	</div>
	<main class="demo-map-area">
		<div bind:this={mapContainer} class="mapbox-map"></div>
		<!-- <footer class="demo-footer-overlay">
			
		</footer> -->
	</main>
</div>

<style>
	.viewport-layout {
		display: flex;
		flex-direction: column;
		/* min-height: 100vh;
		height: 100vh;
		width: 100vw; */
		overflow: hidden;
	}

	.demo-map-area {
		display: flex;
		justify-content: center;
		align-items: center;
		padding-left: 2rem;
		padding-right: 2rem;
		padding-top: 0;
		padding-bottom: 0;
		width: 100vw;
		box-sizing: border-box;
	}

	.mapbox-map {
		position: relative;
		width: 100%;
		max-width: 100vw;
		height: 85vh;
		min-height: 20rem;
		margin: 0;
		border-radius: 0.5rem;
		box-shadow: 0 0.125rem 0.75rem rgba(0,0,0,0.15);
		z-index: 1;
	}

	.demo-footer-overlay {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 7rem;
		background: var(--color-theme-2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		font-weight: 500;

		z-index: 10;
		border-top: 1px solid #0d1331;
		pointer-events: auto;
		padding-left: 2rem;
		padding-right: 2rem;
	}
</style>
