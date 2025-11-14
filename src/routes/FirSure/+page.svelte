<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeMap } from '$lib/components/map/mapParent';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import '@mapbox-controls/styles/src/index.css';
	import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
	import '$lib/components/map/mapStyles.css';

	let mapContainer: HTMLDivElement;

	onMount(() => {
		const cleanup = initializeMap(mapContainer);
		return cleanup;
	});
</script>

<div class="viewport-layout">
	<div>
		<div id="map"></div>
	</div>
	<main class="demo-map-area">
		<div bind:this={mapContainer} class="mapbox-map"></div>
	</main>
</div>
