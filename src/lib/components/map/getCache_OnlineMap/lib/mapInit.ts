import mapboxgl from "mapbox-gl";
import maplibregl from "maplibre-gl";
import { MAP_CONFIG } from "./MAP_CONFIG";
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
import { glyphStack } from "$osem/components/map/mapShared/glyphStack";

const defaultSatStyle = MAP_CONFIG.styles.defaultSat;

/**
 * 🔬 MEMORY EXPERIMENT FLAG — one switch, BOTH maps (online + offlinev4),
 * because they share this initializer.
 *
 * `preserveDrawingBuffer: true` makes the browser keep a second copy of the
 * GL framebuffer so it can be read back after compositing. Mapbox ships it
 * FALSE by default and calls that "a performance optimization"; this app
 * turned it on purely so Sentry's replayCanvasIntegration can snapshot the
 * map (see hooks.client.ts — do NOT edit that file, it is shared).
 *
 * WHAT FLIPPING IT COSTS: Sentry session replays record the map as blank.
 * Nothing the user sees or does changes. That makes it a safe A/B.
 *
 * MEASURED 2026-08-11 — INCONCLUSIVE, so this stays `true`.
 * Flipping it to false looked like a −92 MB win on one run, then a repeat
 * with IDENTICAL code came back 100 MB WORSE. Run-to-run variance on this
 * route is ±100–200 MB, which is larger than the effect being tested.
 * An unproven change is not worth a known cost (blank maps in Sentry
 * replays), so it is reverted. See MEMORY_FINDINGS.md.
 */
const MAP_PRESERVE_DRAWING_BUFFER = true;

// ── Hospital markers from OpenStreetMap ──────────────────────────────
// Mapbox vector tiles don't include hospital POI data at low zoom levels.
// We fetch a static baked GeoJSON and add it as a custom layer that renders
// at ALL zoom levels.
//
// This holds a BLOB URL (a short string), never the parsed FeatureCollection.
// It used to hold all 3,005 Canadian hospitals as a live object graph, kept
// for the process lifetime and cloned into Mapbox's worker on every mount.
// See nearbyHospitalsUrl() for why the shape changed.
let _hospitalGeoJSON: string | null = null;

// The APP's "show me my location" action, handed in via opts.onShowMyLocation.
// Module-level for the same reason _hospitalGeoJSON is: the hospital layer is
// re-added on every basemap switch through call sites that don't carry `opts`.
//
// This popup does NOT do geolocation. It used to — a raw
// navigator.geolocation.getCurrentPosition right here — which was a second
// location path that skipped the app's location gate and re-fetched a fix the
// app already had. Now the button just calls the app.
let _onShowMyLocation: (() => void) | null = null;

