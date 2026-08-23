/**
 * rawWallProtocol.ts — serve DOWNLOADED tiles to MapLibre with NO decode.
 *
 * ── THE IDEA (flagged; see RAW_WALL_ENABLED) ─────────────────────────────
 *
 * Today the offline map takes the tiles it downloaded, unpacks them into
 * GeoJSON objects, glues them together and re-cuts a fresh MVT pyramid —
 * tiles → JSON → tiles. MEASURED (DevTools → Allocation sampling, on the
 * decode worker, while zooming):
 *
 *     ctx.onmessage          103 kB   100%
 *       ├─ decodeEntries      54 kB    52.2%   (MVT → GeoJSON)
 *       └─ finishWall         49 kB    47.8%   (GeoJSON → MVT)
 *
 * i.e. ALL of it is the round trip. That worker peaked at 705 MB, and the
 * scheduling fixes only changed how OFTEN it ran, never that it ran.
 *
 * ── WHY THE ROUND TRIP EXISTED ───────────────────────────────────────────
 *
 * Not to fill zoom gaps — MapLibre overzooms for free, and the product rule
 * is explicitly "it's okay if it's jumping between layers". The real reason
 * is that a pack holds TWO zoom levels (a z15 core + a z12 ring), and a
 * single vector source has ONE `maxzoom`, so it cannot overzoom a z15 middle
 * and a z12 surround independently. The cut existed to reconcile them.
 *
 * ── THE CHEAPER ANSWER: TWO SOURCES ──────────────────────────────────────
 *
 * Give each ring its own source with its own `maxzoom` and let MapLibre
 * overzoom each. Nothing is stitched, nothing is re-cut, and the downloaded
 * bytes are handed over exactly as they arrived. Costs ZERO extra download —
 * the alternative (pre-cutting server-side) measured +19% to +221% pack.
 *
 * VERIFIED against real packs from the live Worker — the downloaded tiles
 * already carry the source-layer names the style asks for:
 *
 *     z12 ring : roads
 *     z15 core : roads, water, pois
 *
 * So `roads` / `water` / `pois` — the heavy geometry, and the bulk of the
 * map — need no processing at all.
 *
 * ── WHAT THIS DOES **NOT** COVER ─────────────────────────────────────────
 *
 * Three style layers read source-layers that are DERIVED on-device and are
 * not present in the downloaded bytes: `land`, `roadlabels`, `places`.
 * They stay on the old path for now (they are small — polygons and sampled
 * label points, not the road network). This module deliberately does not
 * pretend to serve them: an address it has nothing for 404s, which MapLibre
 * treats as "nothing here" at no cost.
 *
 * ── THE z13-z14 HOLE, AND WHY IT IS GONE ─────────────────────────────────
 *
 * The first version of this flag rendered a BLANK MAP across z13-z14.
 * MEASURED in a real session (402 downloaded areas), rendered features per
 * layer at each zoom:
 *
 *     z12   ring roads 5     core roads 5    water 0
 *     z13   ring roads 0     core roads 0    water 0     ← HOLE
 *     z14   ring roads 0     core roads 0    water 0     ← HOLE
 *     z15   ring roads 0     core roads 0    water 7
 *     z16   ring roads 0     core roads 0    water 5
 *
 * Three hypotheses were tried and DISPROVED, so don't re-try them: (1) the
 * style layer's own maxzoom — setLayerZoomRange(0, 24) changed nothing;
 * (2) source `minzoom` — pinning it to the data's zoom made things strictly
 * worse; (3) source `maxzoom` — covering_tiles confirms
 * `z = Math.min(desiredZ, maxZoom)`, so it was already correct.
 *
 * NONE of them was the cause. The cause was that THE TILES DID NOT EXIST.
 * MapLibre overzooms UP from the deepest level it holds and never DOWN, so a
 * pack containing only z12 and z15 has nothing to stretch across z13-z14 — the
 * exact band the default camera sits in. No amount of source configuration
 * conjures a level that was never downloaded.
 *
 * THE FIX WAS IN THE CLOUD, NOT HERE. The Worker now ships a third ring at z13
 * (see workers/offline-tiles/src/packBuilder.ts, MID_RING_Z), trimmed to the
 * major road network so it costs +15%…+28% pack rather than the +152%…+399% a
 * naive full-detail z13 ring measured. z14 overzooms off it for free. With a
 * real tile in the band, this module serves all three rings straight from disk.
 */

