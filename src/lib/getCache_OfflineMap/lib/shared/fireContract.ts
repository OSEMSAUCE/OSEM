/**
 * fireContract.ts — the fire layer's SHAPE, owned by the engine.
 *
 * WHY THIS EXISTS. The engine needs three things about fires that are not
 * behaviour: how big a fire disc is, what one hotspot looks like, and what a
 * cached fire record looks like. Those are geometry and data — the same class of
 * thing as offline/contract/ — so they belong with the engine, not with the
 * host's fire STORE (which is IndexedDB code, ReTreever's business).
 *
 * The host's own `fires/fireCache.ts` re-exports these, so there is still ONE
 * definition of the radius and one shape for a hotspot. Never re-declare them.
 */

/** Radius, in km, of ONE fire disc. A disc is huge compared to a map area
 *  (500 km vs 40 km), which is why a dozen pins on one block share a single
 *  smoke shed instead of each pulling their own near-identical fetch. */
export const FIRE_RADIUS_KM = 500;

export type FireConfidence = "low" | "nominal" | "high";

/** One hotspot, trimmed to what the map actually renders. */
export interface FireHotspot {
	/** [lng, lat] — GeoJSON order. */
	readonly coordinates: [number, number];
	/** Acquisition time, UTC epoch ms. Drives the age-colour ramp. */
	readonly t: number;
	readonly c: FireConfidence;
	/** Fire radiative power, MW. */
	readonly frp: number;
	/**
	 * Pixel footprint in km. Optional — an older cached record predates it.
	 *
	 * The honest-rendering number: a hotspot means "something inside this ~0.4 km
	 * cell was hot", not "this square is on fire". The tap popup says so out loud.
	 */
	readonly px?: number;
	/** Day / Night overpass. Night reads are less solar-contaminated. */
	readonly dn?: "D" | "N";
}
