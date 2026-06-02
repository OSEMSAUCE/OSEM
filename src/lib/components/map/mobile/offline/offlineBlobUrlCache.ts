/**
 * Module-level cache mapping `${z}/${x}/${y}` → blob: URL for the
 * currently-active blob's tiles.
 *
 * Why this exists: mapbox-gl 3.23.1 does NOT expose `addProtocol`
 * (the standard async-tile-source escape hatch is only in MapLibre or
 * mapbox-gl 3.5+). And `transformRequest` is synchronous — it can
 * rewrite a URL but cannot await an IDB read. So the only way to
 * serve IDB-stored tiles to a Mapbox raster source on this version
 * is to pre-create `blob:` URLs for every cached tile and have
 * transformRequest do a synchronous Map lookup.
 *
 * Memory cost: createObjectURL doesn't COPY the underlying Blob — it
 * just hands out a handle. The 30 KB tile blobs are already in IDB.
 * The browser keeps them retrievable lazily, so the resident cost is
 * "one URL handle per tile" (cheap) + whatever tiles the renderer
 * has actually loaded.
 *
 * Lifecycle: load before mounting the pyramid raster source, clear
 * when unmounting (or before re-loading for a new blob — old URLs get
 * revoked so the GC can free their backing blobs).
 */

import { STORE_BLOB_TILES } from "./offlineStorage";

const DB_NAME = "retreever-og";
const DB_VERSION = 1;

let cache: Map<string, string> | null = null;

function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/** Walks every tile in the og-blob-tiles store and creates a blob:
 *  URL for it. Returns the populated cache. Idempotent — re-calling
 *  while a cache exists clears the old one first (so the URLs from
 *  the previous blob get revoked). */
export async function loadBlobTileUrls(): Promise<Map<string, string>> {
    clearBlobTileUrls();
    const next = new Map<string, string>();
    const db = await open();
    try {
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_BLOB_TILES, "readonly");
            const cursor = tx.objectStore(STORE_BLOB_TILES).openCursor();
            cursor.onsuccess = () => {
                const c = cursor.result;
                if (!c) {
                    resolve();
                    return;
                }
                const blob = c.value as Blob;
                const url = URL.createObjectURL(blob);
                next.set(String(c.key), url);
                c.continue();
            };
            cursor.onerror = () => reject(cursor.error);
        });
    } finally {
        db.close();
    }
    cache = next;
    return cache;
}

/** Synchronous lookup for transformRequest. Returns null if no blob
 *  is cached for these coords. */
export function getBlobTileUrl(
    z: number,
    x: number,
    y: number,
): string | null {
    return cache?.get(`${z}/${x}/${y}`) ?? null;
}

export function clearBlobTileUrls(): void {
    if (!cache) return;
    for (const url of cache.values()) URL.revokeObjectURL(url);
    cache = null;
}