import maplibregl from "maplibre-gl";

import { vlog } from "$osem/components/map/mapShared/verboseLog";

import { BLOB_MAX_Z, BLOB_MIN_Z } from "$osem/components/map/getCache_OfflineMap/lib/contract/roadBlob";

import { idbGetTileForAddress } from "$osem/components/map/getCache_OfflineMap/lib/r2Worker/roads/packDownload";

/**
 * THE source id. ONE disc, ONE source, every zoom.
 *
 * ⛔ There used to be FOUR (`core` z15, `mid` z13, `ring` z12, `wide` z1-11),
 * each with its own hand-written zoom band. That split made sense only while
 * the pack held two levels; it now holds EVERY level in `BLOB_ZOOMS`, so the
 * bands were four ways to describe one circle — and they described it wrong.
 * MEASURED 2026-08-18: 4,339 tiles on disk spanning z1-z13+z15, and ZERO
 * `v4-*` layers painting, because z12/z13 tiles fell between the declared
 * bands. Silent, as always: no console error, just a black map.
 *
 * One source cannot have a gap between itself.
 */
export const RAW_SOURCE = "v4-raw";
export const RAW_SCHEME = "rtraw";

export const RAW_TILE_URL = `${RAW_SCHEME}://disc/{z}/{x}/{y}`;

/**
 * The disc's zoom span, DERIVED from `BLOB_ZOOMS` — never hand-written.
 *
 * `roadBlob.ts` is the only file allowed to name a road zoom or radius. These
 * two lines read that rule; they do not restate it. Change `BLOB_ZOOMS` and
 * this span follows automatically.
 */
export const RAW_MIN_Z = BLOB_MIN_Z;
export const RAW_MAX_Z = BLOB_MAX_Z;

let installed = false;

/**
 * Register the raw-tile protocol. Idempotent.
 *
 * The handler reads ONE tile from IndexedDB per request and returns its bytes
 * untouched. No parse, no merge, no cut — which is the entire point.
 */
export function installRawWallProtocol(): void {
	if (installed) return;
	installed = true;

	maplibregl.addProtocol(RAW_SCHEME, async (params, abortController) => {
		// The renderer aborts tiles constantly while panning. Reject with an
		// AbortError rather than resolving — MapLibre filters those out of the
		// error path, whereas resolving an aborted request leaves its promise
		// pending forever. (Same rule as wallProtocol.)
		if (abortController.signal.aborted) {
			throw Object.assign(new Error("aborted"), { name: "AbortError" });
		}

		// `rtraw://disc/15/5245/11454` → ["15","5245","11454"]
		const m = /^rtraw:\/\/[a-z]+\/(\d+)\/(\d+)\/(\d+)/.exec(params.url);
		if (!m) throw notFound(params.url);

		const [, z, x, y] = m;
		// ⛔ RESOLVE THE ADDRESS TO A PIN. THIS IS THE 50 km BUG (2026-08-20).
		//
		// MapLibre only ever asks for `z/x/y` — it has no idea which pin a tile
		// belongs to. Roads used to be STORED under that same bare address, so a
		// square containing two pins held one pin's roads and served them to the
		// other. MEASURED at the user's Yellowstone pin: the roads box came back
		// 36.6 km south of him, byte-identical to his previous (Moran) pin's box.
		//
		// Roads are now stored under `pin/<lng>,<lat>/<z>/<x>/<y>` (grid.ts
		// `pinTileKey`), exactly like the satellite is keyed by its pin. So this
		// address may be owned by several pins, and the right answer is the one
		// whose pin is NEAREST the tile — that is the pin the user is looking at.
		//
		// ⚠️ FAIL LOUD ON A MISS, never silently: a 404 is how a vector source
		// says "nothing here", and that is a normal, cheap answer for the jagged
		// frontier. What must never happen is returning ANOTHER pin's bytes.
		const buf = await idbGetTileForAddress(Number(z), Number(x), Number(y));
		noteTileRead(!!buf && buf.byteLength > 0);
		// A MISS IS THE COMMON PATH, NOT AN ERROR. The rings are jagged discs, so
		// most addresses in the covering rectangle were never downloaded. 404 is
		// how a vector source says "nothing here" for free.
		if (!buf || buf.byteLength === 0) throw notFound(params.url);

		// Fresh copy per request: the returned buffer is TRANSFERRED to
		// MapLibre's worker and detached, so handing out the cached one would
		// neuter the stored copy on first use.
		return { data: buf.slice(0) };
	});
}

