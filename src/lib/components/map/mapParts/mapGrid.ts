// Audit grid — UTM-derived dot grid.
//
// Produces a deterministic, globally-consistent dot grid inside the current
// viewport. The Earth is tiled into 10km × 10km UTM squares; each square
// holds 100 × 100 hectare plots on a 100m lattice. Plot number = mod 100 of
// the easting and northing indices, packed into a single 1..10,000 integer.
// The nearest duplicate plot number is exactly 10km away, far outside any
// realistic project extent.
//
// Fine mode keeps the hectare anchor dots and adds eight sub-dots per
// hectare at ~33m spacing. Sub-dots inherit the parent plot number plus a
// .1..8 suffix, numbered bottom-left to top-right (skipping the anchor).

import type { FeatureCollection, Point } from "geojson";
import type { Map as MapboxMap } from "mapbox-gl";
import proj4 from "proj4";

export type GridMode = "off" | "standard" | "fine";

export const GRID_HECTARE_SOURCE = "audit-grid-hectare";
export const GRID_FINE_SOURCE = "audit-grid-fine";
export const GRID_HECTARE_LAYER = "audit-grid-hectare-dots";
export const GRID_FINE_LAYER = "audit-grid-fine-dots";
const GRID_MARKER_IMAGE = "grid-marker";
const GRID_MARKER_URL = "/mobileAssets/gridMarker.png";

const HECTARE_SPACING_M = 100;
const FINE_DIVISIONS = 3; // 3×3 per hectare → 8 sub-dots + 1 anchor
const FINE_SPACING_M = HECTARE_SPACING_M / FINE_DIVISIONS;
const VIEWPORT_BUFFER_M = 150; // a little over-draw so pans feel smooth
const MAX_VISIBLE_DOTS = 8000;

// Sub-dot indices in bottom-left → top-right order, skipping the (0,0) anchor.
// Grid coords are (ei, ni) within a 3×3 hectare cell. ni increases northward.
const FINE_ORDER: Array<[number, number]> = [
    [1, 0], [2, 0],
    [0, 1], [1, 1], [2, 1],
    [0, 2], [1, 2], [2, 2],
];

function utmZone(lng: number): number {
    return Math.floor((lng + 180) / 6) + 1;
}

// proj4 defs are cached per zone+hemisphere. Hemispheres get a separate def so
// southern northings use the UTM false-northing (10,000,000) convention —
// that's the canonical source of truth for plot numbers.
const defsReady = new Set<string>();
function ensureDef(zone: number, south: boolean): string {
    const code = `UTM:${zone}${south ? "S" : "N"}`;
    if (defsReady.has(code)) return code;
    const parts = [
        "+proj=utm",
        `+zone=${zone}`,
        south ? "+south" : "",
        "+datum=WGS84",
        "+units=m",
        "+no_defs",
    ].filter(Boolean);
    proj4.defs(code, parts.join(" "));
    defsReady.add(code);
    return code;
}

/**
 * Loads the blue pin marker icon used for hectare dots. Idempotent —
 * `map.loadImage` is harmless to call multiple times, and addImage is
 * guarded by `hasImage`.
 */
function loadMarkerImage(map: MapboxMap): void {
    if (map.hasImage(GRID_MARKER_IMAGE)) return;
    map.loadImage(GRID_MARKER_URL, (err, image) => {
        if (err || !image) {
            console.warn("[mapGrid] marker image failed to load:", err);
            return;
        }
        if (!map.hasImage(GRID_MARKER_IMAGE)) {
            map.addImage(GRID_MARKER_IMAGE, image);
        }
    });
}

export function setupGridSourcesAndLayers(map: MapboxMap): void {
    const empty: FeatureCollection = { type: "FeatureCollection", features: [] };

    loadMarkerImage(map);

    if (!map.getSource(GRID_HECTARE_SOURCE)) {
        map.addSource(GRID_HECTARE_SOURCE, { type: "geojson", data: empty });
    }
    if (!map.getSource(GRID_FINE_SOURCE)) {
        map.addSource(GRID_FINE_SOURCE, { type: "geojson", data: empty });
    }

    // Fine sub-dots — small blue circles. Kept as circles (not icons) so
    // the density cue reads as "lots of little dots" rather than clutter.
    if (!map.getLayer(GRID_FINE_LAYER)) {
        map.addLayer({
            id: GRID_FINE_LAYER,
            type: "circle",
            source: GRID_FINE_SOURCE,
            paint: {
                "circle-radius": 2,
                "circle-color": "#4aa8ff",
                "circle-opacity": 0.75,
                "circle-stroke-color": "#0b3a66",
                "circle-stroke-width": 0.6,
                "circle-stroke-opacity": 0.7,
            },
        });
    }
    // Hectare anchors — blue push-pin icon. Symbol layer so the image
    // stays sharp + lets us use it as a click target. Fallback to a blue
    // circle is handled by painting a tiny base dot at the same source.
    if (!map.getLayer(GRID_HECTARE_LAYER)) {
        map.addLayer({
            id: GRID_HECTARE_LAYER,
            type: "symbol",
            source: GRID_HECTARE_SOURCE,
            layout: {
                "icon-image": GRID_MARKER_IMAGE,
                "icon-size": 0.45,
                "icon-anchor": "bottom",
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
            },
        });
    }
}

