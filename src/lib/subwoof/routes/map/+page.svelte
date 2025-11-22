<script lang="ts">
	import { onMount } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';

	let mapContainer: HTMLDivElement;
	let map: mapboxgl.Map | null = null;

	onMount(() => {
		console.log('🗺️ Map component mounting...');

		const mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;

		if (!mapboxAccessToken) {
			console.error('❌ Mapbox access token is missing!');
			return;
		}

		console.log('✅ Mapbox token found:', mapboxAccessToken.substring(0, 20) + '...');

		mapboxgl.accessToken = mapboxAccessToken;

		try {
			map = new mapboxgl.Map({
				container: mapContainer,
				style: 'mapbox://styles/mapbox/satellite-streets-v12',
				center: [38.32379156163088, -4.920169086710128], // Tanzania
				zoom: 9
			});

			// Add navigation controls
			map.addControl(new mapboxgl.NavigationControl(), 'top-left');

			map.on('load', () => {
				console.log('🎉 Map loaded successfully!');
			});

			map.on('error', (e) => {
				console.error('❌ Map error:', e);
			});

			console.log('✅ Map initialized');
		} catch (error) {
			console.error('❌ Error creating map:', error);
		}

		return () => {
			console.log('🧹 Cleaning up map...');
			if (map) {
				map.remove();
			}
		};
	});
</script>

<div class="viewport-layout">
	<main class="demo-map-area">
		<div bind:this={mapContainer} class="mapbox-map"></div>
	</main>
</div>
