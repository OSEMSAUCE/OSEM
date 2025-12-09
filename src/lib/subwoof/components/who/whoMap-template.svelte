<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import {
		initializeOrgMap,
		type OrgMapOptions
	} from '$lib/subwoof/components/where/orgMapParent';

	let { organizations = [] }: { organizations: any[] } = $props();

	let mapContainer: HTMLDivElement;
	let mapCleanup: () => void;

	// Detect mobile for responsive zoom
	const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

	const mapOptions: OrgMapOptions = {
		initialZoom: isMobile ? 1.2 : 2.5, // More zoomed out on mobile
		initialCenter: [0, 20],
		horizonBlend: 0.004 // Thin fog (matches /where page)
	};

	onMount(() => {
		if (mapContainer) {
			mapCleanup = initializeOrgMap(mapContainer, organizations, (orgId) => {
				goto(`/who/${orgId}`);
			}, mapOptions);
		}

		return () => {
			if (mapCleanup) mapCleanup();
		};
	});
</script>

<div class="w-full h-full relative">
	<div bind:this={mapContainer} class="absolute inset-0 w-full h-full"></div>
</div>