function setData(map: MapboxMap, id: string, data: FeatureCollection): void {
    const src = map.getSource(id);
    if (src && "setData" in src) {
        (src as unknown as { setData: (d: FeatureCollection) => void }).setData(data);
    }
}

export function clearGrid(map: MapboxMap): void {
    const empty: FeatureCollection = { type: "FeatureCollection", features: [] };
    setData(map, GRID_HECTARE_SOURCE, empty);
    setData(map, GRID_FINE_SOURCE, empty);
}

export function setGridVisibility(map: MapboxMap, visible: boolean, mode: GridMode): void {
    if (!map.getLayer(GRID_HECTARE_LAYER)) return;
    map.setLayoutProperty(
        GRID_HECTARE_LAYER,
        "visibility",
        visible ? "visible" : "none",
    );
    map.setLayoutProperty(
        GRID_FINE_LAYER,
        "visibility",
        visible && mode === "fine" ? "visible" : "none",
    );
}

export type GridUpdateResult = {
    hectareCount: number;
    fineCount: number;
    tooDense: boolean;
};

export function updateGrid(map: MapboxMap, mode: GridMode): GridUpdateResult {
    if (mode === "off") {
        clearGrid(map);
        return { hectareCount: 0, fineCount: 0, tooDense: false };
    }

    const bounds = map.getBounds();
    if (!bounds) return { hectareCount: 0, fineCount: 0, tooDense: false };

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const centerLng = (sw.lng + ne.lng) / 2;
    const centerLat = (sw.lat + ne.lat) / 2;

    // Zone + hemisphere are picked from the viewport center. At a zone seam
    // the user would just see the grid re-anchor — acceptable since no one is
    // auditing across a 6° longitude boundary in one viewport.
    const zone = utmZone(centerLng);
    const south = centerLat < 0;
    const code = ensureDef(zone, south);

    const fwd = proj4("WGS84", code);
    const inv = proj4(code, "WGS84");

    // UTM bbox from the four viewport corners (projection isn't axis-aligned
    // with lng/lat, so min/max of all four corners is the safe envelope).
    const corners: Array<[number, number]> = [
        [sw.lng, sw.lat],
        [ne.lng, sw.lat],
        [ne.lng, ne.lat],
        [sw.lng, ne.lat],
    ];
    let minE = Infinity, maxE = -Infinity, minN = Infinity, maxN = -Infinity;
    for (const [lng, lat] of corners) {
        const [e, n] = fwd.forward([lng, lat]);
        if (e < minE) minE = e;
        if (e > maxE) maxE = e;
        if (n < minN) minN = n;
        if (n > maxN) maxN = n;
    }
    minE -= VIEWPORT_BUFFER_M;
    maxE += VIEWPORT_BUFFER_M;
    minN -= VIEWPORT_BUFFER_M;
    maxN += VIEWPORT_BUFFER_M;

    // Snap to the hectare lattice (integer multiples of 100m in UTM space).
    const startE = Math.ceil(minE / HECTARE_SPACING_M) * HECTARE_SPACING_M;
    const startN = Math.ceil(minN / HECTARE_SPACING_M) * HECTARE_SPACING_M;

    const cols = Math.max(0, Math.floor((maxE - startE) / HECTARE_SPACING_M) + 1);
    const rows = Math.max(0, Math.floor((maxN - startN) / HECTARE_SPACING_M) + 1);
    const hectareEstimate = cols * rows;
    const fineEstimate = mode === "fine" ? hectareEstimate * 8 : 0;

    if (hectareEstimate + fineEstimate > MAX_VISIBLE_DOTS) {
        clearGrid(map);
        return {
            hectareCount: hectareEstimate,
            fineCount: fineEstimate,
            tooDense: true,
        };
    }

    const hectareFeatures: FeatureCollection<Point>["features"] = [];
    const fineFeatures: FeatureCollection<Point>["features"] = [];

    for (let i = 0; i < cols; i++) {
        const e = startE + i * HECTARE_SPACING_M;
        const eIdx = ((Math.round(e / HECTARE_SPACING_M) % 100) + 100) % 100 + 1;
        for (let j = 0; j < rows; j++) {
            const n = startN + j * HECTARE_SPACING_M;
            const nIdx = ((Math.round(n / HECTARE_SPACING_M) % 100) + 100) % 100 + 1;
            const plot = (eIdx - 1) * 100 + nIdx;

            const [lng, lat] = inv.forward([e, n]);
            hectareFeatures.push({
                type: "Feature",
                geometry: { type: "Point", coordinates: [lng, lat] },
                properties: { plot, zone, hemisphere: south ? "S" : "N" },
            });

            if (mode === "fine") {
                for (let k = 0; k < FINE_ORDER.length; k++) {
                    const [ei, ni] = FINE_ORDER[k];
                    const fe = e + ei * FINE_SPACING_M;
                    const fn = n + ni * FINE_SPACING_M;
                    const [flng, flat] = inv.forward([fe, fn]);
                    fineFeatures.push({
                        type: "Feature",
                        geometry: { type: "Point", coordinates: [flng, flat] },
                        properties: {
                            plot: `${plot}.${k + 1}`,
                            parent: plot,
                            sub: k + 1,
                            zone,
                            hemisphere: south ? "S" : "N",
                        },
                    });
                }
            }
        }
    }

    setData(map, GRID_HECTARE_SOURCE, { type: "FeatureCollection", features: hectareFeatures });
    setData(map, GRID_FINE_SOURCE, { type: "FeatureCollection", features: fineFeatures });

    return {
        hectareCount: hectareFeatures.length,
        fineCount: fineFeatures.length,
        tooDense: false,
    };
}