/**
 * Tally tile reads and speak ONLY when the ANSWER CHANGES.
 *
 * ── WHY THIS IS NOT ONE LINE PER BURST ────────────────────────────────────
 *
 * It used to be, and that was still a wall: the renderer asks for tiles on
 * every pan, every zoom, every idle re-request, so a per-burst line printed
 * several times a second and scrolled the real signal off the top. "4 found,
 * 2 not on disk" repeated forty times says exactly what it said the first
 * time — a sparse pyramid ALWAYS misses at its edges, so misses are the
 * normal state, not news.
 *
 * There is exactly ONE question worth an unprompted line: is the map finding
 * anything at all? So we print on the TRANSITION only — the burst where the
 * answer flips from "reading tiles" to "reading NOTHING", or back.
 *
 * ⛔ A TRANSITION IS NOT A FLIP — IT IS A FLIP THAT STICKS. Printing on the
 * bare flip was still noise: MEASURED 2026-08-19, ⚠️/✅ alternated five times
 * in one session, because panning to the edge of a jagged disc legitimately
 * reads nothing for a burst or two and then reads tiles again the moment the
 * camera moves back. That is the pack working as designed, not a fault.
 *
 * So a flip must HOLD for `SETTLE_MS` before it is worth a line. "Blank for a
 * moment while I pan" never prints; "blank and STAYING blank" — the thing that
 * actually means a black map — prints once, and only once.
 *
 * Per-burst counts still exist for when you actually want them:
 *     localStorage.rtVerbose = 'wall'   → every burst, console.log
 */
let hits = 0;
let misses = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
/**
 * The last verdict ANNOUNCED — seeded to `false` (= reading fine), NOT null.
 *
 * ⛔ WORKING IS NOT NEWS. Seeded to null, the very first burst reads
 * `blind === false`, which differs from null, so a freshly-loaded page
 * announced "✅ reading tiles from disk again" before anything had ever gone
 * wrong — a recovery notice for a failure that never happened. It said it on
 * every reload, which is why the same ✅ appears three times in one console
 * with no ⚠️ between them.
 *
 * The healthy state is the assumption. ⚠️ is the only thing worth saying
 * unprompted, and ✅ earns its line only as the answer to a ⚠️ already on
 * screen.
 */
let lastBlind: boolean | null = false;
/** Called when the map is confirmed blind (asking, finding nothing). Set by the
 *  route so the detection and the recovery are not in two different files that
 *  can drift apart. See the `onBlind?.()` call below. */
let onBlind: (() => void) | undefined;

/** Register the recovery to run when a blind reading is confirmed. */
export function setRawWallBlindHandler(fn: () => void): void {
	onBlind = fn;
}
/** A flip seen but not yet announced, and the timer that will announce it if it
 *  survives. Cleared the moment the reading flips back — which is what makes a
 *  pan across the pack edge silent. */
