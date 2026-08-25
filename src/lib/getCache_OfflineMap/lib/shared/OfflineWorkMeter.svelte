<!--
  MAP DEBUGGER — the visible breaker panel for BOTH maps.

  Renders NOTHING outside dev. Sits top-left over the map, small enough to
  ignore and specific enough to settle an argument.

  It mounts on the offline map AND on the online map (/mobile/map) on purpose:
  the whole offline-cost question is a COMPARISON against the online route, and
  you cannot compare an instrumented route against a blind one.

  HOW TO READ IT, sitting still and touching nothing:
    • ⚠ N INSTANCES        → STOP. Another tab of this app is live; every
                             memory number you read is the sum of both.
    • runs climbing        → something works while the app is idle
    • RUNNING 40s          → one pass is taking far longer than its trigger interval
    • QUEUED (amber)       → a pass was asked for while one was in flight
    • RUNNING + QUEUED, permanently → RUNAWAY. Passes chain forever; memory climbs.

  It is deliberately dumb: it polls its own display clock so the "running for
  Ns" number ticks up, and reads $state straight from workMeter.
-->
<script lang="ts">
import { dev } from "$app/environment";
import { onMount } from "svelte";
import { workStats, payloadStats, resetWorkStats } from "./workMeter.svelte";
import {
	startInstanceWatch,
	otherInstances,
	startPortWatch,
	devPortCounts,
	totalDevTabs,
} from "./instanceWatch.svelte";
import { subscribeOfflineBake } from "../onPhone/bake/bakeService.svelte";
import {
	HEAP_NOTE,
	collectFocusedBlobReport,
	debugReportFilename,
	type LngLatPin,
} from "./debugReport";
// ── LIVE BAKE STATE ─────────────────────────────────────────────────────
// The panel used to say "nothing tracked yet / no runs" WHILE a blob was
// downloading, because `rows` only fills once a pass COMPLETES. So the one
// moment you most want information — the 20-60 s wait — showed none, and
// "still working" was indistinguishable from "wedged". These four lines are
// the live truth, ticking every second.
let bakeOn = $state(false);
let bakePend = $state(0);
let bakeFail = $state(0);
let bakeNote = $state("");
let bakeSecs = $state(0);
let bakeT0 = 0;
/**
 * How long one continuous download stretch may run before the panel calls it
 * STALLED rather than "downloading".
 *
 * A cold pack build is MEASURED at ~56-66 s on the Worker and the client's own
 * fetch deadline is 150 s, so anything past that is not slow — it is stuck, and
 * the panel must stop implying otherwise.
 */
const STALL_AFTER_S = 150;

/**
 * ⛔ THE PANEL GOES QUIET AFTER THIS, NO MATTER WHAT THE BAKE SAYS.
 *
 * The bake service flips `downloading:true` once PER AREA, and only back to
 * false when the WHOLE pass ends. Re-baking a large library means that flag is
 * true for many minutes without interruption, so the panel sat there announcing
 * work forever. The user, twice:
 *
 *   "there's got to be a limit on this thing... it keeps resetting to zero but
 *    it doesn't stop. It just goes and goes and goes endlessly... it doesn't
 *    need to be telling the user that. It just screams that the thing is
 *    broken."
 *
 * And he was right on the substance too: the download that provoked it ARRIVED,
 * correctly. A progress indicator that outlives the thing it describes is worse
 * than none — it reports a failure that did not happen.
 *
 * So the live line is a SHORT-LIVED reassurance, not a running commentary. Past
 * this it hides itself; the work continues silently and the completed-pass rows
 * below are where the real history lives.
 */
const HIDE_AFTER_S = 20;
let bakeTick: ReturnType<typeof setInterval> | undefined;

$effect(() => {
	const off = subscribeOfflineBake((st) => {
		if (st.downloading && !bakeOn) {
			// ⛔ ONLY START THE CLOCK IF IT IS NOT ALREADY RUNNING.
			//
			// This used to reset `bakeT0` on EVERY downloading:true edge, and the
			// bake service emits one per AREA. With a queue of areas the clock was
			// re-zeroed every few hundred ms, so the panel read "downloading 0s"
			// forever — MEASURED on screen at "downloading 0s · 106 queued".
			//
			// That is the worst possible reading: it says work is happening AND
			// that no time has passed, so "still going" and "wedged" look
			// identical — the exact confusion this panel exists to remove.
			// The user: "there needs to be a limit on this timer thing... it gets
			// just frozen and that's so stupid. Obviously the thing's not coming."
			if (!bakeTick) {
				bakeT0 = Date.now();
				bakeSecs = 0;
				bakeTick = setInterval(() => {
					bakeSecs = Math.round((Date.now() - bakeT0) / 1000);
				}, 1000);
			}
		} else if (!st.downloading && bakeOn) {
			clearInterval(bakeTick);
			bakeTick = undefined;
			bakeSecs = 0;
		}
		bakeOn = st.downloading;
		bakePend = st.pending;
		bakeFail = st.failing;
		bakeNote = st.note;
	});
	return () => {
		clearInterval(bakeTick);
		off();
	};
});

