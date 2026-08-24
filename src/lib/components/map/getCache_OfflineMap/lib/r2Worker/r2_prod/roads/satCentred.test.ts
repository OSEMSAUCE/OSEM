/**
 * THE SATELLITE PHOTO IS CENTRED ON THE PIN.
 *
 * ── THE BUG THIS PINS ─────────────────────────────────────────────────────
 *
 * Imagery is addressed by TILE, so the composed canvas was bounded by the union
 * of whole z14 tile rectangles — a box snapped to the tile grid. The pin then
 * sat wherever it happened to fall inside that grid.
 *
 * MEASURED at the user's own anchor (lat 44.47): 166 m off, and up to 873 m in
 * the worst case — 44% of the 2 km radius. The user: "the satellite blob needs
 * to be in the center. It's that simple. It's very easy, right?"
 *
 * ⛔ THE FIX IS A CROP, NOT A BOUNDS EDIT. Shrinking only the stored `bounds`
 * squashes the image (same pixels, smaller box). The canvas extent and the
 * stored bounds are both derived from the pin's box so they shrink together.
 *
 * ⚠️ SAME ROOT CAUSE as the roads blob drawing off-centre: an extent snapped to
 * a tile grid instead of to the pin. Two subsystems, one mistake.
 */
import { describe, expect, it } from "vitest";
import { kmToDegSpan } from "$harness/components/map/mapShared/kmGeo";

/** The tile-grid box the imagery tiles cover, as the bake computes it. */
function tileGridBox(lng: number, lat: number, radiusKm: number, z: number) {
	const { dLat, dLng } = kmToDegSpan(radiusKm, lat);
	const n = 2 ** z;
	const X = (lo: number) => Math.floor(((lo + 180) / 360) * n);
	const Y = (la: number) => {
		const s = Math.sin((la * Math.PI) / 180);
		return Math.floor((0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n);
	};
	const t2lng = (x: number) => (x / n) * 360 - 180;
	const t2lat = (y: number) => {
		const m = Math.PI - (2 * Math.PI * y) / n;
		return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(m) - Math.exp(-m)));
	};
	return {
		w: t2lng(X(lng - dLng)),
		e: t2lng(X(lng + dLng) + 1),
		n: t2lat(Y(lat + dLat)),
		s: t2lat(Y(lat - dLat) + 1),
	};
}

/** The crop the bake applies — must match satelliteImage.ts exactly. */
function cropBox(lng: number, lat: number, radiusKm: number, z: number) {
	const b = tileGridBox(lng, lat, radiusKm, z);
	const span = kmToDegSpan(radiusKm, lat);
	return {
		w: Math.max(b.w, lng - span.dLng),
		e: Math.min(b.e, lng + span.dLng),
		s: Math.max(b.s, lat - span.dLat),
		n: Math.min(b.n, lat + span.dLat),
	};
}

/** Metres between a box's centre and the pin. */
function offsetM(
	box: { w: number; e: number; s: number; n: number },
	lng: number,
	lat: number,
): number {
	const dx =
		((box.w + box.e) / 2 - lng) * 111_320 * Math.cos((lat * Math.PI) / 180);
	const dy = ((box.s + box.n) / 2 - lat) * 110_574;
	return Math.hypot(dx, dy);
}

const ANCHORS: Array<[number, number]> = [
	[-111.939, 44.4744], // the user's own test pin
	[-123.1, 49.25],
	[0.0001, 0.0001],
	[19.11, 17.55],
	[-80.62, 45.374],
];

describe("the satellite photo is centred", () => {
	it("⛔ CROPPED BOX IS CENTRED ON THE PIN — within a metre", () => {
		for (const [lng, lat] of ANCHORS) {
			const off = offsetM(cropBox(lng, lat, 2, 14), lng, lat);
			expect(off, `pin ${lng},${lat} is ${off.toFixed(0)} m off centre`).toBeLessThan(1);
		}
	});

	it("the TILE-GRID box it replaces really was off-centre", () => {
		// Proves the fix is doing something, rather than asserting a tautology.
		// If this ever reads ~0, the tile grid changed and the crop may be moot.
		const worst = Math.max(
			...ANCHORS.map(([lng, lat]) => offsetM(tileGridBox(lng, lat, 2, 14), lng, lat)),
		);
		expect(worst).toBeGreaterThan(50);
	});

	it("the crop never expands past the fetched tiles", () => {
		// Cropping outward would show blank canvas where no imagery was fetched.
		for (const [lng, lat] of ANCHORS) {
			const b = tileGridBox(lng, lat, 2, 14);
			const c = cropBox(lng, lat, 2, 14);
			expect(c.w).toBeGreaterThanOrEqual(b.w);
			expect(c.e).toBeLessThanOrEqual(b.e);
			expect(c.s).toBeGreaterThanOrEqual(b.s);
			expect(c.n).toBeLessThanOrEqual(b.n);
		}
	});

	it("⛔ the bake crops the CANVAS, not just the stored bounds", async () => {
		// Shrinking `bounds` alone squashes the image. Both must derive from the
		// same crop box — asserted against the source so the two cannot drift.
		const { readFileSync } = await import("node:fs");
		const { fileURLToPath } = await import("node:url");
		const src = readFileSync(
			fileURLToPath(new URL("../../onPhone/satellite/satelliteImage.ts", import.meta.url)),
			"utf8",
		);
		expect(src).toContain("bounds: [cw, cs, ce, cn]");
		expect(src).toContain("const xExt = ((ce - cw) * Math.PI) / 180;");
		expect(src).toContain("const yTop = mercY(cn);");
	});
});
