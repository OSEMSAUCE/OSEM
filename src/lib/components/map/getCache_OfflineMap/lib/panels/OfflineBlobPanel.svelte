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
 * has baked. On a fresh harness dev server that is legitimately nothing until the
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
		font-family: "JetBrains Mono", ui-monospace, monospace;
		font-size: 0.78rem;
		background: #141414;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 14px;
		color: #f3f1e9;
		/* Sits directly under OfflineWorkMeter in the rail — a small gap (not a
		   seam) keeps them read as two clearly separate cards, matching how
		   this debugger already renders live (see .rail gap in demo/+page). */
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
		flex-wrap: wrap;
		gap: 0.4rem 0.75rem;
		padding: 0.85rem 0.9rem 0.7rem;
		background: #1c1c1c;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	.title {
		font-family: "Inter", -apple-system, sans-serif;
		font-weight: 800;
		font-size: 0.9rem;
		color: #eab627;
		white-space: nowrap;
	}
	.sum {
		margin-left: auto;
		color: #8f8b80;
	}
	.dim {
		color: #8f8b80;
	}
	/* Deliberately ugly and red: it must never be mistaken for a normal action. */
	.wipe {
		border: 1px solid #e2553f;
		color: #e2553f;
		background: transparent;
		border-radius: 7px;
		padding: 0.3rem 0.6rem;
		cursor: pointer;
		font:
			800 0.7rem "Inter",
			-apple-system,
			sans-serif;
		letter-spacing: 0.03em;
	}
	.baking {
		padding: 0.5rem 0.9rem;
		color: #eab627;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	.empty {
		padding: 0.9rem;
		line-height: 1.5;
	}
	.rows {
		max-height: 340px;
		overflow-y: auto;
	}
	.row {
		padding: 0.6rem 0.9rem;
		border-top: 1px dashed rgba(255, 255, 255, 0.1);
	}
	.row:first-child {
		border-top: none;
	}
	.row-top {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}
	.name {
		color: #f3f1e9;
		font-weight: 700;
		font-size: 0.95em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bytes {
		margin-left: auto;
		color: #eab627;
		font-weight: 700;
	}
	.row-bot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.3rem;
		color: #8f8b80;
	}
	.chip {
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		padding: 0.15rem 0.4rem;
		font-size: 0.92em;
		font-weight: 600;
	}
	.chip.on {
		color: #7fbf6a;
		border-color: rgba(127, 191, 106, 0.4);
	}
</style>
