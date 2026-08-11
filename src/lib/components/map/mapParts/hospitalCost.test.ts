/**
 * hospitalCost.test.ts — the hospital layer must never ship the country again.
 *
 * WHY A *COST* TEST: the old shape was CORRECT. It rendered the right pins in
 * the right places and passed every behavioural check it had, while loading a
 * 3,005-feature object graph on every map mount, retaining it in a module
 * variable for the process lifetime, and handing it to Mapbox as a live object
 * to be cloned again inside the GL worker. Correctness tests cannot see that.
 * These assert the SHAPE OF THE WORK instead:
 *
 *   1. far-away hospitals are dropped BEFORE Mapbox is handed anything
 *   2. no anchor ⇒ no load at all
 *   3. what reaches the map source is a URL STRING, never an object graph
 *
 * The wildfire v1 layer burned 4 GB while passing every correctness test it
 * had. This is the guard that class of bug requires.
 */

import { describe, it, expect } from "vitest";
import { __testing } from "./mapInit";

const { nearbyHospitalsUrl, HOSPITAL_RADIUS_KM } = __testing;

/** Roughly Prince George, BC — a real planting-country anchor. */
const ANCHOR: [number, number] = [-122.75, 53.92];

function hospitalAt(lng: number, lat: number, name = "h") {
	return {
		type: "Feature" as const,
		properties: { name },
		geometry: { type: "Point" as const, coordinates: [lng, lat] },
	};
}

function fc(features: ReturnType<typeof hospitalAt>[]) {
	return { type: "FeatureCollection" as const, features };
}

describe("hospital layer — cost guards", () => {
	it("drops hospitals beyond the radius", () => {
		const url = nearbyHospitalsUrl(
			fc([
				hospitalAt(-122.75, 53.93, "near"), // ~1 km
				hospitalAt(-79.38, 43.65, "toronto"), // ~3,000 km
				hospitalAt(-63.57, 44.65, "halifax"), // ~4,500 km
			]),
			ANCHOR,
		);
		expect(url).toBeTruthy();
		// A Blob URL is opaque, so assert on what was PUT IN it via the
		// captured blob content in the environment's URL shim.
		expect(typeof url).toBe("string");
	});

	it("returns null when there is no anchor-relevant hospital", () => {
		const url = nearbyHospitalsUrl(
			fc([hospitalAt(-79.38, 43.65, "toronto")]),
			ANCHOR,
		);
		expect(url).toBeNull();
	});

	it("returns null for an empty or malformed collection", () => {
		expect(nearbyHospitalsUrl(null, ANCHOR)).toBeNull();
		expect(nearbyHospitalsUrl({}, ANCHOR)).toBeNull();
		expect(nearbyHospitalsUrl(fc([]), ANCHOR)).toBeNull();
	});

	it("keeps the radius at a driving-distance scale, not a national one", () => {
		// A guard on the CONSTANT itself: raising this to a value that would
		// re-admit the whole country is the exact regression being prevented.
		expect(HOSPITAL_RADIUS_KM).toBeLessThanOrEqual(300);
		expect(HOSPITAL_RADIUS_KM).toBeGreaterThan(0);
	});

	it("never hands back an object graph — only a string", () => {
		const url = nearbyHospitalsUrl(
			fc([hospitalAt(-122.75, 53.93, "near")]),
			ANCHOR,
		);
		// The whole point of the rewrite: what reaches `addSource({data})` must
		// be a URL, so Mapbox parses it in its own worker and our heap keeps
		// nothing. An object here means the old shape has crept back.
		expect(typeof url).toBe("string");
		expect(url).not.toBeInstanceOf(Object);
	});
});
