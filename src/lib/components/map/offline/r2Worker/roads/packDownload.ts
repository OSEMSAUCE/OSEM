/**
 * v4 offline base map — download Protomaps tiles to on-device storage and serve
 * them to the renderer UNCHANGED. Obeys LAW 0 (map never streams) AND the
 * constant-presence law (nothing pops in/out as you zoom).
 *
 *   1. DOWNLOAD (on user volition) — ONE request to the `offline-tiles` Cloudflare
 *      Worker's `/pack?lng=&lat=` endpoint. The Worker computes the SAME jagged disc
 *      this file does, reads every tile from the R2 archive edge-side, and returns
 *      them packed into a single binary blob. The phone unpacks it into IndexedDB.
 *      (Was: the `pmtiles` reader range-reading each tile straight from R2 — ~1000
 *      separate phone↔R2 round-trips, minutes. Now: one request, seconds. The Worker
 *      lives in `workers/offline-tiles/`; the disc math here and there MUST match.)
 *   2. RENDER — there is NO decode step. MapLibre reads the stored tiles as they
 *      are, over the `rtraw://` protocol, with ONE SOURCE PER RING so each
 *      overzooms independently off the zoom it was downloaded at (see
 *      rawWallProtocol.ts). Constant presence comes from that free overzoom: a
 *      downloaded area is drawn at every zoom above its own, never popping in or
 *      out at a threshold, and an address that was never downloaded 404s — which
 *      is what draws the jagged frontier, at no cost.
 *
 *      This file used to own step 2 as a DECODE: every stored tile parsed into
 *      one flat roads+water FeatureCollection, handed to `geojson` sources. That
 *      is what spiked the route to 800-1200 MB. The whole apparatus (worker, job
 *      table, fallback, teardown timers) is gone — and as of 2026-08-17 so is
 *      the LAST decoder, `buildV4Bands`, which existed only to feed the road
 *      raster. NOTHING in this file turns a tile into GeoJSON any more.
 *
 * The only network is the DOWNLOADER's one-time fetch; the map is fully
 * air-gapped by `v4TransformRequest`.
 */
import { VectorTile } from "@mapbox/vector-tile";
import Pbf from "pbf";
import { guardPackDownload } from "$osem/components/map/offline/onPhone/store/downloadGuard";
import { migrateIdbDatabase } from "$osem/components/map/offline/onPhone/store/idbRename";
import {
	currentDbName,
	registerOfflineDbReset,
	registerWipeLatch,
} from "$osem/components/map/mapShared/sandboxDbNames";
import { BLOB_RADIUS_KM, BLOB_ZOOMS } from "$osem/components/map/offline/contract/roadBlob";
import { pinTileKey } from "$osem/components/map/offline/contract/grid";
import { keysForAddress } from "$osem/components/map/offline/onPhone/roads/pinTileLookup";
import { cellTileKey, cellsFor } from "$osem/components/map/offline/contract/grid";
import { packUrl } from "$osem/components/map/offline/r2Worker/tilesHost";

/** The `offline-tiles` Worker's pack endpoint — ONE request returns both rings of
 *  tiles, packed, instead of the phone range-reading each tile itself. The Worker
 *  reads the OWNED Cloudflare R2 archive (`planet.pmtiles` — whole world, z0–15, in
 *  the `offline-tiles` bucket) edge-side via its R2 binding — fast, $0 egress, NOT
 *  subject to the Workers subrequest cap, and (being whole-world) free of the
 *  regional-edge holes that broke per-area shapes. Source + deploy:
 *  /Users/chrisharris/DEV/fetch/ReTreever/workers/offline-tiles/. The ring geometry
 *  below (RINGS / DETAIL_INNER_Z) must stay in lockstep with the Worker. */
// packUrl() (and which Worker it points at) lives in r2Worker/tilesHost.
// Imported at the top of this file.
// Wire-format version, appended to every pack request. The Worker edge-caches each
// disc keyed by the FULL URL and that cache survives Worker redeploys — so whenever
// the pack wire format changes (e.g. gzip added), BUMP this to bypass stale cached
// entries in the old format. 2 = gzipped pack · 3/4 = ring slots polluted pre-deploy
// with old packs · 5 = rings, but z13 stored WHOLE (base+landcover dead weight) · 6 = z13
// outer ring STRIPPED to roads-only at the Worker (~6× smaller pack) · 7 = z13 outer ring
// keeps roads + WATER (coastline, so roads don't float over the ocean); landcover/landuse
// still stripped · 8 = same as 7, but 7 got edge-cached as roads-only packs (fetched from
// the old Worker BEFORE the water deploy landed) · 9 = outer ring ALSO keeps `earth` (the
// precise landmass polygon — the ground map — so land-vs-sea figure-ground is exact)
// · 12 = INNER ring brings WATER back (small detailed lakes, ~13–300 KB), OUTER ring
// stays roads+earth so water never reaches the 25 km edge · 13 = `earth` DROPPED from
// both rings (its z12 fill rendered as ugly tile-square blocks; not shipped, not drawn) —
// outer = roads+places, inner = roads+water+pois. Smaller packs.
// · 14 = Worker kind-strips pois→hospital/camp_site + places→town-kinds (drops ~86k
// never-rendered city features), AND applies the ROADS BUDGET.
// · 15 = ROADS BUDGET simplified to ONE rule: default 40 km with paths; if 40 km
// roads > 2 MB → drop ALL paths AND shrink to 25 km (one move). Only roads count.
// Bump on wire change OR when a content change could collide with pre-deploy cached packs.
// · 16 = ZERO-BYTE TILES EXCLUDED. Every pv≤15 pack cached at the edge can still
// contain tiles that filtered down to nothing (`n:0`) — the phone stored those as
// real tiles and Mapbox threw "Unimplemented type: 4" parsing each one on every
// render pass (7,213 of 37,503 tiles on the dev device). The Worker now drops them
// at the source; this bump is what stops the edge serving the poisoned packs.
// · 17 = THE z13 MID RING. Packs now carry THREE levels (z15 core, z13 @ 25 km,
// z12 outer) instead of two. Every pv≤16 pack cached at the edge is missing z13
// entirely, so without this bump the phone would keep receiving two-level packs and
// keep manufacturing the middle itself — the whole point of the change. See
// workers/offline-tiles/src/packBuilder.ts (MID_RING_Z) for the why.
// · 18 = the z13 ring TRIMMED to the major network. 17 shipped z13 with full road
// detail + water and measured +152%…+399% pack (the mid ring alone was 55-77% of
// every pack). Dropping water and keeping only major_road/highway/rail/ferry at
// this level brought it to +15%…+28% — see MID_ROAD_KINDS in the Worker.
//
// NB when measuring a Worker change: probe on a throwaway `&cb=` key, and bump this
// only AFTER the deploy is live. Packs are cached `immutable` with no purge, so a
// version requested against the OLD build is poisoned at the edge permanently.
// · 19 = mid ring settled: 10 km reach, `minor_road` KEPT, `path` dropped, no water.
// (18 was warmed at the edge mid-iteration and permanently holds a 25 km trimmed-kind
// build.) Final measured pack: 131→155 kB sparse, 276→358 kB, 685→1004 kB dense.
// · 20 = `landuse` shipped on the z15 inner ring (the forest/wetland/field fills).
// The six v4-land-* style layers now read source-layer `landuse` DIRECTLY instead of
// the `land` layer the on-device decoder used to synthesise — which is what lets the
// decoder go. Measured 131→200 kB sparse, 276→472 kB, 685→1255 kB dense (vs the
// pre-z13 baseline). `landcover` deliberately NOT shipped: empty in this archive.
// · 21 = THE z10 REGIONAL RING. Packs carry FOUR levels (z15, z13, z12, z10).
// Every pv<=20 pack stops at z12, so z8-z12 fell back to the blurry raster.
// 16-25 tiles per area vs 196-225 for the z12 ring.
// · 22 = THE REGIONAL RING DROPS z10 -> z9, AND THE ROAD RASTER IS DELETED.
// z9 is the SHALLOWEST ring the geometry allows: a z9 tile is 55 km, inside the
// 80 km area; z8 is 110 km and would paint undownloaded ground (the rejected
// build). With z9 shipping real vectors there is nothing left for a picture of
// the roads to do, so ~70 MB of PNGs per device and 562 lines of raster code
// are gone — see purgeRoadRasters.ts. Roads are vectors at EVERY zoom now.
// · 24 = THE DISC IS SAVED AT EVERY ZOOM (z1-z11 plus z12/z13/z15). ONE circle,
// one radius, written once per level, so there is no zoom where the blob has no
// tile to draw. Versions 21-23 each added ONE shallow level and only MOVED the
// cliff (z12 -> z10 -> z9); this removes it. ~20-25 extra tiles, the cheapest in
// the archive — by z6 the whole disc fits in a single tile.
// · 25 = THE REWRITE. ONE 30 km circle, saved at EVERY zoom (roadBlob.ts).
// Replaces 11 constants across 3 files that had drifted out of sync (the client
// declared 40 km while the Worker shipped 25). The over-budget path no longer
// SHRINKS the radius — it only drops paths, so the blob is the same size in the
// city as in the bush.
// · 33 = THE SQUARE GRID. The unit of storage is no longer a 30 km DISC centred
// on the pin — it is a 40 km SQUARE CELL snapped to a world grid (grid.ts), with
// a 20 km radius guaranteed in every direction. Three things went with the disc:
// the per-tile clip, the per-level downsampler, and the seam (two pins produced
// two differently-centred circles, so a road crossing both was cut at two arcs
// that did not meet — photographed on screen). Neighbouring cells now share
// EXACT edges, and two pins in one cell request the SAME URL, so the second is
// an edge-cache hit. Every pv<=32 pack at the edge is a disc; this bump is what
// stops them being served.
export const PACK_FORMAT_VERSION = 44;

