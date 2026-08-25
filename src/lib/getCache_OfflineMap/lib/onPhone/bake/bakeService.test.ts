/**
 * THE OFFLINE TRIPWIRES — the rules that must hold or the app is "worse than
 * useless" (you think you have your data offline and you don't). Each test here
 * encodes ONE law of the bake service so a future change that breaks it goes RED
 * instead of silently shipping. These are the entrenched golden rules, in code:
 *
 *   1. A touched feature bakes its blob HEADLESSLY — no Mapbox map, without ever
 *      opening /mobile/offlinev4. (The viewer only views; the service bakes.)
 *   2. A blob is COMPLETE = satellite AND wall-map tiles (roads). A photo alone is
 *      NOT "done" — the pin keeps getting its roads re-fetched until they're there.
 *      (The exact bug: onDisk = satKeys.has(k) marked photo-only pins complete.)
 *   3. Under the 1 GB budget, NOTHING is ever evicted — blobs persist forever.
 *      (The exact bug: every pass deleted blobs not anchored to a current feature.)
 *   4. Over budget, the OLDEST-touched fall off the back, newest survive. The
 *      milk-shelf conveyor — the ONLY way a blob ever disappears.
 *
 * If you're here because a test failed: the failure IS the point. Don't loosen the
 * test to make it pass — the offline guarantee just regressed. Fix the service.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Seedable in-memory disk + a mutable budget, shared between the mock factories and
// the assertions. satStore: areaKey -> photo byte size. tiles: areaKeys whose
// wall-map tiles are present. cov: the coverage registry. budget: the live cap.
const h = vi.hoisted(() => {
	const satStore = new Map<string, number>();
	const tiles = new Set<string>();
	const cov = new Map<string, Record<string, unknown>>();
	const budget = { bytes: 1_000_000_000 };
	const key = (lng: number, lat: number) =>
		`${lng.toFixed(4)},${lat.toFixed(4)}`;
	return {
		satStore,
		tiles,
		cov,
		budget,
		key,
		// downloadV4Area = the roads fetch. Records that this area's tiles are now present.
		downloadV4Area: vi.fn(async (lng: number, lat: number) => {
			tiles.add(key(lng, lat));
			return { bytes: 1000, downloaded: 5 };
		}),
		// bakeSatelliteImage = the photo bake. Writes the photo to disk.
		bakeSatelliteImage: vi.fn(async (c: [number, number]) => {
			satStore.set(key(c[0], c[1]), 1000);
			return { blob: { size: 1000 }, bounds: [0, 0, 1, 1], bakeVersion: 3 };
		}),
		deleteSatImage: vi.fn(async (k: string) => void satStore.delete(k)),
		deleteVectorAt: vi.fn(async () => undefined),
		deleteFireCache: vi.fn(async () => undefined),
		// Live position. Null by default = "location off / unknown", which is the
		// right baseline: the older tripwires all describe FEATURE-anchored
		// behaviour and must not silently gain an extra area.
		getLiveFix: vi.fn(async (): Promise<[number, number] | null> => null),
		// The fire fetch, reached through the PORT rather than a module mock.
		fetchAreaFires: vi.fn(async (_lng: number, _lat: number) => ({
			hotspots: [] as [],
			fetchedAt: 0,
			sourcesOk: 3,
			bytes: 0,
		})),
		// The bake reader's arrival debt. The real one is a consume-once Set with
		// one entry per reader; here a single boolean, because the bake reader is
		// the only reader that exists in these tests.
		fireArrivalOwed: true,
		// The fire cache READ, as a spy — tripwire 5 makes it throw to prove a
		// broken fire DB degrades the OVERLAY only and never kills the pass.
		fireRead: vi.fn(async (_key: string) => null as FireRecord | null),
	};
});

let features: Array<{
	geometry: { geometry: { type: string } } | null;
	overlayBounds: null;
	lastTouched: string;
	anchors: [number, number][];
}> = [];
// NO mapStore / anchors / liveFix / fireFetch MOCKS ANY MORE. The engine imports
// none of them — it asks the HOST PORT (mapShared/hostPorts.ts), and these tests
// supply that port themselves via `testPorts` below. That is the point of the
// seam: were it fake, every tripwire here would bake nothing and go red.

vi.mock("../../r2Worker/roads/packDownload", () => ({
	downloadV4Area: h.downloadV4Area,
	areaCentreCovered: vi.fn(async (lng: number, lat: number) =>
		h.tiles.has(h.key(lng, lat)),
	),
	areaTilesPresent: vi.fn(async (lng: number, lat: number) =>
		h.tiles.has(h.key(lng, lat)),
	),
	// Batched probe path: getAllTileKeys snapshots the set; areaTilesPresentIn reads
	// the live tiles set (so a download earlier in the same pass is reflected) — same
	// semantics as the per-area probe, just no per-area I/O.
	getAllTileKeys: vi.fn(async () => new Set(h.tiles)),
	areaTilesPresentIn: (_stored: Set<string>, lng: number, lat: number) =>
		h.tiles.has(h.key(lng, lat)),
	PACK_FORMAT_VERSION: 6,
	// MUST mirror the real outer ring (40 km): liveAnchor derives MAP_TRIGGER_KM
	// from it, so a smaller mock would silently test containment at a couple of
	// kilometres and let a genuine thrash regression through green.
	RINGS: [
		{ km: 3, z: 15 },
		{ km: 40, z: 12 },
	],
}));

vi.mock("../store/tombstones/purgeRoadRasters", () => ({
	// One-shot IndexedDB drop of the DELETED road raster's leftover PNGs — no
	// indexedDB in the node test env, so it is stubbed like every other store.
	purgeDeadRoadRasters: vi.fn(() => undefined),
}));

vi.mock("../offlineDownloadGate", () => ({
	checkDownloadGate: vi.fn(async () => false),
	isPerFeatureOnly: () => false,
	noteDownloadedBytes: () => undefined,
}));

// NO fireCache MOCK. The engine reaches fire STORAGE through the port too, so
// the stubs live in `testPorts` below — same door production uses.


vi.mock("../satellite/satelliteImage", () => ({
	bakeSatelliteImage: h.bakeSatelliteImage,
	getSatImageByKey: vi.fn(async (k: string) =>
		h.satStore.has(k)
			? {
					blob: { size: h.satStore.get(k) },
					bounds: [0, 0, 1, 1],
					bakeVersion: 3,
				}
			: undefined,
	),
	satImageKey: (c: [number, number]) => h.key(c[0], c[1]),
	BAKE_RADIUS_KM: 3,
	BAKE_VERSION: 3,
	deleteSatImage: h.deleteSatImage,
	getSatKeys: vi.fn(async () => [...h.satStore.keys()]),
	getAllSatImages: vi.fn(async () =>
		[...h.satStore.entries()].map(([key, size]) => ({
			key,
			img: { blob: { size }, bounds: [0, 0, 1, 1], bakeVersion: 3 },
		})),
	),
	// METADATA ONLY — what the bake service actually calls. Deliberately returns
	// no `blob`, so a future caller that reaches for pixels on this hot path fails
	// loudly in tests instead of silently reintroducing the 613 MB allocation.
	satImageMeta: vi.fn(async () =>
		[...h.satStore.entries()].map(([key, bytes]) => ({
			key,
			bytes,
			bakeVersion: 3,
		})),
	),
}));

vi.mock("../store/tombstones/legacyVectorCleanup", () => ({
	deleteVectorAt: h.deleteVectorAt,
	getVectorKeys: vi.fn(async () => []),
	getVectorFeaturesAt: vi.fn(async () => []),
}));

vi.mock("../store/coverageRegistry", () => ({
	allCoverage: async () => [...h.cov.values()],
	noteCoverage: async (
		areaKey: string,
		lng: number,
		lat: number,
		patch: Record<string, unknown>,
		_touch?: boolean,
		touchAt?: number,
	) => {
		const prev = h.cov.get(areaKey) ?? {};
		h.cov.set(areaKey, {
			...prev,
			areaKey,
			lng,
			lat,
			...patch,
			lastTouched: touchAt ?? prev.lastTouched ?? 0,
		});
	},
	dropCoverage: async (k: string) => void h.cov.delete(k),
	get OFFLINE_BUDGET_BYTES() {
		return h.budget.bytes;
	},
	EST_AREA_BYTES: 1000,
}));

import type {
	FireRecord,
	HostPorts,
} from "$harness/mapShared/hostPorts";
import { reconcileOnceForTest } from "./bakeService.svelte";

/**
 * THE HOST, as these tests play it — the same job `retreeverPorts()` does for
 * the real app (flatten features into anchored places), but from the plain
 * `features` array above: no store, no TinyBase, no Capacitor.
 *
 * EVERY feature is a place. That mirrors the real `isBlobAnchor`: plots included,
 * because they dedup into their block's disc downstream via satImageKey.
 */
