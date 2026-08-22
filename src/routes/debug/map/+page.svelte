<script lang="ts">
/**
 * /debug/map — the offline map engine, running on nothing.
 *
 * THIS PAGE IS THE POINT OF THE WHOLE MIGRATION. It is the proof that the
 * engine has no hidden ties to ReTreever: no TinyBase, no Supabase, no auth, no
 * mapStore. Its entire "database" is the PINS array below — three literals.
 *
 * A contractor clones OSEM, runs `npm run dev`, opens this page, breaks
 * something, and hits `export json` to get an AI-debuggable report. That is the
 * whole workflow, and none of it requires the private repo.
 *
 * WHAT'S DELIBERATELY MISSING. This host declares no `fires` port, so no
 * hotspots are ever fetched — the engine treats that as a valid configuration,
 * not a degraded one. Same for `gps`: no live anchor, feature anchors only.
 * Both are ReTreever's business, and their absence here is the demonstration.
 *
 * PINNED TO FIXED LOCATIONS, ON PURPOSE. The tile Worker edge-caches /pack by
 * build, so these few areas stay hot and repeat visits cost ~nothing. A
 * click-anywhere demo would mint uncached packs against a 127 GB archive on
 * every visit — a bill, not a feature. Free-roam belongs behind the local /
 * staging Worker toggles a developer runs themselves.
 */
import { onMount } from "svelte";
import { startOfflineBakeService } from "$osem/components/map/offline/onPhone/bake/bakeService.svelte";
import type { HostPorts } from "$osem/components/map/mapShared/hostPorts";
import OfflineWorkMeter from "$osem/components/map/mapShared/OfflineWorkMeter.svelte";

/** THE ENTIRE DATA LAYER. Add a pin here and the engine bakes it. */
const PINS: Array<{ name: string; lngLat: [number, number] }> = [
	{ name: "Ottawa valley", lngLat: [-76.16797958683314, 45.061348227515055] },
	{ name: "Vancouver", lngLat: [-123.1207, 49.2827] },
	{ name: "Prince George", lngLat: [-122.7497, 53.9171] },
];

/**
 * The host ports, implemented with literals. Compare with ReTreever's
 * retreeverPorts.ts: same interface, and everything TinyBase-shaped is gone.
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
	// NOT the same as "has places"; see hostPorts.ts.
	ready: () => true,
	// No `fires`, no `gps` — both optional, both ReTreever's business.
};

onMount(() => startOfflineBakeService(ports));
</script>

<svelte:head><title>Offline map — debug</title></svelte:head>

<h1>Offline map engine</h1>
<p>
	Running with no database. The {PINS.length} pins below are literals in this page's
	source; the engine bakes satellite imagery and wall-map tiles for each.
</p>
<ul>
	{#each PINS as p (p.name)}
		<li>{p.name} — {p.lngLat[1].toFixed(4)}, {p.lngLat[0].toFixed(4)}</li>
	{/each}
</ul>

<OfflineWorkMeter />

<style>
	h1 {
		font-size: 1.25rem;
	}
	ul {
		font-family: ui-monospace, monospace;
		font-size: 0.85rem;
	}
</style>
