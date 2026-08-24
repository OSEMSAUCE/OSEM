/**
 * offlineBakeService — the offline map's DATA engine, running APP-WIDE.
 *
 * ⛔ THE ROOT LAW THIS FILE EXISTS TO ENFORCE:
 *   An offline blob is downloaded the moment a feature is created/touched and
 *   then stays on the device, ready forever. The user NEVER has to visit the
 *   offline map for their blobs to exist — visiting it only VIEWS them. If a
 *   blob only materialised when you opened /mobile/offlinev4, it's already too
 *   late: the whole value proposition (confidence the data is there when you
 *   have no signal) is broken. (See OFFLINE_PLAN.md "Reconcile".)
 *
 * So the bake/download/evict brain lives HERE, started once from the mobile
 * layout, and reacts to host place changes regardless of which route is open.
 * The offline PAGE (`/mobile/offlinev4`) is a pure VIEWER: it reads whatever
 * this service has already written to disk and never bakes or downloads.
 *
 * This module touches NO Mapbox map — it only reads the HOST PORT (the shared
 * singleton, self-hydrating from TinyBase) and writes IndexedDB:
 *   • satellite photo   → `satelliteImage` (retreever-v3-satimg)
 *   • wall-map tiles     → `v4CloudflareTiles` (retreever-v4-tiles via /pack)
 *   • coverage registry  → `coverageRegistry` (dedup / budget / eviction brain)
 *
 * It notifies subscribers (the page) via a callback (the applier pattern —
 * NOT a reactive cross-module getter, which is brittle under HMR; see the
 * `cross-module-state-use-applier-pattern` memory): a generation counter bumps
 * when on-disk data changed (new area downloaded / evicted) so the viewer
 * re-decodes, and a note string drives the viewer's "Saving offline map…"
 * spinner.
 */

import { isDownloadGuardTripped } from "../store/downloadGuard";
import {
	allCoverage,
	backfillCoverageMirror,
	type CoverageRecord,
	dropCoverage,
	EST_AREA_BYTES,
	noteCoverage,
	OFFLINE_BUDGET_BYTES,
} from "../store/coverageRegistry";
import {
	deleteVectorAt,
	getVectorFeaturesAt,
	getVectorKeys,
} from "../store/tombstones/legacyVectorCleanup";
import {
	BAKE_RADIUS_KM,
	BAKE_VERSION,
	bakeSatelliteImage,
	deleteSatImage,
	getSatImageByKey,
	getSatKeys,
	satImageKey,
	satImageMeta,
} from "../satellite/satelliteImage";
import { MAP_HOME_CENTER } from "$harness/components/map/mapShared/homeCentre";
import { vlog } from "$harness/components/map/mapShared/verboseLog";
import type { HostPorts } from "$harness/components/map/mapShared/hostPorts";
import { needsFireDisc, needsMapBlob, snapLiveAnchor } from "$harness/components/map/mapShared/liveAnchor";
import { checkDownloadGate, noteDownloadedBytes } from "../offlineDownloadGate";
import {
	areaCentreCovered,
	areaTilesPresent,
	areaTilesPresentIn,
	downloadV4Area,
	getAllTileKeys,
	PACK_FORMAT_VERSION,
	purgeEmptyTilesOnce,
} from "../../r2Worker/roads/packDownload";
import { GRID_RADIUS_KM } from "../../contract/blob";
import { BLOB_TILE_Z } from "../../contract/grid";
import { FIRE_RADIUS_KM } from "$harness/components/map/mapShared/fireContract";
import { purgeDeadRoadRasters } from "../store/tombstones/purgeRoadRasters";
import { beginWork, noteQueued, noteSkip } from "$harness/components/map/mapShared/workMeter.svelte";

/**
 * BLOB_VERSION — the signature of "what a complete offline blob looks like right
 * now": the ring geometry (radii + zooms), the pack wire format, the satellite
 * radius, and the satellite bake version, all joined. DERIVED, not hand-bumped —
 * change any input (grow the detail ring, bump the pack format, widen the
 * satellite) and this string changes automatically. The reconcile stamps it on
 * every area it builds and refuses to skip an area whose stored stamp ≠ this one,
 * so old pins re-download under the new shape instead of being pinned by a bare
 * hasLines:true.
 */
export const BLOB_VERSION = [
	`pf${PACK_FORMAT_VERSION}`,
	// THE SHAPE. Was `rings…`, a list of radius@zoom pairs. The unit is now a
	// square grid CELL — which IS the z10 slippy tile — so the stamp names the
	// zoom (from which the cell size follows) and the guaranteed radius.
	// Deliberately NOT a km cell size: a slippy tile narrows with latitude, so a
	// single number would be a lie everywhere but one parallel.
	`cell@${BLOB_TILE_Z}r${GRID_RADIUS_KM}km`,
	`sat${BAKE_RADIUS_KM}km`,
	`bake${BAKE_VERSION}`,
].join("|");

// ── subscriber bridge (applier pattern) ────────────────────────────────────
export interface OfflineBakeStatus {
	/** The active-map spinner note ("Saving offline map…" / ""). */
	note: string;
	/** Bumps whenever on-disk data changed (area downloaded or evicted) — the
	 *  viewer re-decodes its wall map + re-mounts cached photos on each bump. */
	generation: number;
	/** TRUE while a pass is actively fetching missing blobs (not just idling). */
	downloading: boolean;
	/** How many areas the CURRENT pass still has to download (counts down live). */
	pending: number;
	/** How many areas' photo bakes are in backoff (the source is throttling them).
	 *  A non-zero idle value = "sitting there with broken features, waiting to retry". */
	failing: number;
	/** WHERE the current download is, [lng, lat], or null when idle.
	 *  The waiting animation anchors to THIS, not to the map centre — the user
	 *  asked three times for it to sit above the pin being fetched instead of
	 *  floating mid-screen where it lands under the popover. */
	at: [number, number] | null;
}
let status: OfflineBakeStatus = {
	note: "",
	generation: 0,
	downloading: false,
	pending: 0,
	failing: 0,
	at: null,
};
const listeners = new Set<(s: OfflineBakeStatus) => void>();

/** Subscribe to bake status. Fires immediately with the current status, then on
 *  every change. Returns an unsubscribe fn. */
export function subscribeOfflineBake(
	fn: (s: OfflineBakeStatus) => void,
): () => void {
	listeners.add(fn);
	fn(status);
	return () => listeners.delete(fn);
}
function emit(): void {
	for (const fn of listeners) fn(status);
}
function setNote(note: string): void {
	if (status.note === note) return;
	status = { ...status, note };
	emit();
}
/** Update the live activity counters (downloading / pending / failing). */
function setActivity(
	downloading: boolean,
	pending: number,
	failing: number,
	at: [number, number] | null = status.at,
): void {
	if (
		status.downloading === downloading &&
		status.pending === pending &&
		status.failing === failing &&
		status.at === at
	)
		return;
	status = { ...status, downloading, pending, failing, at };
	emit();
}

/** Publish WHERE the current download is, so the UI can sit over it. */
function setAt(at: [number, number] | null): void {
	if (status.at === at) return;
	status = { ...status, at };
	emit();
}
function bumpGeneration(): void {
	status = { ...status, generation: status.generation + 1 };
	emit();
}

// ── reconcile (DATA only — no map) ──────────────────────────────────────────
/**
 * THE HOST PORT — the engine's entire view of the app around it (see
 * mapShared/hostPorts.ts). Set by `startOfflineBakeService`, which every runtime
 * calls once from the mobile layout.
 *
 * Null until then, and the passes below read that as "no places yet" rather than
 * throwing: a bake can be kicked by a timer that outlives teardown, and an
 * offline map with nothing to bake is a valid state, not an error.
 */
let ports: HostPorts | null = null;

let reconciling = false;
let rerun = false;
let backfilled = false;

// Reconcile-pass scratch: coverage keyed by areaKey (so ensureAreaData can tell
// if a pin's tiles are already on disk), and areaKey → newest feature touch time.
let covByKey = new Map<string, CoverageRecord>();
let touchByKey = new Map<string, number>();

