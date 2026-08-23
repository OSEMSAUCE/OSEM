/**
 * legacyVectorCleanup.ts — access + cleanup for the legacy v3 baked-line store
 * (`retreever-v3-vectors`, IndexedDB). Nothing writes new lines here anymore:
 * the wall map's roads/water come from the v4 tile pile (`v4CloudflareTiles.ts`,
 * one guarded /pack request per area) — the old per-area Overpass bake is gone,
 * deliberately: it was the one offline-map network path with NO downloadGuard
 * on it. This module only lets the v4 reconcile read stored line sizes
 * (coverage backfill) and delete areas (orphan sweep / prune).
 *
 * ⚰️ THIS IS A TOMBSTONE WITH A JOB — do not "clean it up" as dead code.
 * The writer is gone; the EVICTOR is not. Devices upgraded from an older build
 * still hold baked lines in `rt-vectors`, and `getVectorKeys()` /
 * `deleteVectorAt()` are the only way the conveyor reclaims that space. Delete
 * this module and those bytes become unreachable orphans that still count
 * against the 1 GB budget — a slow leak on exactly the longest-lived installs,
 * and invisible on a fresh install. Retire it only once no shipped device can
 * still be holding `rt-vectors` data (tracked in docs/TODO.md).
 */

import { migrateIdbDatabase } from "$osem/components/map/getCache_OfflineMap/lib/onPhone/store/idbRename";
import { makeKeyedIdbStore } from "$osem/components/map/getCache_OfflineMap/lib/onPhone/store/keyedIdbStore";

// Renamed from "retreever-v3-vectors-v9" → "rt-vectors" (clean rt- prefix; rt =
// ReTreever). The roads/water/coast line art is carried forward ONCE by
// migrateIdbDatabase below. The old v9 name is NOT added to STALE_DBS — it's
// left in place as the migration's fallback source (a later release can sweep it).
const DB_NAME = "rt-vectors";
/** The LIVE vectors DB name — exported so the v4 /blobs inspector can PROTECT
 *  it from the legacy-wipe (existing baked lines are still pruned through here). */
export const LEGACY_VECTORS_DB_NAME = DB_NAME;
const STALE_DBS = [
	"retreever-v3-vectors",
	"retreever-v3-vectors-v2",
	"retreever-v3-vectors-v3",
	"retreever-v3-vectors-v4",
	"retreever-v3-vectors-v5",
	"retreever-v3-vectors-v6",
	"retreever-v3-vectors-v7",
	"retreever-v3-vectors-v8",
	// The Mapbox-era wall-tile store. Its ONLY reason to exist was that Mapbox
	// ran the vector tile provider in a Web Worker, which cannot read
	// main-thread memory — so cut tiles had to go through IndexedDB, keyed by a
	// generation epoch. MapLibre's `addProtocol` handler runs on the main
	// thread and reads the tile pile straight out of a `Map` (wallProtocol.ts),
	// so nothing opens this database again. Devices that ran a Mapbox build
	// still hold a full generation of MVT bytes here — unreachable orphans that
	// would keep counting against the 1 GB budget forever. Sweep them.
	"rt-wall-tiles",
];
const STORE = "lines";
if (typeof indexedDB !== "undefined") {
	for (const old of STALE_DBS) indexedDB.deleteDatabase(old);
	void migrateIdbDatabase("retreever-v3-vectors-v9", DB_NAME, STORE);
}

const idb = makeKeyedIdbStore<GeoJSON.Feature[]>({
	dbName: DB_NAME,
	storeName: STORE,
});

/** Delete one area's baked lines (budget eviction / orphan sweep). */
export async function deleteVectorAt(key: string): Promise<void> {
	return idb.delete(key);
}

/** Every stored area's key ("lng,lat") — for the reconcile to find gaps. */
export async function getVectorKeys(): Promise<string[]> {
	return idb.keys();
}

/** The stored lines for ONE area key, or [] if none. */
export async function getVectorFeaturesAt(key: string): Promise<GeoJSON.Feature[]> {
	return (await idb.get(key)) ?? [];
}

// NOTE: the size readout reads aggregate line bytes/counts from the tiny
// coverage registry (`coverageSizes` in coverageRegistry.ts), NOT from the stored
// GeoJSON. Do NOT add a `getAllVectorFeatures()`/`vectorStats()` that loads every
// baked feature into JS on a timer — that pinned the main-thread heap at 1 GB+.
