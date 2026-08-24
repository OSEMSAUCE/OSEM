/**
 * WHERE IS THE BLOB? — the reading that every previous bug hid behind.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 *
 * Every offline failure in this system has been the same shape: correct bytes
 * in the WRONG BOX. A cell centre sent where a pin was meant. A pin-box frame
 * written into a tile-addressed blob (MapLibre stretched it 1.86x, anchored
 * top-left). A radius reading one box while the frame clipped another.
 *
 * In EVERY one of those, the inspector looked healthy — bytes arrived, features
 * counted, size plausible — because it reported HOW MUCH and never WHERE.
 *
 * ⛔ THE CORNERS ARE THE TRUTH, THE CENTRE IS A CONVENIENCE. A box stretched
 * from its top-left still centres near the pin, so a centre reading would have
 * passed straight through the 1.86x bug. Two opposite corners pin down position
 * AND size at once. That is why the copy payload emits NW and SE, not a middle.
 */
import { describe, expect, it } from "vitest";
import { boxOfTileKey, metresBetween } from "./packDownload";

describe("blob geometry readings", () => {
	it("metresBetween matches a known distance", () => {
		// One degree of latitude is ~111.2 km everywhere. If this drifts, every
		// "reach" and "off" number on the page is quietly wrong.
		const m = metresBetween(0, 0, 0, 1);
		expect(m).toBeGreaterThan(110_000);
		expect(m).toBeLessThan(112_000);
	});

	it("a tile key's box CONTAINS the pin that generated it", () => {
		// The Darrington anchor the user was baking (Clear Creek Road, WA).
		const lng = -121.5722;
		const lat = 48.2164;
		const n = 2 ** 8;
		const x = Math.floor(((lng + 180) / 360) * n);
		const r = (lat * Math.PI) / 180;
		const y = Math.floor(
			((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n,
		);
		const box = boxOfTileKey(`8/${x}/${y}`);
		expect(box).not.toBeNull();
		if (!box) return;
		// If the addressed box does not contain its own pin, the key math and the
		// box math disagree — which is the bug class this whole reading exists for.
		expect(lng).toBeGreaterThanOrEqual(box.w);
		expect(lng).toBeLessThanOrEqual(box.e);
		expect(lat).toBeGreaterThanOrEqual(box.s);
		expect(lat).toBeLessThanOrEqual(box.n);
	});

	it("⛔ CORNERS CATCH A STRETCH THAT A CENTRE MISSES", () => {
		// THE POINT OF THE WHOLE FEATURE, as a falsifiable test.
		//
		// Take a correct box, then stretch it 1.86x anchored at its top-left —
		// the exact measured bug. The centre barely moves; the SE corner moves a
		// long way. A centre-only reading calls this healthy.
		const pinLng = -121.5722;
		const pinLat = 48.2164;
		const good = { w: -121.6, s: 48.15, e: -121.5, n: 48.25 };
		const f = 1.86;
		const bad = {
			w: good.w,
			n: good.n,
			e: good.w + (good.e - good.w) * f,
			s: good.n - (good.n - good.s) * f,
		};

		const centreOff = (b: typeof good): number =>
			metresBetween(pinLng, pinLat, (b.w + b.e) / 2, (b.s + b.n) / 2);
		const seCorner = (b: typeof good): number =>
			metresBetween(pinLng, pinLat, b.e, b.s);

		// The centre moved only a little — this is HOW THE BUG SURVIVED REVIEW.
		const centreDrift = Math.abs(centreOff(bad) - centreOff(good));
		// The SE corner moved far more. The corners are what expose it.
		const cornerDrift = Math.abs(seCorner(bad) - seCorner(good));

		expect(cornerDrift).toBeGreaterThan(centreDrift * 2);
		expect(cornerDrift).toBeGreaterThan(4_000);
	});

	it("a malformed key yields no box rather than NaN coordinates", () => {
		// Fail loud, never emit NaN as a coordinate — a NaN camera is what
		// red-screens the map (see nan-camera-getbounds-crash).
		expect(boxOfTileKey("not/a/key")).toBeNull();
		expect(boxOfTileKey("")).toBeNull();
	});
});
