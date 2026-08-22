<script lang="ts">
/**
 * /debug/map — the offline map engine, running on nothing.
 *
 * THIS PAGE IS THE POINT OF THE MIGRATION. It proves the engine has no hidden
 * ties to ReTreever: no TinyBase, no Supabase, no auth, no mapStore. Its entire
 * "database" is the PINS array below — three literals.
 *
 * A contractor clones OSEM, runs `npm run dev`, opens this page, breaks
 * something, and hits `export json` for an AI-debuggable report. None of that
 * needs the private repo.
 *
 * WHAT'S DELIBERATELY MISSING. No `fires` port and no `gps` port, so no hotspots
 * are fetched and there is no live anchor. The engine treats both as valid
 * configurations rather than degraded ones, and their absence here is the
 * demonstration.
 *
 * PINNED TO FIXED LOCATIONS, ON PURPOSE. The tile Worker edge-caches /pack by
 * build, so these few areas stay hot and repeat visits cost ~nothing. A
 * click-anywhere demo would mint uncached packs against a 127 GB archive on
 * every visit — a bill, not a feature. Free-roam belongs behind the local /
 * staging Worker toggles a developer runs themselves (the CONFIG panel).
 */
import type * as maplibreType from "maplibre-gl";
import { onMount } from "svelte";
import { initializeOfflineMap } from "$osem/components/map/offline/onPhone/render/offlineMapInit";
import { buildOfflineBaseStyle } from "$osem/components/map/offline/onPhone/render/offlineBaseStyle";
import { v4TransformRequest } from "$osem/components/map/offline/r2Worker/roads/packDownload";
import {
	installRawWallProtocol,
	rawSourceSpec,
	RAW_SOURCE,
} from "$osem/components/map/offline/onPhone/roads/rawWallProtocol";
import { wallLayers } from "$osem/components/map/offline/onPhone/render/wallStyle";
import { startOfflineBakeService } from "$osem/components/map/offline/onPhone/bake/bakeService.svelte";
import type { HostPorts } from "$osem/components/map/mapShared/hostPorts";
import OfflineWorkMeter from "$osem/components/map/mapShared/OfflineWorkMeter.svelte";
import OfflineBlobPanel from "$osem/components/map/mapShared/OfflineBlobPanel.svelte";
import { satImageKey } from "$osem/components/map/offline/onPhone/satellite/satelliteImage";
import {
	LAYER_TOGGLES,
	OPT_IN_LAYERS,
} from "$osem/components/map/offline/onPhone/render/wallLegend";

/** THE ENTIRE DATA LAYER. Add a pin here and the engine bakes it. */
const PINS: Array<{ name: string; lngLat: [number, number] }> = [
	{ name: "Ottawa valley", lngLat: [-76.16797958683314, 45.061348227515055] },
	{ name: "Vancouver", lngLat: [-123.1207, 49.2827] },
	{ name: "Prince George", lngLat: [-122.7497, 53.9171] },
];

/**
 * The host ports, implemented with literals. Compare with ReTreever's
 * retreeverPorts.ts: same interface, everything TinyBase-shaped gone.
 */
const ports: HostPorts = {
	places: () =>
		PINS.map((p) => ({
			anchors: [p.lngLat],
			// Static demo data never changes, so one fixed timestamp is honest:
			// every pin is equally "recent" and the conveyor has no reason to
			// prefer one over another.
			lastTouched: "2026-01-01T00:00:00Z",
			corridor: false,
			// Display-only, so the blob panel can name a row instead of printing
			// its areaKey. The bake service ignores every field here.
			featureKey: p.name,
			featureName: p.name,
			featureType: "Point",
			groupKey: "demo",
			groupName: "literal fixture",
		})),
	// Nothing ever changes this list, so there is nothing to notify about.
	onPlacesChanged: () => () => {},
	// Hydrated the moment the module evaluates — the array is right there.
	// NOT the same question as "has places"; see hostPorts.ts.
	ready: () => true,
	// No `fires`, no `gps` — both optional, both ReTreever's business.
};

let mapContainer: HTMLDivElement;
let mapError = $state("");
let wallStatus = $state("wall not mounted yet");

// Layer toggles, driving the CONFIG panel's `layers` section. Same shape the
// real /offline route passes, so the panel behaves identically here.
const layerOn = $state<Record<string, boolean>>(
	Object.fromEntries(
		LAYER_TOGGLES.map((t) => [t.key, !OPT_IN_LAYERS.includes(t.key)]),
	),
);
let mapInstance: maplibreType.Map | null = null;

