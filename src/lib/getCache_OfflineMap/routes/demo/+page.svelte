<script lang="ts">
/**
 * /debug/map — the offline map engine, running on nothing.
 *
 * THIS PAGE IS THE POINT OF THE MIGRATION. It proves the engine has no hidden
 * ties to ReTreever: no TinyBase, no Supabase, no auth, no mapStore. Its entire
 * "database" is the PINS array below — three literals.
 *
 * A contractor clones the harness, runs `npm run dev`, opens this page, breaks
 * something, and hits `export json` for an AI-debuggable report. None of that
 * needs the private repo.
 *
 * WHAT'S DELIBERATELY MISSING. No `fires` port and no `gps` port, so no hotspots
 * are fetched and there is no live anchor. The engine treats both as valid
 * configurations rather than degraded ones, and their absence here is the
 * demonstration.
 *
 * PINNED TO FIXED LOCATIONS, ON PURPOSE. The tile Worker edge-caches /pack by
 * build, so these few areas stay hot and repeat visits cost ~nothing. A
 * click-anywhere demo would mint uncached packs against a 127 GB archive on
 * every visit — a bill, not a feature. Free-roam belongs behind the local /
 * staging Worker toggles a developer runs themselves (the CONFIG panel).
 */
import type * as maplibreType from "maplibre-gl";
import { onMount } from "svelte";
import { initializeOfflineMap } from "../../lib/onPhone/render/offlineMapInit";
import { buildOfflineBaseStyle } from "../../lib/onPhone/render/offlineBaseStyle";
import { v4TransformRequest } from "../../lib/r2Worker/local_dev/roads/packDownload";
import {
	installRawWallProtocol,
	rawSourceSpec,
	RAW_SOURCE,
} from "../../lib/onPhone/roads/rawWallProtocol";
import { wallLayers } from "../../lib/onPhone/render/wallStyle";
import { attachDoubleTapToPin } from "../../lib/shared/doubleTapToPin";
import { startOfflineBakeService } from "../../lib/onPhone/bake/bakeService.svelte";
import type { HostPorts } from "../../lib/shared/hostPorts";
import OfflineWorkMeter from "../../lib/shared/OfflineWorkMeter.svelte";
import OfflineBlobPanel from "../../lib/panels/OfflineBlobPanel.svelte";
import OfflineConfigPanel from "../../lib/panels/OfflineConfigPanel.svelte";
import PinLibrary from "../../lib/panels/PinLibrary.svelte";
import {
	pinAssetPath,
	type PinKey,
} from "../../lib/shared/icons";
import { satImageKey } from "../../lib/onPhone/satellite/satelliteImage";
import {
	LAYER_TOGGLES,
	OPT_IN_LAYERS,
} from "../../lib/onPhone/render/wallLegend";

/** THE ENTIRE DATA LAYER. Add a pin here and the engine bakes it. */
const PINS: Array<{ name: string; lngLat: [number, number] }> = [
	{ name: "Ottawa valley", lngLat: [-76.16797958683314, 45.061348227515055] },
	{ name: "Vancouver", lngLat: [-123.1207, 49.2827] },
	{ name: "Prince George", lngLat: [-122.7497, 53.9171] },
];

/**
 * The host ports, implemented with literals. Compare with ReTreever's
 * retreeverPorts.ts: same interface, everything TinyBase-shaped gone.
 */
// hostPorts is a real caller-supplied override — e.g. ReTreever's
// retreeverPorts(), passed by the host page that mounts <Demo hostPorts={...}
// />. When omitted, the literal fixture below stands: the honest answer a
// checkout with no host gives.
const fixturePorts: HostPorts = {
	places: () =>
		PINS.map((p) => ({
			anchors: [p.lngLat],
			// Static demo data never changes, so one fixed timestamp is honest:
			// every pin is equally "recent" and the conveyor has no reason to
			// prefer one over another.
			lastTouched: "2026-01-01T00:00:00Z",
			corridor: false,
			// Display-only, so the blob panel can name a row instead of printing
			// its areaKey. The bake service ignores every field here.
			featureKey: p.name,
			featureName: p.name,
			featureType: "Point",
			groupKey: "demo",
			groupName: "literal fixture",
		})),
	// Nothing ever changes this list, so there is nothing to notify about.
	onPlacesChanged: () => () => {},
	// Hydrated the moment the module evaluates — the array is right there.
	// NOT the same question as "has places"; see hostPorts.ts.
	ready: () => true,
	// No `fires`, no `gps` — both optional, both ReTreever's business.
};

