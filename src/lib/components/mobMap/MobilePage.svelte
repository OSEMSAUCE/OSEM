<script lang="ts">
import { onMount } from "svelte";
import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";
import { initializeMap } from "../map/mapOrchestrator";
import type { Feature } from "geojson";
import { area } from "@turf/turf";
import { getFeatureAnchorLngLat, formatArea } from "./drawUtils";
import { shareFeatureGeoJSON } from "./shareFeature";
import FeaturePopover from "./FeaturePopover.svelte";
import FeatureEditSheet from "./FeatureEditSheet.svelte";

let mapContainer: HTMLDivElement | undefined = $state();
let mapError: string | null = $state(null);
let drawToolbarOpen = $state(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapInstance: any = $state(null);

let drawIntent: "polygon" | "line" | null = $state(null);
let drawnVertices: [number, number][] = $state([]);
let popoverPixel: { x: number; y: number } | null = $state(null);
let drawJustFinished = $state(false);
let finishTimeout: ReturnType<typeof setTimeout> | null = null;

let completedFeatures: Feature[] = $state([]);
let selectedFeatureIndex: number | null = $state(null);
let featurePopoverPixel: { x: number; y: number } | null = $state(null);
let editSheetOpen = $state(false);

let vertexCount = $derived(drawnVertices.length);
let canFinish = $derived(
    drawIntent === "polygon"
        ? vertexCount >= 3
        : drawIntent === "line"
          ? vertexCount >= 2
          : false,
);
let isDrawing = $derived(drawIntent !== null);
let selectedFeature = $derived(
    selectedFeatureIndex !== null ? completedFeatures[selectedFeatureIndex] ?? null : null,
);
let provisionalArea = $derived.by(() => {
    if (drawIntent !== "polygon" || drawnVertices.length < 3) return null;
    const ring = [...drawnVertices, drawnVertices[0]];
    const sqM = area({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [ring] },
        properties: {},
    });
    return formatArea(sqM);
});

let popoverStyle = $derived.by(() => {
    if (!popoverPixel || !mapInstance) return "";
    const { x, y } = popoverPixel;
    const el = mapInstance.getContainer();
    const w = el.clientWidth;
    const h = el.clientHeight;
    const OFFSET = 20;
    const PW = 140;
    const PH = 48;
    let left = x + OFFSET;
    let top = y - OFFSET - PH;
    if (left + PW > w - 10) left = x - OFFSET - PW;
    if (top < 10) top = y + OFFSET;
    if (top + PH > h - 10) top = y - OFFSET - PH;
    return `left:${left}px;top:${top}px`;
});
let showFeaturePopover = $derived(
    selectedFeature !== null &&
        featurePopoverPixel !== null &&
        !isDrawing &&
        !drawJustFinished &&
        !editSheetOpen,
);

