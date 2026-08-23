/**
 * wallStyle.ts — THE WALL MAP'S LAYER STACK, in one place.
 *
 * Extracted from the V4 page during the V5 rebuild. It is the same stack, the
 * same ids and the same hexes; what changed is that it is no longer 600 lines
 * wedged inside a 2,224-line component, where the only way to see the paint
 * order was to scroll past it.
 *
 * ── WHAT THIS FILE IS ────────────────────────────────────────────────────
 *
 * `wallLayers()` returns the layers to add, bottom-first, already in paint
 * order. The caller adds them in array order before its own anchor. That is
 * the whole API: a pure function of nothing, returning plain specs, so the
 * order is READABLE as a list instead of inferred from 20 scattered
 * `addLayer` calls.
 *
 * ── PAINT ORDER (bottom → top), and why ──────────────────────────────────
 *
 *   land cover → water fill → [per-pin satellite photos] → roads → water edge
 *                             └── mounted by the page's reconcile, BETWEEN
 *                                 `v4-water-fill` and `v4-roads`, so a photo
 *                                 always covers the fills and never the roads.
 *
 * The photos are not in this list because they are per-area and dynamic; the
 * page mounts them against `SAT_INSERT_BEFORE`. Everything else is static.
 *
 * ── ONE SOURCE, ONE DISC, EVERY ZOOM ────────────────────────────────────
 *
 * One downloaded 30 km disc, saved at every zoom in `BLOB_ZOOMS`
 * (roadBlob.ts). ONE source spans exactly those levels, and every road layer
 * reads it. There is no relay, no band, and no zoom number written here.
 *
 * ⛔ THERE USED TO BE FOUR SOURCES with hand-written bands (wide z1-12, ring
 * z12-13, mid z13-15, core z15+). That was correct only while the pack held
 * two levels. Once the Worker saved every level, the bands became four ways to
 * describe one circle — and they got it wrong: z12 and z13 tiles fell between
 * the declared windows. MEASURED 2026-08-18: 4,339 tiles on disk, ZERO layers
 * painting, black map, no console error.
 *
 * A single source cannot have a gap between itself. That is the whole reason
 * this is one source, and why no zoom number belongs in this file.
 *
 * ── COLOURS ARE THE USER'S (LAW 4) ───────────────────────────────────────
 *
 * Every line colour is imported from `offlineColors.ts`. The land-cover fills
 * are still marked PLACEHOLDER — they were never signed off, and they must not
 * be "tuned" into permanence by anyone but the user.
 */

import type * as mapboxgl from "maplibre-gl";

import {
	PATH_LINE,
	RAIL_LINE,
	ROAD_LINE,
	ROAD_MAJOR_LINE,
} from "$osem/components/map/getCache_OfflineMap/lib/onPhone/render/offlineColors";
import {
	RAW_SOURCE,
} from "$osem/components/map/getCache_OfflineMap/lib/onPhone/roads/rawWallProtocol";

/** The layer per-area satellite photos mount BEFORE — i.e. directly under the
 *  roads, directly over the water fill. The page's reconcile reads this rather
 *  than re-deriving the ordering rule. */
export const SAT_INSERT_BEFORE = "v4-roads";

/**
 * ONE WIDTH FOR EVERY ROAD KIND.
 *
 * Colour is the only hierarchy — highways/majors in rust, everything else the
 * owned brown. The user was explicit: highways shouldn't be thicker, just a
 * different colour. The low-zoom floor keeps rural roads visible from z7-8.
 */
const ROAD_WIDTH: mapboxgl.ExpressionSpecification = [
	"interpolate",
	["linear"],
	["zoom"],
	6,
	0.85,
	9,
	1.1,
	12,
	1.35,
	16,
	1.7,
];

/** Rust for the major network, owned brown for everything else. */
/**
 * TWO COLOURS, BY ROAD SIZE — and NEVER by zoom.
 *
 * Big roads rust, small roads the darker brown. The user: "there's bigger and
 * smaller roads and they can be different colors — that was amazing." Keep it.
 *
 * ⛔ THE RULE IS: a given road must be the SAME COLOUR AT EVERY ZOOM. Colouring
 * by `kind` is fine — `kind` is a property of the road, not of the camera. What
 * broke it was that WHICH KINDS EXIST used to change with zoom: Protomaps thins
 * minor roads as you zoom out, so shallow levels held only major_road/highway
 * and the whole network appeared to shift colour as you zoomed.
 *
 * That is fixed UPSTREAM, not here: every stored level is now GENERATED from one
 * read level (downsample.ts), so a road carries its own `kind` all the way up
 * and its colour cannot change. This expression is safe BECAUSE of that.
 *
 * ⚠️ NEVER put `["zoom"]` in this expression, and never restore per-level reads
 * from the archive — either one brings the colour-shift straight back.
 */
const ROAD_COLOR: mapboxgl.ExpressionSpecification = [
	"match",
	["get", "kind"],
	["major_road", "highway"],
	ROAD_MAJOR_LINE,
	ROAD_LINE,
];

/** Roads only — `path`, `rail` and `aeroway` each render elsewhere (or not at
 *  all), so every road layer excludes them identically. */
const ROADS_ONLY: mapboxgl.FilterSpecification = [
	"match",
	["get", "kind"],
	["rail", "aeroway", "path"],
	false,
	true,
];



