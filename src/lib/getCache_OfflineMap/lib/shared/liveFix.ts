/**
 * liveFix.ts — read the user's position for the BAKE service, passively.
 *
 * ⛔ THE LAW: this must never cause a permission prompt.
 *
 * The bake service runs app-wide on a 20 s loop from the mobile layout. If it
 * asked for location, a user would get the OS dialog out of nowhere — seconds
 * after launch, on a screen with nothing to do with the map, with no
 * explanation. That is the worst thing this file could do, and it dictates the
 * whole design:
 *
 *   • Every path is gated on `gpsIsGranted()`, which only INSPECTS permission
 *     state and never asks.
 *   • We deliberately do NOT use `getCurrentGps()` from captureGps.ts, even
 *     though it looks like the obvious shared helper: it calls
 *     `Geolocation.requestPermissions()` first, which PROMPTS. That's correct
 *     for the quality page (a user tapped a button) and disqualifying here.
 *     Don't "simplify" this back to getCurrentGps.
 *
 * The permission ASK belongs to THE LOCATION GATE — the blue-dot button the
 * user deliberately taps. This module only consumes a decision already made,
 * in the same spirit as the rest of the offline engine: it works silently with
 * what it is given and never demands anything.
 *
 * Two sources, cheapest first:
 *   1. `rt-last-fix` in localStorage — written (throttled) by the blue-dot
 *      controller in `/routes/mobile/map/userLocation.svelte.ts`. FREE: no GPS
 *      hardware, no battery. Plenty for a 30 km containment test, which is the
 *      only question we ask of it.
 *   2. One real fix, rarely — so a user who granted location but hasn't opened
 *      the map yet still gets covered. Hard rate-limited: the accuracy we need
 *      is measured in kilometres, so polling GPS would be pure battery burn.
 */
import { Geolocation } from "@capacitor/geolocation";
import { isUsableFix } from "$harness/mapShared/liveAnchor";
import type { LngLat } from "$harness/mapShared/kmGeo";

/**
 * Do we ALREADY have location permission? Inspect only — never prompt.
 *
 * Inlined rather than imported from the host's captureGps: it is seven lines
 * over the same @capacitor/geolocation API the poll below already uses, and
 * importing it was the engine's last tie to ReTreever's utils. `checkPermissions`
 * is the non-prompting call; `requestPermissions` is the one that shows a dialog,
 * and it is deliberately NOT used here. ([[location-gate]])
 */
async function gpsIsGranted(): Promise<boolean> {
	try {
		const p = await Geolocation.checkPermissions();
		return p.location === "granted" || p.coarseLocation === "granted";
	} catch {
		// codestyle-allow-swallow: no permissions API (dt-web) = not granted.
		return false;
	}
}

/** Written by the blue-dot controller (userLocation.svelte.ts). */
const LAST_FIX_KEY = "rt-last-fix";

/**
 * How stale a stored fix may be and still be trusted for containment.
 *
 * Six hours — enormously permissive by blue-dot standards, and right here: we
 * are not drawing a dot, we are asking "which blob are you in". For a user who
 * has not moved (the case this feature serves), a fix from this morning answers
 * that perfectly, and preferring it to a hardware poll is what makes this free.
 */
const STORED_FIX_MAX_AGE_MS = 6 * 60 * 60 * 1000;

/** Minimum gap between real GPS polls. Fifteen minutes — the cadence is a
 *  BATTERY budget, not a coverage guarantee: since the trigger tightened to the
 *  photo radius (1.5 km), a moving vehicle can cross several blobs between
 *  polls. That is the accepted trade. Someone driving has signal and will be
 *  re-covered when they stop; the person this feature exists for is the one
 *  standing still in the bush, and for them one poll is enough. The blue-dot
 *  controller refreshes this far more often whenever the map is open. */
const LIVE_FIX_MIN_INTERVAL_MS = 15 * 60 * 1000;

/** Low accuracy ON PURPOSE: a kilometre-scale containment test does not need a
 *  high-accuracy lock, and requesting one spins up the GPS radio.
 *  Coarse/network location answers the question at a fraction of the power. */
const POLL_OPTS = { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 };

let lastPollTs = 0;

/** Read the persisted blue-dot fix. Null if absent, corrupt, stale, or not a
 *  usable coordinate — all of which mean "we don't know where you are", which
 *  the caller treats as "bake nothing new". */
export function readStoredFix(now: number = Date.now()): LngLat | null {
	try {
		if (typeof localStorage === "undefined") return null;
		const raw = localStorage.getItem(LAST_FIX_KEY);
		if (!raw) return null;
		const p = JSON.parse(raw) as { lng?: unknown; lat?: unknown; ts?: unknown };
		const pos: LngLat = [Number(p?.lng), Number(p?.lat)];
		if (!isUsableFix(pos)) return null;
		const ts = Number(p?.ts);
		if (!Number.isFinite(ts) || now - ts > STORED_FIX_MAX_AGE_MS) return null;
		return pos;
	} catch {
		// codestyle-allow-swallow: a corrupt entry means "unknown position",
		// an ordinary state here rather than an error worth surfacing.
		return null;
	}
}

/**
 * Persist a polled fix under the SAME key + shape the blue-dot controller uses
 * (`userLocation.svelte.ts` — `{lng, lat, ts}`), so the two writers are
 * interchangeable and either one seeds the other's reads. Best-effort: storage
 * being full or blocked just costs us the free path next pass.
 */
function writeStoredFix(pos: LngLat, ts: number): void {
	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(
			LAST_FIX_KEY,
			JSON.stringify({ lng: pos[0], lat: pos[1], ts }),
		);
	} catch {
		// codestyle-allow-swallow: losing the cache costs one extra poll later,
		// never correctness — getLiveFix still returned the live value above.
	}
}

/**
 * The position to use as a live anchor this pass, or null if we don't know and
 * mustn't ask.
 *
 * Order matters: permission FIRST, so we never touch storage or hardware for a
 * user who hasn't opted in; then the free stored fix; then — rarely — one poll.
 */
export async function getLiveFix(): Promise<LngLat | null> {
	// Never prompt. gpsIsGranted only inspects existing permission state.
	if (!(await gpsIsGranted())) return null;

	const stored = readStoredFix();
	if (stored) return stored;

	const now = Date.now();
	if (now - lastPollTs < LIVE_FIX_MIN_INTERVAL_MS) return null;
	lastPollTs = now;
	try {
		const p = await Geolocation.getCurrentPosition(POLL_OPTS);
		const pos: LngLat = [p.coords.longitude, p.coords.latitude];
		if (!isUsableFix(pos)) return null;
		// PERSIST IT. Without this, a user who opens the offline map FIRST (never
		// visiting /mobile/map, the only other writer of this key) polls once,
		// then hits the 15-minute throttle with storage still empty — so the next
		// fourteen passes get null and bake nothing. Writing here makes the poll
		// self-sustaining: every later pass reads the free stored fix instead.
		writeStoredFix(pos, now);
		return pos;
	} catch {
		// codestyle-allow-swallow: no fix (indoors, cold start, timeout) is an
		// ordinary outcome. The pass carries on with feature anchors — the live
		// anchor is an ADDITION to those, never a prerequisite.
		return null;
	}
}

/** Test seam — resets the poll rate limiter. */
export function __resetLiveFixThrottle(): void {
	lastPollTs = 0;
}
