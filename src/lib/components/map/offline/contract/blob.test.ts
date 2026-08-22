/**
 * THE SPEC, ASSERTED.
 *
 * The two questions this product must answer the same way at every zoom:
 *   "what roads are shown?"  →  everything
 *   "how far do they go?"    →  the cell (a 20 km guarantee in every direction)
 *
 * The second is proved in grid.test.ts by brute force. This file guards the
 * TILE side: that the blob is stored as ONE tile at ONE zoom, because a LIST of
 * zooms is the pyramid — the thing that made zooming out delete roads.
 */
import { describe, expect, it } from "vitest";
import {
	BLOB_DETAIL_LEVEL,
	BLOB_MAX_Z,
	BLOB_MIN_Z,
	BLOB_ZOOMS,
	cellKmAt,
	GRID_RADIUS_KM,
	tileKm,
} from "./blob";

describe("the blob's shape", () => {
	it("⛔ is stored at exactly ONE zoom — a list is the pyramid bug", () => {
		// If this ever has two entries, the map holds different data at different
		// levels again and zooming out starts deleting roads.
		expect(BLOB_ZOOMS).toHaveLength(1);
		expect(BLOB_MIN_Z).toBe(BLOB_MAX_Z);
	});

	it("⚠️ the stored zoom IS the shallowest zoom the blob is visible at", () => {
		// MapLibre only overzooms UP, so the stored zoom is a hard floor: below it
		// the map is blank, silently.
		//
		// It is z8 because ONE TILE MUST HOLD THE WHOLE RADIUS (see the law test
		// in the Worker's oneBlobIsEnough.test.ts) — that is what keeps a pin to a
		// single download. z8 is ~112 km at lat 44, comfortably over the 60 km
		// diameter.
		//
		// ⚠️ THE USER ASKED FOR "STOP AT 5" AND THIS DOES NOT DELIVER IT. Getting
		// there needs the shallow IMAGE tier in EXPLAINER.md — a picture of the
		// area instead of thousands of hairlines drawn into a speck.
		expect(BLOB_MIN_Z).toBe(8);
	});

	it("reads from a level shallower than the old z15 speed bug", () => {
		// Read COUNT is the build bottleneck (see blob.ts). z15 measured a ~65 s
		// cold build; this is the constant that governs it.
		expect(BLOB_DETAIL_LEVEL).toBeLessThan(15);
	});

	it("⛔ ONE TILE IS BIGGER THAN THE RADIUS — the whole law", () => {
		// A slippy tile narrows with cos(lat), so this is checked as a function of
		// latitude rather than as a constant. It must span the full DIAMETER, or a
		// pin near a tile edge would need a SECOND blob — which is exactly the
		// nine-blobs-per-pin failure that made the map a lottery.
		expect(cellKmAt(0)).toBeGreaterThan(cellKmAt(60));
		for (const lat of [0, 46.5, 60, 66]) {
			expect(cellKmAt(lat), `too small at lat ${lat}`).toBeGreaterThanOrEqual(
				GRID_RADIUS_KM * 2,
			);
		}
	});

	it("tileKm shrinks with zoom and with latitude", () => {
		expect(tileKm(13, 46.5)).toBeLessThan(tileKm(12, 46.5));
		expect(tileKm(13, 60)).toBeLessThan(tileKm(13, 0));
	});
});
