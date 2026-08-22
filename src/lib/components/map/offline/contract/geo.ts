/**
 * Tile geometry. Pure maths — no I/O, no MapLibre, no storage.
 *
 * ⛔ THE DISC FUNCTIONS ARE GONE, not moved. `tilesAtZoom`, `blobTiles`,
 * `discInTile` and the whole of `clip.ts` existed to answer "which tiles does a
 * circle touch, and where is that circle inside each tile" — questions the
 * square grid does not ask. The unit is a snapped cell now (grid.ts): the cell
 * IS the boundary, neighbours share exact edges, and nothing is cut to a radius.
 *
 * What remains is the slippy-tile arithmetic and `km`, which the grid uses to
 * decide when a neighbouring cell is needed.
 */

export interface TileId {
	z: number;
	x: number;
	y: number;
}

/** Tile key as stored and as it appears in a `rtv5://` URL. */
export function tileKey(t: TileId): string {
	return `${t.z}/${t.x}/${t.y}`;
}

export function lngToTileX(lng: number, z: number): number {
	return Math.floor(((lng + 180) / 360) * 2 ** z);
}

export function latToTileY(lat: number, z: number): number {
	const r = (lat * Math.PI) / 180;
	return Math.floor(
		((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z,
	);
}

export function tileToLng(x: number, z: number): number {
	return (x / 2 ** z) * 360 - 180;
}

export function tileToLat(y: number, z: number): number {
	const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
	return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/** Great-circle-ish distance in km. Good to well under a metre at this scale. */
export function km(
	lng1: number,
	lat1: number,
	lng2: number,
	lat2: number,
): number {
	const dLat = (lat2 - lat1) * 111.32;
	const dLng =
		(lng2 - lng1) * 111.32 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
	return Math.hypot(dLat, dLng);
}

