import mapboxgl from "mapbox-gl";
import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";
import {
    compactGlobeOptions,
    defaultOptions,
    fullMapOptions,
} from "./mapConfig";
import {
    CustomStyleControl,
    defaultStyleOptions,
    styleIdFromUrl,
} from "./mapControlBaseToggle";
import { addMarkersLayer } from "./mapLayerPolygon";
import type { MapOptions } from "./mapTypes";
import { applyNaturalOverrides, NATURAL_FOG } from "./mapStyleNatural";
import { parseMapHash, setMapHash } from "./mapUtilsHash";

const defaultSatStyle = MAP_CONFIG.styles.defaultSat;

// Helper to start globe auto-rotation
function startRotation(
    map: mapboxgl.Map,
    options: MapOptions,
    userInteractingRef: { current: boolean },
): void {
    const degreesPerSecond =
        options.rotationSpeed ?? MAP_CONFIG.globe.rotationSpeed;
    const maxSpinZoom = MAP_CONFIG.globe.maxSpinZoom; // Stop rotating at zoom 4 and above

    function spinGlobe() {
        if (!map || userInteractingRef.current) return;
        if (map.getZoom() >= maxSpinZoom) return;

        const center = map.getCenter();
        center.lng -= degreesPerSecond;
        map.easeTo({
            center,
            duration: MAP_CONFIG.globe.duration,
            easing: (n) => n,
        });
    }

    // When animation finishes, spin again
    map.on("moveend", spinGlobe);

    // Start spinning
    spinGlobe();
}

/**
 * Initialize a Mapbox map with configurable options.
 * @param container - The HTML container element for the map
 * @param options - Configuration options (use compactGlobeOptions for hero globe)
 * @returns Cleanup function to remove the map
 */
