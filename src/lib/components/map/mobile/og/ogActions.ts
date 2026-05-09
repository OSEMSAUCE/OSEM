/**
 * "Feed the gopher" orchestration.
 *
 * Single function: get GPS → prefetch Esri → write tiles to IDB →
 * compose PNG → write blob row to IDB → mount composite on the map.
 *
 * The download runs in plain fetch() at the page level. It does NOT
 * touch the OG mapboxgl.Map's transformRequest — that's the air-gap
 * surface, and it stays sealed. The map only ever reads from IDB.
 */

import type mapboxgl from "mapbox-gl";
import type { OgBlob, OgBounds, LngLat } from "./types";
import { bboxAroundPoint } from "./ogGeometry";
import {
    prefetchEsriBlob,
    type PrefetchProgress,
} from "./ogPrefetch";
import { composeBlobComposite } from "./ogComposite";
import { mountBlobComposite, unmountBlobComposite } from "./ogBlobLayer";
import { clearAllBlob, getBlobTile, putBlob } from "./ogStorage";

export type FeedGopherOptions = {
    map: mapboxgl.Map | null;
    center: LngLat;
    radiusKm?: number;
    minZoom?: number;
    maxZoom?: number;
    compositeZoom?: number;
    signal: AbortSignal;
    onProgress?: (p: PrefetchProgress) => void;
    /** Per-tile callback to persist into IDB. Defaults to writing into
     *  og-blob-tiles via a transient store handle. Override for tests. */
    writeTile?: (z: number, x: number, y: number, blob: Blob) => Promise<void>;
};

export type FeedGopherResult = {
    blob: OgBlob;
    aborted: boolean;
    skipped: number;
};

/** Default tile writer — opens a single fresh transaction per tile.
 *  Crude (one tx per tile is slow at scale), but simple and correct.
 *  At ~1500 tiles for z8-13 the overhead is acceptable for v1. */
async function defaultWriteTile(
    z: number,
    x: number,
    y: number,
    blob: Blob,
): Promise<void> {
    const { putBlobTile } = await import("./ogStorage");
    await putBlobTile(z, x, y, blob);
}

export async function feedGopher(
    opts: FeedGopherOptions,
): Promise<FeedGopherResult> {
    const {
        map,
        center,
        radiusKm = 60,
        minZoom = 8,
        maxZoom = 13,
        compositeZoom = 12,
        signal,
        onProgress,
        writeTile = defaultWriteTile,
    } = opts;

    const bbox = bboxAroundPoint(center.lng, center.lat, radiusKm);

    // Phase 0: wipe any previous blob + tiles in a single tiny
    // transaction. Streaming new tiles into a clean store avoids the
    // "thousands-of-puts in one transaction" bomb that times IDB out.
    await clearAllBlob();

    // Phase 1: download every tile in the bbox at z=minZoom..maxZoom,
    // streaming each one straight into IDB (per-tile transaction).
    const { cached, aborted } = await prefetchEsriBlob({
        bbox,
        minZoom,
        maxZoom,
        signal,
        onProgress,
        onTile: writeTile,
    });

    if (aborted || cached.size === 0) {
        throw new Error("feedGopher: aborted or no tiles cached");
    }

    // Phase 2: compose the cached compositeZoom tiles into one PNG.
    // Reads back from IDB and renders to canvas.
    const composed = await composeBlobComposite({
        bbox,
        cachedTiles: cached,
        getTile: getBlobTile,
        zoom: compositeZoom,
    });

    // Phase 3: write the OgBlob metadata row in a single small
    // transaction. Tiles are already in IDB from phase 1 — no bulk
    // re-write here.
    const blob: OgBlob = {
        id: crypto.randomUUID(),
        center,
        radiusKm,
        bounds: composed.bounds,
        composedAt: new Date().toISOString(),
        tileCount: composed.tileCount,
        compositeBlob: composed.blob,
    };
    await putBlob(blob);

    // Phase 4: mount the composite on the live map (if we have one).
    if (map) {
        try {
            mountBlobComposite(map, composed.blob, composed.bounds);
        } catch (e) {
            console.warn("[og] mountBlobComposite failed:", e);
        }
    }

    return { blob, aborted: false, skipped: composed.skipped };
}

export function unmountCurrentBlob(map: mapboxgl.Map): void {
    unmountBlobComposite(map);
}
