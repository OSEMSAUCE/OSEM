/**
 * THE ROADS BLOB — a COMPATIBILITY SHIM over `OFFLINEV5/blob.ts`.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *   THE RULE NOW LIVES IN /src/lib/mobile/offline/contract/blob.ts.
 *   This file only re-exports it under the old names.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ⛔ DO NOT WRITE A NUMBER IN THIS FILE. `BLOB_RADIUS_KM` and `BLOB_ZOOMS`
 * below are aliases for V5's `BLOB_KM` and `BLOB_ZOOMS` — that is the whole
 * point. Two lists of zooms is exactly the bug this shim exists to prevent:
 * the client declared z1-z15 while the deployed Worker shipped z8-z15, so
 * MapLibre requested seven levels that do not exist and blanked the map
 * SILENTLY, with no console error. One list, imported, cannot disagree.
 *
 * The prose below is the V4 history and is kept because it records WHY the
 * rule is shaped this way. Where it describes z1-z7 as stored levels it is
 * describing the past; V5 deleted them (a z1 tile is 14,153 km wide and can
 * never be honest about a 30 km circle).
 *
 * ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────
 *
 * The rule above used to live as ELEVEN separate constants across THREE files
 * (packBuilder.ts, rawWallProtocol.ts, v4CloudflareTiles.ts) that all had to
 * agree by hand: an inner zoom, a mid zoom, a ring zoom, a wide min, a wide
 * max, two radii, a budget shrink target, and a RINGS table that restated all
 * of it. They did not agree. The client declared a 40 km outer disc while the
 * Worker shipped 25 km; a stale `{km:40, z:9}` row duplicated the wide range.
 *
 * The cost of that spread, measured on 2026-08-17: 177 hardcoded zoom numbers
 * across the offline code (67 in one file), and an entire evening in which
 * "make the roads show when zoomed out" was attempted four times — z8, z10,
 * z9, then every-level — and each attempt silently missed one of the places
 * that had to change. Every failure looked identical from the outside: roads
 * vanish below z12, no error, no warning.
 *
 * The user's summary, which is the correct one: "why does it say Z9 twelve
 * times in these files? It shouldn't be talking about that at all."
 *
 * ── THE ONE FACT THAT MAKES ANY OF THIS NECESSARY ─────────────────────────
 *
 * A vector tile is only ever stretched BIGGER, never smaller.
 *
 * So a tile saved at z12 covers z12 → z22 for free, and NOTHING below z12: at
 * z11 the renderer asks for a z11 address, it was never saved, and it draws
 * nothing — silently, with no console error. This is why "just save it at z12"
 * fails, and why saving ONE extra shallow level only MOVES the cliff instead
 * of removing it (z12 → z10 → z9 — three shipped attempts, three rejections).
 *
 * The fix is not a cleverer pyramid. It is to save the SAME circle at EVERY
 * zoom, so no zoom can ever be the one without a tile.
 *
 * ── WHY THIS IS CHEAP, NOT EXPENSIVE ──────────────────────────────────────
 *
 * A tile's width is 40075 x cos(lat) / 2^z km. Zoomed out, one tile swallows
 * the whole blob — MEASURED against the live pack at Calgary:
 *
 *     z1-z7    1 tile each      (the disc fits inside a single tile)
 *     z8       2 tiles
 *     z9       4 tiles
 *     z10      9 tiles
 *     z11     23 tiles
 *     z12     70 tiles
 *     z13     48 tiles
 *     z15    169 tiles
 *
 * Eleven zoomed-out levels cost ~40 tiles. z15 ALONE costs 169. The shallow
 * levels are also the cheapest bytes in the archive, because Protomaps has
 * already dropped minor roads by then. Covering every zoom is a rounding error
 * against the detail level we were already paying for.
 */

import { GRID_RADIUS_KM, BLOB_ZOOMS as V5_ZOOMS } from "$osem/components/map/offline/contract/blob";

/**
 * THE RADIUS. One number. Every zoom uses it — that is what makes the blob ONE
 * circle rather than a set of rings.
 *
 * ⛔ DO NOT ADD A SECOND RADIUS. It was tried three times in one day (a wide
 * level at 40 km against a smaller disc) and every version read on screen as a
 * second, bigger shape appearing at one zoom and vanishing at another:
 * "it jumps to this huge really confusing 40 kilometre thing", "an unbelievable
 * tripping hazard", "at least it was simple, at least it was one radius".
 *
 * A second radius is a second EDGE, and an edge that appears and disappears is
 * the single most confusing thing this map can do.
 */
export const BLOB_RADIUS_KM: number = GRID_RADIUS_KM;

/**
 * EVERY ZOOM THE BLOB IS SAVED AT — the full range, no gaps.
 *
 * z14 is deliberately absent and that is NOT a gap: z13 overzooms up to cover
 * it, which is free. Every level BELOW the deepest one must be present, because
 * overzoom only ever goes up.
 *
 * ⛔ Adding or removing a level here changes what the Worker packs AND what the
 * renderer requests. That is the point — it is one edit, in one place. Bump
 * `PACK_FORMAT_VERSION` after changing it so devices re-download.
 */
export const BLOB_ZOOMS: readonly number[] = V5_ZOOMS;

/** The deepest level saved. Above this the renderer overzooms for free. */
export const BLOB_MAX_Z = Math.max(...BLOB_ZOOMS);
/** The shallowest level saved. There is nothing below this to draw. */
export const BLOB_MIN_Z = Math.min(...BLOB_ZOOMS);

/**
 * Is `z` a level the blob actually holds?
 *
 * The renderer must never be told a level exists when it does not — declaring a
 * zoom span wider than the pack makes MapLibre request addresses that 404, and
 * it fails SILENTLY with a blank map and no console error. Measured twice.
 */
export function blobHasZoom(z: number): boolean {
	return (BLOB_ZOOMS as readonly number[]).includes(z);
}

/**
 * How wide one tile is, in km, at zoom `z` and latitude `lat`.
 *
 * The one piece of arithmetic worth keeping in this file, because it is what
 * decides whether a level is honest: a tile WIDER than the blob necessarily
 * contains ground the user never downloaded, so it paints roads in places they
 * did not ask for and cannot verify. That is exactly what the rejected z8-only
 * build did.
 *
 * It is fine — and unavoidable — at the shallow levels here, because the WHOLE
 * disc is inside one tile and the Worker clips to the disc before packing. It
 * matters when deciding what a level is allowed to CONTAIN, not whether the
 * level may exist.
 */
export function tileWidthKm(z: number, lat: number): number {
	return (40075.016686 * Math.cos((lat * Math.PI) / 180)) / 2 ** z;
}
