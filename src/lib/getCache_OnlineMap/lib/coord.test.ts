import { describe, expect, it } from "vitest";
import {
	type Coord,
	isCoord,
	toCoord,
	toCoordFromArray,
	toCoordFromFeature,
	toCoordFromLngLat,
} from "./coord.js";

// This module is a NaN-defence boundary: bad coordinates must never produce a
// Coord. A NaN reaching Mapbox's projection math corrupts the entire map, so
// these tests assert REJECTION (null) hard. Any value that slips through is a
// real bug — assertions stay asserting safe behaviour.

describe("toCoord — valid inputs pass through", () => {
	it("accepts a finite in-range lng/lat and returns the tuple", () => {
		const c = toCoord(-123.1, 49.2);
		expect(c).toEqual([-123.1, 49.2]);
	});

	it("accepts the origin", () => {
		expect(toCoord(0, 0)).toEqual([0, 0]);
	});

	it("accepts the exact boundary values (inclusive range)", () => {
		expect(toCoord(-180, -90)).toEqual([-180, -90]);
		expect(toCoord(180, 90)).toEqual([180, 90]);
		expect(toCoord(180, -90)).toEqual([180, -90]);
		expect(toCoord(-180, 90)).toEqual([-180, 90]);
	});

	it("accepts negative zero", () => {
		expect(toCoord(-0, -0)).toEqual([-0, -0]);
	});
});

describe("toCoord — NaN / Infinity defence (the whole point)", () => {
	it("rejects NaN lng", () => {
		expect(toCoord(Number.NaN, 49)).toBeNull();
	});

	it("rejects NaN lat", () => {
		expect(toCoord(-123, Number.NaN)).toBeNull();
	});

	it("rejects NaN in both", () => {
		expect(toCoord(Number.NaN, Number.NaN)).toBeNull();
	});

	it("rejects Infinity", () => {
		expect(toCoord(Number.POSITIVE_INFINITY, 49)).toBeNull();
		expect(toCoord(-123, Number.POSITIVE_INFINITY)).toBeNull();
	});

	it("rejects -Infinity", () => {
		expect(toCoord(Number.NEGATIVE_INFINITY, 49)).toBeNull();
		expect(toCoord(-123, Number.NEGATIVE_INFINITY)).toBeNull();
	});
});

describe("toCoord — non-number inputs are rejected", () => {
	it("rejects undefined", () => {
		expect(toCoord(undefined, undefined)).toBeNull();
		expect(toCoord(-123, undefined)).toBeNull();
		expect(toCoord(undefined, 49)).toBeNull();
	});

	it("rejects null", () => {
		expect(toCoord(null, null)).toBeNull();
		expect(toCoord(-123, null)).toBeNull();
	});

	it("rejects numeric strings (no coercion)", () => {
		expect(toCoord("-123", "49")).toBeNull();
		expect(toCoord("-123.1", 49)).toBeNull();
	});

	it("rejects empty strings", () => {
		// "" coerces to 0 under +"", which would be a valid coord — the factory
		// must NOT coerce. typeof "" !== "number" so it's rejected.
		expect(toCoord("", "")).toBeNull();
	});

	it("rejects booleans, objects, arrays", () => {
		expect(toCoord(true, false)).toBeNull();
		expect(toCoord({}, {})).toBeNull();
		expect(toCoord([1], [2])).toBeNull();
	});
});

describe("toCoord — out-of-range is rejected (not clamped)", () => {
	it("rejects lng beyond +-180", () => {
		expect(toCoord(180.0001, 0)).toBeNull();
		expect(toCoord(-180.0001, 0)).toBeNull();
		expect(toCoord(360, 0)).toBeNull();
	});

	it("rejects lat beyond +-90", () => {
		expect(toCoord(0, 90.0001)).toBeNull();
		expect(toCoord(0, -90.0001)).toBeNull();
		expect(toCoord(0, 91)).toBeNull();
	});

	it("rejects a swapped lng/lat that pushes lat out of range", () => {
		// A classic bug: lng=-123 placed in the lat slot. -123 < -90 -> rejected.
		expect(toCoord(49, -123)).toBeNull();
	});
});

