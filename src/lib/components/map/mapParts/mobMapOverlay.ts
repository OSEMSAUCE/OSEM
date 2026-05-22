import type { Map } from "mapbox-gl";
import type { GeorefResult } from "./mobMapGeoref";

const IMAGE_SOURCE_ID = "pdf-overlay";
const RASTER_LAYER_ID = "pdf-layer";

// Insert PDF overlay below the first draw layer in the current draw engine
// (see mapDraw.ts: setupDrawSourcesAndLayers). Falls back to the completed-fill
// layer, then to no beforeId (top of stack) if neither exists yet.
function pickBeforeId(map: Map): string | undefined {
    const candidates = ["draw-edges-halo", "completed-fill"];
    for (const id of candidates) {
        if (map.getLayer(id)) return id;
    }
    return undefined;
}

export function addPdfOverlay(map: Map, georef: GeorefResult): void {
    removePdfOverlay(map);

    if (!georef.mapboxCorners) {
        console.warn(
            "[mapOverlay] georef has no mapboxCorners — cannot position PDF on map",
        );
        return;
    }

    // Mapbox ImageSource coordinates: [topLeft, topRight, bottomRight, bottomLeft] as [lng, lat]
    map.addSource(IMAGE_SOURCE_ID, {
        type: "image",
        url: georef.imageDataUrl,
        coordinates: georef.mapboxCorners,
    });

    map.addLayer(
        {
            id: RASTER_LAYER_ID,
            type: "raster",
            source: IMAGE_SOURCE_ID,
            // 0.7 default — high enough that the PDF stays the dominant
            // surface but low enough that satellite features (water,
            // roads, treeline) read through. Tunable per-overlay via
            // setPdfOpacity().
            paint: { "raster-opacity": 0.7 },
        },
        pickBeforeId(map),
    );

    // NOTE: drawing the overlay deliberately does NOT move the camera.
    // Framing is the route's job (`frameActiveMap` / `frameFeature` in
    // MapDrawControls). This function used to `fitBounds` to the PDF on
    // every draw — and since the overlay re-draws on every map open, the
    // camera was yanked onto the PDF after the route had already framed
    // the whole map. "See on map" for a map then only ever showed the
    // PDF. Render and framing are now separate concerns. The importer
    // explicitly frames a freshly imported PDF.
}

export function removePdfOverlay(map: Map): void {
    if (map.getLayer(RASTER_LAYER_ID)) {
        map.removeLayer(RASTER_LAYER_ID);
    }
    if (map.getSource(IMAGE_SOURCE_ID)) {
        map.removeSource(IMAGE_SOURCE_ID);
    }
}

export function setPdfOpacity(map: Map, opacity: number): void {
    if (map.getLayer(RASTER_LAYER_ID)) {
        map.setPaintProperty(RASTER_LAYER_ID, "raster-opacity", opacity);
    }
}
