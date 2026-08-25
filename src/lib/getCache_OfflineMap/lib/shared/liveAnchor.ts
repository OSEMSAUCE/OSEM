/**
 * liveAnchor.ts — the user's own position as an offline anchor.
 *
 * ── The problem this exists to solve ──
 * Every other anchor is a FEATURE, and features don't move. The whole bake
 * service is built on that: areas are keyed by `satImageKey`, which is the
 * coordinate rounded to 4 decimals — about ELEVEN METRES. That's a fine dedupe
 * key for two pins dropped in the same clearing. It is a catastrophic one for a
 * walking human: stroll 11 m and you've minted a brand-new area key, which means
 * a brand-new 2 km satellite photo and a brand-new 500 km fire fetch. A planter
 * pacing a block would download hundreds of near-identical blobs.
 *
 * So live position CANNOT be fed to `note()` raw. It has to pass a containment
 * test first.
 *
 * ── The rule: distance from COVERAGE, not distance MOVED ──
 * The naive guard is "did you move more than X since last time?" — that's wrong
 * twice over. It re-downloads for someone who walks a slow 30 km loop back to
 * camp (they never left their blob), and it never downloads for someone who
 * teleports 5 m at a time across the province (each step is under the threshold).
 *
 * The right question is the one the user posed: *are you near the edge of what
 * you already have?* So we measure from the nearest EXISTING blob centre. Stand
 * still and nothing happens, forever. Wander inside your blob and nothing
 * happens. Cross the trigger radius and exactly one new blob lands, overlapping
 * the old one — no seam.
 *
 * ── Why two radii, and why these numbers ──
 * They come from the blob's real geometry, not from taste — and specifically
 * from the TIGHTEST layer a blob provides, not the widest:
 *   • BAKE_RADIUS_KM (satelliteImage.ts) satellite photo = 2 km. Trigger at 75%
 *     of it (1.5 km). The photo is what a person SEES, so it is what "covered"
 *     has to mean. Measuring against the wider road disc instead is THE
 *     DARKNESS BUG — see MAP_TRIGGER_KM.
 *   • FIRE_RADIUS_KM = 500. Trigger at 350 km, 70%. That's four or five hours
 *     of driving — a genuine relocation, not a commute.
 * Both are exported so the tests assert the RELATIONSHIP (trigger < coverage),
 * not just the literals — if someone shrinks a ring, the test catches it.
 *
 * NOTE this module is deliberately PURE + synchronous. It does no IndexedDB, no
 * geolocation, no permission checks. It answers one question over data handed to
 * it, which is what makes it testable and what keeps the "when do we download"
 * decision in one readable place instead of smeared across the bake pass.
 */
import { kmBetween, type LngLat } from "$harness/mapShared/kmGeo";
import { BLOB_RADIUS_KM } from "$harness/getCache_OfflineMap/lib/contract/roadBlob";
import { BAKE_RADIUS_KM } from "$harness/getCache_OfflineMap/lib/onPhone/satellite/satelliteImage";
import { FIRE_RADIUS_KM } from "$harness/mapShared/fireContract";

/**
 * The widest thing a map blob covers — the road disc.
 *
 * ⛔ RE-EXPORTED FROM `roadBlob.ts`, NEVER a literal. There is exactly ONE road
 * radius in this codebase and `BLOB_RADIUS_KM` owns it. This used to be a
 * hardcoded `30` beside a comment that still said "40 km" in two places — the
 * second-radius drift `roadBlob.ts` was written to end, reappearing as a stale
 * doc string. A number typed twice is a number that will disagree.
 *
 * It is deliberately NOT what the trigger below is measured against — see
 * MAP_TRIGGER_KM.
 */
export const MAP_COVERAGE_KM = BLOB_RADIUS_KM;

/**
 * What "covered" MEANS for a person looking at the screen — the satellite photo
 * (2 km), not the road disc.
 *
 * ⚠️ THE DARKNESS BUG. This used to be `MAP_COVERAGE_KM * 0.75` = 30 km, on the
 * reasoning that the outer ring is the widest thing a blob covers. That is true
 * of ROADS and false of everything the user actually SEES. The photo is a 2 km
 * disc at the blob's core, so a user 10 km from a blob centre passed
 * containment ("you're inside 30 km, you're covered") while looking at blank
 * ground five times beyond the imagery.
 *
 * It bit hardest through the permanent Ottawa demo blob, which every pass notes
 * unconditionally: EVERY user in the Ottawa region sat inside its 30 km radius
 * and so was never granted a blob of their own. Blue dot, no map — the exact
 * field report this constant now exists to prevent.
 *
 * Coverage must therefore be measured against the tightest layer a blob
 * provides, not the widest. The wider road reach is a bonus on top; it is not a
 * reason to withhold a photo.
 */