let pendingBlind: boolean | null = null;
let settleTimer: ReturnType<typeof setTimeout> | null = null;
/** How long a changed reading must HOLD before it counts. Long enough to
 *  outlast a pan or a zoom (each ~1 burst), short enough that a genuinely dead
 *  map says so while the user is still looking at it. */
const SETTLE_MS = 2500;
function noteTileRead(found: boolean): void {
	if (found) hits++;
	else misses++;
	if (flushTimer) return;
	flushTimer = setTimeout(() => {
		flushTimer = null;
		const read = hits + misses;
		const blind = hits === 0;
		// Opt-in firehose: every burst, for when you are actually chasing this.
		vlog("wall", `read ${read} tiles — ${hits} found, ${misses} not on disk`);
		// Unprompted, only on a flip. console.warn (not .log) because DevTools'
		// default "Custom levels" filter HIDES info-level output, which made this
		// invisible exactly when it mattered. Do not "tidy" this to console.log.
		if (blind === lastBlind) {
			// Back to the announced state — whatever flip was pending was a blip.
			if (settleTimer) clearTimeout(settleTimer);
			settleTimer = null;
			pendingBlind = null;
		} else if (blind !== pendingBlind) {
			// A NEW flip: start (or restart) the settle clock. It only speaks if
			// the reading is still this way when the clock runs out.
			if (settleTimer) clearTimeout(settleTimer);
			pendingBlind = blind;
			settleTimer = setTimeout(() => {
				settleTimer = null;
				lastBlind = blind;
				pendingBlind = null;
				if (blind) {
					console.warn(
						`[roads] ⚠️ map is reading NOTHING from disk (${read} tiles asked, 0 found) — nothing will draw`,
					);
					// ⛔ SELF-HEAL, DON'T JUST NARRATE. A blind reading with tiles on
					// disk means MapLibre is sitting on CACHED 404s from before the
					// download landed — it has stopped asking, so it can never
					// recover on its own however long you wait.
					//
					// MEASURED at the user's Brusett pin: "3 tiles asked, 0 found"
					// with 886 KB of correct roads on disk. The previous two pins had
					// worked perfectly — same code, different timing, which is the
					// entire "it works sometimes" pattern on this route.
					//
					// This log already knows the exact condition. Announcing it while
					// doing nothing is what made it a spectator: the one place that
					// can detect the state is the one place that should clear it.
					onBlind?.();
				}
				else console.warn(`[roads] ✅ reading tiles from disk again`);
			}, SETTLE_MS);
		}
		hits = 0;
		misses = 0;
	}, 700);
}

function notFound(url: string): Error {
	// MapLibre treats a 404-shaped rejection as "no tile here" and renders
	// nothing, silently — the correct outcome for a sparse pyramid.
	return Object.assign(new Error(`no tile: ${url}`), { status: 404 });
}

/**
 * THE source spec. One disc, one span, every zoom.
 *
 * ── THE ONE FACT THAT DECIDES THIS ────────────────────────────────────────
 * A vector tile is only ever stretched BIGGER, never smaller. So a level that
 * was never saved renders NOTHING — silently, with no console error.
 *
 * That cuts both ways, and both ways have been shipped and rejected:
 *
 *  • A span WIDER than the pack promises levels that do not exist. Every one
 *    404s and the map is blank. (Measured twice, back when the pack held only
 *    z12 + z15.)
 *  • A span NARROWER than the pack hides levels that DO exist. The tiles sit
 *    on disk, correctly downloaded, and no layer can reach them. (Measured
 *    2026-08-18: 4,339 tiles, 0 layers painting.)
 *
 * The fix for both is the same and it is not a cleverer pyramid: declare
 * EXACTLY what `BLOB_ZOOMS` holds. `minzoom` is a floor on the TILE's own zoom
 * (not the camera), `maxzoom` is the deepest level that EXISTS — above it
 * MapLibre re-requests that level and overzooms for free, which is the
 * "jumping between layers" the product explicitly accepts.
 *
 * ⛔ Do not hand-write either bound. They are `BLOB_MIN_Z`/`BLOB_MAX_Z`, so a
 * change to `BLOB_ZOOMS` moves them automatically and they cannot drift.
 */
