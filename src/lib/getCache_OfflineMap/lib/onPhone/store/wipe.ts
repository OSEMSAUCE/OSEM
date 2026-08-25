/**
 * THE WIPE — delete every byte of offline map data on this device.
 *
 * ── WHY THIS IS A REAL FILE AND NOT A CONSOLE SNIPPET ─────────────────────
 *
 * `/offline` is a PREVIEW of what the device actually holds. The user's trust
 * rests on that: whatever they see at any level, they have. ONE flash of
 * anything else breaks the promise — from then on they cannot tell what is
 * really downloaded.
 *
 * Old blobs accumulate in IndexedDB across sessions. A real session showed roads
 * around Juticalpa, Honduras while the anchor under test was in Ontario, with
 * the in-app ruler reading 40 km. In that state nothing can be measured: you
 * cannot tell the new blob from the debris, so every number is contaminated and
 * every test costs hours to produce a wrong answer.
 *
 * So wiping is not a debug convenience — it is the precondition for any
 * measurement being meaningful at all. It gets a tested function, not a snippet
 * pasted by hand and mistyped at midnight.
 *
 * ── WHAT IT DELETES ───────────────────────────────────────────────────────
 *
 * EVERYTHING map-related, not "the ones that look stale". The whole point is to
 * know that what appears on screen came from the code you just wrote.
 *
 *   gc-offlineTiles      vector road/water tiles
 *   gc-offlineSatellite  satellite imagery
 *   rt-vectors           legacy vector store (pre-V4)
 *   rt-mapRegistry       coverage / bake bookkeeping
 *
 * ⛔ It does NOT touch `rt-treeStuff` — that is the user's plots, maps and
 * tallies. Tiles are re-downloadable; a plot is not. Never widen this list to
 * include a data store.
 */

import {
	latchOfflineReadsForWipe,
	unlatchOfflineReadsAfterFailedWipe,
	resetOfflineDbHandles,
} from "$harness/mapShared/sandboxDbNames";

/** Databases the wipe destroys. Tiles + bookkeeping only — never user data. */
export const WIPE_DBS = [
	"gc-offlineTiles",
	"gc-offlineSatellite",
	"rt-vectors",
	"rt-mapRegistry",
] as const;

/** ⛔ NEVER add these to WIPE_DBS. The user's own data lives here. */
export const NEVER_WIPE = ["rt-treeStuff"] as const;

export interface WipeResult {
	/** Database name → how it went. */
	readonly deleted: Record<string, "gone" | "blocked" | "absent">;
	/** True when every target is confirmed gone. */
	readonly clean: boolean;
}

/**
 * Delete one IndexedDB database.
 *
 * `blocked` fires when another tab still holds a connection — the delete is
 * queued, not done, so we report it rather than pretending. A wipe that
 * silently half-worked is worse than no wipe: it produces exactly the dirty map
 * this function exists to prevent.
 */
function deleteDb(name: string): Promise<"gone" | "blocked"> {
	return new Promise((resolve) => {
		const req = indexedDB.deleteDatabase(name);
		req.onsuccess = () => resolve("gone");
		req.onerror = () => resolve("blocked");
		// ⚠️ `onblocked` is NOT a failure — it means "an open connection is
		// holding this, the delete is QUEUED". It fires and then, once the last
		// connection closes, `onsuccess` still fires. Resolving "blocked" here
		// would be a lie in the common case. So we wait, and only give up if
		// nothing closes. MEASURED: the app's own cached tile-reader connection
		// blocked all four deletes; the fix is to close connections (see
		// `wipeOfflineDataAndReload`), not to report a false failure.
		req.onblocked = () => {
			setTimeout(() => resolve("blocked"), BLOCKED_GRACE_MS);
		};
	});
}

/** How long to let a queued delete finish before calling it blocked. */
const BLOCKED_GRACE_MS = 3000;

/** How long to let in-flight IndexedDB transactions drain after stopping the
 *  bake service. They are short (a put batch or a key probe); this is slack. */
