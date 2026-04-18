<script lang="ts">
import { onMount } from "svelte";
import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";
import { initializeMap } from "../map/mapOrchestrator";

let mapContainer: HTMLDivElement | undefined = $state();
let mapError: string | null = $state(null);

onMount(() => {
    let cleanup: (() => void) | undefined;
    let pinchTimeout: ReturnType<typeof setTimeout> | null = null;

    function getScale(): HTMLElement | null {
        return (
            mapContainer?.querySelector<HTMLElement>(".mapboxgl-ctrl-scale") ??
            null
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

    try {
        cleanup = initializeMap(mapContainer!, {
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
            hideLabels: true,
            // Pin mobile to satellite explicitly — don't inherit from default.
            // Field use needs terrain context under the PDF overlay.
            style: MAP_CONFIG.styles.defaultSat,
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
            },
        });

        // Show scale bar only while pinch-zooming
        const el = mapContainer!;
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchend", onTouchEnd, { passive: true });
    } catch (err) {
        console.error("[MobilePage] Map init failed:", err);
        mapError =
            err instanceof Error ? err.message : "Map failed to initialize";
    }

    return () => {
        mapContainer?.removeEventListener("touchstart", onTouchStart);
        mapContainer?.removeEventListener("touchend", onTouchEnd);
        if (pinchTimeout) clearTimeout(pinchTimeout);
        cleanup?.();
    };
});

</script>

<div class="mobile-map-fill">
	{#if mapError}
		<div class="map-error">
			<p>Map unavailable</p>
			<p class="map-error-detail">{mapError}</p>
		</div>
	{/if}
	<div bind:this={mapContainer} class="map-canvas"></div>

	<!-- Floating top controls — padded for status bar / Dynamic Island -->
	<div class="top-controls">
		<div class="pointer-events-auto flex items-center gap-2">
			<a
				href="/mobile/maps/admin"
				class="data-btn"
				title="Map data"
				aria-label="Map data"
			>
				Data
			</a>
		</div>

	</div>

</div>

<style>
	.mobile-map-fill {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.map-error {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #111;
		color: #9ca3af;
		gap: 0.5rem;
		z-index: 10;
		padding: 2rem;
		text-align: center;
	}

	.map-error p {
		font-size: 1rem;
		font-weight: 600;
		color: #e5e7eb;
	}

	.map-error-detail {
		font-size: 0.75rem;
		font-weight: 400 !important;
		color: #6b7280 !important;
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

	.data-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0 0.8rem;
		height: 2rem;
		background: rgba(0, 0, 0, 0.55);
		border: 1px solid rgba(255, 215, 0, 0.6);
		border-radius: 0.4rem;
		color: #ffd700;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-decoration: none;
		pointer-events: auto;
	}

	.data-btn:active {
		background: rgba(255, 215, 0, 0.25);
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