// The tile pile is keyed by DB name. `areaTilesPresent` asks "did this area's
// download survive?" (any disc key present), NOT "does it cover the CURRENT
// geometry" — so a RINGS / decode-scope change never re-downloads existing areas
// on its own. Renaming the DB is the FLEET-WIDE RE-BAKE lever: it wipes the pile,
// so every area re-downloads at the current geometry on its next reconcile pass.
// Unlike bumping BAKE_VERSION (the satellite photo — a fleet-wide invalidation
// there blanks every pin at once and hammers EOX into rate-limit backoff), a tile
// re-download just re-fetches small vector packs from our own Worker — cheap, safe.
//
// `rt-tiles-v3`: wipe so every area re-bakes thin under the kind-strip + roads
// budget (pv=14) — old packs still hold the ~86k never-rendered pois/places and a
// fixed 25 km reach. No carry-forward — superseded packs are swept, not migrated.
// RENAMED 2026-08-17: `rt-tiles-v3` → `gc-offlineTiles`.
//
// The old name carried a format generation (rt-tiles → -v2 → -v3) that read as
// a STALE ENGINE VERSION to everyone who saw it — "we're on v4, why does this
// say v3?" — and cost real time twice. A version number in a name that outlives
// the version is a trap; the generation now lives in DB_VERSION, where a bump
// is a schema decision instead of a rename.
//
// `gc-` = Get Cache (the app that owns this data), not `rt-` (ReTreever, the
// company). `offline` marks it as the offline map's storage, and `Tiles` says
// ROADS/WATER geometry — the satellite photos live in gc-offlineSatellite.
//
// The previous note here said renaming "orphans every device's tiles". That was
// true only while no migration existed: migrateIdbDatabase below carries the
// pile forward ONCE on first boot of the renamed build. The older `rt-tiles*`
// names stay in the sweep list below (they were deliberately never migrated —
// superseded pack geometry, re-baked thin).
export const DB_NAME = "gc-offlineTiles";
const STORE = "tiles";
const DB_VERSION = 1;

// ── CARRY THE PILE FORWARD, THEN SWEEP ───────────────────────────────────────
//
// ORDER IS LOAD-BEARING. `rt-tiles-v3` is both the migration SOURCE and a
// `rt-tiles*` sweep match, so an unawaited sweep would race the copy and delete
// the pile mid-read. The sweep therefore runs only AFTER the migration settles,
// and skips the source explicitly.
//
// The other `rt-tiles*` generations (`rt-tiles`, `rt-tiles-v2`) and the
// pre-rename `retreever-v4-tiles*` leftovers are still swept WITHOUT migration:
// they hold superseded pack geometry that must re-bake thin, which is why only
// `rt-tiles-v3` is carried.
const TILES_MIGRATION_SOURCE = "rt-tiles-v3";
if (typeof indexedDB !== "undefined") {
	void migrateIdbDatabase(TILES_MIGRATION_SOURCE, DB_NAME, STORE).then(() => {
	if (typeof indexedDB.databases === "function") {
		indexedDB
			.databases()
			.then((dbs) => {
				for (const d of dbs) {
					if (
						(d.name?.startsWith("retreever-v4-tiles") ||
							d.name?.startsWith("rt-tiles")) &&
						d.name !== DB_NAME
					) {
						indexedDB.deleteDatabase(d.name);
					}
				}
			})
			// codestyle-allow-swallow: best-effort stale-DB sweep; if indexedDB.databases() rejects we just leave the old tile DBs to be swept next boot
			.catch(() => {
				/* swept next boot instead */
			});
	}
	});
}

