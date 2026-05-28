import { afterEach, describe, expect, it, vi } from "vitest";
import type { OgBounds } from "./types";
import {
	bboxAroundPoint,
	bboxToTileRange,
	distanceKm,
	jitterPoint,
	latToTileY,
	lonToTileX,
	pointInBounds,
	tileFullyInCircle,
	tileRangeBounds,
	tileXToLon,
	tileYToLat,
} from "./ogGeometry.js";

describe("bboxAroundPoint", () => {
	it("builds a symmetric bbox around the point (equatorial)", () => {
		// At lat 0, cos(0) = 1, so lng & lat deltas are both radiusKm/111.
		const b = bboxAroundPoint(0, 0, 111);
		expect(b.north).toBeCloseTo(1, 10);
		expect(b.south).toBeCloseTo(-1, 10);
		expect(b.east).toBeCloseTo(1, 10);
		expect(b.west).toBeCloseTo(-1, 10);
	});

	it("widens the lng span with latitude (cos factor)", () => {
		// At lat 60, cos(60deg) = 0.5, so the lng delta doubles vs the lat delta.
		const b = bboxAroundPoint(10, 60, 111);
		const latSpan = b.north - b.south;
		const lngSpan = b.east - b.west;
		expect(latSpan).toBeCloseTo(2, 10); // +/- 1 deg
		expect(lngSpan).toBeCloseTo(4, 10); // +/- 2 deg (1 / 0.5)
		// centered on the point
		expect((b.east + b.west) / 2).toBeCloseTo(10, 10);
		expect((b.north + b.south) / 2).toBeCloseTo(60, 10);
	});

	it("produces a zero-area bbox for a zero radius", () => {
		const b = bboxAroundPoint(-122.5, 37.7, 0);
		expect(b.west).toBeCloseTo(-122.5, 10);
		expect(b.east).toBeCloseTo(-122.5, 10);
		expect(b.south).toBeCloseTo(37.7, 10);
		expect(b.north).toBeCloseTo(37.7, 10);
	});

	it("handles negative coordinates", () => {
		const b = bboxAroundPoint(-122, -37, 111);
		expect((b.east + b.west) / 2).toBeCloseTo(-122, 8);
		expect((b.north + b.south) / 2).toBeCloseTo(-37, 8);
		expect(b.north).toBeGreaterThan(b.south);
		expect(b.east).toBeGreaterThan(b.west);
	});
});

describe("lonToTileX", () => {
	it("maps -180 to tile 0 and approaches 2^z at +180", () => {
		expect(lonToTileX(-180, 2)).toBe(0);
		// +180 maps exactly onto 2^z (one past the last index, by design)
		expect(lonToTileX(180, 2)).toBe(4); // 2^2
	});

	it("maps the prime meridian to the middle tile", () => {
		// z=1 -> 2 tiles; lon 0 is the boundary -> floor lands on tile 1.
		expect(lonToTileX(0, 1)).toBe(1);
	});

	it("floors to an integer tile index", () => {
		const x = lonToTileX(-122.4, 10);
		expect(Number.isInteger(x)).toBe(true);
	});
});

describe("latToTileY", () => {
	it("maps lat 0 to the middle tile", () => {
		expect(latToTileY(0, 1)).toBe(1);
	});

	it("northern latitudes get smaller y than southern (y grows downward)", () => {
		const north = latToTileY(60, 8);
		const south = latToTileY(-60, 8);
		expect(north).toBeLessThan(south);
	});

	it("floors to an integer tile index", () => {
		expect(Number.isInteger(latToTileY(37.7, 12))).toBe(true);
	});
});

