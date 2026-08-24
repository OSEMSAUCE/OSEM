/**
 * Regression tests for the offline-map disc probes — the predicates that decide
 * whether an area RE-DOWNLOADS its wall-map tiles. A wrong answer here is a
 * cellular-data runaway (the 20 s reconcile re-fetches the pack every pass,
 * forever), so the two probes' contracts are pinned:
 *   • areaTilesPresent  (SURVIVAL, loose)  — true if ANY of the disc's keys is
 *     stored, including an edge-sparse disc whose CENTRE tiles are empty
 *     (remote-bush pin: data only at the disc rim).
 *   • areaCentreCovered (ADOPTION, strict) — true only when the anchor's own
 *     centre-tile patch is stored, so a barely-overlapping neighbour can never
 *     suppress a new anchor's download and leave a hole mid-feature.
 */
import "fake-indexeddb/auto";
import { BLOB_RADIUS_KM, BLOB_ZOOMS } from "../../contract/roadBlob";
import { BLOB_MIN_Z } from "../../contract/blob";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// downloadGuard (imported by the module under test) pulls in Sentry — mock it
// so the test never touches the real SDK.
vi.mock("@sentry/sveltekit", () => ({ captureMessage: vi.fn() }));

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
	areaCentreCovered,
	areaTileKeys,
	areaTilesPresent,
	purgeEmptyTiles,
	v4TransformRequest,
	DB_NAME,
	RINGS,
} from "./packDownload";

// Mirrors openDb() in the module under test (store "tiles", version 1).
function putTiles(keys: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains("tiles"))
				req.result.createObjectStore("tiles");
		};
		req.onsuccess = () => {
			const db = req.result;
			const tx = db.transaction("tiles", "readwrite");
			for (const k of keys) tx.objectStore("tiles").put(new ArrayBuffer(8), k);
			tx.oncomplete = () => {
				db.close();
				resolve();
			};
			tx.onerror = () => {
				db.close();
				reject(tx.error);
			};
		};
		req.onerror = () => reject(req.error);
	});
}

// areaTileKeys spans TWO zoom rings (z15 inner + z12 outer); a centroid across the

// Each test uses its own centre, ≥2° of longitude (~157 km at lat 45) from the
// others, so their 25 km outer rings never overlap and no cross-test state leaks.
describe("offline cell probes (download-runaway regression)", () => {
	it("empty pile → both probes false (area downloads once)", async () => {
		expect(await areaTilesPresent(-76, 45)).toBe(false);
		expect(await areaCentreCovered(-76, 45)).toBe(false);
	});

	it("its own cell blob stored → present", async () => {
		await putTiles(areaTileKeys(-78, 45));
		expect(await areaTilesPresent(-78, 45)).toBe(true);
		expect(await areaCentreCovered(-78, 45)).toBe(true);
	});

	it("⛔ A MISSING NEIGHBOUR CELL FAILS THE PROBE — partial is not present", async () => {
		// THE REGRESSION THIS PINS, MEASURED LIVE 2026-08-17 (under the old disc).
		//
		// The probe used to be a LOOSE vote — "is ANY tile of this area stored?" —
		// while the version stamp promised a whole ring set. So an area holding a
		// fraction of what it needed answered "covered", skipped its download, and
		// then stamped itself CURRENT. All 232 areas on the device claimed a ring
		// they did not hold; the staleness signal was destroyed and no cloud-side
		// change could reach the device again.
		//
		// The law: the stamp promises a SHAPE, so the probe authorising it must
		// verify that whole shape. Here that means EVERY cell the area needs —
		// storing all but one must still read as absent.
		const keys = areaTileKeys(-72, 45.0);
		// Only meaningful for an anchor that actually needs a neighbour; if this
		// anchor sits mid-cell there is nothing partial to test.
		if (keys.length < 2) return;
		await putTiles(keys.slice(0, keys.length - 1));
		expect(await areaTilesPresent(-72, 45.0)).toBe(false);
		expect(await areaCentreCovered(-72, 45.0)).toBe(false);
	});

	it("a far-away area's blob never marks this area present", async () => {
		// Cells are disjoint by construction, so a distant area's blob can never be
		// mistaken for this one's — the ambiguity that made the old disc probe a
		// judgement call does not exist.
		await putTiles(areaTileKeys(-84, 45));
		expect(await areaTilesPresent(-70, 45)).toBe(false);
		expect(await areaCentreCovered(-70, 45)).toBe(false);
	});

	it("⛔ THE TWO PROBES ALWAYS AGREE — one rule, not two", async () => {
		// They used to be a LOOSE survival probe and a STRICT adoption probe, and
		// the two disagreeing is what produced the bug above. A cell blob is not
		// shared and not partial, so there is one question and one answer.
		await putTiles(areaTileKeys(-86, 45));
		for (const [lng, lat] of [
			[-86, 45],
			[-70, 45],
			[-86, 60],
		] as Array<[number, number]>) {
			expect(await areaTilesPresent(lng, lat)).toBe(
				await areaCentreCovered(lng, lat),
			);
		}
	});
});

