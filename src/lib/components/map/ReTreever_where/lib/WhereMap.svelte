<script lang="ts">
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import "mapbox-gl/dist/mapbox-gl.css";
import {
	fullMapOptions,
	initializeMap,
} from "$harness/components/map/getCache_OnlineMap/lib/mapInit";
import { defaultOptions } from "$harness/components/map/getCache_OnlineMap/lib/mapConfig";
import { safeEase } from "$harness/components/map/mapShared/safeEase";
import { safeJumpTo } from "$harness/components/map/mapShared/safeMap";
import {
	toCoordFromArray,
	type Coord,
} from "$harness/components/map/mapShared/coord";

/**
 * Map-engine wiring for /retreeve/where — the land-variant subset of what
 * the harness's mapPage.svelte does, kept route-local because this page replaces
 * ALL of mapPage's chrome (nav buttons, drawer, info panel) with the
 * designed ReTreever chrome in WherePage.svelte. the harness stays the engine
 * (mapInit, safeEase, draw sources); this file is just the glue: init,
 * marker-select → URL param, ?land=/?projectName= deep-link prefetch.
 */
let {
	map = $bindable(null),
	selectedFeature = $bindable(null),
	viewChanged = $bindable(false),
	markerUrl = undefined,
	userLocation = null,
	ensureMapboxGuards = async () => {},
}: {
	map: import("mapbox-gl").Map | null;
	selectedFeature: any;
	/** True once the camera has left the home globe view — drives the reset button. */
	viewChanged?: boolean;
	markerUrl?: string;
	/** [lng, lat] of the visitor, once they've allowed location. Draws the dot. */
	userLocation?: [number, number] | null;
	/**
	 * Awaited before the map is built. ReTreever passes its memoized installer
	 * (the NaN prototype guards must patch mapbox BEFORE the first `new Map`);
	 * the harness passes nothing and the default no-op runs. A child cannot
	 * import the host's boot machinery, and should not need to know it exists.
	 */
	ensureMapboxGuards?: () => Promise<void>;
} = $props();

let mapContainer: HTMLDivElement;
let splashVisible = $state(true);
// Deep-link target may resolve before or after the map — coordinate.
let pendingFeature: any = null;

// ── Home camera ──────────────────────────────────────────────────────────
// What "reset" returns to: the globe the page boots with. The numbers live
// here rather than in WherePage because this file owns the init options they
// come from — fullMapOptions for desktop, the mobile override below.
const HOME_CENTER: [number, number] = fullMapOptions.initialCenter ?? [
	defaultOptions.initialCenter[0],
	defaultOptions.initialCenter[1],
];
const MOBILE_HOME_ZOOM = 3.5;
/** Settled in onMount — a phone boots closer in than the desktop globe. */
let homeZoom = fullMapOptions.initialZoom ?? defaultOptions.initialZoom;
// Rotation stops (and hash sync starts) at this zoom — see MAP_CONFIG.globe.
const SPIN_MAX_ZOOM = 4;

function flyToAndSelect(m: import("mapbox-gl").Map, feature: any) {
	selectedFeature = feature;
	// centroid may be a parsed object or a JSON string (Mapbox serializes
	// feature properties). toCoordFromArray rejects NaN/out-of-range here so
	// safeEase never sees a bad value.
	let raw: unknown = null;
	if (feature?.geometry?.coordinates) {
		raw = feature.geometry.coordinates;
	} else if (feature?.centroid?.coordinates) {
		raw = feature.centroid.coordinates;
	} else if (typeof feature?.centroid === "string") {
		try {
			raw = JSON.parse(feature.centroid)?.coordinates ?? null;
			// codestyle-allow-swallow: malformed centroid string leaves raw null; the ease is skipped
		} catch {}
	}
	const coords: Coord | null = toCoordFromArray(raw);
	if (coords) {
		safeEase(m, { center: coords, zoom: 14, duration: 1200 });
	}
}

// ── Reset ────────────────────────────────────────────────────────────────

/**
 * Whether the camera has left home. Deliberately ignores the CENTRE: auto
 * rotation walks longitude continuously at home zoom, so comparing centres
 * would read "changed" a frame after load and never read anything else.
 * Zoom / bearing / pitch are the ones that mean "the user navigated in".
 */
