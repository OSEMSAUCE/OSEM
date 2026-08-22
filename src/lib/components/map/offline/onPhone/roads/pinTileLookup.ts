/**
 * pinTileLookup — WHICH PIN'S ROADS ANSWER THIS TILE ADDRESS?
 *
 * ── THE BUG THIS CLOSES, MEASURED ─────────────────────────────────────────
 *
 * Roads used to be stored under a bare grid address (`8/49/93`). A z8 square is
 * ~104 km wide, so two pins routinely share one — and the second pin was served
 * the first pin's roads. From the user's own blob inspector, minutes apart:
 *
 *     Moran WY        pin -110.7261,44.0618   roads box n=44.3334   →   408 m off
 *     Yellowstone WY  pin -110.7470,44.6629   roads box n=44.3334   →  50.4 km off
 *                                                        ^^^^^^^ IDENTICAL
 *
 * The second pin sat 36.6 km NORTH of the top edge of its own roads. It was not
 * inside its own data at all.
 *
 * ⚠️ THE SATELLITE NEVER HAD THIS BUG, and the difference is one line:
 *     satImageKey  = `${lng},${lat}`     ← the pin. Unique. Never shared.
 *     cellTileKey  = `${z}/${ix}/${iy}`  ← a square. Shared by neighbours.
 * Same map, same pins, same moment: 5 m versus 50 km. The user, who was right:
 * "I make the pin first, so we have the GPS point. You just get the satellite
 * image and then the roads blob and you put them both in the same spot."
 *
 * ── SO WHY IS A LOOKUP NEEDED AT ALL? ─────────────────────────────────────
 *
 * Because MapLibre asks for `z/x/y` and nothing else — it cannot name a pin.
 * Roads are stored per-pin (`pin/<lng>,<lat>/<z>/<x>/<y>`), so one address can
 * have several owners, and this module picks one: THE NEAREST PIN.
 *
 * That is not a tie-break of convenience — it is the correct answer. The tile
 * the user is looking at belongs to the pin they are nearest to; serving any
 * other pin's copy is precisely the bug above.
 *
 * ⚠️ NO I/O DECISIONS IN HERE BEYOND THE KEY SET. Pure functions over the keys,
 * so the choice is testable without a database.
 */
import { isPinTileKey } from "$osem/components/map/offline/contract/grid";

/** A stored roads key, split into the pin that owns it and the tile it draws. */
export interface PinTile {
	key: string;
	lng: number;
	lat: number;
	address: string;
}

/**
 * Parse `pin/<lng>,<lat>/<z>/<x>/<y>`. Returns null for anything else — a
 * legacy bare `z/x/y` key included, which is how old blobs are ignored rather
 * than mistaken for a pin's.
 */
export function parsePinTileKey(key: string): PinTile | null {
	if (!isPinTileKey(key)) return null;
	// pin / "<lng>,<lat>" / z / x / y
	const parts = key.split("/");
	if (parts.length !== 5) return null;
	const [lngStr, latStr] = parts[1].split(",");
	const lng = Number(lngStr);
	const lat = Number(latStr);
	if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
	const address = `${parts[2]}/${parts[3]}/${parts[4]}`;
	return { key, lng, lat, address };
}

/** The centre of a slippy tile, in degrees. Used to measure "nearest pin". */
export function tileCentre(
	z: number,
	x: number,
	y: number,
): { lng: number; lat: number } {
	const n = 2 ** z;
	const lng = ((x + 0.5) / n) * 360 - 180;
	const t = Math.PI - (2 * Math.PI * (y + 0.5)) / n;
	const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(t) - Math.exp(-t)));
	return { lng, lat };
}

/** Squared-degree distance — ordering only, so no need for haversine's cost. */
function d2(aLng: number, aLat: number, bLng: number, bLat: number): number {
	// Longitude degrees shrink with latitude; without this a far-east pin can
	// beat a nearer-north one at high latitude.
	const k = Math.cos((aLat * Math.PI) / 180);
	const dx = (aLng - bLng) * k;
	const dy = aLat - bLat;
	return dx * dx + dy * dy;
}

/**
 * EVERY key holding roads for this address — one per pin that owns it.
 *
 * ⛔ THIS RETURNS ALL OWNERS, AND THAT IS THE WHOLE POINT.
 *
 * The first version returned only the NEAREST pin's key. That fixed the
 * collision (a pin being served someone else's roads) by picking a winner —
 * and picking a winner means every other pin's copy of that tile is never
 * drawn. MEASURED on screen, the user's Greybull pin: its own box was correct
 * to 123 m in every direction, and half its roads were still missing, because
 * the shared tiles resolved to the neighbouring pin instead.
 *
 * The user described it exactly before I found it: "half of it's missing
 * because it doesn't want to overlap the other one... they don't butt up
 * against each other so it ends up stuck in the middle."
 *
 * ⚠️ TWO PINS SHARING A TILE ADDRESS IS NORMAL, NOT A CONFLICT. Both copies
 * are real roads at real coordinates in the same tile's coordinate space, so
 * the answer is to draw BOTH — never to choose. Choosing is what made the
 * collision fix into a new kind of hole.
 */
export function keysForAddress(
	stored: Iterable<string>,
	z: number,
	x: number,
	y: number,
): string[] {
	const address = `${z}/${x}/${y}`;
	const centre = tileCentre(z, x, y);
	const hits: Array<{ key: string; d: number }> = [];
	for (const key of stored) {
		const pt = parsePinTileKey(key);
		if (!pt || pt.address !== address) continue;
		hits.push({ key, d: d2(centre.lng, centre.lat, pt.lng, pt.lat) });
	}
	// Nearest FIRST — not to exclude anyone, only so the pin the user is looking
	// at contributes its layers before the neighbours' in the merged tile.
	hits.sort((a, b) => a.d - b.d);
	return hits.map((h) => h.key);
}

/**
 * The single nearest owner. Kept for callers that genuinely want one blob.
 *
 * ⚠️ DO NOT USE THIS FOR RENDERING — see `keysForAddress`. Rendering one owner
 * of a shared address is precisely the half-a-map bug.
 */
export function keyForAddress(
	stored: Iterable<string>,
	z: number,
	x: number,
	y: number,
): string | null {
	return keysForAddress(stored, z, x, y)[0] ?? null;
}
