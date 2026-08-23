/**
 * wallLabels.ts — TEXT + POI ICONS for the wall map.
 *
 * Split out of the layer stack (`wallStyle.ts`) because labels obey different
 * rules from geometry: they are glyph-dependent, collision-managed, and they
 * must be RAISED above freshly-mounted satellite photos on every reconcile.
 * Keeping them separate is what makes `raiseDrawLayers()` a two-line function
 * instead of a hunt through 600 lines of `addLayer`.
 *
 * ── OFFLINE-SAFE BY CONSTRUCTION (LAW 0) ─────────────────────────────────
 *
 * The glyphs are BUNDLED — `offlineBaseStyle` sets the style's `glyphs` URL to
 * `/mobileAssets/worldBase/glyphs/{fontstack}/{range}.pbf`, served same-origin,
 * so the air-gap guard allows them. The font stack is read off the LIVE style
 * by `glyphStack(map)`, never written as a literal: it must match the bundled
 * fontstack FOLDER NAME exactly, and a mismatch 404s the glyph range once per
 * tile, forever, while the label silently never draws. See `wallLabelLayers`.
 * ([[offline-map-labels-bundled-glyphs]])
 *
 * The POI icons are same-origin WebPs for the same reason (icon-only symbol
 * layers, no text → no glyph fetch at all).
 */

import type * as mapboxgl from "maplibre-gl";

import { glyphStack } from "$osem/components/map/mapShared/glyphStack";

import { RAW_SOURCE } from "$osem/components/map/offline/onPhone/roads/rawWallProtocol";

/** Warm off-white TOWN labels — the loud ones. */
const LABEL_COLOR = "#ece7da";
/** Road names sit ON the roads everywhere, so they go MUCH quieter than town
 *  names — otherwise they read as harsh white scribble over the linework
 *  (user: "too intense"). */
const ROAD_LABEL_COLOR = "#8c887e";
/** Dark halo (≈ the map background) for legibility. */
const LABEL_HALO = "#05101f";

/**
 * Label layers, bottom-first. Added after the geometry so they sit on top, and
 * re-raised above per-area photos by the page's `raiseDrawLayers()`.
 *
 * ⚠️ TAKES THE MAP so the font stack is chosen from the LIVE style rather than
 * written as a literal. The two maps' glyph endpoints are DISJOINT — the hosted
 * Mapbox style has DIN/Arial and no Noto; the offline base has Noto and nothing
 * else — so a hardcoded array is wrong on one map BY CONSTRUCTION, and a 404
 * here repeats once per tile, forever. `glyphStacks.test.ts` fails the build on
 * a literal. ([[offline-map-labels-bundled-glyphs]])
 */