function addHospitalLayer(map: mapboxgl.Map): void {
    if (!_hospitalGeoJSON) return;
    if (map.getSource("hospitals-osm")) return;

    // Load custom hospital pin icon
    if (!map.hasImage("hospital-pin")) {
        map.loadImage("/mobileAssets/hospitalPin.webp", (err, img) => {
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

    // Callers only reach here after the fetch populated the cache, but the
    // loadImage callback path is async — re-check instead of asserting.
    const hospitalGeoJSON = _hospitalGeoJSON;
    if (!hospitalGeoJSON) return;

    map.addSource("hospitals-osm", {
        type: "geojson",
        // A URL, not an object: Mapbox fetches and parses this inside its own
        // worker, so the main thread never holds a second copy.
        data: hospitalGeoJSON,
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
            // Font chosen from the LIVE style — the two maps have disjoint glyph
            // endpoints, so any literal stack 404s forever on one of them. See
            // glyphStack.ts.
            "text-font": glyphStack(map),
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
            // TIP ON THE SPOT. `hospital-pin` is a teardrop, so its POINT is the
            // coordinate — it must hang from the tip, not float by its middle.
            // Without this, icon-anchor defaults to `center`, which offsets the tip
            // by half an icon-height IN PIXELS; that gap is metres-huge zoomed out
            // and metres-tiny zoomed in, so the pin drifts across the ground as you
            // zoom. Same law as PIN_ANCHOR in pinMarkers.ts.
            "icon-anchor": "bottom",
        },
    });

    // ── Tap hospital → popup with name, distance, your GPS, Call 911 ──
    const openHospitalPopup = (
        hospLng: number,
        hospLat: number,
        name: string,
    ) => {
        const popupId = `hosp-popup-${Date.now()}`;
        // ⛔ RENDERER-CORRECT Popup. This shell is shared by BOTH maps: /map is
        // Mapbox, /offline is MapLibre. A `mapboxgl.Popup` attached to a
        // MapLibre map THROWS from inside Mapbox's own addTo —
        // "TypeError: _requestDomTask is not a function" (a Mapbox-private Map
        // method MapLibre has no equivalent of; verified against the live
        // /offline map 2026-08-20). Ask the live instance which library built
        // it; the renderer stamps its namespace on the canvas container.
        //
        // Same local-check pattern as areaLabels.ts, and deliberately NOT an
        // import of ReTreever's rendererOf.ts: OSEM is UI-only and must not
        // import from `$lib`.
        const PopupCtor = map
            .getCanvasContainer?.()
            ?.className?.includes("maplibregl")
            ? (maplibregl as unknown as { Popup: typeof mapboxgl.Popup }).Popup
            : mapboxgl.Popup;
        const popup = new PopupCtor({ offset: 15, maxWidth: "220px" })
            .setLngLat([hospLng, hospLat])
            .setHTML(
                `<div id="${popupId}" style="font-family:system-ui;font-size:13px;line-height:1.5;color:#222">` +
                    `<strong style="font-size:13px">${name}</strong><br>` +
                    `<span style="display:flex;gap:6px;margin-top:6px">` +
                    `<a href="tel:911" style="padding:4px 10px;background:#dc3545;color:#fff;` +
                    `border-radius:4px;text-decoration:none;font-weight:600;font-size:12px">911</a>` +
                    `<button id="${popupId}-btn" style="padding:4px 10px;background:#2563eb;color:#fff;` +
                    `border:none;border-radius:4px;font-weight:600;font-size:12px;cursor:pointer">My location</button>` +
                    `</span></div>`,
            )
            .addTo(map);

        // "My location" runs the APP's location action — the exact same one
        // the LOCATE tile runs: pan to your blue dot and float the coordinate
        // above it in a pill you can read and share. This popup closes so the
        // pill isn't buried under it.
        setTimeout(() => {
            const btn = document.getElementById(`${popupId}-btn`);
            if (!btn) return;
            btn.addEventListener("click", () => {
                popup.remove();
                _onShowMyLocation?.();
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

/**
 * How far from the worker a hospital is still worth showing.
 *
 * A hospital 1,000 km away is not a safety fact, it is a memory cost. Unlike
 * fires — which have real nuance about wind, size and direction — this is one
 * hard circumference around the worker: within driving distance it matters,
 * past that it does not. 200 km chosen by the user.
 */
const HOSPITAL_RADIUS_KM = 200;

/**
 * Keep only hospitals within HOSPITAL_RADIUS_KM of `anchor`, and return a
 * PLAIN STRING rather than an object.
 *
 * WHY A STRING, AND WHY THIS EXISTS AT ALL:
 * the previous shape loaded all 3,005 Canadian hospitals (393 KB) into a
 * module-level object graph that was never released, and handed that LIVE
 * OBJECT to Mapbox — which clones it again into its worker. So one static
 * file, whose only property per feature is `name`, cost: a 3,005-object graph
 * retained for the process lifetime + a second copy inside the GL worker, on
 * every map mount, forever.
 *
 * Mapbox's own docs say to hand a geojson source a URL instead of an in-memory
 * object precisely to avoid this. We cannot pass the raw file URL (we must
 * filter first), so we pass a Blob URL: Mapbox fetches and parses it in its
 * worker, and OUR heap keeps nothing but a short URL string. The parsed array
 * is dropped the moment this function returns.
 *
 * This is the same lesson as the wildfire v2 rewrite: the win is not making
 * the expensive work faster, it is changing the data shape so the expensive
 * work cannot be expressed.
 */
function nearbyHospitalsUrl(
    raw: unknown,
    anchor: [number, number],
): string | null {
    const fc = raw as {
        features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
    } | null;
    if (!fc?.features?.length) return null;

    const [aLng, aLat] = anchor;
    const near: unknown[] = [];
    for (const f of fc.features) {
        const c = f?.geometry?.coordinates;
        if (!c || c.length < 2) continue;
        // haversineKm is defined just above — same helper the rest of this
        // module uses, so "distance" means one thing across the file.
        if (haversineKm(aLat, aLng, c[1], c[0]) <= HOSPITAL_RADIUS_KM) {
            near.push(f);
        }
    }
    if (!near.length) return null;

    const blob = new Blob(
        [JSON.stringify({ type: "FeatureCollection", features: near })],
        { type: "application/json" },
    );
    return URL.createObjectURL(blob);
}

async function fetchHospitals(
    map: mapboxgl.Map,
    anchor?: [number, number] | null,
): Promise<void> {
    // NO ANCHOR ⇒ NO HOSPITALS. Without a position to measure from there is
    // no such thing as a "nearby" hospital, and loading the whole country to
    // show pins the user cannot act on is exactly the cost being removed.
    if (!anchor) return;

    // Static GeoJSON baked from OpenStreetMap — no live API calls.
    // Refresh file from Overpass yearly if needed.
    try {
        const res = await fetch("/mobileAssets/hospitals-canada.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Parsed, filtered, and dropped inside this scope. The full 3,005-
        // feature array is unreachable the moment this function returns —
        // that is the entire point, so do NOT hoist it to a module variable.
        _hospitalGeoJSON = nearbyHospitalsUrl(await res.json(), anchor);
        if (!_hospitalGeoJSON) return;
        addHospitalLayer(map);
        // No success log: this fired on every map mount and bought nothing —
        // the layer either draws or the catch below shouts. (OSEM is open-core
        // and can't reach the app's verboseLog gate, so the line simply goes.)
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

        // THE SPIN YIELDS TO ANY CAMERA THE USER IS DRIVING.
        //
        // `userInteractingRef` is a hand-kept mirror of "a gesture is in
        // progress", assembled from a LIST of gesture events. A list is the
        // wrong shape for this question: it is only ever as complete as the
        // events someone remembered to enumerate, and the ones that were
        // missing — pinch-zoom and wheel-zoom — are exactly the gestures that
        // felt broken. Pinching set the ref via `touchstart`, then `touchend`
        // cleared it THE MOMENT THE FIRST FINGER LIFTED while the second was
        // still pinching; and a trackpad/wheel zoom never set it at all. With
        // the ref false, this loop re-asserted `zoom: map.getZoom()` every
        // frame and swallowed the zoom the user had just applied. Double-click
        // escaped only because each `easeTo` outruns one frame of re-assert.
        //
        // So ASK MAPBOX INSTEAD. `isMoving()` is true for every camera change
        // it is driving — drag, pinch, wheel, keyboard, dblclick ease, an
        // easeTo from our own code — including gestures that do not exist yet.
        // The ref is kept as a manual OVERRIDE (mousedown holds the globe
        // still before a click lands) but is now one input, not the whole
        // answer.
        const userDrivingCamera =
            userInteractingRef.current ||
            map.isMoving() ||
            map.isZooming() ||
            map.isRotating();

        if (!userDrivingCamera && map.getZoom() < maxSpinZoom && dt > 0) {
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
    // The app's "show me my location" action, used by the hospital popup's GPS
    // button. Stored module-level because the hospital layer is rebuilt on
    // basemap switches through call sites that don't carry `opts`.
    _onShowMyLocation = opts.onShowMyLocation ?? null;
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
        return () => {
            /* no map was created — nothing to clean up */
        };
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
              defaultOptions.initialCenter[0],
              defaultOptions.initialCenter[1],
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
        // WHICH CORNER THE MAPBOX CREDITS LAND IN.
        // Both are mapbox's own controls, and each is placed ONCE, at
        // construction — there is no API to move them afterwards, so CSS
        // cannot do this job: the two live in different DOM containers
        // (`.mapboxgl-ctrl-bottom-left` / `-bottom-right`) chosen right here.
        // Restyling one of those containers only ever moved the whole
        // container, which is why nudging padding could never separate the
        // wordmark from the attribution line.
        //
        // `logoPosition` moves the wordmark. The attribution has no equivalent
        // option, so it is disabled here and re-added by hand below with the
        // position we want.
        ...(opts.creditsSplit
            ? {
                  logoPosition: "bottom-right" as const,
                  attributionControl: false,
              }
            : {}),
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
        //
        // 🔬 MEMORY EXPERIMENT (2026-08-11) — flip to false to measure.
        // Mapbox's documented default is FALSE, "as a performance
        // optimization" (docs.mapbox.com/mapbox-gl-js/api/map). This app
        // overrides it to true for Sentry replay only. Setting it false is
        // the A of the A/B: it costs replay fidelity (maps record blank),
        // NOT correctness. Nothing user-facing changes.
        preserveDrawingBuffer: MAP_PRESERVE_DRAWING_BUFFER,
    });

    // Guard the geojson worker-callback crash path (SourceCache.update →
    // Transform.coveringTiles) — patches the shared Transform prototype off
    // this live instance. Must come right after construction so a source
    // 'data' event landing during a degenerate-camera window can't throw.
    installCoveringTilesGuard(map);

    // Dev-only QA handle: lets browser-automation sessions aim the camera
    // (jumpTo/querySourceFeatures) without synthetic-gesture flailing.
    // Stripped from production builds by the DEV guard.
    if (import.meta.env.DEV) {
        (window as unknown as Record<string, unknown>).__rtMap = map;
    }

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
        // mousedown must freeze the globe SYNCHRONOUSLY. Setting the ref
        // alone is not enough: startRotation's rAF step() only reads it on
        // the NEXT frame, so the frame already scheduled still jumpTo's the
        // camera after the press. On a spinning globe that slides the world
        // a few pixels between mousedown and mouseup — and since mapbox
        // hit-tests the dog layer at mouseup, the dog has moved out from
        // under a perfectly stationary cursor and the click is lost. The
        // icons are smallest exactly where the spin runs (globe zoom), so
        // the drift is bigger than the target. map.stop() cancels the
        // in-flight camera change on the spot, so the world is still when
        // mouseup lands.
        map.on("mousedown", () => {
            userInteractingRef.current = true;
            map.stop();
            opts.onUserInteractionStart?.();
        });
        map.on("mouseup", () => {
            userInteractingRef.current = false;
            opts.onUserInteractionEnd?.();
        });

        // Touch events for mobile
        // Same for touch — a tap on a phone has the same mousedown/mouseup
        // span, and the finger is a bigger, blunter pointer than the mouse.
        //
        // BUT touchstart/touchend ARE NOT A BALANCED PAIR when more than one
        // finger is down. Put two fingers on the glass and mapbox fires
        // touchstart twice; lift them and touchend fires twice — and the FIRST
        // touchend arrives while the second finger is still pinching. Treating
        // it as "the gesture ended" is what let the spin loop resume mid-pinch
        // and fight the zoom. Only release the hold when the LAST finger is
        // gone; `originalEvent.touches` is the live count from the DOM event.
        map.on("touchstart", () => {
            userInteractingRef.current = true;
            map.stop();
            opts.onUserInteractionStart?.();
        });
        map.on("touchend", (e) => {
            if ((e.originalEvent?.touches?.length ?? 0) > 0) return;
            userInteractingRef.current = false;
            opts.onUserInteractionEnd?.();
        });
        // A cancelled touch (call, notification, browser gesture takeover)
        // fires NO touchend. Without this the ref latches true and the globe
        // never spins again for the rest of the session.
        map.on("touchcancel", () => {
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
                if (opts.transparentBackground) {
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

    // Attribution, re-added on the OTHER side from the wordmark.
    // Disabled in the constructor above so it can be positioned; mapbox's
    // terms require it to stay visible, not to sit next to the logo.
    // `compact: false` keeps the credits as a readable line rather than
    // collapsing them behind an (i) button at narrow widths.
    if (opts.creditsSplit) {
        map.addControl(
            new mapboxgl.AttributionControl({ compact: false }),
            "bottom-left",
        );
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
        // Default stays bottom-left. /where opts into bottom-right so the
        // scale joins the zoom readout and the two mapbox credits in ONE
        // corner cluster instead of being stranded diagonally opposite.
        map.addControl(
            scaleControl,
            opts.cornerControlsBottomRight ? "bottom-right" : "bottom-left",
        );
    }

    // ── Zoom readout ───────────────────────────────────────────────────
    // Debug aid, bottom-right beside the Mapbox attribution. The zoom
    // decides whether the globe spins (maxSpinZoom), how big the dogs
    // draw and when clusters split, so reading it off the map directly
    // beats inferring it from the URL hash — which only syncs above
    // maxSpinZoom anyway, and so is blank for the whole spinning range.
    if (opts.showZoomReadout) {
        const readout = document.createElement("div");
        readout.className = "mapboxgl-ctrl rt-zoom-readout";
        readout.setAttribute("aria-hidden", "true");

        const paint = () => {
            readout.textContent = `z${map.getZoom().toFixed(1)}`;
        };
        paint();
        map.on("zoom", paint);
        map.on("move", paint);

        map.addControl(
            {
                onAdd: () => readout,
                onRemove: () => {
                    map.off("zoom", paint);
                    map.off("move", paint);
                    readout.remove();
                },
            },
            "bottom-right",
        );
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
            // Anchor comes from the APP, not from here: OSEM is UI-only and
            // must not reach into mobile stores for a position. No anchor
            // supplied ⇒ fetchHospitals returns immediately and nothing loads.
            // CALLED HERE, not read at construction: the app resolves this
            // from an async-hydrated store, so an anchor captured earlier is
            // the app's fallback position rather than the user's.
            fetchHospitals(map, opts.hospitalAnchor?.() ?? null);
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

/**
 * Internals exposed ONLY for cost tests (hospitalCost.test.ts). Not public
 * API — the hospital filter is an implementation detail, but it is one whose
 * SHAPE must be guarded, since the bug it fixes was invisible to correctness
 * tests. See that file's header.
 */
export const __testing = { nearbyHospitalsUrl, HOSPITAL_RADIUS_KM };