/**
 * IS A HOST LENDING ITS STYLE?
 *
 * The child must not know what a "style flag" is — that is host business. It
 * reads one variable: --host-decor is 1 when a host wants the scenery, absent
 * otherwise. So the DULL version is the default and the art is opt-in, which
 * is the right way round for a debugger: a standalone checkout gets a plain
 * value read-out without having to strip anything away.
 */
let decor = $state(false);
onMount(() => {
	const v = getComputedStyle(document.documentElement)
		.getPropertyValue("--host-decor")
		.trim();
	decor = v === "1";
});

/**
 * TWO VIEWS, ONE PAGE.
 *
 * `rails` is the difference between the debugger and the plain offline map:
 * the map, the engine and the fixtures are identical, and only the two debug
 * panels come and go. A second page would mean a second copy of the engine
 * wiring, which is the thing that drifts.
 */
let {
	rails = true,
	hostPorts,
}: { rails?: boolean; hostPorts?: HostPorts } = $props();

let activePin = $state("pin");

/** Pins dropped this session. In-memory only — this page has no database, and
 *  that is the whole point of it. */
let dropped = $state<Array<{ lng: number; lat: number; pin: string }>>([]);
let markers: unknown[] = [];

/** THE SELECTED PIN — index into `dropped`, or null for none. Tapping a marker
 *  selects it and opens the library popover ON THE MAP, anchored under that
 *  pin, exactly as the app's feature popover behaves. */
let selectedIdx = $state<number | null>(null);
/** Where to draw the popover, in PIXELS inside the map canvas. Recomputed as
 *  the map moves so the card tracks its pin instead of drifting off it. */
let popAt = $state<{ x: number; y: number } | null>(null);

/** Project the selected pin to screen space. Called on every map move — the
 *  card is a plain DOM element, so nothing repositions it for us. */
function syncPopover(): void {
	if (selectedIdx === null || !mapInstance) {
		popAt = null;
		return;
	}
	const d = dropped[selectedIdx];
	if (!d) {
		popAt = null;
		return;
	}
	const p = mapInstance.project([d.lng, d.lat]);
	popAt = { x: p.x, y: p.y };
}

/** Re-point the selected pin at a new artwork. Updates the marker element in
 *  place — cheaper than tearing the marker down, and it keeps the popover
 *  anchored while the pin changes underneath it. */
function changeSelectedPin(key: string): void {
	if (selectedIdx === null) return;
	dropped[selectedIdx].pin = key;
	const m = markers[selectedIdx] as { getElement?: () => HTMLImageElement };
	const el = m?.getElement?.();
	if (el) el.src = pinAssetPath(key as PinKey);
}

let mapContainer: HTMLDivElement;
let detachTap: (() => void) | undefined;

/** Paint one dropped pin. A plain DOM marker — the artwork is a .webp, and the
 *  anchor is BOTTOM so the point of the pin sits on the coordinate, not its
 *  middle. */
function addMarker(
	map: maplibreType.Map,
	lng: number,
	lat: number,
	pin: string,
): void {
	const el = document.createElement("img");
	el.src = pinAssetPath(pin as PinKey);
	el.style.cssText = "width:34px;height:auto;display:block;cursor:pointer";
	// TAP A PIN → select it and open the library over the map. stopPropagation
	// so the map's own click handler doesn't immediately deselect it.
	const myIndex = dropped.length - 1;
	el.addEventListener("click", (ev) => {
		ev.stopPropagation();
		selectedIdx = myIndex;
		syncPopover();
	});
	// ⚠️ NEVER `new maplibregl.Marker(...)` — the namespace-qualified form binds
	// this child to one GL library, and a Mapbox Marker attached to a MapLibre
	// map throws `_addMarker` / `_requestDomTask` (and vice versa). That is the
	// bug rendererMixing.test.ts exists to catch.
	//
	// DESTRUCTURE instead, which is the pattern that guard calls correct (see
	// fireLayer). The child cannot use ReTreever's markerCtor() seam — $lib is
	// tier 1, and a child must stand alone — and MapLibre's Map class exposes no
	// static .Marker, so the module's own export is the honest source.
	import("maplibre-gl").then(({ Marker }) => {
		markers.push(
			new Marker({ element: el, anchor: "bottom" })
				.setLngLat([lng, lat])
				.addTo(map),
		);
	});
}
let mapError = $state("");
let wallStatus = $state("wall not mounted yet");