// SATELLITE BACKOFF — when a photo bake FAILS (the EOX source throttled, e.g. a bulk
// import fired hundreds of bakes at once), retrying it every 20 s just keeps the
// source rate-limited so it NEVER recovers. After each failure we set a cooldown
// (exponential, capped at 15 min) and skip that area's photo until it lapses. Success
// clears it. This is what lets the 🟠 "no photo" pins heal back to 🟢 instead of
// hammering the source forever. It does NOT gate the roads — only the photo bake.
const satCooldown = new Map<string, { until: number; fails: number }>();
// FIRE BACKOFF — same shape, same reason, separate map: a throttled photo source
// must not suppress fire refreshes, and a NASA outage must not stall photo bakes.
const fireCooldown = new Map<string, { until: number; fails: number }>();
// THIS PASS's live position (null = unknown / not permitted). Read once at the
// top of bakeAll and reused by the fire pass, so one geolocation read serves the
// whole pass instead of every area asking independently.
let liveFix: [number, number] | null = null;
// Did THIS pass change anything on disk (download / fresh bake / eviction)?
// Drives the generation bump that tells the viewer to re-decode.
let passChanged = false;

/**
 * ONE LINE PER *RUN* — not per pass. A run is "the conveyor drained".
 *
 * ── WHY A TALLY, AND WHY IT SPANS PASSES ──────────────────────────────────
 *
 * A pass walks every area on every map and downloads the ones missing. It
 * used to log three lines per area (`downloading…`, `ARRIVED:`, `server:`),
 * so a normal pass wrote sixty lines that differed only in coordinates.
 * Summing them into one line per pass was the obvious fix — and it was still
 * a wall. MEASURED 2026-08-19: ~30 consecutive
 *
 *     [roads] pass: 1 area(s), 1 tiles, 0.1 MB in 7.9s · v22-cell-frame
 *
 * lines, and the stack under each one read `bakeAll ← bakeAll ← setTimeout ←
 * bakeAll`, nested six deep.
 *
 * ⛔ THE UNIT OF WORK IS NOT A PASS. A pass is a TIME SLICE — `BAKE_PASS_BUDGET_MS`
 * stops it after one area so the main thread can serve taps, then `budgetPaused`
 * schedules the next slice. Thirty passes was ONE body of work, chopped up on
 * purpose, and reporting per slice reported the chopping, not the work.
 *
 * So the tally is CUMULATIVE, spanning every slice of one run.
 *
 * ⛔ AND IT DOES NOT PRINT. Three rewrites tried to make this line less
 * redundant — per-area, then per-pass, then per-run, then gated on bytes — and
 * every one of them still filled the console, because the redundancy was never
 * in the format. The bake fires every 20 s for as long as the app is open, so
 * ANY line it prints unconditionally is a clock: same shape, same numbers,
 * three times a minute, forever. A recurring event has nothing new to say.
 *
 * The data is good, so it is kept — behind the flag:
 *
 *     localStorage.rtVerbose = 'wall'   → the run tally + every area + slice
 *
 * The steady state of this route is SILENCE. Exactly one condition still speaks
 * unprompted (see reportRun): every area came back empty, which means the
 * Worker is answering wrong — a real failure that renders and throws nothing,
 * and that stops the moment it is fixed.
 */
const pass = {
	slices: 0,
	areas: 0,
	tiles: 0,
	bytes: 0,
	ms: 0,
	empty: 0,
	cacheHits: 0,
	builds: new Set<string>(),
};
/** True while the next bakeAll is a CONTINUATION of the current run, not a new
 *  one — set wherever a slice schedules its own resume. */
let resumingRun = false;
function resetPassTally(): void {
	pass.slices = 0;
	pass.areas = 0;
	pass.tiles = 0;
	pass.bytes = 0;
	pass.ms = 0;
	pass.empty = 0;
	pass.cacheHits = 0;
	pass.builds.clear();
}
/**
 * Print the RUN report — only when the conveyor drained AND it did something.
 *
 * `more` is true while another slice is already scheduled (`budgetPaused`) or
 * queued (`rerun`). Reporting then would report the time-slicing, which is the
 * bug this exists to kill.
 */
function reportRun(more: boolean): void {
	if (more) return; // mid-run: the next slice keeps accumulating into `pass`
	if (pass.areas === 0) return; // fully baked: silence is the correct report
	const mb = (pass.bytes / 1e6).toFixed(1);
	// `empty` areas are NORMAL (ocean, wilderness — a real answer of "no roads
	// here"), but ALL-empty is the tell that the Worker is answering wrong.
	const allEmpty = pass.empty === pass.areas;
	const emptyNote =
		pass.empty > 0 ? ` · ${pass.empty} empty` : "";
	const build = pass.builds.size ? ` · ${[...pass.builds].join("+")}` : "";
	const cache = pass.cacheHits ? ` · ${pass.cacheHits} cached` : "";
	const slices = pass.slices > 1 ? ` · ${pass.slices} slices` : "";
	const line = `${pass.areas} area(s), ${pass.tiles} tiles, ${mb} MB in ${(pass.ms / 1000).toFixed(1)}s${cache}${build}${slices}${emptyNote}`;

	// ⛔ A HEARTBEAT IS NOT A REPORT — THIS LINE IS OPT-IN NOW.
	//
	// The bake runs every 20 s, forever, for as long as the app is open. Any
	// line it prints unconditionally is therefore a CLOCK, not news: the same
	// shape, the same numbers, three times a minute, saying "still fine". It
	// was rewritten three times to be less redundant — per-area → per-pass →
	// per-run, then gated on bytes — and each version still printed, because
	// the redundancy was never in the FORMAT. A recurring event has nothing new
	// to say, so the fix is not to say it better but to not say it.
	//
	// It is real diagnostic data, so it is kept, behind the flag that already
	// exists for exactly this:  localStorage.rtVerbose = 'wall'
	vlog("wall", line);

	// The ONE exception, and the only thing here that is genuinely news: EVERY
	// area came back empty. That is not a status tick, it is the Worker
	// answering wrong — the failure this route cannot show you any other way,
	// because a missing tile renders nothing and throws nothing. It is also
	// self-limiting: it stops the moment the deploy is fixed, so it can never
	// become the wallpaper the line above became.
	if (allEmpty) {
		console.warn(
			`[roads] ⚠️ ALL ${pass.areas} area(s) came back EMPTY — the Worker returned no tiles (${build.trim() || "unknown build"})`,
		);
	}
}

// LIE-FI GUARDS (July-6 field failure): on weak signal the bake's fetches used
// to hang 30–75 s and starve the map's own requests. Two gates, both enforced
// in kickBake so EVERY trigger path (register-fire, interval, visibilitychange,
// map change) respects them:
//   • BOOT DELAY — the first pass waits 20 s after service start so boot + the
//     map's own style/tile fetches get the pipe first.
//   • TIMEOUT BACKOFF — a pass that hit a fetch timeout/abort skips kicks for an
//     escalating window (60 s, doubling, cap 5 min); any timeout-free pass resets.
const BOOT_BAKE_DELAY_MS = 20_000;
/** How long ONE pass may spend downloading before it stops cleanly and lets the
 *  next tick continue. Measured: an unbounded pass ran 81 s on a map with many
 *  pins, with the next pass already queued — 87% of the tab's allocation was
 *  that loop's decode-and-clone, and the heap never got a quiet moment.
 *  5 s is long enough to land 1–3 areas per pass and short enough that the app
 *  is idle far more often than it is busy. */
const BAKE_PASS_BUDGET_MS = 5_000;
/** A budget-paused pass has work LEFT, so it must not wait the full 20 s. Long
 *  enough that the main thread and GC actually get their breath back. */
const BUDGET_RESUME_MS = 1_500;
const TIMEOUT_BACKOFF_START_MS = 60_000;
const TIMEOUT_BACKOFF_CAP_MS = 300_000;
let bootBakeAt = 0; // no kicks before this timestamp
let timeoutBackoffUntil = 0;
let nextTimeoutBackoffMs = TIMEOUT_BACKOFF_START_MS;
let passSawTimeout = false; // did THIS pass hit a TimeoutError/AbortError?
// The download circuit breaker latches for the session; announce that once
// rather than re-logging an identical stack on every 20 s tick.
let guardTripAnnounced = false;

