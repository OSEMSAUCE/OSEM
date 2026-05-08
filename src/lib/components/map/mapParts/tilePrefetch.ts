/**
 * Tile prefetch — pre-load Mapbox satellite tiles for a region while
 * online so they're available when the user goes offline.
 *
 * Approach: fire `fetch()` for every tile URL in the requested bbox at
 * the requested zoom range. The browser's HTTP cache stores them; when
 * Mapbox later renders the same area, its internal tile loader gets
 * the cached response. This works in iOS WKWebView (Capacitor) and
 * desktop browsers without needing a service worker.
 *
 * Caveats (acknowledge these honestly):
 *   - Tiles are subject to Mapbox's `Cache-Control: max-age=43200`
 *     (12 hours). Beyond that, the browser may revalidate, which
 *     fails offline. Good enough for "heading out today" workflows;
 *     not a long-term offline solution.
 *   - The browser HTTP cache can be evicted under storage pressure.
 *     We don't have direct control over eviction.
 *   - For multi-day persistence, build the v2: download tiles into
 *     IndexedDB as blobs and serve via `transformRequest` rewriting
 *     to blob URLs.
 *
 * Lat-aware tile bounds: at high latitudes, lon spans more tiles per
 * km. We compute tile bounds via the standard Mercator projection.
 */
import mapboxgl from "mapbox-gl";

export type PrefetchProgress = {
    done: number;
    total: number;
    failed: number;
    /** 0..1 */
    fraction: number;
};

export type PrefetchOptions = {
    /** Optional bbox as [west, south, east, north]. Defaults to the
     *  map's current viewport. */
    bounds?: [number, number, number, number];
    /** Lowest zoom to prefetch. Default 10 (regional context). */
    minZoom?: number;
    /** Highest zoom to prefetch. Default 14 (block-level detail). */
    maxZoom?: number;
    /** Cap on tile count to prevent runaway downloads. Default 5000. */
    maxTiles?: number;
    /** Concurrent fetches. Default 8. */
    concurrency?: number;
    /** Called after each tile finishes. */
    onProgress?: (p: PrefetchProgress) => void;
    /** AbortSignal to halt mid-flight. */
    signal?: AbortSignal;
};

function lonToTileX(lon: number, z: number): number {
    return Math.floor(((lon + 180) / 360) * (1 << z));
}

function latToTileY(lat: number, z: number): number {
    const rad = (lat * Math.PI) / 180;
    return Math.floor(
        ((1 -
            Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) /
            2) *
            (1 << z),
    );
}

/**
 * Enumerate tile coordinates inside a bbox at zoom z. Clamped to world
 * tile range so wrap-around bboxes don't crash.
 */
function tilesInBounds(
    west: number,
    south: number,
    east: number,
    north: number,
    z: number,
): Array<[number, number, number]> {
    const n = 1 << z;
    const x0 = Math.max(0, Math.min(n - 1, lonToTileX(west, z)));
    const x1 = Math.max(0, Math.min(n - 1, lonToTileX(east, z)));
    // y axis is inverted in Mercator (north has lower y)
    const y0 = Math.max(0, Math.min(n - 1, latToTileY(north, z)));
    const y1 = Math.max(0, Math.min(n - 1, latToTileY(south, z)));
    const out: Array<[number, number, number]> = [];
    for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
            out.push([z, x, y]);
        }
    }
    return out;
}

/**
 * Build the satellite tile URL for one (z, x, y). Mirrors the URL
 * shape Mapbox GL JS itself fetches; the browser's HTTP cache keys
 * on URL, so they need to match exactly for reuse.
 */
function satelliteTileUrl(
    z: number,
    x: number,
    y: number,
    accessToken: string,
): string {
    return `https://api.mapbox.com/v4/mapbox.satellite/${z}/${x}/${y}.jpg90?access_token=${encodeURIComponent(accessToken)}`;
}

/**
 * Pull the access token Mapbox is using. Set at boot via
 * `mapboxgl.accessToken = '...'` in mapInit.ts.
 */
function getAccessToken(): string {
    return mapboxgl.accessToken ?? "";
}