const testPorts: HostPorts = {
	places: () =>
		features.map((f) => ({
			anchors: f.anchors ?? [],
			lastTouched: f.lastTouched,
			corridor:
				f.geometry?.geometry?.type === "LineString" ||
				f.geometry?.geometry?.type === "MultiLineString",
		})),
	// Always hydrated: these tests set `features` synchronously, so there is no
	// loading window. Distinct from "has places" — tripwire 4 seeds ORPHANS with
	// zero features and still expects the conveyor to evict.
	ready: () => true,
	onPlacesChanged: () => () => {},
	fires: {
		fetchArea: (lng, lat) => h.fetchAreaFires(lng, lat),
		arrival: () => {
			h.fireArrivalOwed = true;
		},
		takeArrival: () => {
			const owed = h.fireArrivalOwed;
			h.fireArrivalOwed = false;
			return owed;
		},
		// The fire STORE. IndexedDB-backed in the real host — none here, so these
		// are the stubs the old vi.mock used to provide. Empty + never-fresh keeps
		// the default "nothing covers us, go fetch", which is what every fire
		// tripwire below asserts against.
		read: (key: string) => h.fireRead(key),
		write: async () => undefined,
		delete: h.deleteFireCache,
		isFresh: () => false,
		coverage: async () => [],
		isCoverageFresh: () => false,
	},
	// Live position. Null by default = location off / unknown — the right baseline,
	// since the older tripwires describe FEATURE-anchored behaviour and must not
	// silently gain an extra area. Tests that want a fix opt in.
	gps: () => h.getLiveFix(),
};