/** AbortSignal.timeout → "TimeoutError"; a manual abort → "AbortError". */
function isTimeoutErr(err: unknown): boolean {
	const name = (err as { name?: string } | null)?.name;
	return name === "TimeoutError" || name === "AbortError";
}

/**
 * Ensure ONE area's blob is on disk (photo + wall-map tiles) and RECORDED in the
 * registry — the data half of the old page `ensureArea`, with all map-mounting
 * stripped out. Bakes only what's missing (bakes are idempotent — cached if
 * present, re-fetched if a prior bake failed). Storage is keyed by AREA, not map,
 * so an area shared by pins on different maps is baked ONCE and reused.
 */
async function ensureAreaData(
	center: [number, number],
	corridor: boolean,
): Promise<void> {
	const key = satImageKey(center);
	const [lng, lat] = center;
	let photoBytes = 0;
	let lineBytes = 0;
	let lineCount = 0;
	let hasPhoto = false;
	let hasLines = false;
	const prevCov = covByKey.get(key);

	// The satellite photo (EOX) and the wall-map tiles (R2 /pack) are two
	// INDEPENDENT fetches — overlap them instead of paying photo-then-tiles
	// serially (the photo alone is ~10 s). Each task writes only its OWN outer
	// vars, so there's no race; we join with Promise.all before recording.
	//
	// CORRIDOR (line features): skip the satellite entirely — a route wants the
	// roads ribbon, not a photo at every sample point. The tiles come down as a
	// thin roads-only corridor (downloadV4Area's `corridor` flag → the Worker's
	// CORRIDOR_RINGS), so a corridor area is "complete" with NO photo.
	const satTask = (async (): Promise<void> => {
		if (corridor) return;
		// BACKOFF: if this area's photo bake recently failed, leave it alone until the
		// cooldown lapses (don't re-hammer the throttled source). Roads still download.
		const cd = satCooldown.get(key);
		if (cd && cd.until > Date.now()) return;
		const hadPhoto = prevCov?.hasPhoto === true;
		const sat = await bakeSatelliteImage(center);
		if (sat) {
			hasPhoto = true;
			photoBytes = sat.blob.size;
			satCooldown.delete(key); // success → clear any backoff
			if (!hadPhoto) passChanged = true; // a photo that wasn't there before
		} else {
			// Bake FAILED (source throttled / came back mostly empty). Exponential
			// backoff: 30 s, 1 m, 2 m, … capped at 15 m, so the source can recover.
			const fails = (cd?.fails ?? 0) + 1;
			satCooldown.set(key, {
				fails,
				until:
					Date.now() + Math.min(900_000, 30_000 * 2 ** Math.min(fails - 1, 5)),
			});
		}
	})();

	const tilesTask = (async (): Promise<void> => {
		// CONSTRAINT VALIDATION — do NOT trust the registry flag. Verify the tiles
		// are really on disk; a DB bump or eviction deletes them while hasLines
		// lingers. Re-download whenever the blob is gone, so every feature's wall
		// map self-heals on the next pass.
		let tilesValid = false;
		const versionCurrent = prevCov?.blobVersion === BLOB_VERSION;
		if (prevCov?.hasLines && versionCurrent) {
			// SURVIVAL — current version, loose probe (any disc key present). The
			// strict centre probe thrashes on an edge-sparse area (data only far
			// from the pin): centre empty → re-download every pass = a data runaway.
			//
			// `lineCount === 0` means the SERVER told us this area holds no vector
			// data, so there is nothing on disk to probe for and the area is done.
			// That must be an EXPLICIT zero: a MISSING count (undefined) means
			// "unknown", and collapsing unknown→0 would mark a never-verified area
			// as complete forever, killing the re-download self-heal after an
			// eviction. Unknown falls through to the probe, which is the safe side.
			tilesValid =
				prevCov.lineCount === 0 || (await areaTilesPresent(lng, lat));
		} else {
			// NO RECORD or a STALE-version record → STRICT centre probe so the area
			// "gets the memo": adopt only if a CURRENT neighbour already covers the
			// centre (dedup — clustered stale areas reuse the first one's fresh tiles
			// instead of each re-downloading), else re-download under the new shape.
			tilesValid = await areaCentreCovered(lng, lat);
		}
		if (tilesValid) {
			hasLines = true;
			lineBytes = prevCov?.lineBytes ?? 0;
			lineCount = prevCov?.lineCount ?? 0;
		} else if (typeof navigator !== "undefined" && navigator.onLine === false) {
			// OFFLINE — the download can't succeed; skip it quietly (the area stays
			// un-recorded so the next ONLINE pass fetches it). Throwing here would
			// abort the whole pass and starve the rest.
		} else {
			// ROADS ARRIVING. Every failure on this route is SILENT (a missing tile
			// renders nothing and throws nothing), so "20 seconds passed and no
			// roads came" must stay distinguishable from "the download never
			// started" — but that is ONE fact per pass, not three lines per area.
			//
			// ⛔ This used to print `downloading…`, `ARRIVED:` and `server:` for
			// EVERY area, and a pass walks dozens. Nine tenths of it was identical
			// every time (same radius, same build, same shape of diag), so the one
			// number that actually varied — did anything come down? — was buried in
			// its own repetition. The pass tally below prints those same facts once,
			// with the per-area detail available via `localStorage.rtVerbose='wall'`.
			vlog(
				"wall",
				`downloading 30 km blob @ ${lng.toFixed(4)},${lat.toFixed(4)}…`,
			);
			setAt([lng, lat]);
			const t0 = Date.now();
			// TIMED IN THE DEBUGGER — the user asked to see "how long it took the
			// blobs to arrive... that way we could see all of them compared".
			// `beginWork` already gives runs / last / worst per named slot and the
			// meter already renders it, so a blob arrival is just another slot
			// rather than a second timing mechanism to keep in sync.
			const doneRoads = beginWork("roads");
			let dl: Awaited<ReturnType<typeof downloadV4Area>>;
			try {
				dl = await downloadV4Area(lng, lat, undefined, corridor);
			} catch (err) {
				doneRoads(true); // count it as a failed run, not a missing one
				throw err;
			}
			doneRoads();
			setAt(null);
			const ms = Date.now() - t0;
			vlog(
				"wall",
				`ARRIVED: ${dl.downloaded} tiles, ${(dl.bytes / 1e6).toFixed(2)} MB, ${ms} ms` +
					(dl.build ? ` · ${dl.build}` : "") +
					(dl.cache ? ` · cache ${dl.cache}` : "") +
					(dl.diag ? ` · ${dl.diag}` : ""),
			);
			// Fold into the pass tally — printed ONCE when the pass ends.
			pass.areas++;
			pass.tiles += dl.downloaded;
			pass.bytes += dl.bytes;
			pass.ms += ms;
			if (dl.downloaded === 0) pass.empty++;
			if (dl.cache === "HIT") pass.cacheHits++;
			// WHICH WORKER BUILD ANSWERED — the user could not tell whether a deploy
			// had landed, so every result was ambiguous ("I can never tell when you
			// deploy"). One build per pass is the norm; the Set only grows if a
			// deploy lands mid-pass, which is itself worth seeing.
			if (dl.build) pass.builds.add(dl.build);
			hasLines = true; // covered (even if empty) so the record persists
			lineBytes = dl.bytes;
			lineCount = dl.downloaded;
			noteDownloadedBytes(dl.bytes); // tally toward the soft +100 MB cellular gate
			if (dl.downloaded > 0) {
				passChanged = true;
				// Nothing to invalidate here any more. Fresh tiles used to make the
				// cached road-raster stale (it drew OLDER data), so it had to be
				// dropped; the raster is deleted and the vectors ARE the tiles, so
				// they cannot disagree with themselves.
			}
		}
	})();

	await Promise.all([satTask, tilesTask]);

	await noteCoverage(
		key,
		lng,
		lat,
		{
			hasPhoto,
			hasLines,
			bytes: photoBytes + lineBytes,
			photoBytes,
			lineBytes,
			lineCount,
			blobVersion: BLOB_VERSION,
		},
		false,
		touchByKey.get(key), // prefer the area's real feature touch time for eviction order
	);
}

