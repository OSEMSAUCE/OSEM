/**
 * THE PHONE MUST RECEIVE THE PICTURE THE WORKER SENDS.
 *
 * ── THE MEASURED BUG ──────────────────────────────────────────────────────
 *
 * The Worker was switched to `v24-roads-as-image` and, queried live for the
 * user's Nespelem pin, returned exactly this:
 *
 *   {"total":380,"empty":0,
 *    "tiles":[{"k":"png/-119.01750,48.13640","n":32338}],
 *    "box":{"w":-119.4213203223016,"e":-118.6136796776984,
 *           "s":47.86508848011287,"n":48.40771151988714}}
 *
 * The phone had NO CODE FOR A `png/` KEY. The picture arrived, was stored under
 * a key nothing looked up, and never rendered — the user's card showed no roads
 * row at all. These tests use that exact manifest as the fixture, so the two
 * halves can never silently drift apart again.
 */
import { describe, expect, it } from "vitest";
import {
	boxFromManifest,
	imageCoordinates,
	isRoadPictureKey,
	pinOfRoadPictureKey,
	roadPictureFromManifest,
	roadPictureKey,
} from "./roadPicture";
import { boxAround, offsetFromPinKm } from "./pinBox";

/** The user's Nespelem pin, and the manifest the live Worker actually sent. */
const PIN = { lng: -119.0175, lat: 48.1364 };
const LIVE_MANIFEST = {
	total: 380,
	empty: 0,
	tiles: [{ k: "png/-119.01750,48.13640", n: 32338 }],
	box: {
		w: -119.4213203223016,
		e: -118.6136796776984,
		s: 47.86508848011287,
		n: 48.40771151988714,
	},
};

describe("the phone receives the worker's picture", () => {
	it("⛔ THE REGRESSION: a live `png/` manifest yields a placeable picture", () => {
		// This is the assertion that would have failed before any of this existed,
		// and the one that catches the next half-finished pivot.
		const pic = roadPictureFromManifest(LIVE_MANIFEST);
		expect(pic).not.toBeNull();
		expect(pic?.key).toBe("png/-119.01750,48.13640");
	});

	it("⛔ the worker's box is centred on the pin (the whole point)", () => {
		// The satellite blob measured 3-5 m. The road picture must match it —
		// that equivalence IS the fix, stated as a number.
		const pic = roadPictureFromManifest(LIVE_MANIFEST);
		expect(pic).not.toBeNull();
		if (!pic) return;
		expect(offsetFromPinKm(pic.box, PIN.lng, PIN.lat) * 1000).toBeLessThan(5);
	});

	it("⛔ phone and worker agree on the key spelling", () => {
		// A key is a lookup, so a formatting difference is a total miss with no
		// error anywhere — the exact silent shape this system keeps producing.
		expect(roadPictureKey(PIN.lng, PIN.lat)).toBe(LIVE_MANIFEST.tiles[0].k);
	});

	it("the key carries the pin back losslessly", () => {
		// Unlike a `z/x/y` address, which forgets where inside the cell you were.
		const back = pinOfRoadPictureKey(LIVE_MANIFEST.tiles[0].k);
		expect(back).not.toBeNull();
		expect(back?.lng).toBeCloseTo(PIN.lng, 5);
		expect(back?.lat).toBeCloseTo(PIN.lat, 5);
	});

	it("a vector-tile pack is NOT mistaken for a picture", () => {
		// The old format must keep working through the switchover rather than
		// throwing — otherwise the fix breaks every already-stored area.
		const old = { tiles: [{ k: "8/42/89" }], box: LIVE_MANIFEST.box };
		expect(roadPictureFromManifest(old)).toBeNull();
		expect(isRoadPictureKey("8/42/89")).toBe(false);
	});

	it("⛔ a picture with NO box is refused, never guessed", () => {
		// The previous generation of this bug GUESSED the tile's box and drew the
		// roads 89 km from the pin (measured at Timbuktu). No box → no picture.
		expect(
			roadPictureFromManifest({ tiles: [{ k: "png/1,2" }] }),
		).toBeNull();
	});

	it("⛔ a malformed box is refused rather than becoming NaN coordinates", () => {
		// A NaN camera red-screens the map. Fail loud at the boundary.
		expect(boxFromManifest(null)).toBeNull();
		expect(boxFromManifest({ w: NaN, s: 1, e: 2, n: 3 })).toBeNull();
		expect(boxFromManifest({ w: "-119", s: 1, e: 2, n: 3 })).toBeNull();
		// Inverted / zero extent places the image as a point or mirrored.
		expect(boxFromManifest({ w: 5, s: 1, e: 5, n: 3 })).toBeNull();
		expect(boxFromManifest({ w: 5, s: 1, e: 2, n: 3 })).toBeNull();
	});

	it("⛔ image corners are [NW, NE, SE, SW] — a swap mirrors silently", () => {
		// MapLibre does not validate this order; wrong order renders a mirrored
		// or rotated picture with no error at all.
		const box = boxAround(PIN.lng, PIN.lat, 30);
		const [nw, ne, se, sw] = imageCoordinates(box);
		expect(nw).toEqual([box.w, box.n]);
		expect(ne).toEqual([box.e, box.n]);
		expect(se).toEqual([box.e, box.s]);
		expect(sw).toEqual([box.w, box.s]);
		// Top corners share the north edge; left corners share the west edge.
		expect(nw[1]).toBe(ne[1]);
		expect(nw[0]).toBe(sw[0]);
		// And north is genuinely north of south (catches an inverted-Y regression).
		expect(nw[1]).toBeGreaterThan(sw[1]);
	});
	it("⛔ THE BOX IS DERIVABLE FROM THE KEY — 0 m against the LIVE worker", () => {
		// MEASURED against the real deployed Worker (v24-roads-as-image) for the
		// user's Nespelem pin: all four corners agree to 0.0 m.
		//
		// This is why nothing extra has to be persisted. The key carries the pin,
		// the pin plus the radius gives the box, and both halves compute it with
		// the same constants (see pinBox.ts). A stored box would be a SECOND copy
		// of a derivable fact — and two copies of one fact is precisely how the
		// 45 km offset happened.
		//
		// If this ever goes red, the halves have drifted: reconcile them, do not
		// start storing the box to paper over it.
		const pin = pinOfRoadPictureKey(LIVE_MANIFEST.tiles[0].k);
		expect(pin).not.toBeNull();
		if (!pin) return;
		const derived = boxAround(pin.lng, pin.lat, 30);
		expect(derived.w).toBeCloseTo(LIVE_MANIFEST.box.w, 9);
		expect(derived.e).toBeCloseTo(LIVE_MANIFEST.box.e, 9);
		expect(derived.s).toBeCloseTo(LIVE_MANIFEST.box.s, 9);
		expect(derived.n).toBeCloseTo(LIVE_MANIFEST.box.n, 9);
	});
});
