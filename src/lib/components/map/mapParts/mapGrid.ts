// Audit grid — UTM-positioned dots, Plus Code IDs.
//
// THE GRID HAS TWO JOBS, kept cleanly separate:
//   1. POSITION the dots — done in UTM. Earth is tiled into 10km UTM squares,
//      dots sit on a 100m hectare lattice with a 3×3 sub-lattice (~33m). UTM
//      gives evenly-spaced, square dots on the ground regardless of latitude.
//   2. NAME the dots — done with Google Plus Codes (Open Location Code), which
//      are GLOBALLY UNIQUE. A hectare (big) dot's id is its real 8-char Plus
//      Code (e.g. "87Q6C8C6+", ~100m). This replaces the old "2030"-style
//      numbers, which repeated every 10km and were never globally unique.
//
// SUB-DOTS — the ".1".."9" keypad. Fine mode keeps each hectare's big dot and
// adds a 3×3 keypad of sub-dots at ~33m spacing:
//
//        .7 ── .8 ── .9      top      ← id = <hectareCode>.7 etc.
//        .4 ── .5 ── .6      middle      .5 is the CENTRE — same spot as the
//        .1 ── .2 ── .3      bottom         big dot, so .5 carries the big dot
//
// The ".N" is OUR convention, not part of the Plus Code spec — but it is NOT
// divorced from real GPS: each ".N" is a fixed metres offset from the hectare
// centre (FINE_ORDER below), so it always converts back to exact lat/lng and,
// from there, to a real lookup-able 10-char Plus Code. We store that real
// code too (`code10`), so every sub-dot is independently resolvable. The ".N"
// is the human-readable nickname; `code10` is the legal name.

import type { FeatureCollection, LineString, Point } from "geojson";
import type { Map as MapboxMap } from "mapbox-gl";
import proj4 from "proj4";
import { encodePlusCode } from "./plusCode";

export type GridMode = "off" | "standard" | "fine";

const GRID_HECTARE_SOURCE = "audit-grid-hectare";
const GRID_FINE_SOURCE = "audit-grid-fine";
const GRID_CELLS_SOURCE = "audit-grid-cells";
const GRID_GLOW_SOURCE = "audit-grid-glow";
const GRID_HECTARE_LAYER = "audit-grid-hectare-dots";
const GRID_FINE_LAYER = "audit-grid-fine-dots";
const GRID_CELLS_LAYER = "audit-grid-cell-lines";
const GRID_GLOW_LAYER = "audit-grid-glow-dot";

const HECTARE_SPACING_M = 100;
const FINE_DIVISIONS = 3; // 3×3 keypad per hectare → 9 sub-dots (incl. centre)
const FINE_SPACING_M = HECTARE_SPACING_M / FINE_DIVISIONS;
const VIEWPORT_BUFFER_M = 150; // a little over-draw so pans feel smooth
const MAX_VISIBLE_DOTS = 3000;

// Zoom gates. Below these, the layer just doesn't render — Mapbox culls it
// for free. 100m hectare dots only make sense at z14+; the 33m fine lattice
// needs z16+ before dots stop visually overlapping.
const HECTARE_MINZOOM = 14;
const FINE_MINZOOM = 16;

// The 9-dot keypad, as (col, row) within the hectare's 3×3 cells AND the
// human number. Numbered like a phone keypad: bottom-left = .1, top-right = .9,
// centre = .5. (col, row) are 0..2; row increases NORTHWARD (so .7 is on top).
// The cell is CENTRED on the hectare anchor, so col/row run -1, 0, +1 in
// metres-offset terms (see the offset math in updateGrid).
const FINE_KEYPAD: Array<{ col: number; row: number; n: number }> = [
    { col: 0, row: 0, n: 1 }, // bottom-left
    { col: 1, row: 0, n: 2 }, // bottom-centre
    { col: 2, row: 0, n: 3 }, // bottom-right
    { col: 0, row: 1, n: 4 }, // middle-left
    { col: 1, row: 1, n: 5 }, // CENTRE (coincides with the big dot)
    { col: 2, row: 1, n: 6 }, // middle-right
    { col: 0, row: 2, n: 7 }, // top-left
    { col: 1, row: 2, n: 8 }, // top-centre
    { col: 2, row: 2, n: 9 }, // top-right
];
const FINE_DOTS_PER_HECTARE = FINE_KEYPAD.length; // 9