async function pruneArea(key: string): Promise<void> {
	await deleteSatImage(key);
	await deleteVectorAt(key);
	await ports?.fires?.delete(key); // an evicted area sheds ALL its data together
	await dropCoverage(key);
	passChanged = true;
}

/**
 * THE FIRE PASS — perishable data, on its own schedule.
 *
 * ⛔ WHY THIS IS NOT INSIDE `ensureAreaData` (it used to be, and that was a bug):
 * `ensureAreaData` is COMPLETION-GATED — the reconcile loop skips it entirely
 * once an area's photo and tiles are on disk ("if (satOnDisk && tilesOnDisk)
 * continue"). That is exactly right for tiles and photos, which are IMMUTABLE:
 * downloaded once, nothing left to do, forever. It is catastrophic for fires,
 * which go stale hourly — a crew settled at one camp would have hit that
 * `continue` on every pass and been shown yesterday's hotspots indefinitely,
 * with an age stamp quietly counting up. Perishable data cannot live inside a
 * function whose contract is "runs until the data exists, then never again".
 * Pinned by "offline tripwire 7"; it fails on the pre-fix code.
 *
 * Runs for CORRIDOR areas too (unlike the satellite): a planter driving a route
 * wants to know what is alight along it, and the payload is a few KB.
 *
 * FIRES ARE NEVER ALLOWED TO BREAK THE MAP. Every centre is wrapped
 * individually, so one poisoned record cannot starve the rest, and the caller
 * wraps the whole thing again — the map is the primary tool, fires are an
 * overlay, and the overlay must fail alone.
 */
async function refreshFires(
	centres: ReadonlyArray<[number, number]>,
): Promise<void> {
	// NO FIRE PORT → NO FIRE PASS. A host that omits `fires` (the harness demo) gets
	// a working offline map that never reaches for hotspots. Checked before the
	// online test so a portless host does no work at all.
	const fires = ports?.fires;
	if (!fires) return;

	// OFFLINE — keep whatever we have. Never clear on failure: stale dots with an
	// honest age stamp beat an empty map that reads as "no fires near you".
	if (typeof navigator !== "undefined" && navigator.onLine === false) return;

	// ARRIVAL — this pass ignores the TTL once. Consumed (not just read) so a
	// failed or skipped pass can't leave it armed and re-fetch every 20 s.
	const onDemand = fires.takeArrival();

	for (const [lng, lat] of centres) {
		const key = satImageKey([lng, lat]);
		const cd = fireCooldown.get(key);
		if (cd && cd.until > Date.now()) continue;
		try {
			const prev = await fires.read(key);
			// The TTL answers "has this gone stale on its own?". It cannot answer
			// "has the user just arrived and asked?" — and that is the one moment
			// freshness matters most: they have driven into signal and opened the
			// app SPECIFICALLY to check the fire. A 59-minute-old record passed
			// `fireIsFresh` and we fetched nothing, handing them an hour-old answer
			// without ever asking NASA. `onDemand` is that ask.
			if (prev && fires.isFresh(prev) && !onDemand) continue;
			// GEOGRAPHIC CONTAINMENT — is another area's disc already covering us?
			//
			// A fire disc is 500 km; a map area is 40 km. So a dozen pins on one
			// block sit inside ONE smoke shed, yet each is its own area key and
			// would otherwise pull its own near-identical 500 km disc every hour.
			// If a neighbouring FRESH disc already covers this centre with room to
			// spare (FIRE_TRIGGER_KM), reuse it and fetch nothing.
			//
			// Deliberately checked AFTER the freshness test above: this is the SPACE
			// axis, that one is the TIME axis. A user parked at one camp all season
			// never moves but must still get fresh dots hourly, and this gate must
			// never suppress that. Only FRESH discs count as cover — a stale
			// neighbour would otherwise keep this area permanently empty by
			// "covering" it with nothing.
			//
			// ⚠️ An ARRIVAL refresh must pierce this gate too. Both gates ask "do we
			// already have an acceptable answer?", and on arrival the answer to that
			// is "yes, and I still want a newer one" — so skipping here would quietly
			// undo the TTL bypass above and the user would get the same old dots.
			// COVERAGE ONLY — this gate reads centres, never hotspots. Pulling full
			// records here held tens of thousands of detections live in the bake
			// service's heap purely to compare circle centres.
			const coveringCentres = (await fires.coverage())
				.filter((c) => fires.isCoverageFresh(c))
				.map((e) => e.center);
			if (!onDemand && !needsFireDisc([lng, lat], coveringCentres)) continue;
			const r = await fires.fetchArea(lng, lat);
			await fires.write(key, {
				fetchedAt: r.fetchedAt,
				center: [lng, lat],
				radiusKm: FIRE_RADIUS_KM,
				sourcesOk: r.sourcesOk,
				// COPIED, not aliased. The port hands back a readonly view; the cache
				// entry owns a mutable array. Sharing one array would let a later cache
				// mutation reach back into the fetch result and vice versa — the
				// lossy-copy trap. [[quality704-autosave-lossy-copy-trap]]
				hotspots: [...r.hotspots],
			});
			fireCooldown.delete(key);
			noteDownloadedBytes(r.bytes); // tally toward the cellular gate
			passChanged = true; // new dots → tell the viewer to repaint
			vlog(
				"fire",
				`[v4 fire] downloaded ${r.hotspots.length} hotspots for ${key} (${(r.bytes / 1024).toFixed(1)} KB, ${r.sourcesOk}/3 satellites)`,
			);
		} catch (err) {
			// Same exponential backoff as the satellite bake: 30 s → 15 m. The
			// PREVIOUS record is deliberately left in place (see above).
			const fails = (cd?.fails ?? 0) + 1;
			const backoff = Math.min(900_000, 30_000 * 2 ** Math.min(fails - 1, 5));
			fireCooldown.set(key, { fails, until: Date.now() + backoff });
			// codestyle-allow-swallow: not a swallow — this catch drives the retry
			// backoff and warns by default (not dev-gated). The layer keeps its last
			// good hotspots and retries; there is nothing for the user to act on.
			console.warn(
				`[v4 fire] fetch failed for ${key} (attempt ${fails}, retrying in ${Math.round(backoff / 1000)}s) — keeping cached hotspots`,
				err,
			);
		}
	}
}

/**
 * THE FORMULA — the entire offline-blob rule, in ONE function:
 *
 *   for EVERY feature on EVERY map (+ the demo), newest-touched first:
 *       ensure its blob is on disk (download if missing)
 *       — until the 1 GB budget is full.
 *   anything past that line (the OLDEST, over budget) is evicted.
 *
 * That is the whole thing. NOT "the active map" — EVERY feature, always. The ONE
 * and only reason a blob does not exist: it is over the budget AND it is the
 * oldest-touched. Newest-first ordering means a just-dropped pin is FIRST in the
 * list, so it downloads immediately no matter how many features exist.
 * `ensureAreaData` is a no-op when the blob is already on disk (it probes the
 * disk), so a pass where nothing is missing is cheap. This also heals desyncs for
 * free: a "registry says photo, none stored" area is either re-baked (within
 * budget) or evicted (over budget) — no separate sweep needed.
 * (Coalesced: a change mid-pass re-runs once when the pass finishes.)
 */
