<script lang="ts">
import { onMount } from "svelte";
import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";
import { initializeMap } from "../map/mapOrchestrator";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";

let mapContainer: HTMLDivElement | undefined = $state();
let mapError: string | null = $state(null);
let drawInstance: MapboxDraw | null = $state(null);
let drawToolbarOpen = $state(false);
let activeDrawMode: string = $state("simple_select");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapInstance: any = $state(null);

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

                const { addDrawHeadless } = await import(
                    "../map/controls_drawToolTip"
                );
                drawInstance = addDrawHeadless(map);

                map.on("draw.modechange", (e: { mode: string }) => {
                    activeDrawMode = e.mode;
                });
            },
        });

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

function toggleDrawToolbar() {
    drawToolbarOpen = !drawToolbarOpen;
    if (!drawToolbarOpen && drawInstance) {
        drawInstance.changeMode("simple_select");
    }
}

function setDrawMode(mode: string) {
    if (!drawInstance) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (drawInstance as any).changeMode(mode);
}

function undoDraw() {
    if (!drawInstance || !mapInstance) return;
    const mode = drawInstance.getMode();
    if (mode === "draw_polygon" || mode === "draw_line_string") {
        const evt = new KeyboardEvent("keyup", {
            key: "Backspace",
            code: "Backspace",
            bubbles: true,
        });
        Object.defineProperty(evt, "keyCode", { value: 8 });
        mapInstance.getContainer().dispatchEvent(evt);
    } else {
        drawInstance.trash();
    }
}

function finishDraw() {
    if (!drawInstance) return;
    drawInstance.changeMode("simple_select");
}
</script>

