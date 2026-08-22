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
} from "$osem/components/map/offline/r2Worker/tilesHost";

let {
	layers = [],
}: {
	/** Layer switches, independent of each other — the point is to turn things
	 *  off one at a time and watch the heap. */
	layers?: { key: string; label: string; on: boolean; toggle: () => void }[];
} = $props();

// ── WORKER TARGET ───────────────────────────────────────────────────────
// Three workers: production, remote dev (tiles-dev), local `wrangler dev`.
// Changing it re-points the NEXT request; in-flight ones finish where they
// started.
let target = $state<WorkerTarget>("production");

const TARGETS: { id: WorkerTarget; label: string; hint: string }[] = [
	{
		id: "production",
		label: "prod",
		hint: "tiles.retreever.org — what every shipped phone talks to. Deployed by a bare `wrangler deploy`, which is a release, never a test.",
	},
	{
		id: "localDev",
		label: "local Dev",
		hint: "127.0.0.1:8787 — run `npm run dev` in workers/offline-tiles. Needs --remote to reach R2: the checked-in planet.pmtiles is a 0-byte placeholder.",
	},
	{
		id: "remoteDev",
		label: "remote dev",
		hint: "tiles-dev.retreever.org — the staging Worker. Deployed by `wrangler deploy --env staging`. Same R2 bucket, read-only.",
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
			{#if reachable[t.id] === false}
				<span class="dead-tag">not running</span>
			{/if}
			<span class="sw" class:sw-on={target === t.id}></span>
		</button>
	{/each}
	<div class="cfg-note">
		reads only — this picks where blobs come FROM. Deploying is still
		<code>wrangler deploy</code> on the command line.
	</div>

	{#if layers.length > 0}
		<div class="cfg-sep"></div>
		<div class="cfg-title">layers</div>
		{#each layers as l (l.key)}
			<button
				class="cfg-row"
				class:sel={l.on}
				onclick={l.toggle}
				title="Toggle {l.label} — watch the heap reading in MAP DEBUGGER"
			>
				<span class="cfg-label">{l.label}</span>
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
.cfg-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	width: 100%;
	background: none;
	border: 0;
	color: #b8b8b8;
	font: inherit;
	padding: 3px 0;
	cursor: pointer;
	text-align: left;
}
.cfg-row.sel {
	color: #e8e8e8;
}
.cfg-row.dead {
	opacity: 0.45;
	cursor: not-allowed;
}
.dead-tag {
	margin-left: auto;
	margin-right: 6px;
	color: #8f8a76;
	font-size: 0.9em;
	white-space: nowrap;
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