export function wallLabelLayers(
	map: mapboxgl.Map,
): mapboxgl.LayerSpecification[] {
	// ⚠️ `glyphStack(map)` is INLINED at each font site, not hoisted to a local
	// const. `glyphStacks.test.ts` scans the source text right AFTER the font
	// key, so a const — however correctly derived — reads to it as a hardcoded
	// literal and fails the build. Keep the call inline. (For the same reason,
	// do not spell that key inside a comment here: the scanner cannot tell code
	// from prose and will match this block too.)
	// (`glyphStack` types against Mapbox's Map; the two libraries'
	// `getStyle().glyphs` are structurally identical, and that string is the only
	// field it reads.)
	return [
		// ── TOWN LABELS ──────────────────────────────────────────────────────
		// GRANULAR places: city / town / village / hamlet by KIND. Suburb,
		// neighbourhood, locality and region noise is dropped by simply not
		// listing them.
		//
		// ZOOM-GATED BY KIND. The kind list used to be flat — a 40-person hamlet
		// was admitted on the same terms as a city and differed only in text
		// size. Zoomed out that filled the map with names nobody has heard of
		// while the cities that actually orient you were nowhere. Now each kind
		// earns its zoom: cities always, towns from z6, villages from z8,
		// hamlets from z10 (close enough for one to be a landmark). Collision
		// thins whatever survives.
		//
		// NOTE the source: `places` lives on the z12 RING tiles, not the core.
		// Pointing a layer at a ring that lacks its source-layer renders
		// nothing, silently. ([[vector-source-layer-name-must-match]])
		{
			id: "v4-town-label",
			type: "symbol",
			source: RAW_SOURCE,
			"source-layer": "places",
			filter: [
				"all",
				["has", "name"],
				[
					">=",
					["zoom"],
					[
						"match",
						["get", "kind"],
						"city",
						0,
						"town",
						6,
						"village",
						8,
						"hamlet",
						10,
						99,
					],
				],
			],
			layout: {
				"text-field": ["coalesce", ["get", "name"], ["get", "name:en"], ""],
				"text-font": glyphStack(map as never),
				// Size by KIND (population_rank is often absent on villages and
				// hamlets): city biggest, hamlet smallest. Robust either way.
				"text-size": [
					"match",
					["get", "kind"],
					"city",
					18,
					"town",
					15,
					"village",
					12,
					"hamlet",
					10,
					11,
				],
				// Lower sort-key wins collision → bigger places first.
				"symbol-sort-key": [
					"match",
					["get", "kind"],
					"city",
					0,
					"town",
					1,
					"village",
					2,
					"hamlet",
					3,
					4,
				],
				"text-anchor": "center",
				"text-allow-overlap": false,
				"text-padding": 8,
			},
			paint: {
				"text-color": LABEL_COLOR,
				"text-halo-color": LABEL_HALO,
				"text-halo-width": 1.6,
				"text-halo-blur": 0.4,
			},
		} as mapboxgl.LayerSpecification,

		// ── ROAD NAME LABELS ─────────────────────────────────────────────────
		//
		// PLACEMENT: LINE — the last thing the decoder was for.
		//
		// This layer used to read a `roadlabels` source-layer that did not exist
		// in the downloaded tiles: `roadLabelPoints()` walked every road's
		// vertices and dropped a label POINT every 0.04° (≈3-4 km), and that
		// synthetic point cloud then had to be re-cut into MVT on the phone.
		// Together with the `land` fills it was most of the reason the decode
		// worker existed — the worker that measured 705 MB.
		//
		// MapLibre does this natively and BETTER. `symbol-placement: "line"`
		// renders the name ALONG the road and repeats it every `symbol-spacing`
		// SCREEN PIXELS, so density is constant at every zoom. The old sampling
		// was in DEGREES — fixed on the GROUND, therefore wrong on SCREEN at
		// every zoom but one. Labels also follow the road's curve now.
		//
		// ⚠️ HIGHWAYS ARE EXCLUDED. Two label layers draw the same highways:
		//   • `road-label`    (offlineBaseStyle, Natural Earth) → bare "97", "20"
		//   • `v4-road-label` (this one, Protomaps tiles) → "Sea-to-Sky Highway"
		// Both firing named every highway twice, in two styles, the prose one
		// repeating every few km. Protomaps' `ref` is region-prefixed ("BC 97"),
		// noisier than the bare NE number — so the layers get DISJOINT jobs
		// instead: the world base owns highway numbers (whole, un-fragmented
		// lines, clean refs), and this layer owns only the LOCAL roads the world
		// base has never heard of.
		{
			id: "v4-road-label",
			type: "symbol",
			source: RAW_SOURCE,
			"source-layer": "roads",
			minzoom: 4,
			// DENSITY-AWARE, like the town labels: gate each road's NAME on its
			// Protomaps `min_zoom` — their own curated "this road matters at this
			// zoom" rank. A prominent RURAL road (major_road min_zoom ~7) surfaces
			// far out; a city side-street (minor_road ~14) stays hidden until
			// you're close. So the only road for miles still shows early while a
			// dense city grid doesn't flood.
			filter: [
				"all",
				["has", "name"],
				["match", ["get", "kind"], ["highway", "major_road"], false, true],
				[
					">=",
					["+", ["zoom"], ["step", ["zoom"], 7, 9, 5, 12, 4]],
					["coalesce", ["get", "min_zoom"], 14],
				],
			],
			layout: {
				"symbol-placement": "line",
				"text-field": ["get", "name"],
				"text-font": glyphStack(map as never),
				// Prominent roads (LOW min_zoom) sort first → win collision.
				"symbol-sort-key": ["coalesce", ["get", "min_zoom"], 14],
				"text-size": [
					"interpolate",
					["linear"],
					["zoom"],
					5,
					9.5,
					10,
					11,
					14,
					12,
				],
				"text-allow-overlap": false,
				// ⚠️ THE CROWDING DIAL — in SCREEN PIXELS, on the line. It replaces
				// the old ground-distance sampling AND the `text-padding: 30` that
				// hid that sampling's excess. 400px ≈ one repeat per screen-and-a-bit
				// on a phone, and it holds at EVERY zoom.
				//
				// Crowded? RAISE this. Roads going unnamed? Lower it. Do NOT reach
				// for text-padding — padding steals space from CITY names too, which
				// is how the old version starved them.
				//
				// ⛔ NOT DATA-DRIVEN. `symbol-spacing` is one of the handful of
				// layout properties MapLibre allows ZOOM expressions on but NOT data
				// (`["get", …]`) expressions. A `match` on `kind` here threw
				// `data expressions not supported` from `addLayer`, which aborted the
				// whole setup mid-function — so every layer after it was never added
				// and the map looked broken at EVERY zoom. Per-kind thinning, if
				// wanted again, needs its own symbol layer with a `filter`.
				"symbol-spacing": 400,
				// Small — `symbol-spacing` does the thinning. This is just
				// glyph-to-glyph breathing room at collision time.
				"text-padding": 6,
			},
			paint: {
				"text-color": ROAD_LABEL_COLOR,
				"text-halo-color": LABEL_HALO,
				"text-halo-width": 1.6,
				"text-halo-blur": 0.4,
			},
		} as mapboxgl.LayerSpecification,
	];
}