<div class="mobile-map-fill">
	{#if mapError}
		<div class="map-error">
			<p>Map unavailable</p>
			<p class="map-error-detail">{mapError}</p>
		</div>
	{/if}
	<div bind:this={mapContainer} class="map-canvas"></div>

	<!-- Top-left: DATA button -->
	<a
		href="/mobile/maps/admin"
		class="fab fab-data"
		title="Map data"
		aria-label="Map data"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polygon points="12 2 2 7 12 12 22 7 12 2"/>
			<polyline points="2 17 12 22 22 17"/>
			<polyline points="2 12 12 17 22 12"/>
		</svg>
	</a>

	<!-- Bottom-right: Draw FAB, above geolocate -->
	<button
		class="fab fab-draw"
		class:fab-active={drawToolbarOpen}
		onclick={toggleDrawToolbar}
		title={drawToolbarOpen ? "Close draw tools" : "Draw tools"}
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
			<path d="m15 5 4 4"/>
		</svg>
	</button>

	<!-- Draw toolbar (slides up when active) -->
	{#if drawToolbarOpen}
		<div class="draw-toolbar">
			<button
				class="toolbar-btn"
				class:toolbar-btn-active={activeDrawMode === "draw_line_string"}
				onclick={() => setDrawMode("draw_line_string")}
				title="Draw line"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 19L19 5"/>
					<circle cx="5" cy="19" r="2"/>
					<circle cx="19" cy="5" r="2"/>
				</svg>
				<span>Line</span>
			</button>

			<button
				class="toolbar-btn"
				class:toolbar-btn-active={activeDrawMode === "draw_polygon"}
				onclick={() => setDrawMode("draw_polygon")}
				title="Draw polygon"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M6 3L18 3L21 12L12 21L3 12Z"/>
				</svg>
				<span>Poly</span>
			</button>

			<button
				class="toolbar-btn"
				onclick={undoDraw}
				title="Undo"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="9 14 4 9 9 4"/>
					<path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
				</svg>
				<span>Undo</span>
			</button>

			<button
				class="toolbar-btn toolbar-btn-done"
				onclick={finishDraw}
				title="Finish drawing"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="20 6 9 17 4 12"/>
				</svg>
				<span>Done</span>
			</button>
		</div>
	{/if}
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

	/* ── FAB (Floating Action Button) base ── */
	.fab {
		position: absolute;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 0.5rem;
		background: rgba(0, 0, 0, 0.7);
		border: 1px solid rgba(255, 215, 0, 0.6);
		color: #ffd700;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
		-webkit-tap-highlight-color: transparent;
		text-decoration: none;
	}

	.fab :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
	}

	.fab:active {
		background: rgba(255, 215, 0, 0.25);
	}

	.fab-active {
		background: rgba(255, 215, 0, 0.3) !important;
	}

	/* DATA button — top-left */
	.fab-data {
		top: calc(env(safe-area-inset-top) + 0.75rem);
		left: 0.75rem;
	}

	/* Draw FAB — bottom-right, one gap above geolocate */
	.fab-draw {
		bottom: calc(0.75rem + 3rem + 0.625rem);
		right: 0.75rem;
	}

	/* ── Draw Toolbar — sits flush at bottom of map (top of nav) ── */
	.draw-toolbar {
		position: absolute;
		z-index: 25;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		background: rgba(0, 0, 0, 0.85);
		border-top: 1px solid rgba(255, 215, 0, 0.4);
		backdrop-filter: blur(8px);
	}

	.toolbar-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 0.5rem 0.75rem;
		border-radius: 0.4rem;
		background: transparent;
		border: 1px solid transparent;
		color: #ffd700;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		-webkit-tap-highlight-color: transparent;
	}

	.toolbar-btn :global(svg) {
		width: 1.35rem;
		height: 1.35rem;
	}

	.toolbar-btn:active {
		background: rgba(255, 215, 0, 0.2);
	}

	.toolbar-btn-active {
		background: rgba(255, 215, 0, 0.25);
		border-color: rgba(255, 215, 0, 0.5);
	}

	.toolbar-btn-done {
		color: #22c55e;
		border-color: rgba(34, 197, 94, 0.4);
		background: rgba(34, 197, 94, 0.15);
	}

	.toolbar-btn-done:active {
		background: rgba(34, 197, 94, 0.35);
	}

	/* ═══════════════════════════════════════════════
	   Mapbox control overrides — unified spacing
	   All edges use --edge (0.75rem / 12px).
	   All inter-button gaps use --gap (0.625rem / 10px).
	   ═══════════════════════════════════════════════ */

	/* Hide the headless draw control group (no built-in UI) */
	:global(.mobile-map-fill .mapboxgl-ctrl-top-left .mapboxgl-ctrl-group) {
		display: none !important;
	}

	/* Zero out Mapbox default margins on all controls */
	:global(.mobile-map-fill .mapboxgl-ctrl) {
		margin: 0 !important;
	}

	/* ── Top-right container (style toggle) ── */
	:global(.mobile-map-fill .mapboxgl-ctrl-top-right) {
		top: calc(env(safe-area-inset-top) + 0.75rem) !important;
		right: 0.75rem !important;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.625rem;
	}

	/* ── Bottom-right container (geolocate) — anchor to bottom ── */
	:global(.mobile-map-fill .mapboxgl-ctrl-bottom-right) {
		bottom: 0.75rem !important;
		right: 0.75rem !important;
		padding: 0 !important;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.625rem;
	}

	/* ── Shared FAB style for all Mapbox control groups ── */
	:global(.mobile-map-fill .mapboxgl-ctrl-top-right .mapboxgl-ctrl-group),
	:global(.mobile-map-fill .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl-group) {
		background: rgba(0, 0, 0, 0.7) !important;
		border: 1px solid rgba(255, 215, 0, 0.6) !important;
		border-radius: 0.5rem !important;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
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

	/* Geolocate icon — gold tint (#ffd700) */
	:global(.mobile-map-fill .mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon) {
		filter: brightness(0) saturate(100%) invert(84%) sepia(45%) saturate(1000%) hue-rotate(359deg) brightness(103%) contrast(106%);
	}

	/* Geolocate when actively tracking */
	:global(.mobile-map-fill .mapboxgl-ctrl-geolocate-active) {
		border-color: #ffd700 !important;
		background: rgba(255, 215, 0, 0.2) !important;
	}

	/* Hide Mapbox attribution — breaks layout between FABs */
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

	/* Show when pinching */
	:global(.mobile-map-fill .mapboxgl-ctrl-scale[data-pinch-visible="true"]) {
		opacity: 1;
		transform: translateY(0) scale(1);
		pointer-events: auto;
	}

	/* Center (1/2) tick */
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

	/* Quarter (1/4) tick */
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

	/* Mapbox logo — bottom-left, flush */
	:global(.mobile-map-fill .mapboxgl-ctrl-bottom-left) {
		bottom: 0 !important;
		padding: 0 !important;
	}

	/* ── Tablet breakpoint: scale up FABs, toolbar, and icons ── */
	@container (min-width: 500px) {
		.fab {
			width: 3.5rem;
			height: 3.5rem;
			border-radius: 0.625rem;
		}

		.fab :global(svg) {
			width: 1.75rem;
			height: 1.75rem;
		}

		.fab-draw {
			bottom: calc(0.75rem + 3.5rem + 0.75rem);
		}

		.draw-toolbar {
			gap: 0.5rem;
			padding: 0.625rem 1rem;
		}

		.toolbar-btn {
			padding: 0.625rem 1rem;
			font-size: 0.75rem;
			gap: 4px;
		}

		.toolbar-btn :global(svg) {
			width: 1.6rem;
			height: 1.6rem;
		}

		:global(.mobile-map-fill .mapboxgl-ctrl-top-right .mapboxgl-ctrl-group button),
		:global(.mobile-map-fill .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl-group button) {
			width: 3.5rem !important;
			height: 3.5rem !important;
			min-width: 3.5rem !important;
			min-height: 3.5rem !important;
		}
	}
</style>