const point = (anchor: [number, number]) => ({
	geometry: { geometry: { type: "Point" } },
	overlayBounds: null as null,
	lastTouched: "2026-06-17T12:00:00Z",
	anchors: [anchor],
});
/** A point feature with an explicit human last-touched (ISO), so tests can order
 *  pins by recency the way the conveyor does. */
const pointAt = (anchor: [number, number], iso: string) => ({
	geometry: { geometry: { type: "Point" } },
	overlayBounds: null as null,
	lastTouched: iso,
	anchors: [anchor],
});
const line = (anchor: [number, number]) => ({
	geometry: { geometry: { type: "LineString" } },
	overlayBounds: null as null,
	lastTouched: "2026-06-17T12:00:00Z",
	anchors: [anchor],
});
/** Seed an ORPHAN blob (on disk, no live feature points at it). */
function seedOrphan(lng: number, lat: number, lastTouched: number): void {
	const k = h.key(lng, lat);
	h.satStore.set(k, 1000);
	h.cov.set(k, {
		areaKey: k,
		lng,
		lat,
		bytes: 1000,
		hasPhoto: true,
		lastTouched,
	});
}

beforeEach(() => {
	h.satStore.clear();
	h.tiles.clear();
	h.cov.clear();
	h.budget.bytes = 1_000_000_000;
	features = [];
	h.downloadV4Area.mockClear();
	h.bakeSatelliteImage.mockClear();
	h.deleteSatImage.mockClear();
	h.deleteVectorAt.mockClear();
	h.getLiveFix.mockClear();
	h.getLiveFix.mockResolvedValue(null); // default: location off / unknown
});

