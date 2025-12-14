<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_API_URL } from '$env/static/public';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { initializeMap, fullMapOptions } from '../../components/where/mapParent';

	let mapContainer: HTMLDivElement;

	onMount(() => {
		console.log('🗺️ Map component mounting...');
		fullMapOptions.autoRotate = true;
		// Initialize map with all features enabled for /where page
		const cleanup = initializeMap(mapContainer, {
			...fullMapOptions,
			apiBaseUrl: PUBLIC_API_URL.replace(/\/$/, '')
		});

		return cleanup;
	});
</script>

<div class="viewport-layout">
	<main class="demo-map-area">
		<div bind:this={mapContainer} class="mapbox-map"></div>
	</main>
</div>

<style>
	/* Push map controls down to avoid navbar overlap */
	:global(.mapboxgl-ctrl-top-left) {
		top: 60px;
	}
</style>
