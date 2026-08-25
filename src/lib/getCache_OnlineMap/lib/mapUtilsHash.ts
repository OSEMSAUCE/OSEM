import type * as mapboxgl from "mapbox-gl";

/**
 * Parse map hash from URL to extract zoom and center coordinates
 * @param hash - URL hash string (e.g. "#12.34567/-89.12345/45.67890")
 * @returns Object with zoom and center, or null if invalid
 */
export function parseMapHash(
    hash: string,
): { zoom: number; center: [number, number] } | null {
    const trimmed = hash.replace(/^#/, "").trim();
    if (!trimmed) return null;

    const parts = trimmed.split("/");
    if (parts.length < 3) return null;

    const zoom = Number(parts[0]);
    const lat = Number(parts[1]);
    const lng = Number(parts[2]);
    if (
        !Number.isFinite(zoom) ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    )
        return null;

    return { zoom, center: [lng, lat] };
}

/**
 * How the new URL actually gets written. The default is `history.replaceState`
 * so this file stays pure — no SvelteKit import, so it unit-tests in plain
 * node against stubbed globals, which is the only reason it has tests at all.
 *
 * The CALLER owns navigation, not this helper. In a SvelteKit page that means
 * passing `replaceState` from `$app/navigation`: a raw history write leaves
 * the router's history index pointing at state it did not create, and it warns
 * about exactly that. Here the write is a parameter, so the helper computes
 * the string and the host decides what a URL change means.
 */
export type HashWriter = (url: string) => void;

const writeWithHistory: HashWriter = (url) => {
    history.replaceState(null, "", url);
};

/**
 * Update URL hash with current map state
 * @param map - Mapbox map instance
 * @param write - how to commit the URL; defaults to `history.replaceState`
 */
export function setMapHash(map: mapboxgl.Map, write: HashWriter = writeWithHistory): void {
    const zoom = map.getZoom();
    const center = map.getCenter();

    const next = `#${zoom.toFixed(2)}/${center.lat.toFixed(5)}/${center.lng.toFixed(5)}`;
    if (typeof window === "undefined") return;
    if (window.location.hash === next) return;

    write(next);
}
