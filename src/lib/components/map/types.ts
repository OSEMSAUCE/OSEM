import type { ClusteredPinsConfig } from "./layers_clusteredPins";

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

	// ─── CALLBACKS ───
	/** Callback when user starts interacting (pauses rotation) */
	onUserInteractionStart?: () => void;
	/** Callback when user stops interacting */
	onUserInteractionEnd?: () => void;
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