async function bakeAll(): Promise<void> {
	// LATCHED BREAKER = DONE FOR THIS SESSION. Every guard call would rethrow the
	// same DownloadBudgetError, so a pass can only re-walk the grid and re-log.
	// Bail at the door instead of entering and failing per-area; only a reload
	// resets the guard (downloadGuard.ts, by design).
	if (isDownloadGuardTripped()) {
		// A latched breaker is TERMINAL, so this returns on EVERY subsequent
		// tick forever. Without recording it, the panel reads "nothing tracked"
		// indefinitely and looks broken rather than latched.
		noteSkip("bake", "download guard latched");
		// The breaker can latch mid-run, between slices — flush whatever the run
		// had already fetched rather than losing it, and stop the run cleanly.
		// (Terminal, so this only ever prints once: the tally is now empty.)
		resumingRun = false;
		reportRun(false);
		resetPassTally();
		return;
	}
	if (reconciling) {
		rerun = true;
		noteQueued("bake"); // runaway tell — see workMeter
		noteSkip("bake", "already running");
		return;
	}
	reconciling = true;
	noteQueued("bake", false);
	const bakeDone = beginWork("bake");
	// Declared out here because the `finally` schedules the resume — see the
	// TIME BUDGET note in the conveyor loop below.
	let budgetPaused = false;
	passChanged = false;
	passSawTimeout = false;
	// A RESUMED slice keeps accumulating into the SAME tally — see reportRun.
	// Only a genuinely fresh run starts the counters over.
	if (!resumingRun) resetPassTally();
	resumingRun = false;
	pass.slices++;
	liveFix = null; // stale fix from a previous pass must never leak into this one
	try {
		setNote("Saving offline map\u2026");
		// 1) EVERY area referenced by EVERY feature on EVERY map (deduped), carrying
		//    its newest touch time + whether EVERY referencing feature is a line
		//    (corridor = roads-only, no satellite; one point sharing the area forces
		//    the full photo).
		const areas = new Map<
			string,
			{ c: [number, number]; corridor: boolean; t: number }
		>();
		const note = (c: [number, number], corridor: boolean, t: number): void => {
			const k = satImageKey(c);
			const prev = areas.get(k);
			areas.set(k, {
				c,
				corridor: prev ? prev.corridor && corridor : corridor,
				t: Math.max(t, prev?.t ?? 0),
			});
		};
		// EVERY place seeds a blob, plots included. A planting block of wall-to-wall
		// plots doesn't blow the budget: each plot is ONE point anchor, and note()
		// dedups by satImageKey (the disc cell), so a whole block collapses into the
		// one disc it sits in. WHICH rows are places, and how a geometry becomes
		// anchors, is the HOST's business — see hostPorts.ts.
		for (const p of ports?.places() ?? []) {
			const t = Date.parse(p.lastTouched) || 0;
			for (const c of p.anchors) note(c, p.corridor, t);
		}
		// The permanent demo blob \u2014 always present, treated as newest so it is
		// never evicted.
		note(MAP_HOME_CENTER, false, Number.POSITIVE_INFINITY);

		// 1b) THE LIVE ANCHOR \u2014 where the user actually IS.
		//
		// Everything above comes from features, and a user who has just installed
		// the app and walked onto a block has none. They'd get nothing: no photo,
		// no roads, no fires, on the one screen that has to work without signal.
		// So an active user with location already granted gets covered for simply
		// being somewhere \u2014 no feature required, no prompt (see liveFix.ts).
		//
		// It is added LAST and gated on containment, which is what makes a MOVING
		// anchor safe here: `note()` keys by satImageKey, a ~11 m coordinate round
		// that assumes anchors never move. Pacing a block would otherwise mint a
		// new area every few steps.
		//
		// \u26a0\ufe0f CONTAINMENT IS MEASURED AGAINST WHAT IS ON DISK (covByKey), not just
		// against this pass's feature anchors. The live anchor is the only
		// TRANSIENT one \u2014 every other area is re-derived from a durable feature
		// each pass, but this one exists only while a fix is present, so it is
		// never re-noted on the next pass. Measuring against feature anchors alone
		// therefore reported "outside coverage" forever: the blob it had already
		// baked was invisible to the very check that decided whether to bake it.
		try {
			// Through the PORT: knowing where the user IS means permissions and
			// platform geolocation — the host's business, not the engine's. A host
			// that omits `gps` simply gets no live anchor; feature anchors alone are
			// a valid map, not a degraded one.
			const fix = (await ports?.gps?.()) ?? null;
			if (fix) {
				liveFix = fix; // the fire pass reads this too (different radius)
				// Read the registry HERE rather than using covByKey: that snapshot is
				// taken later in this pass (step 3), so at this point it still holds
				// the PREVIOUS pass's data. One extra read, and the check is measured
				// against present truth instead of a stale-by-one-pass copy.
				// Read the registry HERE rather than using covByKey: that snapshot is
				// taken later in this pass (step 3), so at this point it still holds
				// the PREVIOUS pass's data. One extra read, and the check is measured
				// against present truth instead of a stale-by-one-pass copy.
				// Read the registry HERE rather than using covByKey: that snapshot is
				// taken later in this pass (step 3), so at this point it still holds
				// the PREVIOUS pass's data. One extra read, and the check is measured
				// against present truth instead of a stale-by-one-pass copy.
				const stored = await allCoverage();
				const centres = [
					...[...areas.values()].map((a) => a.c),
					// STORED coverage — including the live blob baked on a previous pass.
					...stored.map((r) => [r.lng, r.lat] as [number, number]),
				];
				if (needsMapBlob(fix, centres)) {
					// Snapped, never raw: belt and braces behind containment so a raw
					// fix can never reach the 11 m key space. `corridor:false` \u2014 the
					// user is a point, and a point earns the full photo. Newest-touched
					// so it downloads before older feature areas.
					note(snapLiveAnchor(fix), false, Date.now());
					vlog(
						"map",
						`[v4 live] outside coverage \u2014 baking a blob at your position ${snapLiveAnchor(
							fix,
						)
							.map((n) => n.toFixed(2))
							.join(",")}`,
					);
				}
			}
		} catch (err) {
			// codestyle-allow-swallow: the live anchor is a BONUS on top of feature
			// anchors. A geolocation hiccup must never abort the pass and starve the
			// features the user explicitly created.
			console.warn("[v4 live] position unavailable this pass", err);
		}

		// 2) NEWEST-TOUCHED FIRST so a just-dropped pin downloads before everything.
		const ordered = [...areas.entries()].sort((a, b) => b[1].t - a[1].t);
		touchByKey = new Map(ordered.map(([k, v]) => [k, v.t]));

		// 3) DISK TRUTH \u2014 what is ACTUALLY stored + its REAL size. We do NOT trust the
		//    registry here: it can lie ("registry says photo, none stored"), and when
		//    the budget counted those phantom bytes it "filled up" on ghosts and
		//    stopped baking real features (the 6%-coverage bug). The blob store IS the
		//    truth. One getSatKeys + one satImageMeta, then O(1) lookups.
		//    METADATA ONLY — this pass runs every ~20 s, and the version that read
		//    whole blobs here to get `blob.size` allocated 613 MB (97.3% of the entire
		//    allocation profile) and OOM-crashed the tab. Never load pixels on a timer.
		const satKeys = new Set(await getSatKeys()); // ALL present photos (eviction truth)
		// FRESH = present AND baked by the CURRENT BAKE_VERSION. A photo baked by older
		// code (e.g. the lossless-PNG era) is treated as a MISS so it RE-BAKES into the
		// current format (WebP) — that's the whole point of BAKE_VERSION. Eviction still
		// uses the full satKeys set above, so a stale photo is never silently dropped.
		const freshSat = new Set<string>();
		const photoBytes = new Map<string, number>();
		for (const { key, bytes, bakeVersion } of await satImageMeta()) {
			photoBytes.set(key, bytes);
			if (bakeVersion === BAKE_VERSION) freshSat.add(key);
		}
		// covByKey only HINTS ensureAreaData's tile probe; it never gates a decision.
		covByKey = new Map((await allCoverage()).map((r) => [r.areaKey, r]));
		// EVERY stored wall-map tile key, loaded ONCE for the whole pass. We probe each
		// area's tiles in memory (areaTilesPresentIn) instead of opening IndexedDB per
		// area — at hundreds of areas every 20 s, per-area DB opens were a real I/O storm.
		const tileKeys = await getAllTileKeys();

		// 4) Keep newest-first until ACTUAL bytes fill the budget; download whatever
		//    is genuinely missing from disk. A present blob = zero work (no probe, no
		//    network). The budget is measured in REAL stored bytes, so it can never
		//    fill on ghosts again.
		// Total bytes ACTUALLY on disk now (disk truth) \u2014 INCLUDING blobs the live
		// map's own satellite cache shares this store with, so the 1 GB budget is
		// honest and can never be silently overrun.
		// THE CONVEYOR. Walk areas NEWEST-touched first, accumulating the bytes we
		// intend to KEEP. Each area within the running budget line is a keeper → make
		// sure BOTH its halves are on disk (photo + roads). Past the line it is older
		// than the budget allows → skip it here; the eviction step drops it. Because a
		// just-touched pin is FIRST, keptBytes is still ~0 when we reach it, so it
		// ALWAYS fits and DISPLACES the oldest — that is how a brand-new pin gets its
		// satellite even when the disk was already at the 1 GB cap.
		//
		// THE BUG THIS REPLACES: the old gate measured TOTAL bytes already on disk, so
		// once the disk was full of OLD photos it blocked EVERY new pin's photo and
		// nothing was ever displaced — "stuck at 1 GB, new pins get roads but no
		// satellite, ~nothing ejected." A new pin must out-rank an old one by touch.
		let keptBytes = 0;
		let gatePaused = false;
		let downloaded = 0; // areas actually fetched this pass (drives the live status)
		// ── THE TIME BUDGET ──
		//
		// This loop used to run until every incomplete area was downloaded. With a
		// lot of pins that is MINUTES of continuous decode-and-clone: measured at
		// 81 s for ONE pass, with the next pass already queued behind it, so the
		// app never got an idle moment and the heap never got a quiet GC. From the
		// user's chair that is "it works unbelievably hard just sitting there".
		//
		// So: work for a slice, then STOP CLEANLY and let the 20 s timer resume.
		// Progress is durable (each finished area is on disk and the next pass skips
		// it via freshSat/tileKeys), so stopping early costs nothing but latency —
		// and the ordering is newest-first, so the areas you care about most are
		// always the ones that got done.
		//
		// STOP ONLY BETWEEN AREAS, never mid-`ensureAreaData`: a half-written area
		// is exactly the corrupt state the self-heal pass exists to prevent.
		const passDeadline = Date.now() + BAKE_PASS_BUDGET_MS;
		for (const [k, { c, corridor }] of ordered) {
			// Checked at the TOP so the area about to start gets a full slice, and
			// only after at least one area landed (a pass must always make progress,
			// however slow the device).
			if (downloaded > 0 && Date.now() > passDeadline) {
				budgetPaused = true;
				break;
			}
			// Newest-first budget line: is THIS area (and everything newer) within
			// budget? Corridors carry no photo, so they cost ~0 against the photo budget.
			const sizeGuess = corridor ? 0 : (photoBytes.get(k) ?? EST_AREA_BYTES);
			if (keptBytes + sizeGuess > OFFLINE_BUDGET_BYTES) continue; // older than the line → evicted below
			keptBytes += sizeGuess;
			// COMPLETE = both halves on disk (a corridor needs only tiles).
			const satOnDisk = corridor || freshSat.has(k);
			// ⛔ AN EMPTY AREA IS COMPLETE, NOT MISSING. `areaTilesPresentIn` asks
			// "are there tile keys on disk for this disc?", and for an area the
			// server holds NO vector data for the honest answer is "no" — forever.
			// So the conveyor handed it to `ensureAreaData` on every pass; that
			// function knows better (`lineCount === 0` short-circuits its probe),
			// did nothing, and returned in under a millisecond. Zero bytes moved,
			// but the area was counted and the run reported — which is why the
			// console showed runs of "N area(s) … 0.0s · 3 empty" every 20 s, in
			// perpetuity. The work was real; it was just work on nothing.
			//
			// The gate now asks the SAME question ensureAreaData asks. `lineCount`
			// must be an EXPLICIT 0: undefined means "never verified", and treating
			// unknown as empty would mark a never-fetched area complete forever.
			const cov = covByKey.get(k);
			const serverHasNothing =
				cov?.blobVersion === BLOB_VERSION &&
				cov?.hasLines === true &&
				cov?.lineCount === 0;
			const tilesOnDisk =
				serverHasNothing || areaTilesPresentIn(tileKeys, c[0], c[1]);
			if (satOnDisk && tilesOnDisk) continue; // already COMPLETE -> zero work
			if (await checkDownloadGate()) {
				gatePaused = true; // user paused a heavy cellular download
				break;
			}
			// LIVE: we're actively fetching now (the page shows "⟳ downloading…").
			setActivity(true, ++downloaded, satCooldown.size);
			try {
				await ensureAreaData(c, corridor);
				// Replace the size ESTIMATE with the real baked photo size in keptBytes.
				if (!corridor) {
					const img = await getSatImageByKey(k);
					if (img && !photoBytes.has(k)) {
						keptBytes += img.blob.size - sizeGuess;
						photoBytes.set(k, img.blob.size);
						satKeys.add(k);
					}
				}
			} catch (err) {
				if (isTimeoutErr(err)) passSawTimeout = true;
				// TERMINAL vs TRANSIENT. The download circuit breaker LATCHES for the
				// whole session (downloadGuard.ts) — once tripped, every later guard
				// call rethrows the same error without attempting anything. Treating
				// that as "retry next pass" meant each 20 s tick re-walked the grid and
				// logged an identical stack, hundreds of times, each one retaining an
				// Error + context object. That is the console flood, and it is why the
				// tab's memory climbed over a long session.
				//
				// A latched breaker is TERMINAL: stop this pass and say so ONCE. Only a
				// reload clears it, which is the guard's deliberate design.
				if (isDownloadGuardTripped()) {
					if (!guardTripAnnounced) {
						guardTripAnnounced = true;
						console.error(
							"[offline-bake] 🛑 download circuit breaker is LATCHED — " +
								"stopping all baking for this session. Reload the page to reset.",
							err,
						);
					}
					break;
				}
				console.warn("[offline-bake] area failed (retry next pass)", err);
			}
		}

		// 5) EVICT \u2014 ONLY when the jar OVERFLOWS. Under the 1 GB budget NOTHING is
		//    ever removed; every blob persists forever. Past 1 GB the OLDEST-touched
		//    blobs fall off the back (the milk-shelf conveyor) until back under. That
		//    is the WHOLE eviction law: a blob disappears <=> over budget AND oldest.
		//    Orphans (no live feature \u2014 the live map's shared satellite cache, or a
		//    deleted pin's leftover) are KEPT while under budget; deleting them on
		//    sight was the bug that made the stored total swing wildly (578->206 in
		//    minutes). Skipped on a cellular pause (never drop what you have).
		const kept = new Set<string>();
		// SAFETY GUARD against the "1 GB → 70 MB" collapse: NEVER evict before the
		// host has HYDRATED. On a cold reload its place list is briefly empty;
		// if we evicted then, every stored blob would look unreferenced (touch 0) and
		// the conveyor would nuke nearly everything. With zero maps there is also nothing
		// legitimate to make room for, so skipping eviction is always safe — it resumes
		// the instant the host hydrates (onPlacesChanged re-fires). A genuinely
		// map-less new user has ~nothing stored anyway.
		//
		// ⚠️ `ready()`, NOT "places().length > 0". They differ in exactly the case
		// that matters: a hydrated host whose pins were all DELETED has zero places
		// but must still evict. Conflating them silently disabled the conveyor.
		// `budgetPaused` joins `gatePaused` here for the SAME reason: both mean the
		// conveyor walk stopped early, so `keptBytes` is a PARTIAL total. Evicting
		// against a partial keep-set would drop areas that are genuinely keepers —
		// the walk simply hadn't reached them yet. Eviction resumes on the next
		// pass that runs the walk to completion.
		if (!gatePaused && !budgetPaused && (ports?.ready() ?? false)) {
			const demoKey = satImageKey(MAP_HOME_CENTER);
			// Touch time of any stored blob: referenced areas use their feature touch
			// time, orphans their registry lastTouched (0 if none \u2014 the live-map cache,
			// the most disposable, so it ages out first under pressure). Demo never dies.
			const touchOf = (k: string): number => {
				if (k === demoKey) return Number.POSITIVE_INFINITY;
				const t = touchByKey.get(k);
				if (t !== undefined) return t;
				return covByKey.get(k)?.lastTouched ?? 0;
			};
			const sizeOf = (k: string): number =>
				photoBytes.get(k) ?? covByKey.get(k)?.bytes ?? EST_AREA_BYTES;
			const stored = [
				...new Set<string>([
					...satKeys,
					...(await getVectorKeys()),
					...(await allCoverage()).map((r) => r.areaKey),
				]),
			].sort((a, b) => touchOf(b) - touchOf(a)); // NEWEST first
			let total = 0;
			for (const k of stored) {
				total += sizeOf(k);
				if (total > OFFLINE_BUDGET_BYTES) {
					await pruneArea(k); // past the line = oldest, over budget -> conveyor drop
				} else {
					kept.add(k);
				}
			}

			// 6) MIRROR — force the ledger to match the disk EXACTLY so "desync" noise
			//    cannot exist: every kept blob that's really stored gets a current
			//    record (heals "photo stored, not in registry" orphans); non-kept were
			//    pruned above (heals "registry says photo, none stored"). Only writes
			//    when a record is missing/stale, so it's free at steady state.
			const liveSat = new Set(await getSatKeys());
			// LINES LIVE IN THE V4 TILE PILE — ask `rt-tiles-v3`, NOT `rt-vectors`.
			// `getVectorKeys()` reads the LEGACY v3 store, which nothing has written
			// to since the Overpass bake was removed (legacyVectorCleanup.ts is a
			// tombstone kept only so the evictor can reclaim old installs' bytes). On
			// any modern install it is EMPTY, so this mirror computed hasLines:false
			// for every area and overwrote each freshly-downloaded record — even one
			// holding 188 real tiles. The download loop then saw hasLines:false, failed
			// its skip check, and re-downloaded the identical area on EVERY 20 s pass,
			// forever, until the session pack budget tripped the circuit breaker.
			// That was the "downloading the same blobs over and over".
			// Same in-memory key set the download loop uses (line ~639), so the mirror
			// and the skip check can no longer disagree about what is on disk.
			const liveTileKeys = await getAllTileKeys();
			for (const [k, { c }] of ordered) {
				if (!kept.has(k)) continue;
				const hasPhoto = liveSat.has(k);
				const hasLines = areaTilesPresentIn(liveTileKeys, c[0], c[1]);
				if (!hasPhoto && !hasLines) continue; // nothing actually on disk yet
				const rec = covByKey.get(k);
				const current =
					!!rec &&
					rec.hasPhoto === hasPhoto &&
					rec.hasLines === hasLines &&
					rec.blobVersion === BLOB_VERSION;
				if (current) continue;
				// CARRY the existing line accounting forward. This mirror only knows
				// PRESENCE (is it on disk?), never the byte/count detail the download
				// recorded, so it must not invent either.
				//
				// `lineCount` is load-bearing: the skip check treats `lineCount === 0`
				// as "the server said this area is genuinely EMPTY, don't probe disk
				// for it". `?? 0` on a MISSING count would silently claim that, and an
				// area whose tiles were really evicted would never re-download — the
				// self-heal, gone. So when lines are absent, drop the count entirely
				// (undefined = "unknown", which forces the disk probe) rather than
				// asserting zero.
				const lineBytes = hasLines ? (rec?.lineBytes ?? 0) : 0;
				const lineCount = hasLines ? rec?.lineCount : undefined;
				await noteCoverage(
					k,
					c[0],
					c[1],
					{
						hasPhoto,
						hasLines,
						photoBytes: photoBytes.get(k) ?? 0,
						lineBytes,
						lineCount,
						bytes: (photoBytes.get(k) ?? 0) + lineBytes,
						// ⚠️ CARRY THE EXISTING STAMP — NEVER WRITE `BLOB_VERSION` HERE.
						//
						// This mirror only knows PRESENCE ("are there tiles on disk?"),
						// which is a BOOLEAN and therefore cannot say WHICH RINGS are
						// present. Stamping the current version from a presence check
						// claims "this area matches the current ring set" on evidence
						// that cannot support it — and the stamp is the ONLY staleness
						// signal, so writing it wrongly means no cloud-side ring change
						// can ever reach this device again.
						//
						// That is not hypothetical: it shipped, and every one of the
						// device's 232 areas ended up stamped `pf22|…40@9` while holding
						// zero z9 tiles. The whole z9 ring was invisible for an evening.
						//
						// Only a REAL DOWNLOAD may write the version (see ensureAreaData).
						// `undefined` here leaves a never-downloaded area unstamped, which
						// is exactly right: unknown must fall through to the probe.
						blobVersion: rec?.blobVersion,
					},
					false,
					touchByKey.get(k),
				);
			}
		}

		// 6) FIRES — LAST, and outside the completion gate above on purpose.
		//
		// The download loop `continue`s past any area whose photo and tiles are
		// already on disk, so anything perishable placed inside it silently stops
		// refreshing the moment an area is complete (see refreshFires' header).
		// Running here means every KEPT area gets its hotspots re-checked on every
		// pass, whether or not its map data needed work.
		//
		// The live position is included even when it earned no map blob: a user
		// inside their existing 40 km coverage still wants to know what is burning
		// in the 500 km around them.
		try {
			const fireCentres = [...areas.entries()]
				.filter(([k]) => kept.has(k))
				.map(([, v]) => v.c);
			// SNAPPED, never raw. refreshFires keys the cache by satImageKey — the
			// same ~11 m round that makes a moving anchor dangerous everywhere else.
			// A raw fix here would mint a new fire record every few paces even though
			// the containment check spared the map blob.
			const liveCentre = liveFix ? snapLiveAnchor(liveFix) : null;
			if (
				liveCentre &&
				!fireCentres.some(
					(c) => c[0] === liveCentre[0] && c[1] === liveCentre[1],
				)
			) {
				fireCentres.unshift(liveCentre); // where the user IS comes first
			}
			// ═══════════════════════════════════════════════════════════════
			// 🔬 TEMPORARY BISECT — 2026-08-10. NOT A FIX. DELETE THIS.
			// Pairs with FIRE_LAYER_ENABLED_ONLINE in
			// src/routes/(getcache)/map/MobMapPage.svelte. (Until 2026-08-23 this
			// named FIRE_LAYER_ENABLED in routes/mobile/offlinev4/+page.svelte —
			// both that flag and that path are gone.)
			// The fire system has TWO halves — the RENDER (that page) and this
			// FETCH/STORE pass, which runs app-wide every 20 s regardless of
			// which route is open. Disabling only the render would leave this
			// half running and the bisect would prove nothing.
			// TO RESTORE: set FIRE_REFRESH_ENABLED back to true.
			// ═══════════════════════════════════════════════════════════════
			const FIRE_REFRESH_ENABLED = false; // 🔬 bisect — true restores fires
			if (FIRE_REFRESH_ENABLED) await refreshFires(fireCentres);
		} catch (err) {
			// The overlay must fail alone — never let it mark the whole pass failed.
			console.warn("[v4 fire] refresh pass failed", err);
		}
	} catch (err) {
		if (isTimeoutErr(err)) passSawTimeout = true;
		console.warn("[offline-bake] bakeAll failed", err);
	} finally {
		bakeDone();
		setNote("");
		// IDLE now — report how many areas are still in photo-bake backoff (the source
		// is throttling them). A non-zero value at idle = "sitting there with broken
		// features, waiting to retry"; zero = all caught up.
		setActivity(false, 0, satCooldown.size);
		if (passChanged) bumpGeneration();
		// TIMEOUT BACKOFF: a timed-out fetch means the pipe is lie-fi — kicking
		// again in 20 s just re-saturates it. Skip kicks for an escalating window;
		// any timeout-free pass (even a no-op one) resets to normal cadence.
		if (passSawTimeout) {
			timeoutBackoffUntil = Date.now() + nextTimeoutBackoffMs;
			console.warn(
				`[offline-bake] pass hit a network timeout — backing off ${Math.round(nextTimeoutBackoffMs / 1000)}s`,
			);
			nextTimeoutBackoffMs = Math.min(
				nextTimeoutBackoffMs * 2,
				TIMEOUT_BACKOFF_CAP_MS,
			);
		} else {
			timeoutBackoffUntil = 0;
			nextTimeoutBackoffMs = TIMEOUT_BACKOFF_START_MS;
		}
		reconciling = false;
		// THE DRAIN TEST. Anything queued behind this slice means the run is still
		// going, so the tally keeps filling and nothing is printed yet.
		const moreComing = rerun || budgetPaused;
		resumingRun = moreComing;
		reportRun(moreComing);
		if (rerun) {
			rerun = false;
			kickBake(); // via kickBake so the coalesced re-run also honours backoff
		} else if (budgetPaused) {
			// Work remains, but we deliberately stopped. Resume SOON — yet not
			// immediately: an instant re-kick would rebuild the back-to-back chain
			// this budget exists to break. The gap is what lets the main thread
			// serve taps and lets GC reclaim the decode payloads.
			setTimeout(kickBake, BUDGET_RESUME_MS);
		}
	}
}

