/**
 * Shard layout — the CONFIG for every decorative photo shard on the page.
 *
 * THE ONE RULE: a shard's position is whatever this file says it is. Nothing
 * computes it, corrects it, or negotiates it. Change a number here and exactly
 * that shard moves, by exactly that much, and nothing else on the page shifts.
 *
 * WHY THERE IS NO SOLVER ANY MORE
 *
 * There used to be one: `separate()` ran up to 60 relaxation passes pushing
 * shards apart until no two yellow borders were within 26px, treating the
 * numbers below as "intent" and emitting a correction (`dx`/`dy`) on top. It
 * enforced a real rule, and it worked — but it made the arrangement
 * unauthorable, which is worse than a shard being 20px from its neighbour:
 *
 *   - Editing was not local. Every shard was measured against every other, so
 *     one number changed the whole page. Positions were a shared budget.
 *   - Editing was not proportional. A change either failed to cross the 26px
 *     threshold and did nothing at all, or crossed it and cascaded a correction
 *     through every neighbour. There was no small change.
 *   - It could eject a shard off-screen. When a shard was pinned with nowhere
 *     to slide, a late-pass rule pushed it horizontally off its own page edge
 *     with no bound. Three shards left the left side of /what entirely and the
 *     tests still passed, because "off-screen" satisfies "not touching".
 *
 * That last one is the tell: the rule was satisfiable in ways nobody wanted,
 * because the solver optimised geometry and the eye reads composition. A human
 * placing these by hand never needed 26px of clearance proved — they needed to
 * see the page and move a piece. So: no-touch is now a matter of TASTE, upheld
 * by whoever edits `HOME` and `HEADLINE` while looking at the result, and the
 * code's only job is to render the numbers faithfully.
 *
 * COORDINATES
 *
 * Each shard states `x` and `y` as a percentage — x of the viewport width, y of
 * its own section's height — plus `w` as a percentage of viewport width clamped
 * between `minw` and `maxw` px. Percentages rather than raw px because the page
 * is fluid and the shards ring a centred column; a px-authored ring would sit
 * correctly at one window size and nowhere else. Negative values and values
 * past 100 are FINE and expected — the shards bleed off every edge on purpose.
 *
 * There is no `left`/`right` pair and no `bottom` any more. One axis, one
 * property, one meaning: `x: -6` is the left edge, `x: 78` is over toward the
 * right, and to move a shard right you make the number bigger. Always.
 */

export type ShardSpec = {
	id: number;
	/** x of the shard's LEFT edge, as a % of viewport width. May be < 0 or > 100. */
	x: number;
	/** y of the shard's TOP edge, as a % of the section's height. May be < 0 or > 100. */
	y: number;
	/** width as a % of viewport width, then clamped by min/max px */
	w: number;
	maxw: number;
	minw: number;
	/**
	 * Rotation in degrees. The shards are torn photo fragments, so they should
	 * sit at their own angles rather than all square to the page. Kept modest
	 * (roughly +/-14) — past that the jagged artwork starts reading as broken
	 * rather than scattered.
	 */
	rot?: number;
	/** artwork id for aspect lookup; defaults to `id` (see Placed.art) */
	art?: number;
};

/**
 * Each artwork's aspect ratio (width / height), read off its SVG viewBox.
 *
 * This is the only geometry the layout still needs: width is authored, height
 * follows from the artwork so a shard is never stretched. The full border
 * OUTLINES that used to live here — a polygon per shard, normalised to its own
 * box — existed solely to feed the collision solver's segment-distance
 * measurements. With no solver there is nothing to measure, so they are gone.
 */
const ASPECT: Record<number, number> = {
	1: 1.63924,
	2: 0.67299,
	3: 1.14372,
	4: 1.70643,
	5: 2.43367,
	6: 2.02096,
	7: 2.26411,
	8: 1.1521,
	9: 1.90656,
	10: 2.45141,
	11: 1.75093,
};

