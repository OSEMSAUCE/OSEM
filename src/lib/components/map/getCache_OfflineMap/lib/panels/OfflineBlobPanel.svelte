<script lang="ts">
/**
 * OfflineBlobPanel — what the device actually holds, per area.
 *
 * The work meter answers "is it working right now"; this answers "what is on
 * disk". Together they are the offline debugger. ReTreever has a much larger
 * inspector (BlobInspector.svelte, ~3,600 lines: geocoding, corner/reach
 * measurement, cross-DB sweeps, .retreever export); this is the portable core
 * of it — the coverage registry, grouped and sized — with no host dependencies
 * at all beyond the places port.
 *
 * ⚠️ INDEXEDDB IS PARTITIONED PER ORIGIN. This reads whatever the CURRENT origin
 * has baked. On a fresh OSEM dev server that is legitimately nothing until the
 * engine runs a pass — an empty table here means "this origin has no blobs",
 * never "the blobs were lost". The same confusion cost an hour on the admin
 * host once, so the empty state says so out loud rather than showing 0 B.
 */
import { onMount } from "svelte";
import {
	allCoverage,
	OFFLINE_BUDGET_BYTES,
	type CoverageRecord,
} from "../onPhone/store/coverageRegistry";
import { subscribeOfflineBake } from "../onPhone/bake/bakeService.svelte";
import { wipeOfflineDataAndReload } from "../onPhone/store/wipe";
import type { HostPlace } from "$harness/components/map/mapShared/hostPorts";

interface Props {
	/** The host's places, for naming areas. Same list the bake service gets. */
	places?: HostPlace[];
	/** Map an anchor to its areaKey — the engine's own satImageKey. */
	areaKeyOf?: (c: [number, number]) => string;
}
let { places = [], areaKeyOf }: Props = $props();

let rows = $state<CoverageRecord[]>([]);
let loading = $state(true);
let baking = $state(false);
let pending = $state(0);

/** areaKey → the place that owns it, so a row can show a name not a number. */
const owner = $derived.by(() => {
	const m = new Map<string, HostPlace>();
	if (!areaKeyOf) return m;
	for (const p of places)
		for (const a of p.anchors) if (!m.has(areaKeyOf(a))) m.set(areaKeyOf(a), p);
	return m;
});

const totalBytes = $derived(rows.reduce((n, r) => n + (r.bytes || 0), 0));

function kb(n: number): string {
	if (!n) return "—";
	return n < 1024 * 1024
		? `${(n / 1024).toFixed(0)} KB`
		: `${(n / 1024 / 1024).toFixed(1)} MB`;
}

async function refresh(): Promise<void> {
	try {
		// Newest first — the pin you just dropped is the one you are debugging.
		rows = (await allCoverage()).sort(
			(a, b) => (b.lastTouched ?? 0) - (a.lastTouched ?? 0),
		);
	} catch {
		// codestyle-allow-swallow: no IndexedDB (SSR, private mode) is an
		// ordinary state — the empty table below already says the right thing.
		rows = [];
	}
	loading = false;
}

onMount(() => {
	void refresh();
	// Re-read on every generation bump: that is the engine saying the disk
	// changed (an area downloaded or was evicted), which is exactly and only
	// when this table is stale. Polling would re-open the DB for nothing.
	return subscribeOfflineBake((s) => {
		baking = s.downloading;
		pending = s.pending;
		void refresh();
	});
});
</script>

<div class="panel">
	<div class="head">
		<span class="title">offline blobs</span>
		<span class="sum">
			{rows.length} area{rows.length === 1 ? "" : "s"} · {kb(totalBytes)}
			{#if OFFLINE_BUDGET_BYTES}
				<span class="dim">/ {kb(OFFLINE_BUDGET_BYTES)}</span>
			{/if}
		</span>
		<button class="wipe" onclick={() => void wipeOfflineDataAndReload()}>
			WIPE
		</button>
	</div>

	{#if baking}
		<!-- The bake takes 20-60 s for a cold area. Without this line, "still
		     downloading" and "broken" look identical — a black map either way. -->
		<div class="baking">
			baking… {pending} area{pending === 1 ? "" : "s"} to go
		</div>
	{/if}

	{#if loading}
		<div class="empty">reading IndexedDB…</div>
	{:else if !rows.length}
		<div class="empty">
			<strong>no blobs on this origin yet</strong>
			<div class="dim">
				IndexedDB is partitioned per origin. This is not "blobs lost" — the
				engine has not finished a pass here. Wait ~20 s after load.
			</div>
		</div>
	{:else}
		<div class="rows">
			{#each rows as r (r.areaKey)}
				{@const p = owner.get(r.areaKey)}
				<div class="row">
					<div class="row-top">
						<span class="name">{p?.featureName ?? r.areaKey}</span>
						<span class="bytes">{kb(r.bytes)}</span>
					</div>
					<div class="row-bot">
						<span class="coord">
							{r.lat.toFixed(4)}, {r.lng.toFixed(4)}
						</span>
						<span class="chip" class:on={r.hasPhoto}>
							satellite {r.hasPhoto ? kb(r.photoBytes ?? 0) : "—"}
						</span>
						<span class="chip" class:on={r.hasLines}>
							roads {r.hasLines ? `${r.lineCount ?? 0} feat` : "—"}
						</span>
						{#if p?.groupName}<span class="dim">{p.groupName}</span>{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.panel {
		font-family: ui-monospace, monospace;
		font-size: 0.72rem;
		background: #0b0b0d;
		border: 1px solid #3a3a42;
		border-radius: 8px;
		color: #d8d4c8;
		width: 100%;
		max-width: 420px;
		box-sizing: border-box;
		/* Same drop shadow as OfflineWorkMeter — the two cards sit stacked in
		   the rail and must lift off the page together. */
		box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5);
		overflow: hidden;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.55rem;
		border-bottom: 1px solid #26262c;
	}
	.title {
		color: #e8b84b;
		font-weight: 600;
	}
	.sum {
		margin-left: auto;
	}
	.dim {
		color: #7a7568;
	}
	/* Deliberately ugly and red: it must never be mistaken for a normal action. */
	.wipe {
		border: 1px solid #a33;
		color: #f66;
		background: transparent;
		border-radius: 4px;
		padding: 0.1rem 0.4rem;
		cursor: pointer;
		font: inherit;
	}
	.baking {
		padding: 0.35rem 0.55rem;
		color: #e8b84b;
		border-bottom: 1px solid #26262c;
	}
	.empty {
		padding: 0.8rem 0.55rem;
		line-height: 1.5;
	}
	.rows {
		max-height: 340px;
		overflow-y: auto;
	}
	.row {
		padding: 0.35rem 0.55rem;
		border-bottom: 1px solid #1c1c21;
	}
	.row-top {
		display: flex;
		gap: 0.5rem;
	}
	.name {
		color: #d8d4c8;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bytes {
		margin-left: auto;
		color: #e8b84b;
	}
	.row-bot {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.15rem;
		color: #7a7568;
	}
	.chip {
		border: 1px solid #2e2e35;
		border-radius: 3px;
		padding: 0 0.25rem;
	}
	.chip.on {
		color: #7fc47f;
		border-color: #2f5a2f;
	}
</style>