function syncViewChanged() {
	const m = map;
	if (!m) return;
	viewChanged =
		m.getZoom() > homeZoom + 0.35 ||
		m.getBearing() !== 0 ||
		m.getPitch() !== 0;
}

/**
 * Put the map back the way it loaded: home globe, north up, nothing selected,
 * no deep-link in the URL. Exported for WherePage's reset button — the chrome
 * lives there, the camera knowledge lives here.
 */
export function resetView() {
	selectedFeature = null;
	pendingFeature = null;

	// Drop ?land= / ?projectName= first. Leaving them would re-fly to the
	// polygon we just left on the next refresh — a reset that doesn't reset.
	const url = new URL($page.url);
	url.searchParams.delete("land");
	url.searchParams.delete("projectName");
	void goto(`${url.pathname}${url.search}`, {
		replaceState: true,
		noScroll: true,
	});

	const m = map;
	if (!m) return;

	// Bearing/pitch snap BEFORE the ease: safeEase only interpolates centre
	// and zoom, and a jumpTo landing mid-ease would fight its per-frame one.
	if (m.getBearing() !== 0 || m.getPitch() !== 0) {
		safeJumpTo(m, { bearing: 0, pitch: 0 });
	}
	safeEase(m, { center: HOME_CENTER, zoom: homeZoom, duration: 1600 });

	// The camera hash is only written at zoom ≥ 4 and never cleared on the way
	// back out, so the goto above can't strip it — the ease's own moveends
	// would rewrite it anyway while zoom is still high. Wait for the first
	// moveend below the spin threshold, then clear it, so a refresh after a
	// reset starts at the globe rather than back at the polygon.
	const stripHash = () => {
		if (m.getZoom() >= SPIN_MAX_ZOOM) return;
		m.off("moveend", stripHash);
		if (window.location.hash) {
			history.replaceState(
				null,
				"",
				window.location.pathname + window.location.search,
			);
		}
	};
	m.on("moveend", stripHash);
}

// ── The blue dot ─────────────────────────────────────────────────────────
// The classic "you are here" puck: a translucent halo, a solid blue core and
// a white ring, drawn as real Mapbox circle layers rather than a DOM marker
// so it sits IN the map — correct at every zoom, and it doesn't drift during
// the ease. Three layers because that's what reads as the familiar dot: the
// halo gives it presence at globe zoom, the ring separates the core from
// dark satellite imagery.
const USER_DOT_SOURCE = "rt-user-location";

function pointFeature(coords: [number, number]) {
	return {
		type: "FeatureCollection" as const,
		features: [
			{
				type: "Feature" as const,
				properties: {},
				geometry: { type: "Point" as const, coordinates: coords },
			},
		],
	};
}

$effect(() => {
	const m = map;
	const loc = userLocation;
	if (!m || !loc) return;

	// The style has to be loaded before addSource/addLayer, and a style swap
	// wipes both — so draw on `styledata` too, not just once.
	function draw() {
		if (!m || !loc) return;
		// Plain JSON only across the Mapbox boundary — a $state proxy corrupts
		// the GL worker transfer (see the "no $state proxies" memory).
		const data = pointFeature([loc[0], loc[1]]);
		const existing = m.getSource(USER_DOT_SOURCE) as
			| import("mapbox-gl").GeoJSONSource
			| undefined;
		if (existing) {
			existing.setData(data);
			return;
		}
		m.addSource(USER_DOT_SOURCE, { type: "geojson", data });
		m.addLayer({
			id: `${USER_DOT_SOURCE}-halo`,
			type: "circle",
			source: USER_DOT_SOURCE,
			paint: {
				"circle-radius": 18,
				"circle-color": "#1a73e8",
				"circle-opacity": 0.18,
				"circle-blur": 0.35,
			},
		});
		m.addLayer({
			id: `${USER_DOT_SOURCE}-ring`,
			type: "circle",
			source: USER_DOT_SOURCE,
			paint: {
				"circle-radius": 9,
				"circle-color": "#ffffff",
			},
		});
		m.addLayer({
			id: `${USER_DOT_SOURCE}-core`,
			type: "circle",
			source: USER_DOT_SOURCE,
			paint: {
				"circle-radius": 6.5,
				"circle-color": "#1a73e8",
			},
		});
	}

	if (m.isStyleLoaded()) draw();
	else m.once("style.load", draw);
	m.on("styledata", draw);
	return () => {
		m.off("styledata", draw);
	};
});

