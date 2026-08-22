/**
 * ONE-SHOT PURGE of the deleted road-raster store.
 *
 * ── WHAT THIS IS THE TOMBSTONE OF ──────────────────────────────────────────
 * `v4RoadRasters.ts` (447 lines) + `rasterDecode.ts` (115 lines) drew a PNG
 * picture of each area's roads and mounted it as an image source whenever the
 * camera was below the vector hand-off. It is DELETED (2026-08-17).
 *
 * WHY IT EXISTED — and why neither reason is true any more:
 *   1. The pack stopped at z12, so z8-z12 had no vector tiles to draw.
 *      → The Worker now ships a z10 regional ring (pv21).
 *   2. Decoding vector tiles into GeoJSON cost ~705 MB, so vectors could not
 *      be live while zoomed out.
 *      → Raw tiles go to the renderer UNDECODED. That cost is gone.
 *
 * WHAT IT COST, measured:
 *   ~70 MB of PNGs on disk (283 areas x 2 renders x ~247 kB)
 *   4 MB of texture per mounted sheet, cap 250 -> ~250 MB idle main thread
 *   78 m per pixel, so its thinnest possible line was ~8x a real road
 *   (measured in-app: one line 445 m across)
 * The vectors that replaced it cost ~250 kB for the same ground.
 *
 * ⚠️ DO NOT RE-ADD A PICTURE OF THE ROADS. If a zoom band looks empty, the fix
 * is a SHALLOWER RING IN THE PACK (Worker-side). A vector is thin and sharp at
 * every zoom; that is the entire point of it.
 *
 * ── WHY THIS FILE EXISTS AT ALL ────────────────────────────────────────────
 * Deleting the code does NOT delete the bytes. Every device that ever baked an
 * area is holding ~70 MB of PNGs in an IndexedDB database nothing will ever
 * open again. Dropping the whole database is the only way that space comes
 * back, and it has to ship WITH the deletion or it never ships at all.
 *
 * The names below are the REAL persisted ones — historical, deliberately not
 * matching the module's later "raster" naming. They must stay exactly as
 * written or the purge misses the data it exists to reclaim.
 */
const DEAD_DB_NAME = "retreever-v4-thumbs";
/** The later, short-lived rename — a handful of devices got this one instead. */
const DEAD_DB_NAME_ALT = "retreever-v4-rasters";

let purged = false;

/**
 * Drop the orphaned raster databases. Safe to call repeatedly (it no-ops after
 * the first run) and safe to call on a device that never had them — deleting a
 * database that does not exist succeeds silently.
 *
 * Deliberately never throws: this is housekeeping, and failing to reclaim disk
 * must never take down the map. A blocked delete (another tab holding the DB
 * open) simply resolves; the next launch tries again.
 */
export function purgeDeadRoadRasters(): void {
	if (purged || typeof indexedDB === "undefined") return;
	purged = true;
	for (const name of [DEAD_DB_NAME, DEAD_DB_NAME_ALT]) {
		try {
			const req = indexedDB.deleteDatabase(name);
			// `blocked` fires when another tab still holds the DB open. Nothing to
			// do but let it go — the delete completes once that tab releases it,
			// and the next launch retries regardless.
			req.onblocked = () => {};
			req.onerror = () => {};
		} catch {
			// indexedDB unavailable (private mode, locked profile) — ignore.
		}
	}
}
