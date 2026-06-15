<script lang="ts">
import type { Feature } from "geojson";
import type { Map as MapboxMap } from "mapbox-gl";
import { area } from "@turf/turf";
import { formatArea } from "./mapDrawUtils";
import { shareFeatureGeoJSON } from "./mapShareFeature";

import ShovelHandle from "$osem/components/ui/ShovelHandle.svelte";
import {
    attachGridLifecycle,
    clearGrid,
    setGridVisibility,
    setupGridSourcesAndLayers,
    updateGrid,
    type GridMode,
    type GridUpdateResult,
} from "./mapGrid";
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

// ── Drawer drag-slide state ─────────────────────────────────────────────
// Identical mechanics to StatsDrawer on /mobile/getcache. Drawer is a
// 68%-tall panel anchored to the bottom of the map container; we move it
// with translateY. Closed = handle peeking (HANDLE_PX above bottom);
// open = translateY 0.
const HANDLE_PX = 64; // matches .shovel-pullbar height (4rem)
let drawerEl: HTMLDivElement | undefined = $state();
// Big initial value → drawer starts off-screen so there's no "flash open"
// on mount before the closed-offset is computed.
let drawerOffset = $state(10000);
let drawerReady = $state(false);
let isDraggingDrawer = $state(false);

function getClosedOffset(): number {
    const h = drawerEl?.offsetHeight ?? 0;
    return Math.max(0, h - HANDLE_PX);
}

// Initial offset — must NOT depend on isDraggingDrawer or the drawer would
// snap shut the instant the user releases. `drawerEl` is the only dep so
// this re-runs once when the bind resolves.
$effect(() => {
    if (drawerEl) {
        drawerOffset = getClosedOffset();
        drawerReady = true;
    }
});
$effect(() => {
    const onResize = () => {
        if (isDraggingDrawer) return;
        drawerOffset = getClosedOffset();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
});

// Drawer is "open" when it's all the way up (offset near 0). Used by
// the scrim + body opacity + the fist-swap on the shovel image.
let drawerOpen = $derived(drawerOffset < 4);

let editMode = $state(false); // tapped EDIT, strip shown, no tool picked yet
let drawnVertices: Lnglat[] = $state([]);
let drawJustFinished = $state(false);
let finishedBbox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    centerX: number;
} | null = $state(null);
let mapMoveSeq = $state(0);
let finishTimeout: ReturnType<typeof setTimeout> | null = null;

let completedFeatures: Feature[] = $state([]);
let selectedFeatureIndex: number | null = $state(null);
let featureBbox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
} | null = $state(null);

// Grid state — see mapGrid.ts. `off` hides layers; `standard` shows hectare
// dots; `fine` adds the 3×3 sub-dots.
let gridMode: GridMode = $state("off");
let gridTooDense = $state(false);

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
    selectedFeatureIndex !== null
        ? (completedFeatures[selectedFeatureIndex] ?? null)
        : null,
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
        flipTimeout = setTimeout(() => {
            popoverFlipping = false;
        }, 100);
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

    const top =
        popoverSide === "above"
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
        !drawJustFinished,
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
    setSource(
        "provisional-polygon",
        buildProvisionalPolygonFC(drawnVertices, drawIntent),
    );
}

function clearDrawingSources() {
    if (map) clearInProgressSources(map);
}

function updateCompletedSource() {
    setSource("completed-features", buildCompletedFC(completedFeatures));
}

function openDrawer() {
    drawerOffset = 0;
}
function closeDrawer() {
    drawerOffset = getClosedOffset();
}
function toggleDrawer() {
    if (drawerOpen) closeDrawer();
    else openDrawer();
}

