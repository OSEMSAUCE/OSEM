<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { initializeMap } from '../map/mapOrchestrator';
	import type { GeorefResult } from '../../mobMap/georef';
	import LoadMapButton from './LoadMapButton.svelte';
	import MapLibrary from './MapLibrary.svelte';
	import MobileNav from './MobileNav.svelte';

	let georef: GeorefResult | null = $state(null);
	let loading = $state(false);
	let libraryOpen = $state(false);
	let pdfVisible = $state(true);
	let mapContainer: HTMLDivElement | undefined = $state();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let mapInstance: any = $state(null);

	onMount(() => {
		const cleanup = initializeMap(mapContainer!, {
			showNavigation: true,
			showStyleControl: true,
			showDrawTools: true,
			loadMarkers: false,
			autoRotate: false,
			globeProjection: false,
			enableHash: false,
			scrollZoom: true,
			initialCenter: [-120, 54.5],
			initialZoom: 10,
			onMapReady: async (map) => {
				const mapboxgl = (await import('mapbox-gl')).default;
				map.addControl(
					new mapboxgl.GeolocateControl({
						positionOptions: { enableHighAccuracy: true },
						trackUserLocation: true,
						showUserHeading: true,
					}),
					'bottom-right',
				);

				mapInstance = map;
				if (georef?.mapboxCorners) applyOverlay(georef);

				// Re-apply PDF overlay after style switches
				map.on('style.load', () => {
					if (georef?.mapboxCorners) applyOverlay(georef);
				});
			},
		});
		return cleanup;
	});

	async function applyOverlay(g: GeorefResult) {
		if (!mapInstance) return;
		const { addPdfOverlay } = await import('../../mobMap/mapOverlay');
		addPdfOverlay(mapInstance, g);
		pdfVisible = true;
	}

	async function handleLoad(file: File) {
		loading = true;
		try {
			const { saveMap } = await import('../../mobMap/mapStorage');
			const { extractGeoref } = await import('../../mobMap/georef');
			await saveMap(file);
			const result = await extractGeoref(file);
			georef = result;
			if (result.mapboxCorners) {
				await applyOverlay(result);
			} else {
				toast.warning('No georeference found — map loaded but not positioned', {
					duration: 6000,
				});
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to load map', {
				duration: Infinity,
			});
		} finally {
			loading = false;
		}
	}

	function togglePdf() {
		if (!mapInstance || !georef?.mapboxCorners) return;
		pdfVisible = !pdfVisible;
		mapInstance.setLayoutProperty(
			'pdf-layer',
			'visibility',
			pdfVisible ? 'visible' : 'none',
		);
	}
</script>

<div class="viewport-layout">
	<MobileNav />
	<main class="demo-map-area" style="position:relative;">

		<div bind:this={mapContainer} class="mapbox-map"></div>

		<!-- Top control bar — sits just below the nav -->
		<div
			class="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 p-3
			       bg-gradient-to-b from-black/60 to-transparent pointer-events-none"
		>
			<div class="pointer-events-auto flex items-center gap-2">
				<LoadMapButton onLoad={handleLoad} {loading} bind:libraryOpen />
			</div>

			{#if georef?.mapboxCorners}
				<div class="pointer-events-auto ml-auto">
					<button
						onclick={togglePdf}
						class="flex items-center justify-center w-10 h-10 rounded-full shadow-lg backdrop-blur-sm active:scale-95 transition-transform
						       {pdfVisible ? 'bg-white/90 text-gray-800' : 'bg-black/70 text-white/50'}"
						title={pdfVisible ? 'Hide PDF overlay' : 'Show PDF overlay'}
					>
						{#if pdfVisible}
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
								<circle cx="12" cy="12" r="3"/>
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
								<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
								<line x1="1" y1="1" x2="23" y2="23"/>
							</svg>
						{/if}
					</button>
				</div>
			{/if}
		</div>

		<MapLibrary onLoad={handleLoad} bind:open={libraryOpen} />

	</main>
</div>
