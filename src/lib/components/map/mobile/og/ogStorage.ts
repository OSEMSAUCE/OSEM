/**
 * IndexedDB persistence for Offline Gopher.
 *
 *   - og-blob          single row, key "current". The active blob
 *                      (composite PNG + metadata).
 *   - og-blob-tiles    keyed `${z}/${x}/${y}`. Per-tile PNG blobs for
 *                      the active blob, used by the tile-pyramid layer
 *                      so deep zoom shows real detail above the
 *                      composite.
 *   - og-country-tiles keyed `${iso}/${z}/${x}/${y}` plus a meta row
 *                      `${iso}/_meta` ({iso, bounds, downloadedAt,
 *                      completionPct}). Country-level dark vector
 *                      coverage downloaded once per device.
 *
 * Replacing the blob = single transaction that deletes the row +
 * every tile entry then writes the new pair. Nothing accumulates.
 */

import type { OgBlob, OgCountryMeta } from "./types";

const DB_NAME = "retreever-og";
const DB_VERSION = 1;
export const STORE_BLOB = "og-blob";
export const STORE_BLOB_TILES = "og-blob-tiles";
export const STORE_COUNTRY_TILES = "og-country-tiles";

const BLOB_KEY = "current";

function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            for (const s of [
                STORE_BLOB,
                STORE_BLOB_TILES,
                STORE_COUNTRY_TILES,
            ]) {
                if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function getBlob(): Promise<OgBlob | null> {
    const db = await open();
    try {
        return await new Promise<OgBlob | null>((resolve, reject) => {
            const tx = db.transaction(STORE_BLOB, "readonly");
            const r = tx.objectStore(STORE_BLOB).get(BLOB_KEY);
            r.onsuccess = () => resolve((r.result as OgBlob) ?? null);
            r.onerror = () => reject(r.error);
        });
    } finally {
        db.close();
    }
}

export async function getCountryTile(
    iso: string,
    z: number,
    x: number,
    y: number,
): Promise<Blob | null> {
    const db = await open();
    try {
        return await new Promise<Blob | null>((resolve, reject) => {
            const tx = db.transaction(STORE_COUNTRY_TILES, "readonly");
            const r = tx
                .objectStore(STORE_COUNTRY_TILES)
                .get(`${iso}/${z}/${x}/${y}`);
            r.onsuccess = () => resolve((r.result as Blob) ?? null);
            r.onerror = () => reject(r.error);
        });
    } finally {
        db.close();
    }
}

export async function getBlobTile(
    z: number,
    x: number,
    y: number,
): Promise<Blob | null> {
    const db = await open();
    try {
        return await new Promise<Blob | null>((resolve, reject) => {
            const tx = db.transaction(STORE_BLOB_TILES, "readonly");
            const r = tx.objectStore(STORE_BLOB_TILES).get(`${z}/${x}/${y}`);
            r.onsuccess = () => resolve((r.result as Blob) ?? null);
            r.onerror = () => reject(r.error);
        });
    } finally {
        db.close();
    }
}

export async function getCountryMeta(
    iso: string,
): Promise<OgCountryMeta | null> {
    const db = await open();
    try {
        return await new Promise<OgCountryMeta | null>((resolve, reject) => {
            const tx = db.transaction(STORE_COUNTRY_TILES, "readonly");
            const r = tx
                .objectStore(STORE_COUNTRY_TILES)
                .get(`${iso}/_meta`);
            r.onsuccess = () =>
                resolve((r.result as OgCountryMeta) ?? null);
            r.onerror = () => reject(r.error);
        });
    } finally {
        db.close();
    }
}

/** Write a single blob-tile. Used by the prefetcher streaming tiles
 *  straight into IDB as they arrive. The replaceBlob clear-and-write
 *  later wipes everything; until then these per-tile rows are the
 *  staging area we read back during compose. */
export async function putBlobTile(
    z: number,
    x: number,
    y: number,
    blob: Blob,
): Promise<void> {
    const db = await open();
    try {
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_BLOB_TILES, "readwrite");
            tx.objectStore(STORE_BLOB_TILES).put(blob, `${z}/${x}/${y}`);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } finally {
        db.close();
    }
}

/** Wipe the previous blob row and every blob-tile in two small
 *  transactions. Cheap — clear is a single op per store. Call this at
 *  the START of a new prefetch so tiles stream into a clean store. */
export async function clearAllBlob(): Promise<void> {
    const db = await open();
    try {
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(
                [STORE_BLOB, STORE_BLOB_TILES],
                "readwrite",
            );
            tx.objectStore(STORE_BLOB).clear();
            tx.objectStore(STORE_BLOB_TILES).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } finally {
        db.close();
    }
}

/** Write the OgBlob metadata row. Tiny transaction (one put). Tiles
 *  go in via putBlobTile during the prefetch — don't bundle them here
 *  or the transaction times out at scale. */
export async function putBlob(blob: OgBlob): Promise<void> {
    const db = await open();
    try {
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_BLOB, "readwrite");
            tx.objectStore(STORE_BLOB).put(blob, BLOB_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } finally {
        db.close();
    }
}

/** One-time legacy cleanup: nuke every localStorage key from the
 *  previous offline-tile attempt. The data was always broken; we
 *  don't preserve anything. */
export function purgeLegacyKeys(): void {
    if (typeof localStorage === "undefined") return;
    for (const k of [
        "retreever-cached-tiles",
        "retreever-last-cached-area",
        "retreever-tile-overlay",
    ]) {
        try {
            localStorage.removeItem(k);
        } catch {
            /* ignore */
        }
    }
}
