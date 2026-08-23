<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { PUBLIC_API_URL } from "$env/static/public";
	import "mapbox-gl/dist/mapbox-gl.css";
	import InfoPanel from "../../lib/components/map/InfoPanel.svelte";
	import {
		fullMapOptions,
		initializeMap,
	} from "../../lib/components/map/mapOrchestrator";
	import {
		createCentroidUrl,
		extractCentroidFromJson,
	} from "../../lib/utils/centroidUrls";

	interface PageData {
		targetFeature?: any | null;
		coordinates?: {
			lng: number;
			lat: number;
			zoom: number;
		} | null;
	}

	let { data }: { data: PageData } = $props();
	let mapContainer: HTMLDivElement;
	let selectedFeature: any = $state(null);

	onMount(() => {
		console.log("🗺️ Map component mounting...");

		// Configure map options - disable hash to preserve landName URLs
		const mapOptions = {
			...fullMapOptions,
			enableHash: false, // Disable automatic hash updates
			autoRotate: !data.coordinates, // Disable rotation if we have a target
		};

		// Set initial coordinates if provided
		if (data.coordinates) {
			mapOptions.initialCenter = [
				data.coordinates.lng,
				data.coordinates.lat,
			];
			mapOptions.initialZoom = data.coordinates.zoom;
		}

		// Initialize map with all features enabled for /where page
		const cleanup = initializeMap(mapContainer, {
			...mapOptions,
			apiBaseUrl: PUBLIC_API_URL.replace(/\/$/, ""),
			onFeatureSelect: (feature) => {
				selectedFeature = feature;

				// Update URL with landName when feature is selected
				if (feature?.landName) {
					const newUrl = `/where?land=${encodeURIComponent(feature.landName)}`;
					goto(newUrl, { replaceState: true, noScroll: true });
				}
			},
		});

		// Auto-select target feature if provided from server
		if (data.targetFeature) {
			selectedFeature = data.targetFeature;
		}

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
