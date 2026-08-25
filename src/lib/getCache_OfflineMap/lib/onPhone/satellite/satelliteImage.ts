/**
 * satelliteImage.ts — the satellite as ONE MASKED PHOTO (Google Earth, not
 * Google Maps). See OFFLINE_PLAN.md "The satellite = ONE masked photo".
 *
 * We fetch the FINE tiles (z14) for a circular area ONCE, composite them onto a
 * single transparent canvas, and store that ONE image + its bounds. The gaps
 * where tiles don't exist stay transparent — that jagged alpha IS the mask
 * (Rule 2, no smooth/square clip). On the map it mounts as a single Mapbox
 * `image` source: present at EVERY zoom, only changing size. Zoom out → a small
 * jagged circle; zoom in → the same photo bigger (soft past the bake resolution,
 * which is fine — we never swap in different tiles).
 *
 * Isolated from V2: own IndexedDB (`retreever-v3-satimg`). Network is used ONCE
 * at bake time; viewing never streams.
 */

import {
	guardBakeGrid,
	noteSatelliteTiles,
} from "../store/downloadGuard";
import { kmBetween, kmToDegSpan } from "$harness/mapShared/kmGeo";
import { migrateIdbDatabase } from "../store/idbRename";
import { makeKeyedIdbStore } from "../store/keyedIdbStore";

/** EOX Sentinel-2 (s2cloudless), `{z}/{y}/{x}` order. */
function satelliteTileUrl(z: number, x: number, y: number): string {
	return `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/${z}/${y}/${x}.jpg`;
}

/** Bake detail level + radius. z14 IS EOX Sentinel-2's sharp ceiling (~10 m/px) —
 *  going to z15 only upsamples the same pixels into blur (verified side-by-side),
 *  so z14 stays. 2 km radius = a ~4 km jagged disc, the photo core of the rings
 *  (2 km satellite · 5 km z15 detail · 25 km z12 roads); tighter than the old 3 km
 *  → smaller files AND more screen-detail per pixel near the pin, cheap (~6 tiles). */
const BAKE_ZOOM = 14;

/** Imagery tiles fetched at once. See the pool call for why 16, not 6 or 60. */
const SAT_FETCH_CONCURRENCY = 16;
/** Satellite-photo radius (km). Exported so the offline page can space LINE
 *  satellite samples by the photo's real size — consecutive discs overlap into a
 *  continuous ribbon along the line instead of leaving gaps. */
export const BAKE_RADIUS_KM = 2;
/** Canvas width in px. The image only ever scales, so this is the fixed photo
 *  resolution; 1536 keeps it crisp at normal zooms without a huge blob. */
const CANVAS_W = 1536;

// RENAMED 2026-08-17: "rt-satellite" → "gc-offlineSatellite". `gc-` = Get Cache
// (the app that owns this data) rather than `rt-` = ReTreever (the company), and
// `offline` groups it with the rest of the offline map's storage in DevTools.
// Third name for this store: retreever-v3-satimg → rt-satellite → here. Both
// older names migrate forward below, so a device that skipped a release still
// keeps its photos.
const DB_NAME = "gc-offlineSatellite";
const STORE = "images";
if (typeof indexedDB !== "undefined") {
	// Chain, don't fire both: two concurrent writers into one destination race,
	// and the newer name must win when a device somehow holds both.
	void migrateIdbDatabase("retreever-v3-satimg", "rt-satellite", STORE).then(
		() => migrateIdbDatabase("rt-satellite", DB_NAME, STORE),
	);
}

export type Bounds = [number, number, number, number]; // [w,s,e,n]

/** Geometry stamp. BUMP whenever the bake geometry changes (radius, zoom, canvas
 *  size, or the bounds/mercator math) so photos baked by OLDER code self-heal: a
 *  stored record whose `bakeVersion` ≠ this is treated as a MISS and re-baked,
 *  overwriting the stale `{blob,bounds}`. Without this an early mis-bounded photo
 *  (bounds not matching its pixels → renders clipped to a fraction) is pinned
 *  forever by the idempotency short-circuit and never heals. */