const IN_FLIGHT_GRACE_MS = 400;

/**
 * Wipe every offline map database on this device.
 *
 * Returns what happened per database so a caller can FAIL LOUD rather than
 * assume a clean slate (see `no-silent-fallbacks`). Check `clean` before
 * trusting anything you measure afterwards.
 */
export async function wipeOfflineData(): Promise<WipeResult> {
	// LOUD, at warn level. DevTools' default "Custom levels" filter HIDES
	// console.log (the user's console showed "94 hidden"), so a wipe that
	// logged at info level was indistinguishable from a button that did
	// nothing. Every step announces itself.
	console.warn("[wipe] ── starting ──");
	const existing = new Set<string>();
	// `databases()` is not in older Safari; absent means we just try them all.
	if (typeof indexedDB.databases === "function") {
		try {
			for (const d of await indexedDB.databases()) {
				if (d.name) existing.add(d.name);
			}
		} catch {
			/* fall through — attempt every name */
		}
	}

	const deleted: Record<string, "gone" | "blocked" | "absent"> = {};
	for (const name of WIPE_DBS) {
		if (existing.size > 0 && !existing.has(name)) {
			deleted[name] = "absent";
			continue;
		}
		// Say what is ON DISK before deleting — "4303 tiles → gone" is the proof
		// the button worked. Counted only for a database that EXISTS: opening one
		// CREATES it, and a diagnostic that changes what it measures is worse than
		// no diagnostic (it turned an "absent" result into "gone" and broke a test).
		if (name === "gc-offlineTiles") {
			try {
				console.warn(`[wipe] tiles on disk before: ${await countTiles()}`);
			} catch {
				/* diagnostic only */
			}
		}
		console.warn(`[wipe] deleting ${name}…`);
		deleted[name] = await deleteDb(name);
		console.warn(`[wipe]   ${name}: ${deleted[name]}`);
	}

	const clean = Object.values(deleted).every((v) => v !== "blocked");
	console.warn(
		clean
			? "[wipe] ✅ CLEAN — every offline database is gone. Reloading…"
			: "[wipe] ❌ BLOCKED — nothing deleted. Close other tabs on this origin.",
		deleted,
	);
	return { deleted, clean };
}

/**
 * THE ONE YOU ACTUALLY CALL — stop the app, wipe, then reload.
 *
 * ── THE RACE THAT MADE THE FIRST VERSION A LIE ────────────────────────────
 *
 * `deleteDatabase` cannot proceed while ANY connection to that database is
 * open. The app holds several on purpose (the tile reader caches one, because
 * reopening per tile is ruinous), so every delete comes back `blocked` — queued,
 * waiting for the connections to close.
 *
 * The first version called `location.reload()` right after. That looks like it
 * should help: the page tears down, connections die, the queued deletes
 * complete. In reality the RELOAD WINS THE RACE — the fresh page boots and
 * REOPENS the databases before the queued deletes get their turn, which
 * CANCELS them. MEASURED on a live page: all four blocked, `tiles on disk: 0`
 * for one frame, then `4303` again. Nothing was ever deleted.
 *
 * ⚠️ It was "verified" only because the test called `page.close()` — killing the
 * tab, which no real user does. A verification that relies on a condition the
 * product never has is not a verification.
 *
 * ── THE FIX: CLOSE FIRST, CONFIRM, THEN RELOAD ────────────────────────────
 *
 * 1. Tell every module holding a cached handle to drop it (`closers`).
 * 2. Delete, and WAIT for each delete to actually report success.
 * 3. Only then reload — into storage that is provably empty.
 *
 * The order is the whole fix. Reloading before the deletes confirm is what
 * silently re-creates the dirty map this function exists to prevent.
 */

/**
 * Things to STOP before wiping — pollers, services, anything that touches the
 * store on a timer.
 *
 * ⛔ Registered by the CALLER, never imported here. Importing the bake service
 * pulled the whole app (Supabase, $env) into a wipe utility and broke its unit
 * test; a module that deletes databases must depend on nothing.
 */