// CONCENTRIC RINGS — each anchor downloads two jagged discs at two zooms, not one
// monolithic disc. Far less data (~105 tiles vs ~1000), and the shape is governed
// by small clean radii. The rings are SPATIAL regions rendered at EVERY zoom (never
// swapped as you pinch), so Law 1 (constant presence) holds:
//   • inner 5 km @ z15 → FULL detail (roads + water + landcover/landuse fills)
//   • outer 25 km @ z13 → ROADS + WATER (decode drops landcover/landuse/pois below
//     DETAIL_INNER_Z, but keeps water so the regional reach reads land-vs-coastline)
// The satellite photo (separate, EOX bake) is the 3 km core, so the full-detail
// vector ring (5 km) extends a clear band BEYOND the photo — that's where wetland/
// forest/field/water read. radius = a true RADIUS from the pin, NOT a diameter. RAM
// stays in check by decoding only the ACTIVE map's tiles (buildV4GeoJSON(onlyKeys)),
// never the whole on-disk pile. MUST stay in lockstep with the Worker's RINGS
// (workers/offline-tiles/src/index.ts) — change both together + redeploy the Worker.
// Two concentric jagged discs per anchor:
//   • inner 5 km @ z15 → FULL detail (all road kinds + paths, water fills, landcover)
//   • outer 40 km @ z12 → the MAX reach the roads budget may grow to. The Worker
//     decides 25 OR 40 km per area (roads ≤2 MB → 40, else 25) and ships only that
//     subset; this 40 km is the SUPERSET so `areaTileKeys` covers whatever lands.
//     `areaTilesPresent` is any-hit, so a 25 km pack still reads as present. DO NOT
//     shrink the reach — sparse areas need the 40 km; the budget keeps it cheap.
// The satellite photo is the 2 km core; the detail ring extends a band beyond it.
// · MID RING (z13 @ 25 km) — the level the DEFAULT CAMERA sits at. Without it the
//   pack jumped z12 → z15 with nothing between, and since MapLibre only overzooms
//   UP from the deepest tile it holds, z13-z14 had nothing to stretch. The phone
//   manufactured those levels itself (decode → glue → re-cut → re-encode), which is
//   the 453 MB @ 113 MB/s decode worker. Shipping z13 lets z14 overzoom off it for
//   free and removes the reason that machinery exists. Fixed 25 km: the roads budget
//   governs the z12 outer reach only, and this band is only looked at near the pin.
// · REGIONAL RING (z10 @ 40 km) — real vector roads for z10-z12, replacing the
//   pre-drawn raster that could only manage ~78 m per pixel (roads measured 445 m
//   wide on screen). A z10 tile is ~25 km — SMALLER than the 80 km area — so it
//   stays inside the downloaded footprint. The reverted z8 attempt failed exactly
//   here: a z8 tile is ~195 km, so it painted roads the user never downloaded.
/**
 * The blob, as a (km, zoom) table — DERIVED from the spec, never hand-written.
 *
 * ⚠️ DO NOT ADD ROWS HERE. This is a projection of `roadBlob.ts`: ONE radius
 * paired with every zoom the blob is saved at. It used to be a hand-maintained
 * list, and it drifted — it declared a 40 km outer disc while the Worker
 * actually shipped 25 km, and carried a stale `{km:40, z:9}` row that
 * duplicated the shallow range. Six call sites read this table, so a wrong row
 * here is wrong in six places at once.
 *
 * To change what the blob covers, edit BLOB_RADIUS_KM / BLOB_ZOOMS and bump
 * PACK_FORMAT_VERSION. Everything downstream follows.
 */
export const RINGS: ReadonlyArray<{ km: number; z: number }> = BLOB_ZOOMS.map(
	(z) => ({ km: BLOB_RADIUS_KM, z }),
);
/** Inner (detail) zoom. A stored tile BELOW this zoom contributes roads + water at
 *  decode time — that's how the 25 km z13 ring becomes roads + coastline. */
export const DETAIL_INNER_Z = 15;
export const V4_SOURCE_MAXZOOM = DETAIL_INNER_Z;

// ⛔ THE RING MACHINERY IS DELETED — `tilesForRing`, `tilesForRings`, `tileKey`
// and the slippy helpers that fed them.
//
// It computed the jagged disc of tiles an anchor's concentric rings covered:
// hundreds of keys per area, at several zooms, which then had to be probed,
// deduped and reconciled against the version stamp. That reconciliation is where
// the stamp-without-the-tiles bug lived.
//
// One cell is ONE blob under ONE key (`areaTileKeys` → grid.ts `cellTileKey`),
// so there is nothing left to enumerate.

// ── IndexedDB ───────────────────────────────────────────────────────────
function openDb(): Promise<IDBDatabase> {
	// opens fresh each call, so no cached handle to reset on sandbox toggle
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(currentDbName(DB_NAME), DB_VERSION);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(STORE))
				req.result.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

/** Write many tiles in ONE transaction (open/close the DB once, not per tile). The
 *  pack downloader lands a whole disc at once, so a per-tile open/close would be
 *  ~1000 connection churns; this is a single tx. `onStored` ticks per put for UI. */
async function idbPutMany(
	items: Array<[string, ArrayBuffer]>,
	onStored?: (done: number) => void,
): Promise<void> {
	// THE WRITE BOUNDARY — a 0-byte tile must never be persisted. It is not a tile:
	// Mapbox's worker throws "Unimplemented type: 4" parsing it, on EVERY render pass,
	// for as long as it sits on disk. This is a wall, not a filter: bad transient state
	// costs one dropped tile, but bad PERSISTED state poisons the map until the DB is
	// wiped. The Worker no longer emits them (packBuilder.ts), but an old edge-cached
	// pack — or any future producer — must still be unable to write one here.
	items = items.filter(([, b]) => b.byteLength > 0);
	if (!items.length) return;
	const db = await openDb();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		const store = tx.objectStore(STORE);
		let done = 0;
		for (const [k, b] of items) {
			const req = store.put(b, k);
			req.onsuccess = () => onStored?.(++done);
		}
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
	db.close();
}

/**
 * EVERY stored tile's bytes. Full-pile read.
 *
 * codestyle-allow-blob-getall: ON-DEMAND ONLY — the /blobs stats page is the
 * one caller left. This materialises every tile ArrayBuffer at once, so it must
 * never move onto a render path. The keyed reader that used to serve the live
 * wall map (`idbGetMany`) is gone with the road raster: nothing reads tiles out
 * of IndexedDB to draw them any more — the protocol handler answers MapLibre
 * one tile at a time. Enforced by scripts/check-blob-getall.mjs.
 */
async function idbEntries(): Promise<Array<[string, ArrayBuffer]>> {
	const db = await openDb();
	const out = await new Promise<Array<[string, ArrayBuffer]>>(
		(resolve, reject) => {
			const tx = db.transaction(STORE, "readonly");
			const store = tx.objectStore(STORE);
			const keysReq = store.getAllKeys();
			// codestyle-allow-blob-getall: on-demand only — see the note on this
			// function. No render path reaches here.
			const valsReq = store.getAll();
			tx.oncomplete = () =>
				resolve(
					(keysReq.result as string[])
						.map(
							(k, i) =>
								[k, valsReq.result[i] as ArrayBuffer] as [string, ArrayBuffer],
						)
						// Same self-heal as idbGetMany: never hand a 0-byte tile to the
						// decoder. See the write-boundary note in idbPutMany.
						.filter(([, b]) => b?.byteLength > 0),
				);
			tx.onerror = () => reject(tx.error);
		},
	);
	db.close();
	return out;
}

/** Fetch ONLY the given tile keys (skipping any that aren't stored). Lets the map
 *  decode just the ACTIVE map's tiles instead of the whole on-disk pile — so a
 *  blob from another map (or earlier activity) never bleeds onto the current map,
 *  and a 30 km-radius disc stays within the RAM law. */
/**
 * ONE tile's bytes, by "z/x/y" — the raw-tile protocol's read path.
 *
 * Unlike every other reader here this runs PER VISIBLE TILE, several times a
 * frame while panning, so it holds ONE long-lived connection instead of
 * opening and closing a database per call (an open is a structured-clone of
 * the schema plus a transaction setup — fine once per rebuild, ruinous per
 * tile). The handle is cached module-side and reopened if it ever closes.
 *
 * Returns null for a miss. A MISS IS NORMAL: the rings are jagged discs, so
 * most addresses inside their covering rectangle were never downloaded.
 */
let rawDb: IDBDatabase | null = null;

// ⛔ A CACHED CONNECTION BLOCKS `deleteDatabase`. Register the closer or the
// WIPE silently does nothing: MEASURED — `gc-offlineTiles` came back "blocked"
// and 4,303 stale tiles survived a wipe the user had been told was clean.
// Any module that caches an IDBDatabase MUST register here.
registerOfflineDbReset(() => {
	rawDb?.close();
	rawDb = null;
});

