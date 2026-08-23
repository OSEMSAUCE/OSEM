/**
 * wallLegend.ts — the layer TOGGLES and the read-only colour KEY.
 *
 * Both describe the same stack from the user's side, so they live together and
 * next to `wallStyle.ts`, which is the thing they describe. The old page kept
 * all three apart and the legend went stale: it listed land-cover rows that
 * were dropped at decode time and therefore never on the map at all.
 *
 * ⚠️ THESE MUST MATCH `wallStyle.ts` / `wallLabels.ts`. The ids below are the
 * real layer ids; `offlineLaws.test.ts` checks that every id here exists in the
 * stack, so a rename fails the build instead of silently disabling a switch.
 */

import {
	PATH_LINE,
	RAIL_LINE,
	ROAD_LINE,
	ROAD_MAJOR_LINE,
} from "$osem/components/map/getCache_OfflineMap/lib/onPhone/render/offlineColors";

/** One switch in MapDrawControls' BASEMAP popover. */
export interface LayerToggle {
	readonly key: string;
	readonly label: string;
	readonly ids: readonly string[];
}

/**
 * The on/off switches, in the order they render.
 *
 * `sat` is special: its `v4-sat` id is a STAND-IN, not a real layer. Per-pin
 * photo layers (`v4-sat-<key>-l`) are mounted dynamically by the page's
 * reconcile, so the page sweeps every `v4-sat-*` layer when this key toggles.
 */
export const LAYER_TOGGLES: readonly LayerToggle[] = [
	{ key: "sat", label: "Satellite", ids: ["v4-sat"] },
	{
		key: "vector",
		label: "Roads/water",
		ids: [
			"v4-roads",
			"v4-path",
			"v4-rail",
			"v4-rail-ties",
		],
	},
	// LAND COVER TOGGLE REMOVED — the fills are gone (wallStyle.ts). A switch
	// for layers that do not exist is a dead control, and offlineLaws.test.ts
	// fails on ids that are not in the stack.
	{ key: "labels", label: "Labels", ids: ["v4-town-label", "v4-road-label"] },
	{ key: "pois", label: "Places", ids: ["v4-poi-hospital", "v4-poi-camp"] },
] as const;

/**
 * Toggle keys `resetLayersAllOn()` must NOT force back on.
 *
 * ⛔ FIRE IS DELIBERATELY NOT LISTED — and is not in LAYER_TOGGLES at all while
 * the layer is held off this route (see the page's FIRES ARE OFF note). When it
 * returns it comes back ALWAYS-ON, never opt-in: an opt-in hazard layer is one
 * you discover the day AFTER you needed it, and in practice it meant hotspots
 * downloaded correctly for hours and were never once seen. The user's ruling:
 * "you can't turn them off if there's fires they need to know." Restraint comes
 * from clustering and muted styling, never from hiding.
 */
export const OPT_IN_LAYERS: readonly string[] = [];

/** A row in the read-only colour key. The swatch is drawn to match how the
 *  feature renders: a solid line for roads, a dashed line for trails, a rail
 *  hatch for railways, a filled chip for water bodies. */
export interface LegendEntry {
	label: string;
	color: string;
	swatch: "line" | "dashed" | "fill" | "rail";
}

/**
 * ONLY what this map actually paints.
 *
 * Land cover is absent ON PURPOSE: those fills carry PLACEHOLDER hexes the user
 * has not signed off (Law 4), and a legend that names an unapproved colour
 * makes it look decided. Add the rows when the real hexes land.
 */
export const LEGEND: readonly LegendEntry[] = [
	{ label: "Roads", color: ROAD_LINE, swatch: "line" },
	{ label: "Major roads / highways", color: ROAD_MAJOR_LINE, swatch: "line" },
	{ label: "Trails / paths", color: PATH_LINE, swatch: "dashed" },
	{ label: "Railways", color: RAIL_LINE, swatch: "rail" },
] as const;
