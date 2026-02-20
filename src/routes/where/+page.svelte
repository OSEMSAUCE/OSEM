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

	// These two may resolve in either order — coordinate with pendingFeature
	let mapInstance: import("mapbox-gl").Map | null = null;
	let pendingFeature: any = null;

	function flyToAndSelect(map: import("mapbox-gl").Map, feature: any) {
		selectedFeature = feature;
		// centroid may be a parsed object or a JSON string (Mapbox serializes properties)
		let coords: [number, number] | null = null;
		if (feature?.centroid?.coordinates) {
			coords = feature.centroid.coordinates;
		} else if (typeof feature?.centroid === "string") {
			try {
				coords = JSON.parse(feature.centroid)?.coordinates ?? null;
			} catch {}
		}
		if (coords) {
			map.flyTo({ center: coords, zoom: 14, essential: true });
			console.log("🎯 Flew to feature from URL:", feature.landName);
		}
	}

	onMount(() => {
		const landParam = $page.url.searchParams.get("land");
		const projectNameParam = $page.url.searchParams.get("projectName");
		const hasTarget = !!(landParam || projectNameParam);

		fullMapOptions.autoRotate = !hasTarget;

		const cleanup = initializeMap(mapContainer, {
			...fullMapOptions,
			enableHash: false,
			apiBaseUrl: PUBLIC_API_URL.replace(/\/$/, ""),
			onFeatureSelect: (feature) => {
				selectedFeature = feature;
				if (feature?.landName) {
					goto(`/where?land=${encodeURIComponent(feature.landName)}`, {
						replaceState: true,
						noScroll: true,
					});
				}
			},
			onMapReady: (map) => {
				mapInstance = map;
				// Data fetch may have already found the feature — fly now
				if (pendingFeature) {
					flyToAndSelect(map, pendingFeature);
					pendingFeature = null;
				}
			},
		});

		// Fetch polygon data in parallel with map load
		if (hasTarget) {
			(async () => {
				try {
					const apiUrl = `${PUBLIC_API_URL.replace(/\/$/, "")}/api/where/polygons`;
					const response = await fetch(apiUrl);
					if (!response.ok) return;

					const polygonData = await response.json();
					let targetFeature: any = null;

					if (landParam) {
						// Match by landName (human-readable) or landId (UUID)
						targetFeature = polygonData.features?.find(
							(f: any) =>
								f.properties?.landName === landParam ||
								f.properties?.landId === landParam ||
								f.id === landParam,
						);
					} else if (projectNameParam) {
						// Take first polygon in the project
						targetFeature = polygonData.features?.find(
							(f: any) =>
								f.properties?.projectName === projectNameParam,
						);
					}

					if (!targetFeature?.properties) return;

					if (mapInstance) {
						// Map already loaded — fly immediately
						flyToAndSelect(mapInstance, targetFeature.properties);
					} else {
						// Map not ready yet — store for onMapReady to pick up
						pendingFeature = targetFeature.properties;
					}
				} catch (error) {
					console.error("Error pre-loading feature:", error);
				}
			})();
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