// Block browser page zoom from trackpad pinch gestures (ctrlKey wheel +
// Safari gesture events) — without this, pinching over the overlays zooms
// the whole page instead of the map. Same guard as the harness's mapPage.
function blockBrowserZoom() {
	const blockWheel = (e: WheelEvent) => {
		if (e.ctrlKey) e.preventDefault();
	};
	const blockGesture = (e: Event) => e.preventDefault();
	const opts = { capture: true, passive: false } as AddEventListenerOptions;
	document.addEventListener("wheel", blockWheel, opts);
	document.addEventListener("gesturestart", blockGesture, opts);
	document.addEventListener("gesturechange", blockGesture, opts);
	document.addEventListener("gestureend", blockGesture, opts);
	return () => {
		document.removeEventListener("wheel", blockWheel, { capture: true });
		document.removeEventListener("gesturestart", blockGesture, {
			capture: true,
		});
		document.removeEventListener("gesturechange", blockGesture, {
			capture: true,
		});
		document.removeEventListener("gestureend", blockGesture, {
			capture: true,
		});
	};
}

onMount(() => {
	let disposed = false;
	let mapCleanup: (() => void) | undefined;
	const cleanupZoomBlock = blockBrowserZoom();

	void (async () => {
		// Guards must patch mapbox's prototypes before the map is built —
		// they used to be installed eagerly at client boot (see
		// ensureMapboxGuards / perf/BASELINE.md).
		await ensureMapboxGuards();
		if (disposed) return;

		// SAME-ORIGIN, deliberately empty. This was PUBLIC_API_URL, which both
		// .env files pin to `http://localhost:5173` — an address that stopped
		// serving anything when bare localhost stopped being a site (ac3225dc).
		// So this page, loaded correctly on retreever.localhost, fetched back
		// out to a host the boundary refuses and 404'd on its own data.
		//
		// `/api` is a SHARED path, so a relative URL resolves on whatever host
		// the page is on — right in dev, in prod, and on all three site names,
		// with no env var that has to be correct in four places. Safe here
		// because /where is a (retreever) route: dt-web only, never Capacitor,
		// where a relative fetch would have no server to reach.
		const apiBase = "";
		const landParam = $page.url.searchParams.get("land");
		const projectNameParam = $page.url.searchParams.get("projectName");
		const hasTarget = !!(landParam || projectNameParam);

		fullMapOptions.autoRotate = !hasTarget;
		// Live "z3.4" in the bottom-right corner — debug aid.
		fullMapOptions.showZoomReadout = true;
		// Attribution line bottom-LEFT, mapbox wordmark bottom-RIGHT where it
		// joins the zoom readout inside the gold border's corner cutout.
		fullMapOptions.creditsSplit = true;
		// Scale bar stays bottom-LEFT (mapbox's default) with the wordmark.
		// The right corner holds only the zoom readout.

		const isMobile = window.innerWidth < 768;
		if (isMobile) homeZoom = MOBILE_HOME_ZOOM;

		const handleFeatureSelect = (feature: any) => {
			selectedFeature = feature;
			if (feature?.landKey) {
				// `/where`, NOT `/retreeve/where`. ReTreever's pages moved to the top
				// level; /retreeve/where no longer exists as a route, it only
				// survives as a legacy 301 in hooks.server.ts. That made every land
				// click a FULL PAGE LOAD: the client router cannot resolve a path
				// that is not in its manifest, so it handed off to the browser, the
				// server 301'd to /where, and the whole page reloaded — bundle
				// re-parse, Mapbox re-init, tiles and polygons re-fetched. That was
				// the click lag. Same-route navigation keeps it client-side.
				goto(`/where?land=${encodeURIComponent(feature.landKey)}`, {
					replaceState: true,
					noScroll: true,
				});
			}
		};

		mapCleanup = initializeMap(mapContainer, {
			...fullMapOptions,
			enableHash: true,
			...(isMobile && {
				showDrawTools: false,
				initialZoom: MOBILE_HOME_ZOOM,
			}),
			apiBaseUrl: apiBase,
			...(markerUrl && { markerUrl }),
			onFeatureSelect: handleFeatureSelect,
			onMapReady: (m) => {
				map = m;
				m.once("idle", () => {
					splashVisible = false;
				});
				setTimeout(() => {
					splashVisible = false;
				}, 3000);
				// moveend fires per frame during the rAF spin and during
				// safeEase's jumpTo loop; syncViewChanged only writes a
				// boolean, so a same-value write costs nothing.
				m.on("moveend", syncViewChanged);
				syncViewChanged();
				if (pendingFeature) {
					flyToAndSelect(m, pendingFeature);
					pendingFeature = null;
				}
			},
		});

		// Fetch the deep-link target in parallel with map load.
		if (hasTarget) {
			(async () => {
				try {
					const response = await fetch(
						`${apiBase}/api/where/polygons?mode=centroids`,
					);
					if (!response.ok) return;
					const data = await response.json();
					let targetFeature: any = null;
					if (landParam) {
						const match = data.features?.find(
							(f: any) =>
								f.properties?.landKey === landParam || f.id === landParam,
						);
						targetFeature = match?.properties ?? null;
					} else if (projectNameParam) {
						const match = data.features?.find(
							(f: any) => f.properties?.projectName === projectNameParam,
						);
						targetFeature = match?.properties ?? null;
					}
					if (!targetFeature) return;
					if (map) {
						flyToAndSelect(map, targetFeature);
					} else {
						pendingFeature = targetFeature;
					}
				} catch (error) {
					console.error("Error pre-loading feature:", error);
				}
			})();
		}
	})();

	return () => {
		disposed = true;
		mapCleanup?.();
		cleanupZoomBlock();
		map = null;
	};
});
</script>