/** Show/hide a layer group. Mirrors the real /offline route's local helper,
 *  including the Satellite special case: that toggle owns every per-pin photo
 *  layer (`v4-sat-*`), which reconcile mounts dynamically, so they get swept
 *  too or half the imagery stays visible after switching it off. */
function setLayerVisibility(ids: readonly string[], visible: boolean): void {
	if (!mapInstance) return;
	const vis = visible ? "visible" : "none";
	for (const id of ids) {
		if (mapInstance.getLayer(id))
			mapInstance.setLayoutProperty(id, "visibility", vis);
		if (id === "v4-sat") {
			for (const l of mapInstance.getStyle?.()?.layers ?? []) {
				if (typeof l.id === "string" && l.id.startsWith("v4-sat-"))
					mapInstance.setLayoutProperty(l.id, "visibility", vis);
			}
		}
	}
}

function toggleLayer(key: string, ids: readonly string[]): void {
	layerOn[key] = !layerOn[key];
	setLayerVisibility(ids, layerOn[key]);
}

const layers = $derived(
	LAYER_TOGGLES.map((t) => ({
		key: t.key,
		label: t.label,
		on: layerOn[t.key],
		toggle: () => toggleLayer(t.key, t.ids),
	})),
);

onMount(() => {
	const stopBake = startOfflineBakeService(ports);
	let cleanup: (() => void) | undefined;
	try {
		cleanup = initializeOfflineMap(mapContainer, {
			style: buildOfflineBaseStyle() as maplibreType.StyleSpecification,
			initialCenter: PINS[0].lngLat,
			initialZoom: 9,
			// LAW 0, at the renderer's own door: every non-local URL is rejected,
			// so the map CANNOT stream even if a style entry tried to.
			transformRequest:
				v4TransformRequest as maplibreType.RequestTransformFunction,
			onMapCreated: (map: maplibreType.Map) => {
				// OUR OWN handle. __rtMap is set by the initializer and survives a
				// teardown, so probing it can read a DEAD map from a previous mount
				// — which is exactly what made this bug unreadable for an hour.
				(window as unknown as Record<string, unknown>).__debugMap = map;
				wallStatus = "onMapCreated fired";
				// DIAGNOSTIC: onMapReady waits on the `load` event, and load waits
				// on every source settling. Report what the map is actually doing
				// so a stall is visible instead of looking like a blank page.
				map.on("error", (e) =>
					console.error("[debug/map] map error", e?.error ?? e),
				);
				map.once("styledata", () => (wallStatus = "styledata fired"));
				map.once("load", () => (wallStatus = "load fired"));
			},
			onMapReady: (map: maplibreType.Map) => {
				mapInstance = map;
				// THE WALL MAP. Without this the only source on the map is the
				// bundled world base (z0-6) — a couple of highways and a lake —
				// and every byte the bake downloaded sits in IndexedDB unread.
				// That is exactly what "the map looks empty" was.
				//
				// Protocol FIRST, so the first tile request resolves; it and the
				// source add are both idempotent.
				try {
					if (!map.getSource(RAW_SOURCE)) {
						installRawWallProtocol();
						map.addSource(RAW_SOURCE, rawSourceSpec());
						for (const layer of wallLayers()) map.addLayer(layer);
					}
					wallStatus = `wall ok · ${map.getStyle().layers.length} layers`;
				} catch (err) {
					// LOUD, not swallowed: a wall map that fails to mount is the
					// difference between "the offline map works" and a page that
					// looks fine and shows nothing. [[no-silent-fallbacks]]
					wallStatus = `wall FAILED: ${err instanceof Error ? err.message : String(err)}`;
					console.error("[debug/map] wall mount failed", err);
				}
			},
		});
	} catch (err) {
		mapError = err instanceof Error ? err.message : String(err);
	}
	return () => {
		cleanup?.();
		stopBake();
	};
});
</script>

<svelte:head><title>Offline map — debug</title></svelte:head>

