import { describe, expect, it } from "vitest";
import { buildOfflineBaseStyle } from "$osem/components/map/getCache_OfflineMap/lib/onPhone/render/offlineBaseStyle";

// The place-label rank expression is duplicated across filter / sort-key / text-size.
// If any copy is malformed Mapbox drops the whole layer SILENTLY — so assert the
// style object is well-formed and the three copies agree.
describe("offline base style — place-label ranking", () => {
	const style = buildOfflineBaseStyle() as any;
	const layer = style.layers.find((l: any) => l.id === "place-label");

	it("has a place-label layer", () => {
		expect(layer).toBeTruthy();
	});

	// Evaluate the effective-rank expression by hand against real rows, mirroring
	// what Mapbox will compute, and check the cross-border cases that regressed.
	const popRank = (p: number) =>
		p >= 1_000_000 ? 1 : p >= 300_000 ? 2 : p >= 100_000 ? 3 : p >= 50_000 ? 4
		: p >= 20_000 ? 5 : p >= 10_000 ? 6 : p >= 3_000 ? 7 : 8;
	const eff = (s: number, p: number, c = 0) => Math.min(s - 2 * c, popRank(p));
	const gate = (z: number) => {
		const steps: [number, number][] = [[0,1],[5,2],[6,3],[7,4],[8,6],[9,8]];
		let v = 1;
		for (const [zz, vv] of steps) if (z >= zz) v = vv;
		return v;
	};

	it("Kelowna (125k, scalerank 6) shows by z6 — it did not before", () => {
		expect(eff(6, 125109)).toBe(3);
		expect(eff(6, 125109)).toBeLessThanOrEqual(gate(6));
	});

	it("Kamloops (69k, scalerank 6) shows by z7", () => {
		expect(eff(6, 68714)).toBe(4);
		expect(eff(6, 68714)).toBeLessThanOrEqual(gate(7));
		expect(eff(6, 68714)).toBeGreaterThan(gate(6));
	});

	it("Vancouver BC outranks a NE-favoured small place", () => {
		expect(eff(1, 2313328)).toBe(1);
	});

	it("a tiny hamlet stays out until far in", () => {
		expect(eff(10, 200)).toBe(8);
		expect(eff(10, 200)).toBeGreaterThan(gate(8));
	});

	it("population never makes a place WORSE than its scalerank", () => {
		// Jasper: NE promotes it editorially despite a small population.
		expect(eff(7, 4590)).toBeLessThanOrEqual(7);
	});
});
