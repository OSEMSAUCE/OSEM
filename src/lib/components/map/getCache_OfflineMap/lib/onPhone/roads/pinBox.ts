/**
 * pinBox — THE PIN IS THE CENTRE. That is the entire file.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 *
 * The user, after measuring his own blobs:
 *
 *   "They both have the same center. You have two squares with the same center
 *    and the calculation is no calculation. You just put the center in the
 *    center. Same as the pin, same as satellite blob, same as the road blob."
 *
 * He is right, and his own data proved it. On ONE pin, at ONE moment:
 *
 *   satellite — offset from pin:      3 m     ✅
 *   roads     — offset from pin:  45,200 m    ⛔  (box spanned 132.6 km)
 *
 * Same pin. Same page. The difference is not math and never was:
 *
 *   • The SATELLITE blob is an IMAGE. It stores its own `bounds`, so the pin
 *     really is its centre. Nothing rounds it. 3 m.
 *
 *   • The ROAD blob is a TILE, addressed `z/x/y` on a fixed world grid drawn
 *     long before the pin existed. The pin's coordinates are used ONCE — to
 *     pick a square number — and then discarded. A z8 square is 104.6 km wide,
 *     so a pin near a corner needs two of them and the data sprawls 183 km.
 *     The square cannot centre on the pin because the square does not know the
 *     pin exists.
 *
 * ⛔ SO THE BUG IS NOT A MISCALCULATION — IT IS A STORAGE FORMAT THAT
 *    STRUCTURALLY CANNOT CENTRE ON ANYTHING. No amount of careful arithmetic
 *    inside the tile path fixes it. Do not try; that is how three days went.
 *
 * This module is the other half of the answer: given a pin and a radius, the
 * box centred on it. It is deliberately TINY and depends on nothing but
 * `geo.ts` — no IndexedDB, no downloads, no pack format, no MVT. It exists so
 * that "where should this data be?" is answerable in one place, testable in
 * isolation, and impossible to get subtly wrong inside a thousand-line file.
 *
 * ⚠️ DO NOT ADD I/O HERE. The moment this file knows how to fetch or store
 * something, it stops being checkable and becomes another place geometry can
 * drift. It takes numbers and returns numbers. That is the whole contract.
 */
import { km } from "../../contract/geo";

/** A box in degrees. `[w,s,e,n]` order matches MapLibre's `bounds` and the
 *  satellite blob's stored `bounds` — the format that already works. */
export interface Box {
	w: number;
	s: number;
	e: number;
	n: number;
}

/**
 * ⛔ THESE CONSTANTS ARE SHARED WITH THE WORKER AND MUST NOT BE "IMPROVED".
 *
 * The Worker (`workers/offline-tiles/src/grid.ts` → `radiusBox`) computes the
 * SAME box when it renders the picture. If the two disagree, the image is
 * PLACED using one box and DRAWN from another — the exact shape of every
 * geometry bug this system has had (a 1.86x stretch anchored top-left, then a
 * 45 km offset).
 *
 * MEASURED: this file first used the spherical value (111,195 m/deg, from mean
 * Earth radius) while the Worker used 110,574. Same intent, same formula, two
 * constants — and the boxes differed by 169 m north/south. Nobody would ever
 * have seen it by reading either file alone.
 *
 * 110,574 is metres per degree of latitude at the EQUATOR on the WGS-84
 * ellipsoid; 111,320 is metres per degree of longitude there. They are the
 * values the Worker already ships, so they are the values that win — being
 * IDENTICAL matters more here than being marginally more precise, and a 169 m
 * "improvement" that desynchronises the halves is a straight loss.
 *
 * `gridVsBounds.test.ts` fails if these drift apart. Reconcile both sides; do
 * not silence it.
 */
const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LNG_EQUATOR = 111_320;

/**
 * THE FUNCTION. A pin, a radius, and the box centred on it.
 *
 * "There's no formula. That's it. You just have a GPS point." — and this is
 * that, written down: go `radiusKm` north, south, east and west of the pin.
 *
 * The one wrinkle that is NOT arbitrary: a degree of longitude shrinks as you
 * move away from the equator (they converge at the poles), so the east/west
 * step divides by cos(lat). Skip it and the box is too narrow — at the user's
 * Chelan pin (47.9°N) a 30 km box would come out 20 km wide. That is the only
 * calculation in this file, and it is required by the shape of the planet, not
 * by anything in this codebase.
 */
export function boxAround(lng: number, lat: number, radiusKm: number): Box {
	if (!Number.isFinite(lng) || !Number.isFinite(lat))
		throw new Error(`boxAround: bad pin ${lng},${lat}`);
	if (!(radiusKm > 0)) throw new Error(`boxAround: bad radius ${radiusKm}`);

	const dLat = (radiusKm * 1000) / M_PER_DEG_LAT;
	// cos(lat) → 0 at the poles; clamp so a polar pin yields a wide box rather
	// than Infinity. A NaN/Infinity coordinate is what red-screens the map.
	// 0.05 matches the Worker's clamp — see the constants note above.
	const cos = Math.max(0.05, Math.cos((lat * Math.PI) / 180));
	const dLng = (radiusKm * 1000) / (M_PER_DEG_LNG_EQUATOR * cos);

	return {
		w: lng - dLng,
		e: lng + dLng,
		s: lat - dLat,
		n: lat + dLat,
	};
}

/** The box's centre. For a box from `boxAround` this returns the pin. */
export function centreOf(b: Box): { lng: number; lat: number } {
	return { lng: (b.w + b.e) / 2, lat: (b.s + b.n) / 2 };
}

/**
 * How far a box's centre sits from the pin it claims to be about — THE
 * MEASUREMENT THAT CAUGHT THE BUG. 3 m means centred; 45,200 m means the data
 * is beside the user rather than around them.
 *
 * Kept here rather than in the inspector because it is the definition of
 * "correct" for this whole system, and a definition belongs next to the thing
 * it defines.
 */
export function offsetFromPinKm(b: Box, lng: number, lat: number): number {
	const c = centreOf(b);
	return km(lng, lat, c.lng, c.lat);
}

/**
 * Distance from the pin to the box's farthest corner — the product promise as
 * a reading. "30 km of roads" stops being a claim and becomes a number.
 *
 * For a square box this is the diagonal (~1.41 × radius), NOT the radius. That
 * is expected: the corners of a square around a 30 km disc are 42 km out.
 */
export function reachKm(b: Box, lng: number, lat: number): number {
	return Math.max(
		km(lng, lat, b.w, b.n),
		km(lng, lat, b.e, b.n),
		km(lng, lat, b.w, b.s),
		km(lng, lat, b.e, b.s),
	);
}

/** Width and height in km, for reading a box at a glance. */
export function sizeKm(b: Box): { widthKm: number; heightKm: number } {
	const midLat = (b.s + b.n) / 2;
	return {
		widthKm: km(b.w, midLat, b.e, midLat),
		heightKm: km(b.w, b.s, b.w, b.n),
	};
}

/** Is this point inside the box? */
export function contains(b: Box, lng: number, lat: number): boolean {
	return lng >= b.w && lng <= b.e && lat >= b.s && lat <= b.n;
}

/** `[w,s,e,n]` — the tuple MapLibre and the satellite blob both already use. */
export function toBounds(b: Box): [number, number, number, number] {
	return [b.w, b.s, b.e, b.n];
}
