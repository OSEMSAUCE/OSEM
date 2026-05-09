/**
 * Esri World Imagery prefetch for the Offline Gopher blob.
 *
 *   IMPORTANT: this fetcher does NOT run inside the OG mapboxgl.Map's
 *   transformRequest. It runs at the page level via plain fetch(),
 *   downloads the tiles, and writes the blobs into IDB. The OG map
 *   later reads from IDB only — it never makes network calls itself.
 *   The air-gap is on the MAP INSTANCE, not on the page.
 *
 * Esri tile URL convention: /tile/{z}/{y}/{x}  (note y/x order).
 * Our IDB key convention:    `${z}/${x}/${y}`  (Mapbox order).
 */

import type { OgBounds } from "./types";
import { bboxToTileRange } from "./ogGeometry";

const ESRI_BASE =
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";

export type PrefetchProgress = {
    fetched: number;
    skipped: number;
    failed: number;
    total: number;
    fraction: number;
};

export type PrefetchOptions = {
    bbox: OgBounds;
    minZoom: number;
    maxZoom: number;
    concurrency?: number;
    signal: AbortSignal;
    onProgress?: (p: PrefetchProgress) => void;
    /** Called per successful tile so the caller can write to IDB.
     *  Returning a rejected promise counts the tile as failed. */
    onTile: (
        z: number,
        x: number,
        y: number,
        blob: Blob,
    ) => Promise<void> | void;
};

export type PrefetchResult = {
    cached: Set<string>; // keys like "12/645/1409"
    progress: PrefetchProgress;
    aborted: boolean;
};

export async function prefetchEsriBlob(
    opts: PrefetchOptions,
): Promise<PrefetchResult> {
    const {
        bbox,
        minZoom,
        maxZoom,
        concurrency = 6,
        signal,
        onProgress,
        onTile,
    } = opts;

    // Build full tile list up front so progress can be honest about
    // total. At z=8..13 over a 60 km bbox this is ~1500 tiles; at
    // z=14 add another ~3500. Up to z=14 a 60 km bbox is roughly
    // 4500 tiles ≈ 30 MB.
    const queue: Array<[number, number, number]> = [];
    for (let z = minZoom; z <= maxZoom; z++) {
        const { xMin, xMax, yMin, yMax } = bboxToTileRange(bbox, z);
        for (let x = xMin; x <= xMax; x++) {
            for (let y = yMin; y <= yMax; y++) {
                queue.push([z, x, y]);
            }
        }
    }

    const cached = new Set<string>();
    const progress: PrefetchProgress = {
        fetched: 0,
        skipped: 0,
        failed: 0,
        total: queue.length,
        fraction: 0,
    };
    let cursor = 0;

    const emit = () => {
        progress.fraction =
            progress.total === 0
                ? 1
                : (progress.fetched + progress.skipped + progress.failed) /
                  progress.total;
        onProgress?.(progress);
    };

    async function worker(): Promise<void> {
        while (!signal.aborted) {
            const i = cursor++;
            if (i >= queue.length) return;
            const [z, x, y] = queue[i];
            try {
                const res = await fetch(`${ESRI_BASE}/${z}/${y}/${x}`, {
                    signal,
                    cache: "default",
                });
                if (!res.ok) {
                    progress.failed++;
                    emit();
                    continue;
                }
                const blob = await res.blob();
                await onTile(z, x, y, blob);
                cached.add(`${z}/${x}/${y}`);
                progress.fetched++;
                emit();
            } catch (e) {
                if (signal.aborted) return;
                progress.failed++;
                emit();
            }
        }
    }

    await Promise.all(
        Array.from({ length: concurrency }, () => worker()),
    );

    return { cached, progress, aborted: signal.aborted };
}
