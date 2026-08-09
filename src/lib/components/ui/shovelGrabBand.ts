// shovelGrabBand — makes the shovel pull-handle draggable from a TALL band
// that reaches down past the tab bar to the bottom of the screen, without
// stealing taps from the buttons inside that band.
//
// ── THE PROBLEM ────────────────────────────────────────────────────────────
// The shovel's grab area used to be exactly the handle's own box (~4rem, plus
// 20px of forgiveness above it). Miss that thin band and the drag simply did
// not register — so opening the drawer meant hitting a sliver of screen, and
// the natural gesture (start low, fling up) did nothing.
//
// Growing the handle's box downward is not the fix: the tab bar is a SIBLING
// painted above the drawer (z-index 50 vs 22), so a taller handle sits UNDER
// it and receives nothing. An overlay above the tab bar has the opposite
// problem — it swallows the tab taps.
//
// ── THE FIX (same discipline the cache rows already use) ───────────────────
// Don't fight the layers. Let every element keep its own hit-testing and
// listen on `window` instead, filtered by Y:
//
//   pointerdown inside the band  → CANDIDATE only. Nothing is claimed, the
//                                  tab link behaves exactly as it always has.
//   ≥ SLOP_PX of vertical travel → the drag TAKES OVER: capture the pointer,
//                                  drive the drawer, and cancel the pending
//                                  tap so the finger cannot also navigate.
//   released under the slop      → it was a tap. We never interfered.
//
// So a press is a press and a drag is a drag, decided by motion — not by
// which pixel the finger happened to land on. This mirrors CacheRowList's
// swipe (SWIPE_THRESHOLD_PX = 6), which is why the two gestures feel alike.
//
// The band is measured live off the handle element each time the finger
// lands, so it tracks the drawer as it slides and needs no layout coupling.
// It runs from the handle's top edge to the bottom of the screen, minus
// anything the drawer's own body would have received (see inBand). That one
// rule gives both directions: fling UP from beside the home indicator to
// open, drag DOWN on the handle to close, and the open drawer's list still
// scrolls under your finger.

/** Vertical travel that promotes a candidate touch into a drawer drag.
 *  Matches CacheRowList's SWIPE_THRESHOLD_PX — one number, one feel. */
export const SHOVEL_SLOP_PX = 6;

/** Forgiveness ABOVE the shovel art, matching the old `::before` inset so
 *  the top edge of the band does not move. */
const BAND_TOP_PAD_PX = 20;

export type ShovelGrabBandOptions = {
	/** The pull-handle element. Its rect defines the TOP of the band; the
	 *  band always runs from there to the bottom of the viewport. */
	handle: () => HTMLElement | undefined;
	/** Current drawer offset in px (0 = fully open). */
	getOffset: () => number;
	/** Offset when fully closed. */
	getClosedOffset: () => number;
	/** Drive the drawer mid-drag. */
	setOffset: (px: number) => void;
	/** Drag started (after the slop was crossed) / ended. */
	onDragStart: () => void;
	/** Ends the drag. `velocity` is px/ms, positive = downward. */
	onDragEnd: (velocity: number) => void;
	/** The drawer's scrollable body element. Touches that would land inside
	 *  it are left alone, so an open drawer's own content keeps its
	 *  scrolling and its buttons. Omit if the drawer has no such body. */
	getBody?: () => HTMLElement | undefined;
	/** Optional: veto starting a drag (e.g. drawer disabled on this page). */
	enabled?: () => boolean;
};

/**
 * Attach the tall grab band. Returns a teardown function.
 *
 * Call once per drawer, from an $effect or onMount — it owns only window
 * listeners, so it is safe to attach before the handle element exists (the
 * band simply never matches until `handle()` resolves).
 */