// Drag-to-slide — ported from StatsDrawer so the map drawer feels
// identical to the stats drawer. Velocity-aware flick to snap open/closed.
function onShovelPointerDown(e: PointerEvent) {
    e.preventDefault();

    const startY = e.clientY;
    const startOffset = drawerOffset;
    const closedOffset = getClosedOffset();
    isDraggingDrawer = true;

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    let lastY = startY;
    let lastTime = Date.now();
    let velocity = 0;

    const onMove = (ev: PointerEvent) => {
        const now = Date.now();
        const dt = now - lastTime;
        if (dt > 0) velocity = (ev.clientY - lastY) / dt;
        lastY = ev.clientY;
        lastTime = now;

        const dy = ev.clientY - startY;
        drawerOffset = Math.max(0, Math.min(closedOffset, startOffset + dy));
    };

    const onUp = () => {
        isDraggingDrawer = false;
        target.releasePointerCapture(e.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);

        const FLICK = 0.3;
        if (velocity < -FLICK) {
            drawerOffset = 0;
        } else if (velocity > FLICK) {
            drawerOffset = closedOffset;
        } else {
            drawerOffset =
                drawerOffset < closedOffset * 0.75 ? 0 : closedOffset;
        }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
}

function enterDrawMode() {
    // Tapped EDIT in drawer — close drawer, reveal LINE/POLY/UNDO strip.
    editMode = true;
    closeDrawer();
}

function exitDrawMode() {
    editMode = false;
    if (drawIntent) {
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

let drawStripVisible = $derived(
    !drawerOpen && (editMode || drawIntent !== null),
);

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
    editMode = false;
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
    editMode = false;
    drawIntent = null;
    drawnVertices = [];
    clearDrawingSources();
}

function handleDeselect() {
    selectedFeatureIndex = null;
    featureBbox = null;
}

function handleDelete() {
    if (selectedFeatureIndex !== null) {
        completedFeatures = completedFeatures.filter(
            (_, i) => i !== selectedFeatureIndex,
        );
        updateCompletedSource();
    }
    handleDeselect();
}

function handleShare() {
    if (selectedFeature) shareFeatureGeoJSON(selectedFeature);
}

function handleSend() {
    if (selectedFeature) {
        shareFeatureGeoJSON(selectedFeature);
    }
}

function toggleGrid() {
    if (!map) return;
    if (gridMode === "off") {
        gridMode = "standard";
        setGridVisibility(map, true, gridMode);
        const r = updateGrid(map, gridMode);
        gridTooDense = r.tooDense;
    } else {
        gridMode = "off";
        gridTooDense = false;
        setGridVisibility(map, false, gridMode);
        clearGrid(map);
    }
    closeDrawer();
}

function setGridMode(next: "standard" | "fine") {
    if (!map || gridMode === next) return;
    gridMode = next;
    setGridVisibility(map, true, gridMode);
    const r = updateGrid(map, gridMode);
    gridTooDense = r.tooDense;
}

function handleGridUpdate(r: GridUpdateResult) {
    gridTooDense = r.tooDense;
}

function handleEditSave(name: string, notes: string) {
    if (selectedFeatureIndex === null) return;
    const feat = completedFeatures[selectedFeatureIndex];
    if (!feat) return;
    completedFeatures[selectedFeatureIndex] = {
        ...feat,
        properties: {
            ...feat.properties,
            name: name || undefined,
            notes: notes || undefined,
        },
    };
    completedFeatures = [...completedFeatures];
    updateCompletedSource();
}

// Attach sources/layers + event listeners once map becomes available.
let attachedToMap: MapboxMap | null = null;
$effect(() => {
    if (!map || attachedToMap === map) return;
    attachedToMap = map;

    setupDrawSourcesAndLayers(map, getAccentColor());
    setupGridSourcesAndLayers(map);
    setGridVisibility(map, false, "off");
    const detachGrid = attachGridLifecycle(
        map,
        () => gridMode,
        handleGridUpdate,
    );

    const onClick = (e: {
        lngLat: { lng: number; lat: number };
        point: { x: number; y: number };
    }) => {
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
        detachGrid();
        if (finishTimeout) clearTimeout(finishTimeout);
        if (flipTimeout) clearTimeout(flipTimeout);
    };
});
</script>

<!-- Scrim behind drawer — dims map + dismisses on tap -->
{#if drawerOpen}
    <div
        class="drawer-scrim"
        onclick={closeDrawer}
        onkeydown={(e) => { if (e.key === 'Escape') closeDrawer(); }}
        role="button"
        tabindex="-1"
        aria-label="Close tool drawer"
    ></div>
{/if}

<!-- Shovel drawer panel. Always full-height; translateY slides it so only
     the shovel peeks when closed. Same mechanics as StatsDrawer. -->
<div
    bind:this={drawerEl}
    class="shovel-drawer"
    class:drawer-open={drawerOpen}
    class:is-dragging={isDraggingDrawer}
    class:ready={drawerReady}
    style="transform: translateY({drawerOffset}px)"
>
    <!-- Shovel pull-bar — the drawer's top edge. Fist appears while
         dragging or fully open. Shared with StatsDrawer via ShovelHandle. -->
    <div class="shovel-pullbar" class:pullbar-open={drawerOpen}>
        <ShovelHandle
            dragging={isDraggingDrawer || drawerOpen}
            onpointerdown={onShovelPointerDown}
            ariaLabel={drawerOpen ? "Close module drawer" : "Drag to show modules"}
        />
    </div>

    {#if !drawerOpen && !drawStripVisible}
        <div class="pull-hint">PULL FOR MODULES</div>
    {/if}

    <!-- Drawer body — always mounted so it slides into view with the drag.
         Fades/pointer-events gated on drawerOpen. -->
    <div class="drawer-body" class:body-open={drawerOpen}>
            <div class="drawer-section-label">
                <span class="hr"></span>
            </div>

            <button
                class="edit-hero"
                class:edit-hero-active={editMode || drawIntent !== null}
                onclick={enterDrawMode}
            >
                <span class="edit-hero-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 21l3-1 12-12-2-2L4 18l-1 3z"/>
                        <path d="M14 6l4 4"/>
                    </svg>
                </span>
                <span class="edit-hero-text">
                    <span class="edit-hero-title">EDIT</span>
                    <span class="edit-hero-sub">draw lines &amp; polygons on the map</span>
                </span>
                <span class="edit-hero-pill">
                    {editMode || drawIntent !== null ? 'ON' : 'ENTER'}
                </span>
            </button>

            <a class="util-row" href="/mobile/maps/admin">
                <span class="util-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                        <polyline points="2 17 12 22 22 17"/>
                        <polyline points="2 12 12 17 22 12"/>
                    </svg>
                </span>
                <span class="util-text">
                    <span class="util-title">DATA</span>
                    <span class="util-sub">maps, layers, files</span>
                </span>
            </a>

            <button
                class="util-row"
                class:util-row-active={gridMode !== 'off'}
                onclick={toggleGrid}
            >
                <span class="util-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 3h18v18H3z"/>
                        <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
                    </svg>
                </span>
                <span class="util-text">
                    <span class="util-title">GRID</span>
                    <span class="util-sub">audit dots · utm 100m lattice</span>
                </span>
                <span class="util-badge">
                    {gridMode === 'off' ? 'OFF' : gridMode === 'fine' ? '10/HA' : 'ON'}
                </span>
            </button>

            <button class="util-row util-row-stub" disabled>
                <span class="util-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 3v17M15 6v15M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/>
                    </svg>
                </span>
                <span class="util-text">
                    <span class="util-title">BASEMAP</span>
                    <span class="util-sub">satellite / terrain</span>
                </span>
                <span class="util-badge">soon</span>
            </button>

            <button class="util-row util-row-stub" disabled>
                <span class="util-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 3l5 18-5-5-5 5z"/>
                    </svg>
                </span>
                <span class="util-text">
                    <span class="util-title">LOCATION</span>
                    <span class="util-sub">jump to gps fix</span>
                </span>
                <span class="util-badge">soon</span>
            </button>

            <button class="util-row util-row-stub" disabled>
                <span class="util-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z"/>
                        <circle cx="12" cy="9" r="2.5"/>
                    </svg>
                </span>
                <span class="util-text">
                    <span class="util-title">PIN</span>
                    <span class="util-sub">drop marker</span>
                </span>
                <span class="util-badge">soon</span>
            </button>

            <button class="util-row util-row-stub" disabled>
                <span class="util-icon">
                    <img src="/mobileAssets/tracks_goldV3.png" alt="" class="util-icon-img" />
                </span>
                <span class="util-text">
                    <span class="util-title">TRACKS</span>
                    <span class="util-sub">record gps trail</span>
                </span>
                <span class="util-badge">soon</span>
            </button>

            <button class="util-row util-row-stub" disabled>
                <span class="util-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 17L17 3l4 4L7 21z"/>
                        <path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>
                    </svg>
                </span>
                <span class="util-text">
                    <span class="util-title">MEASURE</span>
                    <span class="util-sub">distance + area</span>
                </span>
                <span class="util-badge">soon</span>
            </button>

    </div>
</div>

<!-- Grid mode segmented control — only when grid is on and drawer closed -->
{#if gridMode !== 'off' && !drawerOpen}
    <div class="grid-control">
        <div class="grid-seg">
            <button
                class="grid-seg-btn"
                class:grid-seg-active={gridMode === 'standard'}
                onclick={() => setGridMode('standard')}
            >STANDARD</button>
            <button
                class="grid-seg-btn"
                class:grid-seg-active={gridMode === 'fine'}
                onclick={() => setGridMode('fine')}
            >10/HA</button>
        </div>
        {#if gridTooDense}
            <div class="grid-hint">zoom to see grid</div>
        {/if}
    </div>
{/if}

<!-- Mini draw strip above shovel, when editing (drawer closed) -->
{#if drawStripVisible}
    <div class="draw-strip">
        <button
            class="strip-btn"
            class:strip-btn-active={drawIntent === 'line'}
            onclick={() => setDrawMode('draw_line_string')}
            title="Draw line"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="6" cy="18" r="2.2" fill="currentColor"/>
                <circle cx="18" cy="6" r="2.2" fill="currentColor"/>
                <path d="M7.4 16.6L16.6 7.4"/>
            </svg>
            <span>LINE</span>
        </button>
        <button
            class="strip-btn strip-btn-poly"
            class:strip-btn-active-poly={drawIntent === 'polygon'}
            onclick={() => setDrawMode('draw_polygon')}
            title="Draw polygon"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3l9 6-3.5 11h-11L3 9z"/>
            </svg>
            <span>POLY</span>
        </button>
        <button class="strip-btn" onclick={undoDraw} title="Undo last vertex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 7L4 11l5 4"/>
                <path d="M4 11h9a5 5 0 015 5v2"/>
            </svg>
            <span>UNDO</span>
        </button>
        <button class="strip-btn strip-btn-exit" onclick={exitDrawMode} title="Exit draw mode">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 5l14 14M19 5L5 19"/>
            </svg>
        </button>
    </div>
{/if}

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


<style>
    @keyframes popover-in {
        from { opacity: 0; transform: scale(0.92); }
        to   { opacity: 1; transform: scale(1); }
    }

    /* ═══════════════════════════════════════════════
       Shovel drawer
       ═══════════════════════════════════════════════ */

    .drawer-scrim {
        position: absolute;
        inset: 0;
        z-index: 18;
        background: rgba(0, 0, 0, 0.45);
        transition: background 0.22s ease;
    }

    .shovel-drawer {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 22;
        height: 68%;
        background: transparent;
        display: flex;
        flex-direction: column;
        overflow: visible;
        transition: none; /* disabled until `.ready` — prevents mount flash */
    }

    .shovel-drawer.ready {
        transition: transform 0.3s cubic-bezier(.2,.8,.2,1);
    }

    /* While the finger is down, kill the snap transition so the drawer
       sticks to the pointer instead of lagging behind. */
    .shovel-drawer.is-dragging {
        transition: none;
    }

    /* Pull-bar zone — matches StatsDrawer's .stats-drawer-handle so the
       shovel sits in the same place with the same size on both pages. */
    .shovel-pullbar {
        flex-shrink: 0;
        height: 4rem;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 1.7rem;
        width: 100%;
        overflow: visible;
        z-index: 6;
        filter: drop-shadow(0 -3px 7px rgba(0, 0, 0, 0.65));
    }
    @container (min-width: 700px) {
        .shovel-pullbar {
            padding-top: 2rem;
        }
    }

    .pull-hint {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: 52px;
        font-size: 0.64rem;
        letter-spacing: 0.2em;
        color: #ffd700;
        opacity: 0.85;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
        pointer-events: none;
    }

    .drawer-body {
        position: absolute;
        left: 0;
        right: 0;
        top: 4rem;
        bottom: 0;
        padding: 1.5rem 14px 18px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: #141414;
        border-top: 1px solid rgba(255, 215, 0, 0.55);
        box-shadow: 0 -12px 30px rgba(0, 0, 0, 0.6);
        pointer-events: none;
    }
    .drawer-body.body-open {
        pointer-events: auto;
    }

    .drawer-section-label {
        display: flex;
        align-items: baseline;
        gap: 10px;
        padding: 4px 4px 8px;
        font-size: 0.72rem;
        letter-spacing: 0.18em;
        color: #ffd700;
    }

    .drawer-section-label .hr {
        height: 1px;
        flex: 1;
        background: rgba(255, 215, 0, 0.25);
    }

    .edit-hero {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        background: #111;
        border: 1px solid #262626;
        border-radius: 14px;
        color: #fafafa;
        cursor: pointer;
        width: 100%;
        text-align: left;
        -webkit-tap-highlight-color: transparent;
    }

    .edit-hero-active {
        background: rgba(200, 127, 88, 0.14);
        border-color: rgba(200, 127, 88, 0.6);
    }

    .edit-hero-icon {
        width: 46px;
        height: 46px;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.5);
        border: 1.5px solid rgba(255, 215, 0, 0.4);
        color: #ffd700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .edit-hero-active .edit-hero-icon {
        border-color: #C87F58;
        color: #C87F58;
    }

    .edit-hero-text {
        display: flex;
        flex-direction: column;
        line-height: 1.1;
        flex: 1;
    }

    .edit-hero-title {
        font-size: 1rem;
        letter-spacing: 0.08em;
    }

    .edit-hero-sub {
        font-size: 0.72rem;
        opacity: 0.6;
        margin-top: 3px;
    }

    .edit-hero-pill {
        font-size: 0.62rem;
        letter-spacing: 0.1em;
        color: #ffd700;
        padding: 3px 9px;
        border: 1px solid rgba(255, 215, 0, 0.45);
        border-radius: 999px;
    }

    .edit-hero-active .edit-hero-pill {
        color: #C87F58;
        border-color: rgba(200, 127, 88, 0.5);
    }

    .util-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: #181818;
        border: 1px solid #2a2a2a;
        border-radius: 10px;
        color: #fafafa;
        cursor: pointer;
        width: 100%;
        text-align: left;
        text-decoration: none;
        -webkit-tap-highlight-color: transparent;
    }

    .util-row-stub {
        opacity: 0.55;
        cursor: not-allowed;
    }

    .util-row-active {
        background: rgba(255, 215, 0, 0.12);
        border-color: rgba(255, 215, 0, 0.55);
    }

    /* ═══════════════════════════════════════════════
       Grid segmented control
       ═══════════════════════════════════════════════ */

    .grid-control {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        top: calc(env(safe-area-inset-top) + 0.75rem);
        z-index: 17;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        pointer-events: none;
    }

    .grid-seg {
        display: flex;
        background: rgba(0, 0, 0, 0.55);
        border: 1px solid rgba(255, 215, 0, 0.5);
        border-radius: 999px;
        overflow: hidden;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        pointer-events: auto;
    }

    .grid-seg-btn {
        background: transparent;
        border: none;
        color: #ffd700;
        font-size: 0.7rem;
        letter-spacing: 0.12em;
        padding: 6px 14px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
    }

    .grid-seg-active {
        background: rgba(255, 215, 0, 0.2);
    }

    .grid-hint {
        font-size: 0.66rem;
        letter-spacing: 0.12em;
        color: #ffd700;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
        background: rgba(0, 0, 0, 0.55);
        padding: 3px 8px;
        border-radius: 999px;
    }

    .util-icon {
        width: 38px;
        height: 38px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 215, 0, 0.22);
        color: #ffd700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .util-icon-img {
        width: 26px;
        height: 26px;
        object-fit: contain;
    }

    .util-text {
        display: flex;
        flex-direction: column;
        line-height: 1.1;
        flex: 1;
    }

    .util-title {
        font-size: 0.92rem;
        letter-spacing: 0.05em;
    }

    .util-sub {
        font-size: 0.72rem;
        opacity: 0.55;
        margin-top: 2px;
    }

    .util-badge {
        font-size: 0.62rem;
        letter-spacing: 0.1em;
        color: #ffd700;
        padding: 2px 8px;
        border: 1px solid rgba(255, 215, 0, 0.45);
        border-radius: 999px;
    }

    /* ═══════════════════════════════════════════════
       Mini draw strip (above shovel when editing)
       ═══════════════════════════════════════════════ */

    .draw-strip {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: 58px;
        z-index: 19;
        display: flex;
        gap: 4px;
        padding: 3px 4px;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 215, 0, 0.4);
        border-radius: 12px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
    }

    .strip-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0;
        padding: 4px 10px 3px;
        background: transparent;
        border: none;
        color: #ffd700;
        font-size: 0.66rem;
        letter-spacing: 0.08em;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
        border-radius: 8px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        position: relative;
    }

    .strip-btn-poly {
        color: #C87F58;
    }

    .strip-btn-active {
        background: rgba(255, 215, 0, 0.15);
    }

    .strip-btn-active::after {
        content: '';
        position: absolute;
        left: 25%; right: 25%;
        bottom: 0;
        height: 2px;
        background: #ffd700;
        border-radius: 2px;
    }

    .strip-btn-active-poly {
        background: rgba(200, 127, 88, 0.18);
    }

    .strip-btn-active-poly::after {
        content: '';
        position: absolute;
        left: 25%; right: 25%;
        bottom: 0;
        height: 2px;
        background: #C87F58;
        border-radius: 2px;
    }

    .strip-btn-exit {
        color: #9ca3af;
        padding: 4px 6px;
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
        background: #C87F58;
    }

    .popover-done-poly:active {
        background: #a86a46;
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

    /* Tablet+: scale up strip a touch */
    @container (min-width: 500px) {
        .draw-strip {
            gap: 6px;
            padding: 4px 6px;
        }

        .strip-btn {
            padding: 6px 14px 5px;
            font-size: 0.72rem;
        }
    }
</style>