describe("offline tripwire 1 — bakes headlessly the moment a feature is touched", () => {
	it("a point feature → downloads tiles AND bakes a satellite for its anchor, with NO map", async () => {
		features = [point([10, 20])];
		await reconcileOnceForTest(testPorts);
		expect(h.downloadV4Area).toHaveBeenCalledWith(10, 20, undefined, false);
		expect(h.bakeSatelliteImage).toHaveBeenCalledWith([10, 20]);
	});

	it("a LINE feature → corridor (roads-only ribbon, NO satellite for the line anchor)", async () => {
		features = [line([30, 40])];
		await reconcileOnceForTest(testPorts);
		expect(h.downloadV4Area).toHaveBeenCalledWith(30, 40, undefined, true);
		expect(h.bakeSatelliteImage).not.toHaveBeenCalledWith([30, 40]);
	});
});

describe("offline tripwire 2 — a photo alone is NOT complete; roads are always fetched", () => {
	it("satellite present but tiles MISSING → STILL downloads the roads (never 'done' on the photo)", async () => {
		// The dangerous regression: pin has its photo, no roads, and the service
		// marks it complete forever. Seed exactly that state.
		h.satStore.set(h.key(50, 60), 1000); // photo on disk
		// tiles NOT present for (50,60)
		features = [point([50, 60])];
		await reconcileOnceForTest(testPorts);
		// It MUST go get the roads despite the photo already being there.
		expect(h.downloadV4Area).toHaveBeenCalledWith(50, 60, undefined, false);
	});

	it("BOTH present → zero work (no re-download, no re-probe churn)", async () => {
		h.satStore.set(h.key(50, 60), 1000); // photo
		h.tiles.add(h.key(50, 60)); // roads
		features = [point([50, 60])];
		await reconcileOnceForTest(testPorts);
		expect(h.downloadV4Area).not.toHaveBeenCalledWith(50, 60, undefined, false);
	});
});

describe("offline tripwire — ONE pass has a TIME BUDGET", () => {
	// THE BUG THIS LOCKS: the conveyor loop used to download every incomplete
	// area in one pass. Measured on a real map: 81 s of continuous
	// decode-and-clone for a single pass, with the next already queued, so the
	// tab never idled and the heap never got a quiet GC — 87% of all allocation
	// was this loop. A pass must now stop cleanly after its slice and let the
	// next tick continue; progress is durable, so nothing is lost but latency.
	/** Run one pass with a fake clock that advances `msPerArea` on every
	 *  download, then put the shared mock back exactly as it was. The default
	 *  impl must be restored by hand: `mockClear()` in `beforeEach` resets CALLS
	 *  but keeps a `mockImplementation`, so leaving ours installed would silently
	 *  break every later test in the file. */
	async function passWithSlowDownloads(msPerArea: number): Promise<number> {
		let clock = 0;
		const nowSpy = vi.spyOn(Date, "now").mockImplementation(() => clock);
		h.downloadV4Area.mockImplementation(async (lng: number, lat: number) => {
			clock += msPerArea;
			h.tiles.add(h.key(lng, lat)); // same effect as the default mock
			return { bytes: 1000, downloaded: 5 };
		});
		try {
			await reconcileOnceForTest(testPorts);
			return h.downloadV4Area.mock.calls.length;
		} finally {
			nowSpy.mockRestore();
			h.downloadV4Area.mockImplementation(
				async (lng: number, lat: number) => {
					h.tiles.add(h.key(lng, lat));
					return { bytes: 1000, downloaded: 5 };
				},
			);
		}
	}

	it("stops early instead of walking every area when the slice is used up", async () => {
		// 12 areas needing work, each "taking" 2 s. An unbudgeted pass does all
		// 12; a budgeted one stops once the 5 s slice is gone.
		features = Array.from({ length: 12 }, (_, i) => point([100 + i, 60]));
		const n = await passWithSlowDownloads(2000);
		expect(n).toBeGreaterThan(0); // a pass ALWAYS makes progress…
		expect(n).toBeLessThan(12); // …but never grinds through everything
	});

	it("ALWAYS lands at least one area, however slow the device", async () => {
		// The budget must never starve progress: even when a single download
		// blows the entire slice, that first area still completes.
		features = [point([200, 60]), point([201, 60])];
		const n = await passWithSlowDownloads(60_000); // 12× the budget, in one area
		expect(n).toBe(1);
	});
});

