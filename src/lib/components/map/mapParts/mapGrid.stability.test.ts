// GRID STABILITY — the lattice is a property of the EARTH, not the camera.
//
// THE LAW: updateGrid draws the same dot at the same ground coordinate with the
// same code no matter WHERE the viewport sits or where it was before. A Plus
// Code lattice is fixed by definition; a dot that hops a cell (~14m) between
// pans is lying about the ground.
//
// Field failure (2026-07-31, Rochdell Rd): panning the quality map made the
// hectare dots jump one cell N-S — the same dot popped up as "…WGH+MM" on one
// pan and "…WGH+PM" on the next. Two causes, both camera-dependence:
//   1. A rounding TIE: hectare dots were minted by snapping a block point that
//      sits EXACTLY on a cell boundary to the "nearest" cell centre — the two
//      centres are equidistant, and float noise (which varies with the viewport
//      corner the sweep started from) picked the winner.
//   2. The E-W step counted cells from the CAMERA's centre latitude, so panning
//      across a threshold latitude re-spaced the whole grid.
//
// These tests drive the REAL updateGrid through a minimal mock map and compare
// the dots drawn for many different viewports over the same ground.

import { describe, expect, it } from "vitest";
import type { FeatureCollection, Point } from "geojson";
import type { Map as MapboxMap } from "mapbox-gl";
import { nearestGridDot, setupGridSourcesAndLayers, updateGrid } from "./mapGrid.js";

// ── Minimal mock map ─────────────────────────────────────────────────────────
// Just enough surface for setupGridSourcesAndLayers + updateGrid: bounds, zoom,
// and geojson sources whose setData captures the FeatureCollection.
function mockMap(sw: { lat: number; lng: number }, ne: { lat: number; lng: number }) {
	const sources = new Map<string, { setData: (d: FeatureCollection) => void }>();
	const captured = new Map<string, FeatureCollection>();
	const map = {
		getZoom: () => 15,
		getBounds: () => ({ getSouthWest: () => sw, getNorthEast: () => ne }),
		addSource: (id: string) => {
			sources.set(id, { setData: (d) => captured.set(id, d) });
		},
		getSource: (id: string) => sources.get(id),
		addLayer: () => {
			/* layers are irrelevant here — only source data is asserted */
		},
		getLayer: () => undefined,
	};
	return { map: map as unknown as MapboxMap, captured };
}

// Run the real updateGrid for a viewport and return its hectare dots keyed by
// coordinate, valued by code.
function drawnHectares(
	sw: { lat: number; lng: number },
	ne: { lat: number; lng: number },
	mode: "standard" | "fine" = "standard",
) {
	const { map, captured } = mockMap(sw, ne);
	setupGridSourcesAndLayers(map);
	const r = updateGrid(map, mode);
	expect(r.tooDense).toBe(false);
	const fc = captured.get("audit-grid-hectare");
	const dots = new Map<string, string>();
	for (const f of fc?.features ?? []) {
		const [lng, lat] = (f.geometry as Point).coordinates;
		dots.set(`${lat.toFixed(9)},${lng.toFixed(9)}`, String(f.properties?.plusCode));
	}
	return dots;
}

// Keep only dots inside a ground box (the common area every tested viewport
// covers) so sweep-edge differences don't count.
function inBox(
	dots: Map<string, string>,
	box: { latLo: number; latHi: number; lngLo: number; lngHi: number },
) {
	const out = new Map<string, string>();
	for (const [k, code] of dots) {
		const [lat, lng] = k.split(",").map(Number);
		if (lat >= box.latLo && lat <= box.latHi && lng >= box.lngLo && lng <= box.lngHi) {
			out.set(k, code);
		}
	}
	return out;
}

