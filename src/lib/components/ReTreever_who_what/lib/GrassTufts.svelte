<script lang="ts">
/**
 * A sparse scatter of individual grass clumps drawn IN FRONT of the mascot,
 * so he runs through the grass rather than along a line behind it.
 *
 * Why this exists as a separate layer: the band's two painted layers
 * (`uppergrass_back` / `uppergrass_front`) are both full-bleed washes
 * spanning the whole width. A wash can only ever be entirely behind the dog
 * or entirely in front of him — there is no "some of it" — so the dog read
 * as pasted behind a green curtain. Depth needs OCCLUDERS WITH GAPS: a few
 * discrete clumps he passes behind, with open ground between them.
 *
 * The scatter is generated, not hand-placed, so it stays even at any width
 * while still looking unplanned — see `positions` below.
 */

let {
	class: className = "",
	/**
	 * Average gap between tufts, as a fraction of viewport width.
	 *
	 * The brief is "one every about the length of the dog, on average". The
	 * dog is `clamp(300px, 64vw, 1200px)`, so his length as a FRACTION of the
	 * viewport is not constant — he's 72% of a 414px phone but only 47% of a
	 * 2560px monitor. Spacing by a flat 0.64 therefore gives two tufts on a
	 * phone and a crowd on a desktop. Expressing the default in CSS lets
	 * `clamp()` do the same maths the dog uses, so the ratio holds: see the
	 * `--tuft-gap` token in the stylesheet below.
	 */
	spacing = null,
	/** Tuft height as a fraction of the band's height. */
	scale = 1,
}: {
	class?: string;
	spacing?: number | null;
	scale?: number;
} = $props();

/**
 * Viewport width, tracked on resize.
 *
 * NOT `bind:clientWidth` on the layer, and NOT `getComputedStyle`. Both are
 * DOM MEASUREMENTS, and measuring an element whose contents this component
 * renders creates a feedback cycle: measure -> recompute the scatter ->
 * re-render the tufts -> layout changes -> measure fires again, forever.
 * That froze the renderer hard enough that the tab could not even be closed.
 * `innerWidth` is independent of anything rendered here, so the cycle
 * cannot form.
 */
let vw = $state(0);

$effect(() => {
	const read = () => {
		vw = window.innerWidth;
	};
	read();
	addEventListener("resize", read, { passive: true });
	return () => removeEventListener("resize", read);
});

/**
 * The dog's rendered width in px — the same clamp the mascot uses.
 *
 * Kept in sync with GrassMascot's `--dog-w` by the DOG_W constants below.
 * These duplicate the CSS deliberately: the alternative (reading the custom
 * property back with getComputedStyle) is a layout read, which is what
 * caused the freeze above. Two numbers in two places is the cheaper problem,
 * and the comment in GrassMascot points here.
 */
const DOG_W_MIN = 190;
const DOG_W_VW = 0.38;
const DOG_W_MAX = 680;
const dogWidth = $derived(
	vw > 0 ? Math.min(Math.max(DOG_W_MIN, DOG_W_VW * vw), DOG_W_MAX) : 0,
);

/**
 * Gap between tufts, as a fraction of the layer width.
 *
 * The brief was "one every about the length of the dog". Taken literally
 * that yields TWO tufts on any screen — he is 64vw wide, so a full
 * dog-length gap is nearly two-thirds of the viewport, and two clumps
 * cannot occlude a moving animal in any readable way.
 *
 * What the eye actually reads as "running through grass" is a clump every
 * body DEPTH or so — he's 438x280, so his height is ~0.64 of his length.
 * Dividing by DENSITY gets there and keeps the spacing tied to his real
 * size, so it still scales with him instead of being a fixed count.
 */
const DENSITY = 3;
const gapFraction = $derived(
	spacing ?? (vw > 0 ? dogWidth / vw / DENSITY : 0.38 / DENSITY),
);

/**
 * The 14 clump cutouts, both hands, so repeats don't read as stamps.
 *
 * Each carries its own aspect ratio because the cutouts are NOT uniform —
 * they run from 1.02:1 (clump 4, tall and upright) to 1.48:1 (clump 3, wide
 * and spreading). A single shared ratio squashed the tall ones noticeably.
 * All are 320px wide after the resize, so ratio = 320 / height.
 */
const CLUMPS: { n: number; h: number }[] = [
	{ n: 3, h: 216 },
	{ n: 4, h: 314 },
	{ n: 5, h: 261 },
	{ n: 6, h: 309 },
	{ n: 7, h: 227 },
	{ n: 8, h: 304 },
	{ n: 9, h: 253 },
];

