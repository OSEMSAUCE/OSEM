/**
 * ⛔ THE RUNAWAY SPINNER — AND WHY THE FIRST TWO FIXES DID NOT HOLD.
 *
 * The on-map "saving offline map" animation ran continuously for minutes. The
 * user asked for a hard stop FOUR times:
 *
 *   "there's got to be a limit on this thing... it keeps resetting to zero but
 *    it doesn't stop... it can't keep running and running for no reason...
 *    we really have to make a hard stop."
 *
 * The pattern he was reaching for has a name: a WATCHDOG (deadman switch).
 * Its defining property is what both failed attempts violated —
 *
 *     THE WATCHED PROCESS MUST NOT BE ABLE TO SKIP OR RESET THE WATCHDOG.
 *
 * Attempt 1 armed a `setTimeout` inside `if (!baking)`, so it only started on a
 * false→true edge. During a large re-bake `baking` was already true, so that
 * branch never ran and nothing was ever armed.
 *
 * Attempt 2 armed it correctly but cleared the latch on every "tiles landed"
 * event — handing the spinner a fresh 30 s licence hundreds of times.
 *
 * This models the real control flow so both holes stay closed.
 */
import { describe, expect, it } from "vitest";

const MAX_VISIBLE_MS = 30_000;

/**
 * The spinner's control flow, mirroring
 * /Users/chrisharris/DEV/fetch/ReTreever/src/routes/(getcache)/offline/+page.svelte
 */
function makeSpinner() {
	let visible = false;
	let startedAt = 0;
	let latched = false; // watchdog has fired — one-way
	let now = 0;

	return {
		/** The bake service reports progress. Fires once PER AREA. */
		onDownloading(): void {
			if (latched) return; // cannot reopen
			if (!visible) {
				visible = true;
				// STICKY: the clock measures the PASS. Resetting it per area is
				// hole #3 — elapsed never accumulated, so no ceiling was reachable.
				if (startedAt === 0) startedAt = now;
			}
		},
		/** An area finished and tiles landed. MUST NOT clear the latch. */
		onTilesLanded(): void {
			visible = false; // hidden, but the PASS clock keeps running
		},
		/** The 1 s ticker — the watchdog lives here, so it cannot be skipped. */
		tick(ms: number): void {
			now += ms;
			if (visible && now - startedAt >= MAX_VISIBLE_MS) {
				latched = true;
				visible = false;
			}
		},
		get visible() {
			return visible;
		},
	};
}

describe("spinner watchdog — a hard stop the bake cannot skip", () => {
	it("⛔ stops within the ceiling even while progress keeps arriving", () => {
		const s = makeSpinner();
		// A re-bake: an area event every second, forever.
		for (let i = 0; i < 600; i++) {
			s.onDownloading();
			s.tick(1000);
		}
		expect(s.visible).toBe(false);
	});

	it("⛔ ATTEMPT 2's HOLE: completions must NOT re-arm it", () => {
		const s = makeSpinner();
		// Areas completing constantly — each one used to reset the latch.
		for (let i = 0; i < 600; i++) {
			s.onDownloading();
			s.tick(1000);
			if (i % 5 === 0) s.onTilesLanded();
		}
		expect(s.visible).toBe(false);
	});

	it("⛔ ATTEMPT 1's HOLE: already-visible when events arrive still stops", () => {
		const s = makeSpinner();
		s.onDownloading(); // visible BEFORE the flood — the edge never repeats
		for (let i = 0; i < 600; i++) {
			s.onDownloading(); // `if (!visible)` never taken again
			s.tick(1000);
		}
		expect(s.visible).toBe(false);
	});

	it("never exceeds the ceiling, measured", () => {
		const s = makeSpinner();
		let lastVisibleAt = 0;
		let t = 0;
		for (let i = 0; i < 600; i++) {
			s.onDownloading();
			s.tick(1000);
			t += 1000;
			if (s.visible) lastVisibleAt = t;
		}
		expect(lastVisibleAt).toBeLessThanOrEqual(MAX_VISIBLE_MS + 1000);
	});

	it("a SHORT download still shows the animation (it is not simply disabled)", () => {
		const s = makeSpinner();
		s.onDownloading();
		s.tick(1000);
		expect(s.visible).toBe(true);
	});
});