interface Props {
	/** Which map this is, shown to OTHER tabs so a peer row names its route. */
	route?: string;
	/**
	 * Every pin the host page knows about. Passed IN on purpose — this is
	 * OFFLINE_MAP_SPEC.md rule 5's "a list of {lng, lat} and nothing else".
	 * Reading mapStore from in here would couple the debugger to TinyBase and
	 * cost it the portability that lets it move into the harness.
	 */
	pins?: LngLatPin[];
	/** The blob signature areas SHOULD hold, so the export can flag stale ones. */
	blobVersion?: string | null;
	/**
	 * Which layers are on, so the export report can record the map's state at
	 * export time. The toggle UI itself lives in OfflineConfigPanel — this
	 * component only reads `on` for the report, it does not render switches.
	 */
	layers?: { key: string; on: boolean }[];
	/**
	 * DOCKED — render in the normal flow instead of fixed to the viewport.
	 *
	 * The default (false) is right for the app: the meter floats over a
	 * full-screen map, where being in the flow would mean sitting under the
	 * shovel and the tab bar. A debug PAGE lays panels out in columns, and a
	 * fixed panel cannot be in a column — it drifts out of its rail and can
	 * never line up with its neighbour. That page passes `docked`.
	 */
	docked?: boolean;
	/** Name of the area export json actually exports — debugReport.ts scopes
	 *  its `latest` field to the newest-touched blob, and OfflineBlobPanel
	 *  marks that same row FOCUSED. Shown on the button so scope is
	 *  unambiguous before the tap, per the design handoff. */
	focusedBlobName?: string | null;
}
let {
	docked = false,
	route = "map",
	pins = [],
	blobVersion = null,
	layers = [],
	focusedBlobName = null,
}: Props = $props();

// ── EXPORT ──────────────────────────────────────────────────────────────
// Scoped to ONE blob — the focused row — not a device inventory. The old
// collectDebugReport()'s `areas` array is every cached area (measured: 391
// rows → a ~5,000-line file from one tap); export json is "everything about
// the top blob and the memory it's taking", not a dump of the other 390.
let exporting = $state(false);
let exportMsg = $state("");
/** Which action just completed, for the confirmation flash — separate from
 *  exportMsg's error text so a successful copy/save reads as a state change
 *  on the button, not a line of text. */
let justDid = $state<"copied" | "saved" | null>(null);
let flashTimer: ReturnType<typeof setTimeout> | undefined;

function flash(action: "copied" | "saved") {
	justDid = action;
	clearTimeout(flashTimer);
	flashTimer = setTimeout(() => (justDid = null), 1800);
}

async function buildReport() {
	return collectFocusedBlobReport({
		route,
		tabs,
		peers: peers.length,
		heapNowMb: heap,
		heapLowMb: floor,
		heapPeakMb: peak,
		heapAtLoadMb: heap0,
		layers: layers.map((l) => ({ key: l.key, on: l.on })),
	});
}

async function copyJson() {
	if (exporting) return;
	exporting = true;
	exportMsg = "";
	try {
		const json = JSON.stringify(await buildReport(), null, 2);
		await navigator.clipboard.writeText(json);
		flash("copied");
	} catch (err) {
		// Fail LOUD (spec rule 3): a silent no-op here reads as "nothing to
		// export", which is a different and much more alarming finding.
		exportMsg = err instanceof Error ? err.message : "copy failed";
	} finally {
		exporting = false;
	}
}

