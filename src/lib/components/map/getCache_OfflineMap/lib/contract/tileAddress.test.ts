/**
 * ⛔ THE BOXLESS ROADS ROW — A NaN THAT NEVER THREW.
 *
 * Roads moved to pin-addressed keys (`pin/<lng>,<lat>/<z>/<x>/<y>`) and one
 * reader was left splitting on "/" and taking the first three segments. On a
 * pin key that yields ["pin", "<lng>,<lat>", "<z>"] → z/x/y all NaN, and
 * `toGeoJSON(NaN, NaN, NaN)` returns garbage rather than throwing.
 *
 * MEASURED on the user's Greybull pin — the roads row shipped with bytes and
 * NOTHING ELSE:
 *     { "label": "roads", "bytes": 757345, "human": "740 KB" }
 * while the satellite row beside it carried nw/se/reach/offsetFromPin.
 *
 * ⚠️ WHY THIS DESERVES A TEST AND NOT A FIX ALONE. Reading a blob's CORNERS is
 * the one diagnostic that has caught every offline bug in this system (the
 * 45 km offset, the 27.9 km clip, the 50 km collision). A NaN that silently
 * blanks those corners disables the only working instrument — and it looks
 * like "the roads didn't download" when 740 KB are sitting on disk.
 */
import { describe, expect, it } from "vitest";
import { parseTileAddress } from "$osem/components/map/getCache_OfflineMap/lib/r2Worker/roads/packDownload";
import { pinTileKey } from "./grid";

describe("parseTileAddress — never emit NaN", () => {
	it("reads z/x/y out of a PIN-addressed key", () => {
		const key = pinTileKey(-108.3021, 44.4966, { ix: 49, iy: 92, z: 8 });
		expect(parseTileAddress(key)).toEqual({ z: 8, x: 49, y: 92 });
	});

	it("still reads a LEGACY bare key (a mid-migration device is not half-blind)", () => {
		expect(parseTileAddress("8/49/92")).toEqual({ z: 8, x: 49, y: 92 });
	});

	/**
	 * THE REGRESSION. The old code was `key.split("/").map(Number)` — assert the
	 * exact failure it produced, so nobody reintroduces it.
	 */
	it("⛔ the OLD parse produced NaN on a pin key — this one does not", () => {
		const key = pinTileKey(-108.3021, 44.4966, { ix: 49, iy: 92, z: 8 });
		const [oldZ] = key.split("/").map(Number);
		expect(Number.isNaN(oldZ)).toBe(true); // what shipped

		const addr = parseTileAddress(key);
		expect(addr).not.toBeNull();
		expect(Number.isFinite(addr?.z)).toBe(true);
		expect(Number.isFinite(addr?.x)).toBe(true);
		expect(Number.isFinite(addr?.y)).toBe(true);
	});

	it("returns null on junk rather than a NaN address", () => {
		for (const junk of ["", "pin/", "pin/nonsense/8/49", "a/b/c", "pin/1,2/x/y/z"])
			expect(parseTileAddress(junk)).toBeNull();
	});
});
