// GRID CODE HONESTY — every dot's code must be honest at its own precision.
//
// THE LAW: a dot's Plus Code is encoded from the DOT's coordinate, so the code's
// implied precision must match where the dot actually is. A `+3` (11-char) code
// warrants ~3.5m. A lattice dot is snapped, so it can be ~14m from any real fix —
// stamping `+3` on it claims precision the placement never had. Hence every dot
// (big AND fine) carries a `+2` (10-char) code: honest at ~14m, and still unique
// because dots sit 2-3 whole Plus Code cells apart.
//
// This is the "225 Prince Avenue" rule: an address is an identity label, not a
// 3.5m coordinate claim. Never print 225.364 Prince Avenue.
//
// The uniqueness half is the real hazard: fine dots must sit on WHOLE cell counts.
// At the old `STEP/3` spacing (2.33 / 3.67 cells) dots landed at arbitrary spots
// inside cells, so truncating to `+2` collided — two dots, one code.
//
// Everything here goes through nearestGridDot, the same pure snap function the
// map taps use, so the test pins real behaviour rather than a test-only seam.

import { describe, expect, it } from "vitest";
import { nearestGridDot } from "./mapGrid.js";
import { decodePlusCode } from "./plusCode.js";

// Test latitudes spanning the app's real working range (BC / Alberta forestry).
// E-W cell width is cos(lat)-dependent, so latitude is the axis most likely to
// produce a collision.
const LATS = [45.42, 49.25, 54.87, 60.0];
const LNG = -120.0;

// A generous radius so every probe lands on a dot (we're testing codes, not the
// magnet radius — mapGrid.snap.test.ts covers that).
const R = 200;

// Sweep a patch of ground and collect every distinct dot the snapper yields.
// The step is deliberately fine (~4m) so we hit every dot in the patch, and the
// patch spans more than one hectare block so we catch cross-block collisions.
function sweepDots(lat: number, lng: number) {
	const dots = new Map<string, { lat: number; lng: number; sub: number | null }>();
	const DEG_4M = 4 / 111_320;
	for (let i = -30; i <= 30; i++) {
		for (let j = -30; j <= 30; j++) {
			const d = nearestGridDot(lng + i * DEG_4M * 1.5, lat + j * DEG_4M, "fine", R);
			if (!d) continue;
			// Key by COORDINATE, so two physically distinct dots that wrongly share
			// a code both survive into the map and the uniqueness test can catch it.
			const key = `${d.lat.toFixed(9)},${d.lng.toFixed(9)}`;
			dots.set(key, { lat: d.lat, lng: d.lng, sub: d.sub });
			// plusCode and code10 must never diverge.
			expect(d.plusCode).toBe(d.code10);
		}
	}
	return [...dots.values()].map((d) => ({
		...d,
		code: nearestGridDot(d.lng, d.lat, "fine", R)?.plusCode ?? "",
	}));
}

describe("grid dot codes are +2 (10-char), never +3", () => {
	const re10 = /^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2}$/;
	for (const lat of LATS) {
		it(`every dot carries a 10-char code at lat ${lat}`, () => {
			const dots = sweepDots(lat, LNG);
			expect(dots.length).toBeGreaterThan(5);
			// In fine mode EVERY dot is a keypad position (the hectare centre is
			// sub 5), so assert we swept both the centre and off-centre ring dots —
			// that's what proves the fine lattice is actually under test.
			expect(dots.some((d) => d.sub === 5)).toBe(true);
			expect(dots.some((d) => d.sub != null && d.sub !== 5)).toBe(true);
			for (const d of dots) {
				expect(d.code, `dot at ${d.lat},${d.lng}`).toMatch(re10);
				expect(d.code).not.toContain(".");
			}
		});
	}
});

describe("fine dots stay UNIQUE once truncated to +2", () => {
	for (const lat of LATS) {
		it(`no two distinct dots share a code at lat ${lat}`, () => {
			const dots = sweepDots(lat, LNG);
			const byCode = new Map<string, { lat: number; lng: number }>();
			for (const d of dots) {
				const clash = byCode.get(d.code);
				expect(
					clash,
					`code ${d.code} claimed by two dots: (${d.lat},${d.lng}) and (${clash?.lat},${clash?.lng})`,
				).toBeUndefined();
				byCode.set(d.code, { lat: d.lat, lng: d.lng });
			}
		});
	}
});

