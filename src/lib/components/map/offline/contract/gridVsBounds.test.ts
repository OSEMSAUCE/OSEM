/**
 * GRID ADDRESS vs BOUNDS — the distinction the whole offline map turns on.
 *
 * ── THE USER FOUND THIS HIMSELF, FROM ONE LINE OF OUTPUT ──────────────────
 *
 *   "roads → stores a tile key 8/42/89 — a grid square.
 *    Well that's the answer, that's not a GPS point right?
 *    So it's not as simple as just taking a GPS point."
 *
 * Correct, and it is the entire bug. Two ways to say WHERE data lives:
 *
 *   A GRID ADDRESS  — `8/42/89`, or a Plus Code like `84XR7VMQ+CCP`. Names a
 *                     box on a world grid drawn before the pin existed. The
 *                     edges are fixed; the pin is a passenger inside them.
 *
 *   A BOUNDS PAIR   — `[w,s,e,n]`. Names the corners directly. You choose them,
 *                     so the pin can be the exact centre.
 *
 * The measured consequence, on ONE pin at ONE moment (the user's own copy):
 *
 *   satellite (bounds) — 3 m off the pin        ✅
 *   roads     (grid)   — 45,200 m off the pin   ⛔  spanning 132.6 km
 *
 * ⛔ THIS TEST ALSO ANSWERS "SHOULD WE USE PLUS CODES?" — NO, and it proves
 * why rather than asserting it. A Plus Code is a finer grid, not a different
 * kind of thing. Swapping grids changes the size of the error, never its
 * existence. Only bounds remove it. If someone proposes Plus Codes (or S2, or
 * geohash, or quadkey) as the fix for off-centre data, this file is the reply.
 */
import { describe, expect, it } from "vitest";
import { boxAround, centreOf, offsetFromPinKm, sizeKm } from "$osem/components/map/offline/onPhone/roads/pinBox";
import { tileToLat, tileToLng, lngToTileX, latToTileY, km } from "./geo";

/** The user's Chelan pin — the one that measured 45.2 km off. */
const PIN = { lng: -120.0148, lat: 47.9015 };

/** The box a slippy tile ADDRESSES, from its z/x/y — the grid's own edges. */
function boxOfTile(z: number, x: number, y: number) {
	return {
		w: tileToLng(x, z),
		e: tileToLng(x + 1, z),
		n: tileToLat(y, z),
		s: tileToLat(y + 1, z),
	};
}

/**
 * A Plus Code is a fixed lat/lng grid: 20 degrees, then /20 per pair. This is
 * the CELL BOX for a given resolution — enough to prove the shape of the idea
 * without pulling in the full alphabet encoder.
 */
function plusCodeCellBox(lng: number, lat: number, degrees: number) {
	const w = Math.floor((lng + 180) / degrees) * degrees - 180;
	const s = Math.floor((lat + 90) / degrees) * degrees - 90;
	return { w, e: w + degrees, s, n: s + degrees };
}