describe("toCoordFromLngLat", () => {
	it("accepts a valid {lng,lat} object", () => {
		expect(toCoordFromLngLat({ lng: -123, lat: 49 })).toEqual([-123, 49]);
	});

	it("rejects null / undefined", () => {
		expect(toCoordFromLngLat(null)).toBeNull();
		expect(toCoordFromLngLat(undefined)).toBeNull();
	});

	it("rejects an object missing lng or lat", () => {
		expect(toCoordFromLngLat({ lat: 49 })).toBeNull();
		expect(toCoordFromLngLat({ lng: -123 })).toBeNull();
		expect(toCoordFromLngLat({})).toBeNull();
	});

	it("rejects NaN/Infinity inside the object", () => {
		expect(toCoordFromLngLat({ lng: Number.NaN, lat: 49 })).toBeNull();
		expect(toCoordFromLngLat({ lng: -123, lat: Number.POSITIVE_INFINITY })).toBeNull();
	});

	it("rejects out-of-range inside the object", () => {
		expect(toCoordFromLngLat({ lng: 999, lat: 49 })).toBeNull();
	});
});

describe("toCoordFromArray", () => {
	it("accepts a valid [lng,lat] tuple", () => {
		expect(toCoordFromArray([-123, 49])).toEqual([-123, 49]);
	});

	it("ignores extra elements (GeoJSON [lng,lat,alt])", () => {
		expect(toCoordFromArray([-123, 49, 100])).toEqual([-123, 49]);
	});

	it("rejects non-arrays", () => {
		expect(toCoordFromArray(null)).toBeNull();
		expect(toCoordFromArray(undefined)).toBeNull();
		expect(toCoordFromArray("not an array")).toBeNull();
		expect(toCoordFromArray({ 0: -123, 1: 49 })).toBeNull();
	});

	it("rejects an array with NaN/Infinity", () => {
		expect(toCoordFromArray([Number.NaN, 49])).toBeNull();
		expect(toCoordFromArray([-123, Number.POSITIVE_INFINITY])).toBeNull();
	});

	it("rejects a too-short array (missing lat -> undefined -> rejected)", () => {
		expect(toCoordFromArray([-123])).toBeNull();
		expect(toCoordFromArray([])).toBeNull();
	});

	it("rejects out-of-range array values", () => {
		expect(toCoordFromArray([200, 49])).toBeNull();
	});
});

describe("toCoordFromFeature", () => {
	it("accepts a GeoJSON Point feature", () => {
		const f = { geometry: { coordinates: [-123, 49] } };
		expect(toCoordFromFeature(f)).toEqual([-123, 49]);
	});

	it("rejects null / undefined feature", () => {
		expect(toCoordFromFeature(null)).toBeNull();
		expect(toCoordFromFeature(undefined)).toBeNull();
	});

	it("rejects a feature with null geometry (e.g. overlay rows)", () => {
		expect(toCoordFromFeature({ geometry: undefined })).toBeNull();
		expect(toCoordFromFeature({})).toBeNull();
	});

	it("rejects a feature whose coordinates contain NaN", () => {
		expect(toCoordFromFeature({ geometry: { coordinates: [Number.NaN, 49] } })).toBeNull();
	});

	it("rejects a feature with out-of-range coordinates", () => {
		expect(toCoordFromFeature({ geometry: { coordinates: [-123, 500] } })).toBeNull();
	});
});

describe("isCoord — runtime predicate", () => {
	it("returns true for a valid [lng,lat] tuple", () => {
		expect(isCoord([-123, 49])).toBe(true);
	});

	it("returns true at the inclusive boundaries", () => {
		expect(isCoord([-180, -90])).toBe(true);
		expect(isCoord([180, 90])).toBe(true);
	});

	it("returns true for a tuple with extra elements (length >= 2)", () => {
		expect(isCoord([-123, 49, 100])).toBe(true);
	});

	it("returns false for non-arrays", () => {
		expect(isCoord(null)).toBe(false);
		expect(isCoord(undefined)).toBe(false);
		expect(isCoord("foo")).toBe(false);
		expect(isCoord({ 0: -123, 1: 49 })).toBe(false);
	});

	it("returns false for a too-short array", () => {
		expect(isCoord([-123])).toBe(false);
		expect(isCoord([])).toBe(false);
	});

	it("returns false for NaN / Infinity", () => {
		expect(isCoord([Number.NaN, 49])).toBe(false);
		expect(isCoord([-123, Number.NaN])).toBe(false);
		expect(isCoord([Number.POSITIVE_INFINITY, 49])).toBe(false);
		expect(isCoord([-123, Number.NEGATIVE_INFINITY])).toBe(false);
	});

	it("returns false for non-number elements (no coercion)", () => {
		expect(isCoord(["-123", "49"])).toBe(false);
	});

	it("returns false for out-of-range values", () => {
		expect(isCoord([200, 49])).toBe(false);
		expect(isCoord([-123, 500])).toBe(false);
	});

	it("narrows the type when true (compile-time smoke)", () => {
		const raw: unknown = [-123, 49];
		if (isCoord(raw)) {
			const c: Coord = raw;
			expect(c[0]).toBe(-123);
		}
	});
});
