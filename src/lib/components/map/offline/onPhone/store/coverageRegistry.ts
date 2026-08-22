/**
 * coverageRegistry.ts — the central offline-coverage registry (Phase 1, on-device).
 *
 * ONE record per AREA KEY (the same "lng,lat" rounding the photo + line bakes
 * use), tracking what's downloaded for that area and when it was last needed:
 *
 *     areaKey -> { lng, lat, hasPhoto, hasLines, bytes, lastTouched }
 *
 * This is the brain that turns the offline map from a lazy mousetrap into a real
 * system:
 *   • DEDUP   — overlapping pins resolve to the SAME area key, baked ONCE.
 *   • BUDGET  — total bytes vs a cap; evict the least-recently-touched over budget.
 *   • OFFLINE — the reconcile pre-bakes every referenced area WHILE ONLINE, so
 *               going offline + opening any map already has its tiles (no "I'll
 *               just fetch them now" — that can't happen with no network).
 *
 * Phase 2 syncs this to the cloud (the `offlineCoverage` table in the Get Cache
 * schema). The record shape IS the row shape, on purpose. Tile BYTES stay in
 * their own stores (`satelliteImage` / `legacyVectorCleanup`); this only tracks metadata
 * + drives eviction, so it's tiny and snapshot-friendly.
 */

import { migrateIdbDatabase } from "$osem/components/map/offline/onPhone/store/idbRename";
import { makeKeyedIdbStore } from "$osem/components/map/offline/onPhone/store/keyedIdbStore";

// Renamed from "retreever-v3-registry" → "rt-mapRegistry" (clean rt- prefix;
// rt = ReTreever). migrateIdbDatabase below copies the existing coverage list
// forward ONCE on first boot of the renamed build.
const DB_NAME = "rt-mapRegistry";
const STORE = "coverage";
if (typeof indexedDB !== "undefined") {
	void migrateIdbDatabase("retreever-v3-registry", DB_NAME, STORE);
}

/** Hard storage cap for baked offline areas (satellite + lines). The registry
 *  is a recency conveyor: it holds the most-recently-touched areas whose bytes
 *  fit under this, and LRU-evicts the oldest off the back the moment a fresh
 *  bake pushes the total over it. Tunable; Phase 2 can make it user-set. */
export const OFFLINE_BUDGET_BYTES = 1024 * 1024 * 1024;

/** Per-area byte estimate for the newest-first fill, used only for areas not yet
 *  downloaded (no record to read real bytes from). One area ≈ a satellite photo
 *  (~3.2 MB) plus its small line pack. */
export const EST_AREA_BYTES = 3.5 * 1024 * 1024;

export interface CoverageRecord {
	areaKey: string;
	lng: number;
	lat: number;
	hasPhoto: boolean;
	hasLines: boolean;
	bytes: number;
	/** Split byte/count breakdown so the size readout never has to rehydrate the
	 *  actual photo/line payloads (that full-store deserialization every poll was
	 *  a 1 GB+ heap sink). Optional/0-default for records written before the split. */
	photoBytes?: number;
	lineBytes?: number;
	lineCount?: number;
	/** The blob-geometry signature (BLOB_VERSION) this area was built UNDER —
	 *  detail-ring/satellite radii + zooms + pack + bake version, joined. The
	 *  reconcile compares it against the CURRENT signature: a mismatch (or a
	 *  record written before this field existed, i.e. `undefined`) means the area
	 *  holds a STALE blob (old geometry / old satellite) and must re-download under
	 *  the new shape. Without it, `hasLines:true` looked "done" forever and old
	 *  pins never got the memo when the geometry changed. */
	blobVersion?: string;
	lastTouched: number;
}

// ── TinyBase mirror (cloud sync) ─────────────────────────────────────────────
// The registry is the LIVE read path (eviction reads it every 20 s). But it lives
// in its OWN IndexedDB and never reaches the cloud, so the admin dashboard can't
// verify a user actually baked their offline data. So every registry write is
// MIRRORED into the `offlineCoverageTable` TinyBase table, which the existing
// snapshot pipeline carries to Central. Best-effort + lazy-imported: a mirror
// failure (or running where TinyBase isn't booted, e.g. SSR) must NEVER break a
// bake — the registry remains authoritative on-device.
// DISABLED 2026-06-18 — see dropCoverage/noteCoverage callers. Mirroring every
// registry write into the TinyBase store made the bake service re-serialize the
// ENTIRE `retreever` store into IndexedDB on a 20 s cadence; that write traffic
// contended with persister.load() and wedged the whole app at boot (Stats=0,
// "Save failed", maps blank). Cloud-side offline-coverage verification isn't
// worth bricking local boot. Early-returns keep the table inert + the schema +
// admin-dashboard reference valid; re-enable only with a throttled, off-boot
// write path that can't collide with the load.
const COVERAGE_MIRROR_ENABLED = false;

/**
 * OPTIONAL cloud mirror, injected by the host. Null unless a host registers one,
 * and gated by COVERAGE_MIRROR_ENABLED above regardless — see that comment for
 * why this is off (it wedged boot). Kept as a port rather than a direct
 * $tinyStore import so the engine has no tie to the host's store.
 */
