/**
 * anchors.ts — the canonical "where does a feature get offline blobs" map.
 *
 * ONE source of truth for the anchor points a feature bakes under. The reconcile
 * (`/mobile/offlinev4`) uses it to decide which satellite/vector areas to build;
 * the debug array (`/debug/blobs/array`) uses the SAME function to map
 * a feature back to its registry areaKeys, so membership lines up exactly instead
 * of being re-guessed per page.
 *
 * EVERY feature type gets offline data:
 *   • Point        → one blob at the point
 *   • Line         → blobs sampled ALONG it (`sampleLineAnchors`) so the whole
 *                    line is a ribbon of satellite + road discs, not one midpoint
 *   • Polygon      → ONE blob at the centroid (`polygonAnchor`) — deters huge polys
 *   • PDF / overlay→ a blob at EACH of the four `overlayBounds` corners, so an
 *                    imported sheet is covered corner-to-corner.
 * Overlap is expected; anchors dedup downstream by `satImageKey` and overlapping
 * tile discs share the ONE global deduped tile pile, so nothing bakes twice.
 */
import { kmBetween } from "$osem/components/map/mapShared/kmGeo";
import { BAKE_RADIUS_KM } from "$osem/components/map/getCache_OfflineMap/lib/onPhone/satellite/satelliteImage";

export type Pt = [number, number];

/** A geometry's centre [lng,lat] (bbox midpoint), or null if no finite coords. */
function featureCenter(geom: GeoJSON.Geometry | undefined): Pt | null {
	if (!geom) return null;
	const box = { w: Infinity, s: Infinity, e: -Infinity, n: -Infinity };
	const fold = (c: unknown): void => {
		if (Array.isArray(c) && typeof c[0] === "number") {
			const [x, y] = c as number[];
			if (Number.isFinite(x) && Number.isFinite(y)) {
				box.w = Math.min(box.w, x);
				box.e = Math.max(box.e, x);
				box.s = Math.min(box.s, y);
				box.n = Math.max(box.n, y);
			}
			return;
		}
		if (Array.isArray(c)) for (const v of c) fold(v);
	};
	fold((geom as { coordinates?: unknown }).coordinates);
	if (!Number.isFinite(box.w)) return null;
	return [(box.w + box.e) / 2, (box.s + box.n) / 2];
}

// LINE sampling step: how far apart, along a line, to drop satellite-blob anchors.
// The satellite photo is a BAKE_RADIUS_KM-radius disc (~6 km wide), so stepping
// ~1.6× the radius makes consecutive discs OVERLAP into one continuous ribbon down
// the line (never a gap). A line has no centre, so we walk its length at this step.
const LINE_SAMPLE_STEP_KM = BAKE_RADIUS_KM * 1.6;

/** Walk a polyline and drop an anchor at the start, every LINE_SAMPLE_STEP_KM,
 *  and at the end — so the whole line gets satellite+road coverage, not just one
 *  blob at its midpoint. Overlapping anchors are deduped downstream by
 *  `satImageKey` (and overlapping tile discs by the global tile pile). */
function sampleLineAnchors(coords: Pt[]): Pt[] {
	const pts = (coords ?? []).filter(
		(p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]),
	) as Pt[];
	if (pts.length === 0) return [];
	if (pts.length === 1) return [pts[0]];
	const out: Pt[] = [pts[0]];
	let acc = 0; // km accumulated since the last anchor
	for (let i = 1; i < pts.length; i++) {
		const a = pts[i - 1];
		const b = pts[i];
		const segKm = kmBetween(a, b);
		if (segKm === 0) continue;
		let t0 = 0; // fraction of THIS segment already consumed
		while (acc + (1 - t0) * segKm >= LINE_SAMPLE_STEP_KM) {
			const t = t0 + (LINE_SAMPLE_STEP_KM - acc) / segKm;
			out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
			t0 = t;
			acc = 0;
		}
		acc += (1 - t0) * segKm;
	}
	const last = pts[pts.length - 1];
	if (kmBetween(out[out.length - 1], last) > 0.01) out.push(last);
	return out;
}