// Layer toggles, driving the CONFIG panel's `layers` section. Same shape the
// real /offline route passes, so the panel behaves identically here.
const layerOn = $state<Record<string, boolean>>(
	Object.fromEntries(
		LAYER_TOGGLES.map((t) => [t.key, !OPT_IN_LAYERS.includes(t.key)]),
	),
);
let mapInstance: maplibreType.Map | null = null;

/** Show/hide a layer group. Mirrors the real /offline route's local helper,
 *  including the Satellite special case: that toggle owns every per-pin photo
 *  layer (`v4-sat-*`), which reconcile mounts dynamically, so they get swept
 *  too or half the imagery stays visible after switching it off. */
function setLayerVisibility(ids: readonly string[], visible: boolean): void {
	if (!mapInstance) return;
	const vis = visible ? "visible" : "none";
	for (const id of ids) {
		if (mapInstance.getLayer(id))
			mapInstance.setLayoutProperty(id, "visibility", vis);
		if (id === "v4-sat") {
			for (const l of mapInstance.getStyle?.()?.layers ?? []) {
				if (typeof l.id === "string" && l.id.startsWith("v4-sat-"))
					mapInstance.setLayoutProperty(l.id, "visibility", vis);
			}
		}
	}
}

function toggleLayer(key: string, ids: readonly string[]): void {
	layerOn[key] = !layerOn[key];
	setLayerVisibility(ids, layerOn[key]);
}

const layers = $derived(
	LAYER_TOGGLES.map((t) => ({
		key: t.key,
		label: t.label,
		on: layerOn[t.key],
		toggle: () => toggleLayer(t.key, t.ids),
	})),
);

