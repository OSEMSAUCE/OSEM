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
import { startOfflineBakeService } from "$osem/components/map/offline/onPhone/bake/bakeService.svelte";
import type { HostPorts } from "$osem/components/map/mapShared/hostPorts";
import OfflineWorkMeter from "$osem/components/map/mapShared/OfflineWorkMeter.svelte";
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
			onMapReady: (map: maplibreType.Map) => {
				mapInstance = map;
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
	<header>
		<h1>Offline map engine</h1>
		<p>
			Running in OSEM with no database. The {PINS.length} pins are literals in
			this page's source; the engine bakes satellite imagery and wall-map tiles
			for each. Open CONFIG (the ⚙ in the panel) to switch tile Workers.
		</p>
	</header>

	<!-- THE PHONE FRAME. The offline map is a phone surface — reviewing it in a
	     full-width desktop rectangle hides exactly the layout problems that
	     matter (label crowding, control overlap, how much map a thumb covers). -->
	<div class="phone">
		{#if mapError}
			<div class="map-error">
				<p>Map unavailable</p>
				<p class="detail">{mapError}</p>
			</div>
		{/if}
		<div bind:this={mapContainer} class="map-canvas"></div>

		<!-- The debugger + CONFIG panel. `pins` is passed IN, never read from a
		     store — that is what keeps this component liftable. -->
		<OfflineWorkMeter
			route="debug/map"
			pins={PINS.map((p) => ({ lng: p.lngLat[0], lat: p.lngLat[1] }))}
			{layers}
		/>
	</div>

	<ul class="pins">
		{#each PINS as p (p.name)}
			<li>{p.name} — {p.lngLat[1].toFixed(4)}, {p.lngLat[0].toFixed(4)}</li>
		{/each}
	</ul>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
	}
	header {
		max-width: 46rem;
	}
	h1 {
		font-size: 1.25rem;
		margin: 0 0 0.25rem;
	}
	header p {
		margin: 0;
		font-size: 0.9rem;
		opacity: 0.8;
	}
	/* 390x840 — the same phone rectangle the app is designed against. */
	.phone {
		position: relative;
		width: 390px;
		height: 840px;
		max-width: 100%;
		border: 10px solid #1a1a1a;
		border-radius: 28px;
		overflow: hidden;
		background: #000;
		box-shadow: 0 12px 40px rgb(0 0 0 / 0.35);
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
	.pins {
		font-family: ui-monospace, monospace;
		font-size: 0.8rem;
		opacity: 0.75;
	}
</style>
