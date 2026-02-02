import type { MapOptions } from './types';

/**
 * Preset options for full-featured map - ALL options enabled
 */
export const fullMapOptions: MapOptions = {
	// Controls
	showNavigation: true,
	showStyleControl: true,
	showGeoToggle: false, // PAUSED: Large GeoJSON layers disabled for now
	showDrawTools: true,
	hideLabels: true,
	// Data layers
	loadMarkers: true,
	// URL sync
	enableHash: true,
	// Globe features
	globeProjection: true,
	autoRotate: true,
	rotationSpeed: 2,
	// General
	scrollZoom: true,
	initialZoom: 2,
	initialCenter: [38.32379156163088, -4.920169086710128],
};

/**
 * Default options - minimal map with nothing enabled by default.
 * Pass explicit options to enable features.
 */
export const defaultOptions: MapOptions = {
	compact: false,
	showNavigation: false,
	showStyleControl: false,
	showGeoToggle: false,
	showDrawTools: false,
	loadMarkers: false,
	enableHash: false,
	globeProjection: false,
	autoRotate: false,
	rotationSpeed: 2,
	scrollZoom: true,
	initialZoom: 2,
	initialCenter: [38.32379156163088, -4.920169086710128], // Tanzania
};

/**
 * Preset options for compact hero globe mode (homepage)
 */
export const compactGlobeOptions: MapOptions = {
	// // Controls
	// showNavigation: true,
	// showStyleControl: true,
	// showGeoToggle: false, // PAUSED: Large GeoJSON layers disabled for now
	// showDrawTools: true,
	hideLabels: true,
	// Data layers
	loadMarkers: true,
	// URL sync
	// enableHash: true,
	// Globe features
	globeProjection: true,
	autoRotate: true,
	rotationSpeed: 1.5,
	// // General
	// scrollZoom: true,
	// initialZoom: 2,
	// initialCenter: [38.32379156163088, -4.920169086710128],
};
