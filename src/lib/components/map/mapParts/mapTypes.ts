import type * as mapboxgl from "mapbox-gl";
import type { ClusteredPinsConfig } from "./mapMarker";

/**
 * Options for initializing the map.
 *
 * DEFAULTS: All features OFF. Pass options explicitly to enable.
 * - /where page: use `fullMapOptions` (all controls + data layers)
 * - Homepage: use `compactGlobeOptions` (rotating globe + markers only)
 */
export interface MapOptions {
    // ─── /WHERE PAGE FEATURES (off by default, on for fullMapOptions) ───
    /** Show navigation controls (zoom, compass) */
    showNavigation?: boolean;
    /** Show style switcher control */
    showStyleControl?: boolean;
    /** Show geographic layer toggles */
    showGeoToggle?: boolean;
    /** Show draw tools */
    showDrawTools?: boolean;
    /** Mobile-optimized controls layout (no zoom buttons, FAB-driven draw, top-right style toggle) */
    mobileControls?: boolean;
    /** Load polygon markers */
    loadMarkers?: boolean;

    /** Sync zoom/center into the URL hash (e.g. #1.2/-4.9/12.8) */
    enableHash?: boolean;

    // ─── HOMEPAGE GLOBE FEATURES (off by default, on for compactGlobeOptions) ───
    /** Compact mode flag (affects marker interactivity) */
    compact?: boolean;
    /** Enable globe projection (vs flat map) */
    globeProjection?: boolean;
    /** Enable auto-rotation */
    autoRotate?: boolean;
    /** Rotation speed in degrees per second */
    rotationSpeed?: number;
    /** Hide map labels (country/continent names) */
    hideLabels?: boolean;
    /** Layer ID prefixes to keep visible when hideLabels is true (e.g. ["road-", "settlement-"]) */
    labelWhitelist?: string[];
    /** Show hospital POI markers (prominently sized) when hideLabels is true */
    showHospitalMarkers?: boolean;
    /** Make background/space transparent (or white) */
    transparentBackground?: boolean;

    // ─── SHARED / GENERAL ───
    /** Enable scroll zoom */
    scrollZoom?: boolean;
    /** Initial zoom level */
    initialZoom?: number;
    /** Initial center [lng, lat] */
    initialCenter?: [number, number];
    /** API base URL for fetching data */
    apiBaseUrl?: string;
    /** Override marker image URL */
    markerUrl?: string;
    /** Mapbox style URL */
    style?: string;
    /**
     * Passed straight to `new mapboxgl.Map({ transformRequest })`. Lets a caller
     * rewrite or BLOCK every tile/asset request — e.g. an air-gapped offline map
     * that rejects any non-local URL so it can never stream over the network.
     */
    transformRequest?: mapboxgl.MapboxOptions["transformRequest"];

    // ─── CALLBACKS ───
    /** Callback when user starts interacting (pauses rotation) */
    onUserInteractionStart?: () => void;
    /** Callback when user stops interacting */
    onUserInteractionEnd?: () => void;
    /** Callback when a feature (polygon/marker) is selected — receives the
     * feature's GeoJSON `properties` bag (shape varies per layer). */
    onFeatureSelect?: (feature: Record<string, unknown>) => void;
    /** Callback fired once the map has fully loaded — receives the live map instance */
    onMapReady?: (map: import("mapbox-gl").Map) => void;
    /**
     * Callback fired the moment the map object is CONSTRUCTED — before the
     * style (and therefore `load`) resolves. On a weak connection the hosted
     * style fetch can hang for minutes, so `onMapReady` never fires; DOM
     * overlays (mapboxgl.Marker) work on a bare map, letting callers wire
     * style-independent UI immediately. Most consumers should keep using
     * `onMapReady` — the map has no style/sources/layers yet here.
     */
    onMapCreated?: (map: import("mapbox-gl").Map) => void;
}

// Re-export interface for backward compatibility with geoToggle plugin
export interface PolygonConfig {
    id: string;
    path: string;
    name: string;
    fillColor: string;
    outlineColor: string;
    opacity: number;
    type?: string;
    initiallyVisible?: boolean;
}

// Re-export ClusteredPinsConfig for convenience
export type { ClusteredPinsConfig };
