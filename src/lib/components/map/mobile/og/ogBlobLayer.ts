/**
 * Mount/unmount the blob composite on the OG map as a Mapbox `image`
 * source — same primitive PDF maps use, scales at every view zoom.
 *
 *   IMPORTANT: the source URL passed to mapbox is a `blob:` URL. The
 *   air-gap guard (ogTransformRequest) explicitly allows `blob:`,
 *   `data:`, `/`, `capacitor://`, `file://`. Anything else is rewritten
 *   to a 1×1 transparent PNG so it can never reach the network.
 */

import type mapboxgl from "mapbox-gl";
import type { OgBounds } from "./types";

const SOURCE_ID = "og-blob-composite";
const LAYER_ID = "og-blob-composite-layer";
let _objectUrl: string | null = null;

export function mountBlobComposite(
    map: mapboxgl.Map,
    blob: Blob,
    bounds: OgBounds,
): void {
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
    map.addSource(SOURCE_ID, {
        type: "image",
        url: _objectUrl,
        // [TL, TR, BR, BL] in lng/lat, per Mapbox image-source spec.
        coordinates: [
            [bounds.west, bounds.north],
            [bounds.east, bounds.north],
            [bounds.east, bounds.south],
            [bounds.west, bounds.south],
        ],
    });
    map.addLayer({
        id: LAYER_ID,
        type: "raster",
        source: SOURCE_ID,
        paint: {
            "raster-opacity": 1,
            "raster-fade-duration": 0,
        },
    });
}

export function unmountBlobComposite(map: mapboxgl.Map): void {
    if (map.getLayer(LAYER_ID)) {
        try {
            map.removeLayer(LAYER_ID);
        } catch {
            /* ignore */
        }
    }
    if (map.getSource(SOURCE_ID)) {
        try {
            map.removeSource(SOURCE_ID);
        } catch {
            /* ignore */
        }
    }
    if (_objectUrl) {
        URL.revokeObjectURL(_objectUrl);
        _objectUrl = null;
    }
}
