/**
 * Air-gap guard for the Offline Gopher map instance.
 *
 * Rejects any request whose URL doesn't start with a local scheme.
 * No allow-list of internet hosts — by construction, only local
 * URLs can succeed. This is wired into mapboxgl.Map's
 * `transformRequest` and is the single point that enforces "this
 * map has never been online and never will be."
 *
 * Also handles the IDB-backed blob-tile URL pattern:
 *   /og-blob-tile/{z}/{x}/{y}.png
 * Mapbox can't await IDB, but it CAN follow a synchronous URL
 * rewrite — so transformRequest looks up the right `blob:` URL
 * from a pre-populated cache (see ogBlobUrlCache.ts) and rewrites
 * the tile URL to it.
 */

import { getBlobTileUrl } from "./offlineBlobUrlCache";

const BLANK_PNG_DATA_URI =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const LOCAL_PREFIXES = [
    "/",
    "blob:",
    "data:",
    "capacitor://",
    "file://",
];

const BLOB_TILE_RE = /^\/og-blob-tile\/(\d+)\/(\d+)\/(\d+)/;

let _blockLogCount = 0;
const BLOCK_LOG_LIMIT = 8;

export function ogTransformRequest(
    url: string,
): { url: string } | undefined {
    // Synchronous lookup for IDB-backed blob-tile URLs. The cache is
    // populated before the pyramid raster source is added, so by the
    // time mapbox starts requesting tiles every cached coord resolves
    // to its blob: URL.
    const m = url.match(BLOB_TILE_RE);
    if (m) {
        const blobUrl = getBlobTileUrl(Number(m[1]), Number(m[2]), Number(m[3]));
        return { url: blobUrl ?? BLANK_PNG_DATA_URI };
    }
    if (LOCAL_PREFIXES.some((p) => url.startsWith(p))) {
        return undefined;
    }
    if (_blockLogCount < BLOCK_LOG_LIMIT) {
        _blockLogCount++;
        console.warn(`[og] blocked non-local request: ${url}`);
    }
    return { url: BLANK_PNG_DATA_URI };
}