// Plot ids are Plus Codes. The internal sub-dot form is "<hectare>+.N"
// (e.g. "57R83JQ9+.8"), but for DISPLAY we drop the now-redundant '+' before
// our ".N" suffix → "57R83JQ9.8" (cleaner). A bare hectare code keeps its '+'
// ("57R83JQ9+") because that '+' is part of the real Plus Code.
function displayPlusCode(plot: unknown): string {
    return String(plot).replace("+.", ".");
}

function utmZone(lng: number): number {
    return Math.floor((lng + 180) / 6) + 1;
}

// Build a GeoJSON LineString between two UTM points, projected back to lng/lat.
// Used for the faint fine-mode cell lines.
function utmLine(
    inv: proj4.Converter,
    e1: number,
    n1: number,
    e2: number,
    n2: number,
): FeatureCollection<LineString>["features"][number] {
    const a = inv.forward([e1, n1]);
    const b = inv.forward([e2, n2]);
    return {
        type: "Feature",
        geometry: { type: "LineString", coordinates: [a, b] },
        properties: {},
    };
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

export function setupGridSourcesAndLayers(map: MapboxMap): void {
    const empty: FeatureCollection = {
        type: "FeatureCollection",
        features: [],
    };

    if (!map.getSource(GRID_HECTARE_SOURCE)) {
        map.addSource(GRID_HECTARE_SOURCE, { type: "geojson", data: empty });
    }
    if (!map.getSource(GRID_FINE_SOURCE)) {
        map.addSource(GRID_FINE_SOURCE, { type: "geojson", data: empty });
    }
    if (!map.getSource(GRID_CELLS_SOURCE)) {
        map.addSource(GRID_CELLS_SOURCE, { type: "geojson", data: empty });
    }

    // Faint cell gridlines (fine mode only). They draw the 3×3 cell boxes so
    // the eye reads the lattice and understands each cell is CENTRED on its
    // dot — i.e. the Plus Code square is centred on .5, not cornered on it.
    // Added first so it sits UNDER the dots.
    if (!map.getLayer(GRID_CELLS_LAYER)) {
        map.addLayer({
            id: GRID_CELLS_LAYER,
            type: "line",
            source: GRID_CELLS_SOURCE,
            minzoom: FINE_MINZOOM,
            paint: {
                "line-color": "#ffffff",
                "line-width": 0.5,
                "line-opacity": 0.22,
            },
        });
    }

    // Fine sub-dots (33m lattice). Smaller than hectare anchors so the eye
    // can still pick out the hectare cells. Same white/dark-halo styling as
    // the hectare layer for contrast on any basemap.
    if (!map.getLayer(GRID_FINE_LAYER)) {
        map.addLayer({
            id: GRID_FINE_LAYER,
            type: "circle",
            source: GRID_FINE_SOURCE,
            minzoom: FINE_MINZOOM,
            paint: {
                "circle-radius": 1.6,
                "circle-color": "#ffffff",
                "circle-opacity": 0.85,
                "circle-stroke-width": 0.75,
                "circle-stroke-color": "#000000",
                "circle-stroke-opacity": 0.55,
            },
        });
    }
    // Hectare anchors (100m lattice). Circle layer — radius is in screen
    // pixels so the dots stay the same size at any zoom. `minzoom` below
    // makes Mapbox skip the layer entirely when the user is zoomed out.
    if (!map.getLayer(GRID_HECTARE_LAYER)) {
        map.addLayer({
            id: GRID_HECTARE_LAYER,
            type: "circle",
            source: GRID_HECTARE_SOURCE,
            minzoom: HECTARE_MINZOOM,
            paint: {
                "circle-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    HECTARE_MINZOOM,
                    2,
                    18,
                    3.5,
                ],
                "circle-color": "#ffffff",
                "circle-opacity": 0.95,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#000000",
                "circle-stroke-opacity": 0.6,
            },
        });
    }

    // Snap-glow ring — the heads-up that a thrown plot will land on THIS dot.
    // Gold (the commit accent). Sits ON TOP of every other grid layer and is
    // empty unless setGridGlow() points it at a dot. Added last = topmost.
    if (!map.getSource(GRID_GLOW_SOURCE)) {
        map.addSource(GRID_GLOW_SOURCE, { type: "geojson", data: empty });
    }
    if (!map.getLayer(GRID_GLOW_LAYER)) {
        map.addLayer({
            id: GRID_GLOW_LAYER,
            type: "circle",
            source: GRID_GLOW_SOURCE,
            paint: {
                // Big soft gold halo so the target reads instantly under a finger.
                "circle-radius": 13,
                "circle-color": "#f5d565",
                "circle-opacity": 0.28,
                "circle-stroke-width": 2.5,
                "circle-stroke-color": "#f5d565",
                "circle-stroke-opacity": 0.95,
            },
        });
    }
}