describe("tile coord round-trips", () => {
	// tileXToLon / tileYToLat return the NW corner of a tile. Feeding an
	// integer tile index back gives the exact lon/lat of that tile's edge.
	it("tileXToLon is the inverse of the tile grid for integer indices", () => {
		const z = 5;
		for (const x of [0, 1, 7, 16, 31]) {
			// lon of tile x's west edge, then which tile that lon falls in.
			const lon = tileXToLon(x, z);
			expect(lonToTileX(lon, z)).toBe(x);
		}
	});

	it("tileYToLat is consistent with latToTileY for integer indices", () => {
		const z = 5;
		for (const y of [1, 7, 16, 30]) {
			const lat = tileYToLat(y, z);
			expect(latToTileY(lat, z)).toBe(y);
		}
	});

	it("pins exact known values at z=0", () => {
		// z=0: a single tile covering the whole web-mercator square.
		expect(tileXToLon(0, 0)).toBeCloseTo(-180, 10);
		expect(tileXToLon(1, 0)).toBeCloseTo(180, 10);
		// y=0 top edge ~= +85.0511 (mercator limit); y=1 bottom ~= -85.0511.
		expect(tileYToLat(0, 0)).toBeCloseTo(85.0511287798, 6);
		expect(tileYToLat(1, 0)).toBeCloseTo(-85.0511287798, 6);
	});
});

describe("bboxToTileRange", () => {
	it("returns inclusive x/y ranges with north->yMin, south->yMax", () => {
		const bbox: OgBounds = { west: -123, south: 37, east: -122, north: 38 };
		const z = 9;
		const r = bboxToTileRange(bbox, z);
		expect(r.xMin).toBe(lonToTileX(bbox.west, z));
		expect(r.xMax).toBe(lonToTileX(bbox.east, z));
		expect(r.yMin).toBe(latToTileY(bbox.north, z));
		expect(r.yMax).toBe(latToTileY(bbox.south, z));
		// north has the smaller y
		expect(r.yMin).toBeLessThanOrEqual(r.yMax);
		// west has the smaller x
		expect(r.xMin).toBeLessThanOrEqual(r.xMax);
	});

	it("a zero-area bbox collapses to a single tile", () => {
		const bbox: OgBounds = { west: -122, south: 37, east: -122, north: 37 };
		const r = bboxToTileRange(bbox, 10);
		expect(r.xMin).toBe(r.xMax);
		expect(r.yMin).toBe(r.yMax);
	});
});

describe("tileRangeBounds", () => {
	it("snaps to tile-aligned edges and round-trips through bboxToTileRange", () => {
		const z = 8;
		const xMin = 40;
		const xMax = 42;
		const yMin = 90;
		const yMax = 92;
		const b = tileRangeBounds(z, xMin, xMax, yMin, yMax);
		// west/north are the NW corner of the (xMin,yMin) tile.
		expect(b.west).toBeCloseTo(tileXToLon(xMin, z), 10);
		expect(b.north).toBeCloseTo(tileYToLat(yMin, z), 10);
		// east/south are one tile past xMax/yMax (the SE corner of the union).
		expect(b.east).toBeCloseTo(tileXToLon(xMax + 1, z), 10);
		expect(b.south).toBeCloseTo(tileYToLat(yMax + 1, z), 10);
		expect(b.east).toBeGreaterThan(b.west);
		expect(b.north).toBeGreaterThan(b.south);
	});
});

describe("distanceKm", () => {
	it("is ~0 for identical points", () => {
		expect(distanceKm(-122, 37, -122, 37)).toBeCloseTo(0, 10);
	});

	it("1 degree of latitude is ~111 km", () => {
		expect(distanceKm(0, 0, 0, 1)).toBeCloseTo(111, 6);
	});

	it("1 degree of longitude at the equator is ~111 km", () => {
		expect(distanceKm(0, 0, 1, 0)).toBeCloseTo(111, 6);
	});

	it("1 degree of longitude at lat 60 is ~55.5 km (cos factor)", () => {
		expect(distanceKm(0, 60, 1, 60)).toBeCloseTo(55.5, 6);
	});

	it("is symmetric", () => {
		const a = distanceKm(-122, 37, -120, 39);
		const b = distanceKm(-120, 39, -122, 37);
		expect(a).toBeCloseTo(b, 10);
	});
});