describe("offline tripwire 3 — under budget, NOTHING is ever evicted", () => {
	it("an orphan blob (no live feature) survives every pass while under the 1 GB budget", async () => {
		// This is the 578→206 swing bug: orphans (incl. the live map's shared photo
		// cache) were deleted on sight. Under budget they must persist forever.
		seedOrphan(99, 99, 1);
		features = []; // nothing references the orphan
		await reconcileOnceForTest(testPorts);
		expect(h.deleteSatImage).not.toHaveBeenCalled();
		expect(h.satStore.has(h.key(99, 99))).toBe(true);
	});
});

describe("offline tripwire 3b — a kept pin gets BOTH halves; roads top up a photo-only pin", () => {
	it("within budget, a pin with a photo but no roads STILL downloads its roads", async () => {
		// default budget is huge — the pin is a keeper, so it must be COMPLETE.
		h.satStore.set(h.key(70, 80), 1000); // photo present, no tiles
		features = [point([70, 80])];
		await reconcileOnceForTest(testPorts);
		expect(h.downloadV4Area).toHaveBeenCalledWith(70, 80, undefined, false);
	});
});

describe("offline tripwire 3c — a NEW pin gets its satellite even at the cap (displaces oldest)", () => {
	it("disk full of OLDER photos → the newest pin still bakes its photo; an old one is evicted", async () => {
		// THE stuck-at-1GB bug: the gate measured TOTAL bytes on disk, so a full disk
		// blocked every new pin's photo and nothing was displaced. The conveyor must
		// rank by touch — newest wins, oldest falls off.
		h.budget.bytes = 2000; // demo(1000) + ONE more pin fits; the rest evict
		// Two OLDER pins already have their photos on disk (disk is "full").
		h.satStore.set(h.key(10, 10), 1000);
		h.tiles.add(h.key(10, 10));
		h.satStore.set(h.key(11, 11), 1000);
		h.tiles.add(h.key(11, 11));
		features = [
			pointAt([20, 20], "2026-06-18T12:00:00Z"), // NEWEST — has NO photo yet
			pointAt([10, 10], "2026-06-01T12:00:00Z"), // older
			pointAt([11, 11], "2026-05-01T12:00:00Z"), // oldest
		];
		await reconcileOnceForTest(testPorts);
		// The new pin MUST bake its satellite despite the disk already being at the cap.
		expect(h.bakeSatelliteImage).toHaveBeenCalledWith([20, 20]);
		// …and an OLD pin's photo is evicted to make room (oldest first).
		expect(h.deleteSatImage).toHaveBeenCalledWith(h.key(11, 11));
	});
});

