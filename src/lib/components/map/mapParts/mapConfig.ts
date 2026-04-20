import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";
import type { MapOptions } from "./mapTypes";

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
    style: MAP_CONFIG.styles.defaultDark,
};

/**
 * Default options - minimal map with nothing enabled by default.
 * Pass explicit options to enable features. Mobile inherits this style.
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
    style: MAP_CONFIG.styles.defaultSat,
};

/**
 * Preset options for compact hero globe mode (homepage)
 */
export const compactGlobeOptions: MapOptions = {
    hideLabels: true,
    loadMarkers: true,
    globeProjection: true,
    autoRotate: true,
    rotationSpeed: 1.5,
    style: MAP_CONFIG.styles.defaultDark,
};
