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

<div class="page">
	<!-- LEFT COLUMN — the two read-outs, stacked and aligned. -->
	<div class="col left">
		<div class="slot-meter">
			<OfflineWorkMeter
				route="debug/map"
				pins={PINS.map((p) => ({ lng: p.lngLat[0], lat: p.lngLat[1] }))}
				{layers}
			/>
		</div>
		<OfflineBlobPanel places={ports.places()} areaKeyOf={satImageKey} />
	</div>

	<!-- CENTRE — the phone, in the hand.
	     The geometry (--phone-width/height, --hand-*) is hand-tuned against
	     hand_phoneV3.webp and lives in ReTreever's app.css, which OSEM does not
	     load. It is declared ONCE here, on .hand-rig, and read from there — the
	     numbers are never re-derived, only re-stated in the one place this repo
	     can see them. If the phone drifts out of the hand, fix it here. -->
	<div class="col centre">
		<div class="hand-rig">
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
	</div>

	<!-- RIGHT COLUMN — CONFIG. Scaffolded here as its own panel; the live
	     worker/layer switches still live inside the work meter's ⚙ until they
	     are lifted out into this shell. -->
	<div class="col right">
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
	</div>
</div>

<style>
/* FOUR COLUMNS: readings left, phone centre, config right. The phone is the
   subject, so it gets the fixed width and the columns flex around it. */
.page {
	display: flex;
	align-items: flex-start;
	justify-content: center;
	gap: 1.25rem;
	padding: 1rem;
	min-height: 100vh;
	background: #0d0d0f;
	color: #d8d4c8;
}
.col {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}
.left,
.right {
	flex: 0 1 460px;
	min-width: 320px;
}
.centre {
	flex: 0 0 auto;
}
/* The work meter positions itself `fixed` for the real app. Inside this
   scaffold it has to sit in the column like anything else, so the slot
   un-fixes it rather than the component being changed for one debug page. */
/* THE METER PORTALS ITSELF TO <body> and pins to the window's top-left, so no
   wrapper rule here can reach it — a `.slot-meter > *` selector matches nothing.
   Rather than teach the component about this page, the left column simply
   RESERVES the space it occupies, and everything below flows under it. Measured
   against the panel's own size; if it grows, grow this. */
.slot-meter {
	height: 152px;
}

/* ── THE HAND RIG ────────────────────────────────────────────────────────
   These numbers are hand-tuned against hand_phoneV3.webp and signed off. Do
   NOT re-derive, round or "improve" them; if the phone sits wrong, the fix is
   here, not a new set of constants. Scaled as a whole by --rig so the rig fits
   a laptop window without the art reflowing (it cannot). */
.hand-rig {
	--phone-width: 452px;
	--phone-height: 936px;
	--hand-width: 1484px;
	--hand-left: -673px;
	--hand-top: -51px;
	--hand-stretch: 1.023;
	--rig: 0.62;

	position: relative;
	width: calc(var(--phone-width) * var(--rig));
	height: calc(var(--phone-height) * var(--rig));
}
.hand {
	position: absolute;
	top: calc(var(--hand-top) * var(--rig));
	left: calc(var(--hand-left) * var(--rig));
	width: calc(var(--hand-width) * var(--rig));
	max-width: none;
	transform: scaleX(var(--hand-stretch));
	transform-origin: left top;
	pointer-events: none;
	user-select: none;
}
.phone {
	position: absolute;
	inset: 0;
	overflow: hidden;
	background: #05101f;
	/* The art paints the bezel; this only clips the screen to its corners. */
	border-radius: calc(28px * var(--rig));
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
	font-family: ui-monospace, monospace;
	font-size: 0.75rem;
	opacity: 0.8;
}

/* ── CONFIG (right) ──────────────────────────────────────────────────────── */
.config {
	font-family: ui-monospace, monospace;
	font-size: 0.72rem;
	background: #0b0b0d;
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
