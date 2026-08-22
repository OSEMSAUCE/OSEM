/**
 * The wipe must actually wipe, and must never touch user data.
 *
 * The second test is the important one: `rt-treeStuff` holds plots, maps and
 * tallies. Tiles are re-downloadable; a plot is not. A wipe that widens by one
 * name destroys work that cannot be recovered.
 */
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { NEVER_WIPE, wipeOfflineData, WIPE_DBS } from "./wipe";

function makeDb(name: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(name, 1);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains("s"))
				req.result.createObjectStore("s");
		};
		req.onsuccess = () => {
			req.result.close();
			resolve();
		};
		req.onerror = () => reject(req.error);
	});
}

async function listDbs(): Promise<string[]> {
	const dbs = await indexedDB.databases();
	return dbs.map((d) => d.name ?? "").filter(Boolean);
}

describe("wipeOfflineData", () => {
	beforeEach(async () => {
		for (const n of await listDbs()) indexedDB.deleteDatabase(n);
	});

	it("deletes every offline map database", async () => {
		for (const n of WIPE_DBS) await makeDb(n);
		expect((await listDbs()).sort()).toEqual([...WIPE_DBS].sort());

		const res = await wipeOfflineData();
		expect(res.clean).toBe(true);
		expect(await listDbs()).toEqual([]);
	});

	it("⛔ NEVER deletes the user's own data", async () => {
		for (const n of WIPE_DBS) await makeDb(n);
		for (const n of NEVER_WIPE) await makeDb(n);

		await wipeOfflineData();

		const left = await listDbs();
		// Tiles gone…
		for (const n of WIPE_DBS) expect(left).not.toContain(n);
		// …plots, maps and tallies untouched.
		for (const n of NEVER_WIPE) expect(left).toContain(n);
	});

	it("the wipe list and the never-wipe list cannot overlap", () => {
		for (const n of NEVER_WIPE) {
			expect(WIPE_DBS as readonly string[]).not.toContain(n);
		}
	});

	it("reports absent databases rather than failing", async () => {
		const res = await wipeOfflineData();
		expect(res.clean).toBe(true);
		for (const n of WIPE_DBS) expect(res.deleted[n]).toBe("absent");
	});
});