<div bind:this={mapContainer} class="where-mapbox"></div>

{#if splashVisible}
	<!-- Placeholder orbs so users don't stare at a dark globe while the map
	     style + centroids load. Fades out on first map idle. -->
	<div class="map-splash" aria-hidden="true">
		<span class="orb orb-a"></span>
		<span class="orb orb-b"></span>
		<span class="orb orb-c"></span>
		<span class="orb orb-d"></span>
		<span class="orb orb-e"></span>
	</div>
{/if}

<style>
	/* ── Map corner controls ────────────────────────────────────────────
	   TWO CORNERS, ONE JOB EACH:

	     bottom-LEFT   the attribution line, above the scale bar
	     bottom-RIGHT  the mapbox wordmark + zoom readout, sitting DOWN IN
	                   the gold border's corner cutout

	   WHICH CORNER EACH CONTROL IS IN IS NOT DECIDED HERE. Mapbox places
	   the wordmark and the attribution once, at map construction, into two
	   different DOM containers; see `creditsSplit` in mapInit.ts. CSS can
	   only style/offset the container a control already lives in — which is
	   why earlier attempts to "move the text left" by changing padding
	   moved the whole cluster instead of separating it.

	   Both containers sit BELOW the gold border (z-index 10) so the yellow
	   line draws over them rather than being punched through. */

	/* Bottom-LEFT: attribution on top, scale bar under it, clear of the
	   border's flat bottom edge. */
	:global(.mapboxgl-ctrl-bottom-left) {
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 6px;
		padding: 0 0 26px 22px;
	}

	/* Bottom-RIGHT: the corner cutout.
	   THESE OFFSETS ARE READ OFF THE BORDER SVG, not judged by eye.
	   `gold-border.svg` is preserveAspectRatio="none", so its viewBox maps
	   to the stage as straight percentages and the notch sits at the same
	   fractions at every window size. Its bottom-right path gives:

	     notch top edge      y = 91.8% of stage height
	     diagonal step       x = 89.2% → 91.1% of stage width

	   So the pocket is the strip BELOW 91.8% height and LEFT of ~89% width.
	   Anchoring the column to the bottom-right of that pocket is what puts
	   the wordmark and readout down IN the cutout instead of floating above
	   it. Percentages, not px, so they track the border as the stage
	   resizes. */
	:global(.mapboxgl-ctrl-bottom-right) {
		display: flex;
		/* A COLUMN: readout ON TOP OF the wordmark, right-aligned.
		   The stack is taller than the cutout's flat floor (~50px against
		   ~63px), so the readout necessarily rises ABOVE the notch's top
		   edge. That is fine and is the point: right of the diagonal the
		   gold line runs along the TOP of the cutout with open map above it,
		   so the readout sits clear of the border rather than under it. The
		   constraint that still binds is HORIZONTAL — both boxes must stay
		   right of the vertical gold wall at ~89.1% of the stage width,
		   which the cqw sizing below maintains at every window size. */
		flex-direction: column;
		align-items: flex-end;
		justify-content: flex-end;
		gap: 5px;
		z-index: 2;
		padding: 0 0.9% 1.1% 0;
	}

	/* THE POCKET IS A PERCENTAGE, SO ITS CONTENTS MUST BE TOO.
	   The cutout is ~10.9% of the stage width (100% − 89.1%), which is
	   ~150px at a 1400px stage but only ~110px at 1024. Sized in fixed px
	   the two boxes stayed ~165px wide and the readout slid out under the
	   gold line on smaller windows — it fit at 1400+ and broke below.
	   Sizing them in `cqw` against the stage keeps the pair proportional to
	   the pocket at every width, with a px floor so the text stays legible.
	   `.where-stage` is the container being measured (see WherePage). */
	:global(.mapboxgl-ctrl-bottom-right .rt-zoom-readout) {
		padding: 3px max(4px, 0.35cqw);
		font-size: max(9px, 0.78cqw);
	}

	:global(.mapboxgl-ctrl-bottom-right .mapboxgl-ctrl-logo) {
		width: max(46px, 4.7cqw);
		height: max(13px, 1.25cqw);
		background-size: contain;
		padding: 3px max(4px, 0.35cqw);
	}

	/* Margins zeroed at TWO classes of specificity: mapbox ships
	   `.mapboxgl-ctrl { margin: 10px }`, a single class — exactly as
	   specific as ours alone, so it wins or loses on source order, which we
	   do not control. Chaining both classes outranks it outright. The flex
	   `gap` owns the spacing now, so these margins must be gone or they
	   fight it. */
	:global(.mapboxgl-ctrl-bottom-right .mapboxgl-ctrl),
	:global(.mapboxgl-ctrl-bottom-left .mapboxgl-ctrl) {
		margin: 0;
	}

	/* Attribution — same bordered treatment as the readout and the scale so
	   the credits read as one family. Left un-styled it is bare white text
	   on the map, which vanishes over bright satellite. */
	:global(.mapboxgl-ctrl-bottom-left .mapboxgl-ctrl-attrib) {
		background-color: rgba(0, 0, 0, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.55);
		border-radius: 5px;
		padding: 3px 8px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
		font-size: 10px;
		line-height: 1.4;
	}

	:global(.mapboxgl-ctrl-bottom-left .mapboxgl-ctrl-attrib a) {
		color: rgba(255, 255, 255, 0.86);
	}

	/* THE WORDMARK'S WRAPPER IS HIDDEN BY AN INLINE STYLE.
	   Mapbox puts the logo inside its own `.mapboxgl-ctrl` div and sets
	   `style="display: none"` on that WRAPPER — not on the anchor — when
	   the loaded style's attribution metadata does not request the logo.
	   Rules targeting the anchor were therefore styling an element whose
	   parent was already collapsed: the wordmark measured 0×0.

	   `!important` is required and is not a shortcut. An inline style
	   attribute outranks every selector here no matter how specific;
	   `!important` is the only thing in CSS that outranks it. This is a
	   one-time attribute written at control-add, not re-applied on a loop,
	   so nothing fights it back. */
	:global(.mapboxgl-ctrl-bottom-right .mapboxgl-ctrl:has(.mapboxgl-ctrl-logo)) {
		display: block !important;
	}

	/* Wordmark — same bordered treatment as the readout, and for the same
	   reason: the basemap underneath it changes (dark globe, bright
	   satellite, terrain), so anything relying on the map for contrast
	   disappears on some of them.

	   `background-color`, NOT the `background` SHORTHAND. The wordmark
	   artwork IS this anchor's background-image (mapbox ships it as an
	   inline data-URI) and the anchor has no text, so the image is the only
	   thing there is to see. The shorthand resets every background-*
	   longhand it does not mention, so `background: rgba(...)` wiped the
	   wordmark and left a correctly-sized, correctly-bordered, EMPTY box. */
	:global(.mapboxgl-ctrl-bottom-right .mapboxgl-ctrl-logo) {
		opacity: 1;
		box-sizing: content-box;
		background-color: rgba(0, 0, 0, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.55);
		border-radius: 5px;
		padding: 4px 8px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
	}

	/* Scale bar — same visual family as the rest. */
	:global(.mapboxgl-ctrl-bottom-left .mapboxgl-ctrl-scale) {
		background-color: rgba(0, 0, 0, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.55);
		border-radius: 5px;
		color: #fff;
		font:
			600 11px/1.4 ui-monospace,
			SFMono-Regular,
			Menlo,
			monospace;
		padding: 3px 7px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
	}

	/* Zoom readout — debug aid, so legibility beats subtlety: it must read
	   instantly over bright satellite AND the dark globe. */
	:global(.rt-zoom-readout) {
		background: rgba(0, 0, 0, 0.72);
		color: #fff;
		font:
			700 13px/1 ui-monospace,
			SFMono-Regular,
			Menlo,
			monospace;
		letter-spacing: 0.02em;
		padding: 5px 9px;
		border: 1px solid rgba(255, 255, 255, 0.55);
		border-radius: 5px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
		pointer-events: none;
		user-select: none;
	}

	/* Scale bar — same visual family as the readout so the pair reads as
	   one set of instruments rather than two unrelated widgets. */
	:global(.mapboxgl-ctrl-bottom-right .mapboxgl-ctrl-scale) {
		background: rgba(0, 0, 0, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.55);
		border-radius: 5px;
		color: #fff;
		font:
			600 11px/1.4 ui-monospace,
			SFMono-Regular,
			Menlo,
			monospace;
		padding: 3px 7px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
	}

	.where-mapbox {
		position: absolute;
		inset: 0;
	}

	.map-splash {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 5;
		animation: splashFadeOut 0.8s ease-out 2s forwards;
		/* Clip orbs to a circle approximating the globe at initial zoom */
		clip-path: circle(38% at 50% 50%);
	}

	.orb {
		position: absolute;
		display: block;
		border-radius: 9999px;
		background: radial-gradient(
			circle,
			rgba(255, 200, 0, 0.55) 0%,
			rgba(255, 200, 0, 0.25) 45%,
			rgba(255, 200, 0, 0) 70%
		);
		filter: blur(0.5px);
		transform: translate(-50%, -50%);
		animation: orbPulse 1.6s ease-in-out infinite;
	}

	.orb-a { top: 40%; left: 38%; width: 64px; height: 64px; animation-delay: 0s; }
	.orb-b { top: 50%; left: 52%; width: 96px; height: 96px; animation-delay: 0.25s; }
	.orb-c { top: 58%; left: 42%; width: 48px; height: 48px; animation-delay: 0.5s; }
	.orb-d { top: 38%; left: 58%; width: 72px; height: 72px; animation-delay: 0.15s; }
	.orb-e { top: 62%; left: 55%; width: 56px; height: 56px; animation-delay: 0.35s; }

	@keyframes orbPulse {
		0%, 100% { opacity: 0.45; transform: translate(-50%, -50%) scale(0.92); }
		50%      { opacity: 0.9;  transform: translate(-50%, -50%) scale(1.08); }
	}

	@keyframes splashFadeOut {
		to { opacity: 0; }
	}
</style>
