/**
 * Esri "World Imagery" raster layer — free satellite fallback that
 * sits between the dark CartoDB offline basemap (z0–7) and the live
 * Mapbox satellite tiles.
 *
 * Why it's here: Mapbox bills per tile request. The TILES feature
 * pre-downloads tiles for offline use; doing that against Mapbox
 * would cost real money per planter per week. Esri's World Imagery
 * is free for personal/non-commercial use (which a free planting
 * app qualifies as), so we route the prefetch at it instead.
 *
 * Tile schema: Esri uses {z}/{y}/{x} (note the y/x swap vs Mapbox).
 * mapbox-gl-js supports any URL template; the placeholders just
 * need to match what the source ships.
 *
 * Layering order (bottom to top):
 *   1. CartoDB Dark Matter     (mapStyleOffline, world land z0–7)
 *   2. Esri World Imagery      (this file, satellite z0–18)        ← we are here
 *   3. Mapbox satellite/style  (the user-selected basemap)
 *
 * Online: Mapbox covers Esri completely; the user sees the same
 * crisp Mapbox imagery as before. Esri tiles still get fetched
 * (for the visible viewport), but they're free, so it's bandwidth
 * not money. Most of those requests get serviced from browser HTTP
 * cache after the first hit.
 *
 * Offline: Mapbox tiles fail to load → Esri shows through (if
 * pre-cached via the TILES button) → CartoDB Dark Matter shows
 * through that (always-bundled).
 *
 * Idempotent: safe to call after every `style.load`.
 */
import type mapboxgl from "mapbox-gl";

const SOURCE_ID = "esri-world-imagery";
const LAYER_ID = "esri-world-imagery";
// Free service. No API key required for personal/non-commercial use.
// Attribution requirement: 'Source: Esri, Maxar, Earthstar Geographics,
// and the GIS User Community'. Stamped via the source's `attribution`.
const TILE_URL =
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export function addEsriImageryFallback(map: mapboxgl.Map): void {
    if (map.getSource(SOURCE_ID)) return;

    try {
        map.addSource(SOURCE_ID, {
            type: "raster",
            tiles: [TILE_URL],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 18,
            attribution:
                'Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        });

        // Insert above the CartoDB Dark Matter offline basemap (the
        // bottom-most layer) but below all the Mapbox-provided layers
        // (satellite/streets/labels). Find the first non-offline layer
        // and put Esri before it.
        const layers = map.getStyle()?.layers ?? [];
        let beforeId: string | undefined;
        for (const l of layers) {
            if (l.id === "offline-basemap") continue;
            beforeId = l.id;
            break;
        }

        map.addLayer(
            {
                id: LAYER_ID,
                type: "raster",
                source: SOURCE_ID,
                paint: {
                    "raster-opacity": 1,
                    "raster-fade-duration": 200,
                    // Deliberate visual differentiation from Mapbox
                    // satellite. When the user toggles verify-mode
                    // (Mapbox satellite hidden, Esri exposed) this
                    // makes the difference between live imagery and
                    // cached imagery undeniable to the eye:
                    //   - desaturated 30% (less vivid)
                    //   - warm hue shift (~12° toward gold/yellow)
                    //   - slightly higher contrast
                    // Esri imagery is also a different vendor so the
                    // recency / cloud coverage / processing differ
                    // anyway; this just amplifies that.
                    "raster-saturation": -0.3,
                    "raster-hue-rotate": 12,
                    "raster-contrast": 0.1,
                },
            },
            beforeId,
        );
        console.log("[Esri imagery] mounted");
    } catch (err) {
        console.warn("[Esri imagery] failed to mount:", err);
    }
}

export function removeEsriImageryFallback(map: mapboxgl.Map): void {
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
}

/** Build the same tile URL the layer above uses. Exposed so the
 *  tile-prefetch helper can prime the browser HTTP cache against
 *  the exact URL pattern the source consumes. */
export function buildEsriTileUrl(z: number, x: number, y: number): string {
    return `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
}