describe("offline tripwire 4 — over budget, oldest falls off, newest survives", () => {
	it("the milk-shelf conveyor: only the oldest-touched blob is dropped", async () => {
		// Budget holds the demo (always baked) + the newest orphan, but not the oldest.
		h.budget.bytes = 2500; // demo(1000) + new(1000) = 2000 ≤ 2500 < +old(1000)=3000
		seedOrphan(11, 11, 1); // OLDEST (lastTouched 1)
		seedOrphan(22, 22, 100); // NEWEST (lastTouched 100)
		features = [];
		await reconcileOnceForTest(testPorts);
		// Oldest evicted, newest kept.
		expect(h.deleteSatImage).toHaveBeenCalledWith(h.key(11, 11));
		expect(h.deleteSatImage).not.toHaveBeenCalledWith(h.key(22, 22));
		expect(h.satStore.has(h.key(22, 22))).toBe(true);
	});

	it("a blob is ONE unit — eviction drops the photo AND the roads together (same areaKey)", async () => {
		// "last touched" = one clock per area; the satellite + roads share it and fall
		// off the conveyor as a pair. Never one without the other.
		h.budget.bytes = 2500; // demo(1000) + new(1000) keep; old(1000) over
		seedOrphan(11, 11, 1); // OLDEST — gets evicted
		seedOrphan(22, 22, 100); // newest — survives
		features = [];
		await reconcileOnceForTest(testPorts);
		// The SAME areaKey is removed from BOTH stores — photo and vectors together.
		expect(h.deleteSatImage).toHaveBeenCalledWith(h.key(11, 11));
		expect(h.deleteVectorAt).toHaveBeenCalledWith(h.key(11, 11));
	});

	it("fires ride along on eviction — an evicted area sheds its hotspots too", async () => {
		h.budget.bytes = 2500;
		seedOrphan(11, 11, 1); // OLDEST — gets evicted
		seedOrphan(22, 22, 100);
		features = [];
		await reconcileOnceForTest(testPorts);
		// Otherwise hotspots orphan in rt-fire-cache with no coverage record
		// pointing at them — invisible, un-evictable, growing forever.
		expect(h.deleteFireCache).toHaveBeenCalledWith(h.key(11, 11));
	});
});