describe("the fine lattice is UNIFORM — no wide seam between hectares", () => {
	// The eye reads a grid as regular or not. A 3x3 ring hung off each hectare
	// centre CANNOT tile evenly: the ring is +/-2 cells but hectares are 7 cells
	// apart, so gaps alternate 2,2,3 cells (27.8m inside a hectare, 41.7m at the
	// seam). That is a visibly irregular grid. The fine lattice must therefore be
	// GLOBAL — a whole-cell lattice in absolute space, not hectare-relative.
	for (const lat of LATS) {
		it(`row/column gaps are all equal at lat ${lat}`, () => {
			const dots = sweepDots(lat, LNG);
			// Distinct dot latitudes (rows) and longitudes (columns), in order.
			const rows = [...new Set(dots.map((d) => +d.lat.toFixed(7)))].sort((a, b) => a - b);
			const cols = [...new Set(dots.map((d) => +d.lng.toFixed(7)))].sort((a, b) => a - b);
			expect(rows.length).toBeGreaterThan(3);
			expect(cols.length).toBeGreaterThan(3);
			const gaps = (v: number[]) =>
				v.slice(1).map((x, i) => +((x - v[i]) / 0.000125).toFixed(4));
			// Interior gaps only — the swept patch's outer edge can be clipped.
			const rowGaps = gaps(rows).slice(1, -1);
			const colGaps = gaps(cols).slice(1, -1);
			expect(new Set(rowGaps), `N-S gaps in cells: ${rowGaps.join(",")}`).toHaveProperty(
				"size",
				1,
			);
			expect(new Set(colGaps), `E-W gaps in cells: ${colGaps.join(",")}`).toHaveProperty(
				"size",
				1,
			);
		});
	}
});

describe("codes survive Plus Code REGION boundaries", () => {
	// -120, -114, 0 … are real Plus Code region boundaries (lng+180 lands on an
	// exact multiple of 20°), so the leading characters LEGITIMATELY change across
	// them — like a street changing name at a city line. The invariant is NOT that
	// the prefix stays constant; it's that each code still decodes back to its own
	// dot. This is the check that would actually catch an off-by-half-a-cell snap,
	// which is the failure mode a prefix check only hints at.
	const BOUNDARY_LNGS = [-120.0, -114.0, -108.0, 0.0];
	for (const lng of BOUNDARY_LNGS) {
		it(`round-trips exactly across the ${lng} meridian`, () => {
			const dots = sweepDots(49.25, lng);
			expect(dots.length).toBeGreaterThan(5);
			for (const d of dots) {
				const area = decodePlusCode(d.code);
				expect(Math.abs(area.latCenter - d.lat), `lat for ${d.code}`).toBeLessThan(1e-9);
				expect(Math.abs(area.lngCenter - d.lng), `lng for ${d.code}`).toBeLessThan(1e-9);
			}
			// And they must still all be distinct across the seam.
			expect(new Set(dots.map((d) => d.code)).size).toBe(dots.length);
		});
	}
});

describe("every dot sits on a REAL Plus Code cell centre", () => {
	// This is what makes a code honest rather than merely short: the dot IS the
	// cell centre, so the cell the code names contains the dot dead-centre. A
	// fractional lattice step breaks this — the dot drifts toward a cell edge and
	// the code starts naming a cell the dot is only partly inside.
	for (const lat of LATS) {
		it(`dot centres match their decoded cell centres at lat ${lat}`, () => {
			for (const d of sweepDots(lat, LNG)) {
				const area = decodePlusCode(d.code);
				expect(
					Math.abs(area.latCenter - d.lat),
					`lat centre drift for ${d.code}`,
				).toBeLessThan(1e-9);
				expect(
					Math.abs(area.lngCenter - d.lng),
					`lng centre drift for ${d.code}`,
				).toBeLessThan(1e-9);
			}
		});
	}
});
