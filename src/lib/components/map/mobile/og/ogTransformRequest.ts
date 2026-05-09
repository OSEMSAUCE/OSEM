/**
 * Air-gap guard for the Offline Gopher map instance.
 *
 * Rejects any request whose URL doesn't start with a local scheme.
 * No allow-list of internet hosts — by construction, only local
 * URLs can succeed. This is wired into mapboxgl.Map's
 * `transformRequest` and is the single point that enforces "this
 * map has never been online and never will be."
 *
 * Returning `{ url: BLANK_PNG }` makes Mapbox think the request
 * succeeded with an empty image. Returning the original URL would
 * let it hit the network — never do that here.
 */

const BLANK_PNG_DATA_URI =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const LOCAL_PREFIXES = ["/", "blob:", "data:", "capacitor://", "file://"];

let _blockLogCount = 0;
const BLOCK_LOG_LIMIT = 8;

export function ogTransformRequest(
    url: string,
): { url: string } | undefined {
    if (LOCAL_PREFIXES.some((p) => url.startsWith(p))) {
        return undefined;
    }
    if (_blockLogCount < BLOCK_LOG_LIMIT) {
        _blockLogCount++;
        console.warn(`[og] blocked non-local request: ${url}`);
    }
    return { url: BLANK_PNG_DATA_URI };
}
