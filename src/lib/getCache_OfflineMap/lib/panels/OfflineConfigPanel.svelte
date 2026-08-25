<script lang="ts">
/**
 * CONFIG — Workers and layers. The right-hand rail of the offline-map
 * debugger.
 *
 * WHAT BELONGS HERE: switches that change what the map TALKS TO or DRAWS.
 * Nothing else. The pin picker is not config — it is part of the map's own
 * library (see PinLibrary.svelte).
 *
 * DEV-ONLY BY CONSTRUCTION: the worker override lives behind
 * `import.meta.env.DEV` in tilesHost.ts — a compile-time constant — so a
 * shipped build drops the branch entirely and cannot be switched. That is why
 * this panel is safe to publish at a public URL: it renders, it reads, and it
 * points at production with no way to move it.
 */
import { onMount } from "svelte";
import {
	getWorkerTarget,
	probeTarget,
	setWorkerTarget,
	type WorkerTarget,
} from "../r2Worker/tilesHost";

let {
	layers = [],
}: {
	/** Layer switches, independent of each other — the point is to turn things
	 *  off one at a time and watch the heap. `disabled` renders the row greyed
	 *  out and unclickable — for a layer that exists in the list but isn't
	 *  safe to flip yet (see the online map's Fires row, held behind a
	 *  compile-time bisect until fires v2 ships). */
	layers?: {
		key: string;
		label: string;
		on: boolean;
		toggle: () => void;
		disabled?: boolean;
		disabledHint?: string;
	}[];
} = $props();

// ── WORKER TARGET ───────────────────────────────────────────────────────
// TWO workers, on purpose — see the "TWO TIERS" note in tilesHost.ts. A
// cloud staging tier was tried and dropped: local `wrangler dev --remote`
// already tests against real data, so it added upkeep without adding
// fidelity. The "don't push to prod casually" risk that motivated a middle
// tier is guarded at deployProduction.sh instead (typed confirmation before
// `wrangler deploy` runs bare). Don't re-add a third row here to solve that
// problem — strengthen the deploy guard instead.
// Changing it re-points the NEXT request; in-flight ones finish where they
// started.
let target = $state<WorkerTarget>("production");

const TARGETS: {
	id: WorkerTarget;
	label: string;
	hint: string;
}[] = [
	{
		id: "production",
		label: "r2_prod",
		hint: "tiles.retreever.org — what every shipped phone talks to. Deployed by ./deployProduction.sh, which asks for confirmation first.",
	},
	{
		id: "localDev",
		label: "local_dev",
		hint: "127.0.0.1:8787 — run `npm run dev` in workers/offline-tiles. Needs --remote to reach R2: the checked-in planet.pmtiles is a 0-byte placeholder.",
	},
];

// undefined = not probed yet (shown neutral, still clickable — a slow probe
// must never make a working Worker look dead).
let reachable = $state<Partial<Record<WorkerTarget, boolean>>>({});

function pickTarget(t: WorkerTarget) {
	// Refuse a target nothing is listening on. Silently switching to a dead
	// Worker gives a map that never fills and no error — the failure shape this
	// whole subsystem keeps producing. [[no-silent-fallbacks]]
	if (reachable[t] === false) return;
	setWorkerTarget(t);
	target = t;
}

async function probeAll() {
	for (const t of TARGETS) {
		reachable[t.id] = await probeTarget(t.id);
	}
	// If the CURRENT target turned out to be gone, fall back rather than sit
	// there pointed at nothing.
	if (reachable[target] === false && reachable.production !== false) {
		pickTarget("production");
	}
}

onMount(() => {
	target = getWorkerTarget();
	// Unlike the ⚙ this panel is always visible, so probe on mount rather than
	// on open.
	void probeAll();
});
</script>

<div class="config">
	<div class="config-title">CONFIG</div>

	<div class="cfg-title">Workers</div>
	{#each TARGETS as t (t.id)}
		<button
			class="cfg-row"
			class:sel={target === t.id}
			class:dead={reachable[t.id] === false}
			disabled={reachable[t.id] === false}
			onclick={() => pickTarget(t.id)}
			title={reachable[t.id] === false
				? `${t.label} is not answering — ${t.id === "localDev" ? "start it with `npm run dev` in workers/offline-tiles (add --remote to reach R2)" : "the Worker is unreachable from here"}`
				: t.hint}
		>
			<span class="cfg-label">{t.label}</span>
			<span class="sw" class:sw-on={target === t.id}></span>
		</button>
	{/each}
	<div class="cfg-note">
		reads only — this picks where blobs come FROM. Deploying is still
		<code>./deployProduction.sh</code>, which asks for confirmation first.
	</div>

	{#if layers.length > 0}
		<div class="cfg-sep"></div>
		<div class="cfg-title">layers</div>
		{#each layers as l (l.key)}
			<button
				class="cfg-row"
				class:sel={l.on}
				class:dead={l.disabled}
				disabled={l.disabled}
				onclick={l.toggle}
				title={l.disabled
					? (l.disabledHint ?? `${l.label} is not switchable yet`)
					: `Toggle ${l.label} — watch the heap reading in MAP DEBUGGER`}
			>
				<span class="cfg-label">{l.label}</span>
				{#if l.disabled}
					<span class="dead-tag">not yet</span>
				{/if}
				<span class="sw" class:sw-on={l.on}></span>
			</button>
		{/each}
		<div class="cfg-note dim">any combination · heap updates each second</div>
	{/if}
</div>

<style>
.config {
	font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
	background: #12100cd9;
	border: 1px solid #3a3428;
	border-radius: 10px;
	padding: 0.6rem 0.7rem;
}
.config-title {
	color: #e8b84b;
	font-size: 1.6rem;
	letter-spacing: 0.04em;
	text-align: center;
	margin-bottom: 0.8rem;
}
.cfg-title {
	color: #ffd24a;
	letter-spacing: 0.08em;
	margin-bottom: 4px;
}
.cfg-subtitle {
	color: #8f8a76;
	letter-spacing: 0.06em;
	font-size: 0.85em;
	margin: 6px 0 2px;
}
.cfg-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	width: 100%;
	background: none;
	border: 0;
	color: #b8b8b8;
	font: inherit;
	padding: 3px 0;
	cursor: pointer;
	text-align: left;
}
.cfg-label {
	/* Grows to fill the row so every .sw switch lands on the SAME right edge
	   regardless of label length ("Fires" vs "Roads/water") — that drift is
	   what reads as "toggles not lined up". */
	flex: 1 1 auto;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.cfg-row.sel {
	color: #e8e8e8;
}
.cfg-row.dead {
	opacity: 0.45;
	cursor: not-allowed;
}
.dead-tag {
	flex: 1 1 auto;
	min-width: 0;
	margin-left: auto;
	color: #8f8a76;
	font-size: 0.85em;
	text-align: right;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.cfg-sep {
	border-top: 1px solid #3a3a3a;
	margin: 7px 0 5px;
}
.cfg-note {
	color: #8f8a76;
	margin-top: 5px;
	line-height: 1.3;
}
.cfg-note.dim {
	opacity: 0.75;
}
.cfg-note code {
	font: inherit;
	color: #b8b8b8;
}
.sw {
	flex: 0 0 auto;
	width: 30px;
	height: 16px;
	border-radius: 999px;
	background: #4a4a4a;
	position: relative;
	transition: background 120ms ease;
}
.sw::after {
	content: "";
	position: absolute;
	top: 2px;
	left: 2px;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #fff;
	transition: transform 120ms ease;
}
.sw-on {
	background: #35c759;
}
.sw-on::after {
	transform: translateX(14px);
}
</style>