export const BAKE_VERSION = 6; // 6 = PIN-CENTRED CROP. Every v5 photo is bounded by the z14 TILE GRID, so the pin sits off centre by up to 873 m (44% of the 2 km radius) — measured 166 m at the user's own anchor. The canvas is now cut to the pin's box and the stored bounds match it. This bump is deliberate and IS a fleet-wide re-bake: an off-centre photo is wrong on screen, not merely suboptimal, so unlike the q0.75 change (left un-bumped on purpose, see below) it has to reach existing pins. Expect a burst of re-bakes and the EOX source to back off briefly.

export interface SatImage {
	blob: Blob;
	bounds: Bounds;
	/** See BAKE_VERSION. Absent on legacy records → treated as stale → re-bake. */
	bakeVersion?: number;
}

const idb = makeKeyedIdbStore<SatImage>({ dbName: DB_NAME, storeName: STORE });

/** Delete one area's baked photo (budget eviction). */
export async function deleteSatImage(key: string): Promise<void> {
	await idb.delete(key);
}

/**
 * PURE READ — return one area's already-baked photo, or undefined. NEVER bakes,
 * NEVER touches the network. This is the offline VIEWER's mount path: the page
 * only ever displays blobs the app-wide bake service has already written to disk
 * (the whole point — the page must not trigger a download just by being opened).
 * A legacy/stale-geometry photo (bakeVersion ≠ current) is treated as absent so
 * the viewer doesn't mount a mis-bounded image; the service re-bakes it.
 */
export async function getSatImageByKey(
	key: string,
): Promise<SatImage | undefined> {
	const img = await idb.get(key);
	return img && img.bakeVersion === BAKE_VERSION ? img : undefined;
}

// NOTE: the size readout reads aggregate photo bytes/counts from the tiny
// coverage registry (`coverageSizes` in coverageRegistry.ts), NOT from the blobs. Do
// NOT poll a `satImageStats()` that loads every baked photo into JS on a timer.

/**
 * Every stored area's image — FULL BLOBS. On-demand Download button ONLY.
 *
 * ⚠️ This materialises every baked photo in the heap at once. On a real device
 * that is hundreds of megabytes, and it is NOT survivable on a timer: the bake
 * service used to call this every ~20 s just to read `blob.size`, which showed
 * up in a DevTools allocation profile as **613 MB, 97.3% of all allocation**,
 * and OOM-crashed the tab ("Aw, Snap!"). If you want sizes or bake versions,
 * use `satImageMeta()` below — it never touches blob bytes.
 *
 * codestyle-allow-blob-getall: admin /blobs export, one click — never a timer.
 * Enforced by scripts/check-blob-getall.mjs; if a NEW caller appears on any
 * automatic path, it must use satImageMeta() instead, not widen this allow.
 */
export async function getAllSatImages(): Promise<{ key: string; img: SatImage }[]> {
	const [keys, vals] = await Promise.all([idb.keys(), idb.getAll()]);
	return keys.map((k, i) => ({ key: k, img: vals[i] }));
}

/**
 * Per-area photo METADATA — size + bake version, never the pixels.
 *
 * The bake service asks two questions of the photo store on every pass: "how
 * many bytes is this area's photo?" (budget) and "was it baked by the current
 * BAKE_VERSION?" (re-bake decision). Both are answerable from two scalars, so
 * loading the WebP payload to read them is pure waste — see the warning on
 * `getAllSatImages` for what that waste measured.
 *
 * Cursor-streamed via `getAllProjected`, so each blob is deserialized, reduced
 * to a number, and immediately collectable: peak heap is one photo, not all of
 * them. Keys are read separately and zipped by index — `keys()` and the cursor
 * walk the same store in the same key order.
 */
