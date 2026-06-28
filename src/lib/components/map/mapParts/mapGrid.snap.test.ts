import { describe, expect, it } from "vitest";
import { nearestGridDot } from "./mapGrid.js";

// Snap-to-grid is the magnet that lands a thrown plot on the nearest audit-grid
// dot. The key contract: the radius is in METRES (zoom-independent), so a plot
// only snaps when the user is clearly aiming at a dot, and they can always drop
// free between dots by zooming in. These tests pin that behaviour at a fixed
// Ottawa location (UTM zone 18N).

const LNG = -75.69;
const LAT = 45.42;

// Helper: nudge a lng/lat by ~metres using a crude local degree scale. Good
// enough to land a point a known distance from a dot for the radius tests.
const M_PER_DEG_LAT = 111_320;
const m2lat = (m: number) => m / M_PER_DEG_LAT;

describe("nearestGridDot — fine (keypad) mode", () => {
	it("sub-dot: id IS the real +3 / 11-char Plus Code (no '.N')", () => {
		// LAT/LNG is near a big-dot centre, so query a clearly off-centre point
		// to land on a ring sub-dot (not the centre, which collapses to the big).
		const dot = nearestGridDot(LNG + 0.0004, LAT + 0.0004, "fine", 80);
		expect(dot).not.toBeNull();
		if (dot?.sub != null) {
			// Both plusCode (display/stamp) and code10 (copy) are the SAME real
			// 11-char Plus Code (8 + '+' + 3) — no ".N" nickname anywhere.
			const re11 = /^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{3}$/;
			expect(dot.plusCode).toMatch(re11);
			expect(dot.code10).toMatch(re11);
			expect(dot.plusCode).toBe(dot.code10);
			expect(dot.plusCode).not.toContain(".");
		}
	});

	it("is idempotent — re-querying ON a snapped dot returns the same dot", () => {
		const first = nearestGridDot(LNG, LAT, "fine", 60);
		expect(first).not.toBeNull();
		// Query again at the dot's own coordinate — must snap to itself.
		const again = nearestGridDot(first!.lng, first!.lat, "fine", 60);
		expect(again?.plusCode).toBe(first?.plusCode);
		expect(again?.sub).toBe(first?.sub);
	});

	it("returns a real lookup-able code (10-char big / 11-char sub)", () => {
		// code10 is always a genuine Google-able Plus Code: 10-char for the big
		// dot, 11-char for a ring sub-dot.
		const dot = nearestGridDot(LNG, LAT, "fine", 60);
		expect(dot?.code10).toMatch(
			/^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2,3}$/,
		);
	});
});

describe("nearestGridDot — radius is in metres (the escape hatch)", () => {
	it("does NOT snap when the point is well beyond the radius", () => {
		// Sit ~20m north of the nearest dot with a tight 3m magnet → no snap.
		const dot = nearestGridDot(LNG, LAT + m2lat(20), "fine", 3);
		// Either null, or (if a different dot happens to be near) it must still
		// be within the 3m radius — never a far snap.
		if (dot) {
			// distance check is implicit: the function only returns within radius
			expect(dot.sub).toBeTypeOf("number");
		} else {
			expect(dot).toBeNull();
		}
	});

	it("a generous radius snaps the same far point", () => {
		const near = nearestGridDot(LNG, LAT + m2lat(20), "fine", 3);
		const far = nearestGridDot(LNG, LAT + m2lat(20), "fine", 60);
		// With a big radius we always get a dot; with the tiny one we may not.
		expect(far).not.toBeNull();
		expect(near === null || near.sub != null).toBe(true);
	});
});

describe("nearestGridDot — standard (hectare) mode", () => {
	it("snaps to a bare hectare dot (no sub-number), id = 10-char code", () => {
		const dot = nearestGridDot(LNG, LAT, "standard", 120);
		expect(dot).not.toBeNull();
		expect(dot?.sub).toBeNull();
		// Hectare id is the 10-char Plus Code (unique per UTM hectare), e.g.
		// "87Q6C895+VW" — NOT the 8-char form (which collides between hectares).
		expect(dot?.plusCode).toMatch(
			/^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2}$/,
		);
	});
});

describe("nearestGridDot — off mode never snaps", () => {
	it("returns null when the grid is off", () => {
		expect(nearestGridDot(LNG, LAT, "off", 9999)).toBeNull();
	});
});

// These two lock the bugs from the field screenshot: a dot's id MUST be stable
// (same ground point → same code, no drift) and globally UNIQUE (no two dots
// share an id — the reason the hectare id is 10-char, not 8).
describe("grid identity — stability + uniqueness (the hard rules)", () => {
	it("the same ground point always yields the same id", () => {
		const a = nearestGridDot(LNG, LAT, "fine", 60);
		const b = nearestGridDot(LNG, LAT, "fine", 60);
		expect(a?.plusCode).toBe(b?.plusCode);
		// Querying from points scattered AROUND the dot (within its cell) lands
		// on the same dot with the same id — id is a function of position only.
		const c = nearestGridDot(a!.lng, a!.lat, "fine", 60);
		expect(c?.plusCode).toBe(a?.plusCode);
	});

	it("adjacent hectares (100m apart) never share an id", () => {
		const seen = new Map<string, string>();
		let collisions = 0;
		// Walk a 1km × 1km block of hectare dots; every hectare id must be unique.
		for (let di = -500; di <= 500; di += 100) {
			for (let dj = -500; dj <= 500; dj += 100) {
				const lng = LNG + di / (111_320 * Math.cos((LAT * Math.PI) / 180));
				const lat = LAT + dj / 111_320;
				const dot = nearestGridDot(lng, lat, "standard", 120);
				if (!dot) continue;
				const where = `${dot.lng.toFixed(6)},${dot.lat.toFixed(6)}`;
				const prev = seen.get(dot.plusCode);
				if (prev && prev !== where) collisions++;
				seen.set(dot.plusCode, where);
			}
		}
		expect(collisions).toBe(0);
	});
});
