/**
 * offlineMapInit.ts — construct the OFFLINE map on MapLibre GL JS.
 *
 * ── WHY A SEPARATE INITIALIZER ───────────────────────────────────────────
 *
 * The online map keeps using Mapbox (`$harness/components/map/getCache_OnlineMap/lib/mapInit`,
 * 842 lines) because it genuinely needs Mapbox-only features: globe
 * projection, `setTerrain`, `setFog`, `mapbox://` styles, the hospital layer.
 *
 * The offline route needs NONE of those. It builds its own style from scratch
 * (`buildOfflineBaseStyle`), renders only device-local bytes, and touches
 * exactly seven library symbols — all of which MapLibre has under the same
 * names. So instead of forking 842 lines of shared code and risking the online
 * map, the offline route gets this: a small constructor that does only what
 * the offline route actually asked `initializeMap` for.
 *
 * ── WHY MAPLIBRE AT ALL ──────────────────────────────────────────────────
 *
 * The offline map must hand Mapbox tiles it decoded from local storage.
 *
 *   Mapbox GL JS  — `addTileProvider(name, moduleUrl)`, marked
 *                   `@experimental @private`, essentially undocumented, and
 *                   for VECTOR sources the provider runs INSIDE A WEB WORKER
 *                   (mapbox-gl.d.ts:5553) so it cannot read main-thread
 *                   memory. That forces tiles through IndexedDB plus epoch
 *                   bookkeeping: ~350 lines of bespoke plumbing.
 *
 *   MapLibre      — `addProtocol(scheme, handler)`. Documented, stable, the
 *                   mechanism Protomaps/PMTiles ships on. Runs on the MAIN
 *                   THREAD, so tiles are served straight from an in-memory
 *                   Map. ~15 lines.
 *
 * `mapboxgl.addProtocol` does not exist at any version — it is a MapLibre API,
 * and reaching for it on Mapbox fails as a SILENT NO-OP (the map renders
 * nothing, with no error). That cost a full debugging round; don't repeat it.
 *
 * ── WHAT THIS IS NOT ─────────────────────────────────────────────────────
 *
 * NOT a memory fix. Both renderers decode a 1536×1536 satellite WebP into the
 * same ~9.44 MB GPU texture, so the photo-driven spike is identical on both
 * (see MAX_MOUNTED_PHOTOS in the offline route). This swap buys ONE thing:
 * tile delivery through a documented API instead of a guessed one.
 */

import maplibregl from "maplibre-gl";
// MapLibre's OWN stylesheet, imported HERE — beside the renderer that needs it,
// not in app.css.
//
// app.css does `@import 'maplibre-gl/dist/maplibre-gl.css'` and it LOOKS right,
// but Tailwind v4 processes app.css and the maplibre rules never reach the page:
// the served CSS contains ZERO occurrences of `maplibregl` while every
// `mapboxgl-*` rule survives. Measured, not assumed:
//   curl -s localhost:5173/src/app.css | grep -c maplibregl   →  0
//
// What that costs: `.maplibregl-marker` carries `position: absolute`. Without
// it markers fall back to `position: static`, drop into normal document flow,
// and every marker stacks at the same layout position — so the pins render as
// a neat vertical column (famously "cruising through the ocean") while the map
// tiles, which are positioned by JS rather than CSS, look perfectly fine. The
// bug therefore presents as "the data is wrong" when the data is untouched.
//
// A JS-side import is bundled by Vite directly and cannot be stripped by the
// Tailwind pipeline. It lives in this file so the stylesheet travels with the
// renderer: anything that constructs a MapLibre map gets MapLibre's CSS.
//
// But being a JS-side import means Vite injects it at RUNTIME, AFTER app.css —
// so MapLibre's defaults used to land after our overrides and win. That's what
// turned the grid-dot popup white-on-white. `maplibreVendor.css` re-imports the
// vendor sheet into a cascade LAYER, which demotes it beneath every unlayered
// rule we write. Import that, never the vendor path directly — read its header.
import "./maplibreVendor.css";

/** The subset of `initializeMap` options the offline route actually passes. */
export interface OfflineMapOptions {
	style: maplibregl.StyleSpecification;
	initialCenter: [number, number];
	initialZoom: number;
	/** Air-gap guard — rejects/rewrites every non-local URL (LAW 0). */
	transformRequest?: maplibregl.RequestTransformFunction;
	/** Pre-style handle. Fires BEFORE the style loads, so the blue dot and the
	 *  Sentry error capture can attach without waiting on a slow style. */
	onMapCreated?: (map: maplibregl.Map) => void;
	/** Post-`load` handle — safe to add sources/layers. */
	onMapReady?: (map: maplibregl.Map) => void;
	showNavigation?: boolean;
}