/**
 * Height of the fixed navbar, in px.
 *
 * The bar is `position: fixed`, so it sits outside the hero section's box and
 * casts no layout shadow: geometry says the top of the section is free space,
 * and the eye says it is an opaque black bar. Nothing enforces this — it is
 * here so that when you author a `y` near the top of the hero you can see what
 * you are authoring INTO. At a 700px section, 80px is the first 11%; a shard at
 * `y: 2` is behind the bar, not near the top of the page.
 */
export const NAVBAR_H = 80;

/**
 * THE HERO RING — the shards around the search card.
 *
 * Sizes are deliberately uneven: the long reaches (1, 5, 9) run nearly to the
 * middle of the page, the small ones (2, 3) stay punctuation. The vertical
 * anchors spread from just under the navbar to past the bottom edge, so the
 * ring fills the section rather than crowding the top.
 *
 * To move a shard: change its `x` / `y`. To resize it: change `w` (and `maxw`
 * if you want it to keep growing on wide screens). Nothing else is affected.
 */
export const HOME: ShardSpec[] = [
	// top-left: long reach inward, the biggest shard on the page
	{ id: 1, x: -16, y: 4, w: 44, maxw: 500, minw: 96, rot: -7 },
	// small punctuation below it, tucked against the left edge
	{ id: 2, x: 20, y: -22, w: 33, maxw: 190, minw: 52, rot: 11 },
	// top-right punctuation, outboard of the search card
	{ id: 3, x: 86, y: -9, w: 82, maxw: 335, minw: 68, rot: 11 },
	// upper-right: medium, beside the search bar but never touching it
	{ id: 4, x: 81, y: 30, w: 26, maxw: 385, minw: 96, rot: 6 },
	// mid-right: another long reach
	{ id: 5, x: 82, y: 55, w: 26, maxw: 425, minw: 100, rot: -5 },
	// bottom-left: long reach across the foot
	{ id: 9, x: -6, y: 72, w: 31, maxw: 455, minw: 84, rot: 7 },
	// mid-left: medium, fills the gap between shard 1 and the foot
	{ id: 11, x: -8, y: 40, w: 27, maxw: 400, minw: 96, rot: 4 },
];

/**
 * THE HEADLINE RING — around "Find Truth in Reforestation."
 *
 * These lean harder off the viewport than the hero's do; several are anchored
 * past the edge so only a corner shows, which is what makes the arrangement
 * read as scattered fragments rather than a tidy border.
 */
export const HEADLINE: ShardSpec[] = [
	{ id: 7, x: 80, y: 6, w: 30, maxw: 440, minw: 96, rot: -9 },
	{ id: 6, x: -9, y: 18, w: 28, maxw: 410, minw: 88, rot: 12 },
	{ id: 10, x: -8, y: 62, w: 26, maxw: 385, minw: 96, rot: -13 },
	{ id: 8, x: 84, y: 66, w: 24, maxw: 355, minw: 84, rot: 10 },
];

/**
 * A shard resolved to px for a given viewport.
 *
 * `dx`/`dy` are gone along with the solver: there is no correction to carry, so
 * `x`/`y` ARE the position. The template used to add the two together, which is
 * why a shard could render 114px from where the config said it was.
 */
export type Placed = {
	id: number;
	x: number;
	y: number;
	w: number;
	h: number;
	rot?: number;
	/**
	 * Which artwork this draws. Normally the same as `id`, but a whole-page
	 * solve renumbers shards so ids stay unique across sections — the aspect
	 * lookup must still find the original artwork.
	 */
	art?: number;
};

/**
 * Resolve a section's shards to px. Pure: same inputs, same output, no passes,
 * no iteration, no shard aware of any other.
 */
export function place(
	specs: ShardSpec[], vw: number, sectionH: number,
): Placed[] {
	return specs.map((s) => {
		const w = Math.max(s.minw, Math.min(s.maxw, (s.w / 100) * vw));
		const h = w / ASPECT[s.art ?? s.id];
		return {
			id: s.id,
			x: (s.x / 100) * vw,
			y: (s.y / 100) * sectionH,
			w,
			h,
			rot: s.rot,
			art: s.art,
		};
	});
}