/** A polygon's centroid (area-weighted, outer ring) — ONE blob, on purpose: a
 *  polygon gets a single satellite at its middle regardless of size, which deters
 *  drawing a giant polygon to vacuum up a huge offline area. Falls back to the
 *  vertex mean for a degenerate (zero-area) ring. */
function polygonAnchor(rings: Pt[][]): Pt[] {
	const outer = rings?.[0];
	if (!outer || outer.length < 3) {
		const c = featureCenter({
			type: "Polygon",
			coordinates: rings,
		} as GeoJSON.Geometry);
		return c ? [c] : [];
	}
	let a = 0;
	let cx = 0;
	let cy = 0;
	for (let i = 0, j = outer.length - 1; i < outer.length; j = i++) {
		const cross = outer[j][0] * outer[i][1] - outer[i][0] * outer[j][1];
		a += cross;
		cx += (outer[j][0] + outer[i][0]) * cross;
		cy += (outer[j][1] + outer[i][1]) * cross;
	}
	a *= 0.5;
	if (Math.abs(a) < 1e-12) {
		const mx = outer.reduce((s, p) => s + p[0], 0) / outer.length;
		const my = outer.reduce((s, p) => s + p[1], 0) / outer.length;
		return [[mx, my]];
	}
	return [[cx / (6 * a), cy / (6 * a)]];
}

/** Should this feature seed offline blobs at all? EVERY feature does — user pins,
 *  PDF/KML/KMZ maps, polygons, lines, AND Quality-704 PLOT pins. A plot is real
 *  data the surveyor put in the ground, so it earns offline coverage like anything
 *  else. The old budget worry (a planting block is wall-to-wall plots a few metres
 *  apart) is handled downstream, NOT here: `anchorsOf` gives a plot ONE point
 *  anchor, and the bake service's `note()` keys every anchor by `satImageKey`
 *  (the disc-grid cell), so all the plots in a block collapse into the ONE disc
 *  their block sits in — one blob per block, not one per plot. The single source
 *  of truth for "is this an offline anchor" — used everywhere features feed
 *  `anchorsOf`. Kept as a function (not inlined) so every call site shares this
 *  one definition if the policy ever narrows again. */
export function isBlobAnchor(_f: {
	geometry: GeoJSON.Feature | null;
}): boolean {
	return true;
}

/** The offline-coverage anchors for ANY feature — a LIST, because one blob per
 *  feature isn't enough for long geometry. See the file header for the per-type
 *  rules. Applies to imported AND created data alike (it's just geometry).
 *  NOTE: callers iterating over a feature collection should gate on
 *  {@link isBlobAnchor} first — it's the shared blob-ownership hook (today it
 *  passes every feature, plots included). */
export function anchorsOf(f: {
	geometry: GeoJSON.Feature | null;
	overlayBounds: [number, number, number, number] | null;
}): Pt[] {
	const g = f.geometry?.geometry as GeoJSON.Geometry | undefined;
	if (!g) {
		if (f.overlayBounds) {
			const [w, s, e, n] = f.overlayBounds;
			// The FOUR CORNERS of the PDF/map sheet — covers the whole imported
			// extent (the 30 km road discs from the corners fill the middle in).
			return [
				[w, s],
				[w, n],
				[e, s],
				[e, n],
			];
		}
		return [];
	}
	switch (g.type) {
		case "Point":
			return [g.coordinates as Pt];
		case "MultiPoint":
			return g.coordinates as Pt[];
		case "LineString":
			return sampleLineAnchors(g.coordinates as Pt[]);
		case "MultiLineString":
			return (g.coordinates as Pt[][]).flatMap(sampleLineAnchors);
		case "Polygon":
			return polygonAnchor(g.coordinates as Pt[][]);
		case "MultiPolygon":
			return (g.coordinates as Pt[][][]).flatMap(polygonAnchor);
		default: {
			const c = featureCenter(g);
			return c ? [c] : [];
		}
	}
}
