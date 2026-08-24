// Sandbox storage isolation for the BIG offline databases (satellite photos,
// vector/base tiles, baked line vectors, coverage registry) — the local stores
// that live OUTSIDE the TinyBase "rt-treeStuff" DB.
//
// Goal: while sandbox mode is active, every offline read/write goes to a parallel
// "<name>-sandbox" IndexedDB, so anything you bake/download in the sandbox never
// touches your real offline cache, and your real cache is invisible in sandbox.
// On exit, the offline modules point back at the real DBs.
//
// HOW IT WORKS
//   • `currentDbName(realName)` resolves the DB name AT CALL TIME (not at module
//     load), so it reflects whether sandbox is active right now.
//   • Offline modules cache an open IDBDatabase handle (a module-level
//     dbPromise). When sandbox toggles, those cached handles point at the WRONG
//     DB. So each module registers a reset callback here; enter/exitSandbox call
//     `resetOfflineDbHandles()` to clear them, forcing the next open() to reopen
//     against the now-correct DB name.
//
// Sandbox-active state is a simple module flag set by enter/exitSandbox (it is
// the single source of truth the offline modules read — they must NOT read the
// URL, since baking can run from a worker/service with no `page` context).

export const SANDBOX_SUFFIX = "-sandbox";

let sandboxActive = false;

/** Called by enterSandbox/exitSandbox to flip the offline-storage target. */
export function setSandboxStorageActive(active: boolean): void {
	sandboxActive = active;
	// Mirror onto a window global so the harness's mobMapStorage (which must NOT import
	// proprietary $lib/mobile code — open-core rule) can read sandbox state and
	// redirect its OPFS/Filesystem "maps" directory to "maps-sandbox".
	if (typeof window !== "undefined") {
		(window as { __rt_sandbox_active?: boolean }).__rt_sandbox_active = active;
	}
}

export function isSandboxStorageActive(): boolean {
	return sandboxActive;
}

/** Resolve the live DB name for a base name — `<name>-sandbox` in sandbox. */
export function currentDbName(realName: string): string {
	return sandboxActive ? realName + SANDBOX_SUFFIX : realName;
}

// ── Cached-handle reset registry ────────────────────────────────────────────
// Offline modules cache an open IDBDatabase. They register a reset fn so the
// stale handle is dropped when sandbox toggles.
const resetFns = new Set<() => void>();

/** Offline module registers a fn that clears its cached open-DB handle. */
export function registerOfflineDbReset(fn: () => void): void {
	resetFns.add(fn);
}

/**
 * Things to run when a WIPE is about to delete the databases.
 *
 * ⛔ SEPARATE FROM `resetOfflineDbHandles`, DELIBERATELY. That one is also used
 * by sandbox toggling, where reopening is REQUIRED — the whole point is to
 * reopen against the other database name. A wipe needs the opposite: reads must
 * refuse to reopen, or a tile request landing microseconds later re-establishes
 * the very connection that blocks `deleteDatabase`.
 *
 * MEASURED: with only the shared reset, `gc-offlineTiles` came back `blocked`
 * every time while satellite and registry deleted cleanly — because the map is
 * the only thing reading tiles continuously.
 */
interface WipeLatch {
	/** Stop this module's reads reopening the DB. */
	latch: () => void;
	/** Allow reads again — ONLY when the wipe did not happen. */
	unlatch: () => void;
}

const wipeLatchFns = new Set<WipeLatch>();

/** A module registers the pair that stops, and restores, its reads during a wipe. */
export function registerWipeLatch(l: WipeLatch): void {
	wipeLatchFns.add(l);
}

/** Latch every registered reader OFF before deleting. Reads become misses. */
export function latchOfflineReadsForWipe(): void {
	for (const l of wipeLatchFns) {
		try {
			l.latch();
		} catch {
			/* best-effort: a failed latch just means that delete may block */
		}
	}
}

/**
 * Un-latch — the ONLY escape from a permanent silent blackout.
 *
 * ⛔ WHY THIS IS NOT OPTIONAL. A latched read returns `null`, which renders as
 * nothing and throws nothing. The happy path never needs this (a clean wipe
 * reloads the page, and module state dies with it) — but the FAILED path does:
 * `wipeOfflineDataAndReload` deliberately does NOT reload when a delete is
 * blocked, so without this the tab is left with every tile read returning a
 * miss FOREVER. From the user's chair that is "the roads disappeared and never
 * came back", with the cause invisible.
 *
 * Never call this as part of a successful wipe — the databases are gone and
 * reads should stay off until the reload.
 */
export function unlatchOfflineReadsAfterFailedWipe(): void {
	for (const l of wipeLatchFns) {
		try {
			l.unlatch();
		} catch {
			/* best-effort */
		}
	}
}

/** Drop every cached offline-DB handle so the next open() reopens correctly. */
export function resetOfflineDbHandles(): void {
	for (const fn of resetFns) {
		try {
			fn();
		} catch {
			/* best-effort: a failed reset just means that module reopens lazily */
		}
	}
}

/** Delete every "<name>-sandbox" offline DB — wipes the sandbox's offline cache
 *  without touching the real ones. Call to reset the sandbox world's maps. */
export async function deleteSandboxOfflineDbs(): Promise<void> {
	if (typeof indexedDB === "undefined") return;
	const bases = ["rt-tiles-v3", "rt-satellite", "rt-vectors", "rt-mapRegistry"];
	await Promise.all(
		bases.map(
			(b) =>
				new Promise<void>((resolve) => {
					const req = indexedDB.deleteDatabase(b + SANDBOX_SUFFIX);
					req.onsuccess = () => resolve();
					req.onerror = () => resolve();
					req.onblocked = () => resolve();
				}),
		),
	);
}
