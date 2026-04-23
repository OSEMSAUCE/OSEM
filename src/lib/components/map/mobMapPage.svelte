<script lang="ts">
import { onMount } from "svelte";
import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";
import { initializeMap } from "./mapParts/mapInit";
import { NiceScaleBarControl } from "./mapParts/mapScaleBar";
import MapDrawControls from "./mapParts/mapDrawControls.svelte";

let mapContainer: HTMLDivElement | undefined = $state();
let mapError: string | null = $state(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapInstance: any = $state(null);
let drawIntent: "polygon" | "line" | null = $state(null);

onMount(() => {
    let cleanup: (() => void) | undefined;

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
                map.addControl(
                    new NiceScaleBarControl({
                        width: 200,
                        maxRangeMeters: 5000,
                        minStepWidth: 23,
                        maxDepth: 4,
                        height: 20,
                        unit: "m",
                    }),
                    "bottom-left",
                );
                mapInstance = map;
            },
        });
    } catch (err) {
        console.error("[MobMapPage] Map init failed:", err);
        mapError =
            err instanceof Error ? err.message : "Map failed to initialize";
    }

    return () => {
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
        border: 3px solid #C87F58;
        box-shadow:
            inset 0 0 0 1px rgba(232, 160, 106, 0.55),
            inset 0 0 60px rgba(232, 160, 106, 0.35);
    }

    .draw-active-line::before {
        border-color: #ffd700;
        box-shadow: inset 0 0 40px rgba(255, 215, 0, 0.22);
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

    /* Nice scale bar — alternating black/white blocks, high contrast for sun */
    :global(.mobile-map-fill .mapboxgl-ctrl-bottom-left) {
        bottom: calc(env(safe-area-inset-bottom) + 1.25rem) !important;
        left: 0.75rem !important;
        padding: 0 !important;
    }

    :global(.mobile-map-fill .nice-scale-bar) {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: transparent;
        box-shadow: none;
    }

    :global(.mobile-map-fill .nice-scale-bar__blocks) {
        display: flex;
        border: 1.5px solid #fff;
        outline: 1.5px solid #000;
        background: #fff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }

    :global(.mobile-map-fill .nice-scale-bar__block) {
        flex: 1 1 0;
        height: 100%;
    }

    :global(.mobile-map-fill .nice-scale-bar__block.is-dark) {
        background: #000;
    }

    :global(.mobile-map-fill .nice-scale-bar__block.is-light) {
        background: #fff;
    }

    :global(.mobile-map-fill .nice-scale-bar__labels) {
        position: relative;
        height: 1rem;
        margin-top: 2px;
    }

    :global(.mobile-map-fill .nice-scale-bar__tick) {
        position: absolute;
        top: 0;
        transform: translateX(-50%);
        font-size: 0.75rem;
        font-weight: 700;
        color: #000;
        text-shadow:
            -1px -1px 0 #fff,
            1px -1px 0 #fff,
            -1px 1px 0 #fff,
            1px 1px 0 #fff,
            0 0 3px #fff;
        white-space: nowrap;
        letter-spacing: 0.01em;
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
