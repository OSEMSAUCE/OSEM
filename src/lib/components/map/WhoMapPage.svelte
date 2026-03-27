<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { PUBLIC_API_URL } from "$env/static/public";
	import "mapbox-gl/dist/mapbox-gl.css";
	import InfoPanel from "./InfoPanel.svelte";
	import MapNavButtons from "./MapNavButtons.svelte";
	import { fullMapOptions, initializeMap } from "./mapOrchestrator";
	import { addOrgMarkersLayer } from "./layers_orgLayers";
	import PanelOrg from "./panel-org.svelte";

	let mapContainer: HTMLDivElement;
	let selectedFeature: any = null;
	let mapInstance: import("mapbox-gl").Map | null = null;
	let pendingFeature: any = null;

	function flyToAndSelect(map: import("mapbox-gl").Map, feature: any) {
		selectedFeature = feature;
		let coords: [number, number] | null = null;
		
		// For orgs, the geometry is the centroid directly
		if (feature?.geometry?.coordinates) {
			coords = feature.geometry.coordinates;
		}
		
		if (coords) {
			map.flyTo({ center: coords, zoom: 10, essential: true });
			console.log("🎯 Flew to organization:", feature.organizationName);
		}
	}

	onMount(() => {
		const orgParam = $page.url.searchParams.get("org");
		const hasTarget = !!orgParam;

		// Custom options for org map - no polygon loading, we'll add org markers separately
		const orgMapOptions = {
			...fullMapOptions,
			loadMarkers: false, // Don't load polygon markers
			autoRotate: !hasTarget,
		};

		const isMobile = window.innerWidth < 768;

		const cleanup = initializeMap(mapContainer, {
			...orgMapOptions,
			enableHash: false,
			...(isMobile && { showDrawTools: false, initialZoom: 3.5 }),
			apiBaseUrl: PUBLIC_API_URL.replace(/\/$/, ""),
			onFeatureSelect: (feature) => {
				selectedFeature = feature;
				if (feature?.organizationKey) {
					goto(`/who/map?org=${encodeURIComponent(feature.organizationKey)}`, {
						replaceState: true,
						noScroll: true,
					});
				}
			},
			onMapReady: async (map) => {
				mapInstance = map;
				
				// Add organization markers
				await addOrgMarkersLayer(map, {
					apiBaseUrl: PUBLIC_API_URL.replace(/\/$/, ""),
					onFeatureSelect: (feature) => {
						selectedFeature = feature;
						if (feature?.organizationKey) {
							goto(`/who/map?org=${encodeURIComponent(feature.organizationKey)}`, {
								replaceState: true,
								noScroll: true,
							});
						}
					},
				});

				// Handle pending feature from URL
				if (pendingFeature) {
					flyToAndSelect(map, pendingFeature);
					pendingFeature = null;
				}
			},
		});

		// Fetch org data if URL has target
		if (hasTarget && orgParam) {
			(async () => {
				try {
					const apiUrl = `${PUBLIC_API_URL.replace(/\/$/, "")}/apiEndpoints/who/organizations`;
					const response = await fetch(apiUrl);
					if (!response.ok) return;

					const orgData = await response.json();
					const targetFeature = orgData.features?.find(
						(f: any) => f.id === orgParam || f.properties?.organizationKey === orgParam
					);

					if (!targetFeature) return;

					const featureWithGeometry = {
						...targetFeature.properties,
						geometry: targetFeature.geometry,
					};

					if (mapInstance) {
						flyToAndSelect(mapInstance, featureWithGeometry);
					} else {
						pendingFeature = featureWithGeometry;
					}
				} catch (error) {
					console.error("Error pre-loading organization:", error);
				}
			})();
		}

		return cleanup;
	});
</script>

<div class="viewport-layout">
	<main class="demo-map-area">
		<div bind:this={mapContainer} class="mapbox-map"></div>
		<MapNavButtons />
		<InfoPanel
			bind:selectedFeature
			panel={PanelOrg}
			onClose={() => (selectedFeature = null)}
		/>
	</main>
</div>

<style>
	:global(.mapboxgl-ctrl-top-left) {
		top: 60px;
	}
</style>
