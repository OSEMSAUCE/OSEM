/**
 * offlineColors.ts — THE ONE source of truth for offline-map colours.
 *
 * Base layer, big tiles, and small tiles ALL import from here, so a colour can
 * never diverge between them again. Change a value once → it changes everywhere.
 *
 * ⛔ COLOURS ARE USER-OWNED. Do NOT change ANY hex here without the user's
 *    EXPLICIT permission. Never tune by eye on your own.
 */

/** Every blue water LINE — base rivers, big-tile rivers, small-tile rivers. */
// export const WATER_LINE = "#081254";
export const WATER_LINE = "#091777";

/** Pooled water FILL (lakes) — dark dark blue. Also the ocean / background. */
export const WATER_FILL = "#05101f";

/** Every road LINE — the DEFAULT/secondary road colour (kind `medium_road` and
 *  anything unmatched). Major + minor classes branch to their own hues below. */
// export const ROAD_LINE = "#2D241A";
export const ROAD_LINE = "#413413";

/** Major arterials (kind `major_road`/`highway`) — muted rust-brown. Marks the
 *  big roads by HUE only (same thin width as all roads). (Brighter rust `#c97a4a`
 *  and gold `#ffd700` were prior picks, retired.) User-chosen. */
export const ROAD_MAJOR_LINE = "#80563C";

/** PATHS / TRAILS (kind `path`) — DARK, dull green, dashed in its own layer. Trails
 *  are insignificant, so they must RECEDE into the black, not pop — kept dim enough
 *  to barely read on the dark base (user: "make them very dull greenish, harder to
 *  see"). HUE + dash distinguish it from roads. */
export const PATH_LINE = "#3d4a30";

/** RAILWAYS (kind `rail`) — dark desaturated grey-blue, ladder-dashed in its own
 *  layer so a railway reads as rail, distinct from roads (brown) and trails (green).
 *  Dimmed to match the dull trail register. */
export const RAIL_LINE = "#4a525e";

/** ACCENT GOLD for GL layer paints (click-to-identify outline, coverage
 *  footprints) — the JS-side twin of the app's `--rt-gold-1`/`--color-accent`
 *  CSS token (Mapbox paint can't read CSS vars). Same value as the token. */
export const ACCENT_GOLD_LINE = "#f5d565";