/**
 * Prefetch every tile in the given bbox at every zoom in [minZoom,
 * maxZoom]. Returns when all fetches resolve (or the limit is hit).
 */
export async function prefetchTiles(
    map: mapboxgl.Map,
    opts: PrefetchOptions = {},
): Promise<PrefetchProgress> {
    const minZoom = opts.minZoom ?? 10;
    const maxZoom = opts.maxZoom ?? 14;
    const maxTiles = opts.maxTiles ?? 5000;
    const concurrency = opts.concurrency ?? 8;

    // Bounds: caller-provided rectangle, OR current map viewport
    // as fallback. The TILES feature uses a GPS-centred bbox via
    // opts.bounds; legacy callers can omit it and get viewport.
    let west: number;
    let south: number;
    let east: number;
    let north: number;
    if (
        opts.bounds &&
        Array.isArray(opts.bounds) &&
        opts.bounds.length === 4
    ) {
        // [west, south, east, north]
        [west, south, east, north] = opts.bounds as [
            number,
            number,
            number,
            number,
        ];
    } else {
        const bounds = map.getBounds();
        if (!bounds) {
            return { done: 0, total: 0, failed: 0, fraction: 1 };
        }
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        west = sw.lng;
        south = sw.lat;
        east = ne.lng;
        north = ne.lat;
    }

    // Build the full tile list, capped at maxTiles. We fetch lower
    // zooms first (smaller, faster, useful as fallback if we hit the
    // cap before finishing the higher zooms).
    const all: Array<[number, number, number]> = [];
    for (let z = minZoom; z <= maxZoom; z++) {
        for (const t of tilesInBounds(west, south, east, north, z)) {
            all.push(t);
            if (all.length >= maxTiles) break;
        }
        if (all.length >= maxTiles) break;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
        console.warn(
            "[tilePrefetch] no Mapbox access token available — aborting",
        );
        return { done: 0, total: 0, failed: 0, fraction: 1 };
    }

    let done = 0;
    let failed = 0;
    const total = all.length;

    // Visible console logging so the user can confirm it's running.
    // Logs once at start, every 50 tiles in flight, and once at end.
    console.log(
        `[tilePrefetch] starting — ${total} tiles, bbox [${west.toFixed(3)}, ${south.toFixed(3)}, ${east.toFixed(3)}, ${north.toFixed(3)}], z${minZoom}-${maxZoom}, concurrency ${concurrency}`,
    );

    const fetchOne = async (t: [number, number, number]) => {
        if (opts.signal?.aborted) return;
        const [z, x, y] = t;
        const url = satelliteTileUrl(z, x, y, accessToken);
        try {
            const res = await fetch(url, {
                signal: opts.signal,
                // No `cache: 'force-cache'` — we WANT the network round
                // trip on first fetch. After that, browser respects
                // Mapbox's Cache-Control header for reuse.
            });
            // Drain the body so the cache has the full response stored,
            // but we don't need to keep the data ourselves.
            await res.arrayBuffer();
        } catch (e) {
            if ((e as Error).name === "AbortError") throw e;
            failed++;
        } finally {
            done++;
            // Log every 50 tiles so the console shows steady progress.
            if (done % 50 === 0 || done === total) {
                console.log(
                    `[tilePrefetch] ${done}/${total} (${failed} failed)`,
                );
            }
            opts.onProgress?.({
                done,
                total,
                failed,
                fraction: total === 0 ? 1 : done / total,
            });
        }
    };

    // Simple worker pool: keep `concurrency` fetches in flight at once.
    const queue = [...all];
    const workers = Array.from({ length: concurrency }, async () => {
        while (queue.length > 0) {
            if (opts.signal?.aborted) return;
            const t = queue.shift();
            if (!t) return;
            try {
                await fetchOne(t);
            } catch (e) {
                if ((e as Error).name === "AbortError") return;
            }
        }
    });
    await Promise.all(workers);

    console.log(
        `[tilePrefetch] DONE — ${done}/${total} tiles cached (${failed} failed). The browser HTTP cache now holds these; Mapbox will serve them from cache on next render.`,
    );

    return {
        done,
        total,
        failed,
        fraction: 1,
    };
}
