/**
 * The child's own vocabulary and the host contract — no ReTreever imports.
 *
 * WHAT MOVED, AND WHY. `toTransparencyScore` / `formatTransparencyScore` came
 * from ReTreever's lib utils, which a child may never touch. They MOVED rather
 * than becoming props because neither is proprietary and neither has a
 * dependency: one divides by 100, the other formats a percentage. A prop would
 * have made the host supply arithmetic it has no special knowledge of.
 *
 * WHAT DID NOT MOVE. `endpoints` and `AppRoutes` are genuinely the host's — its
 * API surface and its URL map. A child running on the harness has no /api/who
 * to fetch and no /who page to link to, so both arrive as props and both are
 * optional. Given nothing, the search lists come back empty and the links do
 * not render. That is the honest unhitched state, not a bug.
 */

/**
 * Coerce a raw 0–1 score (Prisma Decimal — json() serializes it as a string) to
 * a 0–100 percentage rounded to one decimal (73.3). NULL when unscored or
 * malformed — not 0, which would read as "scored zero" rather than "no score".
 */
export function toTransparencyScore(raw: unknown): number | null {
	if (raw === null || raw === undefined) return null;
	const n = Number(raw);
	return Number.isFinite(n) ? Math.round(n * 1000) / 10 : null;
}

/**
 * Render a 0–100 score as "73.3%", or "—" when absent. Coerces first — Mapbox
 * hands feature properties back as strings.
 */
export function formatTransparencyScore(score: unknown): string {
	const n = Number(score);
	return Number.isFinite(n) ? `${n.toFixed(1)}%` : "—";
}

/**
 * The host's API surface. ReTreever passes its `endpoints`; the harness passes
 * nothing and every fetch is skipped rather than aimed at a 404.
 */
export type WhoWhatEndpoints = {
	organizations?: string;
	projects?: string;
	organization?: (key: string) => string;
	project?: (key: string) => string;
};

/** The host's URL map. Absent → the page renders without those links. */
export type WhoWhatRoutes = {
	who?: string;
	what?: string;
	whoMap?: string;
	whoOrg?: (key: string) => string;
	whatProject?: (key: string) => string;
};
