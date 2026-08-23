/**
 * offlineBaseStyle.ts — the always-visible dark WORLD BASE (step 1).
 *
 * A hand-built Mapbox StyleSpecification (version 8) painted entirely in a
 * black → dark-grey register so the real downloaded tiles blaze out of it.
 * Data is Natural Earth vector, bundled as a LOCAL VECTOR TILE PYRAMID under
 * /static/mobileAssets/worldBase/base/tiles/ — fully airgapped (no streaming), and the
 * dt-web preview loads the exact same tiles that ship native.
 *
 * ── WHY TILES AND NOT GeoJSON (changed 2026-08-11, measured) ──
 *
 * This file used to declare SEVEN `geojson` sources pointing at ~24.6 MB of
 * whole-planet JSON (~48,000 features, ~878,000 coordinate pairs). A Mapbox
 * `geojson` source has exactly one behaviour: fetch the WHOLE file, parse the
 * WHOLE file, build a geojson-vt index over the WHOLE dataset, and RETAIN that
 * index for the source's lifetime — all inside the Mapbox worker.
 *
 * Measured cost: the two WorkerPool workers held ~77 MB EACH at idle on
 * /mobile/offlinev4 (318 MB while panning), versus ~10 MB each on
 * /mobile/map, which uses a vector tileset. Main-thread heap was IDENTICAL on
 * both routes, which is the tell that the cost was entirely worker-side.
 * Capping maxzoom/tolerance/buffer on the geojson sources was tried first and
 * did NOT help — it makes each tile cheaper but does not stop the
 * whole-planet parse.
 *
 * A `vector` source is the opposite: Mapbox fetches only the tiles the
 * viewport needs, parses only those, and evicts them through its normal tile
 * cache. Memory becomes a function of SCREEN size rather than WORLD size.
 *
 * Rule #1 (constant visibility) is preserved: `maxzoom: 6` is the deepest
 * tile that EXISTS, not a display gate — Mapbox overzooms it at every higher
 * zoom, so the base is still present and identical all the way in. Nothing
 * pops in or out.
 *
 * Regenerate with: node scripts/build-world-base-tiles.mjs
 *
 * The look: faint land/water figure-ground (dark-grey land vs blue-black water)
 * + major rivers, major highways, faint urban, dim borders. Major themes only —
 * the trick to maps is not putting too much on. NO bright tone anywhere.
 *
 * CITY LABELS (orientation anchors): a single symbol layer of Natural Earth
 * populated places (bundled `places.json`), zoom-gated by `scalerank` so the
 * world stays legible — only the most prominent cities + capitals show when
 * fully zoomed out (Edmonton, Toronto, Beijing), more appear as you zoom in.
 * `scalerank` (NE's prominence rank, not raw population) is the density lever:
 * an isolated 10k northern town has a LOW scalerank and surfaces early, while a
 * clogged US suburb has a HIGH one and stays hidden — exactly the bias we want.
 * Collision (`text-allow-overlap:false`) auto-thins dense regions. Glyphs are
 * bundled (Noto Sans), so labels stay airgap-safe.
 */

import type * as mapboxgl from "mapbox-gl";
import {
	ROAD_LINE,
	WATER_FILL,
	WATER_LINE,
} from "$osem/components/map/getCache_OfflineMap/lib/onPhone/render/offlineColors";

/**
 * Root of the bundled Natural Earth VECTOR TILE pyramid.
 *
 * The raw GeoJSON it was built from still lives at /mobileAssets/worldBase/base/min/ and is
 * the INPUT to scripts/build-world-base-tiles.mjs — it is no longer loaded by
 * the app at runtime.
 */
const BASE_TILES = "/mobileAssets/worldBase/base/tiles";

// ── Tonal palette — black → dark-grey register. ──
// ⛔ COLOURS ARE USER-OWNED. Do NOT change ANY hex in this file without the
//    user's EXPLICIT permission — they set these exact values deliberately
//    (e.g. water #051999). Never "tune by eye" on your own.
// Everything here MUST stay dark enough that a real imagery tile pops.
const C = {
	ocean: WATER_FILL, // background + lakes: dark dark blue (shared)
	land: "#15161b", //  faint dark-grey continental silhouette
	urban: "#212430", //  barely-there glow over big cities
	water: WATER_LINE, // river/lake line — shared blue (base = big = small)
	road: ROAD_LINE, //   roads — shared (base = big)
	border: "#2a2a31", // country borders: dimmest line
} as const;