function getAccentColor(): string {
    return (
        getComputedStyle(document.documentElement)
            .getPropertyValue("--color-draw")
            .trim() || "#C9825B"
    );
}

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
                const accent = getAccentColor();
                const emptyFC = {
                    type: "FeatureCollection" as const,
                    features: [],
                };

                // ── Drawing-in-progress sources/layers ──
                map.addSource("draw-edges", { type: "geojson", data: emptyFC });
                map.addSource("draw-vertices", { type: "geojson", data: emptyFC });
                map.addSource("provisional-polygon", { type: "geojson", data: emptyFC });

                map.addLayer({
                    id: "draw-edges-halo",
                    type: "line",
                    source: "draw-edges",
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: { "line-color": "#ffffff", "line-width": 5, "line-opacity": 0.7 },
                });
                map.addLayer({
                    id: "draw-edges-line",
                    type: "line",
                    source: "draw-edges",
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: { "line-color": accent, "line-width": 3.5 },
                });
                map.addLayer({
                    id: "provisional-polygon-fill",
                    type: "fill",
                    source: "provisional-polygon",
                    filter: ["==", "$type", "Polygon"],
                    paint: { "fill-color": "#f97316", "fill-opacity": 0.12 },
                });
                map.addLayer({
                    id: "provisional-polygon-closing-edge",
                    type: "line",
                    source: "provisional-polygon",
                    filter: ["==", "$type", "LineString"],
                    paint: {
                        "line-color": "#f97316",
                        "line-width": 2.5,
                        "line-dasharray": [6, 4],
                    },
                });
                map.addLayer({
                    id: "draw-vertices-halo",
                    type: "circle",
                    source: "draw-vertices",
                    paint: { "circle-radius": 7, "circle-color": "#ffffff" },
                });
                map.addLayer({
                    id: "draw-vertices-dot",
                    type: "circle",
                    source: "draw-vertices",
                    paint: { "circle-radius": 4, "circle-color": accent },
                });

                // ── Completed features sources/layers ──
                map.addSource("completed-features", { type: "geojson", data: emptyFC });

                map.addLayer({
                    id: "completed-fill",
                    type: "fill",
                    source: "completed-features",
                    filter: ["==", "$type", "Polygon"],
                    paint: { "fill-color": accent, "fill-opacity": 0.15 },
                });
                map.addLayer({
                    id: "completed-stroke-halo",
                    type: "line",
                    source: "completed-features",
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: { "line-color": "#ffffff", "line-width": 5, "line-opacity": 0.7 },
                });
                map.addLayer({
                    id: "completed-stroke",
                    type: "line",
                    source: "completed-features",
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: { "line-color": accent, "line-width": 3 },
                });
                map.addLayer({
                    id: "completed-vertices-halo",
                    type: "circle",
                    source: "completed-features",
                    filter: ["==", "$type", "Point"],
                    paint: { "circle-radius": 7, "circle-color": "#ffffff" },
                });
                map.addLayer({
                    id: "completed-vertices-dot",
                    type: "circle",
                    source: "completed-features",
                    filter: ["==", "$type", "Point"],
                    paint: { "circle-radius": 4, "circle-color": accent },
                });

                // ── Click handler ──
                map.on(
                    "click",
                    (e: { lngLat: { lng: number; lat: number }; point: { x: number; y: number } }) => {
                        if (drawIntent) {
                            // Power-user shortcut: tap first vertex to close polygon
                            if (drawIntent === "polygon" && drawnVertices.length >= 3) {
                                const first = drawnVertices[0];
                                const fp = map.project({ lng: first[0], lat: first[1] });
                                const dx = fp.x - e.point.x;
                                const dy = fp.y - e.point.y;
                                if (dx * dx + dy * dy < 625) {
                                    finishDraw();
                                    return;
                                }
                            }

                            drawnVertices = [...drawnVertices, [e.lngLat.lng, e.lngLat.lat]];
                            popoverPixel = { x: e.point.x, y: e.point.y };
                            updateDrawLayers();
                            return;
                        }

                        // Not drawing — check for feature selection
                        const hits = map.queryRenderedFeatures([e.point.x, e.point.y], {
                            layers: ["completed-fill", "completed-stroke"],
                        });
                        if (hits.length > 0) {
                            const hitIdx = hits[0].properties?._idx;
                            if (hitIdx !== undefined) {
                                selectedFeatureIndex = hitIdx;
                                const feat = completedFeatures[hitIdx];
                                if (feat) {
                                    const anchor = getFeatureAnchorLngLat(feat);
                                    if (anchor) {
                                        const pt = map.project({ lng: anchor[0], lat: anchor[1] });
                                        featurePopoverPixel = { x: pt.x, y: pt.y };
                                    }
                                }
                            }
                        } else {
                            selectedFeatureIndex = null;
                            featurePopoverPixel = null;
                        }
                    },
                );

                // Keep popovers pinned during pan/zoom
                map.on("move", () => {
                    if (drawnVertices.length > 0 && drawIntent) {
                        const last = drawnVertices[drawnVertices.length - 1];
                        const point = map.project({ lng: last[0], lat: last[1] });
                        popoverPixel = { x: point.x, y: point.y };
                    }
                    if (selectedFeature) {
                        const anchor = getFeatureAnchorLngLat(selectedFeature);
                        if (anchor) {
                            const pt = map.project({ lng: anchor[0], lat: anchor[1] });
                            featurePopoverPixel = { x: pt.x, y: pt.y };
                        }
                    }
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
        if (finishTimeout) clearTimeout(finishTimeout);
        cleanup?.();
    };
});

