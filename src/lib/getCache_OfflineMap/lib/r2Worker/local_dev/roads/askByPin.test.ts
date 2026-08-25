/**
 * THE SERVER MUST BE ASKED ABOUT THE PIN — NOT ABOUT ITS CELL.
 *
 * ── THE BUG THIS PINS ─────────────────────────────────────────────────────
 *
 * The pack URL used to carry the CELL CENTRE instead of the pin, as a
 * cache-sharing optimisation: two pins in one cell produced one URL and shared
 * an edge-cache entry. It worked, and it silently moved the data — the Worker
 * builds 30 km around WHATEVER POINT IT IS GIVEN.
 *
 * MEASURED at the user's Timbuktu pin (-2.92565, 16.7277): it sat 12 km from
 * the cell's east edge, so the cell centre was 63 km WEST — and the roads drew
 * ~70 km west of him. "Nope, still missing. It's 70 kilometers to the west."
 *
 * ⛔ THE LESSON: a cache key may be DERIVED from the request, but must never
 * REPLACE it. Every layer downstream was verified correct while the input was
 * quietly wrong, which is why this survived a whole evening of fixes.
 */
import { describe, expect, it } from "vitest";
import { cellBox, cellOf, cellTileKey } from "../../../contract/grid";

/** Km between two lng/lat points. */
function km(lng1: number, lat1: number, lng2: number, lat2: number): number {
	const dLat = (lat2 - lat1) * 110.574;
	const dLng =
		(lng2 - lng1) * 111.32 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
	return Math.hypot(dLat, dLng);
}

const PINS: Array<[number, number, string]> = [
	[-2.92565, 16.7277, "Timbuktu (near a cell corner)"],
	[-115.4419, 41.905, "Nevada"],
	[-76.168, 45.061, "Ontario"],
	[0.001, 0.001, "equator"],
];

describe("the pack is asked about the PIN", () => {
	it("⛔ the URL carries the PIN, never the cell centre", async () => {
		const { readFileSync } = await import("node:fs");
		const { fileURLToPath } = await import("node:url");
		const src = readFileSync(
			fileURLToPath(new URL("./packDownload.ts", import.meta.url)),
			"utf8",
		);
		expect(src).toContain("const qLng = lng.toFixed(6);");
		expect(src).toContain("const qLat = lat.toFixed(6);");
		// The cell-centre spelling is the bug. It must not come back.
		expect(src).not.toContain("(box.w + box.e) / 2");
		expect(src).not.toContain("(box.s + box.n) / 2");
	});

	it("⛔ the cell centre is FAR from a pin near an edge — why it mattered", () => {
		// Documents the size of the error rather than asserting a tautology: if a
		// future cell size makes this small, the optimisation might be revisited.
		const [lng, lat] = PINS[0];
		const b = cellBox(cellOf(lng, lat));
		const off = km(lng, lat, (b.w + b.e) / 2, (b.s + b.n) / 2);
		expect(off).toBeGreaterThan(50);
	});

	it("the pin and the server agree on the storage key", () => {
		// Both sides derive the key from the SAME point now, so a blob is always
		// stored under the address the map asks for. A mismatch here is a blank
		// map with no error — this subsystem's signature failure.
		for (const [lng, lat, name] of PINS) {
			const clientKey = cellTileKey(cellOf(lng, lat));
			// The Worker is sent the pin, so it computes the identical cell.
			const serverKey = cellTileKey(cellOf(Number(lng.toFixed(6)), Number(lat.toFixed(6))));
			expect(serverKey, name).toBe(clientKey);
		}
	});

	it("rounding the URL to 6dp never moves the pin to another cell", () => {
		// 6dp is ~11 cm. A pin sitting exactly on a cell boundary must not round
		// across it, or the client and server would key differently.
		for (const [lng, lat] of PINS) {
			const exact = cellTileKey(cellOf(lng, lat));
			const rounded = cellTileKey(
				cellOf(Number(lng.toFixed(6)), Number(lat.toFixed(6))),
			);
			expect(rounded).toBe(exact);
		}
	});
});
