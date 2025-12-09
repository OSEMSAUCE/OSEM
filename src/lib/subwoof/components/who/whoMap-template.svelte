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

	onMount(() => {
		if (mapContainer) {
			const isMobile = window.innerWidth < 768;

			const mapOptions: OrgMapOptions = {
				initialZoom: isMobile ? 0.8 : 1.8, // Zoomed in more (0.8 mobile, 1.8 desktop)
				initialCenter: [0, 20],
				// glow
				horizonBlend: 0.008
			};

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
