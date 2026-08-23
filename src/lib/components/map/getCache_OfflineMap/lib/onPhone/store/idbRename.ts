/**
 * idbRename.ts — one-time copy-forward when an IndexedDB database is RENAMED.
 *
 * Renaming an IndexedDB database is not a real operation: a new name is a new,
 * empty database. So every offline box we rename (`retreever-v3-satimg` →
 * `rt-satellite`, etc.) would otherwise look EMPTY to an existing user the first
 * time they launch the renamed build — their baked photos / tiles / coverage
 * "gone". For the offline boxes that's unrecoverable (the data only lives
 * on-device; it never syncs to the cloud).
 *
 * `migrateIdbDatabase` copies a single-objectStore, explicitly-keyed database
 * from its old name into the new name ONCE, on first boot of the renamed build,
 * then leaves the old database in place as a safety net (a later release can
 * sweep it). It is idempotent and best-effort:
 *   • if the new DB already has data → skip (already migrated).
 *   • if the old DB is missing/empty → nothing to do, create the new one clean.
 *   • any error → swallow; the box just starts empty (same as a brand-new user).
 *
 * Shape assumption (true for every offline box here — verified): a SINGLE object
 * store, NO keyPath, keyed by an explicit key argument. The copy preserves each
 * record's key exactly.
 */

/**
 * Does a database of this name ALREADY EXIST on disk? Crucially this must NOT
 * create it — `indexedDB.open(name)` with no version silently CREATES an empty,
 * store-less database, which is exactly the bug that poisoned the renamed boxes
 * (the real module then can't open its object store). `indexedDB.databases()`
 * only lists existing databases, so we probe that first and never open a name
 * that isn't already there.
 */
async function dbExists(name: string): Promise<boolean> {
	try {
		if (typeof indexedDB.databases === "function") {
			const dbs = await indexedDB.databases();
			return dbs.some((d) => d.name === name);
		}
	} catch {
		/* fall through to the conservative default below */
	}
	// No indexedDB.databases() support (older Firefox): we cannot check without
	// creating. Bias to "exists" so we never accidentally CREATE a store-less DB;
	// the readers below tolerate a missing store and return empty.
	return true;
}

/** Does a database of this name exist AND hold at least one record? */
async function dbHasData(name: string, store: string): Promise<boolean> {
	if (!(await dbExists(name))) return false;
	return new Promise((resolve) => {
		const req = indexedDB.open(name);
		req.onsuccess = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(store)) {
				db.close();
				resolve(false);
				return;
			}
			const countReq = db
				.transaction(store, "readonly")
				.objectStore(store)
				.count();
			countReq.onsuccess = () => {
				db.close();
				resolve(countReq.result > 0);
			};
			countReq.onerror = () => {
				db.close();
				resolve(false);
			};
		};
		req.onerror = () => resolve(false);
		// A blocked open (another tab holds it) — don't hang; treat as unknown.
		req.onblocked = () => resolve(false);
	});
}

/** Read every [key, value] pair out of a single-store, explicitly-keyed DB. */
async function readAll(
	name: string,
	store: string,
): Promise<Array<{ key: IDBValidKey; value: unknown }>> {
	if (!(await dbExists(name))) return [];
	return new Promise((resolve) => {
		const req = indexedDB.open(name);
		req.onsuccess = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(store)) {
				db.close();
				resolve([]);
				return;
			}
			const out: Array<{ key: IDBValidKey; value: unknown }> = [];
			const cursorReq = db
				.transaction(store, "readonly")
				.objectStore(store)
				.openCursor();
			cursorReq.onsuccess = () => {
				const cursor = cursorReq.result;
				if (cursor) {
					out.push({ key: cursor.key, value: cursor.value });
					cursor.continue();
				} else {
					db.close();
					resolve(out);
				}
			};
			cursorReq.onerror = () => {
				db.close();
				resolve(out);
			};
		};
		req.onerror = () => resolve([]);
		req.onblocked = () => resolve([]);
	});
}

/** Write [key, value] pairs into a freshly-created single-store DB (version 1). */
async function writeAll(
	name: string,
	store: string,
	rows: Array<{ key: IDBValidKey; value: unknown }>,
): Promise<boolean> {
	return new Promise((resolve) => {
		const req = indexedDB.open(name, 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
		};
		req.onsuccess = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(store)) {
				db.close();
				resolve(false);
				return;
			}
			const tx = db.transaction(store, "readwrite");
			const os = tx.objectStore(store);
			for (const { key, value } of rows) os.put(value, key);
			tx.oncomplete = () => {
				db.close();
				resolve(true);
			};
			tx.onerror = () => {
				db.close();
				resolve(false);
			};
		};
		req.onerror = () => resolve(false);
		req.onblocked = () => resolve(false);
	});
}

/**
 * Copy a single-objectStore, explicitly-keyed IndexedDB database from `oldName`
 * to `newName`, ONCE. Safe to call on every boot — it no-ops once the new DB has
 * data, and the old DB is left untouched as a fallback.
 *
 * @param oldName  pre-rename database name (e.g. "retreever-v3-satimg")
 * @param newName  post-rename database name (e.g. "rt-satellite")
 * @param store    the single objectStore name inside both (e.g. "images")
 */
