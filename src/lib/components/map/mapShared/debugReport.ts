/**
 * debugReport.ts — ONE snapshot of everything worth knowing about the offline
 * map, as plain JSON. A screenshot plus one of these should be a smoking gun.
 *
 * ⛔ WHY GEOMETRY, NOT JUST BYTES
 *
 * OFFLINE_MAP_SPEC.md §9 rule 4: "Every offline bug this project has had was
 * the same shape: correct bytes in the wrong box. Feature counts and byte
 * totals all looked healthy throughout." So a report that says `64 KB · 3,286
 * features` is worthless on its own — that is exactly what the 45 km, 27.9 km
 * and 50 km bugs each printed while broken. The fields that FOUND those bugs
 * are the blob's CORNERS, its REACH in km, and its OFFSET from the pin, and
 * those are mandatory here.
 *
 * ⛔ ONE AREA AT A TIME — never a viewport query.
 *
 * Same rule: "Make sure it can never report another pin's data as this pin's —
 * the equivalent check in the previous attempt queried the whole viewport, so a
 * neighbouring pin's roads made it report success." Every BlobGeometryReport
 * below is built from ONE CoverageRecord and its own areaKey. There is no
 * bounds query anywhere in this file, and there must never be one.
 *
 * ⛔ NO APP IMPORTS. THIS FILE IS THE PORTABLE UNIT.
 *
 * Rule 5: "The offline map must not import app UI components, stores, or
 * utilities. Give it a narrow, explicit interface — it needs a list of
 * {lng, lat} and nothing else." So pins arrive as a PARAMETER; this module
 * never reaches for mapStore or TinyBase. debugReport.portability.test.ts
 * fails the build if that ever changes — which is what keeps this liftable
 * into the harness without archaeology.
 */
import {
	BLOB_TILE_Z,
	GRID_RADIUS_KM,
	cellBox,
	cellOf,
	cellKey,
} from "$harness/components/map/getCache_OfflineMap/lib/contract/grid";
import { kmBetween } from "$harness/components/map/mapShared/kmGeo";
import {
	OFFLINE_BUDGET_BYTES,
	allCoverage,
	type CoverageRecord,
} from "$harness/components/map/getCache_OfflineMap/lib/onPhone/store/coverageRegistry";
import {
	getWorkerTarget,
	tilesHost,
	type WorkerTarget,
} from "$harness/components/map/getCache_OfflineMap/lib/r2Worker/tilesHost";
import {
	payloadStats,
	workStats,
	type PayloadStat,
	type WorkStat,
} from "$harness/components/map/mapShared/workMeter.svelte";

/** The schema version of the emitted JSON. Bump when a field's MEANING changes
 *  (a rename or retype), so an old file is never silently misread as a new one. */
export const DEBUG_REPORT_SCHEMA = 1 as const;

export interface LngLatPin {
	lng: number;
	lat: number;
}

/** Full geometry for ONE area. Only the newest area gets this treatment; the
 *  rest are summarised (see AreaSummary) so the file stays paste-able. */
export interface BlobGeometryReport {
	areaKey: string;
	pin: LngLatPin;
	/** The cell this pin resolves to, as `z_ix_iy`. Note the z: a pin near a
	 *  tile edge is PROMOTED to a shallower tile so its radius fits, so this is
	 *  not always BLOB_TILE_Z. Reading the constant instead of the real z is the
	 *  "address and geometry disagree" bug in miniature. */
	cell: string;
	cellZoom: number;
	/** [w,s], [e,s], [e,n], [w,n] — the box the blob was actually served in. */
	corners: [number, number][];
	box: { w: number; s: number; e: number; n: number };
	/** How far the box reaches from the pin, per edge. Compare against
	 *  gridRadiusKm: a reach of ~55 km against a promised 30 km is the bug. */
	reachKm: { n: number; s: number; e: number; w: number };
	/** Pin → centre-of-box, in km. THE detector. ~0 is healthy; tens of km is
	 *  the 45/27.9/50 km class of bug the spec names. */
	offsetKm: number;
	bytes: number;
	photoBytes: number;
	lineBytes: number;
	lineCount: number;
	hasPhoto: boolean;
	hasLines: boolean;
	/** The blob-geometry signature this area was built under. `null` means the
	 *  record predates versioning — treated as stale by the reconcile. */
	blobVersion: string | null;
	lastTouched: string;
}

