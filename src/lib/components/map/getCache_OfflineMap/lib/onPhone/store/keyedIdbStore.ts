/**
 * keyedIdbStore.ts — the ONE IndexedDB wrapper for the offline boxes
 * (satellite photos, coverage registry, legacy line vectors, road thumbs).
 * Each box is a single object store, NO keyPath, keyed by an explicit string —
 * the same shape `idbRename.migrateIdbDatabase` assumes.
 *
 * What every box needs, built in ONCE:
 *   • dbPromise memo — one open handle per store, opened lazily.
 *   • sandbox awareness — the DB name resolves through `currentDbName` AT OPEN
 *     TIME, and the cached handle registers with `registerOfflineDbReset` so a
 *     sandbox toggle drops it (the next open targets the correct DB).
 *   • SHELL HEAL — a DB that exists but LACKS its object store (created
 *     store-less by an interrupted/older versionless open — "object store was
 *     not found" forever after, since same-version opens never fire
 *     onupgradeneeded) is deleted and recreated on first open.
 */

import {
	currentDbName,
	registerOfflineDbReset,
} from "$harness/components/map/mapShared/sandboxDbNames";

export interface KeyedIdbStore<T> {
	get(key: string): Promise<T | undefined>;
	put(key: string, value: T): Promise<void>;
	delete(key: string): Promise<void>;
	/** Every stored key, as strings (keys are always explicit strings here). */
	keys(): Promise<string[]>;
	/** Every stored value (key order — same order `keys()` returns).
	 *
	 *  ⚠️ Deserializes the WHOLE store in one main-thread task. If you only need
	 *  a few fields per record, use `getAllProjected` — on a big store the
	 *  difference is measured in hundreds of milliseconds of blocked UI. */
	getAll(): Promise<T[]>;
	/** Every stored value, cursor-streamed and reduced to `project(value)` as it
	 *  goes, so the full records never all exist at once. See the implementation
	 *  for the measurement that motivated it. */
	getAllProjected<P>(project: (value: T) => P): Promise<P[]>;
}

export function makeKeyedIdbStore<T>(opts: {
	dbName: string;
	storeName: string;
	version?: number;
}): KeyedIdbStore<T> {
	const { dbName, storeName, version = 1 } = opts;

	let dbPromise: Promise<IDBDatabase> | null = null;

	function openOnce(): Promise<IDBDatabase> {
		return new Promise<IDBDatabase>((resolve, reject) => {
			const req = indexedDB.open(currentDbName(dbName), version);
			req.onupgradeneeded = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains(storeName))
					db.createObjectStore(storeName);
			};
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	}

	function openDb(): Promise<IDBDatabase> {
		if (dbPromise) return dbPromise;
		dbPromise = (async () => {
			let db = await openOnce();
			// SHELL HEAL — see the file header.
			if (!db.objectStoreNames.contains(storeName)) {
				db.close();
				await new Promise<void>((res) => {
					const del = indexedDB.deleteDatabase(currentDbName(dbName));
					del.onsuccess = () => res();
					del.onerror = () => res();
					del.onblocked = () => res();
				});
				db = await openOnce();
			}
			return db;
		})();
		return dbPromise;
	}

	// When sandbox mode toggles, the cached handle points at the wrong DB —
	// drop it so the next openDb() reopens against the correct name.
	//
	// ⚠️ CLOSE THE CONNECTION, don't just drop the reference. Nulling
	// `dbPromise` forgets the handle but leaves the underlying connection OPEN,
	// and an open connection BLOCKS `deleteDatabase` forever. That was harmless
	// for the sandbox toggle this was written for (a stale handle is only a
	// correctness problem, not a locking one) and fatal for the WIPE: measured,
	// `gc-offlineSatellite` reported "blocked" and survived a wipe the user had
	// been told was clean.
	registerOfflineDbReset(() => {
		const pending = dbPromise;
		dbPromise = null;
		// The promise may still be in flight — close whenever it lands.
		void pending?.then((db) => db.close()).catch(() => {});
	});

	return {
		get(key: string): Promise<T | undefined> {
			return openDb().then(
				(db) =>
					new Promise<T | undefined>((res, rej) => {
						const r = db
							.transaction(storeName, "readonly")
							.objectStore(storeName)
							.get(key);
						r.onsuccess = () => res(r.result as T | undefined);
						r.onerror = () => rej(r.error);
					}),
			);
		},
		put(key: string, value: T): Promise<void> {
			return openDb().then(
				(db) =>
					new Promise<void>((res, rej) => {
						const t = db.transaction(storeName, "readwrite");
						t.objectStore(storeName).put(value, key);
						t.oncomplete = () => res();
						t.onerror = () => rej(t.error);
					}),
			);
		},
		delete(key: string): Promise<void> {
			return openDb().then(
				(db) =>
					new Promise<void>((res, rej) => {
						const t = db.transaction(storeName, "readwrite");
						t.objectStore(storeName).delete(key);
						t.oncomplete = () => res();
						t.onerror = () => rej(t.error);
					}),
			);
		},
		keys(): Promise<string[]> {
			return openDb().then(
				(db) =>
					new Promise<string[]>((res, rej) => {
						const r = db
							.transaction(storeName, "readonly")
							.objectStore(storeName)
							.getAllKeys();
						r.onsuccess = () => res((r.result as IDBValidKey[]).map(String));
						r.onerror = () => rej(r.error);
					}),
			);
		},
		/**
		 * Read every record, but keep ONLY what `project` returns.
		 *
		 * ── Why this exists (measured, not theoretical) ──
		 * `getAll()` deserializes every value in the store in ONE uninterruptible
		 * main-thread task. On a real fire cache that is 73,225 hotspots, and the
		 * browser flagged it directly: `'success' handler took 600–1140 ms`.
		 * A caller that only wants each record's CENTRE pays that entire cost.
		 *
		 * A cursor walks records one at a time, so each value is deserialized,
		 * projected, and then immediately garbage — the big arrays never all
		 * exist at once. The total work is smaller AND it is split across many
		 * small tasks instead of one long one, which is what actually keeps the
		 * map interactive.
		 *
		 * ⚠️ `project` runs inside the IDB transaction: keep it pure and cheap,
		 * and never await in it or the transaction auto-closes.
		 */
		getAllProjected<P>(project: (value: T) => P): Promise<P[]> {
			return openDb().then(
				(db) =>
					new Promise<P[]>((res, rej) => {
						const out: P[] = [];
						const r = db
							.transaction(storeName, "readonly")
							.objectStore(storeName)
							.openCursor();
						r.onsuccess = () => {
							const cur = r.result;
							if (!cur) {
								res(out);
								return;
							}
							out.push(project(cur.value as T));
							cur.continue();
						};
						r.onerror = () => rej(r.error);
					}),
			);
		},
		getAll(): Promise<T[]> {
			return openDb().then(
				(db) =>
					new Promise<T[]>((res, rej) => {
						const r = db
							.transaction(storeName, "readonly")
							.objectStore(storeName)
							.getAll();
						r.onsuccess = () => res(r.result as T[]);
						r.onerror = () => rej(r.error);
					}),
			);
		},
	};
}
