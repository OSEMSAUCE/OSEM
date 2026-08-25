/**
 * dbCatalog.ts — the single source of truth for classifying THIS ORIGIN's
 * IndexedDB databases. Anything that enumerates indexedDB.databases() (the
 * offline /blobs inspector, wipe tools) consumes these helpers instead of
 * keeping its own name list — a private copy is exactly how the inspector went
 * sandbox-blind and offered to wipe live data. Register a NEW store here (add
 * its base name to isLiveBase, or a new app DB alongside APP_DB) or it
 * classifies as legacy / dead and becomes a wipe candidate.
 *
 * Sandbox Mode stores every big DB under a parallel `<name>-sandbox` twin
 * (sandboxDbNames.ts). All classification here is BASE-name aware: the twin
 * belonging to the OTHER world (sandbox twins in real mode; the real DBs while
 * sandboxed) is PROTECTED data, never legacy.
 */

import {
	currentDbName,
	SANDBOX_SUFFIX,
} from "../../shared/sandboxDbNames";

/** TinyBase store (live user data, not offline-map). */
export const APP_DB = "rt-treeStuff";

// ── DEAD OFFLINE-MAP PILES (offline v4, deleted in the v5 rebuild) ──────────
// These two names USED to be imported from the v4 modules that owned them.
// Those modules are gone, but the DATABASES still exist on every device that
// ever ran a v4 build, so the names must outlive the code: /blobs enumerates
// indexedDB.databases() and anything it cannot NAME it cannot OFFER TO WIPE.
// Delete the name and the pile becomes an unreachable orphan taking up a
// user's storage forever. They live here as literals because this file is,
// by its own docstring, the single source of truth for DB classification.
/** v4 Cloudflare tile pile. Dead — v5 does not write it. */
export const V4_TILES_DB = "gc-offlineTiles";
/** v3/v4 baked vector line art. Dead — v5 does not write it. */
export const LEGACY_VECTORS_DB_NAME = "rt-vectors";
/** Shared satellite photo blobs.
 *
 * ⛔ RENAMED. This said `rt-satellite` long after satelliteImage.ts moved to
 * `gc-offlineSatellite`, and EVERY satellite comparison in the inspector is
 * `row.db === currentDbName(SAT_DB)` — so none of them ever matched. The report
 * showed 0 satellite bytes and "0 areas" over a full store.
 *
 * Worse: `isLiveBase()` below did not recognise the real name, so `isLegacyDb()`
 * classified the user's LIVE satellite photos as legacy — i.e. offered them up
 * in the wipe panel. A stale name in this file is a data-loss hazard, which is
 * exactly why the docstring says this is the single source of truth. */
export const SAT_DB = "gc-offlineSatellite";
/** The pre-rename name. Recognised so a device that still holds the old DB is
 *  classified as LIVE (migration source), never as a wipe candidate. */
export const SAT_DB_LEGACY_NAME = "rt-satellite";
/** Shared offline-coverage registry. */
export const REGISTRY_DB = "rt-mapRegistry";
/** Wildfire hotspots, per area (v4FireCache). Small — a few KB per area — but
 *  it MUST be registered here or /blobs classifies it dead and offers to
 *  wipe the layer's only offline copy. */
export const FIRE_DB = "rt-fire-cache";

/** Strip a sandbox suffix down to the store's base name. */
export function baseDbName(db: string): string {
	return db.endsWith(SANDBOX_SUFFIX)
		? db.slice(0, -SANDBOX_SUFFIX.length)
		: db;
}

/** The OTHER world's name for a base store (`x` ⇄ `x-sandbox`). */
export function otherWorldDbName(base: string): string {
	return currentDbName(base) === base ? base + SANDBOX_SUFFIX : base;
}

/**
 * True for a V4 wall-map vector-tile pile in EITHER world — matched by base
 * name + the old `retreever-v4-tiles` prefix so older version suffixes (and
 * their sandbox twins) are still recognised as tile piles. Callers skip these
 * in per-blob scans: tens of thousands of tiny blobs hang a page.
 */
export function isV4Tiles(db: string): boolean {
	const b = baseDbName(db);
	return b === V4_TILES_DB || b.startsWith("retreever-v4-tiles");
}

/** Base names of the live offline stores (this world OR the sandbox world). */
export function isLiveBase(b: string): boolean {
	return (
		// ONLY the current tile pile (DB_NAME, e.g. rt-tiles-v3) is live. An OLD
		// version suffix is DEAD weight from a previous map version — it must
		// count as LEGACY so you can see + wipe it, not be hidden as "live".
		b === V4_TILES_DB ||
		b === SAT_DB ||
		b === SAT_DB_LEGACY_NAME ||
		b === REGISTRY_DB ||
		b === FIRE_DB ||
		// v3 is STILL the shipping offline map, so its LIVE vectors DB is NOT dead
		// weight — PROTECT it from the legacy-wipe. Only OLD v3-vectors versions
		// (v2–v8, auto-swept) and orphans (e.g. a stray v11) are wipeable. When v3
		// is unplugged, drop this line and rt-vectors becomes a wipe candidate.
		b === LEGACY_VECTORS_DB_NAME
	);
}

/**
 * Live offline DBs OF THE CURRENT WORLD — the exact names this page-load's
 * mode (real vs sandbox) reads and writes, resolved via currentDbName().
 */
export function isLiveV4(db: string): boolean {
	const b = baseDbName(db);
	return isLiveBase(b) && db === currentDbName(b);
}

/**
 * The OTHER world's protected data: a live-base or app-DB name whose suffix
 * doesn't match the current mode (sandbox twins while in real mode; the real
 * DBs while sandboxed). Never legacy, never wipeable.
 */
export function isOtherWorld(db: string): boolean {
	const b = baseDbName(db);
	return (isLiveBase(b) || b === APP_DB) && db !== currentDbName(b);
}

/** Dead weight: neither a live store nor an app DB, in EITHER world. */
export function isLegacyDb(db: string): boolean {
	return !isLiveV4(db) && !isOtherWorld(db) && baseDbName(db) !== APP_DB;
}
