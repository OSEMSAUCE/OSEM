export type LngLat = { lng: number; lat: number };

export type OgBounds = {
    west: number;
    south: number;
    east: number;
    north: number;
};

export type OgBlob = {
    id: string;
    /** True GPS center used to fetch tiles. Never displayed to the
     *  user — keeps the pin jitter private. */
    center: LngLat;
    /** Privacy-jittered point (random 0..jitterKm from `center`) used
     *  for the pin and any "your blob is here" UI. */
    displayCenter: LngLat;
    radiusKm: number;
    bounds: OgBounds;
    composedAt: string;
    tileCount: number;
    compositeBlob: Blob;
    /** Total bytes of all tile blobs in IDB (sum of every tile's
     *  blob.size). The composite PNG is just one canvas snapshot at
     *  compositeZoom — it's only a few MB. The total tells the user
     *  how much of their device storage this blob is actually using. */
    totalBytes?: number;
};

export type OgCountryMeta = {
    iso: string;
    bounds: OgBounds;
    downloadedAt: string;
    completionPct: number;
};
