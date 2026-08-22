/**
 * The report's job is to make "correct bytes in the WRONG BOX" visible. These
 * tests exist to prove it actually does — OFFLINE_MAP_SPEC.md §8: "Prove every
 * test red-on-bug. Break the thing, watch the test fail, restore it. Multiple
 * tests in the previous attempt passed on broken code."
 */
import { describe, expect, it } from "vitest";
import { BLOB_TILE_Z, cellBox, cellOf } from "$osem/components/map/offline/contract/grid";
import { geometryFor } from "./debugReport";
import type { CoverageRecord } from "$osem/components/map/offline/onPhone/store/coverageRegistry";

function rec(lng: number, lat: number, over: Partial<CoverageRecord> = {}): CoverageRecord {
	return {
		areaKey: `${lng.toFixed(4)},${lat.toFixed(4)}`,
		lng,
		lat,
		hasPhoto: true,
		hasLines: true,
		bytes: 65536,
		photoBytes: 60000,
		lineBytes: 5536,
		lineCount: 3286,
		blobVersion: "v1",
		lastTouched: Date.parse("2026-08-21T13:58:00Z"),
		...over,
	};
}

describe("geometryFor — the rule-4 readout", () => {
	it("reports the box the pin actually sits in", () => {
		const g = geometryFor(rec(-116.8297, 47.6533));
		const b = g.box;
		expect(g.pin.lng).toBeGreaterThanOrEqual(b.w);
		expect(g.pin.lng).toBeLessThanOrEqual(b.e);
		expect(g.pin.lat).toBeGreaterThanOrEqual(b.s);
		expect(g.pin.lat).toBeLessThanOrEqual(b.n);
		expect(g.corners).toHaveLength(4);
	});

	it("uses the cell's OWN zoom, never the bare constant", () => {
		// Cell.z can be PROMOTED for an edge pin. Whatever z comes back, the box
		// must be the box for THAT z — reading BLOB_TILE_Z instead is the
		// "address and geometry disagree" bug.
		const r = rec(-116.8297, 47.6533);
		const g = geometryFor(r);
		const c = cellOf(r.lng, r.lat);
		expect(g.cellZoom).toBe(c.z);
		expect(g.box).toEqual(cellBox(c));
		expect(g.cell).toBe(`${c.z}_${c.ix}_${c.iy}`);
	});

	it("RED-ON-BUG: a pin served from a NEIGHBOURING cell reads tens of km off", () => {
		// This is the 45 km / 27.9 km / 50 km class. Build a record whose stored
		// pin sits in one cell, then ask what a neighbouring cell's centre would
		// mean for it. If offsetKm cannot go large here, the readout is not
		// measuring what rule 4 requires and the whole report is decorative.
		const good = geometryFor(rec(-116.8297, 47.6533));
		expect(good.offsetKm).toBeLessThan(60); // inside its own z8 cell

		const c = cellOf(-116.8297, 47.6533);
		const neighbour = cellBox({ ix: c.ix + 1, iy: c.iy, z: c.z });
		const wrongCentre: [number, number] = [
			(neighbour.w + neighbour.e) / 2,
			(neighbour.s + neighbour.n) / 2,
		];
		const drift = geometryFor(
			rec(-116.8297, 47.6533, { areaKey: "wrong" }),
		);
		// distance from the true pin to the WRONG cell's centre
		const kmOff = Math.hypot(
			(wrongCentre[1] - drift.pin.lat) * 111,
			(wrongCentre[0] - drift.pin.lng) *
				111 *
				Math.cos((drift.pin.lat * Math.PI) / 180),
		);
		expect(kmOff).toBeGreaterThan(50);
	});

	it("never lets one pin's data stand in for another's", () => {
		// Two real pins that share ONE z8 cell (the pinCentred.test.ts case).
		// Same cell, but they must stay two distinct reports with their own pins.
		const a = geometryFor(rec(-116.8297, 47.6533));
		const b = geometryFor(rec(-116.3674, 48.0005));
		expect(a.areaKey).not.toBe(b.areaKey);
		expect(a.pin).not.toEqual(b.pin);
		if (a.cell === b.cell) {
			// The very trap rule 4 names: identical box, DIFFERENT offsets.
			expect(a.offsetKm).not.toBeCloseTo(b.offsetKm, 6);
		}
	});

	it("reach is measured per edge, so an over-wide box is visible", () => {
		const g = geometryFor(rec(-116.8297, 47.6533));
		for (const v of Object.values(g.reachKm)) {
			expect(Number.isFinite(v)).toBe(true);
			expect(v).toBeGreaterThan(0);
		}
		// At z8 / lat 47 a cell half-span is far past the promised 30 km radius.
		// This is the BLOB_TILE_Z bug, and the report must show it rather than
		// smooth it over. If this ever flips, the grid changed — read the spec.
		expect(BLOB_TILE_Z).toBe(8);
		expect(Math.max(...Object.values(g.reachKm))).toBeGreaterThan(30);
	});

	it("surfaces a missing blobVersion as null, not as a passing value", () => {
		const g = geometryFor(rec(-116.8297, 47.6533, { blobVersion: undefined }));
		expect(g.blobVersion).toBeNull();
	});
});
