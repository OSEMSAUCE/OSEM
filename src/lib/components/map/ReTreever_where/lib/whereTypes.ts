/**
 * The child's own vocabulary — no ReTreever imports.
 *
 * These three came from ReTreever's lib utils folder, which a child may never
 * touch. They moved rather than becoming props because neither is proprietary
 * and neither has a ReTreever dependency: `FavouriteLocation` is a plain shape,
 * and formatting a percentage is three lines of arithmetic. A prop would have
 * made the host supply something it has no special knowledge of.
 *
 * What DID stay a prop is `routes` (see WherePage): ReTreever's URL map is
 * genuinely the host's, and a standalone child has no /who or /what to link to.
 */

/** A spot the visitor starred. Coords captured at favourite time so the map can
 *  fly back without refetching centroids. */
export type FavouriteLocation = {
	landKey: string;
	landName: string;
	lng: number;
	lat: number;
};

/** Where the marker box can send you. The host fills these in; a child running
 *  on the harness has nowhere to go, so every entry is optional. */
export type WhereRoutes = {
	what?: string;
	whatProject?: (key: string) => string;
	whoOrg?: (key: string) => string;
};

/** 0–100 → "73.3%". Non-numeric → an em dash, never "NaN%". */
export function formatTransparencyScore(score: unknown): string {
	const n = Number(score);
	return Number.isFinite(n) ? `${n.toFixed(1)}%` : "—";
}