function setData(map: MapboxMap, id: string, data: FeatureCollection): void {
    const src = map.getSource(id);
    if (src && "setData" in src) {
        (src as unknown as { setData: (d: FeatureCollection) => void }).setData(
            data,
        );
    }
}

export function clearGrid(map: MapboxMap): void {
    const empty: FeatureCollection = {
        type: "FeatureCollection",
        features: [],
    };
    setData(map, GRID_HECTARE_SOURCE, empty);
    setData(map, GRID_FINE_SOURCE, empty);
    setData(map, GRID_CELLS_SOURCE, empty);
    setData(map, GRID_GLOW_SOURCE, empty);
}

// A snapped grid dot: where the plot will land + the IDs to stamp on it.
export type GridDot = {
    lng: number;
    lat: number;
    plusCode: string; // friendly id ("87Q6C8C6+" or "87Q6C8C6+.5")
    code10: string; // real lookup-able 10-char Plus Code for the exact point
    sub: number | null; // 1..9 for a sub-dot, null for a bare hectare dot
};

// Find the grid dot nearest to (lng,lat) within `maxMeters` ground distance,
// or null if none is that close (so the caller can drop free). Uses the SAME
// UTM lattice + keypad math as updateGrid — the dots aren't stored, they're
// derived, so we snap to the lattice analytically (no nearest-neighbour scan).
//
// `mode` decides the candidate set: "fine" snaps to the 3×3 keypad (~33m),
// "standard" snaps to hectare centres (~100m). maxMeters is the magnet radius
// — small (a few m) so a plot only snaps when the user is clearly aiming at a
// dot; zooming in lets them place between dots because the radius is in METRES,
// not pixels.
export function nearestGridDot(
    lng: number,
    lat: number,
    mode: GridMode,
    maxMeters: number,
): GridDot | null {
    if (mode === "off") return null;
    const zone = utmZone(lng);
    const south = lat < 0;
    const code = ensureDef(zone, south);
    const fwd = proj4("WGS84", code);
    const inv = proj4(code, "WGS84");

    const [e, n] = fwd.forward([lng, lat]);
    // Nearest hectare anchor (the cell centre = the .5 / big dot).
    const he = Math.round(e / HECTARE_SPACING_M) * HECTARE_SPACING_M;
    const hn = Math.round(n / HECTARE_SPACING_M) * HECTARE_SPACING_M;

    let targetE = he;
    let targetN = hn;
    let sub: number | null = null;

    if (mode === "fine") {
        // Snap to the nearest keypad cell within the hectare: offset col/row
        // are -1,0,+1 × FINE_SPACING_M from the anchor. Clamp to the 3×3 so a
        // point past the hectare edge belongs to the NEXT hectare's anchor
        // (recompute against that anchor for a clean result).
        const col = clampStep(Math.round((e - he) / FINE_SPACING_M));
        const row = clampStep(Math.round((n - hn) / FINE_SPACING_M));
        targetE = he + col * FINE_SPACING_M;
        targetN = hn + row * FINE_SPACING_M;
        sub = keypadNumber(col, row);
    }

    const [dLng, dLat] = inv.forward([targetE, targetN]);
    // Ground distance from the query point to the candidate dot (UTM metres).
    const dist = Math.hypot(e - targetE, n - targetN);
    if (dist > maxMeters) return null;

    const hectareCode = encodePlusCode(dLat, dLng, 8);
    const code10 = encodePlusCode(dLat, dLng, 10);
    return {
        lng: dLng,
        lat: dLat,
        plusCode: sub == null ? hectareCode : `${hectareCode}.${sub}`,
        code10,
        sub,
    };
}

// Clamp a keypad step to the 3×3 (-1..+1). Past the edge, the point is closer
// to a neighbouring hectare's anchor — Math.round on the anchor already picked
// the nearest hectare, so clamping keeps us inside ITS keypad.
function clampStep(s: number): number {
    return s < -1 ? -1 : s > 1 ? 1 : s;
}
// (col,row) in -1..+1 → keypad number 1..9 (bottom-left .1, top-right .9).
function keypadNumber(col: number, row: number): number {
    return (row + 1) * 3 + (col + 1) + 1;
}

