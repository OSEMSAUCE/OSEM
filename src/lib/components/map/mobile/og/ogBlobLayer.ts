/**
 * Blob layers on the OG map.
 *
 * Two layers stack to give continuous coverage with sharp deep-zoom:
 *
 *   1. og-blob-composite — single Mapbox `image` source, the PNG made
 *      by ogComposite. Visible at every view zoom (image sources have
 *      no minzoom/maxzoom). At low zoom it's the only thing rendering
 *      because the tile pyramid below has nothing under z=8.
 *
 *   2. og-blob-pyramid — a `raster` source pointing at the og://
 *      protocol. As the user zooms past z=8, real native-zoom tiles
 *      from IDB render ABOVE the composite. At z=13 the user sees
 *      sharp 256×256 Esri pixels, not a stretched picture.
 *
 * Mounted/unmounted as a unit. The protocol handler returns a blank
 * PNG for tiles outside the cached set, so the pyramid quietly falls
 * back to the composite where it has no data.
 */

import type mapboxgl from "mapbox-gl";
import type { OgBounds } from "./types";
import {
    clearBlobTileUrls,
    loadBlobTileUrls,
} from "./ogBlobUrlCache";

const COMPOSITE_SRC = "og-blob-composite";
const COMPOSITE_LAYER = "og-blob-composite-layer";
const PYRAMID_SRC = "og-blob-pyramid";
const PYRAMID_LAYER = "og-blob-pyramid-layer";

let _objectUrl: string | null = null;
// Serialize mounts so two effect-fired calls can't race past each
// other's `await loadBlobTileUrls()`. Without this, both pre-add
// the composite, both await, then both try to add the pyramid and
// the second crashes on "source already exists".
let _mountChain: Promise<void> = Promise.resolve();

export function mountBlobComposite(
    map: mapboxgl.Map,
    blob: Blob,
    bounds: OgBounds,
    pyramid?: { minZoom: number; maxZoom: number },
): Promise<void> {
    _mountChain = _mountChain
        .catch(() => {})
        .then(() => doMount(map, blob, bounds, pyramid));
    return _mountChain;
}

async function doMount(
    map: mapboxgl.Map,
    blob: Blob,
    bounds: OgBounds,
    pyramid?: { minZoom: number; maxZoom: number },
): Promise<void> {
    if (
        !Number.isFinite(bounds.west) ||
        !Number.isFinite(bounds.east) ||
        !Number.isFinite(bounds.south) ||
        !Number.isFinite(bounds.north)
    ) {
        console.warn(
            "[og] mountBlobComposite: non-finite bounds, skipping",
            bounds,
        );
        return;
    }
    unmountBlobComposite(map);
    _objectUrl = URL.createObjectURL(blob);

    // Defensive: if a previous mount left a source behind (e.g. a
    // mount that crashed mid-flight), remove it before re-adding.
    if (map.getSource(COMPOSITE_SRC)) {
        try {
            if (map.getLayer(COMPOSITE_LAYER)) map.removeLayer(COMPOSITE_LAYER);
            map.removeSource(COMPOSITE_SRC);
        } catch {
            /* ignore */
        }
    }

    // Floor — image source, always-visible.
    map.addSource(COMPOSITE_SRC, {
        type: "image",
        url: _objectUrl,
        coordinates: [
            [bounds.west, bounds.north],
            [bounds.east, bounds.north],
            [bounds.east, bounds.south],
            [bounds.west, bounds.south],
        ],
    });
    map.addLayer({
        id: COMPOSITE_LAYER,
        type: "raster",
        source: COMPOSITE_SRC,
        paint: {
            "raster-opacity": 1,
            "raster-fade-duration": 0,
        },
    });

    // Ceiling — tile pyramid served from IDB. ogTransformRequest
    // intercepts the /og-blob-tile/{z}/{x}/{y} URL pattern and looks
    // up the right blob: URL synchronously from the pre-populated
    // cache. Pre-populating happens here, BEFORE the source is added,
    // so by the time mapbox starts requesting tiles every cached
    // coord resolves immediately. Tiles outside the cached set
    // resolve to a 1×1 PNG and the composite shows through.
    if (pyramid) {
        await loadBlobTileUrls();
        // Defensive: another concurrent mount may already have added
        // these. Tear them down before re-adding.
        if (map.getSource(PYRAMID_SRC)) {
            try {
                if (map.getLayer(PYRAMID_LAYER)) map.removeLayer(PYRAMID_LAYER);
                map.removeSource(PYRAMID_SRC);
            } catch {
                /* ignore */
            }
        }
        map.addSource(PYRAMID_SRC, {
            type: "raster",
            tiles: ["/og-blob-tile/{z}/{x}/{y}.png"],
            tileSize: 256,
            minzoom: pyramid.minZoom,
            maxzoom: pyramid.maxZoom,
            // Constrain to the blob bbox so mapbox doesn't request
            // wasted tiles outside the downloaded area.
            bounds: [bounds.west, bounds.south, bounds.east, bounds.north],
        });
        map.addLayer({
            id: PYRAMID_LAYER,
            type: "raster",
            source: PYRAMID_SRC,
            paint: {
                "raster-opacity": 1,
                "raster-fade-duration": 0,
            },
        });
    }
}

export function unmountBlobComposite(map: mapboxgl.Map): void {
    for (const id of [PYRAMID_LAYER, COMPOSITE_LAYER]) {
        if (map.getLayer(id)) {
            try {
                map.removeLayer(id);
            } catch {
                /* ignore */
            }
        }
    }
    for (const id of [PYRAMID_SRC, COMPOSITE_SRC]) {
        if (map.getSource(id)) {
            try {
                map.removeSource(id);
            } catch {
                /* ignore */
            }
        }
    }
    if (_objectUrl) {
        URL.revokeObjectURL(_objectUrl);
        _objectUrl = null;
    }
    // Revoke every per-tile blob: URL the cache handed out. Important:
    // without this, leaving the page leaks one URL handle per cached
    // tile (and pins the underlying Blob from being GC'd).
    clearBlobTileUrls();
}