function updateDrawLayers() {
    if (!mapInstance) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const edgeSrc = mapInstance.getSource("draw-edges") as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vertSrc = mapInstance.getSource("draw-vertices") as any;
    if (!edgeSrc || !vertSrc) return;

    if (drawnVertices.length === 0) {
        edgeSrc.setData({ type: "FeatureCollection", features: [] });
        vertSrc.setData({ type: "FeatureCollection", features: [] });
        clearProvisionalPolygon();
        return;
    }

    // Edge line connecting all placed vertices
    if (drawnVertices.length >= 2) {
        edgeSrc.setData({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: { type: "LineString", coordinates: drawnVertices },
                    properties: {},
                },
            ],
        });
    } else {
        edgeSrc.setData({ type: "FeatureCollection", features: [] });
    }

    // Vertex dots
    vertSrc.setData({
        type: "FeatureCollection",
        features: drawnVertices.map((coord) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: coord },
            properties: {},
        })),
    });

    updateProvisionalPolygon();
}

function updateProvisionalPolygon() {
    if (!mapInstance) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const src = mapInstance.getSource("provisional-polygon") as any;
    if (!src) return;

    if (drawIntent !== "polygon" || drawnVertices.length < 2) {
        src.setData({ type: "FeatureCollection", features: [] });
        return;
    }

    const ring = [...drawnVertices, drawnVertices[0]];
    const closingEdge = [
        drawnVertices[drawnVertices.length - 1],
        drawnVertices[0],
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const features: any[] = [
        {
            type: "Feature",
            geometry: { type: "LineString", coordinates: closingEdge },
            properties: {},
        },
    ];

    if (drawnVertices.length >= 3) {
        features.push({
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [ring] },
            properties: {},
        });
    }

    src.setData({ type: "FeatureCollection", features });
}

function clearProvisionalPolygon() {
    if (!mapInstance) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const src = mapInstance.getSource("provisional-polygon") as any;
    if (src) src.setData({ type: "FeatureCollection", features: [] });
}

function clearDrawingSources() {
    if (!mapInstance) return;
    const empty = { type: "FeatureCollection" as const, features: [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const id of ["draw-edges", "draw-vertices", "provisional-polygon"]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const src = mapInstance.getSource(id) as any;
        if (src) src.setData(empty);
    }
}

function updateCompletedSource() {
    if (!mapInstance) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const src = mapInstance.getSource("completed-features") as any;
    if (!src) return;

    // Build features with vertex points for dot rendering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allFeatures: any[] = [];
    for (let i = 0; i < completedFeatures.length; i++) {
        const feat = completedFeatures[i];
        allFeatures.push({
            ...feat,
            properties: { ...feat.properties, _idx: i },
        });

        // Add vertex points so completed-vertices layers render
        if (feat.geometry.type === "Polygon") {
            const ring = feat.geometry.coordinates[0];
            for (const coord of ring) {
                allFeatures.push({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: coord },
                    properties: { _idx: i },
                });
            }
        } else if (feat.geometry.type === "LineString") {
            for (const coord of feat.geometry.coordinates) {
                allFeatures.push({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: coord },
                    properties: { _idx: i },
                });
            }
        }
    }

    src.setData({ type: "FeatureCollection", features: allFeatures });
}

function toggleDrawToolbar() {
    drawToolbarOpen = !drawToolbarOpen;
    if (!drawToolbarOpen && drawIntent) {
        drawIntent = null;
        drawnVertices = [];
        popoverPixel = null;
        clearDrawingSources();
    }
}