// The concentric-ring download model: an anchor downloads a small high-detail z15
// disc + a wide z12 roads + earth disc, NOT one monolithic z14 disc. These pin the
// geometry the "weird partial shapes / too big" fix depends on.
//
// The client RINGS outer reach is the 40 km MAX (the superset for areaTileKeys, so a
// pin baked at the wide 40 km still reads as "present"). The Worker's base RINGS keeps
// 25 km and the roads budget grows it 25 → 40 km per-pack — see the lockstep test below.
describe("THE BLOB — one radius, every zoom", () => {
	it("RINGS is ONE radius paired with every zoom — never a hand-written table", () => {
		// The blob is a projection of the spec, not a list someone maintains. It
		// used to be hand-written and it DRIFTED: it declared a 40 km outer disc
		// while the Worker shipped 25 km, and carried a stale `{km:40, z:9}` row
		// duplicating the shallow range. Six call sites read this table.
		expect(RINGS.length).toBe(BLOB_ZOOMS.length);
		for (const r of RINGS) expect(r.km).toBe(BLOB_RADIUS_KM);
		expect(RINGS.map((r) => r.z)).toEqual([...BLOB_ZOOMS]);
	});

	it("⛔ ONE RADIUS — every level is the SAME circle", () => {
		// THE BUG THIS PINS — SHIPPED THREE TIMES IN ONE DAY, REJECTED EACH TIME.
		//
		// A blob saved only at the detail zoom vanishes when you zoom out (a
		// vector tile is stretched BIGGER only, never smaller). Every attempt to
		// fix that added a shallow level at a DIFFERENT radius — z8@40, z10@40,
		// z9@40 against a ~30 km disc — so it read on screen as a SECOND, BIGGER
		// SHAPE appearing at one zoom and vanishing at another:
		//   "it jumps to this huge really confusing 40 kilometre thing"
		//   "an unbelievable tripping hazard"
		//   "at least it was simple, at least it was one radius"
		//
		// A second radius is a second EDGE. One radius means the handoff between
		// levels is invisible, because there is nothing to hand off between.
		expect(new Set(RINGS.map((r) => r.km)).size).toBe(1);
	});

	it("NO GAPS — every level below the deepest exists", () => {
		// THE WHOLE POINT, and the thing four separate attempts got wrong.
		//
		// Overzoom only goes UP. So a missing level is a zoom at which the blob
		// simply disappears — silently, with no console error. Adding ONE shallow
		// level only MOVES that cliff (z12 → z10 → z9, shipped and rejected three
		// times: "it stops at 12 the same as every single time"). Every level
		// below the deepest must be present, or the cliff is back.
		//
		// z14 is the one legitimate absence: z13 overzooms up to cover it, free.
		//
		// ⚠️ V5 RAISED THE FLOOR to z8 — that is NOT a gap. A gap is a hole with
		// stored levels on BOTH sides, which is what makes the blob vanish and
		// come back. A floor is the edge of the pack: below it the renderer is
		// told nothing exists (the source minzoom IS the floor), so there is no
		// cliff to fall off. The levels below were deleted because a 55 km tile
		// cannot describe a 30 km circle, not because they were expensive.
		const zs: number[] = [...BLOB_ZOOMS].sort((a, b) => a - b);
		const deepest = Math.max(...zs);
		const floor = Math.min(...zs);
		const missing: number[] = [];
		for (let z = floor; z < deepest; z++) {
			if (!zs.includes(z) && z !== 14) missing.push(z);
		}
		expect(missing).toEqual([]);
		// The floor must be a level the RENDERER is also told about, or MapLibre
		// asks for addresses that 404 and blanks the map with no error.
		expect(floor).toBe(BLOB_MIN_Z);
	});

	it("an anchor's tiles span EVERY zoom the blob declares", () => {
		const keys = areaTileKeys(-76.168, 45.061);
		// KEYS ARE PIN-ADDRESSED: `pin/<lng>,<lat>/<z>/<x>/<y>` (grid.ts
		// `pinTileKey`), because a bare `z/x/y` is shared between neighbouring
		// pins and served one pin's roads to another (MEASURED 50.4 km off).
		// The zoom is the 3rd segment now, not the 1st.
		const zooms = [...new Set(keys.map((k) => Number(k.split("/")[2])))].sort(
			(a, b) => a - b,
		);
		expect(zooms).toEqual([...BLOB_ZOOMS].sort((a, b) => a - b));
	});

	it("⛔ THE TILE IS AN ADDRESS, NOT A FOOTPRINT — the CELL bounds the data", () => {
		// THE OLD RULE WAS: no stored level may be wider than 4x the blob, because a
		// wide tile dragged in data far beyond the radius (a z9 tile is 55 km, so one
		// kept by a grazing corner carried roads 78 km past the rim — measured at
		// 80 km on screen with the ruler; a z1 tile shipped place labels for half the
		// planet inside a "30 km" pack).
		//
		// THAT RULE NO LONGER APPLIES, and asserting it would now be wrong. The blob
		// is addressed at z5 — a ~885 km tile — but its CONTENTS are remapped into
		// the CELL's frame, so BLOB_EXTENT units span 40 km and nothing outside the
		// cell survives the edge trim. The tile number chooses the shallowest zoom
		// the blob is visible at; it does not describe how much ground is in it.
		//
		// What must still hold is that ONE area maps to a SMALL, BOUNDED set of keys.
		// Under the disc this was hundreds; a runaway here is the download-storm bug.
		const keys = areaTileKeys(-76.168, 45.061);
		expect(keys.length).toBeGreaterThanOrEqual(1);
		expect(keys.length).toBeLessThanOrEqual(25);
		// Every key is PIN-ADDRESSED and stored under the single blob zoom.
		for (const k of keys) {
			expect(k.startsWith("pin/")).toBe(true);
			expect(k.split("/")[2]).toBe(String(BLOB_ZOOMS[0]));
		}
		// And they are distinct — a duplicate would mean two cells sharing storage.
		expect(new Set(keys).size).toBe(keys.length);
	});

	// LOCKSTEP: the Worker packs server-side from its OWN copy of the spec (it
	// deploys to Cloudflare alone and cannot import the app's). Those two
	// constants are the only duplicated values in the system, and a drift means
	// the phone probes for tiles the Worker never packed → permanent
	// re-downloads, or coverage holes. So read the Worker's file and compare.
	it("the Worker's spec matches the client's, exactly", () => {
		// The RADIUS and the SHAPE now live in grid.ts, which is compared BYTE FOR
		// BYTE by OFFLINEV5/grid.lockstep.test.ts — a far stronger guard than
		// scraping a constant, because the cell math (the row-banded longitude step,
		// the neighbour resolution) is where a real disagreement would hide.
		//
		// What is left to check here is the ZOOM the blob is stored at: the client
		// declares it on the source, the Worker addresses the tile with it, and a
		// mismatch means the phone asks for a tile the Worker never wrote — a blank
		// map with no error anywhere.
		// BLOB_ZOOMS is now derived from BLOB_TILE_Z, so read THAT — the number
		// that actually decides the address, and the cell size with it.
		const zoomLine = /BLOB_TILE_Z = (\d+)/.exec(
			readFileSync(
				fileURLToPath(
					// ../../../../../../ lands in harness/src/; the Worker lives in the PARENT
				// repo (ReTreever), so this climbs out of the submodule. The engine is
				// vendored into the harness but the Worker it must agree with is not.
				new URL(
					"../../../../../../../../../workers/offline-tiles/src/grid.ts",
					import.meta.url,
				),
				),
				"utf8",
			),
		)?.[1] ?? "";
		// Split on commas and drop empties — a trailing comma before `]` yields a
		// blank token, and Number("") is 0, which would silently add a phantom
		// zoom 0 and make this lockstep test fail for the wrong reason.
		const workerZooms = zoomLine
			.split(",")
			.map((t) => t.trim())
			.filter((t) => t.length > 0)
			.map(Number);
		expect(workerZooms).toEqual([...BLOB_ZOOMS]);
	});
});