/** Build the dark world-base style. */
export function buildOfflineBaseStyle(): mapboxgl.StyleSpecification {
	return {
		version: 8,
		// Glyphs are BUNDLED locally (Noto Sans Regular, ranges 0–511 → Latin + accents)
		// and served same-origin, so label layers render fully offline — the air-gap
		// guard (v4TransformRequest) allows "/…" URLs. NOT a remote glyph endpoint;
		// LAW 0 intact. No sprite (icons are loaded per-image via map.loadImage).
		glyphs: "/mobileAssets/worldBase/glyphs/{fontstack}/{range}.pbf",
		sources: {
			/**
			 * ONE vector tile source replacing SEVEN whole-planet geojson ones.
			 *
			 * Built by scripts/build-world-base-tiles.mjs (tippecanoe → XYZ
			 * .pbf, z0-6, 18 MB). Each old file is now a `source-layer` of the
			 * same name, minus the `ne-` prefix — see WORLD_LAYER below.
			 *
			 * `maxzoom: 6` is the deepest tile that EXISTS, not a display
			 * limit: Mapbox overzooms it for every higher zoom, so the base
			 * keeps rendering all the way in. From WALL_MIN_Z = 6.5 the baked
			 * wall map and satellite imagery cover this layer anyway.
			 *
			 * Same-origin "/…" URL, so v4TransformRequest's air-gap allowlist
			 * passes it through untouched (LAW 0 intact, no network).
			 *
			 * RELATIVE, not `${location.origin}${BASE_TILES}` — deliberately.
			 * Mapbox resolves a root-relative tile URL against the document
			 * base, exactly as the `glyphs` entry above already does, so the
			 * two forms are indistinguishable at runtime. But reading
			 * `location` made this module unimportable outside a browser: it
			 * threw `ReferenceError: location is not defined` during vitest
			 * COLLECTION (vitest.config.ts sets environment "node"), which
			 * reports as "0 tests" rather than as a failure —
			 * placeLabelRank.test.ts calls buildOfflineBaseStyle() at module
			 * top level. Keep style-building PURE; the air-gap guard still
			 * passes it, because isSameOrigin resolves relative URLs via
			 * `new URL(url, location.href)` (v4CloudflareTiles.ts:894).
			 */
			"world-base": {
				type: "vector",
				tiles: [`${BASE_TILES}/{z}/{x}/{y}.pbf`],
				minzoom: 0,
				maxzoom: 6,
			},
		},
		layers: [
			// 1) Ocean = the whole canvas. Land/lakes paint over it.
			{
				id: "ocean-bg",
				type: "background",
				paint: { "background-color": C.ocean },
			},
			// 2) Land silhouette — the faint dark-grey "looks like a country".
			//    ONE constant colour at every zoom — never changes as you zoom.
			{
				id: "land-fill",
				type: "fill",
				source: "world-base",
				"source-layer": "land",
				paint: { "fill-color": C.land },
			},
			// 3) Urban glow — a touch lighter than land, very subtle.
			{
				id: "urban-fill",
				type: "fill",
				source: "world-base",
				"source-layer": "urban",
				paint: { "fill-color": C.urban, "fill-opacity": 0.55 },
			},
			// 4) Lakes = water tone punched back through the land.
			{
				id: "lakes-fill",
				type: "fill",
				source: "world-base",
				"source-layer": "lakes",
				paint: { "fill-color": C.ocean },
			},
			// 5) Country borders — dimmest line, dashed.
			{
				id: "admin-line",
				type: "line",
				source: "world-base",
				"source-layer": "admin",
				paint: {
					"line-color": C.border,
					"line-width": 0.5,
					"line-dasharray": [3, 3],
				},
			},
			// 6) Roads — the always-everywhere road net (NE 10m, 25k feats, carries
			//    `min_zoom`/`expressway`/`scalerank`). DENSITY-AWARE like the city labels:
			//    each road shows once `zoom >= min_zoom − LEAD` so prominent highways read
			//    FAR OUT (from ~z4-5) and lesser roads fill in as you zoom (z7 → z9). So
			//    even in a rural area with sparse coverage you still see where you're going
			//    zoomed out, instead of a blank dark world. Expressways run a touch wider.
			{
				id: "roads-line",
				type: "line",
				source: "world-base",
				"source-layer": "roads",
				// ⛔ NO maxzoom. Capping this at the blob floor was tried and REVERTED
				// the same hour: it made the base map VANISH the moment you zoomed
				// past z8, so outside a blob the screen went empty and inside one the
				// surrounding context disappeared — "the river disappears when you
				// zoom in". A base map's whole job is constant presence (Law 1).
				//
				// The style-change complaint it was meant to fix is real but is a
				// COLOUR problem, not a zoom-range one: base roads and blob roads are
				// different tones, so whichever dominates reads as a restyle. Fix that
				// by matching the colours, never by deleting the base.
				// LEAD=4 → a min_zoom-6 highway shows from z2, min_zoom-9 from z5. Major
				// highways read WAY out (user: "three zoom levels further, even more").
				filter: [
					">=",
					["zoom"],
					["-", ["coalesce", ["get", "min_zoom"], 9], 4],
				],
				paint: {
					// Owned dark road tone (reverted from the brighter ochre — user found
					// the base map too bright). The base roads are intentionally quiet; the
					// downloaded BLOB roads are the ones that carry navigation detail.
					"line-color": C.road,
					// Expressways heavier; all stay thin enough not to eat the landscape.
					"line-width": [
						"interpolate",
						["linear"],
						["zoom"],
						4,
						["match", ["get", "expressway"], 1, 1.4, 1.0],
						9,
						["match", ["get", "expressway"], 1, 2.0, 1.4],
						14,
						["match", ["get", "expressway"], 1, 2.6, 1.8],
					],
				},
			},
			// 7) Rivers + lake shores — the one blue that reads in the dark.
			//    CONSTANT width. No zoom expression.
			{
				id: "rivers-line",
				type: "line",
				source: "world-base",
				"source-layer": "rivers",
				// NO maxzoom — see roads-line above. The blob ships NO water at all
				// now (roads only), so this base river is the ONLY water on screen at
				// every zoom. Capping it deleted the last water in the app.
				paint: {
					"line-color": C.water,
					"line-width": 1,
				},
			},
			// Lake outlines in the same blue so big lakes read as water at all zooms.
			{
				id: "lakes-line",
				type: "line",
				source: "world-base",
				"source-layer": "lakes",
				paint: { "line-color": C.water, "line-width": 0.6 },
			},
			// 8) CITY LABELS — the orientation anchors. ZOOM-GATED on an "effective
			//    rank" = the BETTER (lower) of two independent rankings:
			//      • scalerank − 2·(capital)  — NE's editorial prominence, capitals promoted
			//      • a rank derived from POPULATION (`p`)
			//    Fewer, more-prominent cities far out; more as you zoom. Collision
			//    (text-allow-overlap:false) thins dense regions automatically.
			//
			//    ⚠️ THE POPULATION HALF IS LOAD-BEARING — do not simplify it away.
			//    Natural Earth's `scalerank` is applied far more coarsely outside the US,
			//    so ranking on it alone silently erased the Canadian interior: Kamloops
			//    (69k) and Kelowna (125k) both sit at scalerank 6, while Olympia (157k)
			//    gets 4 and Spokane (348k) gets 4. Gated on scalerank alone, a zoomed-out
			//    BC view showed Seattle/Portland/Spokane/Salem and — in all of Canada —
			//    Vancouver, nothing else. Population is the cross-border equaliser: it
			//    means the same thing in both countries. `min()` keeps NE's editorial
			//    judgement where it promotes a place (small capitals, Jasper, Lake Louise)
			//    and lets population rescue everything NE under-ranked.
			{
				id: "place-label",
				type: "symbol",
				source: "world-base",
				"source-layer": "places",
				filter: [
					"<=",
					[
						"min",
						["-", ["get", "s"], ["*", 2, ["coalesce", ["get", "c"], 0]]],
						[
							"step",
							["coalesce", ["get", "p"], 0],
							8, // < 3k
							3000, 7,
							10000, 6,
							20000, 5,
							50000, 4,
							100000, 3,
							300000, 2,
							1000000, 1,
						],
					],
					// Tightened alongside the population rank. The old curve jumped 5→7 between
					// z6 and z7, which with the new ranking would dump ~35 names onto a
					// zoomed-out view at once. This ramps one rank at a time instead.
					["step", ["zoom"], 1, 5, 2, 6, 3, 7, 4, 8, 6, 9, 8],
				],
				layout: {
					"text-field": ["get", "n"],
					"text-font": ["Noto Sans Regular"],
					// Bigger for prominent places → tapers down the ranks. Keyed on the SAME
					// effective rank as the filter and sort-key (see above): keyed on raw
					// scalerank, a city that only appears because of its population would
					// draw at the smallest size, so Kelowna (125k) would read as fainter
					// than a NE-favoured village. Kept SMALL + subtle overall — quiet
					// orientation anchors, not headlines.
					"text-size": [
						"interpolate",
						["linear"],
						[
							"min",
							["-", ["get", "s"], ["*", 2, ["coalesce", ["get", "c"], 0]]],
							[
								"step",
								["coalesce", ["get", "p"], 0],
								8,
								3000, 7,
								10000, 6,
								20000, 5,
								50000, 4,
								100000, 3,
								300000, 2,
								1000000, 1,
							],
						],
						0,
						12,
						5,
						9.5,
						10,
						8,
					],
					// Prominent + capitals win collision (lower sort-key drawn first).
					// MUST use the same effective rank as the filter above, or the two
					// disagree: a city admitted on POPULATION would still be sorted on its
					// (worse) scalerank and lose its space to a smaller place NE happened to
					// rank higher — exactly the bug the filter change fixes, reintroduced one
					// property lower down.
					"symbol-sort-key": [
						"min",
						["-", ["get", "s"], ["*", 2, ["coalesce", ["get", "c"], 0]]],
						[
							"step",
							["coalesce", ["get", "p"], 0],
							8,
							3000, 7,
							10000, 6,
							20000, 5,
							50000, 4,
							100000, 3,
							300000, 2,
							1000000, 1,
						],
					],
					"text-allow-overlap": false,
					"text-padding": 6,
					"text-anchor": "center",
					"text-max-width": 7,
				},
				paint: {
					"text-color": "#85806f", // dim warm grey — subtle orientation anchors (bright white "hurt")
					"text-halo-color": C.ocean, // halo = the map background, for legibility
					"text-halo-width": 1.4,
					"text-halo-blur": 0.4,
				},
			},
			// 9) HIGHWAY NAME labels — so you can read "Yellowhead" / "Trans-Canada"
			//    zoomed out, not just see a line. Rides the road; gated on NE's curated
			//    `min_label` (LEAD 3 → major highways name early). Warm ochre like the
			//    line so name + road read as one. Whole NE roads (not per-tile fragments
			//    like the downloaded set), so line-placement HAS long lines even zoomed out.
			{
				id: "road-label",
				type: "symbol",
				source: "world-base",
				"source-layer": "roads",
				filter: [
					"all",
					["has", "name"],
					[">=", ["zoom"], ["-", ["coalesce", ["get", "min_label"], 11], 3]],
				],
				layout: {
					"symbol-placement": "line",
					"text-field": ["get", "name"],
					"text-font": ["Noto Sans Regular"],
					"text-size": ["interpolate", ["linear"], ["zoom"], 5, 9, 10, 11, 14, 12],
					"symbol-sort-key": ["coalesce", ["get", "min_label"], 11],
					"symbol-spacing": 300,
					"text-allow-overlap": false,
					"text-padding": 4,
				},
				paint: {
					"text-color": "#85806f", // dull warm grey — matches city labels (was too gold)
					"text-halo-color": C.ocean,
					"text-halo-width": 1.6,
					"text-halo-blur": 0.4,
				},
			},
		],
	} as mapboxgl.StyleSpecification;
}
