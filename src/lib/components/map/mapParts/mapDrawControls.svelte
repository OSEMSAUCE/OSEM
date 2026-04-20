<script lang="ts">
import type { Feature } from "geojson";
import type { Map as MapboxMap } from "mapbox-gl";
import { area } from "@turf/turf";
import { formatArea } from "./mapDrawUtils";
import { shareFeatureGeoJSON } from "./mapShareFeature";
import FeaturePopover from "./mapFeaturePopover.svelte";
import FeatureEditSheet from "./mapFeatureEditSheet.svelte";
import {
    type Lnglat,
    buildCompletedFC,
    buildDrawEdgesFC,
    buildDrawVerticesFC,
    buildProvisionalPolygonFC,
    clearInProgressSources,
    finalizeFeature,
    getAccentColor,
    hitTestCompleted,
    projectFeatureBbox,
    projectLnglatBbox,
    setupDrawSourcesAndLayers,
} from "./mapDraw";

let {
    map = $bindable(null),
    drawIntent = $bindable(null),
}: {
    map: MapboxMap | null;
    drawIntent?: "polygon" | "line" | null;
} = $props();

let drawToolbarOpen = $state(false);
let drawnVertices: Lnglat[] = $state([]);
let drawJustFinished = $state(false);
let finishedBbox: { minX: number; maxX: number; minY: number; maxY: number; centerX: number } | null = $state(null);
let mapMoveSeq = $state(0);
let finishTimeout: ReturnType<typeof setTimeout> | null = null;

let completedFeatures: Feature[] = $state([]);
let selectedFeatureIndex: number | null = $state(null);
let featureBbox: { minX: number; minY: number; maxX: number; maxY: number } | null = $state(null);
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

let drawBbox = $derived.by(() => {
    void mapMoveSeq;
    if (!map || drawnVertices.length === 0) return null;
    const bbox = projectLnglatBbox(map, drawnVertices);
    return bbox ? { ...bbox, centerX: (bbox.minX + bbox.maxX) / 2 } : null;
});

let popoverFlipping = $state(false);
let flipTimeout: ReturnType<typeof setTimeout> | null = null;

let popoverSide: "above" | "below" | null = $derived.by(() => {
    const bbox = drawBbox ?? finishedBbox;
    if (!bbox || !map) return null;
    const h = map.getContainer().clientHeight;
    return bbox.minY > h - bbox.maxY ? "above" : "below";
});

let lastPopoverSide: "above" | "below" | null = null;
$effect(() => {
    const side = popoverSide;
    if (side === null) {
        lastPopoverSide = null;
        return;
    }
    if (lastPopoverSide !== null && lastPopoverSide !== side) {
        popoverFlipping = true;
        if (flipTimeout) clearTimeout(flipTimeout);
        flipTimeout = setTimeout(() => { popoverFlipping = false; }, 100);
    }
    lastPopoverSide = side;
});

let popoverStyle = $derived.by(() => {
    const bbox = drawBbox ?? finishedBbox;
    if (!bbox || !map || !popoverSide) return "";
    const el = map.getContainer();
    const w = el.clientWidth;
    const h = el.clientHeight;
    const OFFSET = 15;
    const PW = 140;
    const PH = 48;
    const PAD = 8;

    const top = popoverSide === "above"
        ? Math.max(PAD, bbox.minY - OFFSET - PH)
        : Math.min(h - PH - PAD, bbox.maxY + OFFSET);

    let left = bbox.centerX - PW / 2;
    left = Math.max(PAD, Math.min(left, w - PW - PAD));
    return `left:${left}px;top:${top}px`;
});

let showFeaturePopover = $derived(
    selectedFeature !== null &&
        featureBbox !== null &&
        !isDrawing &&
        !drawJustFinished &&
        !editSheetOpen,
);

function computeFeatureBbox(feat: Feature) {
    return map ? projectFeatureBbox(map, feat) : null;
}

function setSource(id: string, data: ReturnType<typeof buildDrawEdgesFC>) {
    if (!map) return;
    const src = map.getSource(id);
    if (src && "setData" in src) {
        (src as unknown as { setData: (d: typeof data) => void }).setData(data);
    }
}

function updateDrawLayers() {
    if (!map) return;
    setSource("draw-edges", buildDrawEdgesFC(drawnVertices));
    setSource("draw-vertices", buildDrawVerticesFC(drawnVertices));
    setSource("provisional-polygon", buildProvisionalPolygonFC(drawnVertices, drawIntent));
}

function clearDrawingSources() {
    if (map) clearInProgressSources(map);
}

function updateCompletedSource() {
    setSource("completed-features", buildCompletedFC(completedFeatures));
}

function toggleDrawToolbar() {
    drawToolbarOpen = !drawToolbarOpen;
    if (!drawToolbarOpen && drawIntent) {
        drawIntent = null;
        drawnVertices = [];
        clearDrawingSources();
    }
}