/**
 * ONE-TIME migration: areas baked before the registry tracked per-area photo/line
 * bytes have no split fields, so the size panel reads them as 0 B. Backfill ONCE,
 * reading line payloads ONE AREA AT A TIME (peak heap = a single area).
 */
async function backfillCoverageSizes(): Promise<void> {
	if (backfilled) return;
	backfilled = true;
	try {
		const recs = await allCoverage();
		const need = recs.filter(
			(r) => (r.hasPhoto && !r.photoBytes) || (r.hasLines && !r.lineBytes),
		);
		if (!need.length) return;
		const photoBytesByKey = new Map<string, number>();
		if (need.some((r) => r.hasPhoto)) {
			for (const { key, bytes } of await satImageMeta()) {
				photoBytesByKey.set(key, bytes);
			}
		}
		for (const r of need) {
			const patch: {
				photoBytes?: number;
				lineBytes?: number;
				lineCount?: number;
			} = {};
			if (r.hasPhoto)
				patch.photoBytes = photoBytesByKey.get(r.areaKey) ?? r.photoBytes ?? 0;
			if (r.hasLines) {
				const feats = await getVectorFeaturesAt(r.areaKey); // one area only
				patch.lineBytes = JSON.stringify(feats).length;
				patch.lineCount = feats.length;
			}
			await noteCoverage(r.areaKey, r.lng, r.lat, patch, false);
		}
	} catch (err) {
		console.warn("[offline-bake] coverage size backfill failed", err);
	}
}