/** One compact line per area. No corners array — that is what keeps a few
 *  hundred areas inside a file you can paste into a chat. offsetKm survives
 *  the squeeze because scanning it down the list is how a SYSTEMIC
 *  mis-boxing shows up (every area wrong the same way). */
export interface AreaSummary {
	areaKey: string;
	lng: number;
	lat: number;
	offsetKm: number;
	bytes: number;
	lineCount: number;
	hasPhoto: boolean;
	hasLines: boolean;
	/** blobVersion missing or != the version this area should hold. */
	stale: boolean;
	lastTouched: string;
}

export interface DebugReport {
	schema: typeof DEBUG_REPORT_SCHEMA;
	capturedAt: string;
	route: string;
	env: {
		tilesHost: string;
		/** WHICH worker served this session — production / localDev.
		 *  Without it a report is ambiguous: identical-looking bad output from
		 *  the two could be different bugs. */
		workerTarget: WorkerTarget;
		blobTileZ: number;
		gridRadiusKm: number;
		userAgent: string;
		devicePixelRatio: number;
	};
	contamination: { tabs: number; peers: number; contaminated: boolean };
	heap: {
		nowMb: number | null;
		lowMb: number | null;
		peakMb: number | null;
		sinceLoadMb: number | null;
		/** Kept as a FIELD, not panel prose: performance.memory reports this
		 *  realm only. On the offline route the workers hold more than the page,
		 *  which is precisely why an 800 MB defect hid for weeks. */
		note: string;
	};
	/** Which map layers were visible when this was captured. A heap number
	 *  without this is uninterpretable — "310 MB" means nothing until you know
	 *  whether satellite was on. */
	layers: { key: string; on: boolean }[];
	bake: {
		on: boolean;
		pending: number;
		failing: number;
		secs: number;
		stalled: boolean;
		note: string;
	};
	work: WorkStat[];
	payloads: PayloadStat[];
	budget: { usedBytes: number; totalBytes: number; areas: number };
	/** The newest area, in full. "The latest blob." */
	latest: BlobGeometryReport | null;
	areas: AreaSummary[];
	/** Pins known to the caller but with NO coverage record — i.e. features the
	 *  bake has not covered. Empty is healthy; a long list on a settled app is
	 *  itself the finding. */
	uncoveredPins: LngLatPin[];
}

export const HEAP_NOTE =
	"main thread only — workers NOT counted; see DevTools → Memory for the total";

/** Geometry for ONE record, derived from ITS OWN key alone. */
export function geometryFor(rec: CoverageRecord): BlobGeometryReport {
	// cellOf may PROMOTE an edge pin to a shallower zoom; cellBox reads c.z, so
	// box and address can never disagree here.
	const c = cellOf(rec.lng, rec.lat);
	const b = cellBox(c);
	const centre: [number, number] = [(b.w + b.e) / 2, (b.s + b.n) / 2];
	const pin: [number, number] = [rec.lng, rec.lat];

	return {
		areaKey: rec.areaKey,
		pin: { lng: rec.lng, lat: rec.lat },
		cell: cellKey(c),
		cellZoom: c.z,
		corners: [
			[b.w, b.s],
			[b.e, b.s],
			[b.e, b.n],
			[b.w, b.n],
		],
		box: { w: b.w, s: b.s, e: b.e, n: b.n },
		reachKm: {
			n: kmBetween(pin, [rec.lng, b.n]),
			s: kmBetween(pin, [rec.lng, b.s]),
			e: kmBetween(pin, [b.e, rec.lat]),
			w: kmBetween(pin, [b.w, rec.lat]),
		},
		offsetKm: kmBetween(pin, centre),
		bytes: rec.bytes ?? 0,
		photoBytes: rec.photoBytes ?? 0,
		lineBytes: rec.lineBytes ?? 0,
		lineCount: rec.lineCount ?? 0,
		hasPhoto: !!rec.hasPhoto,
		hasLines: !!rec.hasLines,
		blobVersion: rec.blobVersion ?? null,
		lastTouched: new Date(rec.lastTouched).toISOString(),
	};
}