function setDrawMode(mode: string) {
    const targetIntent: "polygon" | "line" =
        mode === "draw_polygon" ? "polygon" : "line";

    if (drawIntent === targetIntent) {
        drawIntent = null;
        drawnVertices = [];
        clearDrawingSources();
        return;
    }

    drawIntent = targetIntent;
    drawnVertices = [];
    clearDrawingSources();
}

function undoDraw() {
    if (!drawIntent) return;
    drawnVertices = drawnVertices.slice(0, -1);
    updateDrawLayers();
}

function finishDraw() {
    if (!canFinish || drawIntent === null) return;

    const feature = finalizeFeature(drawIntent, drawnVertices);
    completedFeatures = [...completedFeatures, feature];
    updateCompletedSource();

    finishedBbox = drawBbox;
    drawToolbarOpen = false;
    drawIntent = null;
    drawnVertices = [];
    clearDrawingSources();

    drawJustFinished = true;
    if (finishTimeout) clearTimeout(finishTimeout);
    finishTimeout = setTimeout(() => {
        drawJustFinished = false;
        finishedBbox = null;

        const idx = completedFeatures.length - 1;
        selectedFeatureIndex = idx;
        const feat = completedFeatures[idx];
        if (feat) featureBbox = computeFeatureBbox(feat);
    }, 600);
}

function cancelDraw() {
    drawToolbarOpen = false;
    drawIntent = null;
    drawnVertices = [];
    clearDrawingSources();
}

function handleDeselect() {
    selectedFeatureIndex = null;
    featureBbox = null;
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
    if (selectedFeature) shareFeatureGeoJSON(selectedFeature);
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

// Attach sources/layers + event listeners once map becomes available.
let attachedToMap: MapboxMap | null = null;
$effect(() => {
    if (!map || attachedToMap === map) return;
    attachedToMap = map;

    setupDrawSourcesAndLayers(map, getAccentColor());

    const onClick = (e: { lngLat: { lng: number; lat: number }; point: { x: number; y: number } }) => {
        if (drawIntent) {
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
            updateDrawLayers();
            return;
        }

        const hitIdx = hitTestCompleted(map, e.point);
        if (hitIdx !== null) {
            selectedFeatureIndex = hitIdx;
            const feat = completedFeatures[hitIdx];
            if (feat) featureBbox = computeFeatureBbox(feat);
        } else {
            selectedFeatureIndex = null;
            featureBbox = null;
        }
    };

    const onMove = () => {
        mapMoveSeq++;
        if (selectedFeature) featureBbox = computeFeatureBbox(selectedFeature);
    };

    map.on("click", onClick);
    map.on("move", onMove);

    return () => {
        map.off("click", onClick);
        map.off("move", onMove);
        if (finishTimeout) clearTimeout(finishTimeout);
        if (flipTimeout) clearTimeout(flipTimeout);
    };
});
</script>

<!-- Draw FAB — bottom-right, above geolocate -->
<button
    class="fab fab-draw"
    class:fab-active={drawToolbarOpen}
    onclick={toggleDrawToolbar}
    title={drawToolbarOpen ? "Close draw tools" : "Draw tools"}
    aria-label="Draw tools"
>
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
    </svg>
</button>

<!-- Floating popover near last vertex -->
{#if (vertexCount >= 1 && drawBbox && isDrawing) || drawJustFinished}
    <div class="draw-popover" class:popover-flipping={popoverFlipping} style={popoverStyle}>
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
{#if showFeaturePopover && selectedFeature && featureBbox && map}
    <FeaturePopover
        feature={selectedFeature}
        bbox={featureBbox}
        containerWidth={map.getContainer().clientWidth}
        containerHeight={map.getContainer().clientHeight}
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

<style>
    @keyframes popover-in {
        from { opacity: 0; transform: scale(0.92); }
        to   { opacity: 1; transform: scale(1); }
    }

    .fab {
        position: absolute;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        border-radius: 0.5rem;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 215, 0, 0.5);
        color: #ffd700;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        -webkit-tap-highlight-color: transparent;
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

    .fab-draw {
        bottom: calc(0.75rem + 3rem + 0.625rem);
        right: 0.75rem;
    }

    .draw-popover {
        position: absolute;
        z-index: 30;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 215, 0, 0.5);
        border-radius: 0.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        transition: left 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                    top 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                    opacity 0.08s ease;
        animation: popover-in 0.15s ease-out;
    }

    .popover-flipping {
        opacity: 0;
        transition: opacity 0.06s ease;
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
        background: rgba(0, 0, 0, 0.5);
        border-top: 1px solid rgba(255, 215, 0, 0.5);
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

    .toolbar-btn-active-poly {
        background: rgba(249, 115, 22, 0.3);
        border-color: #f97316;
        color: #f97316;
    }

    .toolbar-btn-active-line {
        background: rgba(255, 215, 0, 0.3);
        border-color: #ffd700;
        color: #ffd700;
    }

    /* Tablet+: scale up FABs, toolbar, icons */
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
    }
</style>