async function downloadJson() {
	if (exporting) return;
	exporting = true;
	exportMsg = "";
	try {
		const json = JSON.stringify(await buildReport(), null, 2);
		const url = URL.createObjectURL(
			new Blob([json], { type: "application/json" }),
		);
		const a = document.createElement("a");
		a.href = url;
		a.download = debugReportFilename();
		a.click();
		// Revoke on the next task — revoking synchronously can cancel the
		// download in some browsers before it has read the blob.
		setTimeout(() => URL.revokeObjectURL(url), 0);
		flash("saved");
	} catch (err) {
		exportMsg = err instanceof Error ? err.message : "export failed";
	} finally {
		exporting = false;
		setTimeout(() => (exportMsg = ""), 2500);
	}
}

let now = $state(Date.now());
let open = $state(true);
let host: HTMLElement | undefined = $state();

// Join the roll call. Dev-gated inside startInstanceWatch, so this is a no-op
// in production even though the call site is unconditional.
onMount(() => startInstanceWatch(route));
onMount(() => startPortWatch());

const peers = $derived(otherInstances());
const ports = $derived(devPortCounts());
const tabs = $derived(totalDevTabs());

/**
 * Live JS heap, if the browser exposes it (Chromium does). This is the
 * GARBAGE-INCLUSIVE number — it is NOT how much RAM the app costs, and a
 * WebGL map churning per frame can read high and mean nothing. It is here
 * for its TREND: watch whether it climbs while you sit still. The browser
 * Task Manager's Memory Footprint remains the authoritative residency number.
 */
interface MemoryInfo {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
}
function heapMb(): number | null {
	const m = (performance as Performance & { memory?: MemoryInfo }).memory;
	return m ? Math.round(m.usedJSHeapSize / 1048576) : null;
}
let heap = $state<number | null>(null);
// Heap at first paint, so the panel can show DRIFT rather than a bare number
// you have to remember the start of.
let heap0 = $state<number | null>(null);

/**
 * PEAK + FLOOR tracking — the numbers that actually characterise this route.
 *
 * The offline map's problem is NOT its resting cost (idle is close to the
 * online map's) — it is the SPIKE on interaction: measured ~475 MB on zoom
 * versus ~150-200 MB online. A live instantaneous number cannot show that,
 * because by the time you look, the peak has passed and been collected.
 *
 * So the panel remembers the highest and lowest it has seen. Zoom around,
 * then read the spread off the screen — no DevTools, no screenshot of a
 * whole window to recover one number.
 */
let peak = $state<number | null>(null);
let floor = $state<number | null>(null);
/** Running mean of every sample this session — the design handoff's "avg"
 *  bar. Kept as sum/count rather than storing every sample twice. */
let heapSum = 0;
let heapCount = 0;
let heapAvg = $state<number | null>(null);
/** Session heap trace for the sparkline — {t, mb} at 1 Hz (finer is wasted on
 *  a ~300px-wide line). Capped so an all-day tab doesn't grow this forever;
 *  the design only needs the SHAPE of the session, not an infinite ledger. */
const TRACE_MAX = 300;
let heapTrace = $state<{ t: number; mb: number }[]>([]);
let peakAt = $state<number | null>(null);

function resetPeaks(): void {
	peak = heap;
	floor = heap;
	heap0 = heap;
	heapSum = heap ?? 0;
	heapCount = heap === null ? 0 : 1;
	heapAvg = heap;
	heapTrace = heap === null ? [] : [{ t: Date.now(), mb: heap }];
	peakAt = heap === null ? null : Date.now();
}

// One cheap tick a second so in-flight durations count up. Nothing else in
// here schedules work — the panel must never be part of what it measures.
onMount(() => {
	if (!dev) return;
	// 4 Hz, not 1 Hz: a zoom spike lasts a couple of seconds, and a 1 s
	// sampler walks straight past the peak it exists to catch.
	const id = setInterval(() => {
		now = Date.now();
		const h = heapMb();
		heap = h;
		if (h === null) return;
		if (heap0 === null) heap0 = h;
		if (peak === null || h > peak) {
			peak = h;
			peakAt = Date.now();
		}
		if (floor === null || h < floor) floor = h;
		heapSum += h;
		heapCount += 1;
		heapAvg = Math.round(heapSum / heapCount);
	}, 250);
	// 1 Hz trace sampler — separate from the 4 Hz peak-catcher above, since the
	// sparkline draws the session's SHAPE, not every 250ms wobble.
	const traceId = setInterval(() => {
		const h = heapMb();
		if (h === null) return;
		heapTrace = [...heapTrace.slice(-(TRACE_MAX - 1)), { t: Date.now(), mb: h }];
	}, 1000);
	return () => {
		clearInterval(id);
		clearInterval(traceId);
	};
});