// ── the write boundary: a 0-byte tile must never be persisted ────────────────
// ROOT CAUSE of the "Unimplemented type: 4" storm. The pack Worker used to ship
// tiles that had filtered down to nothing (`n:0`); the phone stored them as real
// entries — ~19% of a live pile (7,213 of 37,503 on the dev device). Mapbox's
// worker then threw parsing each one, on every render pass, forever. Two walls
// are pinned here: the WRITE guard (it can never happen again) and the PURGE
// (devices already carrying them heal without a wipe).
describe("zero-byte tiles — the write boundary", () => {
	/** Raw store contents, bypassing the module's own read-side filter. */
	function rawEntries(dbName: string): Promise<Array<[string, number]>> {
		return new Promise((resolve, reject) => {
			const req = indexedDB.open(dbName, 1);
			req.onupgradeneeded = () => {
				if (!req.result.objectStoreNames.contains("tiles"))
					req.result.createObjectStore("tiles");
			};
			req.onsuccess = () => {
				const db = req.result;
				const tx = db.transaction("tiles", "readonly");
				const store = tx.objectStore("tiles");
				const ks = store.getAllKeys();
				const vs = store.getAll();
				tx.oncomplete = () => {
					db.close();
					resolve(
						(ks.result as string[]).map((k, i) => [
							k,
							(vs.result[i] as ArrayBuffer).byteLength,
						]),
					);
				};
				tx.onerror = () => {
					db.close();
					reject(tx.error);
				};
			};
			req.onerror = () => reject(req.error);
		});
	}

	function putRaw(entries: Array<[string, number]>): Promise<void> {
		return new Promise((resolve, reject) => {
			const req = indexedDB.open(DB_NAME, 1);
			req.onupgradeneeded = () => {
				if (!req.result.objectStoreNames.contains("tiles"))
					req.result.createObjectStore("tiles");
			};
			req.onsuccess = () => {
				const db = req.result;
				const tx = db.transaction("tiles", "readwrite");
				for (const [k, n] of entries)
					tx.objectStore("tiles").put(new ArrayBuffer(n), k);
				tx.oncomplete = () => {
					db.close();
					resolve();
				};
				tx.onerror = () => {
					db.close();
					reject(tx.error);
				};
			};
			req.onerror = () => reject(req.error);
		});
	}

	it("purgeEmptyTiles deletes every 0-byte tile and keeps every real one", async () => {
		await putRaw([
			["15/900/1400", 128],
			["15/900/1401", 0], // landmine
			["15/900/1402", 64],
			["15/900/1403", 0], // landmine
		]);
		const removed = await purgeEmptyTiles();
		expect(removed).toBe(2);
		const after = await rawEntries(DB_NAME);
		// NOTHING zero-byte survives, anywhere in the store.
		expect(after.every(([, n]) => n > 0)).toBe(true);
		// …and the real tiles are untouched (other specs share this DB, so assert on
		// THIS test's keys rather than the whole store).
		const mine = after.filter(([k]) => k.startsWith("15/900/")).map(([k]) => k);
		expect(mine.sort()).toEqual(["15/900/1400", "15/900/1402"]);
	});

	it("is idempotent — a clean pile loses nothing on a second sweep", async () => {
		const before = await rawEntries(DB_NAME);
		expect(await purgeEmptyTiles()).toBe(0);
		expect(await rawEntries(DB_NAME)).toEqual(before);
	});
});

