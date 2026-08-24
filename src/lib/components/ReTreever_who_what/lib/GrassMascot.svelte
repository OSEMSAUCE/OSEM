<script lang="ts">
import { cn } from "$harness/core/utils";

let {
	class: className = "",
	ground = "divider",
	idleDelay = 4000,
}: {
	class?: string;
	/**
	 * Which surface the dog runs on. `divider` plants it on the slanted top
	 * edge of the pine-seedling strip; `grass` plants it flat, standing in the
	 * wildflower band at the foot of a section.
	 */
	ground?: "divider" | "grass";
	/** Quiet time before he trots past, in ms. */
	idleDelay?: number;
} = $props();

/**
 * He runs ONE lap, `idleDelay` after the page goes quiet — an easter egg you
 * catch while reading, not a looping banner that pulls the eye off the search
 * box. `run` gates the animation; the {#key} in the markup remounts the
 * element so a second idle period replays it from frame 0 (restarting a
 * finished CSS animation otherwise needs a reflow hack).
 */
let run = $state(false);
let lap = $state(0);

$effect(() => {
	// This effect must depend on NOTHING it also writes, or it re-runs its
	// own arm() forever and freezes the renderer (it did, twice). Two subtle
	// traps, both fixed here:
	//   * `lap += 1` READS lap before writing it — a dependency.
	//   * `run = false` on a $state read by the template is fine, but only
	//     because we never read `run` back inside the effect.
	// `idleDelay` is captured once into a local so the prop isn't tracked
	// either; the mascot never changes its delay at runtime.
	const delay = idleDelay;
	let timer: ReturnType<typeof setTimeout>;
	let released: ReturnType<typeof setTimeout>;
	let running = false;
	let n = 0; // plain counter — the {#key} value, kept OUT of the graph

	// Any interaction resets the clock: the point is INACTIVITY, so a user
	// who is actively scrolling or typing shouldn't have a dog cross their
	// field of view. Reading counts as inactive, hence no mousemove here —
	// a resting cursor twitch would otherwise starve the timer forever.
	const EVENTS = ["pointerdown", "keydown", "scroll", "wheel", "touchstart"];

	const arm = () => {
		clearTimeout(timer);
		clearTimeout(released);
		running = false;
		run = false;
		timer = setTimeout(() => {
			running = true;
			n += 1;
			lap = n; // WRITE only — never `lap += 1`, which would read it
			run = true;
			// Release the guard once the lap is over so a later quiet spell
			// can trigger another. Without this he runs exactly once per page
			// load and never again. The crossing is --dog-cross (~1.5-2.5s);
			// 6s clears the slowest case with room to spare, and the exact
			// value only decides how soon a NEXT run may be armed, not how
			// long he is on screen. Its own handle, so arm() can cancel it
			// without clobbering the pending idle timer.
			released = setTimeout(() => {
				running = false;
			}, 6000);
		}, delay);
	};

	const onActivity = () => {
		// Don't yank him off mid-stride — let the current lap finish, then
		// require a fresh quiet spell before the next one.
		if (!running) arm();
	};

	arm();
	for (const e of EVENTS) {
		addEventListener(e, onActivity, { passive: true });
	}

	// A backgrounded tab shouldn't burn its idle timer and have the dog
	// already gone when the user returns.
	const onVisibility = () => {
		if (document.visibilityState === "visible" && !running) arm();
	};
	document.addEventListener("visibilitychange", onVisibility);

	return () => {
		clearTimeout(timer);
		clearTimeout(released);
		for (const e of EVENTS) removeEventListener(e, onActivity);
		document.removeEventListener("visibilitychange", onVisibility);
	};
});
</script>

<!-- 24fps run-cycle sprite (12-frame, 4x3 grid) crossing right-to-left on a
     loop, independent of the leg-cycle timing — see
     agents/skills/frame-sequence-sprite-animation for how the sheet was built. -->
