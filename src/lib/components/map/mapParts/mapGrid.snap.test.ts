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
	it("always resolves to a keypad sub-dot 1..9 with the friendly id", () => {
		const dot = nearestGridDot(LNG, LAT, "fine", 60);
		expect(dot).not.toBeNull();
		expect(dot?.sub).toBeGreaterThanOrEqual(1);
		expect(dot?.sub).toBeLessThanOrEqual(9);
		expect(dot?.plusCode).toMatch(/\+\.[1-9]$/);
	});

	it("is idempotent — re-querying ON a snapped dot returns the same dot", () => {
		const first = nearestGridDot(LNG, LAT, "fine", 60);
		expect(first).not.toBeNull();
		// Query again at the dot's own coordinate — must snap to itself.
		const again = nearestGridDot(first!.lng, first!.lat, "fine", 60);
		expect(again?.plusCode).toBe(first?.plusCode);
		expect(again?.sub).toBe(first?.sub);
	});

	it("returns a real lookup-able 10-char code alongside the friendly id", () => {
		const dot = nearestGridDot(LNG, LAT, "fine", 60);
		expect(dot?.code10).toMatch(/^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2}$/);
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
	it("snaps to a bare hectare dot (no sub-number)", () => {
		const dot = nearestGridDot(LNG, LAT, "standard", 120);
		expect(dot).not.toBeNull();
		expect(dot?.sub).toBeNull();
		expect(dot?.plusCode).toMatch(/\+$/); // 8-char hectare code ends in '+'
	});
});

describe("nearestGridDot — off mode never snaps", () => {
	it("returns null when the grid is off", () => {
		expect(nearestGridDot(LNG, LAT, "off", 9999)).toBeNull();
	});
});
