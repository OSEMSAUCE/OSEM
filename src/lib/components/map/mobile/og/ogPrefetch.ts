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
import { bboxToTileRange, tileFullyInCircle } from "./ogGeometry";

const ESRI_BASE =
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";

export type PrefetchProgress = {
    fetched: number;
    skipped: number;
    failed: number;
    total: number;
    fraction: number;
    /** Per-zoom counts of successfully fetched tiles, e.g. {8:1, 9:2, ...}.
     *  Updates live as tiles arrive — useful both for live UI and the
     *  end-of-prefetch console summary. */
    byZoom: Record<number, number>;
    /** Per-zoom totals (filled in once at queue-build time). */
    byZoomTotal: Record<number, number>;
    /** Per-zoom byte totals of fetched tiles. Sum of blob.size by zoom. */
    bytesByZoom: Record<number, number>;
    /** Total bytes fetched across all zooms. */
    bytesTotal: number;
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
    /**
     * Optional jagged-circle filter. When set, the queue is restricted
     * to tiles whose four corners ALL fall within `radiusKm` of
     * `(centerLng, centerLat)`. Tiles that straddle the circle edge
     * are NOT downloaded.
     *
     * Why a hard filter (not a clip mask): the user explicitly wants
     * the resulting imagery to be tile-edge-jagged so they can see
     * the actual data extent. A smooth circular mask would hide real
     * pixels and break trust. See ogGeometry.tileFullyInCircle for the
     * full reasoning.
     *
     * Side-effect: zooms whose tile size exceeds the circle's diameter
     * end up empty (e.g. z=8 tiles are ~155 km wide; no z=8 tile fits
     * inside a 60 km circle). Those zooms simply aren't downloaded —
     * they were never useful for a 60 km blob anyway, since the OG
     * world floor (CartoDB z0..7) already covers everything below.
     */
    circle?: {
        centerLng: number;
        centerLat: number;
        radiusKm: number;
    };
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
        circle,
    } = opts;

    // Build full tile list up front so progress can be honest about
    // total. At z=8..13 over a 60 km bbox this is ~300 tiles bbox-
    // bounded; with the circle filter ON it's smaller and varies by
    // zoom (low zooms whose tile size exceeds the diameter contribute
    // zero tiles).
    const queue: Array<[number, number, number]> = [];
    const byZoomTotal: Record<number, number> = {};
    for (let z = minZoom; z <= maxZoom; z++) {
        const { xMin, xMax, yMin, yMax } = bboxToTileRange(bbox, z);
        let count = 0;
        for (let x = xMin; x <= xMax; x++) {
            for (let y = yMin; y <= yMax; y++) {
                if (
                    circle &&
                    !tileFullyInCircle(
                        z,
                        x,
                        y,
                        circle.centerLng,
                        circle.centerLat,
                        circle.radiusKm,
                    )
                ) {
                    continue;
                }
                queue.push([z, x, y]);
                count++;
            }
        }
        byZoomTotal[z] = count;
    }
    console.log(
        `[og] prefetch plan: ${queue.length} tiles total\n` +
            Object.entries(byZoomTotal)
                .map(([z, n]) => `  z=${z}: ${n}`)
                .join("\n"),
    );

    const cached = new Set<string>();
    const byZoom: Record<number, number> = {};
    const bytesByZoom: Record<number, number> = {};
    for (let z = minZoom; z <= maxZoom; z++) {
        byZoom[z] = 0;
        bytesByZoom[z] = 0;
    }
    const progress: PrefetchProgress = {
        fetched: 0,
        skipped: 0,
        failed: 0,
        total: queue.length,
        fraction: 0,
        byZoom,
        byZoomTotal,
        bytesByZoom,
        bytesTotal: 0,
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
                progress.byZoom[z] = (progress.byZoom[z] ?? 0) + 1;
                progress.bytesByZoom[z] =
                    (progress.bytesByZoom[z] ?? 0) + blob.size;
                progress.bytesTotal += blob.size;
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

    const fmtMB = (b: number): string =>
        b < 1024 * 1024
            ? `${Math.round(b / 1024)} KB`
            : `${(b / (1024 * 1024)).toFixed(1)} MB`;
    console.log(
        `[og] prefetch done: ${progress.fetched} fetched, ` +
            `${progress.failed} failed, ${fmtMB(progress.bytesTotal)} total, ` +
            `aborted=${signal.aborted}\n` +
            Object.keys(byZoomTotal)
                .sort((a, b) => Number(a) - Number(b))
                .map(
                    (z) => {
                        const zn = Number(z);
                        return `  z=${z}: ${progress.byZoom[zn] ?? 0}/${byZoomTotal[zn]} (${fmtMB(progress.bytesByZoom[zn] ?? 0)})`;
                    },
                )
                .join("\n"),
    );

    return { cached, progress, aborted: signal.aborted };
}
