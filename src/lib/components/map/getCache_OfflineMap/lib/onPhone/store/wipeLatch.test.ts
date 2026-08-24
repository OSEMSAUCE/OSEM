/**
 * A WIPE MUST NOT BE DEFEATED BY A READ.
 *
 * ── THE BUG THIS PINS, MEASURED LIVE ──────────────────────────────────────
 *
 * The wipe closed every cached IndexedDB handle and `gc-offlineTiles` STILL
 * came back `blocked` — while `gc-offlineSatellite` and `rt-mapRegistry`
 * deleted cleanly every time.
 *
 * The difference is that the map never stops. MapLibre requests tiles
 * continuously, and `idbGetTile` reopens the database on demand, so a read
 * landing microseconds after the closer re-established the very connection
 * that blocks `deleteDatabase`. Closing a handle cannot win a race against
 * something that reopens it.
 *
 * ⛔ THE LATCH IS THE FIX, AND IT MUST BE SEPARATE FROM `resetOfflineDbHandles`.
 * That reset is also used by sandbox toggling, where reopening is REQUIRED.
 * Merging them would break sandbox switching to fix the wipe.
 */
import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import {
	latchOfflineReadsForWipe,
	registerWipeLatch,
	resetOfflineDbHandles,
	registerOfflineDbReset,
} from "$harness/components/map/mapShared/sandboxDbNames";

describe("the wipe latch", () => {
	it("⛔ latching runs every registered reader's stop fn", () => {
		const stopped = vi.fn();
		registerWipeLatch({ latch: stopped, unlatch: () => {} });
		latchOfflineReadsForWipe();
		expect(stopped).toHaveBeenCalled();
	});

	it("⛔ the LATCH and the HANDLE RESET are separate registries", () => {
		// Sandbox toggling calls the reset and REQUIRES reads to reopen against
		// the other database name. If the latch fired there, switching into the
		// sandbox would leave the map permanently unable to read.
		const latch = vi.fn();
		const reset = vi.fn();
		registerWipeLatch({ latch, unlatch: () => {} });
		registerOfflineDbReset(reset);

		latch.mockClear();
		reset.mockClear();
		resetOfflineDbHandles();
		expect(reset).toHaveBeenCalled();
		expect(latch, "a sandbox toggle must NOT latch reads off").not.toHaveBeenCalled();
	});

	it("a throwing latch does not stop the others", () => {
		// Best-effort: one module failing must not leave the rest holding the DB
		// open, which would block the delete for a different reason.
		const bad = vi.fn(() => {
			throw new Error("boom");
		});
		const good = vi.fn();
		registerWipeLatch({ latch: bad, unlatch: () => {} });
		registerWipeLatch({ latch: good, unlatch: () => {} });
		good.mockClear();
		expect(() => latchOfflineReadsForWipe()).not.toThrow();
		expect(good).toHaveBeenCalled();
	});

	it("⛔ THE READ PATH IS UNCONDITIONAL — a latch must never gate reads", async () => {
		// THE REGRESSION THIS PINS, and it is the worse of the two failures.
		//
		// The latch originally made `idbGetTile` return null while set, to stop a
		// wipe being defeated by a reopen. It worked — and if the latch ever
		// survives (a wipe that fails on a path without an unlatch, a reload that
		// does not happen), EVERY read becomes a miss. The map then draws nothing
		// while the data sits on disk: the user hit exactly that with 6.4 MB of
		// roads stored, downloaded four minutes earlier, rendering nothing.
		//
		// A stuck wipe is recoverable — press it again. A map that silently reads
		// nothing is not: it is indistinguishable from "the download never came",
		// which cost hours of chasing the wrong layer.
		//
		// So the wipe closes the cached handle (cheap, correct) and reloads. If a
		// delete blocks again, fix it in wipe.ts — never by making the read path
		// conditional.
		const { readFileSync } = await import("node:fs");
		const { fileURLToPath } = await import("node:url");
		const src = readFileSync(
			fileURLToPath(
				new URL(
					"../../r2Worker/roads/packDownload.ts",
					import.meta.url,
				),
			),
			"utf8",
		);
		const body = src.slice(src.indexOf("export async function idbGetTile"));
		expect(body).not.toMatch(/if\s*\(\s*wipeLatched\s*\)/);
	});

});