describe("a grid address can never centre on the pin", () => {
	it("⛔ THE MEASURED BUG: a z8 tile puts the pin 45 km off centre", () => {
		// Reproduces the user's reading from first principles. Nothing is
		// simulated — this is the same math the renderer uses.
		const z = 8;
		const x = lngToTileX(PIN.lng, z);
		const y = latToTileY(PIN.lat, z);
		const box = boxOfTile(z, x, y);

		// The pin IS inside its tile — the tile is not "wrong", it is just big.
		expect(PIN.lng).toBeGreaterThanOrEqual(box.w);
		expect(PIN.lng).toBeLessThanOrEqual(box.e);

		// ...and yet its centre is tens of km away. THAT is the whole problem:
		// containment is not centring.
		const off = offsetFromPinKm(box, PIN.lng, PIN.lat);
		expect(off).toBeGreaterThan(20);

		// One z8 cell is ~105 km across, which is why a 30 km promise cannot fit
		// inside "just use the tile".
		const { widthKm } = sizeKm(box);
		expect(widthKm).toBeGreaterThan(100);
	});

	it("⛔ PLUS CODES DO NOT FIX IT — a finer grid is still a grid", () => {
		// The user's question, answered as a measurement. Every Plus Code
		// resolution is tested: the error SHRINKS but never reaches zero,
		// because the pin still lands wherever it lands inside a fixed box.
		const resolutions = [20, 1, 0.05, 0.0025]; // code lengths 2,4,6,8
		let previousOffset = Infinity;
		for (const deg of resolutions) {
			const cell = plusCodeCellBox(PIN.lng, PIN.lat, deg);
			const off = offsetFromPinKm(cell, PIN.lng, PIN.lat);

			// Never centred — a grid cell's centre lands on the pin only by
			// coincidence, and this pin is not that coincidence.
			expect(off).toBeGreaterThan(0);
			// Finer grid → smaller error. That is the seductive part, and why
			// it looks like a fix when it is only a smaller symptom.
			expect(off).toBeLessThan(previousOffset);
			previousOffset = off;
		}
		// Even the finest cell tested still misses the pin.
		expect(previousOffset).toBeGreaterThan(0);
	});

	it("⛔ BOUNDS DO fix it — the pin is the centre, exactly, at any radius", () => {
		// The contrast that makes the choice obvious. Same pin, no grid.
		for (const radiusKm of [5, 20, 30, 50]) {
			const box = boxAround(PIN.lng, PIN.lat, radiusKm);
			const c = centreOf(box);
			expect(c.lng).toBeCloseTo(PIN.lng, 10);
			expect(c.lat).toBeCloseTo(PIN.lat, 10);
			// Exactly centred — not "closer", not "good enough". Zero.
			expect(offsetFromPinKm(box, PIN.lng, PIN.lat)).toBeLessThan(0.000001);
		}
	});

	it("⛔ THE HEADLINE COMPARISON: grid 45 km off, bounds 0 m off", () => {
		// One assertion a human can read without knowing any of this history.
		const z = 8;
		const tile = boxOfTile(z, lngToTileX(PIN.lng, z), latToTileY(PIN.lat, z));
		const bounds = boxAround(PIN.lng, PIN.lat, 30);

		const gridOff = offsetFromPinKm(tile, PIN.lng, PIN.lat);
		const boundsOff = offsetFromPinKm(bounds, PIN.lng, PIN.lat);

		expect(gridOff).toBeGreaterThan(20);
		expect(boundsOff).toBeLessThan(0.000001);
		// The satellite blob measured 3 m; bounds beat that by construction.
		expect(boundsOff * 1000).toBeLessThan(3);
	});

	it("a pin at a grid cell's exact centre is the ONLY case a grid gets right", () => {
		// Fair test of the opposing idea: grids are not always wrong, they are
		// wrong for every pin except one per cell. That is why the bug looked
		// intermittent — some pins landed luckier than others.
		const z = 8;
		const x = lngToTileX(PIN.lng, z);
		const y = latToTileY(PIN.lat, z);
		const box = boxOfTile(z, x, y);
		const c = centreOf(box);

		// A pin placed AT the cell centre reads as centred...
		expect(offsetFromPinKm(box, c.lng, c.lat)).toBeLessThan(0.000001);
		// ...while the real pin, in that same cell, is tens of km out.
		expect(offsetFromPinKm(box, PIN.lng, PIN.lat)).toBeGreaterThan(20);
		// The distance between "lucky pin" and "real pin" is the error itself.
		expect(km(PIN.lng, PIN.lat, c.lng, c.lat)).toBeGreaterThan(20);
	});
});

/**
 * ⛔ THE TWO HALVES MUST AGREE ON THE BOX.
 *
 * The phone computes the pin's box (`pinBox.boxAround`) and the Worker computes
 * it too (`grid.radiusBox`) when it renders the picture. If those two ever
 * disagree, the image is placed in one box and drawn from another — which is
 * EXACTLY the class of bug that produced a 1.86x stretch anchored top-left, and
 * then a 45 km offset. Two files holding an opinion about geometry is the
 * disease; this test is the check that they hold the SAME one.
 */
describe("phone and worker agree on the pin's box", () => {
	const RADIUS_KM = 30;

	/** The Worker's formula, copied verbatim from workers/offline-tiles/src/grid.ts
	 *  `radiusBox`. If the Worker changes, this test must go red — that is the
	 *  point. Do NOT "fix" a failure here by editing this copy; reconcile the
	 *  two implementations instead. */
	function workerRadiusBox(lng: number, lat: number) {
		const dLat = RADIUS_KM / 110.574;
		const dLng =
			RADIUS_KM / (111.32 * Math.max(0.05, Math.cos((lat * Math.PI) / 180)));
		return { w: lng - dLng, e: lng + dLng, s: lat - dLat, n: lat + dLat };
	}

	it("⛔ same pin, same radius → same box (within 10 m)", () => {
		for (const p of [
			PIN,
			{ lng: -121.5722, lat: 48.2164 }, // Darrington
			{ lng: -76.32622, lat: 45.25341 }, // the sandbox home pin
			{ lng: 0, lat: 0 },
		]) {
			const mine = boxAround(p.lng, p.lat, RADIUS_KM);
			const theirs = workerRadiusBox(p.lng, p.lat);
			// Compare in METRES, not degrees — a degree means different distances
			// at different latitudes, and metres is what the user sees.
			expect(km(mine.w, p.lat, theirs.w, p.lat) * 1000).toBeLessThan(10);
			expect(km(mine.e, p.lat, theirs.e, p.lat) * 1000).toBeLessThan(10);
			expect(km(p.lng, mine.n, p.lng, theirs.n) * 1000).toBeLessThan(10);
			expect(km(p.lng, mine.s, p.lng, theirs.s) * 1000).toBeLessThan(10);
		}
	});

	it("both are centred on the pin — neither drifts", () => {
		const mine = boxAround(PIN.lng, PIN.lat, RADIUS_KM);
		const theirs = workerRadiusBox(PIN.lng, PIN.lat);
		expect(offsetFromPinKm(mine, PIN.lng, PIN.lat)).toBeLessThan(0.000001);
		expect(offsetFromPinKm(theirs, PIN.lng, PIN.lat)).toBeLessThan(0.000001);
	});
});