describe("the drawn grid is identical for every viewport covering the same ground", () => {
	// Ground truth patch ~500m square. Two latitudes: the snap tests' Ottawa
	// anchor and the BC band where the field failure was filmed.
	const SPOTS = [
		{ lat: 45.42, lng: -75.69 },
		{ lat: 50.41, lng: -119.24 },
	];
	// Viewport offsets in degrees — deliberately awkward fractions so each run's
	// float sweep starts somewhere new (that is what flipped the old tie). Every
	// offset is small enough that the shifted viewport still CONTAINS the
	// comparison box (viewport half-height 0.012 − box half 0.0022 = 0.0098).
	const OFFSETS = [
		0, 0.0013177, -0.0027421, 0.0041893, -0.0006219, 0.0072371, -0.0084731,
		0.0002083, -0.0048999, 0.0061113,
	];

	for (const spot of SPOTS) {
		it(`hectare dots never move or change code near ${spot.lat},${spot.lng}`, () => {
			const box = {
				latLo: spot.lat - 0.0022,
				latHi: spot.lat + 0.0022,
				lngLo: spot.lng - 0.0033,
				lngHi: spot.lng + 0.0033,
			};
			let reference: Map<string, string> | null = null;
			for (const dLat of OFFSETS) {
				for (const dLng of [0, 0.0035471, -0.0058313]) {
					const sw = { lat: spot.lat - 0.012 + dLat, lng: spot.lng - 0.018 + dLng };
					const ne = { lat: spot.lat + 0.012 + dLat, lng: spot.lng + 0.018 + dLng };
					const dots = inBox(drawnHectares(sw, ne), box);
					expect(dots.size).toBeGreaterThan(6);
					if (!reference) {
						reference = dots;
						continue;
					}
					// Same ground → same dots, coordinate-identical AND code-identical.
					expect([...dots.keys()].sort()).toEqual([...reference.keys()].sort());
					for (const [k, code] of dots) expect(code).toBe(reference.get(k));
				}
			}
		});
	}

	it("fine dots never move or change code either", () => {
		const spot = SPOTS[1];
		const box = {
			latLo: spot.lat - 0.0011,
			latHi: spot.lat + 0.0011,
			lngLo: spot.lng - 0.0016,
			lngHi: spot.lng + 0.0016,
		};
		let reference: Map<string, string> | null = null;
		for (const dLat of [0, 0.0013177, -0.0027421, 0.0024893]) {
			const sw = { lat: spot.lat - 0.004 + dLat, lng: spot.lng - 0.0045 };
			const ne = { lat: spot.lat + 0.004 + dLat, lng: spot.lng + 0.0045 };
			const { map, captured } = mockMap(sw, ne);
			setupGridSourcesAndLayers(map);
			updateGrid(map, "fine");
			const dots = new Map<string, string>();
			for (const src of ["audit-grid-hectare", "audit-grid-fine"]) {
				for (const f of captured.get(src)?.features ?? []) {
					const [lng, lat] = (f.geometry as Point).coordinates;
					dots.set(`${lat.toFixed(9)},${lng.toFixed(9)}`, String(f.properties?.plusCode));
				}
			}
			const boxed = inBox(dots, box);
			expect(boxed.size).toBeGreaterThan(10);
			if (!reference) {
				reference = boxed;
				continue;
			}
			expect([...boxed.keys()].sort()).toEqual([...reference.keys()].sort());
			for (const [k, code] of boxed) expect(code).toBe(reference.get(k));
		}
	});
});

describe("E-W spacing is a property of the GROUND, not the camera's centre latitude", () => {
	// Near lat ≈46.84 the ~100m target flips between 10 and 11 cells E-W. The
	// old code chose per-VIEWPORT (centre latitude), so panning north/south
	// re-spaced every column. Two viewports whose centres straddle the
	// threshold must still agree about the band they both cover.
	it("dots in the shared band match across the 10↔11-cell threshold", () => {
		const band = { latLo: 46.828, latHi: 46.844, lngLo: -119.257, lngHi: -119.235 };
		const below = drawnHectares(
			{ lat: 46.76, lng: -119.27 },
			{ lat: 46.85, lng: -119.22 },
		);
		const above = drawnHectares(
			{ lat: 46.826, lng: -119.27 },
			{ lat: 46.92, lng: -119.22 },
		);
		const a = inBox(below, band);
		const b = inBox(above, band);
		expect(a.size).toBeGreaterThan(6);
		expect([...a.keys()].sort()).toEqual([...b.keys()].sort());
		for (const [k, code] of a) expect(code).toBe(b.get(k));
	});
});

describe("draw and tap agree — every drawn dot snaps to itself", () => {
	// nearestGridDot is the tap/magnet path; updateGrid is the draw path. They
	// must mint the SAME lattice or a tap lands where no dot is drawn.
	it("every drawn hectare dot round-trips through nearestGridDot", () => {
		for (const spot of [
			{ lat: 45.42, lng: -75.69 },
			{ lat: 50.41, lng: -119.24 },
			{ lat: 46.836, lng: -119.24 }, // the threshold band
		]) {
			const dots = drawnHectares(
				{ lat: spot.lat - 0.004, lng: spot.lng - 0.006 },
				{ lat: spot.lat + 0.004, lng: spot.lng + 0.006 },
			);
			expect(dots.size).toBeGreaterThan(6);
			for (const [k, code] of dots) {
				const [lat, lng] = k.split(",").map(Number);
				const snapped = nearestGridDot(lng, lat, "standard", 30);
				expect(snapped, `no snap at drawn dot ${code}`).not.toBeNull();
				expect(snapped?.plusCode, `tap/draw disagree at ${k}`).toBe(code);
				expect(Math.abs((snapped?.lat ?? 0) - lat)).toBeLessThan(1e-9);
				expect(Math.abs((snapped?.lng ?? 0) - lng)).toBeLessThan(1e-9);
			}
		}
	});
});