/**
 * DEPTH — how near the viewer a shard reads, 0 (far) .. 1 (near).
 *
 * One number drives BOTH parallax rate and shadow strength, because in the
 * real world they are the same fact: a piece lying nearer the eye sweeps past
 * faster when you move AND throws a longer, softer shade. Splitting them into
 * two hand-tuned knobs is what makes parallax read as "the CSS is broken"
 * rather than as depth — the shard that moves like it's in front but shades
 * like it's flat on the page.
 *
 * Derived from WIDTH rather than hand-authored per shard. The composition
 * already encodes depth that way: the long reaches (1, 5, 9) are the big
 * foreground pieces and the punctuation (2, 3, 8) sits back. Deriving it means
 * the depth stays right when a shard is resized or a new one is added.
 *
 * Normalised against the widest shard PRESENT, not an absolute px constant, so
 * the full depth range is used at every viewport: at 360px every shard is
 * small, but the biggest one there is still the nearest one there.
 */
export function depthOf(p: Placed, widest: number): number {
	if (widest <= 0) return 0;
	// Smallest shards sit at ~0.35 of the widest, so a raw w/widest ratio only
	// ever spans 0.35..1 and wastes two thirds of the range. Rescale so the
	// narrowest present reads as a true 0 and the widest as a true 1.
	const NARROWEST_RATIO = 0.35;
	const ratio = Math.min(1, p.w / widest);
	const t = (ratio - NARROWEST_RATIO) / (1 - NARROWEST_RATIO);
	return Math.max(0, Math.min(1, t));
}

/**
 * Vertical parallax offset, in px, for a shard at `depth` given `scrolled` px.
 *
 * NEGATIVE = the shard rises relative to the page as you scroll down, i.e. it
 * scrolls slightly SLOWER than the background — the "foreground is a little
 * taller than the background" feel. Near shards get the most travel, far ones
 * almost none, so the layers separate as the page moves.
 *
 * MAX_RATE is deliberately small (0.12 = 12% of scroll distance). Parallax
 * this subtle is felt rather than noticed, which is the brief: "not a lot, but
 * a bit".
 */
export const MAX_PARALLAX_RATE = 0.12;

export function parallaxY(depth: number, scrolled: number): number {
	return -scrolled * MAX_PARALLAX_RATE * depth;
}

/**
 * Paint band for a depth: 0 (nearest) .. -2 (furthest).
 *
 * Feeds `z-index: calc(2 + var(--layer))`, so near shards paint over far ones
 * and the stacking agrees with the shadow and the parallax rate.
 *
 * Returns an INTEGER, and is discrete on purpose. z-index accepts only
 * integers, so passing the continuous depth through a calc() lets the browser
 * ROUND it — measured in Chrome, depths 0.65 and 0.05 became z-index 3 and 2,
 * a hard cut at 0.5 masquerading as an ordering. Three honest bands beat a
 * continuous value silently quantised to two.
 *
 * NEGATIVE offsets because 2 is a ceiling, not a midpoint: the grass band sits
 * at z-index 3 and the mascot has to keep running in front of every shard.
 */
export function layerOf(depth: number): number {
	if (depth >= 0.66) return 0;
	if (depth >= 0.33) return -1;
	return -2;
}

/** One section's inputs. */
export type SectionInput = {
	height: number;
	specs: ShardSpec[];
};

/**
 * Resolve every section.
 *
 * This used to solve all sections in one shared page coordinate space, because
 * a shard hanging below the hero's bottom edge could collide with one poking up
 * from the headline section and neither per-section solve could see the other.
 * With no collision rule there is nothing to share: each section is independent,
 * and `offsetY` — which existed only to put both rings in one coordinate space
 * for the solver — is gone with it.
 */
export function layoutPage(
	vw: number, sections: SectionInput[],
): Placed[][] {
	return sections.map((s) => place(s.specs, vw, s.height));
}
