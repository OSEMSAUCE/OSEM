<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { initializeOrgMap } from '$lib/subwoof/componentswhere/orgMapParent';
	import type { PageData } from './$types';

	export let data: PageData;

	let mapContainer: HTMLDivElement;
	let mapCleanup: () => void;

	onMount(() => {
		if (mapContainer) {
			mapCleanup = initializeOrgMap(mapContainer, data.organizations, (orgId) => {
				goto(`/who/${orgId}`);
			});
		}

		return () => {
			if (mapCleanup) mapCleanup();
		};
	});
</script>

<div class="flex h-screen w-full flex-col md:flex-row">
	<!-- Sidebar List -->
	<div
		class="w-full md:w-1/3 lg:w-1/4 h-1/2 md:h-full overflow-y-auto border-r border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800"
	>
		<div
			class="p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10"
		>
			<h1 class="text-xl font-bold mb-2">Organizations</h1>
			<p class="text-sm text-gray-500">{data.organizations.length} organizations found</p>
		</div>

		<div class="divide-y divide-gray-100 dark:divide-gray-800">
			{#each data.organizations as org}
				<a
					href="/who/{org.id}"
					class="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
				>
					<div class="flex justify-between items-start">
						<div>
							<h3 class="font-medium text-gray-900 dark:text-gray-100">{org.displayName}</h3>
							{#if org.displayAddress}
								<p class="text-sm text-gray-500 mt-1 truncate">{org.displayAddress}</p>
							{/if}
						</div>
						{#if org.claimCount > 0}
							<span
								class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
							>
								{org.claimCount} Claims
							</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</div>

	<!-- Map Area -->
	<div class="w-full md:w-2/3 lg:w-3/4 h-1/2 md:h-full relative">
		<div bind:this={mapContainer} class="absolute inset-0 w-full h-full"></div>
	</div>
</div>

<style>
	:global(.mapboxgl-ctrl-top-right) {
		top: 10px;
		right: 10px;
	}
</style>
