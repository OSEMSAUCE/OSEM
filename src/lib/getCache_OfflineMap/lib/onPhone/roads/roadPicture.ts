/**
 * roadPicture — THE PHONE SIDE OF "ROADS AS A PICTURE".
 *
 * ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────
 *
 * The user, looking at his own two blobs on one pin:
 *
 *   "They both have the same center... You just put the center in the center.
 *    Same as the pin, same as satellite blob, same as the road blob."
 *
 * His satellite blob measured 3-5 m off the pin. His road blob measured
 * 45,200 m off, spanning 132.6 km. Same pin, same page, same moment. The
 * difference was never arithmetic:
 *
 *   • SATELLITE is an IMAGE, placed by explicit GPS bounds → the pin IS the
 *     centre, by construction. Nothing rounds it.
 *   • ROADS were TILES, addressed `z/x/y` on a world grid drawn before the pin
 *     existed. A z8 square is 104.6 km wide; the pin is a passenger inside it.
 *
 * ⛔ A GRID ADDRESS CANNOT CENTRE ON A POINT. Not with a finer grid, not with
 * Plus Codes, not with S2 or geohash — `gridVsBounds.test.ts` measures that and
 * proves the error shrinks but never reaches zero. Only BOUNDS reach zero.
 *
 * So roads now travel the way satellite already did: a PNG plus the box it
 * covers. The Worker (`workers/offline-tiles/src/roadPng.ts` + `roadLines.ts`)
 * renders it; this module receives it.
 *
 * ── THE BUG THIS CLOSES, MEASURED LIVE ────────────────────────────────────
 *
 * The Worker was switched to `v24-roads-as-image` and shipped correctly:
 *
 *   {"k": "png/-119.01750,48.13640", "n": 32338,
 *    "box": {"w":-119.4213,"e":-118.6137,"s":47.8651,"n":48.4077}}
 *
 * ...and the phone had NO CODE FOR A `png/` KEY. The picture arrived, was
 * stored under a key nothing looked up, and never rendered. The user's card
 * showed no roads row at all — not a wrong box, an unhandled format. Half a
 * pivot is worse than none: the old path was deleted and the new one was never
 * connected.
 *
 * ⚠️ NO I/O AND NO MAP OBJECT IN HERE. This module answers "is this a picture,
 * and where does it go?" with pure functions, so it stays testable in isolation.
 * The map wiring lives at the call site; the geometry lives here.
 */
import type { Box } from "./pinBox";

/** The key prefix the Worker uses for a road picture. MUST match packBuilder. */
export const PNG_KEY_PREFIX = "png/";

/** Is this pack key a road picture rather than a vector tile? */
export function isRoadPictureKey(key: string): boolean {
	return key.startsWith(PNG_KEY_PREFIX);
}

/**
 * The pin a picture key names. `png/-119.01750,48.13640` → the pin itself.
 *
 * ⛔ THIS IS WHY THE KEY IS A GPS POINT AND NOT A GRID ADDRESS. The key carries
 * the pin losslessly, so the picture can always be traced back to the thing it
 * is about. A `z/x/y` key throws that away — converting a point to a cell is
 * lossy ON PURPOSE, like rounding 47.9 to 50: you can round, you cannot unround.
 */
export function pinOfRoadPictureKey(
	key: string,
): { lng: number; lat: number } | null {
	if (!isRoadPictureKey(key)) return null;
	const [lng, lat] = key.slice(PNG_KEY_PREFIX.length).split(",").map(Number);
	if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
	return { lng, lat };
}

/** The key for a pin's picture. Must match the Worker's spelling EXACTLY —
 *  5 decimal places, no spaces — or the phone looks up a key that isn't there. */
export function roadPictureKey(lng: number, lat: number): string {
	return `${PNG_KEY_PREFIX}${lng.toFixed(5)},${lat.toFixed(5)}`;
}

/**
 * MapLibre's `coordinates` for an image source: four corners, clockwise from
 * top-left. This is the ONE conversion between "a box" and "how the map places
 * a picture", and it is the whole reason the satellite blob lands on the pin.
 *
 * ⛔ ORDER IS NOT ARBITRARY — [NW, NE, SE, SW]. Get it wrong and the image is
 * mirrored or rotated rather than erroring, which is a silent failure that
 * reads as "the roads look weird" instead of "the corners are swapped".
 */
export function imageCoordinates(
	box: Box,
): [[number, number], [number, number], [number, number], [number, number]] {
	return [
		[box.w, box.n],
		[box.e, box.n],
		[box.e, box.s],
		[box.w, box.s],
	];
}

/** The box a pack manifest carries, validated. Returns null rather than
 *  letting a malformed box become NaN coordinates — a NaN camera red-screens
 *  the map (see nan-camera-getbounds-crash). Fail loud, never halfway. */
export function boxFromManifest(raw: unknown): Box | null {
	if (!raw || typeof raw !== "object") return null;
	const b = raw as Record<string, unknown>;
	const { w, s, e, n } = b;
	if (
		typeof w !== "number" ||
		typeof s !== "number" ||
		typeof e !== "number" ||
		typeof n !== "number"
	)
		return null;
	if (![w, s, e, n].every(Number.isFinite)) return null;
	// A box with inverted or zero extent places an image as a point or mirrored.
	if (!(e > w) || !(n > s)) return null;
	return { w, s, e, n };
}

/** What the map needs to hang one picture: the pixels' key, and where it goes. */
export interface RoadPicture {
	key: string;
	box: Box;
}

/**
 * Read a pack manifest and return the road picture it carries, if any.
 *
 * Returns null for a vector-tile pack — this is how the phone stays compatible
 * with both formats during the switchover instead of throwing on the old one.
 */
export function roadPictureFromManifest(manifest: {
	tiles: Array<{ k: string }>;
	box?: unknown;
}): RoadPicture | null {
	const entry = manifest.tiles.find((t) => isRoadPictureKey(t.k));
	if (!entry) return null;
	const box = boxFromManifest(manifest.box);
	// ⛔ A PICTURE WITHOUT ITS BOX IS USELESS AND MUST NOT BE GUESSED AT. The
	// previous generation of this bug guessed the tile's box and drew the roads
	// 89 km from the pin (measured at Timbuktu). No box → no picture.
	if (!box) return null;
	return { key: entry.k, box };
}