const ART = CLUMPS.flatMap((c) =>
	["", "-flipped"].map((v) => ({
		src: `/pub-Rtvr/home/tufts/tuft-${c.n}${v}.webp`,
		ratio: 320 / c.h,
	})),
);

/**
 * Deterministic pseudo-random. A seeded hash rather than Math.random()
 * because this component renders on the server too: Math.random() would
 * produce a different scatter on the server than on the client, and Svelte
 * would flag the hydration mismatch. Same seed in, same scatter out.
 *
 * Integer-hash (not the usual sin-based one-liner): sin() is far too smooth
 * at small consecutive seeds — successive integers gave near-identical
 * outputs, which picked the SAME clump art several tufts in a row. Bit-mixing
 * decorrelates neighbours properly.
 */
function rand(seed: number): number {
	let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
	h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
	h ^= h >>> 16;
	return (h >>> 0) / 4294967296;
}

/**
 * Jittered-grid scatter. Pure random placement clumps and leaves bald
 * patches (the classic "random doesn't look random" problem); an even grid
 * reads as a fence. So: lay down a regular grid at `spacing`, then push each
 * tuft up to ±40% of a cell off its node. Guaranteed coverage, no visible
 * rhythm.
 *
 * Positions run to 110% and start at -5% so the row doesn't visibly begin
 * and end inside the viewport.
 */
const positions = $derived.by(() => {
	const step = gapFraction * 100;
	const out: {
		left: number;
		src: string;
		ratio: number;
		h: number;
		z: number;
	}[] = [];

	/**
	 * SHUFFLED BAG, not an independent pick per tuft.
	 *
	 * Picking `ART[floor(rand() * 14)]` each time is independent, so by the
	 * birthday problem a repeat is likely almost immediately — and a repeat
	 * is glaring here, because a duplicated clump is a recognisable shape
	 * stamped twice in the same row. Instead: shuffle all 14, deal them out
	 * in order, and only reshuffle once the bag is empty. Guarantees every
	 * distinct clump appears before any repeats, which is what "there's like
	 * eight different tufts, don't repeat" actually requires.
	 */
	const bag = ART.map((a, i) => ({ a, k: rand(i * 101 + 7) }))
		.sort((p, q) => p.k - q.k)
		.map((p) => p.a);

	for (let i = 0, x = -5; x < 110; i++, x += step) {
		const r1 = rand(i * 3 + 1);
		const r3 = rand(i * 3 + 3);
		const art = bag[i % bag.length];
		out.push({
			left: x + (r1 - 0.5) * step * 0.8,
			src: art.src,
			ratio: art.ratio,
			// Varied height reads as depth — nearer clumps are taller.
			// Deliberately SMALL (18-40% of the band): these are little tufts
			// the dog passes behind, not a hedge. Anything taller stops
			// reading as foreground detail and becomes another wall.
			h: (18 + r3 * 22) * scale,
			// A few sit fractionally lower so they overlap each other.
			z: r3 > 0.6 ? 1 : 0,
		});
	}
	return out;
});
</script>

<div class="tuft-layer {className}" aria-hidden="true">
	{#each positions as t, i (i)}
		<img
			src={t.src}
			alt=""
			decoding="async"
			class="tuft"
			style:left="{t.left}%"
			style:height="{t.h}%"
			style:aspect-ratio={t.ratio}
			style:z-index={t.z}
		/>
	{/each}
</div>

<style>
	/* Sits in the band's own stacking context, above the mascot child. */
	.tuft-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	/* Rooted on the band's baseline so every clump grows from the same ground
	   line regardless of its height. translateX(-50%) makes `left` the tuft's
	   CENTRE, which is what the scatter maths above assumes.

	   `width: auto` alone measured ZERO here: an absolutely-positioned
	   replaced element with a percentage height has no definite height at
	   layout time to derive the auto width from, so it collapsed and the
	   tufts were invisible. Each element carries its own `aspect-ratio`
	   inline (the cutouts vary from 1.02:1 to 1.48:1 — a shared ratio
	   squashed the tall ones), so the width follows the height as intended. */
	.tuft {
		position: absolute;
		bottom: 0;
		width: auto;
		object-fit: contain;
		object-position: bottom center;
		transform: translateX(-50%);
		user-select: none;
	}
</style>
