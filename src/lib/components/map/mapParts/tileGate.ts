/**
 * Tile gate — global request-filter for Mapbox GL JS' transformRequest.
 *
 * When `tileModeEnabled` is true, any tile request whose key is NOT in
 * `tileModeAllowedKeys` gets rewritten to a 1×1 transparent PNG data
 * URI. The browser never reaches the network for that tile, Mapbox
 * paints nothing where it would have placed the tile, and the user
 * sees the empty map background underneath.
 *
 * Why this exists: 'verify mode' that just hides Mapbox satellite is
 * not enough — Esri (the cached layer) keeps fetching live when the
 * user has a network connection, so they can't see "what's actually
 * cached vs not". This gate is the real, physical answer: any tile
 * not in the deliberate-prefetch set is BLOCKED at the request layer,
 * regardless of whether the network exists. The map renders only
 * tiles the user actually downloaded.
 *
 * The gate is wired in mapInit.ts via the `transformRequest` Map
 * option. It's a closure on module-level state so the toggle UI
 * elsewhere can flip it on/off without re-creating the Map.
 *
 * Limitations honestly stated:
 *  - Mapbox vector style layers (streets, labels) aren't routed
 *    through tile-by-tile URLs in the same shape, so this only
 *    fully blocks RASTER tile sources. The companion verify-mode
 *    layer-visibility code in MapDrawControls hides those.
 *  - The 1×1 PNG is base64-decoded by the browser — adds a few µs
 *    per blocked tile. Negligible vs the network round-trip we'd
 *    otherwise pay.
 */

let tileModeEnabled = false;
let tileModeAllowedKeys: Set<string> | null = null;

// 1×1 fully transparent PNG. Decodes successfully in every browser,
// renders as nothing. Returned for blocked tile requests so Mapbox's
// tile loader sees a "successful" empty image and doesn't retry.
const BLANK_PNG_DATA_URI =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export function setTileMode(on: boolean, allowed?: Set<string>): void {
    tileModeEnabled = on;
    tileModeAllowedKeys = on ? (allowed ?? new Set()) : null;
    // Reset diagnostic counters on every state flip so the next 10
    // gated requests after a toggle show up in the console.
    _gateLogCount = 0;
    if (on) {
        const sample = allowed ? [...allowed].slice(0, 5) : [];
        console.log(
            `[tileGate] ON — ${allowed?.size ?? 0} tiles in allow-list (sample: ${sample.join(", ")})`,
        );
    } else {
        console.log("[tileGate] OFF — all tile requests pass through");
    }
}

let _gateLogCount = 0;
const GATE_LOG_LIMIT = 12;

export function isTileModeOn(): boolean {
    return tileModeEnabled;
}

/**
 * Check whether a tile URL should be blocked. Returns the redirect
 * URL when the request should be cancelled, or `null` to let the
 * original URL through.
 *
 * Recognises tile URLs by trailing `/{z}/{y}/{x}` (Esri shape) or
 * `/{z}/{x}/{y}` (Mapbox shape). For our purposes both end in three
 * integer path segments, and the key is canonicalised as `z/x/y`.
 */
export function gateTileUrl(url: string, resourceType?: string): string | null {
    if (!tileModeEnabled || !tileModeAllowedKeys) return null;
    if (resourceType !== "Tile") return null;
    // CRITICAL: only gate the Esri satellite source. Other tile
    // sources we want to render fully:
    //   - CartoDB Dark Matter (local /offlineTiles/...) — bundled
    //     with the app, must always render or the world is black.
    //   - Mapbox vector tiles (api.mapbox.com/v4/...) — roads and
    //     labels for the dark vector base.
    // Without this guard, the regex below matches any URL ending in
    // /z/x/y and we'd block everything.
    if (!url.includes("services.arcgisonline.com")) return null;
    // Match the trailing /z/y/x or /z/x/y triplet (with optional
    // .png/.jpg/.jpgN extension and querystring).
    const m = url.match(/\/(\d+)\/(\d+)\/(\d+)(?:\.[a-z\d]+)?(?:\?.*)?$/i);
    if (!m) return null;
    const z = m[1];
    const a = m[2];
    const b = m[3];
    // Canonical key in our cachedTiles set is `z/x/y`. Esri serves
    // {z}/{y}/{x}, so for that source we'd swap. We try BOTH orders
    // — if either matches our allowed set, let it through.
    const keyXY = `${z}/${a}/${b}`;
    const keyYX = `${z}/${b}/${a}`;
    const hit =
        tileModeAllowedKeys.has(keyXY) || tileModeAllowedKeys.has(keyYX);
    // Log the first GATE_LOG_LIMIT requests after a state change so
    // we can see exactly what's being blocked vs let through (and why
    // — wrong axis order? z out of cached range? URL didn't match
    // the regex?). After the limit the gate goes silent so it
    // doesn't flood the console during a normal pan/zoom.
    if (_gateLogCount < GATE_LOG_LIMIT) {
        _gateLogCount++;
        console.log(
            `[tileGate] ${hit ? "PASS" : "BLOCK"} z${z} xy=${keyXY} yx=${keyYX} :: ${url}`,
        );
    }
    return hit ? null : BLANK_PNG_DATA_URI;
}
