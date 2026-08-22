/**
 * doubleTapToPin.ts — the shared "double-tap OR long-press → Snake Ruler" gesture.
 *
 * ONE implementation, used by BOTH the offline wall map (`/mobile/offlinev4`)
 * and the online map (`/mobile/map`) — the popover chrome, the bullseye, the
 * "Drop" button and the gesture plumbing must never drift between them.
 *
 * Behaviour:
 *   • single tap does nothing (it would fight the map pan)
 *   • double tap OR long-press (500ms hold) initiates the Snake Ruler: names
 *     what's under it (best-effort `identify`), flashes an optional outline
 *     (`onSelect`), plants the first ruler node, and shows the popover with
 *     Save (drop pin) / Share (copy GPS) for a lone point, or hand cursors
 *     to grow a line/polygon
 *   • ONLY two deliberate gestures seed: a double-click, or a press held past
 *     ~550ms that never moved past slop (mouse 6px / touch 14px). The long-
 *     press fires FROM THE TIMER while the pointer is still down — so a plain
 *     click (released early) and a drag (moved past slop, or the map's own
 *     `dragstart`) both kill the timer and seed nothing.
 *   • zoom becomes two-finger / pinch only (the default dblclick-zoom is off)
 *
 * The popover is a DOM `mapboxgl.Popup` (no glyphs → air-gap safe on the
 * offline map). Styling lives in the global `mobile.css` (`.rtr-droppin-*`).
 */
import type { MapMouseEvent, MapTouchEvent, Point } from "mapbox-gl";

/**
 * The slice of a map this file needs — structural, so BOTH renderers fit.
 *
 * The online map is Mapbox, the offline map (/mobile/offlinev4) is MapLibre.
 * Every event name bound below (`dblclick`, the mouse/touch/drag set,
 * `contextmenu`) exists in both, and the three event fields actually read —
 * `point`, `lngLat`, `originalEvent` — are identically shaped. `Point` is
 * literally the same package in both (`@mapbox/point-geometry`), so the type
 * imports above stay honest for either library.
 *
 * `on`/`off` are typed loosely on purpose: both libraries overload them heavily
 * and differently (Mapbox returns `this`, MapLibre returns a `Subscription`),
 * and a union of the two is unusable at the call site. The return value is
 * discarded here in every case.
 */
type TapMap = {
	doubleClickZoom: { disable(): void };
	// biome-ignore lint/suspicious/noExplicitAny: two renderers, two overload sets
	on(type: string, listener: (e: any) => void): unknown;
	// biome-ignore lint/suspicious/noExplicitAny: mirrors `on`
	off(type: string, listener: (e: any) => void): unknown;
};

// ── Long-press release → swallow the synthetic click ──────────────────────
// When a long-press seeds the ruler, the pointer is STILL DOWN. The release
// that follows never moved past slop, so the browser fires a normal `click`
// — and every map click handler (feature hit-test → popover, outside-tap
// close, etc.) runs as if the user tapped. Kill that one click at the DOM
// capture phase, before Mapbox ever sees it. A window-capture listener (not
// shared module state) so Vite HMR module duplication can't fork the flag.
function swallowNextClick(windowMs = 250): void {
	const kill = (e: MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		cleanup();
	};
	const cleanup = () => window.removeEventListener("click", kill, true);
	window.addEventListener("click", kill, true);
	// The click lands within ms of mouseup; if none comes (e.g. the browser
	// suppressed it), expire fast so no genuine later tap gets eaten.
	setTimeout(cleanup, windowMs);
}

export interface IdentifyResult {
	/** Human label for what's under the tap ("Forest", "Railway"…). */
	label: string;
	/** If present, the caller's `onSelect` is called with it (outline flash). */
	geometry?: GeoJSON.Geometry;
}

export interface DoubleTapToPinOpts {
	/** Best-effort: name what's under the tapped point ("Forest", "Ontario"…).
	 *  Return null when nothing can be named — the popover then shows ONLY the
	 *  GPS point (no misleading headline). */
	identify?: (point: Point) => IdentifyResult | null | undefined;
	/** Optional: draw (geometry) or clear (null) a selection outline. */
	onSelect?: (geometry: GeoJSON.Geometry | null) => void;
	/** Drop the real pin here (caller sets `dropPinAt = [lng, lat]`). */
	onDrop: (lng: number, lat: number) => void;
	/** Snake Ruler: plant the first ruler node at the double-tapped bullseye so
	 *  it's immediately grabbable (the gesture itself — press a node + drag —
	 *  is handled by Mapbox layer events in MapDrawControls, not here). */
	onMeasureSeed?: (lng: number, lat: number) => void;
	/** Hands the caller a fn that tears down the current "Drop" card + bullseye.
	 *  The caller calls it the moment the double-tap turns into a ruler drag —
	 *  the "Drop a pin" card is stale once it's a line. */
	registerDismiss?: (dismiss: () => void) => void;
}

