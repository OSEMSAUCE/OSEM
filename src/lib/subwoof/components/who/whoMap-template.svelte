<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { initializeOrgMap } from '$lib/subwoof/components/where/orgMapParent';

	let { organizations = [] }: { organizations: any[] } = $props();

	let mapContainer: HTMLDivElement;
	let mapCleanup: () => void;

	onMount(() => {
		if (mapContainer) {
			mapCleanup = initializeOrgMap(mapContainer, organizations, (orgId) => {
				goto(`/who/${orgId}`);
			});
		}

		return () => {
			if (mapCleanup) mapCleanup();
		};
	});
</script>

<div class="w-full h-full relative">
	<div bind:this={mapContainer} class="absolute inset-0 w-full h-full"></div>
</div>