export function rawSourceSpec(): maplibregl.VectorSourceSpecification {
	return {
		type: "vector",
		tiles: [RAW_TILE_URL],
		// ⛔ minzoom is the SHALLOWEST STORED LEVEL, not 0 and not the detail level.
		//
		// `minzoom`/`maxzoom` on a SOURCE describe the tile pyramid, not the
		// camera. `maxzoom` = the deepest level that EXISTS (above it MapLibre
		// overzooms that level for free — which is how ONE stored level covers
		// every zoom). `minzoom` = the shallowest ADDRESS it may request.
		//
		// ⚠️ `minzoom: 0` DOES NOT mean "scale the deepest level to fill any zoom"
		// — that was tried and MEASURED as broken. It means "z0 addresses may be
		// requested", and MapLibre then asks for a z0..z9 tile that the pack does
		// not contain: 404, blank map, no error. Overzoom only ever goes UP.
		//
		// So this must be exactly the shallowest level the pack HOLDS. The pack
		// now stores z10..z15 (shallower levels GENERATED from z15, not read from
		// the archive), so below z10 there is deliberately nothing — that is the
		// IMAGE tier's range, not vector's.
		minzoom: RAW_MIN_Z,
		maxzoom: RAW_MAX_Z,
	};
}

/**
 * TELL THE MAP THE DISK CHANGED.
 *
 * ── THE BUG THIS EXISTS TO KILL ───────────────────────────────────────────
 *
 * The source mounts at page load. The bake service downloads the disc ~20 s
 * later. In between, MapLibre asks for the handful of tiles under the camera,
 * the protocol handler correctly answers 404 (nothing is on disk yet) — and
 * MapLibre CACHES that 404. A tile that missed once is never requested again.
 *
 * MEASURED 2026-08-18: the handler was called exactly FOUR times in a 38 s
 * session (the four z9 tiles under the camera), every one a miss, while 4,306
 * correct tiles sat in IndexedDB. Zero features, zero errors, black map. The
 * radius, the zooms and the clip were all already right; the renderer had
 * simply stopped asking.
 *
 * ⛔ This is why "one-shot setup" is wrong for this source. Writes are
 * ASYNCHRONOUS and arrive after mount, so there must be a handshake. Do not
 * "fix" a blank map by re-adding the source or re-adding the layers — that
 * rebuilds the whole stack (and drops the per-pin satellite layers mounted
 * against SAT_INSERT_BEFORE). `setTiles` with the same URL is the narrow tool:
 * it invalidates the tile cache and nothing else.
 */
export function refreshRawTiles(map: maplibregl.Map): void {
	const src = map.getSource(RAW_SOURCE);
	// Not mounted yet (or torn down mid-flight) — the next mount reads fresh.
	// SILENT on purpose: this is a routine race at page bring-up, not a fault,
	// and it fired on every one of the first few passes.
	if (!src || typeof (src as maplibregl.VectorTileSource).setTiles !== "function") {
		vlog("wall", "refresh skipped — source not mounted yet");
		return;
	}
	// ⛔ This used to print "[roads] new tiles on disk → telling the map to
	// re-request" on EVERY call, unprompted. It named an INTENTION, never an
	// outcome — and the outcome arrives ~200 ms later on the next `idle` as the
	// [offline] verdict, which is the line worth reading. Two lines for one
	// event, one of which cannot be wrong, is the definition of noise.
	vlog("wall", "new tiles on disk → telling the map to re-request");
	(src as maplibregl.VectorTileSource).setTiles([RAW_TILE_URL]);
}
