<script lang="ts">
	import { onMount } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import StylesControl from '@mapbox-controls/styles';
	import '@mapbox-controls/styles/src/index.css';
	// module import
	import 'mapbox-gl-opacity/dist/mapbox-gl-opacity.css';
	import OpacityControl from 'mapbox-gl-opacity';

	// import geojson from '../polygons/restorPoly2.geojson';

	// or with compact view and default styles (streets and satellite)

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
			zoom: 10
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
			// Existing polygon
			const response = await fetch('/polygons/restorPoly2.geojson');
			const geojson = await response.json();
			map.addSource('restorPoly', {
				type: 'geojson',
				data: geojson
			});
			map.addLayer({
				id: 'restorPoly-fill',
				type: 'fill',
				source: 'restorPoly',
				paint: {
					'fill-color': '#088'
					// 'fill-opacity': 0.5
				}
			});
			

			// Eco L3 polygon
			const ecoResponse = await fetch('/polygons/usEco.geojson');
			const ecoGeojson = await ecoResponse.json();
			map.addSource('ecoL3', {
				type: 'geojson',
				data: ecoGeojson
			});
			map.addLayer({
				id: 'ecoL3-fill',
				type: 'fill',
				source: 'ecoL3',
				paint: {
					'fill-color': '#0a0',
					'fill-opacity': 0.3
				}
			});
			map.addLayer({
				id: 'ecoL3-outline',
				type: 'line',
				source: 'ecoL3',
				paint: {	
					'line-color': '#2D373C', 
					'line-width': 2
				}
			});
			
			// map.addLayer({
			// 	id: 'restorPoly-outline',
			// 	type: 'line',
			// 	source: 'restorPoly',
			// 	paint: {
			// 		'line-color': '#000',
			// 		'line-width': 2
			// 	}
			// });
			//          // BaseLayer
			// const mapBaseLayer = {
			//     m_mono: "MIERUNE Mono",
			//     m_color: "MIERUNE Color"
			// };

			// OverLayer
			const mapOverLayer = {
				'restorPoly-fill': 'OpenStreetMap',
				'restorPoly-outline': 'GSI Pale',
				'ecoL3-fill': 'Eco L3',
				'ecoL3-outline': 'Eco L3'
			};

			// OpacityControl
			let Opacity = new OpacityControl({
				// baseLayers: mapBaseLayer,
				overLayers: mapOverLayer,
				opacityControl: false
			});
			map.addControl(Opacity, 'top-right');

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