/** Delete `name` IF it exists but does NOT contain `store` (a poisoned shell). */
async function deleteIfShell(name: string, store: string): Promise<void> {
	if (!(await dbExists(name))) return;
	const isShell = await new Promise<boolean>((resolve) => {
		const req = indexedDB.open(name);
		req.onsuccess = () => {
			const db = req.result;
			const missing = !db.objectStoreNames.contains(store);
			db.close();
			resolve(missing);
		};
		req.onerror = () => resolve(false);
		req.onblocked = () => resolve(false);
	});
	if (!isShell) return;
	await new Promise<void>((resolve) => {
		const del = indexedDB.deleteDatabase(name);
		del.onsuccess = () => {
			console.info(`[idbRename] deleted poisoned shell DB "${name}"`);
			resolve();
		};
		del.onerror = () => resolve();
		del.onblocked = () => resolve();
	});
}

export async function migrateIdbDatabase(
	oldName: string,
	newName: string,
	store: string,
): Promise<void> {
	if (typeof indexedDB === "undefined") return;
	try {
		// Heal a poisoned SHELL: a destination DB that exists but lacks the expected
		// object store (created store-less by an earlier versionless open). Left in
		// place it blocks the real module from ever creating its store. Delete it so
		// the migration — or the module's own openDb — can rebuild it cleanly.
		await deleteIfShell(newName, store);

		// Already migrated (or a fresh user already writing to the new name) → done.
		if (await dbHasData(newName, store)) return;
		// Nothing in the old box → nothing to carry; the new box gets created
		// lazily by the module's own openDb on first write.
		if (!(await dbHasData(oldName, store))) return;

		const rows = await readAll(oldName, store);
		if (rows.length === 0) return;
		const ok = await writeAll(newName, store, rows);
		if (ok) {
			console.info(
				`[idbRename] migrated ${rows.length} record(s) ${oldName} → ${newName}`,
			);
		}
	} catch {
		// Best-effort: a failed migration just means the box starts empty for this
		// user (offline data re-bakes; tree data re-pulls from cloud). Never throw —
		// a rename must not be able to break boot.
	}
}

/** Does any objectStore in this database hold at least one record? */
function anyStoreHasData(db: IDBDatabase): Promise<boolean> {
	const names = Array.from(db.objectStoreNames);
	if (names.length === 0) return Promise.resolve(false);
	return new Promise((resolve) => {
		const tx = db.transaction(names, "readonly");
		let pending = names.length;
		let found = false;
		for (const n of names) {
			const c = tx.objectStore(n).count();
			c.onsuccess = () => {
				if (c.result > 0) found = true;
				if (--pending === 0) resolve(found);
			};
			c.onerror = () => {
				if (--pending === 0) resolve(found);
			};
		}
	});
}

/**
 * Clone an ENTIRE multi-objectStore IndexedDB database (every store, preserving
 * each store's keyPath / autoIncrement and every record's key) from `oldName`
 * into `newName`, ONCE. This is the variant for the TinyBase persister database
 * (`retreever` → `rt-treeStuff`), whose internal layout (stores `t` / `v`, keyed
 * by keyPath) we must not assume away.
 *
 * Idempotent + best-effort, same contract as migrateIdbDatabase: no-ops once the
 * destination has any data; never throws (a failed clone just means the new DB
 * starts empty and the TinyBase store re-pulls from the cloud on sign-in).
 */
