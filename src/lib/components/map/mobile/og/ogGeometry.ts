/**
 * Pure geometry helpers for the Offline Gopher tile pipeline.
 *
 * Mercator tile-coord math (XYZ scheme) plus a "bbox around a point"
 * helper for the 60 km blob radius. No Mapbox imports — these are
 * fine to import from anywhere, including a Web Worker if we move
 * the prefetch off the main thread later.
 */

import type { OgBounds } from "./types";

export function bboxAroundPoint(
    lng: number,
    lat: number,
    radiusKm: number,
): OgBounds {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
    return {
        west: lng - lngDelta,
        south: lat - latDelta,
        east: lng + lngDelta,
        north: lat + latDelta,
    };
}

export function lonToTileX(lon: number, z: number): number {
    return Math.floor(((lon + 180) / 360) * (1 << z));
}

export function latToTileY(lat: number, z: number): number {
    const rad = (lat * Math.PI) / 180;
    return Math.floor(
        ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
            (1 << z),
    );
}

export function tileXToLon(x: number, z: number): number {
    return (x / (1 << z)) * 360 - 180;
}

export function tileYToLat(y: number, z: number): number {
    const n = Math.PI - (2 * Math.PI * y) / (1 << z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/** Tile range covering the bbox at the given zoom. xMin/xMax/yMin/yMax
 *  are inclusive — iterate `for (x = xMin; x <= xMax; x++)`. */
export function bboxToTileRange(
    bbox: OgBounds,
    z: number,
): { xMin: number; xMax: number; yMin: number; yMax: number } {
    return {
        xMin: lonToTileX(bbox.west, z),
        xMax: lonToTileX(bbox.east, z),
        // Note: north has smaller y than south (Mercator y grows downward).
        yMin: latToTileY(bbox.north, z),
        yMax: latToTileY(bbox.south, z),
    };
}

/** Bounds of the union of tiles (xMin..xMax, yMin..yMax) at zoom z.
 *  Useful for snapping the composite PNG to tile-aligned edges so it
 *  lands at the exact lat/lng of the imagery it represents. */
export function tileRangeBounds(
    z: number,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
): OgBounds {
    return {
        west: tileXToLon(xMin, z),
        north: tileYToLat(yMin, z),
        east: tileXToLon(xMax + 1, z),
        south: tileYToLat(yMax + 1, z),
    };
}

/** Random point within `radiusKm` of (lng, lat). Uniform on the disk
 *  (sqrt of the random radius keeps density even — without it points
 *  bunch toward the centre). Used for privacy-fuzzing the blob pin. */
export function jitterPoint(
    lng: number,
    lat: number,
    radiusKm: number,
): { lng: number; lat: number } {
    const r = Math.sqrt(Math.random()) * radiusKm;
    const theta = Math.random() * 2 * Math.PI;
    const dLat = (r * Math.cos(theta)) / 111;
    const dLng =
        (r * Math.sin(theta)) / (111 * Math.cos((lat * Math.PI) / 180));
    return { lng: lng + dLng, lat: lat + dLat };
}

/** Approximate distance in km between two lng/lat points using
 *  equirectangular projection. Accurate to ~0.1% within a few hundred
 *  km — fine for a 60 km blob and avoids haversine's two trig calls
 *  per check (we run this for every candidate tile). */
export function distanceKm(
    lng1: number,
    lat1: number,
    lng2: number,
    lat2: number,
): number {
    const dLat = (lat2 - lat1) * 111;
    const dLng =
        (lng2 - lng1) *
        111 *
        Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Is a tile (z, x, y) FULLY INSIDE a circle?
 *
 * "Fully inside" = all four corners of the tile bbox are within
 * `radiusKm` of the centre. Tiles partially inside the circle don't
 * qualify and are NOT downloaded.
 *
 * Why this rule, and why we keep the jagged result:
 *   The user explicitly chose the jagged tile-edge look over a smooth
 *   alpha-masked circle. The square tile grid is the actual shape of
 *   the data, and the user wants to SEE that — the imperfection is
 *   proof that we're showing real cached pixels, not painting a fake
 *   circular vignette over a square dataset. "Trust the gopher" only
 *   works when the visualisation cannot lie.
 *
 *   So we trade a smooth boundary for an honest one. The result is a
 *   jagged staircase along the edge — exactly what we want. Don't
 *   "improve" this by accepting partial tiles and clipping them.
 */
export function tileFullyInCircle(
    z: number,
    x: number,
    y: number,
    centerLng: number,
    centerLat: number,
    radiusKm: number,
): boolean {
    const west = tileXToLon(x, z);
    const east = tileXToLon(x + 1, z);
    const north = tileYToLat(y, z);
    const south = tileYToLat(y + 1, z);
    return (
        distanceKm(centerLng, centerLat, west, north) <= radiusKm &&
        distanceKm(centerLng, centerLat, east, north) <= radiusKm &&
        distanceKm(centerLng, centerLat, west, south) <= radiusKm &&
        distanceKm(centerLng, centerLat, east, south) <= radiusKm
    );
}

export function pointInBounds(
    lng: number,
    lat: number,
    bounds: OgBounds,
): boolean {
    return (
        lng >= bounds.west &&
        lng <= bounds.east &&
        lat >= bounds.south &&
        lat <= bounds.north
    );
}
