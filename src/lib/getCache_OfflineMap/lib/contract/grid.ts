/**
 * THE BLOB — one download, all the roads, around the pin.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *   ONE pin → ONE request → ONE blob → every road within the radius.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── THE ONLY TWO REQUIREMENTS ─────────────────────────────────────────────
 *
 * The user, after a day of this: "we just want to see the roads. Can you just
 * show me the roads? 30 kilometres, 25, whatever you want, circle, jagged
 * circle, square, whatever you want — just show the roads." And: "we need to
 * see the roads all the time, and we need it to be fast. That's it."
 *
 *     1. ALL the roads within the radius, present at every zoom.
 *     2. Fast, and PREDICTABLE — it either arrives or it doesn't.
 *
 * Everything else is implementation and must never leak into what the user
 * sees.
 *
 * ── WHAT WENT WRONG, SO IT IS NOT REPEATED ────────────────────────────────
 *
 * A previous version made the storage unit a MAP TILE (~27 km at z10) while the
 * promise was a 20 km radius. A tile smaller than the promise means a pin near
 * its edge needs NEIGHBOURS — up to NINE separate blobs for one pin. That single
 * mismatch caused every symptom the user reported in one evening:
 *
 *   • Nine requests landing at nine different times, so the map drew a
 *     disconnected fragment and maybe another later: "some random piece of shit
 *     comes after... totally, totally unusable."
 *   • The session download guard (sized when one pin was one download) latching
 *     after ~7 pins and then refusing EVERYTHING: a new pin showed nothing at
 *     all, with the cause visible only in the console.
 *   • Roads filling only part of the screen and stopping at a straight line —
 *     one tile of nine had arrived.
 *
 * ⛔ THE LAW THIS ENCODES: THE STORAGE UNIT MUST BE AT LEAST AS BIG AS THE
 * PROMISE. If a pin can ever need a second blob to satisfy the radius, the
 * product becomes a lottery. `BLOB_TILE_Z` is chosen to guarantee this, and
 * `oneBlobIsEnough.test.ts` fails if it ever stops being true.
 */

import { km } from "./geo";

/** THE RADIUS. Every road within this distance of the pin is in the blob. */
export const GRID_RADIUS_KM = 30;

/**
 * The zoom the blob is ADDRESSED at — and therefore the shallowest zoom the
 * roads are visible at.
 *
 * ⛔ THIS IS AN ADDRESS, NOT A SIZE. The blob's CONTENTS are always the radius
 * around the pin ({@link radiusBox}), whatever this number is, because the
 * geometry is a disc read around the PIN (`radiusBox`). The tile's nominal
 * 862 km footprint is irrelevant to what is drawn.
 *
 * ⚠️ It IS the visibility floor: MapLibre overzooms UP but never scales a tile
 * DOWN, so below the stored zoom the map is blank — silently. The user asked to
 * "see it all the way out", and z8 still cuts the roads off below z8. THAT IS
 * NOT YET SOLVED HERE — the zoom-out picture, which is the
 * intended answer. Do not "fix" it by lowering this constant.
 *
 * ⛔ THIS COMMENT USED TO SAY "so this is z5" AND "framing to the PIN removes
 * that coupling". Both were false and both were expensive:
 *
 *   - The value has been 8, not 5, since the address zoom and the key zoom were
 *     made equal. A shallower address collided — cells hundreds of km apart
 *     mapped to `5/8/11`, and that SHIPPED.
 *   - Pin-framing was DELETED (see the pinFrame note below). It wrote pin-box
 *     coordinates into a tile-addressed blob, and MapLibre stretched the result
 *     1.86× anchored top-left. MVT coordinates are relative to the TILE.
 *
 * So the old rule is BACK, and it is load-bearing: the blob is framed to the
 * TILE, therefore a pin near a tile edge DOES need its neighbours. That is why
 * `cellsFor` returns every cell the radius touches (up to 4 for a corner pin) —
 * not a regression of the nine-downloads disaster, because they arrive as ONE
 * pack in ONE request.
 */
export const BLOB_TILE_Z = 8;

/**
 * The KEY zoom = the ADDRESS zoom, and they must stay equal.
 *
 * ⚠️ A shallower ADDRESS would let the roads stay visible when zooming out
 * (the user asked for this and it is NOT yet delivered — below z8 the map goes
 * blank). It was attempted by splitting the address zoom from the key zoom, and
 * abandoned mid-flight: a z5 address covers dozens of pin areas, so the
 * renderer would have to merge several pins' blobs per request — new code on a
 * path that has already broken four times in one session.
 *
 * The correct fix is the shallow IMAGE tier (EXPLAINER.md): one picture per
 * area below z8, instead of drawing thousands of hairlines into a speck. Do not
 * lower this constant on its own — it reintroduces the storage collision where
 * one pin's blob overwrites another's.
 */