onMount(() => {
	const stopBake = startOfflineBakeService(hostPorts ?? fixturePorts);
	let cleanup: (() => void) | undefined;
	try {
		cleanup = initializeOfflineMap(mapContainer, {
			style: buildOfflineBaseStyle() as maplibreType.StyleSpecification,
			initialCenter: PINS[0].lngLat,
			initialZoom: 9,
			// LAW 0, at the renderer's own door: every non-local URL is rejected,
			// so the map CANNOT stream even if a style entry tried to.
			transformRequest:
				v4TransformRequest as maplibreType.RequestTransformFunction,
			onMapCreated: (map: maplibreType.Map) => {
				// OUR OWN handle. __rtMap is set by the initializer and survives a
				// teardown, so probing it can read a DEAD map from a previous mount
				// — which is exactly what made this bug unreadable for an hour.
				(window as unknown as Record<string, unknown>).__debugMap = map;
				wallStatus = "onMapCreated fired";
				// DIAGNOSTIC: onMapReady waits on the `load` event, and load waits
				// on every source settling. Report what the map is actually doing
				// so a stall is visible instead of looking like a blank page.
				map.on("error", (e) =>
					console.error("[debug/map] map error", e?.error ?? e),
				);
				map.once("styledata", () => (wallStatus = "styledata fired"));
				map.once("load", () => (wallStatus = "load fired"));
				// DIAGNOSTIC: prove whether MapLibre applies ANY style here. If a
				// bare background style also fails, the problem is the renderer in
				// this repo, not our offline style.
				setTimeout(() => {
					if (map.isStyleLoaded()) return;
					wallStatus = `STALLED · style._loaded=${
						(map as unknown as { style?: { _loaded?: boolean } }).style?._loaded
					} · sheet=${
						(map as unknown as { style?: { stylesheet?: unknown } }).style
							?.stylesheet
							? "set"
							: "null"
					}`;
				}, 4000);
			},
			onMapReady: (map: maplibreType.Map) => {
				mapInstance = map;
				// THE WALL MAP. Without this the only source on the map is the
				// bundled world base (z0-6) — a couple of highways and a lake —
				// and every byte the bake downloaded sits in IndexedDB unread.
				// That is exactly what "the map looks empty" was.
				//
				// Protocol FIRST, so the first tile request resolves; it and the
				// source add are both idempotent.
				// LONG-PRESS / DOUBLE-TAP TO DROP. The gesture module's map type is
				// structural and written for both renderers, so the MapLibre map
				// satisfies it unchanged.
				// ⚠️ onMeasureSeed, NOT onDrop. In the app a double-tap SEEDS THE
				// SNAKE RULER, and the ruler's own Save button is what drops a pin
				// — this module declares `onDrop` but never calls it. Without the
				// ruler here, the seed IS the drop.
				// THE CARD IS PLAIN DOM, so nothing moves it when the map moves.
				// Re-project on every camera change, and dismiss on a click that
				// wasn't a marker (markers stopPropagation above).
				map.on("move", syncPopover);
				map.on("zoom", syncPopover);
				map.on("click", () => {
					selectedIdx = null;
					popAt = null;
				});

				detachTap = attachDoubleTapToPin(map, {
					onDrop: () => {},
					onMeasureSeed: (lng: number, lat: number) => {
						dropped = [...dropped, { lng, lat, pin: activePin }];
						addMarker(map, lng, lat, activePin);
					},
				});

				try {
					if (!map.getSource(RAW_SOURCE)) {
						installRawWallProtocol();
						map.addSource(RAW_SOURCE, rawSourceSpec());
						for (const layer of wallLayers()) map.addLayer(layer);
					}
					wallStatus = `wall ok · ${map.getStyle().layers.length} layers`;
				} catch (err) {
					// LOUD, not swallowed: a wall map that fails to mount is the
					// difference between "the offline map works" and a page that
					// looks fine and shows nothing. [[no-silent-fallbacks]]
					wallStatus = `wall FAILED: ${err instanceof Error ? err.message : String(err)}`;
					console.error("[debug/map] wall mount failed", err);
				}
			},
		});
	} catch (err) {
		mapError = err instanceof Error ? err.message : String(err);
	}
	return () => {
		detachTap?.();
		cleanup?.();
		stopBake();
	};
});
</script>

<!-- No <title> here: naming the page is the HOST's job. A child that titled
     itself would fight whatever surrogate parent mounts it, and would carry a
     hard-coded product name into a repo meant to be handed out. -->

