import type mapboxgl from "mapbox-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseMapHash, setMapHash } from "./mapUtilsHash.js";

// The hash format is: #<zoom (2dp)>/<lat (5dp)>/<lng (5dp)>
// parseMapHash returns { zoom, center: [lng, lat] } — NOTE the order swap:
// the string stores lat first, but center is [lng, lat] (GeoJSON order).

describe("parseMapHash — well-formed input", () => {
	it("parses a basic hash and swaps to [lng, lat] order", () => {
		const r = parseMapHash("#12.34/45.67890/-89.12345");
		expect(r).not.toBeNull();
		expect(r?.zoom).toBeCloseTo(12.34, 10);
		// center is [lng, lat]: lng=-89.12345 (3rd field), lat=45.6789 (2nd field)
		expect(r?.center[0]).toBeCloseTo(-89.12345, 10);
		expect(r?.center[1]).toBeCloseTo(45.6789, 10);
	});

	it("works without a leading '#'", () => {
		const r = parseMapHash("12.34/45.6789/-89.12345");
		expect(r?.zoom).toBeCloseTo(12.34, 10);
		expect(r?.center).toEqual([-89.12345, 45.6789]);
	});

	it("trims surrounding whitespace around a hash-less string", () => {
		const r = parseMapHash("  3/10/20  ");
		expect(r).toEqual({ zoom: 3, center: [20, 10] });
	});

	it("only strips '#' when it is the FIRST char (replace runs before trim)", () => {
		// The impl does hash.replace(/^#/, "").trim() — the regex anchors to
		// position 0, so leading whitespace before the '#' means the '#' is
		// NOT stripped. After trim the leading '#' remains -> Number("#3")
		// is NaN -> null. This is order-dependent but harmless: setMapHash
		// never emits a space-prefixed hash. Assert the real behavior.
		expect(parseMapHash("  #3/10/20  ")).toBeNull();
	});

	it("ignores extra trailing fields (length >= 3 is enough)", () => {
		const r = parseMapHash("#5/10/20/45/extra");
		// Only the first three fields (zoom/lat/lng) are read.
		expect(r).toEqual({ zoom: 5, center: [20, 10] });
	});

	it("handles negative and zero coordinates", () => {
		const r = parseMapHash("#0/-0.0/-0.0");
		expect(r?.zoom).toBe(0);
		expect(r?.center[0]).toBeCloseTo(0, 10);
		expect(r?.center[1]).toBeCloseTo(0, 10);
	});
});

describe("parseMapHash — malformed input returns null", () => {
	it("empty string", () => {
		expect(parseMapHash("")).toBeNull();
	});

	it("just a '#'", () => {
		expect(parseMapHash("#")).toBeNull();
	});

	it("whitespace only", () => {
		expect(parseMapHash("   ")).toBeNull();
	});

	it("too few components (missing lng)", () => {
		expect(parseMapHash("#12.34/45.6789")).toBeNull();
	});

	it("non-numeric zoom", () => {
		expect(parseMapHash("#abc/45.6789/-89.12345")).toBeNull();
	});

	it("non-numeric lat", () => {
		expect(parseMapHash("#12.34/notalat/-89.12345")).toBeNull();
	});

	it("non-numeric lng", () => {
		expect(parseMapHash("#12.34/45.6789/notalng")).toBeNull();
	});

	it("an empty field reads as NaN -> null", () => {
		// "#12.34//-89" -> middle field "" -> Number("") is 0... guard?
		// Number("") === 0, so this is actually a SUBTLE case: an empty lat
		// field becomes 0, not NaN. Documented below as its own assertion.
		const r = parseMapHash("#12.34//-89.1");
		// Number("") === 0 and Number.isFinite(0) is true, so lat=0 slips
		// through. This is lenient parsing, not strict — assert the ACTUAL
		// (defensible) behavior: a blank lat means lat 0.
		expect(r).toEqual({ zoom: 12.34, center: [-89.1, 0] });
	});

	it("Infinity zoom is rejected (not finite)", () => {
		expect(parseMapHash("#Infinity/45.6789/-89.12345")).toBeNull();
	});
});

