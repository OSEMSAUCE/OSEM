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

	let mapContainer: HTMLDivElement;
	let selectedFeature: any = null;
	let mapInstance: any = null;

	onMount(() => {
		console.log("🗺️ Map component mounting...");

		// Get landName from URL parameter
		const landName = $page.url.searchParams.get("land");

		fullMapOptions.autoRotate = !landName; // Don't rotate if we have a target

		// Initialize map with all features enabled for /where page
		const cleanup = initializeMap(mapContainer, {
			...fullMapOptions,
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

		// Store map instance for feature selection
		mapInstance = cleanup?.map;

		// Auto-select feature if landName in URL
		if (landName && mapInstance) {
			// Wait for map to load, then find and select the feature
			setTimeout(() => {
				selectFeatureByLandName(landName);
			}, 1000);
		}

		return cleanup;
	});

	async function selectFeatureByLandName(landName: string) {
		if (!mapInstance) return;

		try {
			// Fetch polygon data to find the matching feature
			const response = await fetch(
				`${PUBLIC_API_URL.replace(/\/$/, "")}/api/where/polygons`,
			);
			if (!response.ok) return;

			const polygonData = await response.json();
			const targetFeature = polygonData.features?.find(
				(feature: any) => feature.properties?.landName === landName,
			);

			if (targetFeature && targetFeature.properties) {
				// Select the feature
				selectedFeature = targetFeature.properties;

				// Fly to the feature location if it has centroid
				if (targetFeature.properties.centroid?.coordinates) {
					const coords =
						targetFeature.properties.centroid.coordinates;
					mapInstance.flyTo({
						center: coords,
						zoom: 14,
						essential: true,
					});
				}
			}
		} catch (error) {
			console.error("Error selecting feature by landName:", error);
		}
	}
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