/**
 * Wire the gesture onto a Mapbox map. Returns a detach function (call it on
 * teardown to remove the handler + any live popover/bullseye).
 */
export function attachDoubleTapToPin(
	map: TapMap,
	opts: DoubleTapToPinOpts,
): () => void {
	map.doubleClickZoom.disable(); // dblclick drops a pin; pinch / two-finger zooms

	// Just clears the identify outline. No popup / decorative bullseye anymore —
	// the Snake Ruler renders the node AND its Save/Share popover (for a lone
	// point: Save drops a pin, Share copies the GPS).
	const teardown = () => opts.onSelect?.(null);
	opts.registerDismiss?.(teardown);

	const onDbl = (e: MapMouseEvent) => {
		teardown(); // clear any prior outline
		const hit = opts.identify?.(e.point) ?? null;
		if (hit?.geometry) opts.onSelect?.(hit.geometry);
		// Seed the Snake Ruler's first node at the tap. It renders the bullseye
		// and shows the Save (drop pin) / Share (copy GPS) popover for one point,
		// or grows into a line/polygon as you drag.
		opts.onMeasureSeed?.(e.lngLat.lng, e.lngLat.lat);
	};

	// ── Long-press support ──────────────────────────────────────────────────
	// A long-press initiates the Snake Ruler, matching double-click. ONLY two
	// deliberate gestures may seed the ruler: a double-click, or a press held
	// past LONG_PRESS_MS that never moved. Everything else — a plain click, a
	// drag/pan, a flick — must NOT seed.
	//
	// This is the canonical JS long-press recipe (long-press-event lib, Space
	// Jelly, thetallweeks): the long-press fires FROM THE TIMER while the
	// pointer is STILL DOWN, and only if it never moved past slop. A plain
	// click releases before the timer → cancelled. A drag crosses slop → the
	// timer is killed. So the timer firing is itself proof of "held + still".
	//
	//   mousedown            → arm timer, record start point
	//   mousemove > slop      → DRAG: kill timer (never fires)
	//   mouseup before timer  → CLICK: kill timer (never fires)
	//   timer fires (still down, still still) → LONG-PRESS: seed now
	//
	// The slop is intentionally TIGHT on desktop: a mouse is precise, so any
	// real movement means the user is dragging, not pressing.
	const LONG_PRESS_MS = 550;
	const MOUSE_SLOP_PX = 6; // mouse is precise — tiny radius
	const TOUCH_SLOP_PX = 14; // a finger wobbles — looser radius
	const DEBUG = false; // flip true for verbose [snake-gesture] gesture logging
	const log = (...a: unknown[]) => {
		if (DEBUG) console.log("[snake-gesture]", ...a);
	};

	let pressStart: { x: number; y: number } | null = null;
	let pressLngLat: { lng: number; lat: number } | null = null;
	let pressPoint: Point | null = null;
	let isTouch = false; // touch gesture → use the looser radius
	let pressTimer: ReturnType<typeof setTimeout> | null = null;
	let downAt = 0; // ms timestamp of mousedown (for logging only)

	// Once the long-press fires, the EVENTUAL release will still produce a
	// `click` — swallow it whenever it comes. Armed on the raw DOM release
	// (window capture), NOT on the map's mouseup: seeding mounts DOM (node,
	// palette, arm) under the still-held pointer, which fires the map's
	// `mouseout` and wipes any map-event bookkeeping before the release.
	let disarmReleaseSwallow: (() => void) | null = null;
	const armReleaseSwallow = () => {
		disarmReleaseSwallow?.();
		const evtName = isTouch ? "touchend" : "mouseup";
		const onRelease = () => {
			disarmReleaseSwallow = null;
			swallowNextClick();
			log("⬆️ release after long-press → swallowing its click");
		};
		window.addEventListener(evtName, onRelease, { capture: true, once: true });
		disarmReleaseSwallow = () => {
			window.removeEventListener(evtName, onRelease, true);
			disarmReleaseSwallow = null;
		};
	};

	const killTimer = () => {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	};

	const fireLongPress = () => {
		pressTimer = null;
		if (!pressLngLat) return;
		armReleaseSwallow();
		log("✅ LONG-PRESS fires → seed ruler", {
			heldMs: Math.round(performance.now() - downAt),
		});
		teardown(); // clear any prior outline
		const hit = pressPoint ? (opts.identify?.(pressPoint) ?? null) : null;
		if (hit?.geometry) opts.onSelect?.(hit.geometry);
		opts.onMeasureSeed?.(pressLngLat.lng, pressLngLat.lat);
	};

	// DESKTOP SAFARI DOES NOT DEFINE `TouchEvent`. A bare `evt instanceof
	// TouchEvent` is therefore a ReferenceError — not false — and it threw on
	// EVERY map press, killing the gesture and red-screening the page. Chrome
	// defines the constructor even on a mouse-only machine, which is exactly why
	// this survived: it is invisible in the browser most testing happens in.
	//
	// Duck-type instead of brand-check. `touches` is the property we actually
	// need, so asking for it directly is both safer and more honest than asking
	// what class the event is.
	const isTouchLike = (
		evt: MouseEvent | TouchEvent,
	): evt is TouchEvent => "touches" in evt;

	const getClientCoords = (evt: MouseEvent | TouchEvent) => {
		if (isTouchLike(evt) && evt.touches.length > 0) {
			return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
		}
		return { x: (evt as MouseEvent).clientX, y: (evt as MouseEvent).clientY };
	};

	const onDown = (e: MapMouseEvent | MapTouchEvent) => {
		// Ignore secondary / non-primary buttons (right-click etc.) on mouse.
		const oe = e.originalEvent;
		if (oe instanceof MouseEvent && oe.button !== 0) return;
		pressStart = getClientCoords(oe);
		pressLngLat = e.lngLat;
		pressPoint = e.point;
		isTouch = isTouchLike(oe); // never `instanceof TouchEvent` — see above
		downAt = performance.now();
		killTimer();
		pressTimer = setTimeout(fireLongPress, LONG_PRESS_MS);
		log("⬇️ down — timer armed", { isTouch, at: pressStart });
	};

	const cancelPress = (why: string) => {
		if (pressStart) log(`✖️ cancel (${why})`);
		killTimer();
		pressStart = null;
		pressLngLat = null;
		pressPoint = null;
	};

	const onMove = (e: MapMouseEvent | MapTouchEvent) => {
		if (!pressStart || !pressTimer) return; // nothing armed
		const coords = getClientCoords(e.originalEvent);
		const dist = Math.hypot(coords.x - pressStart.x, coords.y - pressStart.y);
		const slop = isTouch ? TOUCH_SLOP_PX : MOUSE_SLOP_PX;
		if (dist > slop) {
			log("↔️ move past slop → DRAG, not press", {
				dist: Math.round(dist),
				slop,
			});
			cancelPress("drag past slop");
		}
	};

	const onUp = () => {
		// Released before the timer fired → it was a click, not a long-press.
		if (pressTimer)
			log("⬆️ up before timer → CLICK (no seed)", {
				heldMs: Math.round(performance.now() - downAt),
			});
		cancelPress("pointer up");
	};

	// Named wrappers so on/off share the same refs (inline arrows wouldn't detach).
	const onMouseOut = () => cancelPress("mouseout");
	const onDragStart = () => cancelPress("map dragstart"); // map began panning
	const onContextMenu = () => cancelPress("contextmenu"); // right-click cancels
	const onTouchCancel = () => cancelPress("touchcancel");

	map.on("dblclick", onDbl);
	map.on("mousedown", onDown);
	map.on("mousemove", onMove);
	map.on("mouseup", onUp);
	map.on("mouseout", onMouseOut);
	map.on("dragstart", onDragStart); // belt-and-braces: any pan kills a press
	map.on("contextmenu", onContextMenu);
	// Touch events: same long-press on mobile
	map.on("touchstart", onDown);
	map.on("touchmove", onMove);
	map.on("touchend", onUp);
	map.on("touchcancel", onTouchCancel);

	return () => {
		map.off("dblclick", onDbl);
		map.off("mousedown", onDown);
		map.off("mousemove", onMove);
		map.off("mouseup", onUp);
		map.off("mouseout", onMouseOut);
		map.off("dragstart", onDragStart);
		map.off("contextmenu", onContextMenu);
		map.off("touchstart", onDown);
		map.off("touchmove", onMove);
		map.off("touchend", onUp);
		map.off("touchcancel", onTouchCancel);
		cancelPress("detach");
		disarmReleaseSwallow?.();
		teardown();
	};
}
