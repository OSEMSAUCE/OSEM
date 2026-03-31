<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { initializeMap } from "../map/mapOrchestrator";
	import type { GeorefResult } from "../../mobMap/georef";
	import LoadMapButton from "./LoadMapButton.svelte";
	import MapLibrary from "./MapLibrary.svelte";

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
				const mapboxgl = (await import("mapbox-gl")).default;
				map.addControl(
					new mapboxgl.GeolocateControl({
						positionOptions: { enableHighAccuracy: true },
						trackUserLocation: true,
						showUserHeading: true,
					}),
					"bottom-right",
				);

				mapInstance = map;
				if (georef?.mapboxCorners) applyOverlay(georef);

				// Re-apply PDF overlay after style switches
				map.on("style.load", () => {
					if (georef?.mapboxCorners) applyOverlay(georef);
				});
			},
		});

		// Show scale bar only while pinch-zooming
		let pinchTimeout: ReturnType<typeof setTimeout> | null = null;

		function getScale(): HTMLElement | null {
			return (
				mapContainer?.querySelector<HTMLElement>(
					".mapboxgl-ctrl-scale",
				) ?? null
			);
		}

		function onTouchStart(e: TouchEvent) {
			if (e.touches.length < 2) return;
			const scale = getScale();
			if (!scale) return;
			if (pinchTimeout) {
				clearTimeout(pinchTimeout);
				pinchTimeout = null;
			}
			scale.dataset.pinchVisible = "true";
		}

		function onTouchEnd() {
			if (pinchTimeout) clearTimeout(pinchTimeout);
			pinchTimeout = setTimeout(() => {
				const scale = getScale();
				if (scale) delete scale.dataset.pinchVisible;
			}, 2000);
		}

		const el = mapContainer!;
		el.addEventListener("touchstart", onTouchStart, { passive: true });
		el.addEventListener("touchend", onTouchEnd, { passive: true });

		return () => {
			el.removeEventListener("touchstart", onTouchStart);
			el.removeEventListener("touchend", onTouchEnd);
			if (pinchTimeout) clearTimeout(pinchTimeout);
			cleanup();
		};
	});

	async function applyOverlay(g: GeorefResult) {
		if (!mapInstance) return;
		const { addPdfOverlay } = await import("../../mobMap/mapOverlay");
		addPdfOverlay(mapInstance, g);
		pdfVisible = true;
	}

	async function handleLoad(file: File) {
		loading = true;
		try {
			const { saveMap } = await import("../../mobMap/mapStorage");
			const { extractGeoref } = await import("../../mobMap/georef");
			await saveMap(file);
			const result = await extractGeoref(file);
			georef = result;
			if (result.mapboxCorners) {
				await applyOverlay(result);
			} else {
				toast.warning(
					"No georeference found — map loaded but not positioned",
					{
						duration: 6000,
					},
				);
			}
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to load map",
				{
					duration: Infinity,
				},
			);
		} finally {
			loading = false;
		}
	}

	function togglePdf() {
		if (!mapInstance || !georef?.mapboxCorners) return;
		pdfVisible = !pdfVisible;
		mapInstance.setLayoutProperty(
			"pdf-layer",
			"visibility",
			pdfVisible ? "visible" : "none",
		);
	}
</script>

<div class="mobile-map-fill">
	<div bind:this={mapContainer} class="map-canvas"></div>

	<!-- Floating top controls — padded for status bar / Dynamic Island -->
	<div class="top-controls">
		<div class="pointer-events-auto flex items-center gap-2">
			<LoadMapButton onLoad={handleLoad} {loading} bind:libraryOpen />
		</div>

		{#if georef?.mapboxCorners}
			<div class="pointer-events-auto ml-auto">
				<button
					onclick={togglePdf}
					class="flex items-center justify-center w-10 h-10 rounded-full shadow-md border active:scale-95 focus:outline-none transition-all
					       {pdfVisible
						? 'bg-accent/40 text-gray-900 border-accent'
						: 'bg-white/5 text-accent border-white/30 active:bg-accent/30 active:border-accent focus:border-accent'}"
					title={pdfVisible ? "Hide PDF overlay" : "Show PDF overlay"}
				>
					{#if pdfVisible}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-5 h-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
							/>
							<circle cx="12" cy="12" r="3" />
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-5 h-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
							/>
							<path
								d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
							/>
							<line x1="1" y1="1" x2="23" y2="23" />
						</svg>
					{/if}
				</button>
			</div>
		{/if}
	</div>

	<MapLibrary onLoad={handleLoad} bind:open={libraryOpen} />
</div>

<style>
	.mobile-map-fill {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.map-canvas {
		width: 100%;
		height: 100%;
	}

	.top-controls {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: calc(env(safe-area-inset-top) + 0.75rem) 0.75rem 0.75rem;
		background: linear-gradient(to bottom, rgb(0 0 0 / 0.55), transparent);
		pointer-events: none;
	}

	/* Push Mapbox controls below safe area + LoadMapButton strip (~48px button + 1.5rem padding) */
	:global(.mobile-map-fill .mapboxgl-ctrl-top-left) {
		top: calc(env(safe-area-inset-top) + 4.5rem) !important;
	}

	/* Scale bar — hidden by default, slides in on pinch-zoom */
	:global(.mobile-map-fill .mapboxgl-ctrl-scale) {
		position: relative;
		min-height: 26px;
		font-size: 13px !important;
		font-weight: 700 !important;
		letter-spacing: 0.02em;
		border-width: 3px !important;
		border-color: #1a1a1a !important;
		color: #1a1a1a !important;
		padding: 2px 8px 3px !important;
		background: rgba(255, 255, 255, 0.9) !important;
		backdrop-filter: blur(6px);
		border-radius: 0 0 4px 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);

		opacity: 0;
		transform: translateY(4px) scale(0.95);
		transition:
			opacity 0.25s ease,
			transform 0.25s ease;
		pointer-events: none;
	}

	/* Show when pinching */
	:global(.mobile-map-fill .mapboxgl-ctrl-scale[data-pinch-visible="true"]) {
		opacity: 1;
		transform: translateY(0) scale(1);
		pointer-events: auto;
	}

	/* Center (½) tick */
	:global(.mobile-map-fill .mapboxgl-ctrl-scale::before) {
		content: "";
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 3px;
		height: 9px;
		background: #1a1a1a;
	}

	/* Quarter (¼) tick */
	:global(.mobile-map-fill .mapboxgl-ctrl-scale::after) {
		content: "";
		position: absolute;
		bottom: 0;
		left: 25%;
		transform: translateX(-50%);
		width: 2px;
		height: 6px;
		background: #444;
	}
</style>