describe("offline tripwire 6 — an active user with location gets covered, feature or not", () => {
	it("a user standing NOWHERE NEAR a feature bakes a blob at their position", async () => {
		// THE POINT OF THE WHOLE FEATURE: install the app, walk onto a block, make
		// nothing. Before this, mapStore.allMaps was the only anchor source, so a
		// user with no features got no photo, no roads and no fires — on the one
		// screen that must work without signal.
		h.getLiveFix.mockResolvedValue([100, 60]);
		await reconcileOnceForTest(testPorts);
		expect(h.bakeSatelliteImage).toHaveBeenCalledWith([100, 60]);
	});

	// The permanent demo blob (MAP_HOME_CENTER) bakes in EVERY pass by design, so
	// these assertions name the coordinate they care about rather than counting
	// calls — a count would be asserting on the demo blob by accident.
	const bakedAt = (c: [number, number]): boolean =>
		h.bakeSatelliteImage.mock.calls.some(
			([arg]) => arg[0] === c[0] && arg[1] === c[1],
		);

	it("does NOT bake anything extra when location is off", async () => {
		// Permission is never assumed and never asked for. No fix = feature
		// anchors only, exactly as before.
		h.getLiveFix.mockResolvedValue(null);
		features = [point([10, 20])];
		await reconcileOnceForTest(testPorts);
		expect(bakedAt([10, 20])).toBe(true);
		// Nothing anchored anywhere near the pin but the pin itself.
		const nearPin = h.bakeSatelliteImage.mock.calls.filter(
			([arg]) => Math.abs(arg[1] - 20) < 1 && Math.abs(arg[0] - 10) < 1,
		);
		expect(nearPin).toHaveLength(1);
	});

	it("does NOT re-bake for a user standing beside their own pin", async () => {
		// The 11 m thrash. satImageKey rounds to 4 decimals, so a raw live fix
		// would mint a new area — and a new 2 km photo — every few paces. The
		// containment test must see the feature's own coverage and stay quiet.
		features = [point([10, 20])];
		h.getLiveFix.mockResolvedValue([10.0001, 20.0001]); // ~11 m away
		await reconcileOnceForTest(testPorts);
		expect(bakedAt([10, 20])).toBe(true);
		expect(bakedAt([10.0001, 20.0001])).toBe(false);
	});

	it("does not re-bake while pacing a block all day", async () => {
		// ~1 km of wandering, well inside the 40 km blob. Every one of these
		// positions is a distinct satImageKey; none may produce a download.
		features = [point([10, 20])];
		await reconcileOnceForTest(testPorts); // the pin's own blob lands first
		for (const dLat of [0.001, 0.003, 0.006, 0.009]) {
			h.bakeSatelliteImage.mockClear();
			h.getLiveFix.mockResolvedValue([10, 20 + dLat]);
			await reconcileOnceForTest(testPorts);
			expect(bakedAt([10, 20 + dLat])).toBe(false);
		}
	});

	it("DOES bake once the user leaves coverage", async () => {
		// Past MAP_TRIGGER_KM (1.5 km — the photo radius, not the road ring):
		// leaving the imagery you have earns exactly one new blob.
		features = [point([10, 20])];
		h.getLiveFix.mockResolvedValue([10, 20.5]); // ~55 km north
		await reconcileOnceForTest(testPorts);
		expect(h.bakeSatelliteImage).toHaveBeenCalledWith([10, 20.5]);
	});

	it("fetches fires at the SNAPPED position, never the raw fix", async () => {
		// refreshFires keys its cache by satImageKey — the same ~11 m round that
		// makes a moving anchor dangerous for the map blob. A raw fix here would
		// mint a new fire record every few paces even though containment spared
		// the photo. Regression: liveFix was pushed into the fire pass unsnapped.
		h.fetchAreaFires.mockClear();
	h.fireRead.mockClear();
	h.fireRead.mockResolvedValue(null);
		h.getLiveFix.mockResolvedValue([-123.0694, 49.2643]);
		await reconcileOnceForTest(testPorts);
		const rawCall = vi
			.mocked(h.fetchAreaFires)
			.mock.calls.some(([lng, lat]) => lng === -123.0694 && lat === 49.2643);
		expect(rawCall).toBe(false);
		expect(h.fetchAreaFires).toHaveBeenCalledWith(-123, 49.25);
	});

	it("a failing geolocation read never aborts the pass", async () => {
		// Same law as the fire layer: the live anchor is a BONUS. A geolocation
		// throw must not starve the features the user explicitly created.
		h.getLiveFix.mockRejectedValueOnce(new Error("geolocation exploded"));
		features = [point([10, 20])];
		await reconcileOnceForTest(testPorts);
		expect(h.bakeSatelliteImage).toHaveBeenCalledWith([10, 20]);
	});
});

describe("offline tripwire 7 — fires are PERISHABLE and must keep refreshing", () => {
	it("refreshes fires for an area whose photo and tiles are ALREADY on disk", async () => {
		// THE BUG: fireTask lived inside ensureAreaData, which the pass SKIPS once
		// an area is complete ("if (satOnDisk && tilesOnDisk) continue"). That
		// contract is right for tiles and photos — they're immutable, so once
		// downloaded there is nothing to do — and catastrophic for fires, which go
		// stale hourly. A settled camp would show yesterday's hotspots forever.
		h.fetchAreaFires.mockClear();
	h.fireRead.mockClear();
	h.fireRead.mockResolvedValue(null);
		// Area is COMPLETE on disk: photo + tiles both present.
		h.satStore.set(h.key(10, 20), 1000);
		h.tiles.add(h.key(10, 20));
		features = [point([10, 20])];
		await reconcileOnceForTest(testPorts);
		// Nothing to download for THIS area's map data (the demo blob still bakes).
		const rebakedPin = h.bakeSatelliteImage.mock.calls.some(
			([arg]) => arg[0] === 10 && arg[1] === 20,
		);
		expect(rebakedPin).toBe(false);
		// ...but the fires MUST still refresh.
		expect(h.fetchAreaFires).toHaveBeenCalledWith(10, 20);
	});
});

