<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { initializeMap, type MapOptions } from './mapParent';
	import { fullMapOptions, compactGlobeOptions } from './config';

	// Component props
	export let options: MapOptions = {};
	export let containerClass = 'absolute inset-0';

	// Internal state
	let mapContainer: HTMLDivElement;
	let cleanupMap: (() => void) | null = null;

	onMount(() => {
		if (!mapContainer) return;

		// Merge provided options with defaults
		const mapOptions = { ...fullMapOptions, ...options };
		cleanupMap = initializeMap(mapContainer, mapOptions);
	});

	onDestroy(() => {
		cleanupMap?.();
	});
</script>

<div bind:this={mapContainer} class={containerClass}></div>