function setDrawMode(mode: string) {
    const targetIntent: "polygon" | "line" =
        mode === "draw_polygon" ? "polygon" : "line";

    if (drawIntent === targetIntent) {
        drawIntent = null;
        drawnVertices = [];
        popoverPixel = null;
        clearDrawingSources();
        return;
    }

    drawIntent = targetIntent;
    drawnVertices = [];
    popoverPixel = null;
    clearDrawingSources();
}

function undoDraw() {
    if (!drawIntent) return;
    drawnVertices = drawnVertices.slice(0, -1);
    if (drawnVertices.length > 0 && mapInstance) {
        const last = drawnVertices[drawnVertices.length - 1];
        const point = mapInstance.project({ lng: last[0], lat: last[1] });
        popoverPixel = { x: point.x, y: point.y };
    } else {
        popoverPixel = null;
    }
    updateDrawLayers();
}

function finishDraw() {
    if (!canFinish) return;

    let feature: Feature;
    const id = crypto.randomUUID();

    if (drawIntent === "polygon") {
        const ring = [...drawnVertices, drawnVertices[0]];
        feature = {
            type: "Feature",
            id,
            geometry: { type: "Polygon", coordinates: [ring] },
            properties: { name: "", notes: "" },
        };
    } else {
        feature = {
            type: "Feature",
            id,
            geometry: { type: "LineString", coordinates: [...drawnVertices] },
            properties: { name: "", notes: "" },
        };
    }

    completedFeatures = [...completedFeatures, feature];
    updateCompletedSource();

    drawToolbarOpen = false;
    drawIntent = null;
    drawnVertices = [];
    clearDrawingSources();

    drawJustFinished = true;
    if (finishTimeout) clearTimeout(finishTimeout);
    finishTimeout = setTimeout(() => {
        drawJustFinished = false;
        popoverPixel = null;

        // Auto-select the new feature
        const idx = completedFeatures.length - 1;
        selectedFeatureIndex = idx;
        const feat = completedFeatures[idx];
        if (feat && mapInstance) {
            const anchor = getFeatureAnchorLngLat(feat);
            if (anchor) {
                const pt = mapInstance.project({ lng: anchor[0], lat: anchor[1] });
                featurePopoverPixel = { x: pt.x, y: pt.y };
            }
        }
    }, 600);
}

function cancelDraw() {
    drawToolbarOpen = false;
    drawIntent = null;
    drawnVertices = [];
    popoverPixel = null;
    clearDrawingSources();
}

function handleDeselect() {
    selectedFeatureIndex = null;
    featurePopoverPixel = null;
    editSheetOpen = false;
}

function handleDelete() {
    if (selectedFeatureIndex !== null) {
        completedFeatures = completedFeatures.filter((_, i) => i !== selectedFeatureIndex);
        updateCompletedSource();
    }
    handleDeselect();
}

function handleShare() {
    if (selectedFeature) {
        shareFeatureGeoJSON(selectedFeature);
    }
}

function handleEdit() {
    editSheetOpen = true;
}