export function initializeMap(
    container: HTMLDivElement,
    options: MapOptions = {},
): () => void {
    const opts = { ...defaultOptions, ...options };
    const mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const maxSpinZoom = MAP_CONFIG.globe.maxSpinZoom; // Stop rotating (and start URL sync) at zoom 4 and above

    if (opts.enableHash && typeof window !== "undefined") {
        const parsed = parseMapHash(window.location.hash);
        if (parsed) {
            opts.initialZoom = parsed.zoom;
            opts.initialCenter = parsed.center;
        }
    }

    if (!mapboxAccessToken) {
        console.error("Mapbox access token is required");
        return () => {};
    }

    mapboxgl.accessToken = mapboxAccessToken;

    // Track user interaction for rotation pause
    const userInteractingRef = { current: false };

    const map = new mapboxgl.Map({
        container,
        style: opts.style || defaultSatStyle,
        hash: false,
        center: opts.initialCenter,
        zoom: opts.initialZoom,
        projection: opts.globeProjection ? "globe" : "mercator",
        interactive: true,
    });

    if (opts.enableHash) {
        map.on("moveend", () => {
            if (map.getZoom() < maxSpinZoom) return;
            setMapHash(map);
        });
    }

    // Configure scroll zoom
    if (!opts.scrollZoom) {
        map.scrollZoom.disable();
    } else {
        // Aggressive zoom: Mapbox default (1/450) is conservative — one
        // full trackpad swipe ≈ 1 zoom level. Users don't want to crawl
        // through 12 intermediate levels. At 1/60 a full swipe ≈ 7-8
        // zoom levels: globe to site in 2 gestures. Tiles lazy-load
        // after the user settles — speed of navigation > speed of tiles.
        map.scrollZoom.setWheelZoomRate(1 / 60);
        map.scrollZoom.setZoomRate(1 / 35);
    }

    // Track user interaction for auto-rotation
    if (opts.autoRotate) {
        // Mouse events
        map.on("mousedown", () => {
            userInteractingRef.current = true;
            opts.onUserInteractionStart?.();
        });
        map.on("mouseup", () => {
            userInteractingRef.current = false;
            opts.onUserInteractionEnd?.();
        });

        // Touch events for mobile
        map.on("touchstart", () => {
            userInteractingRef.current = true;
            opts.onUserInteractionStart?.();
        });
        map.on("touchend", () => {
            userInteractingRef.current = false;
            opts.onUserInteractionEnd?.();
        });

        // Drag events
        map.on("dragstart", () => {
            userInteractingRef.current = true;
            opts.onUserInteractionStart?.();
        });
        map.on("dragend", () => {
            userInteractingRef.current = false;
            opts.onUserInteractionEnd?.();
        });
    }

    // Unified style.load handler — fog, natural overrides, label hiding.
    // Fires on initial load AND after setStyle (style toggle).
    if (opts.globeProjection || opts.hideLabels) {
        map.on("style.load", () => {
            // ── Fog ────────────────────────────────────────────────────
            if (opts.globeProjection) {
                if (opts["transparentBackground"]) {
                    map.setFog({
                        color: "white",
                        "high-color": "white",
                        "horizon-blend": 0.015,
                        "space-color": "white",
                        "star-intensity": 0.4,
                    });
                } else {
                    // Detect if the loaded style is dark-v11 (natural base)
                    const name = map.getStyle()?.name?.toLowerCase() ?? "";
                    const isDark = name.includes("dark");
                    map.setFog(
                        isDark
                            ? NATURAL_FOG
                            : {
                                  color: "rgba(186, 210, 235, 0.35)",
                                  "high-color": "rgba(36, 92, 223, 0.18)",
                                  "horizon-blend": 0.015,
                                  "space-color": "rgb(11, 11, 25)",
                                  "star-intensity": 0.4,
                              },
                    );

                    // ── Natural style overrides (only on dark-v11) ─────
                    if (isDark) {
                        applyNaturalOverrides(map);
                    }
                }
            }

            // ── Hide labels ────────────────────────────────────────────
            // Natural overrides already hide all symbols, but this covers
            // non-natural styles when hideLabels is explicitly on.
            if (opts.hideLabels) {
                const layers = map.getStyle()?.layers || [];
                const whitelist = opts.labelWhitelist ?? [];
                for (const layer of layers) {
                    if (layer.type !== "symbol") continue;
                    // Keep whitelisted layers visible (e.g. road-, settlement-)
                    const isWhitelisted =
                        whitelist.length > 0 &&
                        whitelist.some((prefix) => layer.id.startsWith(prefix));
                    if (isWhitelisted) continue;
                    // poi-label gets special hospital handling below
                    if (opts.showHospitalMarkers && layer.id === "poi-label")
                        continue;
                    try {
                        const hasText =
                            map.getLayoutProperty(layer.id, "text-field") !=
                            null;
                        if (hasText)
                            map.setLayoutProperty(
                                layer.id,
                                "visibility",
                                "none",
                            );
                    } catch {
                        /* ignore */
                    }
                }

                // ── Hospital markers ────────────────────────────────
                // Filter poi-label to hospitals only, bump icon size.
                if (opts.showHospitalMarkers) {
                    try {
                        map.setFilter("poi-label", [
                            "==",
                            ["get", "maki"],
                            "hospital",
                        ]);
                        map.setLayoutProperty("poi-label", "icon-size", 1.8);
                        map.setLayoutProperty("poi-label", "text-size", 11);
                        map.setPaintProperty(
                            "poi-label",
                            "text-color",
                            "#ffffff",
                        );
                        map.setPaintProperty(
                            "poi-label",
                            "text-halo-color",
                            "rgba(0,0,0,0.8)",
                        );
                        map.setPaintProperty(
                            "poi-label",
                            "text-halo-width",
                            1.5,
                        );
                    } catch {
                        /* poi-label may not exist in all styles */
                    }
                }
            }
        });
    }

    // Add controls (only in non-compact mode)
    if (opts.showNavigation && !opts.mobileControls) {
        const nc = new mapboxgl.NavigationControl();
        map.addControl(nc, "top-left");
    }

    if (opts.showNavigation && !opts.mobileControls) {
        const scaleControl = new mapboxgl.ScaleControl({
            maxWidth: 160,
            unit: "metric",
        });
        map.addControl(scaleControl, "bottom-left");
    }

    if (opts.showStyleControl) {
        const initialStyleId = styleIdFromUrl(
            opts.style ?? defaultSatStyle,
            defaultStyleOptions,
        );
        const stylePosition = opts.mobileControls ? "top-right" : "top-left";
        map.addControl(
            new CustomStyleControl(defaultStyleOptions, initialStyleId),
            stylePosition,
        );
    }

    // Elastic zoom limits — see mapDocs.md §1.
    const { softMin, softMax, overshoot, easeMs } = MAP_CONFIG.zoom;
    map.setMinZoom(softMin - overshoot);
    map.setMaxZoom(softMax + overshoot);
    map.on("zoomend", () => {
        const z = map.getZoom();
        if (z > softMax) map.easeTo({ zoom: softMax, duration: easeMs });
        else if (z < softMin) map.easeTo({ zoom: softMin, duration: easeMs });
    });

    map.on("load", async () => {
        map.resize();
        if (opts.loadMarkers) await addMarkersLayer(map, opts);
        // Draw tools now live in <MapDrawControls> rendered by the page
        // components — no Mapbox-GL-Draw wiring here.
        if (opts.autoRotate) startRotation(map, opts, userInteractingRef);
        opts.onMapReady?.(map);
    });

    return () => map.remove();
}

// Re-export config options for backward compatibility
export { fullMapOptions, compactGlobeOptions };

export type { ClusteredPinsConfig } from "./mapMarker";
// Re-export types for backward compatibility
export type { MapOptions, PolygonConfig } from "./mapTypes";
