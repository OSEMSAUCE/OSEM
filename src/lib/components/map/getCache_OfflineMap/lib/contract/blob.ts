/**
 * THE BLOB — the whole rule, in one file.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *   ONE SQUARE CELL of roads. One file. Drawn at every zoom. Never changing.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * The shape and the radius live in `grid.ts` (a 20 km guarantee inside a 40 km
 * snapped cell). This file owns the two things that are about the TILE rather
 * than the ground: which zoom it is stored at, and which zoom it is read from.
 *
 * ⛔ Nothing else in V5 may name a radius or a zoom — everything imports from
 * here or from grid.ts.
 */

import { BLOB_TILE_Z } from "./grid";
export { BLOB_TILE_Z, GRID_RADIUS_KM } from "./grid";

/**
 * The cell's width in km at a latitude — DERIVED, never a constant.
 *
 * ⛔ THERE IS NO `CELL_KM`. The cell is a z10 slippy tile, and a slippy tile
 * narrows with cos(lat): ~39 km at the equator, ~27 km at lat 46.5, ~19 km at
 * lat 60. A single number would be a lie at every latitude but one, and code
 * that trusted it would silently under-cover in the north — the exact class of
 * "it worked where I tested it" bug this subsystem keeps producing.
 */
export function cellKmAt(lat: number): number {
	return tileKm(BLOB_TILE_Z, lat);
}

/**
 * The zoom the blob tile LIVES at — and therefore the shallowest zoom it is
 * visible at.
 *
 * The source declares `minzoom: BLOB_TILE_Z, maxzoom: BLOB_TILE_Z`, so MapLibre
 * overzooms this one tile at every DEEPER level and never asks for anything
 * else.
 *
 * ⛔ MapLibre ONLY OVERZOOMS UP. It never scales a tile DOWN, so the stored
 * level IS the floor — below it the map is blank, silently. MEASURED with an
 * isolated probe: source `minzoom:0 maxzoom:15`, camera at z8 → it requested z8
 * addresses ONLY, never z15. `minzoom: 0` means "z0 addresses may be
 * requested", not "stretch the deepest level to fill any zoom".
 *
 * z5 is the user's own number: "if it stopped at 5 that would be perfect".
 * Going shallower costs nothing — the same single tile, a coarser slippy
 * address, identical precision (geometry is remapped into the CELL's frame, not
 * the tile's footprint).
 */
export const BLOB_ZOOMS = [BLOB_TILE_Z] as const;

/**
 * ⛔ DO NOT TURN THIS BACK INTO A LIST. A list of levels IS the bug.
 *
 * A pyramid exists to show DIFFERENT data per level — the exact opposite of
 * "everything at every level, never changing as you zoom". The source archive
 * holds different roads at each level; measured at the user's own anchor:
 *
 *     z9, z10  major_road + highway ONLY (no minor roads exist at all)
 *     z12      major + minor + highway
 *     z15      minor + major
 *
 * So with a list, zooming out DELETES roads from the map, and no filter can add
 * back a road the archive never stored. With ONE tile there is nothing to thin
 * and nothing that can disagree between levels — the rule holds by
 * construction, not by a lint test defending it.
 */

export const BLOB_MIN_Z = Math.min(...BLOB_ZOOMS);
export const BLOB_MAX_Z = Math.max(...BLOB_ZOOMS);

/**
 * The level READ from the archive. Must match the Worker.
 *
 * ⛔ 15 WAS THE SPEED BUG. READ COUNT IS THE BOTTLENECK, NOT BYTES.
 *
 * The Worker reads ONE R2 object per source tile at this level. At z15 a 30 km
 * disc was ~3,900 tiles → ~3,900 reads → MEASURED `loopMs=64492`, a ~65 s cold
 * build.
 *
 * PROOF IT IS THE READS, NOT THE DATA: dropping water + landuse cut the pack
 * 13,477,089 → 1,012,456 bytes (13× smaller) and `loopMs` did not move
 * (65511 → 64492). Raising the read pool 8 → 32 did not move it either. Only
 * the NUMBER OF READS matters.
 *
 * At z13 a 40 km cell is a few hundred tiles — and the cell is 56% smaller in
 * area than the old 30 km disc, so the read count falls with it.
 *
 * ⚠️ THE TRADE IS REAL: Protomaps thins minor roads as you zoom out, so a z13
 * read carries fewer small roads than a z15 read. Everything z13 holds appears
 * at EVERY level, so the spec's answers stay constant — but the deepest detail
 * is coarser than z15. Raising this buys detail and costs build time, steeply.
 */
export const BLOB_DETAIL_LEVEL = 13;

/** Width of one tile in km at zoom `z` and latitude `lat`. */
export function tileKm(z: number, lat: number): number {
	return (40075.016686 * Math.cos((lat * Math.PI) / 180)) / 2 ** z;
}
