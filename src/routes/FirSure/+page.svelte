<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeMap } from '$lib/components/mapParent';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import '@mapbox-controls/styles/src/index.css';
	import 'mapbox-gl-opacity/dist/mapbox-gl-opacity.css';

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

<style>
	.viewport-layout {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.demo-map-area {
		display: flex;
		border-radius: 0.2rem;
		border: 1rem solid rgba(255, 255, 255, 0.1);
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
		box-shadow: 0.2rem 0.2rem 1.75rem rgba(35, 31, 31, 0.55);
		z-index: 1;
	}
</style>