export interface CoverageMirror {
	write(rec: CoverageRecord): Promise<void>;
	remove(areaKey: string): Promise<void>;
}
let coverageMirror: CoverageMirror | null = null;

/** Register the host's cloud mirror. Never required. */
export function setCoverageMirror(m: CoverageMirror | null): void {
	coverageMirror = m;
}
async function mirrorToTinyBase(rec: CoverageRecord): Promise<void> {
	if (!COVERAGE_MIRROR_ENABLED) return;
	try {
		// Through the HOST, not $tinyStore. Mirroring coverage into a cloud table
		// needs a store, an authId and a schema — every one of them the host's.
		// A host that provides no mirror (the OSEM demo) simply doesn't mirror.
		await coverageMirror?.write(rec);
	} catch {
		// codestyle-allow-swallow: the registry is the source of truth; a failed cloud-mirror write must not break baking
	}
}
async function unmirrorFromTinyBase(areaKey: string): Promise<void> {
	if (!COVERAGE_MIRROR_ENABLED) return;
	try {
		await coverageMirror?.remove(areaKey);
	} catch {
		// codestyle-allow-swallow: mirror cleanup is best-effort
	}
}

const idb = makeKeyedIdbStore<CoverageRecord>({
	dbName: DB_NAME,
	storeName: STORE,
});

/**
 * ONE-TIME mirror backfill: copy EVERY existing registry record into the
 * `offlineCoverageTable` TinyBase table. New writes mirror themselves
 * (noteCoverage/dropCoverage), but areas baked BEFORE the mirror existed are only
 * in this IndexedDB — this seeds them so the very first cloud snapshot carries the
 * user's full offline-coverage picture, not just areas touched since. Idempotent
 * (setRow on unchanged data is a no-op) and best-effort. Call once on boot.
 */
export async function backfillCoverageMirror(): Promise<void> {
	if (!COVERAGE_MIRROR_ENABLED) return; // DISABLED — see mirrorToTinyBase note above
	try {
		const recs = await allCoverage();
		for (const r of recs) await mirrorToTinyBase(r);
	} catch {
		// codestyle-allow-swallow: mirror backfill is best-effort; the registry stays authoritative
	}
}

/** Every coverage record (for the reconcile + the size readout). */
export async function allCoverage(): Promise<CoverageRecord[]> {
	return idb.getAll();
}

/**
 * Create/update a record. Merges the patch and sets `lastTouched`, which drives
 * the eviction conveyor (least-recently-touched falls off the back first):
 *   • `touchAt` (a finite epoch-ms) → stamp it VERBATIM. The reconcile passes the
 *     area's newest FEATURE touch time here, so eviction orders by when YOU last
 *     touched the pin — not by when the reconcile last re-baked it. This is the
 *     truth; prefer it.
 *   • else `touch` true → bump to now (legacy "just used it" path).
 *   • else → keep the prior stamp (a no-op re-bake mustn't reset recency).
 */
export async function noteCoverage(
	areaKey: string,
	lng: number,
	lat: number,
	patch: {
		hasPhoto?: boolean;
		hasLines?: boolean;
		bytes?: number;
		photoBytes?: number;
		lineBytes?: number;
		lineCount?: number;
		blobVersion?: string;
	},
	touch = false,
	touchAt?: number,
): Promise<void> {
	const prev = await idb.get(areaKey);
	const lastTouched = Number.isFinite(touchAt)
		? (touchAt as number)
		: touch
			? Date.now()
			: (prev?.lastTouched ?? Date.now());
	const rec: CoverageRecord = {
		areaKey,
		lng,
		lat,
		hasPhoto: patch.hasPhoto ?? prev?.hasPhoto ?? false,
		hasLines: patch.hasLines ?? prev?.hasLines ?? false,
		bytes: patch.bytes ?? prev?.bytes ?? 0,
		photoBytes: patch.photoBytes ?? prev?.photoBytes ?? 0,
		lineBytes: patch.lineBytes ?? prev?.lineBytes ?? 0,
		lineCount: patch.lineCount ?? prev?.lineCount ?? 0,
		blobVersion: patch.blobVersion ?? prev?.blobVersion,
		lastTouched,
	};
	await idb.put(rec.areaKey, rec);
	// Mirror the same record into TinyBase so it rides the next cloud snapshot.
	void mirrorToTinyBase(rec);
}

/** Remove a record (after its tiles are deleted). */
export async function dropCoverage(areaKey: string): Promise<void> {
	await idb.delete(areaKey);
	void unmirrorFromTinyBase(areaKey);
}

/** Total baked bytes across all areas. */
// NOTE: there is exactly ONE eviction implementation, and it is NOT here — it's the
// conveyor in `offlineBakeService.bakeAll()` (newest-touched kept until 1 GB, the rest
// dropped oldest-first), which sees the REAL on-disk blobs (sat + vector keys), not just
// the registry. A legacy registry-only `pickEvictions`/`totalBytes` pair used to live
// here; it was dead (no caller) and reading the registry alone it couldn't see orphan
// blobs — deleted so there's one place to read the rule.
