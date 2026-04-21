<script lang="ts">
import { onMount } from "svelte";
import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";
import { initializeMap } from "./mapParts/mapInit";
import MapDrawControls from "./mapParts/mapDrawControls.svelte";

let mapContainer: HTMLDivElement | undefined = $state();
let mapError: string | null = $state(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapInstance: any = $state(null);
let drawIntent: "polygon" | "line" | null = $state(null);

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
            showDrawTools: false,
            mobileControls: true,
            loadMarkers: false,
            autoRotate: false,
            globeProjection: false,
            enableHash: false,
            scrollZoom: true,
            initialCenter: [-120, 54.5],
            initialZoom: 10,
            hideLabels: true,
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
                mapInstance = map;
            },
        });

        const el = mapContainer!;
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchend", onTouchEnd, { passive: true });
    } catch (err) {
        console.error("[MobMapPage] Map init failed:", err);
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

<div class="mobile-map-fill"
    class:draw-active-poly={drawIntent === 'polygon'}
    class:draw-active-line={drawIntent === 'line'}
>
    {#if mapError}
        <div class="map-error">
            <p>Map unavailable</p>
            <p class="map-error-detail">{mapError}</p>
        </div>
    {/if}
    <div bind:this={mapContainer} class="map-canvas"></div>

    <MapDrawControls map={mapInstance} bind:drawIntent />
</div>

<style>
    .mobile-map-fill {
        position: relative;
        width: 100%;
        height: 100%;
    }

    /* Viewport border when draw tool is active */
    .draw-active-poly::before,
    .draw-active-line::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 15;
        pointer-events: none;
        border: 2px solid transparent;
    }

    .draw-active-poly::before {
        border-color: #C87F58;
        box-shadow: inset 0 0 22px rgba(200, 127, 88, 0.19);
    }

    .draw-active-line::before {
        border-color: #ffd700;
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

    /* ═══════════════════════════════════════════════
       Mapbox control overrides — unified spacing
       ═══════════════════════════════════════════════ */

    :global(.mobile-map-fill .mapboxgl-ctrl) {
        margin: 0 !important;
    }

    :global(.mobile-map-fill .mapboxgl-ctrl-top-right) {
        top: calc(env(safe-area-inset-top) + 0.75rem) !important;
        right: 0.75rem !important;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.625rem;
    }

    :global(.mobile-map-fill .mapboxgl-ctrl-bottom-right) {
        bottom: 0.75rem !important;
        right: 0.75rem !important;
        padding: 0 !important;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.625rem;
    }

    :global(.mobile-map-fill .mapboxgl-ctrl-top-right .mapboxgl-ctrl-group),
    :global(.mobile-map-fill .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl-group) {
        background: rgba(0, 0, 0, 0.5) !important;
        border: 1px solid rgba(255, 215, 0, 0.5) !important;
        border-radius: 0.5rem !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
    }

    :global(.mobile-map-fill .mapboxgl-ctrl-top-right .mapboxgl-ctrl-group button),
    :global(.mobile-map-fill .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl-group button) {
        width: 3rem !important;
        height: 3rem !important;
        min-width: 3rem !important;
        min-height: 3rem !important;
        background: transparent !important;
        color: #ffd700 !important;
        display: flex !important;
        align-items: center;
        justify-content: center;
        border: none !important;
    }

    :global(.mobile-map-fill .mapboxgl-ctrl-icon) {
        background-color: transparent !important;
    }

    :global(.mobile-map-fill .mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon) {
        filter: brightness(0) saturate(100%) invert(84%) sepia(45%) saturate(1000%) hue-rotate(359deg) brightness(103%) contrast(106%);
    }

    :global(.mobile-map-fill .mapboxgl-ctrl-geolocate-active) {
        border-color: #ffd700 !important;
        background: rgba(255, 215, 0, 0.2) !important;
    }

    :global(.mobile-map-fill .mapboxgl-ctrl-attrib) {
        display: none !important;
    }

    /* Scale bar — hidden by default, slides in on pinch-zoom */
    :global(.mobile-map-fill .mapboxgl-ctrl-scale) {
        position: relative;
        min-height: 1.625rem;
        font-size: 0.8125rem !important;
        font-weight: 700 !important;
        letter-spacing: 0.02em;
        border-width: 3px !important;
        border-color: #1a1a1a !important;
        color: #1a1a1a !important;
        padding: 0.125rem 0.5rem 0.1875rem !important;
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

    :global(.mobile-map-fill .mapboxgl-ctrl-scale[data-pinch-visible="true"]) {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
    }

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

    :global(.mobile-map-fill .mapboxgl-ctrl-bottom-left) {
        bottom: 0.25rem !important;
        left: 0.25rem !important;
        padding: 0 !important;
    }

    :global(.mobile-map-fill .mapboxgl-ctrl-logo) {
        opacity: 0.5;
    }

    /* Tablet+: scale up control group */
    @container (min-width: 500px) {
        :global(.mobile-map-fill .mapboxgl-ctrl-top-right .mapboxgl-ctrl-group button),
        :global(.mobile-map-fill .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl-group button) {
            width: 3.5rem !important;
            height: 3.5rem !important;
            min-width: 3.5rem !important;
            min-height: 3.5rem !important;
        }
    }
</style>