/** A blob's cell — which IS a slippy tile at {@link BLOB_TILE_Z}. */
export interface Cell {
	ix: number;
	iy: number;
	/**
	 * The zoom this cell lives at.
	 *
	 * ⚠️ NOT ALWAYS {@link BLOB_TILE_Z}. A pin near a tile edge is promoted to a
	 * shallower (larger) tile so its whole radius fits — see {@link cellFor}.
	 * Anything deriving a key or a frame MUST use this, never the constant, or
	 * the address and the geometry disagree and the blob draws in the wrong box.
	 */
	z: number;
}

/** The cell's bounding box in degrees: west/south/east/north. */
export interface CellBox {
	w: number;
	s: number;
	e: number;
	n: number;
}

/** Mercator-normalised Y (0..1) for a latitude. */
function mercY(lat: number): number {
	const s = Math.sin((lat * Math.PI) / 180);
	return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
}

/** Latitude for a mercator-normalised Y — the inverse of {@link mercY}. */
function latOfMercY(y: number): number {
	const n = Math.PI * (1 - 2 * y);
	return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

/** Which cell contains this point. Plain slippy-tile maths — no state, no
 *  origin negotiation, identical on the Worker and the phone. */
export function cellOf(lng: number, lat: number): Cell {
	const n = 2 ** BLOB_TILE_Z;
	return {
		ix: Math.floor(((lng + 180) / 360) * n),
		iy: Math.floor(mercY(lat) * n),
		z: BLOB_TILE_Z,
	};
}

/** The bounding box of a cell. */
export function cellBox(c: Cell): CellBox {
	const n = 2 ** c.z;
	return {
		w: (c.ix / n) * 360 - 180,
		e: ((c.ix + 1) / n) * 360 - 180,
		n: latOfMercY(c.iy / n), // north = SMALLER mercator y
		s: latOfMercY((c.iy + 1) / n),
	};
}

/** A cell's stable id — also its dedup key. */
export function cellKey(c: Cell): string {
	return `${c.z}_${c.ix}_${c.iy}`;
}

/** Parse a cell id back. Returns null for anything malformed. */
export function parseCellKey(key: string): Cell | null {
	const m = /^(\d+)_(-?\d+)_(-?\d+)$/.exec(key);
	if (!m) return null;
	return { z: Number(m[1]), ix: Number(m[2]), iy: Number(m[3]) };
}

/**
 * THE STORAGE KEY — and the slippy address MapLibre requests.
 *
 * ⛔ THE SAME STRING, DELIBERATELY. Earlier versions had a cell key AND a tile
 * address that had to be reconciled; both times they failed to line up, the map
 * was silently blank or silently wrong. One string cannot drift from itself.
 *
 * ⛔ THIS IS WHY THE GRID FILE IS SHARED BYTE-FOR-BYTE. The Worker writes the
 * blob under this key; the phone asks for exactly this. If the two ever computed
 * it differently the phone would request something never written and the map
 * would be blank with no error — this subsystem's signature failure.
 * `grid.lockstep.test.ts` is what prevents it.
 */
export function cellTileKey(c: Cell): string {
	return `${c.z}/${c.ix}/${c.iy}`;
}

/**
 * THE ROADS KEY — the PIN'S OWN ADDRESS, plus the cell that draws it.
 *
 * ⛔ WHY NOT `cellTileKey` ALONE. A cell key is a grid square, and two pins can
 * sit in the same square — so one pin's roads were stored under a key the other
 * pin also asks for. MEASURED (2026-08-20): a Yellowstone pin at 44.6629 was
 * served a roads box ending at 44.3334 — 36.6 km SOUTH of itself, byte-identical
 * to the previous pin's box. The pin was not inside its own roads.
 *
 * ⚠️ THE SATELLITE NEVER COLLIDED, because its key IS the pin:
 *     satImageKey  = `${lng},${lat}`     ← unique per pin
 *     cellTileKey  = `${z}/${ix}/${iy}`  ← shared between pins
 * Same map, same moment: 5 m off vs 50 km off. Roads now copy the photo.
 *
 * The cell part stays because MapLibre draws a tile across the box it requested,
 * so the frame must remain a real slippy box. IDENTITY is the pin; GEOMETRY is
 * the cell. Keeping both in one string means they can never disagree.
 *
 * 5 decimal places = ~1 m — the same precision the Worker and phone both use.
 * Both sides MUST spell this identically or the phone asks for a key that was
 * never written and the map is silently blank (`grid.lockstep.test.ts`).
 */
export function pinTileKey(lng: number, lat: number, c: Cell): string {
	return `pin/${lng.toFixed(5)},${lat.toFixed(5)}/${cellTileKey(c)}`;
}

/** Is this a pin-addressed roads key? */
export function isPinTileKey(key: string): boolean {
	return key.startsWith("pin/");
}

// ⛔ `pinFrame` IS DELETED, AND MUST NOT COME BACK.
//
// It framed the blob's geometry to the pin's radius box, as an attempt to fix
// "the pin is not in the middle". It made things worse in a way that looked
// like two separate bugs: MVT coordinates are relative to the TILE, so writing
// pin-box coordinates into a tile-addressed blob made MapLibre stretch 60 km of
// roads across a 112 km tile — MEASURED 1.86x too big, anchored top-left.
//
// CENTRING IS NOT A FRAMING PROBLEM. It comes from `radiusBox`, which selects
// what to READ around the pin. The frame's only job is to place those
// coordinates in the tile that was requested.

/**
 * THE BOX TO READ FOR A PIN — the radius around it, not a tile.
 *
 * The blob's ADDRESS is a tile (so MapLibre can ask for it), but its CONTENTS
 * are the radius around the actual pin. That is what makes the promise true no
 * matter where in the tile the pin fell: the data is centred on the user, and
 * the tile is merely the envelope it travels in.
 */
export function radiusBox(lng: number, lat: number): CellBox {
	const dLat = GRID_RADIUS_KM / 110.574;
	const dLng =
		GRID_RADIUS_KM / (111.32 * Math.max(0.05, Math.cos((lat * Math.PI) / 180)));
	return { w: lng - dLng, e: lng + dLng, s: lat - dLat, n: lat + dLat };
}

/**
 * ONE cell. Always.
 *
 * ⛔ THIS RETURNS A SINGLE-ELEMENT LIST ON PURPOSE — it is not a stub, and it
 * must not grow. A pin needing a second blob to satisfy its radius is the exact
 * failure this design deletes (see the file header). The shape is a list only so
 * callers that iterate keep working.
 */
/**
 * EVERY CELL THE PIN'S RADIUS TOUCHES.
 *
 * ── WHY A LIST, AND WHY THIS IS THE ONLY SHAPE THAT WORKS ─────────────────
 *
 * The frame must be a real slippy tile: MapLibre reads a tile's 0..EXTENT grid
 * as spanning the box it requested, with no override. So a blob is drawn into
 * its tile's box, and anything past that edge is CLIPPED.
 *
 * MEASURED at the user's Timbuktu pin with one fixed tile: 30 km reach west and
 * north, but 12 km east and 10 km south — exactly its distance to those edges.
 * "It didn't download the whole roadblob."
 *
 * ⛔ A BIGGER TILE DOES NOT FIX IT. Only 21% of positions in a z8 tile are more
 * than 30 km from every edge (53% at z7, 75% at z6) — and tile grids NEST, so a
 * pin near a z8 corner is usually near the z7 and z6 corners too. Promoting to a
 * shallower tile was tried and FAILED for exactly that reason; the brute-force
 * containment test caught it immediately. Shallower also multiplies collisions:
 * ~3 pin areas share a z8 tile, ~55 share a z6, ~222 share a z5.
 *
 * ── THE FIX ───────────────────────────────────────────────────────────────
 *
 * Stop trying to make ONE tile hold everything. Bake every tile the radius
 * overlaps: 1 for a centred pin (the common case), up to 4 for a corner pin.
 * Each is an ordinary blob at its own address, so nothing is clipped and nothing
 * collides — and neighbouring pins reuse the same tiles.
 */
export function cellsFor(lng: number, lat: number): Cell[] {
	const box = radiusBox(lng, lat);
	const n = 2 ** BLOB_TILE_Z;
	const X = (lo: number) =>
		Math.min(n - 1, Math.max(0, Math.floor(((lo + 180) / 360) * n)));
	const Y = (la: number) =>
		Math.min(n - 1, Math.max(0, Math.floor(mercY(la) * n)));

	const x0 = X(box.w);
	const x1 = X(box.e);
	const y0 = Y(box.n); // north = smaller y
	const y1 = Y(box.s);

	const home = cellOf(lng, lat);
	const out: Cell[] = [];
	const seen = new Set<string>();
	// The pin's OWN cell first — callers bake in order and it is the one the map
	// reads at the pin, so it must not queue behind its neighbours.
	const push = (c: Cell) => {
		const k = cellKey(c);
		if (seen.has(k)) return;
		seen.add(k);
		out.push(c);
	};
	push(home);
	for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
		for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
			push({ ix: x, iy: y, z: BLOB_TILE_Z });
		}
	}
	return out;
}

/** Does ONE tile at `z` hold the whole radius at this latitude? The invariant
 *  the whole design rests on — asserted by oneBlobIsEnough.test.ts. */
export function tileHoldsRadius(z: number, lat: number): boolean {
	const n = 2 ** z;
	const wDeg = 360 / n;
	const widthKm = km(0, lat, wDeg, lat);
	// The tile must span the full DIAMETER, or a centred pin would not fit.
	return widthKm >= GRID_RADIUS_KM * 2;
}