// Point the gold snap-glow at a dot, or pass null to hide it. Takes only the
// fields the glow renders (lng/lat/plusCode), so any GridDot — or the trimmed
// shape the ruler passes back — satisfies it.
export function setGridGlow(
    map: MapboxMap,
    dot: { lng: number; lat: number; plusCode: string } | null,
): void {
    const fc: FeatureCollection<Point> = {
        type: "FeatureCollection",
        features: dot
            ? [
                  {
                      type: "Feature",
                      geometry: {
                          type: "Point",
                          coordinates: [dot.lng, dot.lat],
                      },
                      properties: { plusCode: dot.plusCode },
                  },
              ]
            : [],
    };
    setData(map, GRID_GLOW_SOURCE, fc);
}

export function setGridVisibility(
    map: MapboxMap,
    visible: boolean,
    mode: GridMode,
): void {
    if (!map.getLayer(GRID_HECTARE_LAYER)) return;
    map.setLayoutProperty(
        GRID_HECTARE_LAYER,
        "visibility",
        visible ? "visible" : "none",
    );
    const fineVisible = visible && mode === "fine";
    map.setLayoutProperty(
        GRID_FINE_LAYER,
        "visibility",
        fineVisible ? "visible" : "none",
    );
    // Cell lines only in fine (10-per-hectare) mode.
    map.setLayoutProperty(
        GRID_CELLS_LAYER,
        "visibility",
        fineVisible ? "visible" : "none",
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
    let minE = Infinity,
        maxE = -Infinity,
        minN = Infinity,
        maxN = -Infinity;
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

    const cols = Math.max(
        0,
        Math.floor((maxE - startE) / HECTARE_SPACING_M) + 1,
    );
    const rows = Math.max(
        0,
        Math.floor((maxN - startN) / HECTARE_SPACING_M) + 1,
    );
    const hectareEstimate = cols * rows;
    const fineEstimate = mode === "fine" ? hectareEstimate * FINE_DOTS_PER_HECTARE : 0;

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
    const cellFeatures: FeatureCollection<LineString>["features"] = [];

    // Half a hectare on each side — the keypad is centred on the anchor, so
    // its outer edge is ±1.5 sub-cells = ±50m. The cell box spans the hectare.
    const HALF = (FINE_SPACING_M * FINE_DIVISIONS) / 2; // 50m

    for (let i = 0; i < cols; i++) {
        const e = startE + i * HECTARE_SPACING_M;
        for (let j = 0; j < rows; j++) {
            const n = startN + j * HECTARE_SPACING_M;

            // Big dot = hectare anchor = the cell CENTRE (= sub-dot .5).
            // Its id is the real 8-char Plus Code for this point.
            const [lng, lat] = inv.forward([e, n]);
            const hectareCode = encodePlusCode(lat, lng, 8);
            hectareFeatures.push({
                type: "Feature",
                geometry: { type: "Point", coordinates: [lng, lat] },
                properties: {
                    plot: hectareCode, // `plot` = the displayed id (popup reads this)
                    plusCode: hectareCode,
                    zone,
                    hemisphere: south ? "S" : "N",
                },
            });

            if (mode === "fine") {
                for (const { col, row, n: num } of FINE_KEYPAD) {
                    // Keypad is CENTRED on the anchor: col/row 0..2 → -1,0,+1.
                    const fe = e + (col - 1) * FINE_SPACING_M;
                    const fn = n + (row - 1) * FINE_SPACING_M;
                    const [flng, flat] = inv.forward([fe, fn]);
                    // Friendly id = <hectareCode>.N ; code10 = the real,
                    // lookup-able 10-char Plus Code for this exact sub-dot.
                    const code10 = encodePlusCode(flat, flng, 10);
                    fineFeatures.push({
                        type: "Feature",
                        geometry: { type: "Point", coordinates: [flng, flat] },
                        properties: {
                            plot: `${hectareCode}.${num}`,
                            parent: hectareCode,
                            sub: num,
                            code10,
                            zone,
                            hemisphere: south ? "S" : "N",
                        },
                    });
                }

                // Faint 3×3 cell box: 4 vertical + 4 horizontal lines at the
                // sub-cell boundaries (±HALF and the two interior thirds).
                const thirds = [-HALF, -HALF / 3, HALF / 3, HALF];
                for (const off of thirds) {
                    // vertical line (constant easting)
                    cellFeatures.push(
                        utmLine(inv, e + off, n - HALF, e + off, n + HALF),
                    );
                    // horizontal line (constant northing)
                    cellFeatures.push(
                        utmLine(inv, e - HALF, n + off, e + HALF, n + off),
                    );
                }
            }
        }
    }

    setData(map, GRID_HECTARE_SOURCE, {
        type: "FeatureCollection",
        features: hectareFeatures,
    });
    setData(map, GRID_FINE_SOURCE, {
        type: "FeatureCollection",
        features: fineFeatures,
    });
    setData(map, GRID_CELLS_SOURCE, {
        type: "FeatureCollection",
        features: cellFeatures,
    });

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
    // Tapping the "Plot" button in a grid dot's popup fires this with the dot's
    // exact location + Plus Code id. OSEM stays UI-only — the proprietary host
    // (MapDrawControls/plotDrop) owns what "throw a plot" actually does.
    onPlotFromDot?: (dot: {
        lng: number;
        lat: number;
        plusCode: string;
    }) => void,
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

    // Tap a hectare or fine pin → small popup showing the plot number.
    // We use a dynamic import of mapbox-gl so the module stays SSR-safe.
    let popup: { remove: () => void } | null = null;
    const onPinClick = async (e: {
        lngLat: { lng: number; lat: number };
        features?: Array<{ properties?: Record<string, unknown> | null }>;
    }) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const plot = feat.properties?.plot;
        if (plot == null) return;
        // The dot's EXACT location (its own geometry), not the tap point — so a
        // plot thrown from here lands dead-centre on the dot. Geometry isn't in
        // the narrow handler type, so read it via a loose cast.
        const coords = (
            feat as { geometry?: { coordinates?: number[] } }
        ).geometry?.coordinates;
        const dotLng = Array.isArray(coords) ? coords[0] : e.lngLat.lng;
        const dotLat = Array.isArray(coords) ? coords[1] : e.lngLat.lat;
        const plusCode = String(plot);

        const mbgl = (await import("mapbox-gl")).default;
        popup?.remove();
        // Friendly display id + a "throw a plot here" button (quality icon).
        // The button carries no handler inline — we attach it after the popup
        // mounts (popup HTML is a string, so we query the node and bind).
        popup = new mbgl.Popup({
            closeButton: false,
            closeOnClick: true,
            closeOnMove: true,
            offset: 18,
            className: "grid-plot-popup",
        })
            .setLngLat([dotLng, dotLat])
            .setHTML(
                `<div class="grid-plot-popup-inner">` +
                    `<span class="grid-plot-number">${displayPlusCode(plusCode)}</span>` +
                    (onPlotFromDot
                        ? `<button type="button" class="grid-plot-btn" aria-label="Throw a Quality 704 plot on this grid point">` +
                          `<img src="/mobileAssets/animations/quality_icon/12qualityIcon.webp" alt="" class="grid-plot-btn-icon" />` +
                          `</button>`
                        : "") +
                    `</div>`,
            )
            .addTo(
                map as unknown as Parameters<
                    typeof mbgl.Popup.prototype.addTo
                >[0],
            );

        // Bind the Plot button now that the popup DOM exists.
        if (onPlotFromDot) {
            const el = (
                popup as unknown as { getElement?: () => HTMLElement | undefined }
            ).getElement?.();
            const btn = el?.querySelector(".grid-plot-btn");
            btn?.addEventListener("click", (ev) => {
                ev.stopPropagation();
                popup?.remove();
                onPlotFromDot({ lng: dotLng, lat: dotLat, plusCode });
            });
        }
    };
    // Cursor feedback — lets the user know pins are tappable.
    const onPinEnter = () => {
        map.getCanvas().style.cursor = "pointer";
    };
    const onPinLeave = () => {
        map.getCanvas().style.cursor = "";
    };

    map.on("moveend", schedule);
    map.on("zoomend", schedule);
    map.on("styledata", onStyleData);
    map.on("click", GRID_HECTARE_LAYER, onPinClick);
    map.on("click", GRID_FINE_LAYER, onPinClick);
    map.on("mouseenter", GRID_HECTARE_LAYER, onPinEnter);
    map.on("mouseleave", GRID_HECTARE_LAYER, onPinLeave);
    map.on("mouseenter", GRID_FINE_LAYER, onPinEnter);
    map.on("mouseleave", GRID_FINE_LAYER, onPinLeave);

    return () => {
        if (timer) clearTimeout(timer);
        popup?.remove();
        map.off("moveend", schedule);
        map.off("zoomend", schedule);
        map.off("styledata", onStyleData);
        map.off("click", GRID_HECTARE_LAYER, onPinClick);
        map.off("click", GRID_FINE_LAYER, onPinClick);
        map.off("mouseenter", GRID_HECTARE_LAYER, onPinEnter);
        map.off("mouseleave", GRID_HECTARE_LAYER, onPinLeave);
        map.off("mouseenter", GRID_FINE_LAYER, onPinEnter);
        map.off("mouseleave", GRID_FINE_LAYER, onPinLeave);
    };
}