/**
 * The whole wall-map stack, bottom-first, in paint order.
 *
 * ⚠️ EARTH (the landmass polygon) is deliberately NOT here. Filling it as a
 * "ground map" to stop roads floating over ocean was tried: Protomaps' `earth`
 * clips to coarse z12 tile rectangles, so on the jagged download frontier a
 * fill reads as ugly dark BLOCKS that wreck the clean bundled coastline —
 * worse than no base at all. The bundled Natural Earth coastline (smooth
 * lines, in `offlineBaseStyle`) is the figure-ground instead; roads may cross
 * water (accepted) rather than show tile-squares. A genuinely granular
 * coastline means a higher-res bundled coastline LINE, not tile-clipped
 * polygons — no per-area download either way.
 */
export function wallLayers(): mapboxgl.LayerSpecification[] {
	return [
		// ── 0) LAND COVER ────────────────────────────────────────────────────
		// The `landuse` source-layer of the z15 core tiles, each polygon keeping
		// its `kind`. Bottom of the stack: water, satellite and roads all draw
		// over it, so in the dark road ring (no photo) you still read forest vs
		// swamp vs field. Shipped by the Worker as of pack v20; it used to be
		// SYNTHESISED on-device, which was most of the reason a decoder existed.
		// ⚠️ PLACEHOLDER HEXES (Law 4) — the user picks the real ones.
		// ⛔ LAND COVER IS OFF. The user's call, on seeing the first working blob:
		// "get rid of the green ... let's just do the roads for now, it's not
		// meant to be a satellite image". The fills also painted the whole disc a
		// flat green that made the blob read as one solid mass instead of a road
		// network, and their hexes were never signed off (Law 4 PLACEHOLDERs).
		//
		// WATER STAYS — "leave the water, it works". Roads + water only.
		//
		// To bring land cover back, restore the landFill() calls below and pick
		// real colours WITH the user first.

		// ⛔ WATER REMOVED — the pack no longer ships a `water` layer.
		// Water polygons were the heaviest thing in a z15 tile and a cold 30 km blob
		// is ~3,950 of them, pushing the Worker build to 56-65 s — past the client's
		// fetch timeout, so the blob "randomly" failed and reappeared a minute later.
		// The user's call: "if it's that painfully slow to bring in the water it's not
		// really worth very much ... we've got to get feedback faster." Roads only.
		//
		// ⚠️ Water previously came from a 5 km radius, NOT the full 30 — so restoring
		// it at 30 km is not the old cost. Measure before bringing it back.

		// ── 2) THE ROAD RELAY ────────────────────────────────────────────────
		// Four bands, one per stored zoom, meeting exactly. See the header.
		//
		// WIDE is NOT a second radius — it is the SAME circle stored zoomed-out.
		// ⛔ Its radius must equal the ring's. Three builds shipped a wider circle
		// here and every one read on screen as a second, bigger shape appearing
		// and vanishing ("an unbelievable tripping hazard"). The Worker derives
		// both from the same km for exactly this reason.
		// THE ROADS. One layer, one source, no zoom window — the source's own
		// span (BLOB_MIN_Z→BLOB_MAX_Z) already says exactly which levels exist,
		// and MapLibre overzooms above the deepest one for free.
		{
			id: "v4-roads",
			type: "line",
			source: RAW_SOURCE,
			"source-layer": "roads",
			filter: ROADS_ONLY,
			paint: { "line-color": ROAD_COLOR, "line-width": ROAD_WIDTH },
		} as mapboxgl.LayerSpecification,

		// ── 3) TRAILS + RAIL ─────────────────────────────────────────────────
		// PATH — sage-green + a fine dash so a footpath or logging track reads as
		// a trail, NOT a road. Same width as roads.
		{
			id: "v4-path",
			type: "line",
			source: RAW_SOURCE,
			"source-layer": "roads",
			filter: ["==", ["get", "kind"], "path"],
			layout: { "line-cap": "round", "line-join": "round" },
			paint: {
				"line-color": PATH_LINE,
				"line-width": ROAD_WIDTH,
				"line-dasharray": [1.5, 1.5],
			},
		} as mapboxgl.LayerSpecification,
		// RAIL — a PROPER railway, not a dotted line: a thin solid SPINE plus
		// periodic CROSSTIES. The ties are a second, much wider line whose dash
		// is SHORTER than its width (dasharray units are multiples of
		// line-width), so each dash is wider-than-long and reads as a
		// perpendicular tie straddling the spine — the standard railway hatch.
		// Cool-grey keeps it distinct from roads (brown) and trails (green).
		{
			id: "v4-rail",
			type: "line",
			source: RAW_SOURCE,
			"source-layer": "roads",
			filter: ["==", ["get", "kind"], "rail"],
			layout: { "line-cap": "butt", "line-join": "round" },
			paint: {
				"line-color": RAIL_LINE,
				"line-width": [
					"interpolate",
					["linear"],
					["zoom"],
					6,
					0.55,
					12,
					0.95,
					16,
					1.25,
				],
			},
		} as mapboxgl.LayerSpecification,
		{
			id: "v4-rail-ties",
			type: "line",
			source: RAW_SOURCE,
			"source-layer": "roads",
			filter: ["==", ["get", "kind"], "rail"],
			layout: { "line-cap": "butt", "line-join": "round" },
			paint: {
				"line-color": RAIL_LINE,
				// ~3.5x the spine width; short dash + big gap → one crosstie every
				// ~3 tie-widths along the rail.
				"line-width": [
					"interpolate",
					["linear"],
					["zoom"],
					6,
					2.0,
					12,
					3.4,
					16,
					4.4,
				],
				"line-dasharray": [0.3, 2.6],
			},
		} as mapboxgl.LayerSpecification,

	];
}

/** Every layer id this module owns, for the page's visibility toggles and for
 *  teardown. Derived from `wallLayers()` so it CANNOT drift from the stack —
 *  the old page hand-maintained a parallel list and it went stale. */
export function wallLayerIds(): string[] {
	return wallLayers().map((l) => l.id);
}
