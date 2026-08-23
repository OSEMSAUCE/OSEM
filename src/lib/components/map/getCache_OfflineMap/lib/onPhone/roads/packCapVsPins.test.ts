/**
 * ⛔ THE GUARD MUST FIT THE UNIT OF WORK. THIS IS THE TEST THAT WAS MISSING.
 *
 * `downloadGuard.ts` already carried the lesson in a comment:
 *     "a budget must count the thing the user does (bake an area), never the
 *      thing the implementation happens to do (issue a request). Change the
 *      unit of work and this constant is wrong again."
 *
 * Then the unit of work changed — roads went from a SHARED grid address to a
 * PER-PIN key (grid.ts `pinTileKey`), which removed all tile sharing between
 * neighbouring pins — and nothing failed. It shipped, and within minutes:
 *
 *     DownloadBudgetError: session pack downloads 501 > cap 500
 *     ... 55 queued, bake frozen, roads row with NO box (half-written)
 *
 * ⚠️ A LATCHED BREAKER IS TERMINAL — it refuses every download for the rest of
 * the session and only a full reload clears it. So "the cap is a bit low" does
 * not degrade gracefully; it freezes the app mid-bake and draws half a map.
 * That is why this is a test and not a judgement call.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { cellsFor } from "$osem/components/map/getCache_OfflineMap/lib/contract/grid";

/** The cap, read from the source so the test cannot drift from the constant. */
function sessionPackCap(): number {
	const src = readFileSync(
		fileURLToPath(
			new URL("../store/downloadGuard.ts", import.meta.url),
		),
		"utf8",
	);
	const m = /const SESSION_PACK_CAP = (\d+);/.exec(src);
	if (!m) throw new Error("SESSION_PACK_CAP not found — did it get renamed?");
	return Number(m[1]);
}

// A realistic heavy user: a few hundred pins. The user's own device was at 260
// blobs when the breaker latched, so this is not a hypothetical scale.
const PINS = 300;

describe("the pack cap fits per-pin road keys", () => {
	it("⛔ 300 pins must not latch the breaker", () => {
		// Per-pin keying means NO sharing: every pin fetches its own cells.
		// Worst case per pin = the cells its 30 km radius touches.
		let worstCellsPerPin = 0;
		for (let i = 0; i < 40; i++) {
			// Spread sample pins across latitudes/longitudes, including the corner
			// cases (a pin near a cell corner touches the most cells).
			const lng = -180 + (360 * i) / 40 + 0.4999;
			const lat = -60 + (120 * i) / 40;
			worstCellsPerPin = Math.max(worstCellsPerPin, cellsFor(lng, lat).length);
		}
		expect(worstCellsPerPin).toBeGreaterThan(0);

		// One /pack request per PIN (the pack carries all that pin's cells), so
		// the honest count is one per pin per bake. A re-bake of the whole
		// library doubles it; allow for that.
		const needed = PINS * 2;
		expect(
			sessionPackCap(),
			`${PINS} pins re-baking need ~${needed} packs; cap is ${sessionPackCap()}. ` +
				"A latched breaker is TERMINAL — it freezes the bake and draws half a map.",
		).toBeGreaterThanOrEqual(needed);
	});

	it("the cap still catches a genuine runaway (it is not simply infinite)", () => {
		// The guard must remain a guard. A reconcile loop issues thousands per
		// minute; a human with a big library issues hundreds per pass.
		expect(sessionPackCap()).toBeLessThanOrEqual(50_000);
	});
});