// ── LAW 0 guard: a BLOCKED request must never change resource type ───────────
// THE "Unimplemented type: 4" ORIGIN. The guard substituted BLANK_PNG for every
// blocked request regardless of kind. When a GLYPH range was blocked (any origin
// form `isSameOrigin` failed to match — 127.0.0.1, an https proxy, capacitor://)
// Mapbox's worker got PNG bytes where it expected protobuf and threw
// "Unimplemented type: 4" — once per range, on EVERY render pass, forever.
// A blank PNG is a valid answer ONLY to something that decodes an image.
describe("v4TransformRequest — blocked requests keep their resource type", () => {
	// The guard reads `location`; the node env has none. Stub the real dev origin
	// so these tests exercise the same branch the browser does.
	const ORIGIN = "http://localhost:5173";
	beforeAll(() => {
		(globalThis as unknown as { location: unknown }).location = {
			origin: ORIGIN,
			href: `${ORIGIN}/mobile/offlinev4`,
			protocol: "http:",
			host: "localhost:5173",
		};
	});
	afterAll(() => {
		(globalThis as unknown as { location?: unknown }).location = undefined;
	});

	it("blocks a foreign GLYPH with nothing — never a PNG", () => {
		const r = v4TransformRequest("https://api.mapbox.com/fonts/v1/x/0-255.pbf", "Glyphs");
		expect(r.url).toBe("");
		expect(r.url).not.toContain("data:image/png");
	});

	it("blocks foreign style/sprite JSON with nothing — never a PNG", () => {
		for (const kind of ["Style", "Source", "SpriteJSON"]) {
			const r = v4TransformRequest("https://api.mapbox.com/whatever.json", kind);
			expect(r.url).toBe("");
		}
	});

	it("still answers a blocked IMAGE with the blank PNG", () => {
		for (const kind of ["Image", "SpriteImage", "Tile"]) {
			const r = v4TransformRequest("https://tiles.example.com/1.png", kind);
			expect(r.url).toContain("data:image/png");
		}
	});

	it("passes an ABSOLUTE same-origin glyph URL through untouched", () => {
		const local = `${ORIGIN}/mobileAssets/worldBase/glyphs/Noto%20Sans%20Regular/0-255.pbf`;
		expect(v4TransformRequest(local, "Glyphs").url).toBe(local);
	});

	it("ABSOLUTISES a root-relative local URL — the blob-worker trap", () => {
		// Mapbox hands either form. A root-relative one must NOT pass through
		// untouched, even though it is obviously local.
		//
		// WHY: Mapbox's worker is constructed from a Blob, so its `self.location`
		// is a `blob:` URL. There is no origin there for "/mobileAssets/worldBase/..." to
		// resolve against, so the fetch fails — and it surfaces as a confusing
		// world-base error a long way from its cause. Cost a full debug round.
		//
		// This test previously asserted the opposite (`toBe(rel)`), which pinned
		// the bug in place. Do not "restore" it.
		const rel = "/mobileAssets/worldBase/glyphs/Noto%20Sans%20Regular/0-255.pbf";
		expect(v4TransformRequest(rel, "Glyphs").url).toBe(`${ORIGIN}${rel}`);
	});

	it("treats other on-device origin FORMS as local, not foreign", () => {
		// A false negative here is what swapped a good font for a PNG.
		const sameHost = `http://localhost:5173/mobileAssets/worldBase/glyphs/A/0-255.pbf`;
		expect(v4TransformRequest(sameHost, "Glyphs").url).toBe(sameHost);
		const cap = "capacitor://localhost/mobileAssets/worldBase/glyphs/A/0-255.pbf";
		expect(v4TransformRequest(cap, "Glyphs").url).toBe(cap);
	});
});
