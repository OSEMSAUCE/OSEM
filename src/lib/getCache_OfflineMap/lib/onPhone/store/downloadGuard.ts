/**
 * downloadGuard — a HARD circuit breaker on offline-map network volume.
 *
 * WHY THIS EXISTS: the offline map downloads imagery + vector tiles on the user's
 * volition. A bug (a huge drawn line/polygon, a reconcile loop, a bad coordinate)
 * could fan that out into hundreds of thousands of tile fetches — silently burning
 * a user's CELLULAR data and running up a real bill. This module makes that
 * impossible: every tile/pack fetch is counted, and once a ceiling is crossed the
 * breaker TRIPS — every further guarded fetch throws, and we alert Sentry ONCE so
 * the operator finds out immediately. It is a safety floor, never a tuning knob.
 *
 * The caps are deliberately generous vs legitimate use:
 *   - one satellite disc (3 km, z14) ≈ 13 tiles
 *   - one v4 vector pack (5 km z15 + 25 km z13 rings) ≈ 290 tiles, delivered as ONE /pack request
 * so a legit session sits far below these. Tripping means something is WRONG.
 *
 * Once tripped, only a full page reload resets it (module state) — by design: a
 * runaway must not be able to "un-trip" itself and keep going.
 */
import * as Sentry from "@sentry/sveltekit";

// ── ceilings (per app session) ────────────────────────────────────────────
/** One satellite bake's tile grid. ~13 legit (3 km z14); >this = an absurd area → stop cold. */
const PER_BAKE_TILE_CAP = 400;
/** Total satellite imagery tiles fetched across the whole session. ~13/area, so
 *  this is hundreds of distinct offline areas — a runaway blows past it, a human won't. */
const SESSION_TILE_CAP = 5000;
/**
 * Total v4 vector /pack downloads across the session.
 *
 * ⛔ RAISED 60 → 500 BECAUSE THE UNIT OF WORK CHANGED, NOT BECAUSE THE GUARD
 * WAS WRONG. It used to be "each ≈ one disc", so 60 packs meant ~60 areas. An
 * area is now a set of GRID CELLS (grid.ts) and one pin needs up to 9 of them,
 * so 60 packs meant as few as SEVEN areas — and the breaker latched during
 * ordinary use.
 *
 * MEASURED LIVE: `DownloadBudgetError: session pack downloads 61 > cap 60`,
 * after which every download in the session was refused. From the user's chair
 * that is a new pin showing NOTHING — no roads, no satellite, forever, with the
 * cause visible only in the console.
 *
 * 500 packs ≈ 55-500 areas depending on where pins fall, which is still far
 * above any real session and still catches a genuine runaway (a reconcile loop
 * blows past it in seconds).
 *
 * ⚠️ THE LESSON, NOT THE NUMBER: a budget must count the thing the user does
 * (bake an area), never the thing the implementation happens to do (issue a
 * request). Change the unit of work and this constant is wrong again.
 */
const SESSION_PACK_CAP = 5000;

/**
 * ⛔ RAISED 500 → 5000 (2026-08-20). THE UNIT OF WORK CHANGED AGAIN — exactly
 * what the note above warned would invalidate the number.
 *
 * Roads are now stored PER PIN (`pin/<lng>,<lat>/<z>/<x>/<y>`, grid.ts
 * `pinTileKey`) rather than under a shared grid address, because a shared
 * address served one pin's roads to another (MEASURED 50.4 km off at the user's
 * Yellowstone pin). The fix is right, and it removed all SHARING: two adjacent
 * pins used to reuse one cell's tiles and now each fetches its own.
 *
 * MEASURED LIVE, minutes after that shipped:
 *     DownloadBudgetError: session pack downloads 501 > cap 500
 *     ... 55 queued, timer frozen, roads row with NO box (half-written)
 * On screen: the map froze mid-bake and drew half a square of roads.
 *
 * A device holding a few hundred pins legitimately issues a few hundred packs
 * on its first pass after this change, and re-baking an existing library
 * multiplies that. 5000 stays far above honest use while still catching a
 * reconcile loop (which blows past it in seconds, not minutes).
 */

let sessionTiles = 0;
let sessionPacks = 0;
let tripped = false;
let trippedReason = "";

/** Thrown by every guard once the breaker is tripped (and at the moment it trips).
 *  Callers let it propagate — it aborts the bake/download loop loudly. */
export class DownloadBudgetError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DownloadBudgetError";
	}
}

export function isDownloadGuardTripped(): boolean {
	return tripped;
}

function trip(reason: string, extra: Record<string, unknown>): never {
	// Flip the breaker + alert Sentry exactly once; subsequent guards just throw.
	if (!tripped) {
		tripped = true;
		trippedReason = reason;
		// Loud operator signal — this should NEVER fire in normal use.
		console.error(
			`[downloadGuard] 🛑 CIRCUIT TRIPPED — offline-map download runaway blocked: ${reason}`,
			{ ...extra, sessionTiles, sessionPacks },
		);
		try {
			Sentry.captureMessage(
				`[downloadGuard] offline-map runaway BLOCKED — ${reason}`,
				{
					level: "fatal",
					extra: { ...extra, sessionTiles, sessionPacks },
					tags: { area: "offline-download-guard" },
				},
			);
		} catch {
			// Sentry must never mask the real failure — the throw below is what matters.
		}
	}
	throw new DownloadBudgetError(reason);
}

/** Call BEFORE fetching a satellite disc's tiles. Trips if this ONE bake's grid is
 *  absurdly large (a huge area) — stops before a single byte downloads. */
export function guardBakeGrid(
	tileCount: number,
	ctx: Record<string, unknown>,
): void {
	if (tripped) throw new DownloadBudgetError(trippedReason);
	if (tileCount > PER_BAKE_TILE_CAP) {
		trip(`single satellite bake grid ${tileCount} > cap ${PER_BAKE_TILE_CAP}`, {
			tileCount,
			...ctx,
		});
	}
}

/** Call as satellite tiles are fetched (once per tile). Trips when the running
 *  session total blows the ceiling — catches a multi-bake / reconcile-loop runaway
 *  that no single-bake cap would see. */
export function noteSatelliteTiles(n: number): void {
	if (tripped) throw new DownloadBudgetError(trippedReason);
	sessionTiles += n;
	if (sessionTiles > SESSION_TILE_CAP) {
		trip(`session satellite tiles ${sessionTiles} > cap ${SESSION_TILE_CAP}`, {
			sessionTiles,
		});
	}
}

/** Call before each v4 vector /pack download. Trips on an implausible number of
 *  separate disc downloads in one session. */
export function guardPackDownload(ctx: Record<string, unknown>): void {
	if (tripped) throw new DownloadBudgetError(trippedReason);
	sessionPacks += 1;
	if (sessionPacks > SESSION_PACK_CAP) {
		trip(`session pack downloads ${sessionPacks} > cap ${SESSION_PACK_CAP}`, {
			sessionPacks,
			...ctx,
		});
	}
}
