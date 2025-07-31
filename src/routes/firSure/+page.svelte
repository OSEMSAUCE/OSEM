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
			center: [-118.842506, 46.58635],
			zoom: 8
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
						'line-width': 2,
						'line-opacity': config.opacity
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
					opacity: 0.7
				},
				{
					id: 'usEco',
					path: '/polygons/usEco.geojson',
					name: 'US Eco',
					fillColor: '#8028DE',
					outlineColor: '#fff',
					opacity: 0.2
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
						const fillOpacity = map.getPaintProperty(fillLayerId, 'fill-opacity');
						const fillVisibility = map.getLayoutProperty(fillLayerId, 'visibility');

						// Force the outline to match the fill's opacity and visibility
						map.setPaintProperty(outlineLayerId, 'line-opacity', fillOpacity);
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
		<footer class="demo-footer-overlay">
			<!-- Controls panel (blank for now) -->
		</footer>
	</main>
</div>

<style>
	.viewport-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}

	.demo-map-area {
		flex: 1 1 auto;
		position: relative;
		min-height: 0;
		min-width: 0;
		overflow: hidden;
		padding-left: 2rem;
		padding-right: 2rem;
	}
	.mapbox-map {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
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