/**
 * Wires moveend to recompute the grid. Debounced so rapid pans don't thrash
 * proj4. Returns a detach fn that removes the listener and clears the layer.
 */
export function attachGridLifecycle(
    map: MapboxMap,
    getMode: () => GridMode,
    onUpdate?: (r: GridUpdateResult) => void,
): () => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            const mode = getMode();
            if (mode === "off") return;
            onUpdate?.(updateGrid(map, mode));
        }, 80);
    };
    // setStyle() wipes user sources/layers. Re-add when the new style's
    // data settles, then re-render if the grid is still on.
    const onStyleData = () => {
        if (!map.isStyleLoaded()) return;
        setupGridSourcesAndLayers(map);
        const mode = getMode();
        setGridVisibility(map, mode !== "off", mode);
        if (mode !== "off") onUpdate?.(updateGrid(map, mode));
    };

    // Tap a hectare pin → small popup showing the plot number. We use a
    // dynamic import of mapbox-gl so the module stays SSR-safe.
    let popup: { remove: () => void } | null = null;
    const onPinClick = async (
        e: { lngLat: { lng: number; lat: number }; features?: Array<{ properties?: Record<string, unknown> | null }> },
    ) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const plot = feat.properties?.plot;
        if (plot == null) return;
        const mbgl = (await import("mapbox-gl")).default;
        popup?.remove();
        popup = new mbgl.Popup({
            closeButton: false,
            closeOnClick: true,
            closeOnMove: true,
            offset: 18,
            className: "grid-plot-popup",
        })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .setHTML(
                `<div class="grid-plot-popup-inner"><span class="grid-plot-label">PLOT</span><span class="grid-plot-number">${String(plot)}</span></div>`,
            )
            .addTo(map as unknown as Parameters<typeof mbgl.Popup.prototype.addTo>[0]);
    };
    // Cursor feedback — lets the user know pins are tappable.
    const onPinEnter = () => { map.getCanvas().style.cursor = "pointer"; };
    const onPinLeave = () => { map.getCanvas().style.cursor = ""; };

    map.on("moveend", schedule);
    map.on("zoomend", schedule);
    map.on("styledata", onStyleData);
    map.on("click", GRID_HECTARE_LAYER, onPinClick);
    map.on("mouseenter", GRID_HECTARE_LAYER, onPinEnter);
    map.on("mouseleave", GRID_HECTARE_LAYER, onPinLeave);

    return () => {
        if (timer) clearTimeout(timer);
        popup?.remove();
        map.off("moveend", schedule);
        map.off("zoomend", schedule);
        map.off("styledata", onStyleData);
        map.off("click", GRID_HECTARE_LAYER, onPinClick);
        map.off("mouseenter", GRID_HECTARE_LAYER, onPinEnter);
        map.off("mouseleave", GRID_HECTARE_LAYER, onPinLeave);
    };
}