export async function cloneEntireIdbDatabase(
	oldName: string,
	newName: string,
): Promise<void> {
	if (typeof indexedDB === "undefined") return;

	// Open WITHOUT creating: only ever open a name that already exists, so we
	// never leave a store-less shell behind (the bug that broke the renamed
	// boxes). The TinyBase persister creates `newName` itself on first load.
	const openPlain = async (name: string): Promise<IDBDatabase | null> => {
		if (!(await dbExists(name))) return null;
		return new Promise((resolve) => {
			const req = indexedDB.open(name);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => resolve(null);
			req.onblocked = () => resolve(null);
		});
	};

	try {
		// Destination already populated → migrated already (or fresh user). Done.
		const dest0 = await openPlain(newName);
		if (dest0) {
			const has = await anyStoreHasData(dest0);
			dest0.close();
			if (has) return;
		}

		const src = await openPlain(oldName);
		if (!src) return;
		const storeNames = Array.from(src.objectStoreNames);
		if (storeNames.length === 0) {
			src.close();
			return;
		}
		if (!(await anyStoreHasData(src))) {
			src.close();
			return;
		}

		// Read the full layout + contents of every source store.
		type StoreDump = {
			name: string;
			keyPath: string | string[] | null;
			autoIncrement: boolean;
			rows: Array<{ key: IDBValidKey; value: unknown }>;
		};
		const dumps: StoreDump[] = await new Promise((resolve) => {
			const tx = src.transaction(storeNames, "readonly");
			const result: StoreDump[] = [];
			let pending = storeNames.length;
			for (const n of storeNames) {
				const os = tx.objectStore(n);
				const dump: StoreDump = {
					name: n,
					keyPath: os.keyPath as string | string[] | null,
					autoIncrement: os.autoIncrement,
					rows: [],
				};
				result.push(dump);
				const cur = os.openCursor();
				cur.onsuccess = () => {
					const c = cur.result;
					if (c) {
						// With an inline keyPath the key travels inside the value; with
						// an out-of-line key we must carry it explicitly. Capture the key
						// only when there's no keyPath (explicit-key store).
						dump.rows.push({ key: c.key, value: c.value });
						c.continue();
					} else if (--pending === 0) {
						resolve(result);
					}
				};
				cur.onerror = () => {
					if (--pending === 0) resolve(result);
				};
			}
		});
		src.close();

		// Create the destination DB with the same store layout, then fill it.
		const ok = await new Promise<boolean>((resolve) => {
			const req = indexedDB.open(newName, 1);
			req.onupgradeneeded = () => {
				const db = req.result;
				for (const d of dumps) {
					if (db.objectStoreNames.contains(d.name)) continue;
					db.createObjectStore(
						d.name,
						d.keyPath != null
							? { keyPath: d.keyPath, autoIncrement: d.autoIncrement }
							: { autoIncrement: d.autoIncrement },
					);
				}
			};
			req.onsuccess = () => {
				const db = req.result;
				const tx = db.transaction(
					dumps.map((d) => d.name),
					"readwrite",
				);
				for (const d of dumps) {
					const os = tx.objectStore(d.name);
					for (const { key, value } of d.rows) {
						// keyPath store → key is inline, must NOT pass a key arg.
						if (d.keyPath != null) os.put(value);
						else os.put(value, key);
					}
				}
				tx.oncomplete = () => {
					db.close();
					resolve(true);
				};
				tx.onerror = () => {
					db.close();
					resolve(false);
				};
			};
			req.onerror = () => resolve(false);
			req.onblocked = () => resolve(false);
		});
		if (ok) {
			const total = dumps.reduce((s, d) => s + d.rows.length, 0);
			console.info(
				`[idbRename] cloned ${total} record(s) across ${dumps.length} store(s) ${oldName} → ${newName}`,
			);
		}
	} catch {
		// Best-effort: never let a clone failure break boot.
	}
}

/**
 * One-time QA table rename INSIDE the TinyBase persister database: the `t`
 * object store holds one record per table (`{k: <tableId>, v: <rows>}`, inline
 * keyPath `k`). Rewrites `quality704Table` → `qaSurveyTable` and
 * `quality704PlotTable` → `qaPlotTable`, renaming each plot row's
 * `quality704Key` FK cell → `qaSurveyKey` along the way.
 *
 * MUST run before the persister loads: the store's TablesSchema no longer
 * declares the old names, so an un-migrated load would silently drop both
 * tables. Idempotent (no old records → no-op) and best-effort (a failure
 * leaves the old records in place for the next boot to retry).
 */
export async function renameQaTablesInIdb(dbName: string): Promise<void> {
	if (typeof indexedDB === "undefined") return;
	try {
		if (!(await dbExists(dbName))) return;
		const db = await new Promise<IDBDatabase | null>((resolve) => {
			const req = indexedDB.open(dbName);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => resolve(null);
			req.onblocked = () => resolve(null);
		});
		if (!db) return;
		if (!db.objectStoreNames.contains("t")) {
			db.close();
			return;
		}
		const RENAMES: Array<{ from: string; to: string }> = [
			{ from: "quality704Table", to: "qaSurveyTable" },
			{ from: "quality704PlotTable", to: "qaPlotTable" },
		];
		let moved = 0;
		await new Promise<void>((resolve) => {
			const tx = db.transaction("t", "readwrite");
			const os = tx.objectStore("t");
			for (const { from, to } of RENAMES) {
				const get = os.get(from);
				get.onsuccess = () => {
					const rec = get.result as
						| { k: string; v: Record<string, Record<string, unknown>> }
						| undefined;
					if (!rec) return;
					const existing = os.get(to);
					existing.onsuccess = () => {
						// A populated destination record wins (never clobber newer data);
						// just drop the stale old-name record.
						if (!existing.result) {
							const rows = rec.v ?? {};
							if (to === "qaPlotTable") {
								for (const row of Object.values(rows)) {
									if (row && typeof row === "object" && "quality704Key" in row) {
										(row as Record<string, unknown>).qaSurveyKey = (
											row as Record<string, unknown>
										).quality704Key;
										delete (row as Record<string, unknown>).quality704Key;
									}
								}
							}
							os.put({ k: to, v: rows });
							moved++;
						}
						os.delete(from);
					};
				};
			}
			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
			tx.onabort = () => resolve();
		});
		db.close();
		if (moved) {
			console.info(
				`[idbRename] renamed ${moved} QA table record(s) → qaSurveyTable / qaPlotTable (FK cell → qaSurveyKey)`,
			);
		}
	} catch {
		// Best-effort: never let the rename break boot — old records stay for retry.
	}
}
