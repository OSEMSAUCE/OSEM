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
				style: 'mapbox://styles/mapbox/streets-v12',
				center: [-74.5, 40], // New York area
				zoom: 9
			});

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

<div style="width: 100vw; height: 100vh;">
	<div bind:this={mapContainer} style="width: 100%; height: 100%;"></div>
</div>
