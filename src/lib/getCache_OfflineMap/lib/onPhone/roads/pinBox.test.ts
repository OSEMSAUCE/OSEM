/**
 * THE PIN IS THE CENTRE — asserted with the user's OWN measured numbers.
 *
 * These fixtures are not invented. They are two blobs the user copied off his
 * own screen, one pin, one moment:
 *
 *   satellite  offset from pin      3 m   ✅  (an image, stores its own bounds)
 *   roads      offset from pin 45,200 m   ⛔  (a tile, addressed on a world grid)
 *
 * The satellite number is the SPEC. Anything this module produces must sit on
 * the pin the way the satellite blob already does — and the road number is the
 * regression these tests exist to make impossible to ship again.
 */
import { describe, expect, it } from "vitest";
import {
	boxAround,
	centreOf,
	contains,
	offsetFromPinKm,
	reachKm,
	sizeKm,
	toBounds,
} from "./pinBox";

/** The user's Chelan pin — the one that measured 45.2 km off. */
const CHELAN = { lng: -120.0148, lat: 47.9015 };
/** The user's Darrington pin. */
const DARRINGTON = { lng: -121.5722, lat: 48.2164 };

describe("the pin is the centre", () => {
	it("⛔ THE WHOLE POINT: the box's centre IS the pin", () => {
		// "You just put the center in the center." Exactly zero, not 45.2 km.
		for (const p of [CHELAN, DARRINGTON]) {
			const b = boxAround(p.lng, p.lat, 30);
			const c = centreOf(b);
			expect(c.lng).toBeCloseTo(p.lng, 10);
			expect(c.lat).toBeCloseTo(p.lat, 10);
			expect(offsetFromPinKm(b, p.lng, p.lat)).toBeLessThan(0.001);
		}
	});

	it("⛔ beats the satellite blob's measured 3 m, at every pin", () => {
		// The satellite blob is the benchmark because it already works. A
		// pin-centred box is exact arithmetic, so it must beat a baked image.
		for (const p of [CHELAN, DARRINGTON]) {
			const b = boxAround(p.lng, p.lat, 30);
			expect(offsetFromPinKm(b, p.lng, p.lat) * 1000).toBeLessThan(3);
		}
	});

	it("⛔ THE 45.2 km REGRESSION — a 30 km box is never 132 km across", () => {
		// The measured failure: roads reached 132.6 km and spanned 58 x 183 km,
		// because a z8 TILE is 104.6 km wide and the pin needed two of them.
		// A pin-centred box has no grid, so it cannot inherit a square's edges.
		const b = boxAround(CHELAN.lng, CHELAN.lat, 30);
		const { widthKm, heightKm } = sizeKm(b);
		expect(widthKm).toBeGreaterThan(59);
		expect(widthKm).toBeLessThan(61);
		expect(heightKm).toBeGreaterThan(59);
		expect(heightKm).toBeLessThan(61);
		// Farthest corner of a 30 km box is the diagonal (~42 km), NOT 132.6 km.
		expect(reachKm(b, CHELAN.lng, CHELAN.lat)).toBeLessThan(43);
	});

	it("longitude is corrected for latitude — or the box is too narrow", () => {
		// The ONE calculation in the module, and it is the planet's fault. At
		// 47.9 N a degree of longitude is ~2/3 of a degree of latitude, so
		// skipping cos(lat) yields a box ~20 km wide instead of 60.
		const b = boxAround(CHELAN.lng, CHELAN.lat, 30);
		const { widthKm, heightKm } = sizeKm(b);
		expect(widthKm / heightKm).toBeGreaterThan(0.97);
		expect(widthKm / heightKm).toBeLessThan(1.03);
		// The raw degree spans must therefore DIFFER, even though the km match.
		expect(b.e - b.w).toBeGreaterThan((b.n - b.s) * 1.3);
	});

	it("the pin is inside its own box, and near-corner pins stay centred", () => {
		// The tile path's core failure was that a pin near a square's corner got
		// a box sprawling away from it. There is no corner to be near here.
		for (const p of [CHELAN, DARRINGTON]) {
			const b = boxAround(p.lng, p.lat, 30);
			expect(contains(b, p.lng, p.lat)).toBe(true);
		}
	});

	it("emits [w,s,e,n] — the format the working blob already uses", () => {
		// The satellite blob stores exactly this tuple, and it is 3 m accurate.
		// Matching it means the road path can be positioned the same way.
		const b = boxAround(CHELAN.lng, CHELAN.lat, 30);
		const [w, s, e, n] = toBounds(b);
		expect(w).toBeLessThan(e);
		expect(s).toBeLessThan(n);
		expect((w + e) / 2).toBeCloseTo(CHELAN.lng, 10);
		expect((s + n) / 2).toBeCloseTo(CHELAN.lat, 10);
	});

	it("refuses bad input loudly instead of emitting NaN", () => {
		// A NaN coordinate red-screens the map (nan-camera-getbounds-crash).
		// Fail at the source, never downstream.
		expect(() => boxAround(NaN, 47.9, 30)).toThrow();
		expect(() => boxAround(-120, NaN, 30)).toThrow();
		expect(() => boxAround(-120, 47.9, 0)).toThrow();
		expect(() => boxAround(-120, 47.9, -5)).toThrow();
	});

	it("survives a polar pin without producing Infinity", () => {
		const b = boxAround(0, 89.9, 30);
		for (const v of [b.w, b.s, b.e, b.n]) expect(Number.isFinite(v)).toBe(true);
	});
});
