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
import { safeEase } from "./safeEase";
import { safeJumpTo } from "./safeMap";
import { installCoveringTilesGuard } from "./safeMarker";
import { isCoord, toCoordFromArray } from "./coord";

const defaultSatStyle = MAP_CONFIG.styles.defaultSat;

// ── Hospital markers from OpenStreetMap ──────────────────────────────
// Mapbox vector tiles don't include hospital POI data at low zoom levels.
// We fetch from Overpass API once and add as a custom GeoJSON layer that
// renders at ALL zoom levels. Cached so basemap switches can re-add it.
let _hospitalGeoJSON: GeoJSON.FeatureCollection | null = null;

function addHospitalLayer(map: mapboxgl.Map): void {
    if (!_hospitalGeoJSON || _hospitalGeoJSON.features.length === 0) return;
    if (map.getSource("hospitals-osm")) return;

    // Load custom hospital pin icon
    if (!map.hasImage("hospital-pin")) {
        map.loadImage("/mobileAssets/hospitalPin.png", (err, img) => {
            if (err || !img) {
                console.warn(
                    "[Hospitals] Failed to load hospitalPin.png:",
                    err,
                );
                return;
            }
            map.addImage("hospital-pin", img);
            addHospitalLayers(map);
        });
        return;
    }
    addHospitalLayers(map);
}