/** heapTrace mapped onto a 300×44 viewBox — same box the sparkline SVG uses. */
const sparkPoints = $derived.by(() => {
	if (heapTrace.length < 2) return "";
	const mbs = heapTrace.map((s) => s.mb);
	const lo = Math.min(...mbs);
	const hi = Math.max(...mbs, lo + 1); // +1 guards a flat trace (hi===lo)
	const n = heapTrace.length;
	return heapTrace
		.map((s, i) => {
			const x = (i / (n - 1)) * 300;
			const y = 40 - ((s.mb - lo) / (hi - lo)) * 36;
			return `${x.toFixed(1)},${y.toFixed(1)}`;
		})
		.join(" ");
});

/** Where the peak sample sits along the sparkline, in viewBox x — drives the
 *  red dot + dashed guide. null when the peak isn't in the visible trace
 *  (trimmed off by TRACE_MAX on a long session). */
const peakSparkX = $derived.by(() => {
	if (peakAt === null || heapTrace.length < 2) return null;
	const idx = heapTrace.findIndex((s) => s.t === peakAt);
	if (idx === -1) return null;
	return (idx / (heapTrace.length - 1)) * 300;
});

// PORTAL TO <body>. `.mobile-preview-frame` sets `contain: layout`, which makes
// it the containing block for position:fixed descendants — so a "fixed" panel
// stays trapped inside the phone, under the shovel and the tab bar. CSS alone
// cannot escape it ([[fixed-position-hands-are-frame-local-contain-layout]]).
// Moving the node itself out to <body> is the only way to sit beside the phone.
// ⚠️ NOT WHEN DOCKED. The portal exists to ESCAPE the phone frame; a docked
// meter is deliberately laid out inside a rail, and yanking the node to <body>
// takes it out of that column — it lands at the page's top-left corner behind
// whatever is there, which looks exactly like the panel disappearing.
$effect(() => {
	if (docked || !dev || !host || typeof document === "undefined") return;
	document.body.appendChild(host);
	return () => host?.remove();
});

const rows = $derived(workStats());
const pays = $derived(payloadStats());
/** Total KB pushed into the Mapbox worker for re-parsing since load. */
const payTotalKb = $derived(pays.reduce((n, p) => n + p.totalKb, 0));

