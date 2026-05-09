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
import { bboxAroundPoint, jitterPoint } from "./ogGeometry";
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

let _lastTotalBytes = 0;

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
        maxZoom = 15,
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

    // Phase 1: download every tile FULLY INSIDE the circle at
    // z=minZoom..maxZoom, streaming each one straight into IDB
    // (per-tile transaction).
    //
    // The circle filter is the user-chosen design: jagged tile-edge
    // boundary instead of a smooth alpha mask. The user must be able
    // to see the actual data extent — the imperfection is proof we're
    // showing real cached pixels, not faking a circular vignette over
    // a square dataset. See ogGeometry.tileFullyInCircle for the
    // full reasoning. Do not "smooth" this.
    _lastTotalBytes = 0;
    const { cached, aborted, progress: finalProgress } =
        await prefetchEsriBlob({
            bbox,
            minZoom,
            maxZoom,
            signal,
            onProgress,
            onTile: writeTile,
            circle: {
                centerLng: center.lng,
                centerLat: center.lat,
                radiusKm,
            },
        });
    _lastTotalBytes = finalProgress.bytesTotal;

    if (aborted || cached.size === 0) {
        throw new Error("feedGopher: aborted or no tiles cached");
    }

    // Phase 2: compose the cached compositeZoom tiles into one PNG.
    // Honest rectangular mosaic — each cached tile painted at its
    // actual lat/lng. Missing tiles stay transparent.
    const composed = await composeBlobComposite({
        bbox,
        cachedTiles: cached,
        getTile: getBlobTile,
        zoom: compositeZoom,
    });

    // Phase 3: write the OgBlob metadata row in a single small
    // transaction. Tiles are already in IDB from phase 1 — no bulk
    // re-write here.
    //
    // displayCenter is privacy-jittered: pin renders within 2 km of
    // the actual GPS, so onlookers can't infer the user's exact
    // location from the pin position. The TILES of the composite are
    // still centered on the real GPS (you have to fetch tiles where
    // the user actually is), but no UI ever shows that point.
    const displayCenter = jitterPoint(center.lng, center.lat, 2);
    const blob: OgBlob = {
        id: crypto.randomUUID(),
        center,
        displayCenter,
        radiusKm,
        bounds: composed.bounds,
        composedAt: new Date().toISOString(),
        tileCount: composed.tileCount,
        compositeBlob: composed.blob,
        // Total bytes of every tile in IDB (not just the composite).
        // This is what the user sees as "how much storage am I using".
        totalBytes: _lastTotalBytes,
    };
    await putBlob(blob);

    // Phase 4: mount BOTH layers on the live map — the composite as
    // the always-visible floor, the tile pyramid as the sharp ceiling
    // for native-zoom detail.
    //
    // CRITICAL: pyramid minZoom must equal compositeZoom (not the
    // prefetch's minZoom). At low pyramid zooms each tile is ~155 km
    // wide and Mapbox renders the full tile regardless of source
    // `bounds` — so coverage appears to GROW past the user's bbox.
    // The user reads that as the gopher lying. Keep the pyramid at
    // tile sizes that match the bbox tightly.
    if (map) {
        try {
            mountBlobComposite(map, composed.blob, composed.bounds, {
                minZoom: compositeZoom,
                maxZoom,
            });
        } catch (e) {
            console.warn("[og] mountBlobComposite failed:", e);
        }
    }

    return { blob, aborted: false, skipped: composed.skipped };
}

export function unmountCurrentBlob(map: mapboxgl.Map): void {
    unmountBlobComposite(map);
}
