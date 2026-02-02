import type mapboxgl from "mapbox-gl";

/**
 * Parse map hash from URL to extract zoom and center coordinates
 * @param hash - URL hash string (e.g. "#12.34567/-89.12345/45.67890")
 * @returns Object with zoom and center, or null if invalid
 */
export function parseMapHash(hash: string): { zoom: number; center: [number, number] } | null {
	const trimmed = hash.replace(/^#/, "").trim();
	if (!trimmed) return null;

	const parts = trimmed.split("/");
	if (parts.length < 3) return null;

	const zoom = Number(parts[0]);
	const lat = Number(parts[1]);
	const lng = Number(parts[2]);
	if (!Number.isFinite(zoom) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

	return { zoom, center: [lng, lat] };
}

/**
 * Update URL hash with current map state
 * @param map - Mapbox map instance
 */
export function setMapHash(map: mapboxgl.Map): void {
	const zoom = map.getZoom();
	const center = map.getCenter();

	const next = `#${zoom.toFixed(2)}/${center.lat.toFixed(5)}/${center.lng.toFixed(5)}`;
	if (typeof window === "undefined") return;
	if (window.location.hash === next) return;

	history.replaceState(null, "", next);
}