export const PHOTO_COVERAGE_KM = BAKE_RADIUS_KM;

/**
 * How far from the nearest blob centre before we bake a new one.
 *
 * 75% of the PHOTO radius — the same "re-covered while you still have signal"
 * margin as before, applied to the radius that matters. At 2 km that is 1.5 km:
 * walk beyond your photo's edge and one new blob lands, overlapping the old.
 *
 * This is still a CONTAINMENT test, not a distance-moved test, so all the
 * anti-thrash properties hold: stand still and nothing happens forever; pace a
 * block inside your photo and nothing happens; walk a 30 km loop back to camp
 * and nothing happens.
 */
export const MAP_TRIGGER_KM = PHOTO_COVERAGE_KM * 0.75;

/** The fire disc's reach, re-exported so callers reason about one pair of
 *  numbers (coverage + trigger) without importing from two modules. */
export const FIRE_COVERAGE_KM = FIRE_RADIUS_KM;

/** How far before we pull a fresh fire disc. 70% of the disc — the same margin
 *  logic as MAP_TRIGGER_KM. ~350 km, i.e. four or five hours of driving. */
export const FIRE_TRIGGER_KM = Math.round(FIRE_COVERAGE_KM * 0.7);

/**
 * Distance to the nearest of `centres`, in km. `Infinity` when there are none —
 * which reads correctly at every call site: no coverage at all is infinitely far
 * from covered, so the first fix always triggers a bake.
 */
export function kmToNearest(
	pos: LngLat,
	centres: readonly LngLat[],
): number {
	let best = Number.POSITIVE_INFINITY;
	for (const c of centres) {
		const d = kmBetween(pos, c);
		if (d < best) best = d;
	}
	return best;
}

/**
 * Should the live position become an anchor for a new MAP blob?
 *
 * `centres` are the centres of the areas we ALREADY have (feature anchors
 * included — a planter standing beside their own pin is already covered by it
 * and must not mint a second blob 11 m away).
 */
export function needsMapBlob(
	pos: LngLat,
	centres: readonly LngLat[],
): boolean {
	return kmToNearest(pos, centres) > MAP_TRIGGER_KM;
}

/**
 * Should the live position pull a fresh FIRE disc?
 *
 * Separate from {@link needsMapBlob} because the radii differ by two orders of
 * magnitude: a 30 km move earns a new map blob but is nothing to a 500 km smoke
 * shed, and re-fetching fires on every map blob would be pure waste.
 *
 * This is about GEOGRAPHY only. Time-based refresh (hotspots go stale hourly)
 * is a separate axis, owned by `fireIsFresh` in v4FireCache — a user who never
 * moves still gets fresh dots. Don't conflate the two.
 */
export function needsFireDisc(
	pos: LngLat,
	fireCentres: readonly LngLat[],
): boolean {
	return kmToNearest(pos, fireCentres) > FIRE_TRIGGER_KM;
}

/**
 * The live position SNAPPED to a coarse grid, for use as an area key.
 *
 * Belt and braces behind the containment test. Containment already stops the
 * 11 m thrash, but if a future edit ever routes a raw fix past it, an unsnapped
 * coordinate would silently mint unique keys forever. Snapping to ~0.25°
 * (≈28 km at mid latitude, in the same ballpark as MAP_TRIGGER_KM) means even
 * the degenerate path can only ever produce a bounded set of keys.
 *
 * Deliberately NOT `satImageKey` — that's the 4-decimal key and is exactly what
 * we must not hand a moving point.
 */
export function snapLiveAnchor(pos: LngLat): LngLat {
	const step = 0.25;
	// `+ 0` normalises -0 → 0. Math.round(-0.04) is -0, which compares equal to 0
	// with === but is a DIFFERENT value to Object.is and to any Map keyed on it,
	// so a coordinate just west of Greenwich could occupy two cells at once.
	const snap = (n: number): number => Math.round(n / step) * step + 0;
	return [snap(pos[0]), snap(pos[1])];
}

/** Guard against a satellite-tagged or corrupt fix reaching the bake pass. */
export function isUsableFix(pos: unknown): pos is LngLat {
	if (!Array.isArray(pos) || pos.length !== 2) return false;
	const [lng, lat] = pos as number[];
	return (
		Number.isFinite(lng) &&
		Number.isFinite(lat) &&
		Math.abs(lng) <= 180 &&
		Math.abs(lat) <= 90 &&
		// 0,0 is the Gulf of Guinea and is overwhelmingly a zeroed-out struct
		// rather than a real fix. Baking a blob there wastes the budget on ocean.
		!(lng === 0 && lat === 0)
	);
}