// ── public control surface ──────────────────────────────────────────────────
/** Run THE formula now: every feature on every map gets its blob (newest-first,
 *  to budget, measured in REAL stored bytes), oldest-over-budget evicted, disk =
 *  truth. A present blob is zero work, so this is cheap to call on every change. */
export function kickBake(): void {
	const now = Date.now();
	if (now < bootBakeAt) return; // boot delay — the start-scheduled timer runs the first pass
	if (now < timeoutBackoffUntil) return; // lie-fi backoff — see bakeAll's finally
	void bakeAll();
}

/**
 * FIX NOW — the user's "re-initialise and heal everything" button. The 20 s pass
 * already heals failed photos on its own, but each failure carries an exponential
 * cooldown (up to 15 min) so a throttled source can recover; a feature can sit 🟠
 * "no photo" for a while before its cooldown lapses. This wipes ALL those cooldowns
 * so EVERY failed area is eligible to re-bake on the very next pass, then kicks one
 * immediately. It does NOT bypass the coverage guard or the budget — it just stops
 * the waiting. Returns how many areas were released from backoff.
 */
export function retryFailedBakes(): number {
	const n = satCooldown.size;
	satCooldown.clear();
	setActivity(status.downloading, status.pending, 0);
	void bakeAll();
	return n;
}