<div class={cn("mascot-track", className)} aria-hidden="true">
	{#key lap}
		{#if run}
			<div class="mascot-run" class:on-grass={ground === "grass"}></div>
		{/if}
	{/key}
</div>

<style>
	/* THE dog's width. Change his size here.
	   NOTE: GrassTufts.svelte mirrors these three numbers as DOG_W_MIN /
	   DOG_W_VW / DOG_W_MAX to space the tufts at one-per-body-depth. Keep
	   them in sync. They are duplicated on purpose — the tufts previously
	   read this property back via getComputedStyle, and that layout read
	   fed a measure/render cycle that locked up the renderer. */
	:global(:root) {
		--dog-w: clamp(190px, 38vw, 680px);
	}

	/* Must NOT clip: running along the strip's top edge puts most of the dog's
	   body above this box. The horizontal off-screen travel is clipped by the
	   page's own overflow-x: hidden instead. */
	.mascot-track {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
	}

	/* The mascot runs along the TOP edge of the divider strip, which is slanted:
	   measured off Search_page_Middle_Divider.svg's border path, that edge sits
	   at 2.85% from the top on the left and 17.78% on the right — a 0.65° slope,
	   the "slight angle" called out in the desktop layout plan. `bottom` plants
	   the feet on that edge and `rotate` both tilts the dog to match the strip
	   and (see mascotCross) supplies the rise for the rest of the crossing. */
	.mascot-run {
		position: absolute;
		bottom: 89.68%;
		left: 0;
		/* ~8x the original clamp(90px, 8vw, 160px). He was a speck against a
		   full-width band of grass and read as an insect crawling past, not
		   the mascot. 1000px is the size that reads right on a desktop
		   window, so the fluid middle is tuned to hit it there. */
		width: var(--dog-w);
		aspect-ratio: 438 / 280;
		rotate: 0.65deg;
		background-image: url("/pub-Rtvr/animations/mascot-run-sprite.webp");
		background-repeat: no-repeat;
		background-size: 400% 300%;
		/* GAIT — why this is derived and NOT a breakpoint.
		   His stride length is tied to HIS OWN BODY: the leg cycle is a
		   fixed 12-frame loop, so one cycle = one stride ≈ one body length.
		   But his ground speed was tied to the VIEWPORT: `mascotCross`
		   travels 160vw, which is far more pixels on a wide screen than on a
		   narrow one. Two different rulers. So with any FIXED duration he is
		   correct at exactly one window width and wrong everywhere else —
		   paws slipping forward when wide (conveyor too fast), backward when
		   narrow (too slow). A breakpoint would only move that error around,
		   making him right at two widths instead of one.
		   The fix is to stop hard-coding the duration and DERIVE it, so the
		   ratio holds at every width automatically:
		     ground-per-stride = (travel / crossDur) * legDur
		     want: ground-per-stride ≈ 1 body length = --dog-w
		     so:   crossDur = legDur * travel / --dog-w
		   --dog-travel is the real distance mascotCross covers: on from
		   120vw right, off to his own width plus 5vw past the left edge.
		   It is defined ONCE and used by both the keyframe and this
		   duration, so the two can't drift apart — change the entrance or
		   exit and the gait follows automatically.
		   Because --dog-w is itself in vw through the fluid range, the vw
		   units cancel and his gait stays correct as the window resizes —
		   no breakpoint, no magic numbers. Verify at ANY width with:
		     travel = 1.25 * innerWidth + width;
		     ground = (travel / crossSec) * legSec;  ground / width
		   which should land near 1.0 everywhere.

		   --dog-w is declared on :root (below) rather than here, because
		   GrassTufts reads it to space the tufts at one-per-body-depth.
		   Two copies of the clamp meant the tuft density silently kept
		   using the old width the moment the dog was resized. */
		/* Stride time — the ONE free knob. --dog-cross follows it, so the
		   gait stays locked at ~1.0 body lengths per stride whatever you
		   pick, and the paws never slip. It trades against time-on-screen:
		   a real dog trots at roughly 2 strides/sec, and going much slower
		   to keep him around longer reads as slow motion. 0.55s is a natural
		   trot; if he should linger, make him WIDER (--dog-w) rather than
		   slower — a bigger dog covers the screen in fewer strides, so the
		   crossing lengthens without the legs looking wrong. */
		--dog-leg: 0.55s;
		/* Distance mascotCross actually covers — see that keyframe. Single
		   source of truth for both the duration and the leg-cycle count. */
		--dog-travel: calc((125 * 1vw) + var(--dog-w));
		--dog-cross: calc(var(--dog-leg) * var(--dog-travel) / var(--dog-w));
		/* ONE crossing, then gone. He runs on from the right, crosses, and
		   exits left for good — no loop.
		   The leg cycle can't just be `infinite` alongside it: the dog would
		   sit off-screen churning his legs forever, an animation that never
		   settles. But it also can't be `1` — that's one stride out of the
		   many the crossing takes. It has to run for exactly as long as the
		   crossing, so the count is DERIVED the same way the duration is:
		     legIterations = crossDur / legDur = --dog-travel / --dog-w
		   The length units cancel to a bare number, which is what
		   animation-iteration-count wants. A fractional count is correct
		   and intended: the legs stop wherever the crossing ends rather
		   than being rounded to a whole stride.
		   `forwards` on the crossing holds him at the final keyframe
		   (fully off-stage left) instead of snapping back to the right
		   edge for a frame when the animation ends. */
		animation:
			mascotLegCycle var(--dog-leg) step-end calc(var(--dog-travel) / var(--dog-w)),
			mascotCross var(--dog-cross) linear 1 forwards;
	}

	/* Flat ground: the wildflower band is level, so drop the strip's 0.65° tilt
	   (which would otherwise make the dog sink as it crosses — see mascotCross)
	   and set the feet just inside the top of the grass rather than above it. */
	.mascot-run.on-grass {
		bottom: 0%;
		rotate: 0deg;
	}

	@keyframes mascotLegCycle {
		0% {
			background-position: 0% 0%;
		}
		8.3333% {
			background-position: 33.3333% 0%;
		}
		16.6667% {
			background-position: 66.6667% 0%;
		}
		25% {
			background-position: 100% 0%;
		}
		33.3333% {
			background-position: 0% 50%;
		}
		41.6667% {
			background-position: 33.3333% 50%;
		}
		50% {
			background-position: 66.6667% 50%;
		}
		58.3333% {
			background-position: 100% 50%;
		}
		66.6667% {
			background-position: 0% 100%;
		}
		75% {
			background-position: 33.3333% 100%;
		}
		83.3333% {
			background-position: 66.6667% 100%;
		}
		91.6667% {
			background-position: 100% 100%;
		}
	}

	/* Only X is animated. CSS applies the standalone `rotate` property BEFORE the
	   `transform` property, so this translateX runs in the already-tilted frame
	   and carries the dog down the 0.65° slope on its own — 26.1px of rise over
	   the crossing, against the 26.2px the strip's top edge actually drops.
	   Adding a translateY here would double-count it and the dog would sink.

	   The end position must clear HIS OWN WIDTH, not a guessed slice of the
	   viewport. The old `-40vw` was written when this looped: it only had to
	   get him out of sight before the restart, and any leftover sliver was
	   masked by the animation instantly beginning again. Now that he runs
	   ONCE and `forwards` holds him at this final frame, an end position that
	   doesn't fully clear him leaves a dog parked at the screen edge for
	   good. He is --dog-w wide (up to 72vw at the clamp floor on a narrow
	   phone, far more than 40vw), so subtract his actual width plus a small
	   margin. Same rule as the gait above: derive it, don't guess a number
	   that happens to work at one width. */
	@keyframes mascotCross {
		0% {
			transform: translateX(120vw);
		}
		100% {
			transform: translateX(calc(-1 * var(--dog-w) - 5vw));
		}
	}

	/* NO prefers-reduced-motion gate — repo law, see GlobeSpinIcon.svelte. */
</style>