/**
 * Degenerate cameras are the #1 cause of the map red-screening: a NaN centre
 * or zoom propagates into `getBounds()` and throws from inside the renderer
 * ([[nan-camera-getbounds-crash]]). Same defence the shared initializer runs.
 */
function safeCamera(
	center: [number, number],
	zoom: number,
): { center: [number, number]; zoom: number } {
	const okCenter =
		Array.isArray(center) &&
		center.length === 2 &&
		Number.isFinite(center[0]) &&
		Number.isFinite(center[1]) &&
		Math.abs(center[0]) <= 180 &&
		Math.abs(center[1]) <= 90;
	const okZoom = Number.isFinite(zoom) && zoom >= 0 && zoom <= 24;
	if (!okCenter || !okZoom) {
		console.warn("[offlineMapInit] degenerate initial camera — using defaults", {
			got: { center, zoom },
		});
	}
	return {
		center: okCenter ? center : [-76.32622, 45.25341],
		zoom: okZoom ? zoom : 7,
	};
}

/**
 * Build the offline map. Returns a teardown function.
 */
export function initializeOfflineMap(
	container: HTMLElement,
	opts: OfflineMapOptions,
): () => void {
	const cam = safeCamera(opts.initialCenter, opts.initialZoom);

	const map = new maplibregl.Map({
		container,
		style: opts.style,
		center: cam.center,
		zoom: cam.zoom,
		...(opts.transformRequest ? { transformRequest: opts.transformRequest } : {}),
		hash: false,
		interactive: true,
		pitch: 0,
		bearing: 0,
		// NO access token. MapLibre needs none — it is not calling a hosted API,
		// and this map is air-gapped anyway.
		//
		// preserveDrawingBuffer is left at MapLibre's default (false). The online
		// map sets it true for Sentry replay canvas capture; on an offline map
		// that costs GPU memory for a replay nobody watches.
		attributionControl: false,
	});

	// NORTH IS UP — and it cannot be turned off.
	//
	// `bearing: 0` above only sets the FIRST frame. Nothing stopped a user from
	// rotating afterwards, and a two-finger twist on a trackpad or phone is easy
	// to do by accident and almost impossible to undo deliberately — there is no
	// "reset north" control on this route. That rotation was then persisted and
	// restored on every load, so one stray gesture rotated the map permanently.
	//
	// Killing the gestures is the wall the rest of the stack cannot bypass: with
	// no way to produce a bearing, there is no bearing to save, restore or heal.
	// A field map has exactly one correct orientation, so nothing of value is
	// lost. (Pitch likewise — a tilted offline map is never intentional.)
	map.dragRotate.disable();
	map.touchZoomRotate.disableRotation();
	map.keyboard.disableRotation();

	// Dev-only QA handle — lets browser automation aim the camera without
	// synthetic-gesture flailing. Same name the online map uses, so existing
	// probes keep working. ([[rtmap-dev-handle]])
	if (import.meta.env.DEV) {
		(window as unknown as Record<string, unknown>).__rtMap = map;
		// THE CRUISING-PIN DETECTOR. Opt-in (__pinDrift.start()), never records
		// until asked. Answers the one question a screenshot can't: are pin
		// coordinates being REWRITTEN by camera movement, or were they already
		// wrong when they arrived? See pinDrift.ts.
		// OPTIONAL, and reached through a computed specifier so TypeScript never
		// tries to resolve it: pinDrift lives in the HOST app (ReTreever), not in
		// the engine. A host that doesn't ship it — the harness demo — simply gets no
		// drift detector, which costs nothing since this block is DEV-only anyway.
		// A statically-analysable import would make the engine unbuildable
		// standalone, which is the whole thing this migration is undoing.
		const pinDriftModule = "$lib/mobile/map/pinDrift";
		void (
			import(/* @vite-ignore */ pinDriftModule) as Promise<{
				installPinDrift(m: unknown): void;
			}>
		)
			.then((m) => m.installPinDrift(map))
			.catch(() => {
				/* codestyle-allow-swallow: host doesn't ship pinDrift — fine. */
			});
	}

	// Construction-time handle, BEFORE the style loads.
	opts.onMapCreated?.(map);

	if (opts.showNavigation) {
		map.addControl(new maplibregl.NavigationControl(), "top-right");
	}

	const onLoad = (): void => opts.onMapReady?.(map);
	if (map.loaded()) onLoad();
	else map.once("load", onLoad);

	return () => {
		try {
			map.remove();
		} catch (err) {
			console.warn("[offlineMapInit] teardown failed", err);
		}
	};
}