export function attachShovelGrabBand(opts: ShovelGrabBandOptions): () => void {
	// Non-null only between pointerdown-in-band and pointerup: the candidate.
	let candidate: {
		pointerId: number;
		startY: number;
		startOffset: number;
		closedOffset: number;
		/** Flips true once SHOVEL_SLOP_PX is crossed — from then on we own it. */
		owned: boolean;
		lastY: number;
		lastTime: number;
		velocity: number;
	} | null = null;

	/** Is this point inside the band?
	 *
	 *  TOP    — the handle's own top edge, minus the forgiveness pad.
	 *  BOTTOM — the bottom of the screen, MINUS whatever the drawer's own body
	 *           is currently claiming.
	 *
	 *  That second clause is what makes the gesture work in BOTH directions,
	 *  and it is answered by HIT-TESTING, not by geometry. Two earlier
	 *  attempts got this wrong in instructive ways:
	 *
	 *    1. `enabled: () => !open` — killed the whole band while open, so the
	 *       drawer could not be dragged shut at all. A travelled finger has
	 *       its click swallowed by design, so the shovel's tap-to-close was
	 *       swallowed too and the drawer was genuinely stranded open.
	 *    2. Comparing against the body's bounding rect — the drawer is moved
	 *       with translateY, and getBoundingClientRect() reports the POST-
	 *       transform box. So the closed drawer's body is not "below the
	 *       fold" as it appears; it sits right under the handle, and the
	 *       band collapsed to nothing.
	 *
	 *  elementFromPoint sidesteps both. It reports what the browser would
	 *  ACTUALLY deliver the touch to, with transforms, stacking and
	 *  pointer-events already applied — and the body is `pointer-events:none`
	 *  until it opens. So: if the finger would land in the live drawer body,
	 *  leave it alone; anything else in the band (tab bar, handle, the empty
	 *  space beside it) is ours.
	 */
	function inBand(e: PointerEvent): boolean {
		const el = opts.handle();
		if (!el) return false;
		const rect = el.getBoundingClientRect();
		if (rect.height === 0) return false; // not laid out / hidden
		if (e.clientY < rect.top - BAND_TOP_PAD_PX) return false;

		// Would this touch land inside the drawer's own scrollable body? Then
		// it belongs to the body (scrolling the list, pressing its buttons),
		// not to the drag. The handle itself is a SIBLING of the body, so
		// grabbing the handle to pull the drawer back down still passes.
		const body = opts.getBody?.();
		if (body) {
			const hit = document.elementFromPoint(e.clientX, e.clientY);
			if (hit && body.contains(hit)) return false;
		}
		return true;
	}

	function onPointerDown(e: PointerEvent) {
		if (candidate) return; // already tracking a finger
		if (e.button !== 0 && e.pointerType === "mouse") return;
		if (opts.enabled && !opts.enabled()) return;
		if (!inBand(e)) return;

		// Deliberately NOT preventDefault and NOT capturing yet — at this point
		// the gesture may still turn out to be a tab tap, and claiming it here
		// is exactly the bug we are fixing.
		candidate = {
			pointerId: e.pointerId,
			startY: e.clientY,
			startOffset: opts.getOffset(),
			closedOffset: opts.getClosedOffset(),
			owned: false,
			lastY: e.clientY,
			lastTime: Date.now(),
			velocity: 0,
		};
	}

	function onPointerMove(e: PointerEvent) {
		const c = candidate;
		if (!c || e.pointerId !== c.pointerId) return;

		const dy = e.clientY - c.startY;

		if (!c.owned) {
			// Horizontal-ish or still-tiny movement: leave it alone. Only
			// VERTICAL travel means "drawer", so a sideways drift across the
			// tab bar never hijacks the finger.
			if (Math.abs(dy) < SHOVEL_SLOP_PX) return;

			c.owned = true;
			// Re-baseline to the crossing point so the drawer does not jump by
			// the slop distance the instant it takes over.
			c.startY = e.clientY;
			c.startOffset = opts.getOffset();
			c.closedOffset = opts.getClosedOffset();
			opts.onDragStart();
		}

		const now = Date.now();
		const dt = now - c.lastTime;
		if (dt > 0) c.velocity = (e.clientY - c.lastY) / dt;
		c.lastY = e.clientY;
		c.lastTime = now;

		// Suppress scrolling / text selection now that the gesture is ours.
		if (e.cancelable) e.preventDefault();

		const moved = e.clientY - c.startY;
		opts.setOffset(
			Math.max(0, Math.min(c.closedOffset, c.startOffset + moved)),
		);
	}

	function onPointerUp(e: PointerEvent) {
		const c = candidate;
		if (!c || e.pointerId !== c.pointerId) return;
		candidate = null;

		if (!c.owned) return; // it was a tap — the button already handled it

		// The finger travelled, so the press that started this gesture must NOT
		// also fire a click on whatever tab sits under it. Swallow exactly one
		// click, in the capture phase, before it reaches the link.
		const swallow = (ev: Event) => {
			ev.preventDefault();
			ev.stopPropagation();
		};
		window.addEventListener("click", swallow, { capture: true, once: true });
		// If no click materialises (the common case on a real drag), drop the
		// listener rather than leaving it armed for the user's NEXT tap.
		setTimeout(() => {
			window.removeEventListener("click", swallow, { capture: true });
		}, 350);

		opts.onDragEnd(c.velocity);
	}

	function onPointerCancel(e: PointerEvent) {
		const c = candidate;
		if (!c || e.pointerId !== c.pointerId) return;
		candidate = null;
		if (c.owned) opts.onDragEnd(c.velocity);
	}

	// `passive: false` on move so preventDefault can actually stop the page
	// scrolling once the drag is ours.
	window.addEventListener("pointerdown", onPointerDown);
	window.addEventListener("pointermove", onPointerMove, { passive: false });
	window.addEventListener("pointerup", onPointerUp);
	window.addEventListener("pointercancel", onPointerCancel);

	return () => {
		candidate = null;
		window.removeEventListener("pointerdown", onPointerDown);
		window.removeEventListener("pointermove", onPointerMove);
		window.removeEventListener("pointerup", onPointerUp);
		window.removeEventListener("pointercancel", onPointerCancel);
	};
}
