/**
 * assetRegion.ts — THE REGION WINDOW for world-scale bundled assets.
 *
 * ── The problem this exists to kill ──
 * Two assets ship at world scale and were parsed whole, then held resident for
 * the life of the session:
 *
 *   places-world.json   6.2 MB   ~100k gazetteer rows
 *   urban.json          4.4 MB   11,878 Natural Earth polygons
 *
 * Raw bytes understate the cost badly. `JSON.parse` produces a BOXED object
 * graph: every `[lng, lat]` pair is a V8 array object costing ~80-100 bytes to
 * carry 16 bytes of numbers. Measured against a real session heap, those two
 * files land around ~100 MB resident — on a phone, permanently, whether or not
 * the user ever taps a fire.
 *
 * And it buys nothing. Both assets answer questions about HOTSPOTS, and hotspots
 * are already walled to 500 km from the user's anchors (fireRelevance.ts). A
 * planter in the Pasayten was holding Mumbai's urban boundary and 100,000 global
 * place names in order to label fires visible from their own truck.
 *
 * ── The fix: window at PARSE time, not at query time ──
 * Filtering after the fact does not help — the peak already happened and the
 * boxed graph is already allocated. The row/polygon must be dropped BEFORE it is
 * retained, so the only thing that survives the parse is the region in play.
 *
 * The window is deliberately much wider than the 500 km relevance wall
 * (DEFAULT_REGION_KM below). A gazetteer that stops exactly at the wall would
 * make "142 km NE of Whitecourt" go blank for a fire sitting just inside it, and
 * a place name is at its MOST useful for the fire furthest away — the one the
 * user cannot see out the window.
 *
 * ⚠️ This is a WINDOW, not a download boundary. The assets still ship whole and
 * still work with no signal; we simply refuse to keep the parts of the planet
 * the user is nowhere near. Move far enough and the window is rebuilt from the
 * same bundled file — see `regionChanged`.
 */

// The degree/km conversions come from offlineShared/geo — the ONE place that
// math lives. Nothing here re-derives a pole guard or a cos(lat) divisor.
import { degBoxAround, kmBetween } from "$osem/components/map/mapShared/kmGeo";

/**
 * Half-width of the retained window, in km.
 *
 * 1,500 km is ~3× the 500 km fire-relevance wall. Sized by what breaks at each
 * end rather than by a round number: too tight and distant-fire place names go
 * blank (the exact case where a name matters most); too loose and we are back to
 * holding a continent. At 1,500 km a BC planter keeps all of BC, Alberta,
 * Washington, Idaho and Montana — every fire the layer will ever draw for them,
 * with room for the whole drive home.
 */
export const DEFAULT_REGION_KM = 1500;

/** A lng/lat window. Degrees, west/south/east/north. */
export interface RegionBox {
	readonly w: number;
	readonly s: number;
	readonly e: number;
	readonly n: number;
}

/**
 * The retained window around a centre.
 *
 * Straight through `degBoxAround`, which owns the km→degree conversion and its
 * pole guard for the whole offline stack. Longitude degrees shrink toward the
 * poles, so the east-west span has to widen with 1/cos(lat) to stay a constant
 * number of KILOMETRES — that is exactly what `kmToDegSpan` does underneath.
 */
export function regionAround(
	centre: readonly [number, number],
	km: number = DEFAULT_REGION_KM,
): RegionBox {
	const [w, s, e, n] = degBoxAround(
		[centre[0], centre[1]] as [number, number],
		km,
	);
	return { w, s, e, n };
}

/** Is this point inside the window? */
export function inRegion(box: RegionBox, lng: number, lat: number): boolean {
	return lng >= box.w && lng <= box.e && lat >= box.s && lat <= box.n;
}

/** Does this bbox overlap the window at all? (Polygons, which have extent.) */
export function bboxInRegion(
	box: RegionBox,
	minX: number,
	minY: number,
	maxX: number,
	maxY: number,
): boolean {
	return !(maxX < box.w || minX > box.e || maxY < box.s || minY > box.n);
}

/**
 * Has the user moved far enough to need a different window?
 *
 * The threshold is HALF the window's half-width, which gives a wide hysteresis
 * band on purpose: a reload throws away the parsed asset and re-parses ~6 MB, so
 * it must answer "did we leave the region" — not "did we move". Without the
 * band, a user sitting near a boundary would re-parse on every GPS jitter, which
 * is worse than never windowing at all.
 *
 * `null` (never loaded) always counts as changed.
 */
export function regionChanged(
	loadedAt: readonly [number, number] | null,
	now: readonly [number, number],
	km: number = DEFAULT_REGION_KM,
): boolean {
	if (loadedAt === null) return true;
	return (
		kmBetween(
			[loadedAt[0], loadedAt[1]] as [number, number],
			[now[0], now[1]] as [number, number],
		) >
		km / 2
	);
}
