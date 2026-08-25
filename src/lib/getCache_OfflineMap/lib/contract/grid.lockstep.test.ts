/**
 * THE GRID MUST BE THE SAME FILE ON BOTH SIDES — byte for byte.
 *
 * The Worker decides which cell it BUILT; the phone decides which cell to ASK
 * FOR and where to draw it. If those two disagree by so much as a rounding
 * rule, the phone requests a cell the Worker never built and the map is blank —
 * silently, with no error anywhere, which is the failure mode this whole
 * subsystem keeps producing.
 *
 * The old guard SCRAPED the Worker's source for `BLOB_KM = 30` with a regex.
 * That could only ever check a constant, and the cell math — the row-banded
 * longitude step, the neighbour resolution — is where the real disagreement
 * would live. So this compares the FILES, not a number in them.
 *
 * ⚠️ If this fails, do not "fix" it by editing one copy. Copy the Worker's file
 * over the client's (or vice versa) so they are one definition again:
 *
 *     cp workers/offline-tiles/src/grid.ts harness/src/lib/map/getCache_OfflineMap/lib/contract/grid.ts
 *
 * They are two files only because the Worker and the app are separate build
 * roots with no shared package — not because they are allowed to differ.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BLOB_TILE_Z, GRID_RADIUS_KM, cellOf, cellsFor } from "./grid";

const workerGrid = fileURLToPath(
	// The client grid now lives in the harness (the engine's home); the Worker lives
	// in the PARENT repo, so this climbs out of the submodule. 7 levels:
	// contract → offline → map → components → lib → src → the harness → ReTreever root.
	new URL(
		"../../../../../../workers/offline-tiles/src/grid.ts",
		import.meta.url,
	),
);
const clientGrid = fileURLToPath(new URL("./grid.ts", import.meta.url));

describe("the grid is ONE definition", () => {
	it("⛔ the Worker's grid.ts and the client's are IDENTICAL", () => {
		const worker = readFileSync(workerGrid, "utf8");
		const client = readFileSync(clientGrid, "utf8");
		expect(client).toBe(worker);
	});

	it("the cell zoom and the radius are both real numbers", () => {
		// A sanity anchor so a future edit that guts one is caught here rather
		// than on a phone in the bush.
		expect(BLOB_TILE_Z).toBeGreaterThanOrEqual(8);
		expect(GRID_RADIUS_KM).toBeGreaterThan(0);
	});

	it("a real anchor resolves to a cell and a small cell list", () => {
		// The user's own test anchor. Not a property test — a smoke check that the
		// module is wired up and returns something sane at a real place.
		const cells = cellsFor(-111.5, 46.6);
		expect(cells.length).toBeGreaterThanOrEqual(1);
		expect(cells.length).toBeLessThanOrEqual(25);
		expect(cells[0]).toEqual(cellOf(-111.5, 46.6));
	});
});
