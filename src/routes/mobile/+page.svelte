<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { GeorefResult } from '$lib/mobMap/georef';
	import LoadMapButton from '$lib/components/mobMap/LoadMapButton.svelte';
	import MapLibrary from '$lib/components/mobMap/MapLibrary.svelte';
	import PdfViewer from '$lib/components/mobMap/PdfViewer.svelte';

	let georef: GeorefResult | null = $state(null);
	let loading = $state(false);
	let drawMode: 'none' | 'polygon' | 'line' = $state('none');
	let gpsPos: { lat: number; lon: number; accuracy: number } | null = $state(null);
	let gpsWatchId: number | null = null;
	let libraryOpen = $state(false);

	async function handleLoad(file: File) {
		loading = true;
		try {
			const { saveMap } = await import('$lib/mobMap/mapStorage');
			const { extractGeoref } = await import('$lib/mobMap/georef');
			await saveMap(file);
			georef = await extractGeoref(file);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to load', { duration: Infinity });
		} finally {
			loading = false;
		}
	}

	function startGps() {
		if (gpsWatchId !== null) return;
		gpsWatchId = navigator.geolocation.watchPosition(
			(pos) => {
				gpsPos = {
					lat: pos.coords.latitude,
					lon: pos.coords.longitude,
					accuracy: pos.coords.accuracy
				};
			},
			(err) => console.warn('GPS error:', err),
			{ enableHighAccuracy: true, maximumAge: 5000 }
		);
	}

	onMount(() => {
		startGps();
		return () => {
			if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
		};
	});
</script>

<svelte:head>
	<title>ReTreever Map</title>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
	/>
</svelte:head>

<div class="fixed inset-0 bg-black overflow-hidden" style="height: 100dvh">

	<!-- PDF viewer: zoomable/pannable container -->
	<PdfViewer {georef} {drawMode} {gpsPos} />

	<!-- Top control bar -->
	<div
		class="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 p-3
		       bg-gradient-to-b from-black/60 to-transparent pointer-events-none"
	>
		<div class="pointer-events-auto flex items-center gap-2">
			<LoadMapButton onLoad={handleLoad} {loading} bind:libraryOpen />
		</div>

		{#if georef}
			<div class="pointer-events-auto flex items-center gap-1 ml-auto">
				<!-- Draw polygon -->
				<button
					onclick={() => (drawMode = drawMode === 'polygon' ? 'none' : 'polygon')}
					class="flex items-center justify-center w-10 h-10 rounded-full text-lg shadow-lg backdrop-blur-sm active:scale-95 transition-transform
					       {drawMode === 'polygon'
						? 'bg-blue-500 text-white'
						: 'bg-black/80 text-white/80'}"
					title="Draw polygon"
				>
					⬡
				</button>
				<!-- Draw line -->
				<button
					onclick={() => (drawMode = drawMode === 'line' ? 'none' : 'line')}
					class="flex items-center justify-center w-10 h-10 rounded-full text-lg shadow-lg backdrop-blur-sm active:scale-95 transition-transform
					       {drawMode === 'line'
						? 'bg-blue-500 text-white'
						: 'bg-black/80 text-white/80'}"
					title="Draw line"
				>
					╱
				</button>
			</div>
		{/if}
	</div>

	<!-- GPS status bottom left -->
	{#if gpsPos}
		<div
			class="absolute bottom-4 left-4 z-20 text-xs text-white/70 bg-black/50 px-2 py-1 rounded-full"
		>
			{gpsPos.lat.toFixed(5)}, {gpsPos.lon.toFixed(5)} ±{Math.round(gpsPos.accuracy)}m
		</div>
	{/if}

	<MapLibrary onLoad={handleLoad} bind:open={libraryOpen} />
</div>