/** Label layer ids — the page raises these above freshly-mounted photos.
 *  Includes the world base's own two, which sit under the same rule. */
export const LABEL_LAYER_IDS = [
	"v4-road-label",
	"road-label",
	"v4-town-label",
	"place-label",
];

/** POI icons: [image name, same-origin URL]. */
const POI_ICONS: ReadonlyArray<readonly [string, string]> = [
	["v4-icon-hospital", "/mobileAssets/hospitalPin.webp"],
	["v4-icon-camp", "/mobileAssets/camp_public_pin.webp"],
];

/**
 * Mount the POI symbol layers (hospital, campsite). Icon-only — no text, so no
 * glyphs, so nothing for the air-gap guard to block.
 *
 * Awaits image loads, so it is deliberately NOT part of the synchronous layer
 * stack: a slow icon must never delay the roads.
 */
export async function addWallPois(map: mapboxgl.Map): Promise<void> {
	// PROMISE form, not the callback form. MapLibre removed `loadImage`'s
	// callback parameter in v4 (`loadImage(url): Promise<GetResourceResponse>`;
	// Mapbox 3.24's is `loadImage(url, callback): void`). Passing a callback to
	// MapLibre is not an error — it is silently ignored, so a promise wrapped
	// around it NEVER settles. Since this awaits, that hung the whole function:
	// no POI icons and no POI layers, with nothing in the console.
	//
	// Note the result is a GetResourceResponse WRAPPER — the image is on `.data`.
	const loadIcon = async (url: string) => {
		try {
			return (await map.loadImage(url)).data;
		} catch (err) {
			console.warn(`[wall] POI icon load failed: ${url}`, err);
			return null;
		}
	};

	for (const [name, url] of POI_ICONS) {
		if (map.hasImage(name)) continue;
		const data = await loadIcon(url);
		if (data && !map.hasImage(name)) map.addImage(name, data);
	}

	const poiLayer = (
		id: string,
		kind: string,
		icon: string,
		size: number,
		minzoom?: number,
	): void => {
		if (map.getLayer(id)) return;
		map.addLayer({
			id,
			type: "symbol",
			source: RAW_SOURCE,
			"source-layer": "pois",
			filter: ["==", ["get", "kind"], kind],
			...(minzoom != null ? { minzoom } : {}),
			layout: {
				"icon-image": icon,
				"icon-size": size,
				"icon-allow-overlap": false,
				// TIP ON THE SPOT — the pin art is a teardrop whose POINT is the
				// coordinate, so it must hang from its tip, never float by its middle.
				//
				// ⛔ This defaulted to `center` (MapLibre's default, and what the
				// online hospital marker used). That put the tip half an icon-height
				// BELOW the real coordinate — and because icon-size is in PIXELS, that
				// fixed pixel gap covers a wildly different number of METRES at each
				// zoom: ~1 m zoomed in, kilometres zoomed out. The pin therefore
				// appeared to race across the ground while zooming, even though its
				// lng/lat never changed. Reported in the field as pins "shooting across
				// the land at 1200 km/h".
				//
				// `bottom` makes the anchor point zoom-invariant, which is the whole
				// contract of a map pin. Same rule the DOM markers already follow
				// (pinMarkers.ts PIN_ANCHOR) — this is that fix reaching the symbol
				// layers, which it never did.
				"icon-anchor": "bottom",
			},
		} as mapboxgl.LayerSpecification);
	};

	// Both pins are the same teardrop style; match on-screen HEIGHT. Hospital =
	// 48px @ 0.47 ≈ 22.6px tall. camp_public_pin.webp is 140×196, so
	// 22.6/196 ≈ 0.115 — but the campsite art carries more padding, so 0.23
	// lands it at the same visual size.
	poiLayer("v4-poi-hospital", "hospital", "v4-icon-hospital", 0.47);
	// Camp only from z10 up — too noisy when zoomed out.
	poiLayer("v4-poi-camp", "camp_site", "v4-icon-camp", 0.23, 10);
}

/** POI layer ids, for the page's visibility toggles and teardown. */
export const POI_LAYER_IDS = ["v4-poi-hospital", "v4-poi-camp"];