describe("offline tripwire 5 — the fire layer can never break the map", () => {
	it("a THROWING fire cache does not abort the area (satellite + tiles still run)", async () => {
		// The map is the primary tool; fires are an overlay. A corrupt fire DB,
		// exhausted storage, or a missing indexedDB must degrade the OVERLAY only.
		// Regression: an unwrapped readFireCache threw here and killed the whole
		// pass — no photo, no roads, no eviction, silently.
		h.fireRead.mockRejectedValueOnce(
			new ReferenceError("indexedDB is not defined"),
		);
		h.budget.bytes = 2500;
		seedOrphan(11, 11, 1);
		features = [pointAt([20, 20], "2026-06-18T12:00:00Z")];
		await reconcileOnceForTest(testPorts);
		// The area's OTHER work completed despite the fire failure.
		expect(h.bakeSatelliteImage).toHaveBeenCalledWith([20, 20]);
		expect(h.deleteSatImage).toHaveBeenCalledWith(h.key(11, 11));
	});
});

// ── THE RE-DOWNLOAD TRIPWIRE ────────────────────────────────────────────────
// A completed area must never be downloaded again on a later pass.
//
// The bug (2026-08-10, found from a live coverage record reading
// `hasLines:false, lineCount:188` — i.e. 188 tiles really on disk but the
// ledger denying it): the MIRROR step derived `hasLines` from
// `getVectorKeys()`, which reads the LEGACY `rt-vectors` store. Nothing has
// written there since the Overpass bake was removed, so on every modern
// install it is empty → the mirror stamped hasLines:false over each freshly
// downloaded record → the next pass failed its skip check and re-downloaded
// the identical area. Every 20 s, forever, until the session pack budget
// tripped the download circuit breaker.
//
// The harness already mocks getVectorKeys as empty, so these fail on the old
// code and pass on the fix (presence now read from the v4 tile pile).
describe("offline tripwire — a completed area is NEVER re-downloaded", () => {
	it("second pass does NOT re-download an area whose tiles are already on disk", async () => {
		features = [point([10, 20])];
		await reconcileOnceForTest(testPorts); // pass 1 — legitimately downloads
		expect(h.downloadV4Area).toHaveBeenCalledWith(10, 20, undefined, false);

		h.downloadV4Area.mockClear();
		await reconcileOnceForTest(testPorts); // pass 2 — must be a no-op
		expect(h.downloadV4Area).not.toHaveBeenCalled();
	});

	it("stays quiet across MANY passes (the 20 s tick ran forever in the bug)", async () => {
		features = [point([11, 21])];
		await reconcileOnceForTest(testPorts);
		h.downloadV4Area.mockClear();
		for (let pass = 0; pass < 5; pass++) await reconcileOnceForTest(testPorts);
		expect(h.downloadV4Area).not.toHaveBeenCalled();
	});

	it("the ledger AGREES with the disk after a pass (hasLines true when tiles exist)", async () => {
		features = [point([12, 22])];
		await reconcileOnceForTest(testPorts);
		const rec = h.cov.get(h.key(12, 22));
		expect(rec).toBeTruthy();
		// The exact contradiction seen live: tiles on disk, ledger says no lines.
		expect(h.tiles.has(h.key(12, 22))).toBe(true);
		expect(rec?.hasLines).toBe(true);
	});

	it("still re-downloads when the tiles are genuinely GONE (self-heal intact)", async () => {
		features = [point([13, 23])];
		await reconcileOnceForTest(testPorts);
		h.downloadV4Area.mockClear();
		h.tiles.delete(h.key(13, 23)); // eviction / DB bump wiped them
		await reconcileOnceForTest(testPorts);
		expect(h.downloadV4Area).toHaveBeenCalledWith(13, 23, undefined, false);
	});
});
