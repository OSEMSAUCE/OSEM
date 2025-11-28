<script lang="ts">
	import { onMount } from 'svelte';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { initializeMap } from '$lib/subwoof/components/map/mapParent';

	let mapContainer: HTMLDivElement;

	onMount(() => {
		console.log('🗺️ Map component mounting...');

		// Initialize map with all layers (polygons, markers, controls)
		// Data is fetched from PUBLIC_API_URL (works for both ReTreever and OSEM)
		const cleanup = initializeMap(mapContainer);

		return cleanup;
	});
</script>

<div class="viewport-layout">
	<main class="demo-map-area">
		<div bind:this={mapContainer} class="mapbox-map"></div>
	</main>
</div>