function handleEditSave(name: string, notes: string) {
    if (selectedFeatureIndex === null) return;
    const feat = completedFeatures[selectedFeatureIndex];
    if (!feat) return;
    completedFeatures[selectedFeatureIndex] = {
        ...feat,
        properties: { ...feat.properties, name: name || undefined, notes: notes || undefined },
    };
    completedFeatures = [...completedFeatures];
    updateCompletedSource();
    editSheetOpen = false;
}
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

	<!-- Floating popover near last vertex -->
	{#if (vertexCount >= 1 && popoverPixel && isDrawing) || drawJustFinished}
		<div class="draw-popover" style={popoverStyle}>
			{#if drawJustFinished}
				<span class="popover-finished">&#x2713;</span>
			{:else}
				{#if provisionalArea}
					<span class="popover-area">{provisionalArea}</span>
				{/if}
				{#if canFinish}
					<button
						class="popover-btn popover-done"
						class:popover-done-poly={drawIntent === 'polygon'}
						class:popover-done-line={drawIntent === 'line'}
						onclick={finishDraw}
					>
						&#x2713; Done
					</button>
				{/if}
				<button class="popover-btn popover-cancel" onclick={cancelDraw}>&#x2715;</button>
			{/if}
		</div>
	{/if}

	<!-- Draw toolbar (slides up when active) -->
	{#if drawToolbarOpen}
		<div class="draw-toolbar">
			<button
				class="toolbar-btn"
				class:toolbar-btn-active-line={drawIntent === 'line'}
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
				class:toolbar-btn-active-poly={drawIntent === 'polygon'}
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

		</div>
	{/if}

	<!-- Feature action popover (post-drawing or on re-select) -->
	{#if showFeaturePopover && selectedFeature && featurePopoverPixel}
		<FeaturePopover
			feature={selectedFeature}
			pixel={featurePopoverPixel}
			containerWidth={mapInstance?.getContainer().clientWidth ?? 0}
			containerHeight={mapInstance?.getContainer().clientHeight ?? 0}
			onShare={handleShare}
			onEdit={handleEdit}
			onDelete={handleDelete}
			onClose={handleDeselect}
		/>
	{/if}

	<!-- Feature edit sheet -->
	{#if editSheetOpen && selectedFeature}
		<FeatureEditSheet
			feature={selectedFeature}
			onSave={handleEditSave}
			onClose={() => { editSheetOpen = false; }}
		/>
	{/if}
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
		border-color: #f97316;
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

	/* ── Floating vertex popover ── */
	.draw-popover {
		position: absolute;
		z-index: 30;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem;
		background: rgba(0, 0, 0, 0.88);
		border-radius: 0.5rem;
		backdrop-filter: blur(8px);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
	}

	.popover-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		border: none;
		font-size: 0.8125rem;
		font-weight: 700;
		-webkit-tap-highlight-color: transparent;
	}

	.popover-done {
		color: #fff;
		background: #6b7280;
	}

	.popover-done-poly {
		background: #f97316;
	}

	.popover-done-poly:active {
		background: #ea580c;
	}

	.popover-done-line {
		background: #eab308;
		color: #1a1a1a;
	}

	.popover-done-line:active {
		background: #ca8a04;
	}

	.popover-area {
		color: #f3f4f6;
		font-size: 0.9375rem;
		font-weight: 700;
		font-family: ui-monospace, monospace;
		padding: 0.25rem 0.375rem;
		letter-spacing: -0.02em;
	}

	.popover-finished {
		color: #22c55e;
		font-size: 1.125rem;
		font-weight: 700;
		padding: 0.375rem 0.75rem;
	}

	.popover-cancel {
		color: #9ca3af;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.5rem 0.5rem;
		font-size: 0.875rem;
	}

	.popover-cancel:active {
		background: rgba(255, 255, 255, 0.2);
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

	/* Active tool — polygon (orange) */
	.toolbar-btn-active-poly {
		background: rgba(249, 115, 22, 0.3);
		border-color: #f97316;
		color: #f97316;
	}

	/* Active tool — line (gold) */
	.toolbar-btn-active-line {
		background: rgba(255, 215, 0, 0.3);
		border-color: #ffd700;
		color: #ffd700;
	}

	/* ═══════════════════════════════════════════════
	   Mapbox control overrides — unified spacing
	   ═══════════════════════════════════════════════ */

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

	/* Mapbox attribution — hide on mobile (logo stays visible) */
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

	/* Mapbox logo — bottom-left, small padding off the edge */
	:global(.mobile-map-fill .mapboxgl-ctrl-bottom-left) {
		bottom: 0.25rem !important;
		left: 0.25rem !important;
		padding: 0 !important;
	}

	:global(.mobile-map-fill .mapboxgl-ctrl-logo) {
		opacity: 0.5;
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