function secs(ms: number): string {
	return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

/** Same shape as secs(): roll up to the bigger unit once it reads better. */
function fmtKb(kb: number): string {
	if (kb <= 0) return "—";
	return kb < 1024 ? `${kb}KB` : `${(kb / 1024).toFixed(1)}MB`;
}
</script>

{#if dev}
	<div class="meter" class:docked={docked} class:collapsed={!open} bind:this={host}>
		<div class="head-row">
			<button
				class="head"
				onclick={() => (open = !open)}
				title="Offline work meter — counts what runs while you sit still"
			>
				<span class="dot" class:live={rows.some((r) => r.startedAt !== null)}
				></span>
				MAP DEBUGGER {open ? "▾" : "▸"}
			</button>
			<div class="export-group">
				<button
					class="export"
					class:did={justDid === "copied"}
					onclick={copyJson}
					disabled={exporting}
					title="Copy the focused blob's metadata as JSON"
				>
					<span class="ej-main">{justDid === "copied" ? "✓ copied" : exportMsg || (exporting ? "…" : "copy json")}</span>
					{#if focusedBlobName}
						<span class="ej-sub">{focusedBlobName}</span>
					{/if}
				</button>
				<button
					class="export"
					class:did={justDid === "saved"}
					onclick={downloadJson}
					disabled={exporting}
					title="Download the focused blob's metadata as JSON"
				>
					<span class="ej-main">{justDid === "saved" ? "✓ saved" : exportMsg || (exporting ? "…" : "download")}</span>
					{#if focusedBlobName}
						<span class="ej-sub">{focusedBlobName}</span>
					{/if}
				</button>
			</div>
		</div>

		<!-- THE INSTANCE LINE. ALWAYS shown, never hidden by collapse.
		     A detector that only speaks when something is wrong is
		     indistinguishable from a detector that is broken — "1 instance ·
		     clean" is the reading that tells you it is actually working AND
		     that this measurement counts. -->
		<div class="inst" class:bad={peers.length > 0 || tabs > 1}>
			{#if peers.length > 0 || tabs > 1}
				⚠ {Math.max(peers.length + 1, tabs)} TABS — readings contaminated
			{:else}
				✓ 1 tab · clean · /{route}
			{/if}
			<div class="dupe-list">
				{#each peers as p (p.id)}
					<div>· same-origin tab on /{p.route}</div>
				{/each}
				<!-- Per-port truth from the dev servers themselves. This is what
				     catches a leftover :4173 preview tab and a private window —
				     neither of which BroadcastChannel can see. -->
				{#each ports as p (p.port)}
					<div class:warn={p.clients > 1}>
						· :{p.port} — {p.clients}
						{p.clients === 1 ? "tab" : "tabs"}
					</div>
				{/each}
			</div>
		</div>

		{#if heap !== null}
			<!-- WHY "main thread only" is spelled out: performance.memory reports
			     THIS realm's heap and nothing else. On this route the Workers
			     hold MORE than the page does (measured: page 321 MB vs workers
			     164 MB idle, and workers grew +258 MB on a single zoom while the
			     page grew +86). DevTools → Memory → "Total JS heap size" is the
			     number that includes workers. -->
			<div class="heap" title={HEAP_NOTE}>
				<div class="heap-head">
					<span class="heap-title">MEMORY</span>
					<span class="heap-note">resets on refresh · or new blob load</span>
				</div>

				{#each [{ cls: "now", lbl: "now", v: heap }, { cls: "avg", lbl: "avg", v: heapAvg }, { cls: "peak", lbl: "peak", v: peak }] as row (row.cls)}
					{#if row.v !== null}
						<div class="memrow {row.cls}">
							<span class="lbl">{row.lbl}</span>
							<div class="track">
								<div
									class="fill"
									style="width:{peak ? Math.max(4, (row.v / peak) * 100) : 0}%"
								></div>
							</div>
							<span class="val">{row.v} MB</span>
						</div>
					{/if}
				{/each}

				{#if sparkPoints}
					<div class="sparkwrap">
						<svg viewBox="0 0 300 44" preserveAspectRatio="none">
							<polyline points={sparkPoints} fill="none" stroke={"#6fb3d9"} stroke-width="2" />
							{#if peakSparkX !== null}
								{@const py =
									40 -
									((peak! - Math.min(...heapTrace.map((s) => s.mb))) /
										(Math.max(...heapTrace.map((s) => s.mb), Math.min(...heapTrace.map((s) => s.mb)) + 1) -
											Math.min(...heapTrace.map((s) => s.mb)))) *
										36}
								<circle cx={peakSparkX} cy={py} r="3.5" fill="#e2553f" />
								<line
									x1={peakSparkX}
									y1={py}
									x2={peakSparkX}
									y2="44"
									stroke="#e2553f"
									stroke-width="1"
									stroke-dasharray="2,3"
								/>
							{/if}
						</svg>
						<div class="sparklabel">
							<span>session start</span>
							<span class="spike">peak spike</span>
							<span>now</span>
						</div>
					</div>
				{/if}
				<button class="mini zero-btn" onclick={resetPeaks}>zero</button>
			</div>
		{/if}

		{#if open}
			<!-- LIVE — shown whether or not any pass has completed. This is the
			     answer to "is it still going, and for how long?" -->
			<div class="bake-live" class:on={bakeOn && bakeSecs < HIDE_AFTER_S}>
				{#if bakeOn && bakeSecs >= HIDE_AFTER_S && bakeSecs < STALL_AFTER_S}
					<!-- ⛔ QUIET. Work is still happening; saying so on a loop reads
					     as "broken" (it is not) and cannot be acted on. -->
					<strong class="dim">working…</strong>
				{:else if bakeOn && bakeSecs >= STALL_AFTER_S}
					<!-- ⛔ SAY IT IS STUCK. A spinner that never stops is a lie: the
					     download either arrives or it does not, and after this long
					     it is not coming. Naming it is the whole point. -->
					<strong class="fail">⚠️ stalled</strong>
					<span class="secs">{bakeSecs}s</span>
					{#if bakePend > 0}<span class="dim">· {bakePend} queued</span>{/if}
				{:else if bakeOn}
					<strong>⏳ downloading</strong>
					<span class="secs">{bakeSecs}s</span>
					{#if bakePend > 0}<span class="dim">· {bakePend} queued</span>{/if}
				{:else}
					<strong class="dim">idle</strong>
					{#if bakePend > 0}<span class="dim">· {bakePend} queued</span>{/if}
				{/if}
				{#if bakeFail > 0}
					<span class="fail">· {bakeFail} failing</span>
				{/if}
			</div>
			{#if bakeNote}
				<div class="hint bake-note">{bakeNote}</div>
			{/if}

			{#if rows.length === 0}
				<!-- The "bake boots ~20s after load" explainer is a TOOLTIP now:
				     it was true on every render forever, so as standing text it
				     only ever cost height. -->
				<div
					class="empty"
					title="waiting for first pass — bake boots ~20s after load"
				>
					no bake pass has run yet
				</div>
				<div class="foot">
					<span class="dim">run counts</span>
					<button onclick={resetWorkStats}>clear counts</button>
				</div>
			{:else}
				<table>
					<tbody>
						{#each rows as r (r.name)}
							<tr class:hot={r.startedAt !== null}>
								<td class="name">{r.name}</td>
								<td class="num">{r.runs}</td>
								<td class="num">{secs(r.lastMs)}</td>
								<td class="num dim" title="worst run">{secs(r.maxMs)}</td>
								<td class="flags">
									{#if r.startedAt !== null}
										<span class="run">▶ {secs(now - r.startedAt)}</span>
									{/if}
									{#if r.queued}<span class="q">QUEUED</span>{/if}
									{#if r.skips > 0}
										<span class="skip" title={r.lastSkip}>
											{r.skips} skipped
										</span>
									{/if}
									{#if r.errors > 0}<span class="err">{r.errors}✕</span>{/if}
								</td>
							</tr>
							{#if r.skips > 0 && r.lastSkip}
								<tr>
									<td colspan="5" class="why">
										↳ last skip: {r.lastSkip}
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
				<div class="foot">
					<span class="dim">runs · last · worst</span>
					<button onclick={resetWorkStats}>reset</button>
				</div>
			{/if}

			<!-- PAYLOADS — bytes handed to Mapbox's worker to re-parse. Rendered
			     outside the rows/empty branch because a wall rebuild pushes data
			     whether or not any tracked operation ran. -->
			{#if pays.length > 0}
				<div class="paysec">
					<div class="payhead">
						setData → mapbox worker
						<span class="dim">{fmtKb(payTotalKb)} total re-parsed</span>
					</div>
					<table>
						<tbody>
							{#each pays as p (p.name)}
								<tr>
									<td class="name">{p.name.replace("v4-", "").replace("-geo", "")}</td>
									<td class="num" title="sends since load">×{p.sends}</td>
									<td class="num" title="last payload">{fmtKb(p.lastKb)}</td>
									<td class="num dim" title="largest payload">{fmtKb(p.maxKb)}</td>
									<td class="num dim" title="total re-parsed since load">
										{fmtKb(p.totalKb)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<div class="foot">
						<span class="dim">sends · last · biggest · total</span>
					</div>
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
/* Design tokens lifted from the "Map Debugger" design handoff (dark, gold
   accent). Matched here rather than pulled from a shared token file — there
   isn't one for this component pair yet (see OfflineBlobPanel.svelte, which
   hardcodes the same values so the two cards stay one instrument). */
.meter {
	--bg: #0a0a0a;
	--panel: #141414;
	--panel3: #0f0f0f;
	--border: rgba(255, 255, 255, 0.1);
	--border2: rgba(255, 255, 255, 0.2);
	--text: #f3f1e9;
	--muted: #8f8b80;
	--muted2: #5f5c53;
	--gold: #eab627;
	--amber: #d99a3d;
	--green: #7fbf6a;
	--blue: #6fb3d9;
	--red: #e2553f;
}

/* DOCKED — in the flow, for a page that lays panels out in columns. Everything
   else (colours, type, borders) is shared; only the positioning differs. */
.meter.docked {
	position: static;
	left: auto;
	top: auto;
	width: 100%;
	box-sizing: border-box;
	/* Undoes the base .meter's max-width: 420px — that cap exists for the
	   FLOATING instrument (must stay small so it doesn't cover the map), not
	   this one, which sits in a rail and should use the rail's full width. */
	max-width: none;
}

.meter {
	/* FIXED to the VIEWPORT, not the phone frame. This is a debugging
	   instrument, not app UI — inside the frame it sat under the shovel and
	   the tab bar, exactly where you can't read it. Top-left of the whole
	   window keeps it clear of the phone and of DevTools on the right. */
	position: fixed;
	left: 10px;
	top: 10px;
	z-index: 99999;
	font:
		12px/1.4 "JetBrains Mono",
		ui-monospace,
		SFMono-Regular,
		Menlo,
		monospace;
	color: var(--text);
	/* Matched to OfflineBlobPanel: the two cards are one instrument, so they
	   share background, border, radius and width. */
	background: var(--panel);
	border: 1px solid var(--border);
	border-radius: 14px;
	padding: 12px 14px;
	max-width: 420px;
	pointer-events: auto;
	box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5);
}
.head {
	display: flex;
	align-items: center;
	gap: 6px;
	background: none;
	border: 0;
	color: var(--gold);
	font: inherit;
	font-family: "Inter", -apple-system, sans-serif;
	font-weight: 800;
	font-size: 13px;
	letter-spacing: 0.03em;
	padding: 0;
	cursor: pointer;
	white-space: nowrap;
}
.dot {
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: var(--muted2);
}
.dot.live {
	background: var(--gold);
}
table {
	border-collapse: collapse;
	margin-top: 4px;
}
td {
	padding: 1px 5px 1px 0;
	white-space: nowrap;
	vertical-align: top;
}
.name {
	color: var(--blue);
}
.num {
	text-align: right;
	font-variant-numeric: tabular-nums;
}
.dim {
	color: var(--muted);
}
tr.hot .name {
	color: var(--gold);
}
.flags {
	display: flex;
	gap: 5px;
}
.run {
	color: var(--gold);
}
.q {
	color: var(--amber);
	font-weight: 700;
}
.err {
	color: var(--red);
}
.empty {
	color: var(--muted);
	margin-top: 3px;
}
/* The instance line is ALWAYS present — green when clean so you can trust it,
   loud red when not, because that one condition silently invalidates every
   other number in the panel. */
.inst {
	margin-top: 12px;
	padding: 9px 13px;
	border-radius: 9px;
	background: rgba(127, 191, 106, 0.08);
	border: 1px solid rgba(127, 191, 106, 0.4);
	color: var(--green);
	font-weight: 600;
	max-width: 100%;
	white-space: normal;
}
.inst.bad {
	background: rgba(226, 85, 63, 0.1);
	border-color: var(--red);
	color: var(--red);
	font-weight: 700;
}
.hint {
	color: var(--muted2);
	font-size: 11px;
	margin-top: 2px;
	max-width: 100%;
	white-space: normal;
}
.dupe-list {
	font-weight: 400;
	color: var(--muted);
	margin-top: 4px;
	font-size: 11px;
}
.dupe-list .warn {
	color: var(--amber);
	font-weight: 700;
}
/* MEMORY block — three bar rows (now/avg/peak) + a session sparkline,
   matched to the design handoff's .memrow/.sparkwrap layout. */
.heap {
	margin-top: 16px;
}
.heap-head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 10px;
	margin-bottom: 10px;
}
.heap-title {
	font-size: 11px;
	font-weight: 800;
	letter-spacing: 0.1em;
	color: var(--muted);
}
.heap-note {
	font-size: 10px;
	color: var(--muted2);
}
.memrow {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-top: 7px;
}
.memrow .lbl {
	width: 30px;
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.05em;
	color: var(--muted);
	text-transform: uppercase;
}
.memrow .track {
	flex: 1;
	height: 14px;
	background: var(--panel3);
	border-radius: 4px;
	position: relative;
	overflow: hidden;
	border: 1px solid var(--border);
}
.memrow .fill {
	position: absolute;
	left: 0;
	top: 0;
	height: 100%;
	border-radius: 3px;
}
.memrow.now .fill {
	background: var(--blue);
}
.memrow.avg .fill {
	background: var(--muted2);
}
.memrow.peak .fill {
	background: var(--red);
}
.memrow .val {
	width: 58px;
	text-align: right;
	font-weight: 700;
	font-size: 13px;
	color: var(--text);
	font-variant-numeric: tabular-nums;
}
.memrow.peak .val {
	color: var(--red);
}
.memrow.now .val {
	color: var(--blue);
}
.sparkwrap {
	margin-top: 12px;
	padding: 10px 10px 6px;
	background: var(--panel3);
	border: 1px solid var(--border);
	border-radius: 8px;
}
.sparkwrap svg {
	display: block;
	width: 100%;
	height: 44px;
}
.sparklabel {
	display: flex;
	justify-content: space-between;
	font-size: 9.5px;
	color: var(--muted2);
	margin-top: 4px;
}
.sparklabel .spike {
	color: var(--red);
}
.mini {
	background: none;
	border: 0;
	color: var(--muted);
	font: inherit;
	text-decoration: underline;
	cursor: pointer;
	padding: 0;
}
.zero-btn {
	margin-top: 8px;
}
/* A skip is amber, not red: refusing to run is often CORRECT. It earns
   attention because it explains an empty panel, not because it is a fault. */
.skip {
	color: var(--amber);
}
.why {
	color: var(--muted);
	font-size: 11px;
	padding-bottom: 3px;
}
/* Payload section — separated by a rule because it answers a different
   question from the timing rows above it (bytes re-parsed, not ms spent). */
.paysec {
	margin-top: 6px;
	padding-top: 4px;
	border-top: 1px solid var(--border);
}
.payhead {
	display: flex;
	justify-content: space-between;
	gap: 10px;
	color: var(--text);
	margin-bottom: 2px;
}
.foot {
	display: flex;
	justify-content: space-between;
	gap: 10px;
	margin-top: 4px;
	padding-top: 8px;
	border-top: 1px solid var(--border);
}
.foot button {
	background: none;
	border: 0;
	color: var(--muted);
	font: inherit;
	cursor: pointer;
	padding: 0;
	text-decoration: underline;
}

/* LIVE BAKE ROW — the panel's answer to "is anything happening right now?".
   Dim when idle so it never competes with the numbers; lit while working. */
.bake-live {
	display: flex;
	align-items: baseline;
	gap: 0.35em;
	padding: 10px 0 0;
	font-variant-numeric: tabular-nums;
}
.bake-live.on strong {
	color: var(--gold);
}
.bake-live .secs {
	color: var(--gold);
	font-weight: 700;
}
.bake-live .fail {
	color: var(--red);
}
.bake-note {
	padding-bottom: 0.25rem;
}
/* ── header row: title + export ───────────────────────────────────────── */
.head-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px 10px;
}
.head-row .head {
	flex: 1 1 auto;
	min-width: 0;
}
.export-group {
	flex: 0 0 auto;
	display: flex;
	gap: 6px;
}
/* Same gradient/bevel/glow recipe as Get Cache's .rt-gold-btn (app.css) —
   that class lives on the ReTreever side and this child cannot import it
   (open-core boundary), so the look is hand-matched here instead. */
.export {
	flex: 0 0 auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1px;
	border: none;
	border-radius: 9px;
	font: inherit;
	font-family: "Inter", -apple-system, sans-serif;
	padding: 6px 14px;
	cursor: pointer;
	white-space: nowrap;
	background: linear-gradient(180deg, #f5d565 0%, #e8b923 100%);
	box-shadow:
		0 2px 0 #b8901c,
		0 6px 14px rgba(232, 185, 35, 0.25),
		inset 0 1px 0 rgba(255, 255, 255, 0.45);
	transition:
		transform 80ms ease,
		box-shadow 80ms ease,
		background 80ms ease;
}
.export,
.export * {
	color: #1a1405;
}
.export:active:not(:disabled) {
	background: linear-gradient(180deg, #c9a028 0%, #e8b923 100%);
	box-shadow:
		0 1px 0 #b8901c,
		0 2px 6px rgba(232, 185, 35, 0.15),
		inset 0 1px 0 rgba(255, 255, 255, 0.15);
	transform: translateY(1px);
}
.export .ej-main {
	font-weight: 800;
	font-size: 12.5px;
}
.export .ej-sub {
	font-family: "JetBrains Mono", ui-monospace, monospace;
	font-size: 9.5px;
	font-weight: 600;
	opacity: 0.7;
}
.export:disabled {
	opacity: 0.55;
	cursor: default;
}
/* Confirmation flash — a quick green pulse so a copy/download registers as a
   state change on the button itself, not just a word swap that's easy to
   miss. Reminds you the JSON is still on your clipboard after the flash
   fades, per the ask ("reminds me it's on my clipboard"). */
.export.did {
	animation: export-flash 1.8s ease-out;
}
@keyframes export-flash {
	0% {
		background: linear-gradient(180deg, #9fe6a0 0%, #6fbf6a 100%);
		box-shadow:
			0 2px 0 #4a8f47,
			0 6px 14px rgba(127, 191, 106, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.45);
	}
	70% {
		background: linear-gradient(180deg, #9fe6a0 0%, #6fbf6a 100%);
	}
	100% {
		background: linear-gradient(180deg, #f5d565 0%, #e8b923 100%);
	}
}
</style>