/** For the test seam. */
export async function reconcileOnceForTest(
	hostPorts?: HostPorts,
): Promise<void> {
	// Tests inject through the SAME door production uses. Passing ports here
	// rather than reaching past them is the point: were the seam fake, these
	// passes would bake nothing and every tripwire would go red.
	if (hostPorts) ports = hostPorts;
	await bakeAll();
}

let started = false;
let teardown: Array<() => void> = [];

/**
 * Start the app-wide bake service. Call ONCE from the mobile layout's onMount so
 * it runs in every runtime context (dt-web / mob-web / native) regardless of
 * route. Idempotent — a second call (HMR / remount) is a no-op. Returns a stop fn.
 *
 * THE TRIGGER IS A PUSH, NOT A REACTIVE READ. `ports.onPlacesChanged` must fire
 * on EVERY place change (a pin dropped/moved/deleted, an import, a cloud
 * restore) and once on register. It is deliberately an imperative channel and
 * not an `$effect` reading the host's state: that cross-module reactive read is
 * unreliable (it silently failed to fire on a fresh pin drop — the exact bug).
 * The blob bakes the instant the feature lands, under every circumstance.
 * ([[cross-module-state-use-applier-pattern]])
 *
 * @param hostPorts the app around the engine — see mapShared/hostPorts.ts.
 *   ReTreever passes `retreeverPorts()`; the harness demo passes literals.
 */
export function startOfflineBakeService(hostPorts: HostPorts): () => void {
	if (started)
		return () => {
			/* already running — the first start's stop owns shutdown */
		};
	started = true;
	ports = hostPorts;

	// ONE-TIME: sweep the 0-byte tiles the pre-guard pack Worker wrote (~19% of the
	// pile on devices baked before the fix). Runs BEFORE the first bake pass so the
	// probes below see the honest picture: an area whose disc was all-empty stops
	// reading as "covered" and gets re-downloaded from the fixed Worker. Self-flagging,
	// so this is a no-op on every subsequent boot.
	void purgeEmptyTilesOnce();

	// ONE-TIME: reclaim the ~70 MB of PNGs left behind by the deleted road
	// raster. Deleting the code does not delete the bytes — see
	// purgeRoadRasters.ts for what it was and why it is gone.
	purgeDeadRoadRasters();

	void backfillCoverageSizes();
	// Seed the TinyBase cloud-mirror with every PRE-EXISTING baked area (new writes
	// mirror themselves; this catches areas baked before the mirror existed).
	void backfillCoverageMirror();

	// BOOT DELAY — kickBake absorbs every kick for the first 20 s (including the
	// onActiveMapChange register-fire below), so boot + the map's own style/tile
	// fetches get the pipe first on lie-fi. This timer runs the first pass.
	bootBakeAt = Date.now() + BOOT_BAKE_DELAY_MS;
	// ARRIVAL #1 — app open. Opening the app IS the ask; the first pass fetches
	// fires even if the cached record is 5 minutes old.
	ports.fires?.arrival();
	const bootTimer = setTimeout(kickBake, BOOT_BAKE_DELAY_MS);
	teardown.push(() => clearTimeout(bootTimer));

	// EVERY map/feature change → SHALLOW pass (download only what the registry says
	// is missing; fires once on register too → boot features bake right away). A
	// just-dropped pin is newest → downloads first, and already-baked areas are
	// skipped cheaply instead of furiously re-probed.
	teardown.push(ports.onPlacesChanged(kickBake));

	// Every 20 s → re-run the formula: re-checks every blob against the actual disk
	// (disk = truth) so a wiped/failed one self-heals. This is the "constantly
	// making sure it's all there" guarantee; it touches the network only for
	// genuinely-missing blobs (a present blob is an O(1) Set lookup).
	const timer = setInterval(kickBake, 20000);
	teardown.push(() => clearInterval(timer));

	// ARRIVAL #2 — the tab/app regains focus (phone woke from sleep, or they
	// switched back from the camera). Coming back to the app is the same ask as
	// opening it, so the TTL is bypassed here too.
	if (typeof document !== "undefined") {
		const onVisible = () => {
			if (document.visibilityState === "visible") {
				hostPorts.fires?.arrival();
				kickBake();
			}
		};
		document.addEventListener("visibilitychange", onVisible);
		teardown.push(() =>
			document.removeEventListener("visibilitychange", onVisible),
		);
	}

	// ARRIVAL #3 — connectivity returns. THE field moment: they have driven out
	// of the block and back into signal, and whatever is cached was fetched
	// before they lost it. `refreshFires` bails immediately while offline, so
	// without this the first chance to catch up is the next 20 s tick — which
	// then finds a "fresh" record and skips. This is the arrival that the TTL
	// alone gets most wrong.
	if (typeof window !== "undefined") {
		const onOnline = () => {
			hostPorts.fires?.arrival();
			kickBake();
		};
		window.addEventListener("online", onOnline);
		teardown.push(() => window.removeEventListener("online", onOnline));
	}

	return stopOfflineBakeService;
}

/** Tear down the service (test cleanup / full app teardown). */
export function stopOfflineBakeService(): void {
	for (const fn of teardown) fn();
	teardown = [];
	started = false;
	ports = null;
}