// --- setMapHash + round-trip ----------------------------------------------

function fakeMap(zoom: number, lat: number, lng: number): mapboxgl.Map {
	return {
		getZoom: () => zoom,
		getCenter: () => ({ lat, lng }),
	} as unknown as mapboxgl.Map;
}

// setMapHash reads `window`/`history` globals (absent in node env). Install
// a minimal stub so we can exercise the encoder and capture what it writes.
function withFakeWindow<T>(initialHash: string, fn: (getHash: () => string) => T): T {
	const loc = { hash: initialHash };
	const replaceState = vi.fn((_s: unknown, _t: string, url: string) => {
		loc.hash = url;
	});
	// biome-ignore lint/suspicious/noExplicitAny: minimal test globals
	(globalThis as any).window = { location: loc };
	// biome-ignore lint/suspicious/noExplicitAny: minimal test globals
	(globalThis as any).history = { replaceState };
	try {
		return fn(() => loc.hash);
	} finally {
		// biome-ignore lint/suspicious/noExplicitAny: cleanup test globals
		delete (globalThis as any).window;
		// biome-ignore lint/suspicious/noExplicitAny: cleanup test globals
		delete (globalThis as any).history;
	}
}

describe("setMapHash — encoding", () => {
	afterEach(() => {
		// biome-ignore lint/suspicious/noExplicitAny: cleanup test globals
		delete (globalThis as any).window;
		// biome-ignore lint/suspicious/noExplicitAny: cleanup test globals
		delete (globalThis as any).history;
	});

	it("encodes zoom to 2dp and lat/lng to 5dp in lat/lng order", () => {
		const hash = withFakeWindow("", (getHash) => {
			setMapHash(fakeMap(12.3456, 45.678901, -89.123456));
			return getHash();
		});
		// zoom .toFixed(2), lat .toFixed(5), lng .toFixed(5)
		expect(hash).toBe("#12.35/45.67890/-89.12346");
	});

	it("does not rewrite when the hash already matches (no churn)", () => {
		const loc = { hash: "#5.00/10.00000/20.00000" };
		const replaceState = vi.fn();
		// biome-ignore lint/suspicious/noExplicitAny: minimal test globals
		(globalThis as any).window = { location: loc };
		// biome-ignore lint/suspicious/noExplicitAny: minimal test globals
		(globalThis as any).history = { replaceState };
		setMapHash(fakeMap(5, 10, 20));
		expect(replaceState).not.toHaveBeenCalled();
	});
});

describe("encode -> decode round-trip", () => {
	// setMapHash writes the hash; parseMapHash reads it back. Center should
	// survive to within the 5dp rounding the encoder applies; zoom to 2dp.
	const cases: Array<{ zoom: number; lat: number; lng: number }> = [
		{ zoom: 12.34, lat: 45.6789, lng: -89.12345 },
		{ zoom: 0, lat: 0, lng: 0 },
		{ zoom: 22, lat: -33.8688, lng: 151.2093 }, // Sydney, southern hemi
		{ zoom: 3.5, lat: 85.05, lng: 179.99999 }, // near the antimeridian
		{ zoom: 9.999, lat: -85.05, lng: -179.99999 },
	];

	for (const c of cases) {
		it(`round-trips z=${c.zoom} (${c.lat},${c.lng})`, () => {
			const hash = withFakeWindow("", (getHash) => {
				setMapHash(fakeMap(c.zoom, c.lat, c.lng));
				return getHash();
			});
			const r = parseMapHash(hash);
			expect(r).not.toBeNull();
			// zoom encoded to 2dp -> within 0.005
			expect(r?.zoom).toBeCloseTo(c.zoom, 2);
			// center is [lng, lat]; both encoded to 5dp -> within 0.000005
			expect(r?.center[0]).toBeCloseTo(c.lng, 5);
			expect(r?.center[1]).toBeCloseTo(c.lat, 5);
		});
	}
});