const stoppers = new Set<() => void>();

/** Register something to stop before the wipe (e.g. the bake service). */
export function registerWipeStopper(fn: () => void): () => void {
	stoppers.add(fn);
	return () => stoppers.delete(fn);
}

/**
 * Modules register a fn that closes their cached IDBDatabase handle.
 *
 * ⚠️ We reuse the app's EXISTING registry (`registerOfflineDbReset` /
 * `resetOfflineDbHandles`, built for sandbox toggling) rather than adding a
 * second one. Two registries means a module can register with one and not the
 * other, and the wipe then blocks on a handle nobody knew about — the exact
 * class of bug this file keeps hitting. One registry, one list.
 */

/**
 * Wipe for real: close every known connection, delete, confirm, reload.
 *
 * Throws if the store is not provably empty afterwards. FAIL LOUD — a wipe that
 * half-worked is worse than none, because the next hour of measurement is
 * silently garbage.
 */
export async function wipeOfflineDataAndReload(): Promise<void> {
	// 1) STOP THE APP FROM TOUCHING THE STORE.
	//
	// ⚠️ Closing cached handles is NOT enough. The bake service polls every ~20 s
	// and opens the tile DB per call; an in-flight transaction blocks the delete
	// just as hard as a cached handle, and a running service will re-open (and
	// re-download into) the database the instant it is gone.
	// MEASURED: with only the handle fix, gc-offlineSatellite / rt-vectors /
	// rt-mapRegistry all deleted while gc-offlineTiles — the one the bake service
	// hammers — stayed "blocked".
	for (const stop of stoppers) {
		try {
			stop();
		} catch {
			/* best-effort: a failed stopper just means that delete may block */
		}
	}
	// Let any transaction already in flight finish and release its lock.
	await new Promise((r) => setTimeout(r, IN_FLIGHT_GRACE_MS));

	// 2) Drop cached handles so the deletes are not blocked from inside our own app.
	// ⛔ LATCH READS OFF FIRST, THEN DROP HANDLES.
	//
	// Closing the handles alone is not enough: the map requests tiles
	// continuously, so `idbGetTile` reopens the database on demand and the
	// delete is blocked again microseconds later. MEASURED — satellite and
	// registry deleted cleanly every time while `gc-offlineTiles` came back
	// `blocked`, because it is the only one being read from constantly.
	latchOfflineReadsForWipe();
	resetOfflineDbHandles();

	// 3) Delete and WAIT. No reload until these actually finish.
	const res = await wipeOfflineData();

	if (!res.clean) {
		// The delete failed and we are NOT reloading, so this tab keeps running
		// with the read latch still on — which would make every tile read a
		// permanent silent miss ("the roads never came back"). Restore reads
		// first: the data is still there, so serving it is correct.
		unlatchOfflineReadsAfterFailedWipe();

		// Do NOT reload — reloading now is exactly what re-creates the databases
		// and hides the failure. Tell the human instead.
		console.error(
			"[wipe] FAILED — databases still held open, nothing was deleted.",
			res.deleted,
			"\nClose other tabs on this origin and press WIPE again.",
		);
		throw new Error("wipe blocked: " + JSON.stringify(res.deleted));
	}

	// 4) Provably empty → safe to reload.
	console.log("[wipe] clean:", res.deleted);
	location.reload();
}

/** How many tiles are in the store right now (diagnostic only). */
function countTiles(): Promise<number> {
	return new Promise((resolve) => {
		const req = indexedDB.open("gc-offlineTiles");
		req.onsuccess = () => {
			const db = req.result;
			if (![...db.objectStoreNames].includes("tiles")) {
				db.close();
				resolve(0);
				return;
			}
			const c = db.transaction("tiles", "readonly").objectStore("tiles").count();
			c.onsuccess = () => {
				resolve(c.result);
				db.close();
			};
			c.onerror = () => {
				resolve(-1);
				db.close();
			};
		};
		req.onerror = () => resolve(-1);
	});
}
