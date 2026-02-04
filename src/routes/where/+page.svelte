<script lang="ts">
	import { onMount } from "svelte";
	import { PUBLIC_API_URL } from "$env/static/public";
	import "mapbox-gl/dist/mapbox-gl.css";
	import {
		fullMapOptions,
		initializeMap,
	} from "../../lib/components/map/mapOrchestrator";
	import InfoPanel from "../../lib/components/map/InfoPanel.svelte";

	let mapContainer: HTMLDivElement;
	let selectedFeature: any = null;

	onMount(() => {
		console.log("🗺️ Map component mounting...");
		fullMapOptions.autoRotate = true;
		// Initialize map with all features enabled for /where page
		const cleanup = initializeMap(mapContainer, {
			...fullMapOptions,
			apiBaseUrl: PUBLIC_API_URL.replace(/\/$/, ""),
			onFeatureSelect: (feature) => {
				selectedFeature = feature;
			},
		});

		return cleanup;
	});
</script>

<div class="viewport-layout">
	<main class="demo-map-area">
		<div bind:this={mapContainer} class="mapbox-map"></div>
		<InfoPanel
			bind:selectedFeature
			onClose={() => (selectedFeature = null)}
		/>
	</main>
</div>

<style>
	/* Push map controls down to avoid navbar overlap */
	:global(.mapboxgl-ctrl-top-left) {
		top: 60px;
	}
</style>