<div class="stage">
	<!-- LEFT RAIL — ONE component. Both read-outs live inside it so they share a
	     stacking context and can never drift apart or slide under the hand. It
	     butts against the phone's left edge. -->
	<aside class="rail left">
		<OfflineWorkMeter
			docked
			route="debug/map"
			pins={PINS.map((p) => ({ lng: p.lngLat[0], lat: p.lngLat[1] }))}
			{layers}
		/>
		<OfflineBlobPanel places={ports.places()} areaKeyOf={satImageKey} />
	</aside>

	<!-- CENTRE — the phone in the hand, fitted to the viewport exactly as the
	     app's own frame is (see .rig's --fit). -->
	<div class="rig">
		<img
			class="hand"
			src="/mobileAssets/hand_phoneV3.webp"
			alt=""
			draggable="false"
		/>
		<div class="phone">
			{#if mapError}
				<div class="map-error">
					<p>Map unavailable</p>
					<p class="detail">{mapError}</p>
				</div>
			{/if}
			<div bind:this={mapContainer} class="map-canvas"></div>
		</div>
	</div>

	<!-- RIGHT RAIL — ONE component, mirroring the left. -->
	<aside class="rail right">
		<div class="config">
			<div class="config-title">CONFIG</div>
			<div class="config-note">
				Workers and layer toggles currently live behind the ⚙ in the MAP
				DEBUGGER panel. This shell is where they move next.
			</div>
			<p class="wall-status">{wallStatus}</p>
			<ul class="pins">
				{#each PINS as p (p.name)}
					<li>{p.name}</li>
				{/each}
			</ul>
		</div>
	</aside>
</div>

<style>
:global(html),
:global(body) {
	margin: 0;
	height: 100%;
	background: #000;
	overflow: hidden;
}

/* THE STAGE — fixed to the viewport, exactly like the app's own
   .mobile-preview-backdrop. `container-type: size` is what makes 100cqh below
   resolve against THIS box, which is how the phone gets fitted to the window. */
.stage {
	position: fixed;
	inset: 0;
	container-type: size;
	display: flex;
	/* Rails hang from the TOP so the read-outs start where the eye does; the rig
	   re-centres itself below. Centring the whole row instead left both panels
	   floating in the middle of the stage with the map beside them. */
	align-items: flex-start;
	justify-content: center;
	gap: 0;
	background: #000 url("/mobileAssets/getcache_DT_bg.webp") center / cover
		no-repeat;
	color: #d8d4c8;
	font-family: ui-monospace, monospace;
}

/* ── THE RAILS ───────────────────────────────────────────────────────────
   ONE component per side. Everything on a side lives inside its rail, so the
   panels share a stacking context, move together, and cannot slide behind the
   hand. z-index beats the rig (2) so a panel is never swallowed by the art. */
.rail {
	position: relative;
	z-index: 5;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	width: 27rem;
	max-height: 100cqh;
	overflow-y: auto;
	padding: 0.5rem;
	box-sizing: border-box;
}
.rail.left {
	align-items: stretch;
}

/* ── THE RIG ─────────────────────────────────────────────────────────────
   Geometry hand-tuned against hand_phoneV3.webp; do NOT re-derive. --fit is the
   app's own crop rule: shrink the whole assembly by (stage height ÷ phone
   height), capped at 1, so the phone always fills the viewport top-to-bottom
   without the art reflowing (it cannot). */
.rig {
	/* The rig is the only thing that centres — align-self, not the row. */
	align-self: center;
	--phone-width: 452px;
	--phone-height: 936px;
	--hand-width: 1484px;
	--hand-left: -673px;
	--hand-top: -51px;
	--hand-stretch: 1.023;
	--stage-pad: 20px;
	--fit: min(1, calc((100cqh - var(--stage-pad)) / var(--phone-height)));

	position: relative;
	z-index: 2;
	flex: 0 0 auto;
	width: var(--phone-width);
	height: var(--phone-height);
	transform: scale(var(--fit));
	transform-origin: center center;
}
.hand {
	position: absolute;
	z-index: 2;
	max-width: none;
	width: var(--hand-width);
	height: auto;
	left: var(--hand-left);
	top: var(--hand-top);
	transform: scaleX(var(--hand-stretch));
	transform-origin: center top;
	pointer-events: none;
	user-select: none;
}
.phone {
	position: absolute;
	inset: 0;
	z-index: 0;
	overflow: hidden;
	background: #05101f;
	border-radius: 40px;
}
.map-canvas {
	position: absolute;
	inset: 0;
}
.map-error {
	position: absolute;
	inset: 0;
	z-index: 2;
	display: grid;
	place-content: center;
	text-align: center;
	color: #ffb4a2;
	padding: 1rem;
}
.detail {
	font-size: 0.75rem;
	opacity: 0.8;
}

/* ── CONFIG ──────────────────────────────────────────────────────────────── */
.config {
	font-size: 0.72rem;
	background: #0b0b0dee;
	border: 1px solid #7a4a25;
	border-radius: 10px;
	padding: 0.7rem 0.8rem;
}
.config-title {
	color: #e8b84b;
	font-size: 1.1rem;
	letter-spacing: 0.08em;
	margin-bottom: 0.5rem;
}
.config-note {
	color: #7a7568;
	line-height: 1.5;
	margin-bottom: 0.6rem;
}
.wall-status {
	color: #7a7568;
	margin: 0 0 0.4rem;
}
.pins {
	margin: 0;
	padding-left: 1rem;
	color: #7a7568;
}
</style>