export async function satImageMeta(): Promise<
	{ key: string; bytes: number; bakeVersion?: number }[]
> {
	const [keys, meta] = await Promise.all([
		idb.keys(),
		idb.getAllProjected((v) => ({
			bytes: v.blob.size,
			bakeVersion: v.bakeVersion,
		})),
	]);
	return keys.map((k, i) => ({ key: k, ...meta[i] }));
}
/** Every stored area key (keys only — no blob payloads loaded). For the
 *  reconcile's orphan sweep: a stored key with no registry record is stale. */
export async function getSatKeys(): Promise<string[]> {
	return idb.keys();
}

/** A stable key for an area centre. */
export function satImageKey(c: [number, number]): string {
	return `${c[0].toFixed(4)},${c[1].toFixed(4)}`;
}

// ── tile math ────────────────────────────────────────────────────────────────
function lngToTileX(lng: number, z: number): number {
	return Math.floor(((lng + 180) / 360) * 2 ** z);
}
function latToTileY(lat: number, z: number): number {
	const r = (lat * Math.PI) / 180;
	return Math.floor(((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * 2 ** z);
}
function tileToLng(x: number, z: number): number {
	return (x / 2 ** z) * 360 - 180;
}
function tileToLat(y: number, z: number): number {
	const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
	return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}
function loadImage(url: string): Promise<HTMLImageElement | null> {
	return new Promise((resolve) => {
		const img = new Image();
		// Same 20 s tile budget as the fetch path (lie-fi guard) — an <img> load
		// has no AbortSignal, so give up via timer; late onload/onerror is a no-op.
		const timer = setTimeout(() => resolve(null), 20_000);
		img.crossOrigin = "anonymous";
		img.onload = () => {
			clearTimeout(timer);
			resolve(img);
		};
		img.onerror = () => {
			clearTimeout(timer);
			resolve(null);
		};
		img.src = url;
	});
}
async function pool(n: number, limit: number, fn: (i: number) => Promise<void>): Promise<void> {
	let next = 0;
	const worker = async () => {
		while (next < n) {
			const i = next++;
			await fn(i);
		}
	};
	await Promise.all(Array.from({ length: Math.min(limit, n) }, worker));
}

// ── decoded-tile cache (shared across bakes) ───────────────────────────────────
// Neighbouring pins' 6 km discs overlap, so a border tile would be re-fetched +
// re-decoded once per pin. This LRU caches the DECODED tile (ImageBitmap, off-
// thread decode) keyed by URL so overlapping discs reuse the one decode — killing
// the "same tile N times" churn. Used by the MAIN-THREAD fallback; the worker has
// its own copy. Failures aren't pinned (dropped so an online pass can retry).
type TileSrc = ImageBitmap | HTMLImageElement;
/** Decoded-tile cap for the MAIN-THREAD fallback. Must track the worker's
 *  `CACHE_MAX` (satBakeWorker.ts) — same tiles, same 262 KB-in-RAM cost, and
 *  historically the same wrong 256. See that file for the full reasoning; the
 *  short version is that a bake needs ~6 tiles and this is sized in entries
 *  while the cost is in bytes. 48 × 262 KB ≈ 12 MB. */
const TILE_CACHE_MAX = 48;
const tileCache = new Map<string, Promise<TileSrc | null>>();
function loadTileBitmap(url: string): Promise<TileSrc | null> {
	const hit = tileCache.get(url);
	if (hit) {
		tileCache.delete(url);
		tileCache.set(url, hit); // LRU bump
		return hit;
	}
	const p = (async (): Promise<TileSrc | null> => {
		try {
			if (typeof createImageBitmap === "function") {
				// LIE-FI GUARD: abort a hung tile request at 20 s. The 30 s worker-
				// composite fallback does NOT abort its fetches, so without this a
				// stalled tile pins the pipe for the whole TCP timeout (30–75 s).
				// TimeoutError lands in this catch → null → gap (transparent), the
				// same handled path as any failed tile — never an unhandled rejection.
				const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
				if (!r.ok) return null;
				return await createImageBitmap(await r.blob());
			}
			return await loadImage(url);
		} catch {
			return null;
		}
	})();
	tileCache.set(url, p);
	p.then((v) => {
		if (!v) tileCache.delete(url);
	}).catch(() => tileCache.delete(url));
	// Drain to the cap, oldest-first — `while`, not `if`. A single-eviction step
	// cannot shrink a cache that is already over (e.g. after the cap was lowered
	// from 256, or a burst that outran eviction), so an `if` would strand the
	// surplus at the old high-water mark forever. Mirrors the worker's loop.
	while (tileCache.size > TILE_CACHE_MAX) {
		const oldest = tileCache.keys().next().value as string | undefined;
		if (oldest === undefined || oldest === url) break;
		const ev = tileCache.get(oldest);
		tileCache.delete(oldest);
		ev?.then((v) => {
			if (v && "close" in v) v.close();
		// codestyle-allow-swallow: bitmap cache eviction is best-effort; close() failure leaves GPU memory until GC, not a data loss
		}).catch(() => { /* best-effort eviction */ });
	}
	return p;
}

// ── off-thread compositor (OffscreenCanvas worker) ─────────────────────────────
type TileDraw = { url: string; dx: number; dy: number; dw: number; dh: number };
type BakeRes = { id: number; blob: Blob | null; loaded: number; fetched: number };
let bakeWorker: Worker | null = null;
let workerBroken = false;
let reqId = 0;
const pendingBakes = new Map<number, (r: BakeRes) => void>();

/** True when we can composite off the UI thread: Worker + OffscreenCanvas +
 *  convertToBlob (the iOS gate — OffscreenCanvas shipped before convertToBlob) +
 *  createImageBitmap. Else the main-thread fallback runs. */
function offscreenSupported(): boolean {
	return (
		typeof Worker !== "undefined" &&
		typeof OffscreenCanvas !== "undefined" &&
		typeof createImageBitmap === "function" &&
		typeof OffscreenCanvas.prototype.convertToBlob === "function"
	);
}

function getBakeWorker(): Worker | null {
	if (workerBroken) return null;
	if (bakeWorker) return bakeWorker;
	try {
		bakeWorker = new Worker(new URL("./satBakeWorker.ts", import.meta.url), {
			type: "module",
		});
		bakeWorker.onmessage = (e: MessageEvent<BakeRes>) => {
			const cb = pendingBakes.get(e.data.id);
			if (cb) {
				pendingBakes.delete(e.data.id);
				cb(e.data);
			}
		};
		bakeWorker.onerror = () => {
			workerBroken = true;
			bakeWorker = null;
		};
		return bakeWorker;
	} catch {
		workerBroken = true;
		return null;
	}
}

/** Composite in the worker. Resolves the result, or null if the worker is
 *  unavailable / hangs (→ caller falls back to the main thread). */
function compositeInWorker(
	tiles: TileDraw[],
	w: number,
	h: number,
): Promise<BakeRes | null> {
	const wk = getBakeWorker();
	if (!wk) return Promise.resolve(null);
	const id = ++reqId;
	return new Promise<BakeRes | null>((resolve) => {
		pendingBakes.set(id, resolve);
		// Safety net: a wedged worker must never strand a bake — fall back after 30s.
		const timer = setTimeout(() => {
			if (pendingBakes.has(id)) {
				pendingBakes.delete(id);
				resolve(null);
			}
		}, 30000);
		const done = pendingBakes.get(id);
		if (done) {
			pendingBakes.set(id, (r) => {
				clearTimeout(timer);
				resolve(r);
			});
		}
		wk.postMessage({ id, tiles, w, h });
	}).finally(() => {
		scheduleBakeWorkerTeardown();
	});
}

/**
 * Retire the bake worker once it has been idle for a while.
 *
 * ── What it is holding ──
 * A decoded z14 tile is ~7 KB on the wire but **262 KB in RAM** (256×256 RGBA),
 * and each bake also allocates a 1536×~1536 OffscreenCanvas (~9 MB). A Worker
 * keeps its entire heap until terminated, so leaving this one alive parks the
 * high-water mark of every bake this session — measured at ~391 MB in the
 * worker while the main thread held 384 MB.
 *
 * Terminating drops the tile cache, the canvases, and the module heap in one
 * go; `getBakeWorker` respawns lazily on the next bake. Cheap: spawning costs
 * milliseconds, and bakes are already an occasional background job.
 *
 * ⚠️ `bakeWorker = null` is correct HERE (unlike the decode worker) because
 * this module gates permanent failure on the separate `workerBroken` flag —
 * null just means "not spawned". Do NOT set `workerBroken`, which would disable
 * the worker for the session and push every later bake onto the main thread.
 */
const BAKE_WORKER_IDLE_MS = 30_000;
let bakeTeardownTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleBakeWorkerTeardown(): void {
	clearTimeout(bakeTeardownTimer);
	bakeTeardownTimer = setTimeout(() => {
		// A bake still in flight owns a resolver that only the worker can call —
		// terminating now would strand it until the 30 s timeout. Re-arm instead.
		if (pendingBakes.size > 0) {
			scheduleBakeWorkerTeardown();
			return;
		}
		if (bakeWorker) {
			bakeWorker.terminate();
			bakeWorker = null;
		}
	}, BAKE_WORKER_IDLE_MS);
}

/**
 * Bake the single masked satellite photo for a centre (idempotent — returns the
 * stored image if already baked). Fetches the z14 tiles whose square touches the
 * radius circle and composites them onto a transparent canvas; gaps stay
 * transparent (the jagged mask). Returns null only if NO tiles loaded.
 *
 * Fast path: OffscreenCanvas worker (off the UI thread). The worker holds its
 * own LRU tile cache so border tiles shared by overlapping-disc neighbours are
 * decoded once, not once per pin.
 * Fallback: main-thread canvas (older iOS WebKit without convertToBlob), using
 * the shared `tileCache` LRU above for the same dedup benefit.
 */
export async function bakeSatelliteImage(
	center: [number, number],
): Promise<SatImage | null> {
	const key = satImageKey(center);
	const existing = await idb.get(key);
	// Serve the cache ONLY when its geometry stamp is current. A legacy/stale photo
	// (older bounds math → renders clipped to a fraction) is a MISS → re-bake below.
	if (existing && existing.bakeVersion === BAKE_VERSION) return existing;
	// OFFLINE — a re-bake can't succeed (every tile fetch fails AND counts against
	// the session breaker; the 20 s reconcile would trip it within ~30 min of
	// airplane-mode use). Keep showing a stale photo if we have one (better than a
	// blank area) and let the next ONLINE reconcile pass heal it; only nothing-at-
	// all when there's no photo to fall back on.
	if (typeof navigator !== "undefined" && navigator.onLine === false)
		return existing ?? null;

	const [clng, clat] = center;
	const z = BAKE_ZOOM;
	const { dLat, dLng } = kmToDegSpan(BAKE_RADIUS_KM, clat);
	const xMin = lngToTileX(clng - dLng, z);
	const xMax = lngToTileX(clng + dLng, z);
	const yMin = latToTileY(clat + dLat, z);
	const yMax = latToTileY(clat - dLat, z);

	// Circular tile set → jagged DISC, not a square.
	const tileGeo: { x: number; y: number; w: number; e: number; n: number; s: number }[] = [];
	for (let x = xMin; x <= xMax; x++) {
		for (let y = yMin; y <= yMax; y++) {
			const w = tileToLng(x, z);
			const e = tileToLng(x + 1, z);
			const n = tileToLat(y, z);
			const s = tileToLat(y + 1, z);
			const cx = Math.min(Math.max(clng, w), e);
			const cy = Math.min(Math.max(clat, s), n);
			if (kmBetween([clng, clat], [cx, cy]) > BAKE_RADIUS_KM) continue;
			tileGeo.push({ x, y, w, e, n, s });
		}
	}
	if (!tileGeo.length) return null;

	// ── HARD GUARD ── before fetching a single byte: a legit 6 km z14 disc is
	// ~60 tiles. If this grid is absurd (a huge area / bad coordinate), trip the
	// circuit breaker NOW — stops cold + alerts Sentry, never racks up data.
	guardBakeGrid(tileGeo.length, { center, z, radiusKm: BAKE_RADIUS_KM });

	// Canvas spans the tile-set bbox, in web-mercator Y so tiles sit square.
	// Loop instead of Math.min(...spread) — a spread over the tile list is
	// the arg-count RangeError class the arg-spread guard forbids.
	let bw = Infinity;
	let be = -Infinity;
	let bn = -Infinity;
	let bs = Infinity;
	for (const t of tileGeo) {
		if (t.w < bw) bw = t.w;
		if (t.e > be) be = t.e;
		if (t.n > bn) bn = t.n;
		if (t.s < bs) bs = t.s;
	}
	// ── CROP TO THE PIN, NOT THE TILE GRID ──────────────────────────────────
	//
	// ⛔ `bw/bs/be/bn` above are the union of whole z14 TILE rectangles, so they
	// SNAP TO THE TILE GRID. Drawing and storing that box puts the pin wherever
	// it happens to fall inside the grid — MEASURED at lat 44.5: a z14 tile is
	// 1.745 km, so the pin lands up to 873 m off centre, 44% of the 2 km radius.
	// The user: "the satellite blob needs to be in the center. It's that simple."
	//
	// So the tiles are still FETCHED on the tile grid (they have to be — that is
	// how imagery is addressed), but the canvas is cut to the pin's own box. The
	// overhang is discarded rather than shipped, which also makes the blob a bit
	// smaller.
	//
	// ⚠️ THE BOUNDS AND THE PIXELS MUST SHRINK TOGETHER. Shrinking only the stored
	// `bounds` squashes the image — the same picture drawn into a smaller box.
	// They are both derived from `cw/cs/ce/cn` below for exactly that reason.
	const span = kmToDegSpan(BAKE_RADIUS_KM, clat);
	const cw = Math.max(bw, clng - span.dLng);
	const ce = Math.min(be, clng + span.dLng);
	const cs = Math.max(bs, clat - span.dLat);
	const cn = Math.min(bn, clat + span.dLat);

	const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
	const yTop = mercY(cn);
	const yExt = yTop - mercY(cs);
	const xExt = ((ce - cw) * Math.PI) / 180;
	const W = CANVAS_W;
	const H = Math.max(1, Math.round((W * yExt) / xExt));

	// Pre-compute pixel positions for every tile (same coords for worker + fallback).
	const xf = (lng: number) => (((lng - cw) * Math.PI) / 180 / xExt) * W;
	const yf = (lat: number) => ((yTop - mercY(lat)) / yExt) * H;
	const tileDraw: TileDraw[] = tileGeo.map((t) => {
		const dx = Math.floor(xf(t.w));
		const dy = Math.floor(yf(t.n));
		return {
			url: satelliteTileUrl(z, t.x, t.y),
			dx,
			dy,
			// Snap to whole px + round size up 1 px so adjacent tiles overlap (no plaid).
			dw: Math.ceil(xf(t.e) - dx) + 1,
			dh: Math.ceil(yf(t.s) - dy) + 1,
		};
	});

	let blob: Blob | null = null;
	let fetched = 0;
	let loaded = 0; // how many of the disc's tiles actually drew onto the canvas

	// ── Try the OffscreenCanvas worker first (off the UI thread) ─────────────────
	if (offscreenSupported()) {
		const res = await compositeInWorker(tileDraw, W, H);
		if (res?.blob) {
			blob = res.blob;
			fetched = res.fetched;
			loaded = res.loaded;
		}
	}

	// ── Main-thread fallback (older iOS WebKit without OffscreenCanvas.convertToBlob) ──
	if (!blob) {
		const canvas = document.createElement("canvas");
		canvas.width = W;
		canvas.height = H;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		let mtFetched = 0;
		// ── HOW MANY IMAGERY TILES AT ONCE ──────────────────────────────────
		//
		// A 2 km z14 disc is ~60 tiles, so this number IS the satellite's wall
		// clock: at 6 it is ten sequential rounds of network latency, which is
		// most of the "the satellite takes a minute" the user measured.
		//
		// 16 is chosen against the browser's own ceiling, not picked freely:
		// Chrome allows 6 connections per HOST but many more across the pool
		// when the source is HTTP/2 (which multiplexes over ONE connection, so
		// the 6-per-host rule stops applying). Going far above this buys nothing
		// and risks the source throttling us — which costs far more than it
		// saves, because a throttled bake backs off 30 s to 15 min.
		//
		// ⚠️ The roads pack downloads CONCURRENTLY with this (Promise.all in
		// offlineBakeService), so this pool shares the phone's connection with
		// that one request. Raising it much further starves the roads.
		await pool(tileDraw.length, SAT_FETCH_CONCURRENCY, async (i) => {
			const t = tileDraw[i];
			// Check before calling so we know if this URL was already decoded.
			const wasCached = tileCache.has(t.url);
			const src = await loadTileBitmap(t.url);
			if (!src) return; // gap → transparent → jagged mask
			if (!wasCached) mtFetched += 1;
			ctx.drawImage(src, t.dx, t.dy, t.dw, t.dh);
			loaded += 1;
		});
		if (!loaded) return null;
		// WEBP, not PNG. The satellite is photographic imagery — lossless PNG was
		// ~3-5× bigger for zero visible benefit. WebP at q0.82 keeps the alpha channel
		// (so the jagged transparent frontier — LAW 2 — survives, unlike JPEG) and cuts
		// the blob ~70%. Older iOS WKWebView (<17) can't ENCODE webp via toBlob and
		// silently hands back PNG; that's fine — the blob is still valid + honest
		// (blob.type tells the truth), those devices just don't get the size win.
		blob = await new Promise<Blob | null>((res) =>
			canvas.toBlob((b) => res(b), "image/webp", 0.75),
		);
		fetched = mtFetched;
	}

	if (!blob) return null;

	// ── COVERAGE GUARD — do NOT store a mostly-EMPTY disc as "the satellite". ──
	// When the EOX source throttles (e.g. a bulk import fires hundreds of bakes at
	// once → rate-limited), most tiles fail and the canvas is nearly transparent,
	// producing a ~30 KB dud that looks "complete" but shows no photo. Requiring a
	// real fraction of the disc to have drawn means a throttled bake FAILS (returns
	// null / keeps a prior good photo) and the reconcile retries it later instead of
	// poisoning the area with an empty image. A few missing tiles (jagged frontier) is
	// fine; <40% of the disc is a failed fetch, not a legitimate photo.
	const minTiles = Math.max(1, Math.ceil(tileGeo.length * 0.4));
	if (loaded < minTiles) return existing ?? null;

	// Charge only REAL network fetches against the session download guard — not the
	// total tile count. The shared tile cache means neighbours reuse already-decoded
	// tiles without touching the network, so counting every tile overstates the cost.
	if (fetched > 0) noteSatelliteTiles(fetched);
	// The bounds are the CROP box — the same box the pixels were drawn into.
	const out: SatImage = { blob, bounds: [cw, cs, ce, cn], bakeVersion: BAKE_VERSION };
	await idb.put(key, out);
	return out;
}
