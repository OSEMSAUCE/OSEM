/**
 * geo.ts — the offline map's shared flat-earth km↔degrees math.
 *
 * ONE copy of the span/distance formulas that size every blob footprint
 * (satellite disc bounds, road-thumb bounds, line-anchor spacing). The shape is
 * deliberately simple — 1° lat ≈ 111 km, lng scaled by cos(lat) — because at
 * blob scale (≤ ~40 km) that's plenty, and every consumer must agree EXACTLY:
 * these numbers feed tile/blob geometry, so do not change rounding or formula
 * shape here without re-baking everything.
 */

export type LngLat = [number, number];

/** [w, s, e, n] in degrees. */
export type DegBounds = [number, number, number, number];

/**
 * A km radius as degree spans at a latitude. The `|| 1e-6` pole guard keeps the
 * cos divisor from hitting 0 at ±90° (a degenerate span, never a division blowup);
 * within real latitudes (-85..85) it never engages, so results match the
 * unguarded formula bit-for-bit.
 */
export function kmToDegSpan(
	km: number,
	latDeg: number,
): { dLat: number; dLng: number } {
	const dLat = km / 111;
	const dLng = km / (111 * Math.cos((latDeg * Math.PI) / 180) || 1e-6);
	return { dLat, dLng };
}

/** The [w, s, e, n] box spanning ±km around a centre. */
export function degBoxAround(center: LngLat, km: number): DegBounds {
	const [lng, lat] = center;
	const { dLat, dLng } = kmToDegSpan(km, lat);
	return [lng - dLng, lat - dLat, lng + dLng, lat + dLat];
}

/** Flat-earth km between two [lng,lat] points (cos taken at `a`'s latitude —
 *  fine at blob scale). */
export function kmBetween(a: LngLat, b: LngLat): number {
	const dLat = (b[1] - a[1]) * 111;
	const dLng = (b[0] - a[0]) * 111 * Math.cos((a[1] * Math.PI) / 180);
	return Math.hypot(dLat, dLng);
}
