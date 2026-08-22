/// <reference lib="webworker" />
/**
 * satBakeWorker.ts — the satellite compositor, OFF the UI thread.
 *
 * The main thread computes a tile list + canvas size; this worker fetches and
 * decodes each z14 tile, draws them onto an OffscreenCanvas in the jagged-disc
 * shape, and PNG-encodes ONE blob. All the heavy work (decode + draw + encode)
 * happens here, so it never competes with scrolling/rendering on the UI thread.
 *
 * It also holds a small LRU of DECODED tiles keyed by URL: neighbouring pins'
 * 6 km discs overlap, so a border tile would otherwise be re-fetched and re-
 * decoded once per pin. The cache makes overlapping discs reuse the one decode —
 * killing the "same tile N times" churn. `fetched` reports real cache misses so
 * the main thread can charge them against the session download breaker.
 *
 * Falls back to the main thread (in satelliteImage.ts) where OffscreenCanvas /
 * convertToBlob aren't available (older iOS WebKit).
 */

type TileDraw = { url: string; dx: number; dy: number; dw: number; dh: number };
type BakeReq = { id: number; tiles: TileDraw[]; w: number; h: number };
type BakeRes = { id: number; blob: Blob | null; loaded: number; fetched: number };

/**
 * How many DECODED tiles to keep. Sized from the working set, not a round number.
 *
 * ── The trap this fixes ──
 * An EOX z14 tile is ~7 KB on the wire and **262 KB in RAM** (256×256 RGBA, a
 * ~37× expansion) — so a cache that looks free by download size is expensive by
 * heap. At the old cap of 256 this Map alone was ~67 MB, and the same 256 was
 * duplicated in `satelliteImage.ts` for the main-thread fallback.
 *
 * ── Why 48 ──
 * One bake is ~6 tiles (2 km disc at z14), and the hard guard upstream treats
 * ~60 as the absurd-grid ceiling for a 6 km disc. 48 holds several consecutive
 * bakes — which is all the LRU is for, since it exists to stop "same tile N
 * times" churn *within* a pass, not to be a session-long tile store (that job
 * belongs to the HTTP cache and the baked blobs on disk).
 *
 * ⚠️ Sizing a bitmap cache in ENTRIES is the original error; the cost is in
 * BYTES. If tiles ever get bigger (z15, @2x, RGBA16) this number must come DOWN,
 * not stay put. 48 × 262 KB ≈ 12 MB.
 */
const CACHE_MAX = 48;
const cache = new Map<string, Promise<ImageBitmap | null>>();

function loadTile(url: string, onFetch: () => void): Promise<ImageBitmap | null> {
	const hit = cache.get(url);
	if (hit) {
		// LRU bump — move to the most-recently-used end.
		cache.delete(url);
		cache.set(url, hit);
		return hit;
	}
	onFetch();
	const p = (async (): Promise<ImageBitmap | null> => {
		try {
			const r = await fetch(url);
			if (!r.ok) return null;
			return await createImageBitmap(await r.blob());
		} catch {
			return null;
		}
	})();
	cache.set(url, p);
	// Don't pin a failure: drop it so a later (online) pass can retry the tile.
	p.then((bm) => {
		if (!bm) cache.delete(url);
	}).catch(() => cache.delete(url));
	// Evict oldest-first until we are back AT the cap, freeing each bitmap's
	// GPU/host memory. `while`, not `if`: a single-eviction step can only hold a
	// cache that is already at size, so after a cap REDUCTION (or any burst that
	// outran eviction) an `if` would leave the surplus resident forever — the
	// cache would sit at its old high-water mark and the new cap would be a lie.
	while (cache.size > CACHE_MAX) {
		const oldest = cache.keys().next().value as string | undefined;
		// Never evict the entry just inserted, and stop if that is all that is
		// left — otherwise this loop could spin on a cache it cannot shrink.
		if (oldest === undefined || oldest === url) break;
		const ev = cache.get(oldest);
		cache.delete(oldest);
		// codestyle-allow-swallow: bitmap cache eviction is best-effort; a close() failure leaves GPU memory until GC, not a data loss
		ev?.then((bm) => bm?.close()).catch(() => { /* best-effort eviction */ });
	}
	return p;
}

self.onmessage = async (e: MessageEvent<BakeReq>): Promise<void> => {
	const { id, tiles, w, h } = e.data;
	let loaded = 0;
	let fetched = 0;
	const post = (blob: Blob | null): void => {
		const res: BakeRes = { id, blob, loaded, fetched };
		(self as unknown as Worker).postMessage(res);
	};
	const canvas = new OffscreenCanvas(w, h);
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		post(null);
		return;
	}
	// Bounded concurrency, mirroring the main-thread pool (6 in flight).
	const LIMIT = 6;
	let next = 0;
	const work = async (): Promise<void> => {
		while (next < tiles.length) {
			const t = tiles[next++];
			const bm = await loadTile(t.url, () => {
				fetched += 1;
			});
			if (!bm) continue; // gap → transparent → jagged mask
			ctx.drawImage(bm, t.dx, t.dy, t.dw, t.dh);
			loaded += 1;
		}
	};
	await Promise.all(
		Array.from({ length: Math.min(LIMIT, tiles.length) }, () => work()),
	);
	if (!loaded) {
		post(null);
		return;
	}
	try {
		// WebP, not PNG — photographic imagery, ~70% smaller, keeps alpha (the jagged
		// transparent frontier survives). This is the FAST path (used in Chrome + modern
		// iOS); the main-thread fallback in satelliteImage.ts encodes WebP too.
		post(await canvas.convertToBlob({ type: "image/webp", quality: 0.75 }));
	} catch {
		post(null);
	}
};

export {};