/**
 * ⛔ CLOSING THE HANDLE IS NOT ENOUGH — READS MUST STOP REOPENING IT.
 *
 * THE BUG THIS FIXES, measured live: the wipe closed every cached connection
 * and `gc-offlineTiles` STILL came back `blocked` while satellite and registry
 * deleted cleanly. The reason is that the map never stops: MapLibre requests
 * tiles continuously, and `idbGetTile` reopens the database on demand — so a
 * read landing microseconds after the closer re-established the very
 * connection that blocks `deleteDatabase`.
 *
 * A latch is the only thing that closes that race. While it is set, reads
 * resolve as MISSES rather than reopening, which is correct: the data is about
 * to be deleted anyway, and the page reloads immediately afterwards.
 */
registerWipeLatch({
	// The wipe still closes the cached handle before deleting — that part is
	// correct and cheap. What is NOT done here is refusing later reads: see the
	// note in `idbGetTile`.
	latch: () => {
		rawDb?.close();
		rawDb = null;
	},
	unlatch: () => {},
});

/**
 * Read the roads for a `z/x/y` ADDRESS — EVERY pin that owns it, merged.
 *
 * ⛔ ALL OWNERS, NOT THE NEAREST. Returning one owner is what left half a map
 * blank: the user's Greybull pin had a correct box (123 m off, 33 km every
 * direction) and still drew only half its roads, because the tiles it shared
 * with the neighbouring pin resolved to that neighbour instead. His words:
 * "half of it's missing because it doesn't want to overlap the other one."
 *
 * ⚠️ THE MERGE IS A BYTE CONCATENATION, AND IT IS VALID BY THE MVT SPEC. A
 * vector tile is a repeated field-3 `layers` message, so joining two tiles for
 * the SAME address yields a well-formed tile with both sets of layers — in one
 * shared coordinate space, because the address (and therefore the frame) is
 * identical. Nothing is decoded, nothing is re-projected, and no JSON crosses
 * the worker boundary.
 *
 * A miss returns null — never another pin's bytes standing in for the answer.
 */
export async function idbGetTileForAddress(
	z: number,
	x: number,
	y: number,
): Promise<ArrayBuffer | null> {
	const keys = keysForAddress(await getAllTileKeys(), z, x, y);
	if (!keys.length) return null;
	// The common case is ONE owner — return its bytes untouched (no copy).
	if (keys.length === 1) return idbGetTile(keys[0]);

	const parts: ArrayBuffer[] = [];
	for (const k of keys) {
		const b = await idbGetTile(k);
		if (b?.byteLength) parts.push(b);
	}
	if (!parts.length) return null;
	if (parts.length === 1) return parts[0];

	const total = parts.reduce((n, b) => n + b.byteLength, 0);
	const out = new Uint8Array(total);
	let off = 0;
	for (const b of parts) {
		out.set(new Uint8Array(b), off);
		off += b.byteLength;
	}
	return out.buffer;
}

export async function idbGetTile(key: string): Promise<ArrayBuffer | null> {
	// ⛔ THE LATCH NO LONGER BLOCKS READS. It was added to stop a wipe being
	// defeated by a reopen, and it worked for that — but a latch that survives
	// even one code path makes EVERY read a miss, which looks exactly like "the
	// blobs never arrive" while megabytes sit on disk. The user hit that with
	// 6.4 MB of roads stored and nothing drawing.
	//
	// A stuck wipe is recoverable (press it again); a map that silently reads
	// nothing is not. So the wipe closes handles and reloads, and this stays a
	// plain read. If the wipe blocks again, fix it in wipe.ts — never by making
	// the read path conditional.
	if (!rawDb) {
		rawDb = await openDb();
		// A connection can be closed out from under us by a version change (the
		// legacy-DB sweep) — drop the handle so the next read reopens.
		rawDb.onclose = () => {
			rawDb = null;
		};
	}
	const db = rawDb;
	return new Promise<ArrayBuffer | null>((resolve) => {
		let tx: IDBTransaction;
		try {
			tx = db.transaction(STORE, "readonly");
		} catch {
			// Connection went stale mid-flight — reopen on the next call.
			rawDb = null;
			resolve(null);
			return;
		}
		const req = tx.objectStore(STORE).get(key);
		req.onsuccess = () => {
			// Same 0-byte self-heal as idbGetMany — never hand empty bytes to the
			// protobuf parser ("Unimplemented type: 4" on every render pass).
			const b = req.result as ArrayBuffer | undefined;
			resolve(b?.byteLength ? b : null);
		};
		req.onerror = () => resolve(null);
	});
}

