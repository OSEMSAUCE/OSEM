export type LngLat = { lng: number; lat: number };

export type OgBounds = {
    west: number;
    south: number;
    east: number;
    north: number;
};

export type OgBlob = {
    id: string;
    center: LngLat;
    radiusKm: number;
    bounds: OgBounds;
    composedAt: string;
    tileCount: number;
    compositeBlob: Blob;
};

export type OgCountryMeta = {
    iso: string;
    bounds: OgBounds;
    downloadedAt: string;
    completionPct: number;
};