function summarise(rec: CoverageRecord, currentVersion: string | null): AreaSummary {
	const g = geometryFor(rec);
	return {
		areaKey: g.areaKey,
		lng: g.pin.lng,
		lat: g.pin.lat,
		offsetKm: g.offsetKm,
		bytes: g.bytes,
		lineCount: g.lineCount,
		hasPhoto: g.hasPhoto,
		hasLines: g.hasLines,
		stale:
			g.blobVersion === null ||
			(currentVersion !== null && g.blobVersion !== currentVersion),
		lastTouched: g.lastTouched,
	};
}

/** Live readings the panel already holds. Passed IN rather than read from a
 *  store, so this module stays free of Svelte state and stays portable. */
export interface LivePanelState {
	route?: string;
	tabs?: number;
	peers?: number;
	heapNowMb?: number | null;
	heapLowMb?: number | null;
	heapPeakMb?: number | null;
	heapAtLoadMb?: number | null;
	bakeOn?: boolean;
	bakePending?: number;
	bakeFailing?: number;
	bakeSecs?: number;
	bakeStalled?: boolean;
	bakeNote?: string;
	layers?: { key: string; on: boolean }[];
	/** Every pin the caller knows about. Rule 5's "list of {lng,lat} and
	 *  nothing else" — used ONLY to report which pins lack coverage. */
	pins?: LngLatPin[];
	/** The blob signature areas SHOULD hold, for the stale flag. */
	currentBlobVersion?: string | null;
}

/**
 * Build the whole report. Reads the coverage registry (its own IndexedDB) and
 * the work meter; everything else arrives via `live`.
 */
export async function collectDebugReport(
	live: LivePanelState = {},
): Promise<DebugReport> {
	const records = await allCoverage();
	// Newest first — "the latest blob" is the head of this list.
	const sorted = [...records].sort(
		(a, b) => (b.lastTouched ?? 0) - (a.lastTouched ?? 0),
	);
	const version = live.currentBlobVersion ?? null;

	const usedBytes = sorted.reduce((n, r) => n + (r.bytes ?? 0), 0);

	// Which known pins have no record at all. Matched on the SAME 4dp key the
	// satellite baker writes, so this can't drift from how areas are stored.
	const haveKeys = new Set(sorted.map((r) => r.areaKey));
	const uncoveredPins = (live.pins ?? []).filter(
		(p) => !haveKeys.has(`${p.lng.toFixed(4)},${p.lat.toFixed(4)}`),
	);

	const tabs = live.tabs ?? 1;
	const peers = live.peers ?? 0;

	return {
		schema: DEBUG_REPORT_SCHEMA,
		capturedAt: new Date().toISOString(),
		route: live.route ?? "unknown",
		env: {
			tilesHost: tilesHost(),
			workerTarget: getWorkerTarget(),
			blobTileZ: BLOB_TILE_Z,
			gridRadiusKm: GRID_RADIUS_KM,
			userAgent:
				typeof navigator === "undefined" ? "" : navigator.userAgent,
			devicePixelRatio:
				typeof window === "undefined" ? 1 : window.devicePixelRatio,
		},
		contamination: {
			tabs,
			peers,
			contaminated: tabs > 1 || peers > 0,
		},
		heap: {
			nowMb: live.heapNowMb ?? null,
			lowMb: live.heapLowMb ?? null,
			peakMb: live.heapPeakMb ?? null,
			sinceLoadMb:
				live.heapNowMb != null && live.heapAtLoadMb != null
					? live.heapNowMb - live.heapAtLoadMb
					: null,
			note: HEAP_NOTE,
		},
		layers: live.layers ?? [],
		bake: {
			on: live.bakeOn ?? false,
			pending: live.bakePending ?? 0,
			failing: live.bakeFailing ?? 0,
			secs: live.bakeSecs ?? 0,
			stalled: live.bakeStalled ?? false,
			note: live.bakeNote ?? "",
		},
		work: workStats(),
		payloads: payloadStats(),
		budget: {
			usedBytes,
			totalBytes: OFFLINE_BUDGET_BYTES,
			areas: sorted.length,
		},
		latest: sorted.length > 0 ? geometryFor(sorted[0]) : null,
		areas: sorted.map((r) => summarise(r, version)),
		uncoveredPins,
	};
}

/** Stable filename for a saved report. */
export function debugReportFilename(at = new Date()): string {
	return `getcache-debug-${at.toISOString().replace(/[:.]/g, "-")}.json`;
}