async function idbCount(): Promise<number> {
	const db = await openDb();
	const n = await new Promise<number>((resolve, reject) => {
		const tx = db.transaction(STORE, "readonly");
		const req = tx.objectStore(STORE).count();
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
	db.close();
	return n;
}

/** True once at least one tile is stored (so we can skip a re-download). */
export async function hasV4Tiles(): Promise<boolean> {
	return (await idbCount()) > 0;
}

/**
 * ONE-TIME SWEEP of 0-byte tiles left by the pre-guard Worker.
 *
 * Before `packBuilder.ts` learned that a filtered-to-nothing tile is the same as an
 * ocean tile, it shipped them with `n:0` and the phone stored them as real entries —
 * ~19% of a typical pile. Two harms, which is why skipping them at read time isn't
 * enough:
 *   1. Mapbox's worker threw "Unimplemented type: 4" on each one, every render pass.
 *   2. `areaTilesPresent` is an ANY-HIT probe, so an area whose disc landed entirely
 *      on empties reads as "covered" and is never re-downloaded — a permanent hole.
 * Deleting them makes that area honestly absent, so the next reconcile pass re-fetches
 * it from the fixed Worker. Cheap (one cursor pass) and idempotent — once the pile is
 * clean this deletes nothing and the flag stops it running again.
 */
export async function purgeEmptyTiles(): Promise<number> {
	const db = await openDb();
	const removed = await new Promise<number>((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		const store = tx.objectStore(STORE);
		let n = 0;
		const cur = store.openCursor();
		cur.onsuccess = () => {
			const c = cur.result;
			if (!c) return;
			const v = c.value as ArrayBuffer | undefined;
			if (!v || v.byteLength === 0) {
				c.delete();
				n++;
			}
			c.continue();
		};
		tx.oncomplete = () => resolve(n);
		tx.onerror = () => reject(tx.error);
	});
	db.close();
	return removed;
}

/** Run `purgeEmptyTiles()` at most once per install. The empties can only have been
 *  written by the old Worker, so once swept they cannot come back — the write boundary
 *  in `idbPutMany` refuses them. Guarded by localStorage so it costs one cursor pass
 *  on the first boot after this ships, then nothing.
 *
 *  ⚠️ WHY THIS STAYS ONE-TIME AND MUST NEVER BECOME A RECURRING SWEEP.
 *  Deleting a tile makes its area look UN-FETCHED, and an offline map cannot
 *  re-fetch what it deleted — with no signal the data is simply gone. A repeating
 *  purge would also feed a download loop: purge → area reads as absent → re-download
 *  → the empties come back → purge again, every pass, forever. (That loop is exactly
 *  what burned the session pack budget in Aug 2026.) The durable "we checked here and
 *  there is genuinely nothing" receipt is the COVERAGE RECORD (`hasLines:true` with
 *  `lineCount:0`), not the presence of a file on disk — a record costs bytes, holds
 *  its meaning offline, and cannot crash Mapbox's worker the way a 0-byte tile does.
 *  Empty tiles themselves are near-free (~80% of a typical pile is roadless, and the
 *  whole wall-map store is tens of MB against a 1 GB budget), so nothing is being
 *  reclaimed here that is worth a re-download. */
const PURGE_FLAG = "rtV4EmptyTilesPurged";
export async function purgeEmptyTilesOnce(): Promise<void> {
	try {
		if (typeof localStorage === "undefined") return;
		if (localStorage.getItem(PURGE_FLAG)) return;
		const removed = await purgeEmptyTiles();
		localStorage.setItem(PURGE_FLAG, "1");
		if (removed > 0) {
			// Loud on purpose, ONCE per install: this reports real corruption that was
			// silently breaking the map, and the number is the evidence it's gone.
			console.warn(
				`[v4] purged ${removed} zero-byte tiles left by the pre-guard pack Worker`,
			);
		}
	} catch (err) {
		// codestyle-allow-swallow: a best-effort one-time sweep. If storage is blocked
		// the read-side skip still keeps the empties away from Mapbox — this only
		// reclaims space and un-sticks stale coverage.
		console.warn(
			"[v4] empty-tile purge failed (read-side skip still applies)",
			err,
		);
	}
}

// ── download: ONE pack request → IndexedDB (the DOWNLOADER's network, not the map) ──

export interface DownloadResult {
	downloaded: number;
	empty: number; // tiles the planet has nothing for (ocean/void) — fine
	total: number;
	bytes: number;
	/** Worker build id (X-Pack-Build) — says WHICH deployed code answered, so a
	 *  deploy is visible in the console instead of guessed at. */
	build?: string;
	/** HIT | MISS (X-Pack-Cache). A MISS is a real cold build; a HIT is replayed
	 *  edge bytes and says nothing about build speed. */
	cache?: string;
	/** The Worker's own timings (X-Diag): reads, loopMs, outerKm. `loopMs` is the
	 *  server's tile-read loop — the number that separates "slow build" from
	 *  "slow network". */
	diag?: string;
}

/** The Worker's pack wire format (see workers/offline-tiles/src/index.ts):
 *  [uint32 LE manifestLen][manifest JSON][tile bytes, concatenated in manifest order].
 *  manifest = { total, empty, tiles: [{ k:"z/x/y", n: byteLen }, ...] }. Tiles span
 *  BOTH rings (mixed z15 + z13); the zoom lives in each key, not a top-level field. */
interface PackManifest {
	total: number;
	empty: number;
	tiles: Array<{ k: string; n: number }>;
	/**
	 * THE BOX THE BLOB'S GEOMETRY WAS DRAWN INTO — [w, s, e, n] degrees.
	 *
	 * ⛔ THE RENDERER MUST USE THIS BOX, NOT THE TILE'S. MVT coordinates are
	 * relative to a box; assume the wrong one and the data draws somewhere else
	 * entirely.
	 *
	 * MEASURED at Timbuktu: the blob held 30 km of roads around the pin, but the
	 * client assumed the z8 TILE's 150 km box — so the roads drew 89 km from the
	 * pin (and only 19 km from the tile centre, which is what named the bug).
	 * Absent on packs built before this shipped; those fall back to tile bounds
	 * and are simply re-downloaded on the version bump.
	 */
	box?: { w: number; s: number; e: number; n: number };
}

/**
 * Download the area's two rings (3 km z15 + 25 km z13) around (lng,lat) into IndexedDB in ONE
 * request to the `offline-tiles` Worker's `/pack` endpoint. The ONE network
 * operation, on user volition. The Worker returns the whole disc packed into a
 * single blob (decompressed MVT, raw for Mapbox to decode) — we slice it and bulk-
 * store every tile in a single IndexedDB transaction. Fails LOUD (no silent
 * fallback): a non-OK response or short body throws.
 */
export async function downloadV4Area(
	lng: number,
	lat: number,
	onProgress?: (done: number, total: number) => void,
	// LINE corridor: a thin, roads-only ribbon instead of the full satellite-area
	// rings. The Worker honours `&ring=corridor` (its own CORRIDOR_RINGS, lockstep).
	// The corridor URL is a distinct edge-cache key, so it can't collide with the
	// standard pack — no PACK_FORMAT_VERSION bump needed.
	corridor = false,
): Promise<DownloadResult> {
	// ── HARD GUARD ── trip the circuit breaker if an implausible number of pack
	// downloads fire in one session (a reconcile loop) — before the network call.
	guardPackDownload({ lng, lat });
	const ringParam = corridor ? "&ring=corridor" : "";
	// LIE-FI GUARD: on weak signal an un-timed fetch can hang, saturating the pipe
	// and starving the map's own requests. So there IS a timeout — but it must be
	// longer than a COLD PACK BUILD, or it aborts work that was about to succeed.
	//
	// ⛔ 60 s WAS TOO SHORT AND MADE THE WHOLE FEATURE LOOK BROKEN. The Worker
	// builds an uncached pack in ~56-66 s (MEASURED: `loopMs=56486` on the live
	// header), so a 60 s deadline was a coin flip against the server's own build
	// time. The user's experience: first attempt times out, the pass backs off
	// 60 s, and the blob finally appears a minute or two later "out of nowhere" —
	// which reads as random breakage, not slowness.
	//
	// 150 s covers a cold build plus a slow transfer with room to spare. A pack
	// that is genuinely stuck still aborts; it just no longer aborts the normal
	// case. Re-tightening this without re-measuring the Worker's cold build time
	// brings the bug straight back.
	// ── ASK BY THE PIN. THE ACTUAL PIN. ───────────────────────────────────────
	//
	// ⛔ THIS USED TO SEND THE CELL CENTRE, AND THAT WAS THE WHOLE BUG.
	//
	// It was an optimisation: two pins in one cell would produce the same URL and
	// therefore share an edge-cache entry. It worked — and it silently moved the
	// data. The Worker builds 30 km around WHATEVER POINT IT IS GIVEN, so sending
	// the cell centre meant it built the blob around the cell centre, not the user.
	//
	// MEASURED at the user's Timbuktu pin: his pin sat 12 km from the cell's east
	// edge, so the cell centre was 63 km WEST of him — and the roads drew ~70 km
	// west. The blob was perfectly correct, around the wrong place.
	//
	// ⚠️ THE LESSON: a cache key may be derived from the request, but it must never
	// REPLACE the request. Every layer downstream was verified correct while the
	// input was quietly wrong, which is why this took so long to find.
	//
	// The cost of sending the real pin is that two nearby pins no longer share a
	// cache entry, so the second one pays for its own build. That is the correct
	// trade: a cache miss costs seconds, a displaced blob makes the feature useless.
	const qLng = lng.toFixed(6);
	const qLat = lat.toFixed(6);
	const res = await fetch(
		`${packUrl()}?lng=${qLng}&lat=${qLat}&pv=${PACK_FORMAT_VERSION}${ringParam}`,
		{ signal: AbortSignal.timeout(150_000) },
	);
	if (!res.ok) {
		throw new Error(
			`[v4] pack fetch failed: ${res.status} ${res.statusText} — ${await res.text().catch(() => "")}`,
		);
	}
	// The Worker gzips the pack at the application layer (NOT transport
	// Content-Encoding — see its comment) so the edge can't double-compress it.
	// Inflate that one explicit layer; the decompressed bytes are the raw pack.
	if (!res.body) throw new Error("[v4] pack response has no body");
	const buf = new Uint8Array(
		await new Response(
			res.body.pipeThrough(new DecompressionStream("gzip")),
		).arrayBuffer(),
	);
	if (buf.byteLength < 4) throw new Error("[v4] pack response too short");

	const manifestLen = new DataView(buf.buffer, buf.byteOffset, 4).getUint32(
		0,
		true,
	);
	const manifest = JSON.parse(
		new TextDecoder().decode(buf.subarray(4, 4 + manifestLen)),
	) as PackManifest;

	// Slice each tile's bytes out of the trailing blob. `.slice()` copies, so each
	// value is a standalone ArrayBuffer (a subarray view would alias the whole pack
	// and bloat IndexedDB). Order matches the manifest, which matches the disc.
	const items: Array<[string, ArrayBuffer]> = [];
	let off = 4 + manifestLen;
	let bytes = 0;
	for (const t of manifest.tiles) {
		items.push([t.k, buf.slice(off, off + t.n).buffer]);
		off += t.n;
		bytes += t.n;
	}

	onProgress?.(0, items.length);
	await idbPutMany(items, (done) => onProgress?.(done, items.length));

	return {
		downloaded: items.length,
		empty: manifest.empty,
		total: manifest.total,
		bytes,
		// SERVER-SIDE TRUTH, surfaced to the console. The Worker stamps its own
		// tile-read loop time and read count on every response; without these the
		// only visible fact was "it feels slow", and slow-network vs slow-build
		// are indistinguishable from the app side. `loopMs` is what proved the
		// bottleneck was READ COUNT, not bytes: dropping water cut the pack 13x
		// and moved loopMs by 1%.
		build: res.headers.get("x-pack-build") ?? "",
		cache: res.headers.get("x-pack-cache") ?? "",
		diag: res.headers.get("x-diag") ?? "",
	};
}

/**
 * DOWNLOAD AN AREA — ONE request, the whole 20 km.
 *
 * ⛔ ONE REQUEST PER PIN. NOT ONE PER CELL. The Worker assembles every cell the
 * pin needs into a single pack (see packBuilder.ts), so the phone asks once and
 * either has the complete area or does not.
 *
 * THE VERSION THAT FETCHED PER CELL WAS UNUSABLE, and it failed three ways at
 * once, all observed live:
 *
 *   • ARRIVAL BECAME UNPREDICTABLE. Nine independent requests land at nine
 *     different times, so the map drew a disconnected fragment and maybe another
 *     one later. The user: "some random piece of shit comes after... totally,
 *     totally unusable."
 *   • IT LATCHED THE CIRCUIT BREAKER. `guardPackDownload` counts DOWNLOADS and
 *     was sized when one pin was one download; at 9x it tripped after ~7 pins
 *     and then refused everything for the session — a new pin showed NOTHING,
 *     with the cause visible only in the console.
 *   • IT WAS SLOWER. Nine round trips against one request that reads the same
 *     archive once (reads are deduped server-side, where the cells overlap).
 *
 * The all-or-nothing shape is the point: a product, not a lottery.
 */

// ── decode: stored MVT tiles → roads + water, for the ROAD RASTERS only ────
//
// ⚠️ THE WALL MAP DOES NOT DECODE. Downloaded tiles are handed to MapLibre
// exactly as they arrived (rawWallProtocol.ts, one source per ring). What used
// to live here — a shared decode Worker, a job table, a superseded-job
// sentinel, a main-thread fallback, an idle-teardown timer and a worker
// max-life clock, ~230 lines — existed to schedule and bound a decode that no
// longer happens. Deleted 2026-08-12 with v4Decode / wallFinish / wallTiles /
// v4DecodeWorker: measured 705 MB in the worker, climbing 62 MB/s while
// zooming, 100% of it the tiles → GeoJSON → tiles round trip.
//
// NOTHING DECODES AT ALL NOW. The road raster — the last consumer of a decode
// on this path — is deleted (2026-08-17); its `buildV4Bands` entry point and
// the `rasterDecode.ts` module went with it. A tile is downloaded, stored, and
// handed to the renderer. That is the whole pipeline.

// ── per-layer stats: what's actually IN the downloaded wall-map tiles ──────
// The Protomaps base map is RICH — roads, water, buildings, landuse, places,
// pois, boundaries, transit… — all baked into the same MVT tiles. v3 split a
// per-area blob into water vs roads; the v4 equivalent is decoding every stored
// tile and tallying per SOURCE-LAYER, so the /blobs inspector shows where the
// wall-map weight goes. The on-disk MVT is one gzip blob with no per-layer byte
// split, so `bytes` is the serialized-GeoJSON size — a comparable proxy, the
// same metric v3 used for its water/road split.
export interface V4LayerStat {
	layer: string;
	features: number;
	bytes: number;
}

/** The tile keys ("z/x/y") for the area around (lng,lat) — the same jagged disc
 *  the downloader uses. Lets /blobs sum a SINGLE feature's layer breakdown from
 *  the per-tile index below (a feature's wall map = the tiles in its disc). */
export function areaTileKeys(lng: number, lat: number): string[] {
	// ⛔ A HANDFUL OF KEYS NOW, NOT A JAGGED DISC OF HUNDREDS.
	//
	// One cell is ONE blob under ONE key. A pin at a cell's centre needs exactly
	// one; a pin near a corner needs up to four (grid.ts `cellsFor`), which is
	// what keeps the 20 km guarantee true everywhere.
	//
	// This is why the probes below collapsed into a single lookup: "are this
	// area's tiles on disk?" used to be a fuzzy vote over a ring set, and is now
	// an exact question with an exact answer.
	// ⛔ KEYED BY THE PIN — see grid.ts `pinTileKey`. A bare cell key is a grid
	// square two pins can share, which served one pin's roads to another
	// (MEASURED: 50.4 km off, the box byte-identical to the previous pin's).
	// The satellite never collided because its key IS the pin; roads now match.
	return cellsFor(lng, lat).map((c) => pinTileKey(lng, lat, c));
}

/** ONE decode pass → a per-tile, per-source-layer index. The /blobs page sums
 *  it two ways from a single decode: globally (all tiles) for the aggregate, and
 *  per-feature (that area's tile keys, via areaTileKeys) for each card's pills. */
/** The real-world box a decoded tile's geometry actually occupies, in degrees.
 *
 * ⛔ WHY THIS IS WORTH THE BYTES. Every offline bug this system has had was the
 * same shape: correct bytes in the WRONG BOX. A cell centre was sent where a pin
 * was meant; a pin-box frame was written into a tile-addressed blob (MapLibre
 * stretched it 1.86x); a radius read one box while the frame clipped another.
 * In EVERY case the inspector looked healthy — bytes arrived, features counted,
 * size plausible — because it only ever reported HOW MUCH, never WHERE.
 *
 * A feature count cannot tell you the roads are drawn 400 m off. Two corners
 * and a distance can, at a glance. That is the whole reason this exists. */
export interface GeoBox {
	w: number;
	s: number;
	e: number;
	n: number;
}

export interface V4TileIndex {
	// "z/x/y" -> { layerName: { features, bytes } }
	byTile: Record<string, Record<string, { features: number; bytes: number }>>;
	/** "z/x/y" -> the box the tile's DECODED geometry really covers. Not the box
	 *  the key implies — that is the point: comparing the two is the check. */
	boxByTile: Record<string, GeoBox>;
	tiles: number;
}

/** Distance in metres between two lng/lat points (haversine). */
export function metresBetween(
	aLng: number,
	aLat: number,
	bLng: number,
	bLat: number,
): number {
	const R = 6_371_008.8;
	const toRad = (d: number): number => (d * Math.PI) / 180;
	const dLat = toRad(bLat - aLat);
	const dLng = toRad(bLng - aLng);
	const la1 = toRad(aLat);
	const la2 = toRad(bLat);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

/** The tile-grid box a "z/x/y" key ADDRESSES — the promise, to compare against
 *  the geometry's real box (the delivery). A gap between them IS the bug. */
export function boxOfTileKey(key: string): GeoBox | null {
	const [z, x, y] = key.split("/").map(Number);
	if (!Number.isFinite(z) || !Number.isFinite(x) || !Number.isFinite(y))
		return null;
	const n = 2 ** z;
	const lng = (i: number): number => (i / n) * 360 - 180;
	const lat = (j: number): number => {
		const t = Math.PI - 2 * Math.PI * (j / n);
		return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(t) - Math.exp(-t)));
	};
	return { w: lng(x), e: lng(x + 1), n: lat(y), s: lat(y + 1) };
}

/**
 * The `z/x/y` numbers inside a stored tile key, whatever its shape.
 *
 * Accepts BOTH spellings so a device mid-migration is never half-blind:
 *   • `pin/<lng>,<lat>/<z>/<x>/<y>` — current (grid.ts `pinTileKey`)
 *   • `<z>/<x>/<y>`                 — legacy, pre-2026-08-20
 *
 * Returns null for anything else rather than emitting NaN — a NaN address
 * silently produces garbage coordinates instead of failing, which is how the
 * boxless-roads-row bug hid.
 */
export function parseTileAddress(
	key: string,
): { z: number; x: number; y: number } | null {
	const parts = key.split("/");
	const tail = parts.length === 5 && parts[0] === "pin" ? parts.slice(2) : parts;
	if (tail.length !== 3) return null;
	const [z, x, y] = tail.map(Number);
	if (!Number.isFinite(z) || !Number.isFinite(x) || !Number.isFinite(y))
		return null;
	return { z, x, y };
}

export async function decodeV4TileLayerStats(): Promise<V4TileIndex> {
	const byTile: V4TileIndex["byTile"] = {};
	const boxByTile: V4TileIndex["boxByTile"] = {};
	let tiles = 0;
	for (const [key, bytes] of await idbEntries()) {
		// ⛔ KEYS ARE PIN-ADDRESSED — `pin/<lng>,<lat>/<z>/<x>/<y>`. Splitting on
		// "/" and taking the first three segments yields ["pin", "<lng>,<lat>",
		// "<z>"] → z/x/y all NaN, and `toGeoJSON(NaN, NaN, NaN)` returns garbage
		// coordinates, so no finite box survives.
		//
		// MEASURED on the user's Greybull pin: the roads row reported 740 KB with
		// NO nw/se/reach/offsetFromPin at all, while the satellite row beside it
		// had all four. The roads were on disk the whole time; only the inspector
		// could not say WHERE. Reading a box is exactly how every offline bug in
		// this system has been caught, so a boxless row blinds the one tool that
		// works.
		const addr = parseTileAddress(key);
		if (!addr) continue;
		const { z, x, y } = addr;
		let vt: VectorTile;
		try {
			// pbf@4 no longer exports the `PbfReader` type vector-tile's d.ts
			// imports, so the (runtime-correct) Pbf instance fails to typecheck.
			// Boundary cast; drop when @mapbox/vector-tile ships pbf@4 types.
			vt = new VectorTile(
				new Pbf(new Uint8Array(bytes)) as unknown as ConstructorParameters<
					typeof VectorTile
				>[0],
			);
		} catch {
			continue;
		}
		tiles++;
		const perLayer: Record<string, { features: number; bytes: number }> = {};
		// The decoded box, accumulated across every layer of this tile. `toGeoJSON`
		// already returns real lng/lat, so this costs a min/max per coordinate on
		// a walk we were doing anyway — no second decode.
		let w = Infinity;
		let s2 = Infinity;
		let e = -Infinity;
		let n2 = -Infinity;
		/** Walk a GeoJSON coordinate tree of any depth and widen the box. */
		const eat = (c: unknown): void => {
			if (!Array.isArray(c)) return;
			if (typeof c[0] === "number" && typeof c[1] === "number") {
				const [lo, la] = c as [number, number];
				if (!Number.isFinite(lo) || !Number.isFinite(la)) return;
				if (lo < w) w = lo;
				if (lo > e) e = lo;
				if (la < s2) s2 = la;
				if (la > n2) n2 = la;
				return;
			}
			for (const part of c) eat(part);
		};
		for (const name of Object.keys(vt.layers)) {
			const layer = vt.layers[name];
			const feats: GeoJSON.Feature[] = [];
			for (let i = 0; i < layer.length; i++) {
				const f = layer.feature(i).toGeoJSON(x, y, z) as GeoJSON.Feature;
				feats.push(f);
				const g = f.geometry as { coordinates?: unknown } | null;
				if (g && "coordinates" in g) eat(g.coordinates);
			}
			perLayer[name] = {
				features: feats.length,
				bytes: JSON.stringify(feats).length,
			};
		}
		byTile[key] = perLayer;
		// Only record a box if geometry was actually seen — an empty tile has no
		// box, and Infinity sentinels must never leak out as coordinates.
		if (Number.isFinite(w) && Number.isFinite(s2))
			boxByTile[key] = { w, s: s2, e, n: n2 };
	}
	return { byTile, boxByTile, tiles };
}

// ── constraint validation: do this area's tiles ACTUALLY exist on disk? ────
// The reconcile is an invariant checker, not an event handler: it must VERIFY a
// feature's wall-map tiles are really present, never trust a registry flag. A
// DB_NAME bump or a browser storage-eviction deletes the tiles while the flag
// lingers — this probe catches that so the area gets re-downloaded. It checks
// the area's REAL disc keys (any present → valid), never a fixed centre patch:
// an edge-sparse area (data only far from the pin — remote bush, a shoreline at
// the disc rim) stores NO centre tiles, so a centre-only probe re-downloads it
// on EVERY reconcile pass forever — a silent cellular-data burn, the exact
// runaway this codepath exists to prevent. Validly-empty areas (lineCount 0)
// are skipped by the caller. Tiles live in one global pile that is never
// deleted per-area, so "any disc key present" ⇔ "this area's download survived".
export async function areaTilesPresent(
	lng: number,
	lat: number,
): Promise<boolean> {
	// EXACT, not a vote. Every cell this area needs must be on disk.
	//
	// ⚠️ THE OLD PROBE WAS A FUZZY "ANY TILE OF THE DISC" TEST, AND IT COST A
	// WHOLE EVENING (2026-08-17). It checked ONE zoom while the version stamp
	// promised a whole RING SET, so 232 areas stamped themselves current while
	// holding none of the new ring — destroying the staleness signal, after which
	// no cloud-side change could ever reach the device again.
	//
	// That entire class of bug came from the PROBE and the PROMISE being
	// different questions. A cell is ONE key: either its blob is on disk or it is
	// not, so there is only one question left to ask.
	const keys = areaTileKeys(lng, lat);
	if (!keys.length) return false;
	const db = await openDb();
	const present = await new Promise<boolean>((resolve) => {
		const tx = db.transaction(STORE, "readonly");
		const store = tx.objectStore(STORE);
		let pending = keys.length;
		let hits = 0;
		const tick = () => {
			if (--pending === 0) resolve(hits === keys.length);
		};
		for (const k of keys) {
			const req = store.getKey(k);
			req.onsuccess = () => {
				if (req.result !== undefined) hits++;
				tick();
			};
			req.onerror = () => tick();
		}
	});
	db.close();
	return present;
}

/** Every stored tile key, in ONE `getAllKeys()`. Use this to batch many area probes
 *  in a single pass — one DB open instead of one per area. The bake service (every
 *  20 s, over every area) and the /blobs audit both probe hundreds of areas at once;
 *  calling `areaTilesPresent` per area opens the DB + fires ~100 getKeys per area,
 *  which is a real I/O storm. Load the key set once, then use `areaTilesPresentIn`. */
export async function getAllTileKeys(): Promise<Set<string>> {
	const db = await openDb();
	const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
		const tx = db.transaction(STORE, "readonly");
		const req = tx.objectStore(STORE).getAllKeys();
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
	db.close();
	return new Set(keys.map(String));
}

/** Pure, zero-I/O equivalent of `areaTilesPresent`: are ALL of this area's cell
 *  blobs in an already-loaded key set (from `getAllTileKeys`)? Same exact rule —
 *  the bake service probes hundreds of areas per pass, so it loads the key set
 *  once and asks this instead of opening the DB per area. */
export function areaTilesPresentIn(
	stored: Set<string>,
	lng: number,
	lat: number,
): boolean {
	const keys = areaTileKeys(lng, lat);
	return keys.length > 0 && keys.every((k) => stored.has(k));
}

/**
 * ADOPTION probe — for an anchor with NO coverage record, or a stale-version one.
 *
 * ⛔ THIS IS NOW THE SAME QUESTION AS `areaTilesPresent`, AND THAT IS THE POINT.
 *
 * The two used to differ: a LOOSE survival probe ("any disc key present") and a
 * STRICT adoption probe ("the centre tile at EVERY ring"). Two probes existed
 * because a disc's tiles were SHARED between overlapping areas, so "is this area
 * present" was a judgement call — and the two judgements disagreeing is exactly
 * what produced the stamp-without-the-tiles bug that cost an evening
 * (2026-08-17): 232 areas stamped current while holding none of the new ring, so
 * no cloud-side change could reach the device again.
 *
 * The rule that bug taught: **the version stamp promises a shape, so the probe
 * that authorises the stamp must check that shape.** A cell blob is not shared
 * and not partial — either it is on disk or it is not — so the promise and the
 * probe are the same question and cannot drift apart.
 *
 * Kept as a named function so both call sites still read clearly.
 */
export async function areaCentreCovered(
	lng: number,
	lat: number,
): Promise<boolean> {
	return areaTilesPresent(lng, lat);
}

// ── air-gap guard (LAW 0) ─────────────────────────────────────────────────
// The map renders from the in-memory GeoJSON only — it makes no tile requests.
// This guard still passes initializeMap to HARD-block any stray non-local URL
// (a glyph/sprite/style fetch), so the map physically cannot stream.
// `rtwall://` is the wall map's own in-memory tile scheme (wallProtocol.ts).
// It MUST be here, and this is not a formality:
//
// Mapbox's `addTileProvider` was called INSTEAD of fetching, so a wall tile
// never reached this guard. MapLibre's `addProtocol` is different — the guard
// runs FIRST, then MapLibre dispatches to the protocol handler. Without this
// prefix an `rtwall://` url falls through to the block branch, and because
// resourceType is "Tile" it is in IMAGE_RESOURCES, so it would be answered
// with BLANK_PNG — PNG bytes handed to a protobuf parser, which is the exact
// "Unimplemented type: 4" corruption the comment above IMAGE_RESOURCES warns
// about. Silent, per-tile, forever.
//
// LAW 0 is intact: the scheme resolves to a main-thread `Map`, so it cannot
// reach the network by construction. There is nothing to stream to.
// `rtraw://` is the RAW-tile scheme (rawWallProtocol.ts) — downloaded tiles
// served straight to MapLibre with no decode. Like `rtwall://` it is answered
// entirely on-device by a protocol handler and nothing is ever fetched for it,
// so it must pass through untouched. Omitting it here does not merely block:
// a "Tile" resource falls to BLANK_PNG below and the protobuf parser is handed
// a PNG on every render pass.
const LOCAL_PREFIXES = [
	"blob:",
	"data:",
	"capacitor://",
	"file://",
	"rtwall://",
	"rtraw://",
];
/** Same-origin test. Must accept EVERY form the browser may hand us for a
 *  local asset, because a false negative doesn't just block — it substitutes
 *  the wrong resource type (see BLANK_PNG below). `location.origin` alone
 *  misses `127.0.0.1` vs `localhost`, an https/proxy origin, and the
 *  Capacitor scheme, all of which are genuinely on-device. */
const isSameOrigin = (url: string): boolean => {
	if (typeof location === "undefined") return false;
	if (url.startsWith(`${location.origin}/`)) return true;
	try {
		const u = new URL(url, location.href);
		// Host+port match on any scheme (dev https proxy, 127.0.0.1 vs localhost).
		if (u.host === location.host) return true;
		// Capacitor/Ionic serve the bundle from their own scheme — still on-device.
		if (u.protocol === "capacitor:" || u.protocol === "ionic:") return true;
		return false;
	} catch {
		// codestyle-allow-swallow: an unparseable URL is not same-origin; the
		// caller blocks it, which is the safe direction.
		return false;
	}
};
const BLANK_PNG =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
/** Glyphs/tiles/geojson are PARSED, not decoded as images. Handing any of them
 *  a PNG is guaranteed corruption — Mapbox's worker throws "Unimplemented
 *  type: 4" trying to read PNG bytes as protobuf, once per range, on EVERY
 *  render pass, forever. Only an image request may be answered with an image. */
const IMAGE_RESOURCES = new Set(["Image", "SpriteImage", "Tile"]);
let blockedLogged = 0;

/**
 * Pass on-device URLs through; BLOCK everything else (LAW 0 — no streaming).
 *
 * `resourceType` is supplied by Mapbox ("Glyphs" | "SpriteJSON" | "Tile" | …).
 * It decides what a BLOCKED request gets back, and that choice is the whole
 * bug this signature exists to prevent: a blocked GLYPH must NOT become a PNG.
 * Blocking with `null` makes Mapbox treat it as a clean miss (labels simply
 * don't draw) instead of feeding the parser garbage.
 */
export function v4TransformRequest(
	url: string,
	resourceType?: string,
): { url: string } {
	if (url.startsWith("/")) {
		// ABSOLUTISE root-relative URLs before handing them back.
		//
		// MEASURED BUG: `/mobileAssets/worldBase/base/tiles/6/10/22.pbf` returned as-is threw
		//   Failed to construct 'Request': Failed to parse URL from
		//   /mobileAssets/worldBase/base/tiles/6/10/22.pbf (blob:http://localhost:5173/a94c…)
		// and the world base never drew — no base map when zoomed out.
		//
		// WHY: a vector-tile fetch is issued from MAPBOX'S WORKER, and that
		// worker is constructed from a Blob, so its `self.location` is a
		// `blob:` URL. A relative URL there resolves against the blob, not the
		// document — and a blob URL has no path to be relative to, so the
		// parse throws outright. On the main thread the same string is fine,
		// which is exactly why this hid: the style loads, the glyphs load, and
		// only the worker-side tile fetches die.
		//
		// Resolving against `location.href` HERE — on the main thread, where
		// transformRequest always runs — makes the string unambiguous by the
		// time any worker sees it. Same-origin either way, so LAW 0 is intact.
		return {
			url:
				typeof location === "undefined"
					? url
					: new URL(url, location.href).href,
		};
	}
	if (LOCAL_PREFIXES.some((p) => url.startsWith(p)) || isSameOrigin(url)) {
		return { url };
	}
	if (blockedLogged < 8) {
		blockedLogged++;
		console.warn(
			`[v4] blocked non-local map request (${resourceType ?? "unknown"}): ${url}`,
		);
	}
	// An image request can safely take a blank image. Anything PARSED (glyphs,
	// style/sprite JSON, vector tiles) must get nothing at all.
	if (resourceType && IMAGE_RESOURCES.has(resourceType)) {
		return { url: BLANK_PNG };
	}
	return { url: "" };
}