function addHospitalLayers(map: mapboxgl.Map): void {
    if (map.getSource("hospitals-osm")) return;

    map.addSource("hospitals-osm", {
        type: "geojson",
        data: _hospitalGeoJSON!,
        cluster: true,
        clusterRadius: 120,
        clusterMaxZoom: 11,
    });

    // Clustered hospitals — show the same hospital icon. In an emergency
    // the user zooms in anyway; the point is "there's a hospital here".
    map.addLayer({
        id: "hospitals-osm-cluster",
        type: "symbol",
        source: "hospitals-osm",
        filter: ["has", "point_count"],
        minzoom: 6.5,
        layout: {
            "icon-image": "hospital-pin",
            "icon-size": 0.47,
            "icon-allow-overlap": true,
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 10,
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
            "text-offset": [-0.3, 0.4],
            "text-anchor": "top-right",
            "text-allow-overlap": true,
        },
        paint: {
            "text-color": "#ffffff",
            "text-halo-color": "rgba(0, 0, 0, 0.5)",
            "text-halo-width": 0.8,
        },
    });

    // Individual (unclustered) hospital icon — smaller, not overlapping.
    map.addLayer({
        id: "hospitals-osm-icon",
        type: "symbol",
        source: "hospitals-osm",
        filter: ["!", ["has", "point_count"]],
        minzoom: 6.5,
        maxzoom: 22,
        layout: {
            "icon-image": "hospital-pin",
            "icon-size": 0.47,
            "icon-allow-overlap": false,
        },
    });

    // ── Tap hospital → popup with name, distance, your GPS, Call 911 ──
    const openHospitalPopup = (
        hospLng: number,
        hospLat: number,
        name: string,
    ) => {
        const popupId = `hosp-popup-${Date.now()}`;
        new mapboxgl.Popup({ offset: 15, maxWidth: "220px" })
            .setLngLat([hospLng, hospLat])
            .setHTML(
                `<div id="${popupId}" style="font-family:system-ui;font-size:13px;line-height:1.5;color:#222">` +
                    `<strong style="font-size:13px">${name}</strong><br>` +
                    `<span id="${popupId}-gps"></span>` +
                    `<span style="display:flex;gap:6px;margin-top:6px">` +
                    `<a href="tel:911" style="padding:4px 10px;background:#dc3545;color:#fff;` +
                    `border-radius:4px;text-decoration:none;font-weight:600;font-size:12px">911</a>` +
                    `<button id="${popupId}-btn" style="padding:4px 10px;background:#2563eb;color:#fff;` +
                    `border:none;border-radius:4px;font-weight:600;font-size:12px;cursor:pointer">Your GPS loc.</button>` +
                    `</span></div>`,
            )
            .addTo(map);

        // Wire up the GPS button after popup is in the DOM
        setTimeout(() => {
            const btn = document.getElementById(`${popupId}-btn`);
            const slot = document.getElementById(`${popupId}-gps`);
            if (!btn || !slot) return;

            btn.addEventListener("click", () => {
                if (!navigator.geolocation) {
                    slot.innerHTML = `<span style="color:#888;font-size:11px">Not available</span><br>`;
                    return;
                }
                btn.textContent = "...";
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const uLat = pos.coords.latitude;
                        const uLng = pos.coords.longitude;
                        const km = haversineKm(uLat, uLng, hospLat, hospLng);
                        const distStr =
                            km < 1
                                ? `${Math.round(km * 1000)} m`
                                : `${Math.round(km)} km`;
                        const latDir = uLat >= 0 ? "N" : "S";
                        const lngDir = uLng >= 0 ? "E" : "W";
                        const gps = `${Math.abs(uLat).toFixed(2)}${latDir}, ${Math.abs(uLng).toFixed(2)}${lngDir}`;
                        slot.innerHTML =
                            `<span style="color:#555">~${distStr} away</span><br>` +
                            `<span style="color:#444;font-size:11px">You: <b>${gps}</b></span><br>`;
                        btn.remove();
                    },
                    () => {
                        slot.innerHTML = `<span style="color:#888;font-size:11px">Check Settings &gt; Location</span><br>`;
                        btn.textContent = "GPS";
                    },
                    { enableHighAccuracy: true, timeout: 5000 },
                );
            });
        }, 0);
    };

    map.on("click", "hospitals-osm-icon", (e) => {
        const feat = e.features?.[0];
        if (!feat || feat.geometry.type !== "Point") return;
        const coord = toCoordFromArray(
            (feat.geometry as GeoJSON.Point).coordinates,
        );
        if (!coord) return;
        openHospitalPopup(coord[0], coord[1], feat.properties?.name ?? "Hospital");
    });

    // Cluster click → open popup for one hospital in the cluster.
    // In an emergency we don't gate care on zoom level.
    map.on("click", "hospitals-osm-cluster", (e) => {
        const feat = e.features?.[0];
        if (!feat || feat.geometry.type !== "Point") return;
        const coord = toCoordFromArray(
            (feat.geometry as GeoJSON.Point).coordinates,
        );
        if (!coord) return;
        const clusterId = feat.properties?.cluster_id;
        const src = map.getSource("hospitals-osm") as
            | mapboxgl.GeoJSONSource
            | undefined;
        if (!src || clusterId == null) {
            openHospitalPopup(coord[0], coord[1], "Hospital");
            return;
        }
        src.getClusterLeaves(clusterId, 1, 0, (err, leaves) => {
            const name =
                !err && leaves?.[0]?.properties?.name
                    ? leaves[0].properties.name
                    : "Hospital";
            openHospitalPopup(coord[0], coord[1], name);
        });
    });

    map.on("mouseenter", "hospitals-osm-cluster", () => {
        map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "hospitals-osm-cluster", () => {
        map.getCanvas().style.cursor = "";
    });
    map.on("mouseenter", "hospitals-osm-icon", () => {
        map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "hospitals-osm-icon", () => {
        map.getCanvas().style.cursor = "";
    });
}

function haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchHospitals(map: mapboxgl.Map): Promise<void> {
    // Static GeoJSON baked from OpenStreetMap — no live API calls.
    // Refresh file from Overpass yearly if needed.
    try {
        const res = await fetch("/mobileAssets/hospitals-canada.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        _hospitalGeoJSON = await res.json();
        addHospitalLayer(map);
        console.log(
            `[Hospitals] Loaded ${_hospitalGeoJSON?.features.length ?? 0} hospitals`,
        );
    } catch (err) {
        // Page-unmount race: SvelteKit cancels in-flight fetches when the
        // user leaves /mobile/map, then mapbox's `idle` event fires AFTER
        // teardown and re-calls us. The fetch rejects with "Failed to fetch"
        // — that's not a real error, hospitals will reload on next mount.
        if ((err as Error)?.message === "Failed to fetch") return;
        console.error("[Hospitals] Failed to load hospitals-canada.json:", err);
    }
}

// Helper to start globe auto-rotation
function startRotation(
    map: mapboxgl.Map,
    options: MapOptions,
    userInteractingRef: { current: boolean },
): void {
    const degreesPerSecond =
        options.rotationSpeed ?? MAP_CONFIG.globe.rotationSpeed;
    const maxSpinZoom = MAP_CONFIG.globe.maxSpinZoom; // Stop rotating at zoom 4 and above

    // Manual rAF spin instead of easeTo. mapbox 3.x globe projection has an
    // internal recursion in setLocationAtPoint → set center →
    // _updateZoomFromElevation that easeTo triggers on every per-frame update.
    // jumpTo skips setLocationAtPoint entirely and just sets center, so no
    // elevation anchor recompute, no stack overflow.
    let raf = 0;
    let lastT = 0;
    // Latch so a corrupt camera is reset once, not every frame.
    let cameraRecovered = false;

    function step(t: number) {
        if (!map) return;
        const dt = lastT ? Math.min((t - lastT) / 1000, 0.1) : 0;
        lastT = t;

        if (
            !userInteractingRef.current &&
            map.getZoom() < maxSpinZoom &&
            dt > 0
        ) {
            const center = map.getCenter();
            const centerOk =
                Number.isFinite(center.lng) && Number.isFinite(center.lat);

            if (centerOk) {
                cameraRecovered = false; // healthy — re-arm recovery
                center.lng -= degreesPerSecond * dt;
                safeJumpTo(map, {
                    center: [center.lng, center.lat],
                    zoom: map.getZoom(),
                });
            } else if (!cameraRecovered) {
                // Corrupt camera: map.getCenter() returned NaN. Without this
                // guard, step() re-reads the NaN center every frame and
                // spams safeJumpTo's rejection ~60×/s forever (the runaway
                // "[safeMap] rejected jumpTo: center is not finite" loop).
                // Reset once to the configured initial view (or a world
                // default); the next frame sees a finite center and resumes.
                cameraRecovered = true;
                const fallback = options.initialCenter;
                safeJumpTo(map, {
                    center:
                        fallback &&
                        Number.isFinite(fallback[0]) &&
                        Number.isFinite(fallback[1])
                            ? fallback
                            : [0, 20],
                    zoom: Number.isFinite(options.initialZoom)
                        ? (options.initialZoom as number)
                        : 1.5,
                });
            }
        }
        raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);

    map.once("remove", () => {
        if (raf) cancelAnimationFrame(raf);
    });
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

    // Construction-time NaN guard. parseMapHash can return garbage from a
    // malformed URL hash; callers may pass a stale-store camera carrying
    // NaN/undefined. The watchdog below recovers AFTER the fact, but
    // mapbox-gl's internal mousemove handler can fire on a degenerate
    // transform before the watchdog runs — throwing "Invalid LngLat object:
    // (NaN, NaN)". Validate here so the transform is born finite.
    const safeCenter: [number, number] = isCoord(opts.initialCenter)
        ? ([opts.initialCenter[0], opts.initialCenter[1]] as [number, number])
        : ([
              defaultOptions.initialCenter![0],
              defaultOptions.initialCenter![1],
          ] as [number, number]);
    const safeZoom: number = Number.isFinite(opts.initialZoom)
        ? (opts.initialZoom as number)
        : (defaultOptions.initialZoom as number);
    if (
        safeCenter[0] !== opts.initialCenter?.[0] ||
        safeCenter[1] !== opts.initialCenter?.[1] ||
        safeZoom !== opts.initialZoom
    ) {
        console.warn("[mapInit] degenerate initial camera — using defaults", {
            got: { center: opts.initialCenter, zoom: opts.initialZoom },
            using: { center: safeCenter, zoom: safeZoom },
        });
    }

    const map = new mapboxgl.Map({
        container,
        style: opts.style || defaultSatStyle,
        // Optional request rewriter/blocker (air-gapped offline maps pass a guard
        // that rejects every non-local URL — see /mobile/offlinev4).
        ...(opts.transformRequest
            ? { transformRequest: opts.transformRequest }
            : {}),
        hash: false,
        center: safeCenter,
        zoom: safeZoom,
        projection: opts.globeProjection ? "globe" : "mercator",
        interactive: true,
        pitch: 0,
        bearing: 0,
        // Keep the GL drawing buffer after compositing so Sentry's
        // replayCanvasIntegration (wired in hooks.client.ts) can snapshot the
        // map into session replays — a WebGL canvas reads back empty once the
        // buffer is swapped, so without this the map records as blank white.
        // Costs a small amount of extra GPU memory + a per-frame copy on every
        // map; accepted to make real-user map UX visible in replays.
        preserveDrawingBuffer: true,
    });

    // Guard the geojson worker-callback crash path (SourceCache.update →
    // Transform.coveringTiles) — patches the shared Transform prototype off
    // this live instance. Must come right after construction so a source
    // 'data' event landing during a degenerate-camera window can't throw.
    installCoveringTilesGuard(map);

    // Construction-time handle — fires BEFORE the style loads (onMapReady
    // waits for `load`, which can hang on a weak connection). See MapOptions.
    opts.onMapCreated?.(map);

    // Lock to top-down view — disable pitch and bearing drag handlers
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    // ── WebGL context recovery (iOS WebView) ────────────────────────────
    // iOS / iPadOS WebKit reclaims a WebView's WebGL context under memory
    // pressure or after a heavy layout reflow — e.g. a popover or the
    // software keyboard opening over the map. When that happens the map
    // canvas goes blank white and never comes back: mapbox-gl does not
    // rebuild the GL context on its own, and the browser only sends a
    // `webglcontextrestored` event if `preventDefault()` was called on the
    // loss. We do exactly that, then force a resize + repaint on restore so
    // tiles redraw. Desktop browsers effectively never fire these events,
    // so this is a no-op everywhere except native iOS — which is the only
    // place the white-out reproduces.
    const glCanvas = map.getCanvas();
    const onContextLost = (e: Event) => {
        e.preventDefault();
        console.warn("[mapInit] WebGL context lost — awaiting restore");
    };
    const onContextRestored = () => {
        console.warn("[mapInit] WebGL context restored — repainting map");
        map.resize();
        map.triggerRepaint();
    };
    glCanvas.addEventListener("webglcontextlost", onContextLost, false);
    glCanvas.addEventListener("webglcontextrestored", onContextRestored, false);

    // ── Camera / canvas health watchdog ─────────────────────────────────
    // A pointer or resize event landing while the map container is
    // momentarily zero-sized — an overlay popover or the iOS software
    // keyboard reflowing the layout — makes mapbox-gl's projection math
    // divide by zero. The result is either a NaN camera transform or a
    // 0×0 GL canvas; both render the map blank white. mapbox-gl throws
    // "Invalid LngLat object: (NaN, NaN)" (swallowed as benign in
    // app.html) and never repairs itself — and the auto-rotate step()
    // loop's recovery path below does NOT run on the non-rotating mobile
    // work map. This watchdog re-checks the map a few times a second and
    // repairs whichever degenerate state it finds: resize the canvas back
    // to its container, and jump the camera to the last finite center.
    let lastGoodCenter: [number, number] = safeCenter;
    let lastGoodZoom = safeZoom;
    map.on("moveend", () => {
        const c = map.getCenter();
        if (Number.isFinite(c.lng) && Number.isFinite(c.lat)) {
            lastGoodCenter = [c.lng, c.lat];
            const z = map.getZoom();
            if (Number.isFinite(z)) lastGoodZoom = z;
        }
    });
    const healthWatchdog = window.setInterval(() => {
        // The camera is "bad" if center OR zoom is non-finite — a NaN zoom
        // (from a fly/ease animation started with a garbage value) makes
        // _constrain → unproject return (NaN, NaN), which renderGuard then
        // suppresses every frame, so the map never draws → blank white.
        let cameraBad = false;
        try {
            const c = map.getCenter();
            const z = map.getZoom();
            cameraBad =
                !Number.isFinite(c.lng) ||
                !Number.isFinite(c.lat) ||
                !Number.isFinite(z);
        } catch {
            // getCenter()/getZoom() can themselves throw when the transform
            // is fully degenerate — treat that as "bad" and recover.
            cameraBad = true;
        }
        const canvasEl = map.getCanvas();
        const cont = map.getContainer();
        const canvasDead =
            cont.clientWidth > 0 &&
            cont.clientHeight > 0 &&
            (canvasEl.clientWidth === 0 || canvasEl.clientHeight === 0);
        if (cameraBad) {
            console.warn(
                "[mapInit] camera transform degenerate — restoring last good view",
            );
            // safeJumpTo cancels the in-flight NaN animation and pins the
            // camera back to finite values, so _render stops throwing and
            // rendering resumes.
            safeJumpTo(map, { center: lastGoodCenter, zoom: lastGoodZoom });
        }
        if (cameraBad || canvasDead) {
            map.resize();
            map.triggerRepaint();
        }
    }, 400);

    // Force terrain off. On globe projection, any DEM source causes mapbox-gl's
    // setLocationAtPoint → set center → _updateZoomFromElevation → getAtPoint
    // chain to recurse and blow the stack during animated easeTo (e.g. spin).
    map.on("style.load", () => {
        map.setTerrain(null);
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
    if (opts.globeProjection || opts.hideLabels || opts.showHospitalMarkers) {
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
                        // codestyle-allow-swallow: hiding a label layer is cosmetic; a style not yet loaded / missing layer id just leaves it visible
                    }
                }
            }

            // Re-add cached hospital layer after basemap switch.
            if (opts.showHospitalMarkers) {
                addHospitalLayer(map);
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
        if (z > softMax) safeEase(map, { zoom: softMax, duration: easeMs });
        else if (z < softMin) safeEase(map, { zoom: softMin, duration: easeMs });
    });

    map.on("load", async () => {
        map.resize();
        if (opts.showHospitalMarkers) {
            fetchHospitals(map);
        }
        if (opts.loadMarkers) await addMarkersLayer(map, opts);
        // Draw tools now live in <MapDrawControls> rendered by the page
        // components — no Mapbox-GL-Draw wiring here.
        if (opts.autoRotate) startRotation(map, opts, userInteractingRef);
        opts.onMapReady?.(map);
    });

    return () => {
        window.clearInterval(healthWatchdog);
        glCanvas.removeEventListener("webglcontextlost", onContextLost);
        glCanvas.removeEventListener("webglcontextrestored", onContextRestored);
        map.remove();
    };
}

// Re-export config options for backward compatibility
export { fullMapOptions, compactGlobeOptions };

export type { ClusteredPinsConfig } from "./mapMarker";
// Re-export types for backward compatibility
export type { MapOptions, PolygonConfig } from "./mapTypes";
