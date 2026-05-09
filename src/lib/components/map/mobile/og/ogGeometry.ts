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