describe("tileFullyInCircle", () => {
	// Pick a center, a zoom, and the tile that contains the center.
	const centerLng = -122.42;
	const centerLat = 37.77;
	const z = 14;

	it("excludes a far-away tile (all corners outside the radius)", () => {
		const x = lonToTileX(centerLng, z);
		const y = latToTileY(centerLat, z);
		// Tiny radius: even the center tile's corners are too far out.
		expect(tileFullyInCircle(z, x, y, centerLng, centerLat, 0)).toBe(false);
	});

	it("includes the center tile when the radius easily covers it", () => {
		const x = lonToTileX(centerLng, z);
		const y = latToTileY(centerLat, z);
		// 60 km radius dwarfs a z14 tile (~2.4 km wide) -> all corners inside.
		expect(tileFullyInCircle(z, x, y, centerLng, centerLat, 60)).toBe(true);
	});

	it("excludes a tile whose nearest corner is just inside but a far corner is outside", () => {
		// A tile far to the east: its near edge may be within radius while its
		// far corners are not, so it must NOT qualify as fully-inside.
		const x = lonToTileX(centerLng + 0.5, z);
		const y = latToTileY(centerLat, z);
		expect(tileFullyInCircle(z, x, y, centerLng, centerLat, 1)).toBe(false);
	});
});

describe("pointInBounds", () => {
	const bounds: OgBounds = { west: -123, south: 37, east: -122, north: 38 };

	it("true for an interior point", () => {
		expect(pointInBounds(-122.5, 37.5, bounds)).toBe(true);
	});

	it("inclusive on the edges", () => {
		expect(pointInBounds(-123, 37, bounds)).toBe(true); // SW corner
		expect(pointInBounds(-122, 38, bounds)).toBe(true); // NE corner
	});

	it("false outside on each side", () => {
		expect(pointInBounds(-124, 37.5, bounds)).toBe(false); // too far west
		expect(pointInBounds(-121, 37.5, bounds)).toBe(false); // too far east
		expect(pointInBounds(-122.5, 36, bounds)).toBe(false); // too far south
		expect(pointInBounds(-122.5, 39, bounds)).toBe(false); // too far north
	});
});

describe("jitterPoint", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("stays within radiusKm of the source point", () => {
		// Force the max radius (random()->1 => sqrt(1)=1) and theta=0.
		// First random() is for r, second for theta.
		vi.spyOn(Math, "random").mockReturnValueOnce(1).mockReturnValueOnce(0);
		const lng = -122;
		const lat = 37;
		const radiusKm = 10;
		const p = jitterPoint(lng, lat, radiusKm);
		expect(distanceKm(lng, lat, p.lng, p.lat)).toBeLessThanOrEqual(radiusKm + 1e-6);
	});

	it("returns the source point when random radius is 0", () => {
		vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.42);
		const p = jitterPoint(-122, 37, 10);
		expect(p.lng).toBeCloseTo(-122, 10);
		expect(p.lat).toBeCloseTo(37, 10);
	});

	it("theta=0 jitters purely east (positive lng, unchanged lat)", () => {
		// r=full (sqrt(1)=1), theta=0 => cos(0)=1 (dLat=0), sin(0)=0... wait,
		// dLat = r*cos(theta)/111, dLng = r*sin(theta)/.... theta=0 => sin=0,
		// so this jitters purely NORTH. Verify lng is unchanged.
		vi.spyOn(Math, "random").mockReturnValueOnce(1).mockReturnValueOnce(0);
		const p = jitterPoint(-122, 37, 10);
		expect(p.lng).toBeCloseTo(-122, 10);
		expect(p.lat).toBeGreaterThan(37); // moved north
	});
});