<div class="stage">
	<!-- LEFT RAIL — ONE component. Both read-outs live inside it so they share a
	     stacking context and can never drift apart or slide under the hand. It
	     sits 15px clear of the phone's left edge (.stage's gap). -->
	{#if rails}
	<aside class="rail left">
		<OfflineWorkMeter
			docked
			route="debug/map"
			pins={PINS.map((p) => ({ lng: p.lngLat[0], lat: p.lngLat[1] }))}
			{layers}
		/>
		<OfflineBlobPanel places={(hostPorts ?? fixturePorts).places()} areaKeyOf={satImageKey} />
	</aside>
	{/if}

	<!-- CENTRE — the phone in the hand, fitted to the viewport exactly as the
	     app's own frame is (see .rig's --fit). -->
	<div class="rig">
		<!-- The hand is scenery, so it is opt-IN: only a host lending its style
		     asks for it. Without one the phone stands on plain black, which is
		     what a value-only demo should look like. -->
		{#if decor}
			<img
				class="hand"
				src="/mobileAssets/hand_phoneV3.webp"
				alt=""
				draggable="false"
			/>
		{/if}
		<div class="phone">
			{#if mapError}
				<div class="map-error">
					<p>Map unavailable</p>
					<p class="detail">{mapError}</p>
				</div>
			{/if}
			<div bind:this={mapContainer} class="map-canvas"></div>

			<!-- THE PIN LIBRARY, ON THE MAP. Anchored under the selected pin and
			     re-projected on every camera move, so it behaves like the app's
			     feature popover rather than a panel off to one side. -->
			{#if selectedIdx !== null && popAt}
				<div
					class="map-popover"
					style="left:{popAt.x}px; top:{popAt.y}px"
					role="dialog"
					aria-label="Pin library"
				>
					<div class="map-popover__hdr">
						<img
							class="map-popover__glyph"
							src={pinAssetPath(dropped[selectedIdx].pin as PinKey)}
							alt=""
						/>
						<div class="map-popover__title">
							{dropped[selectedIdx].pin}
						</div>
						<button
							class="rt-popover-close"
							aria-label="Close"
							onclick={() => {
								selectedIdx = null;
								popAt = null;
							}}>✕</button
						>
					</div>
					<PinLibrary
						selected={dropped[selectedIdx].pin}
						onChange={changeSelectedPin}
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- RIGHT RAIL — ONE component, mirroring the left. -->
	{#if rails}
	<aside class="rail right">
		<OfflineConfigPanel {layers} />

		<!-- ONE pin library, not two. The NEXT PIN picker used to live here, but
		     nobody thinks to arm a pin BEFORE dropping it — you drop, then you
		     change it. The library on the map (above) does that, so this one was
		     a second way to do the same thing, competing with it. -->
		<div class="pin-box">
			<div class="pin-note">
				{dropped.length} dropped · session only, no database
			</div>
			<p class="wall-status">{wallStatus}</p>
		</div>
	</aside>
	{/if}
</div>

<style>
:global(html),
:global(body) {
	margin: 0;
	height: 100%;
	background: #000;
	overflow: hidden;
}

/* THE STAGE — fixed to the viewport, exactly like the app's own
   .mobile-preview-backdrop. `container-type: size` is what makes 100cqh below
   resolve against THIS box, which is how the phone gets fitted to the window. */
.stage {
	position: fixed;
	/* Start below whatever chrome the HOST reserved. --host-chrome defaults to
	   0, so a standalone checkout is pinned to the viewport exactly as before;
	   a host that puts a bar above the child sets it and the stage moves down.
	   The child never learns what the bar is. */
	inset: var(--host-chrome, 0px) 0 0 0;
	container-type: size;
	display: flex;
	/* Rails hang from the TOP so the read-outs start where the eye does; the rig
	   re-centres itself below. Centring the whole row instead left both panels
	   floating in the middle of the stage with the map beside them. */
	align-items: flex-start;
	/* space-between pushes the rails out to the stage's true edges instead of
	   centring the whole three-column row, which left equal dead black gaps
	   on the far left/right on any viewport wider than the row's content. The
	   rig (phone) has margin-inline: auto below so it still centres itself
	   between whatever the rails leave. */
	justify-content: space-between;
	/* 15px of air on EACH side of the phone. Set as the row's gap, not as
	   padding on the rails: the gap is between the rig and whatever is beside
	   it, so both sides stay equal by construction and neither rail can drift
	   over the bezel. */
	gap: 15px;
	/* STYLE OFF is the DEFAULT here: plain black, no scenery. The host opts
	   INTO the art by setting --host-decor: 1, which is only true when a
	   parent is lending its style. A debugger should look like a value
	   read-out, not a poster — and a standalone checkout gets the dull
	   version without having to strip anything. */
	background: #000;
	background-image: var(--demo-backdrop, none);
	background-position: center;
	background-size: cover;
	background-repeat: no-repeat;
	color: #d8d4c8;
	font-family: ui-monospace, monospace;
}

/* ── THE RAILS ───────────────────────────────────────────────────────────
   ONE component per side. Everything on a side lives inside its rail, so the
   panels share a stacking context, move together, and cannot slide behind the
   hand. z-index beats the rig (2) so a panel is never swallowed by the art. */
.rail {
	position: relative;
	z-index: 5;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	/* Wide enough to use real space next to the phone instead of sitting in a
	   narrow column with dead black space beside it — these panels are dense
	   read-outs, not decoration, so they should fill what's available. Capped
	   so a very wide monitor doesn't stretch a single card absurdly wide. */
	width: clamp(27rem, 32vw, 42rem);
	max-height: 100cqh;
	overflow-y: auto;
	padding: 0.5rem;
	box-sizing: border-box;
}
.rail.left {
	align-items: stretch;
}

/* ── THE RIG ─────────────────────────────────────────────────────────────
   Geometry hand-tuned against hand_phoneV3.webp; do NOT re-derive. --fit is the
   app's own crop rule: shrink the whole assembly by (stage height ÷ phone
   height), capped at 1, so the phone always fills the viewport top-to-bottom
   without the art reflowing (it cannot). */
.rig {
	/* The rig is the only thing that centres — align-self, not the row. */
	align-self: center;
	--phone-width: 452px;
	--phone-height: 936px;
	--hand-width: 1484px;
	--hand-left: -673px;
	--hand-top: -51px;
	--hand-stretch: 1.023;
	--stage-pad: 20px;
	--fit: min(1, calc((100cqh - var(--stage-pad)) / var(--phone-height)));

	position: relative;
	z-index: 2;
	flex: 0 0 auto;
	width: var(--phone-width);
	height: var(--phone-height);
	transform: scale(var(--fit));
	transform-origin: center center;
}
.hand {
	position: absolute;
	z-index: 2;
	max-width: none;
	width: var(--hand-width);
	height: auto;
	left: var(--hand-left);
	top: var(--hand-top);
	transform: scaleX(var(--hand-stretch));
	transform-origin: center top;
	pointer-events: none;
	user-select: none;
}
.phone {
	position: absolute;
	inset: 0;
	z-index: 0;
	overflow: hidden;
	background: #05101f;
	border-radius: 40px;
	/* With the hand hidden the phone has no edge, so it needs its own. Gold,
	   3px, matching the harness bar's rule — the one deliberate bit of colour
	   in the dull view. A host that supplies the hand sets --demo-bezel:none
	   so the artwork provides the edge instead of doubling it. */
	outline: var(--demo-bezel, 3px solid #f5a119);
	outline-offset: -1px;
}
.map-canvas {
	position: absolute;
	inset: 0;
}
/* THE ON-MAP POPOVER. Positioned in the phone's own coordinate space (.phone
   is position:absolute), with left/top set per-frame from map.project(). The
   translate puts the card BELOW the pin and centred on it, and the 10px drop
   clears the pin's point. .phone has overflow:hidden, so a card near the edge
   clips to the screen exactly like the app's does. */
.map-popover {
	position: absolute;
	z-index: 3;
	transform: translate(-50%, 10px);
	width: 260px;
	max-width: calc(100% - 16px);
	background: #12100cf5;
	border: 2px solid var(--rt-yellow, #ffd24a);
	border-radius: 14px;
	padding: 8px 10px 10px;
	font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
	box-shadow: 0 8px 24px #000a;
}
.map-popover__hdr {
	display: flex;
	align-items: center;
	gap: 8px;
}
.map-popover__glyph {
	width: 22px;
	height: auto;
	display: block;
}
.map-popover__title {
	color: var(--rt-yellow, #ffd24a);
	font-weight: 800;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	margin-right: auto;
}
/* Ghost grey, never red — dismissal is not destruction. */
.rt-popover-close {
	background: none;
	border: 1px solid #3a3428;
	border-radius: 8px;
	color: #8f8a76;
	font: inherit;
	line-height: 1;
	padding: 3px 7px;
	cursor: pointer;
}

.map-error {
	position: absolute;
	inset: 0;
	z-index: 2;
	display: grid;
	place-content: center;
	text-align: center;
	color: #ffb4a2;
	padding: 1rem;
}
.detail {
	font-size: 0.75rem;
	opacity: 0.8;
}

.pin-note {
	color: #8f8a76;
	margin-top: 0.3rem;
}
.pin-box {
	background: #12100cd9;
	border: 1px solid #3a3428;
	border-radius: 10px;
	padding: 0.6rem 0.7rem;
}

/* ── CONFIG ──────────────────────────────────────────────────────────────── */
.wall-status {
	color: #7a7568;
	margin: 0 0 0.4rem;
}
</style>
