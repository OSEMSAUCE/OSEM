// Audit grid — dots ID'd by REAL Google Plus Codes (Open Location Code).
//
// EVERY dot's id IS its own real, Google-able Plus Code — no nicknames, no ".N".
// Two zoom levels, each labelled at its matching Plus Code precision:
//   • BIG dots — one per plot/hectare, ~98m apart. Label = the +2 / 10-char
//     code, e.g. "87G3J24G+62" (~14m cell; the dot sits on its centre).
//   • SMALL dots (fine mode) — a ring at ~28m. Label = the +2 / 10-char code
//     too, e.g. "87G3J24G+62". SAME precision as the big dots: a dot is a
//     snapped lattice position, so a +3 code would claim ~3.5m accuracy the
//     placement never had. See gridCodeHonesty.test.ts.
//
// Plus Codes are globally unique, so the ids never repeat (the old "2030"-style
// numbers repeated every 10km). `sub` (1..9) is kept only to drive the snap
// radius / ring layout — it is NOT part of any id.

import type { FeatureCollection, LineString, Point } from "geojson";
import type {
    DataDrivenPropertyValueSpecification,
    Map as MapboxMap,
} from "mapbox-gl";
import { encodePlusCode } from "./plusCode";
import { safeGetBounds } from "./safeMap";

export type GridMode = "off" | "standard" | "fine";

const GRID_HECTARE_SOURCE = "audit-grid-hectare";
const GRID_FINE_SOURCE = "audit-grid-fine";
const GRID_CELLS_SOURCE = "audit-grid-cells";
const GRID_GLOW_SOURCE = "audit-grid-glow";
const GRID_GLOW_ORANGE_SOURCE = "audit-grid-glow-orange";
const GRID_HECTARE_LAYER = "audit-grid-hectare-dots";
// Soft amber halo rendered BEHIND every hectare dot so the big plot centres read
// as glowing amber (the small fine dots stay plain white). Drawn just before the
// hectare-dot layer so it sits underneath.
const GRID_HECTARE_GLOW_LAYER = "audit-grid-hectare-glow";
const GRID_FINE_LAYER = "audit-grid-fine-dots";
const GRID_CELLS_LAYER = "audit-grid-cell-lines";
const GRID_GLOW_LAYER = "audit-grid-glow-dot";
const GRID_GLOW_ORANGE_LAYER = "audit-grid-glow-orange-dot";
// Invisible, wide hit-circles over each dot so a tap NEAR a dot still selects it
// (the visible dots are tiny). Bound for clicks instead of the visible layers.
const GRID_HIT_HECTARE_LAYER = "audit-grid-hit-hectare";
const GRID_HIT_FINE_LAYER = "audit-grid-hit-fine";
// Tap forgiveness radius (px), GRADUATED BY ZOOM and PER LATTICE. The catch
// radius tracks ~40% of the lattice's ON-SCREEN dot spacing at that zoom
// (spacing doubles per zoom level), capped so zoomed-in taps don't get mushy.
// 40% means neighbouring catch-circles never touch — a tap between two dots
// still falls through to the map — while a tap anywhere NEAR a dot lands it,
// even zoomed way out where the dots crowd. The hectare lattice (~100 m) and
// fine lattice (~28 m) get their own curves because their spacing differs ~3.5×.
// The orange pulse ring mirrors these same curves (kind-aware) so the visual
// always shows the true catch size. Spacing math at lat ~45°:
//   hectare px gap: z13 ≈ 15 · z14 ≈ 30 · z15 ≈ 59  → radius 6 / 11 / 20
//   fine px gap:    z15 ≈ 20 · z16 ≈ 39 · z17 ≈ 78  → radius 8 / 15 / 20
const HECTARE_HIT_RADIUS_EXPR = [
    "interpolate",
    ["linear"],
    ["zoom"],
    13,
    6,
    14,
    11,
    15,
    20,
    16,
    24, // cap
] as DataDrivenPropertyValueSpecification<number>;
const FINE_HIT_RADIUS_EXPR = [
    "interpolate",
    ["linear"],
    ["zoom"],
    14.5,
    6,
    15,
    8,
    16,
    15,
    17,
    20,
    18,
    24, // cap
] as DataDrivenPropertyValueSpecification<number>;
// The pulse layer is shared by both lattices, so it picks the curve from the
// feature's `kind` property (stamped by setGridGlowOrange). Zoom must be the
// OUTERMOST expression in Mapbox GL, so the kind switch lives in each stop.
const fineOrBig = (fine: number, big: number) =>
    ["case", ["==", ["get", "kind"], "fine"], fine, big] as const;
const PULSE_RADIUS_EXPR = [
    "interpolate",
    ["linear"],
    ["zoom"],
    13,
    fineOrBig(6, 6),
    14,
    fineOrBig(6, 11),
    15,
    fineOrBig(8, 20),
    16,
    fineOrBig(15, 24),
    17,
    fineOrBig(20, 24),
    18,
    fineOrBig(24, 24),
] as unknown as DataDrivenPropertyValueSpecification<number>;

// One 10-char Plus Code cell is 0.000125° on a side. The survey unit is ONE
// PLOT PER HECTARE → big dots ~100m apart. We step by a WHOLE NUMBER of Plus
// Code cells so each big dot lands on a real cell centre (→ Google-able code),
// choosing the cell count per axis to land nearest 100m. A cell is ~13.9m N-S
// everywhere, but only ~13.9·cos(lat) m E-W — so the E-W count is latitude-aware
// (computed in updateGrid). N-S is a fixed 7 cells ≈ 97m. Fine sub-dots step by
// WHOLE cell counts too (FINE_CELLS_*, ~28m) so they also land on cell centres.
// Spacing is the hard constraint; every dot IS a cell centre, so its code is
// exact — zero offset between the dot and the cell its code names.
const PLUSCODE_10CHAR_DEG = 0.000125;
const BIG_CELLS_LAT = 7; // 7 × 13.9m ≈ 97m N-S
const BIG_STEP_LAT_DEG = PLUSCODE_10CHAR_DEG * BIG_CELLS_LAT;
const TARGET_SPACING_M = 100;
// ── FINE LATTICE: A GLOBAL WHOLE-CELL LATTICE ────────────────────────────────
// Two hard requirements, and together they force the fine dots to be their OWN
// global lattice rather than a ring hung off each hectare centre:
//
//  1. HONEST, UNIQUE CODES. Each dot must sit a WHOLE number of Plus Code cells
//     from the origin, so it lands on a real cell centre and its +2 code names
//     exactly the cell it's in. The old `STEP/3` divisor gave 2.33 cells N-S and
//     3.67 E-W — fractional, so dots drifted to arbitrary spots INSIDE cells.
//     That is precisely why they used to need a +3 code: they had fallen off the
//     +2 grid. Two such dots could also truncate to the SAME +2 code.
//
//  2. UNIFORM SPACING. A 3×3 ring centred on a hectare CANNOT tile evenly: the
//     ring arms are ±2 cells but hectares are 7 cells apart, so gaps alternate
//     2,2,3 — 27.8m inside a hectare, 41.7m at every seam. The eye reads that as
//     a broken grid. Making the lattice GLOBAL (snap to a multiple of the fine
//     step in absolute space, ignoring hectare blocks) gives one constant gap
//     everywhere. Guarded by gridCodeHonesty.test.ts.
//
// 2 cells N-S = 27.8m · 3 cells E-W = 27.2m at lat 49 — near-square and within
// 10% of the old ~33m, so the change is imperceptible on screen.
// The cost, accepted deliberately: fine dots no longer nest inside hectare dots
// (7 is not divisible by 2), so the ring is not a 3×3 around each big dot. The
// hectare dots remain exactly where they were; the fine lattice simply runs
// underneath them on its own even spacing.
const FINE_CELLS_LAT = 2;
const FINE_CELLS_LNG = 3;
const FINE_STEP_LAT_DEG = PLUSCODE_10CHAR_DEG * FINE_CELLS_LAT;
const FINE_STEP_LNG_DEG = PLUSCODE_10CHAR_DEG * FINE_CELLS_LNG;

// ── THE LATTICE IS INTEGER CELL INDICES, NOT FLOAT DEGREES ───────────────────
// ANCHORED AT THE PLUS CODE ORIGIN (-180 lng / -90 lat), NOT AT 0. Plus Code
// cells are indexed from the antimeridian/south pole, so a cell CENTRE sits at
// (-180 + n·CELL + CELL/2). Anchoring at 0 puts the dot a fraction of a
// cell off true centre: invisible at most longitudes, but on a meridian that
// lands exactly on a cell boundary (-120, -114, 0 … where (lng+180)/CELL is a
// whole number) the dot falls just inside the NEXT cell and its code jumps a
// whole region — "85X2…" printed next to "84XX…". Guarded by gridCodeHonesty.
const LNG_ORIGIN = -180;
const LAT_ORIGIN = -90;

// THE one place any grid dot's coordinate is minted: the CENTRE of whole cell
// `index`, counted from the Plus Code origin. Every lattice (hectare and fine,
// lat and lng) goes through this same expression, so equal indices produce
// bit-identical floats — and a dot is DEFINED by its integer index, never by
// "round to the nearest centre". The old snapToCellCentre rounded a block
// point that sat EXACTLY on a cell boundary — a perfect tie between the two
// neighbouring centres, resolved by last-bit float noise inherited from
// whichever viewport corner the sweep started at. That is what made dots hop a
// whole cell (~14m) between pans, changing their codes ("…WGH+MM" one pan,
// "…WGH+PM" the next). Guarded by mapGrid.stability.test.ts.
const cellCentre = (origin: number, index: number): number =>
    origin + (index + 0.5) * PLUSCODE_10CHAR_DEG;

// Integer index of the lattice point nearest `v`, for a lattice whose dots sit
// at cell (k · cellsPerStep). Rounding HERE is safe: the input is an arbitrary
// tap/query coordinate (a tie needs a point EXACTLY between two dots —
// measure-zero), unlike the old snap whose input was ALWAYS on a boundary.
const nearestStepIndex = (
    v: number,
    origin: number,
    cellsPerStep: number,
): number =>
    Math.round(((v - origin) / PLUSCODE_10CHAR_DEG - 0.5) / cellsPerStep);

const snapFineLat = (lat: number) =>
    cellCentre(
        LAT_ORIGIN,
        nearestStepIndex(lat, LAT_ORIGIN, FINE_CELLS_LAT) * FINE_CELLS_LAT,
    );
const snapFineLng = (lng: number) =>
    cellCentre(
        LNG_ORIGIN,
        nearestStepIndex(lng, LNG_ORIGIN, FINE_CELLS_LNG) * FINE_CELLS_LNG,
    );
const METERS_PER_DEG_LAT = 111_320;
// Density cap: above this many dots in the viewport, updateGrid CLEARS the grid
// (tooDense) — this, NOT the layer minzoom, is what actually makes the grid vanish
// when you zoom out (each level out ~4×'s the area → ~4× the dots). Raised 4× from
// 3000 so the cap trips a FULL zoom level further out (grid stays visible to ~z13.5
// for the hectare lattice). Mapbox GL renders 12k circle features trivially.
const MAX_VISIBLE_DOTS = 12000;

// E-W cell count to hit ~100m at this latitude (cells are ~cos(lat)× narrower
// E-W). Clamped to ≥1. Used by both updateGrid and nearestGridDot so they agree.
function bigCellsLng(lat: number): number {
    const cellWidthM =
        PLUSCODE_10CHAR_DEG * METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
    return Math.max(1, Math.round(TARGET_SPACING_M / cellWidthM));
}

// Zoom gates. Below these, the layer just doesn't render — Mapbox culls it
// for free. Each is one zoom level EARLIER than the visual-overlap floor so the
// grid appears a touch sooner (hectare from z13, the ~28m fine lattice from z15).
const HECTARE_MINZOOM = 13;
const FINE_MINZOOM = 14.5;

// Fine dots per hectare, for the density estimate ONLY. The fine lattice is
// GLOBAL, not a 9-dot ring hung off each big dot, so this is the ratio of the two
// lattices' areas: (7 cells / 2) N-S × (~11 cells / 3) E-W ≈ 12.8 at mid-lats.
// Computed from the real steps rather than hardcoded so it tracks FINE_CELLS_*.
// The old value (the 9-entry keypad's length) would UNDER-count by ~40% and let
// the grid blow past MAX_VISIBLE_DOTS. Rounded up — a cap must never under-shoot.
const FINE_DOTS_PER_HECTARE = Math.ceil(
    (BIG_CELLS_LAT / FINE_CELLS_LAT) * (11 / FINE_CELLS_LNG),
);

// Classic two-overlapping-squares "copy" glyph for the popup's copy button.
const COPY_ICON_SVG =
    `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" ` +
    `stroke="currentColor" stroke-width="2" stroke-linecap="round" ` +
    `stroke-linejoin="round" aria-hidden="true">` +
    `<rect x="9" y="9" width="11" height="11" rx="2"/>` +
    `<path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`;

// Build a GeoJSON LineString between two lng/lat points (the faint cell box
// edges). No projection — the grid lives directly in Plus Code lng/lat space.
function lngLatLine(
    lng1: number,
    lat1: number,
    lng2: number,
    lat2: number,
): FeatureCollection<LineString>["features"][number] {
    return {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: [
                [lng1, lat1],
                [lng2, lat2],
            ],
        },
        properties: {},
    };
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

    // Fine sub-dots (~28m lattice). Smaller than hectare anchors so the eye
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
    // Amber glow halo behind every hectare dot — a wide, soft, semi-transparent
    // amber circle with a feathered blur so the big plot centres read as glowing
    // (style "A — Accent + glow"). Added FIRST so it sits under the dot itself.
    if (!map.getLayer(GRID_HECTARE_GLOW_LAYER)) {
        map.addLayer({
            id: GRID_HECTARE_GLOW_LAYER,
            type: "circle",
            source: GRID_HECTARE_SOURCE,
            minzoom: HECTARE_MINZOOM,
            paint: {
                // 50% smaller gold dots — glow halved to match (was 7→11).
                "circle-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    HECTARE_MINZOOM,
                    3.5,
                    18,
                    5.5,
                ],
                "circle-color": "#f5b942",
                "circle-opacity": 0.45,
                "circle-blur": 1,
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
                // 50% smaller gold dots (was 3→5; stroke 1.5 → 0.75 to keep proportion).
                "circle-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    HECTARE_MINZOOM,
                    1.5,
                    18,
                    2.5,
                ],
                // Amber fill — the big plot centres glow gold (style A), set apart
                // from the plain white fine sub-dots.
                "circle-color": "#f5b942",
                "circle-opacity": 1,
                "circle-stroke-width": 0.75,
                "circle-stroke-color": "#ffd87a",
                "circle-stroke-opacity": 0.95,
            },
        });
    }

    // Orange "forgiveness radius" pulse — shown for 0.7s the instant you tap a
    // dot, BEFORE the gold halo, so you see how much slop the tap allows. Same
    // source feeds it; setGridGlowOrange() points it at the tapped dot.
    if (!map.getSource(GRID_GLOW_ORANGE_SOURCE)) {
        map.addSource(GRID_GLOW_ORANGE_SOURCE, { type: "geojson", data: empty });
    }
    if (!map.getLayer(GRID_GLOW_ORANGE_LAYER)) {
        map.addLayer({
            id: GRID_GLOW_ORANGE_LAYER,
            type: "circle",
            source: GRID_GLOW_ORANGE_SOURCE,
            paint: {
                // Soft orange ring = the tap forgiveness radius (zoom-graduated,
                // kind-aware: fine dots pulse their own tighter curve).
                "circle-radius": PULSE_RADIUS_EXPR,
                "circle-color": "#e8853a",
                "circle-opacity": 0.18,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#e8853a",
                "circle-stroke-opacity": 0.9,
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
                // Gold halo — a touch smaller than before.
                "circle-radius": 10,
                "circle-color": "#f5d565",
                "circle-opacity": 0.28,
                "circle-stroke-width": 2.5,
                "circle-stroke-color": "#f5d565",
                "circle-stroke-opacity": 0.95,
            },
        });
    }

    // Wide INVISIBLE hit-circles over each dot — these are what clicks bind to,
    // so a tap within ~HIT_RADIUS_PX of a dot still selects it. Topmost so they
    // win the hit-test. Zero opacity (fill + stroke) → never seen.
    for (const [id, src, minzoom, radius] of [
        [
            GRID_HIT_HECTARE_LAYER,
            GRID_HECTARE_SOURCE,
            HECTARE_MINZOOM,
            HECTARE_HIT_RADIUS_EXPR,
        ],
        [GRID_HIT_FINE_LAYER, GRID_FINE_SOURCE, FINE_MINZOOM, FINE_HIT_RADIUS_EXPR],
    ] as const) {
        if (!map.getLayer(id)) {
            map.addLayer({
                id,
                type: "circle",
                source: src,
                minzoom,
                paint: {
                    "circle-radius": radius,
                    "circle-color": "#000000",
                    "circle-opacity": 0, // invisible — just a hit target
                },
            });
        }
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
    setData(map, GRID_GLOW_ORANGE_SOURCE, empty);
}

// A snapped grid dot: where the plot will land + the IDs to stamp on it.
export type GridDot = {
    lng: number;
    lat: number;
    plusCode: string; // real Plus Code, ALWAYS +2/10-char ("87G3J24G+62") — big dots and ring dots alike
    code10: string; // same real lookup-able Plus Code (kept for callers that read it)
    sub: number | null; // 1..9 for a sub-dot, null for a bare big dot (drives snap radius only)
};

// Find the grid dot nearest to (lng,lat) within `maxMeters`, or null if none is
// that close (so the caller drops free). The grid IS the Plus Code lattice, so
// snapping is analytic: find the 10-char cell that contains the point (its
// centre = the big dot), and in fine mode the nearest of its 3×3 sub-dots.
// Produces IDENTICAL ids to updateGrid for the same ground cell.
//
// maxMeters is the magnet radius — small (a few m) so a plot only snaps when
// the user is clearly aiming at a dot; zooming in lets them place between dots
// because the radius is in METRES, not pixels.
export function nearestGridDot(
    lng: number,
    lat: number,
    mode: GridMode,
    maxMeters: number,
): GridDot | null {
    if (mode === "off") return null;
    // Big dot = the integer-indexed hectare lattice point nearest the query —
    // the SAME mint as updateGrid (cellCentre of a whole-cell index), so draw
    // and tap can never disagree. The E-W cell count comes from the ROW's own
    // latitude (a property of the ground), not the query/camera latitude.
    const n = nearestStepIndex(lat, LAT_ORIGIN, BIG_CELLS_LAT);
    const bigLat = cellCentre(LAT_ORIGIN, n * BIG_CELLS_LAT);
    const cellsLng = bigCellsLng(bigLat);
    const m = nearestStepIndex(lng, LNG_ORIGIN, cellsLng);
    const bigLng = cellCentre(LNG_ORIGIN, m * cellsLng);

    let targetLat = bigLat;
    let targetLng = bigLng;
    let sub: number | null = null;

    if (mode === "fine") {
        // Snap onto the GLOBAL fine lattice (~28×27m, uniform everywhere). Must
        // match updateGrid's snapFine* exactly or a tap lands where no dot is.
        targetLat = snapFineLat(lat);
        targetLng = snapFineLng(lng);
        // sub (1..9) is kept only so the caller knows this is a fine-lattice dot
        // (it drives the snap radius); it is NOT part of the id — the id is the
        // real +2 code. Derived from the dot's offset from its hectare centre so
        // the centre dot still reports 5, matching the hectare dots.
        const col = clampStep(Math.round((targetLng - bigLng) / FINE_STEP_LNG_DEG));
        const row = clampStep(Math.round((targetLat - bigLat) / FINE_STEP_LAT_DEG));
        sub = keypadNumber(col, row);
    }

    // Approximate ground distance (deg → m), good to a few % — plenty for a
    // few-metre magnet radius.
    const dLatM = (lat - targetLat) * METERS_PER_DEG_LAT;
    const dLngM =
        (lng - targetLng) *
        METERS_PER_DEG_LAT *
        Math.cos((lat * Math.PI) / 180);
    if (Math.hypot(dLatM, dLngM) > maxMeters) return null;

    // Every dot's id IS its real, Google-able Plus Code — NO ".N" nicknames.
    // ALWAYS +2 / 10-char ("87G3J24G+62"), big dots AND ring dots alike. A dot is
    // a snapped lattice position, so a +3 code would claim ~3.5m precision the
    // placement never had — see gridCodeHonesty.test.ts. +2 is honest at ~14m and
    // still unique because dots sit 2-3 whole cells apart.
    const code10 = encodePlusCode(targetLat, targetLng, 10);
    return {
        lng: targetLng,
        lat: targetLat,
        plusCode: code10,
        code10,
        sub,
    };
}

// Clamp a keypad step to the 3×3 (-1..+1).
function clampStep(s: number): number {
    return s < -1 ? -1 : s > 1 ? 1 : s;
}
// (col,row) in -1..+1 → number 1..9 in READING ORDER (top-left .1, top-right
// .3, …, bottom-right .9; centre .5). row=+1 is the TOP row, so it counts first.
function keypadNumber(col: number, row: number): number {
    return (1 - row) * 3 + (col + 1) + 1;
}

// Point the gold snap-glow at a dot, or pass null to hide it. Takes only the
// fields the glow renders (lng/lat/plusCode), so any GridDot — or the trimmed
// shape the ruler passes back — satisfies it.
function glowFC(
    dot: { lng: number; lat: number; kind?: "fine" | "big" } | null,
): FeatureCollection<Point> {
    return {
        type: "FeatureCollection",
        features: dot
            ? [
                  {
                      type: "Feature",
                      geometry: { type: "Point", coordinates: [dot.lng, dot.lat] },
                      properties: { kind: dot.kind ?? "big" },
                  },
              ]
            : [],
    };
}
export function setGridGlow(
    map: MapboxMap,
    dot: { lng: number; lat: number; plusCode: string } | null,
): void {
    setData(map, GRID_GLOW_SOURCE, glowFC(dot));
}
// Orange "forgiveness radius" pulse (the wider ring shown on tap, before gold).
// `kind` picks the matching catch-size curve ("big" hectare default).
export function setGridGlowOrange(
    map: MapboxMap,
    dot: { lng: number; lat: number; kind?: "fine" | "big" } | null,
): void {
    setData(map, GRID_GLOW_ORANGE_SOURCE, glowFC(dot));
}

// True when a screen point lands on a grid dot's (invisible) hit-circle.
// EXCLUSIVE TAP TARGETS: the map-level click handler calls this FIRST and
// bails when it hits — the dot's own layer handler opens the Plus-Code popup,
// and the feature underneath must NOT also open (tapping a dot inside a saved
// polygon used to open BOTH the grid popup and the feature editor).
export function gridDotAt(
    map: MapboxMap,
    point: { x: number; y: number },
): boolean {
    const layers = [GRID_HIT_HECTARE_LAYER, GRID_HIT_FINE_LAYER].filter((id) =>
        map.getLayer(id),
    );
    if (layers.length === 0) return false;
    return (
        map.queryRenderedFeatures([point.x, point.y], { layers }).length > 0
    );
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
    // The amber glow halo tracks the hectare dots it sits behind.
    if (map.getLayer(GRID_HECTARE_GLOW_LAYER)) {
        map.setLayoutProperty(
            GRID_HECTARE_GLOW_LAYER,
            "visibility",
            visible ? "visible" : "none",
        );
    }
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

    // safeGetBounds: getBounds() THROWS on a momentarily-NaN camera (mid jump/ease)
    // → red-screen crash. Skip this update when the camera isn't finite yet; the
    // next settled moveend re-runs it.
    const bounds = safeGetBounds(map);
    if (!bounds) return { hectareCount: 0, fineCount: 0, tooDense: false };

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // THE GRID — Plus-Code-aligned, ~100m spacing (one plot per hectare). Big
    // dots step by a whole number of 10-char Plus Code cells per axis, chosen to
    // land nearest 100m: 7 cells N-S (~97m), and a latitude-aware count E-W
    // (cells are ~cos(lat)× narrower E-W). Every dot is DEFINED by an integer
    // cell index (cellCentre) — a pure function of the GROUND, never of the
    // viewport — so the lattice is bit-identical however the camera got here.
    // The E-W cell count is derived per ROW from that row's own latitude (not
    // the viewport's centre latitude, which re-spaced the whole grid whenever a
    // pan crossed a threshold latitude). Stability + uniqueness guarded by
    // mapGrid.stability.test.ts / gridCodeHonesty.test.ts.
    const CELL = PLUSCODE_10CHAR_DEG;
    const STEP_LAT = BIG_STEP_LAT_DEG; // ~97m

    // Integer hectare-row range covering the viewport (+1 row over-draw).
    const rowLo = Math.floor((sw.lat - LAT_ORIGIN) / STEP_LAT) - 1;
    const rowHi = Math.ceil((ne.lat - LAT_ORIGIN) / STEP_LAT) + 1;
    const rows = Math.max(0, rowHi - rowLo + 1);
    // Density estimate with the mid-viewport E-W step — the per-row count can
    // differ by at most one across a viewport, so this is within a few % of the
    // true total, plenty for a 12k cap.
    const midStepLng = bigCellsLng((sw.lat + ne.lat) / 2) * CELL;
    const cols = Math.max(0, Math.ceil((ne.lng - sw.lng) / midStepLng) + 3);
    const bigEstimate = cols * rows;
    const fineEstimate = mode === "fine" ? bigEstimate * FINE_DOTS_PER_HECTARE : 0;

    if (bigEstimate + fineEstimate > MAX_VISIBLE_DOTS) {
        clearGrid(map);
        return {
            hectareCount: bigEstimate,
            fineCount: fineEstimate,
            tooDense: true,
        };
    }

    const hectareFeatures: FeatureCollection<Point>["features"] = [];
    const fineFeatures: FeatureCollection<Point>["features"] = [];
    const cellFeatures: FeatureCollection<LineString>["features"] = [];

    // Half-hectare box offsets (the faint ~100m square drawn around each big dot).
    // N-S is constant; E-W is per row (the row owns its cell count).
    const HALF_LAT = STEP_LAT / 2;

    for (let n = rowLo; n <= rowHi; n++) {
        // The row's dots ARE the centres of cells 7n — integer index in, exact
        // centre out. No rounding, no tie.
        const lat = cellCentre(LAT_ORIGIN, n * BIG_CELLS_LAT);
        const cellsLng = bigCellsLng(lat); // row-owned: ground, not camera
        const stepLng = cellsLng * CELL;
        const halfLng = stepLng / 2;
        const colLo = Math.floor((sw.lng - LNG_ORIGIN) / stepLng) - 1;
        const colHi = Math.ceil((ne.lng - LNG_ORIGIN) / stepLng) + 1;
        for (let m = colLo; m <= colHi; m++) {
            const lng = cellCentre(LNG_ORIGIN, m * cellsLng);

            // Big dot = the hectare centre. Its label IS its real Plus Code at
            // the +2 / 10-char level ("87G3J24G+62") — same display + copy, no
            // ".5" nickname. (The dot is the centre of a real 10-char cell.)
            const bigCode = encodePlusCode(lat, lng, 10);
            hectareFeatures.push({
                type: "Feature",
                geometry: { type: "Point", coordinates: [lng, lat] },
                properties: {
                    plot: bigCode, // display = real +2 code
                    plusCode: bigCode,
                    copyCode: bigCode,
                },
            });

            if (mode === "fine") {
                // ONE faint ~100m box per big dot, centred on it (±HALF per
                // axis) — marks the hectare centre (NOT a lattice between subs).
                cellFeatures.push(
                    lngLatLine(lng - halfLng, lat - HALF_LAT, lng + halfLng, lat - HALF_LAT),
                    lngLatLine(lng - halfLng, lat + HALF_LAT, lng + halfLng, lat + HALF_LAT),
                    lngLatLine(lng - halfLng, lat - HALF_LAT, lng - halfLng, lat + HALF_LAT),
                    lngLatLine(lng + halfLng, lat - HALF_LAT, lng + halfLng, lat + HALF_LAT),
                );
            }
        }
    }

    // ── GLOBAL FINE LATTICE ──────────────────────────────────────────────────
    // Swept in ABSOLUTE space over the whole viewport, not as a ring per hectare,
    // so the gap between fine dots is constant everywhere (a hectare-relative
    // ring alternates 2,2,3 cells — a visible seam every ~97m). Hectare dots that
    // coincide with a lattice point are skipped so no dot is drawn twice.
    if (mode === "fine") {
        // Built by pushing into a Set directly rather than `new Set(arr.map(…))`.
        // The .map() form allocated a THROWAWAY INTERMEDIATE ARRAY of up to
        // 12,000 strings (MAX_VISIBLE_DOTS) on every moveend/zoomend, purely to
        // hand it to the Set constructor which then copied it. Same result,
        // half the garbage, and this runs on every camera settle.
        const hectareAt = new Set<string>();
        for (const f of hectareFeatures) {
            const c = (f.geometry as Point).coordinates;
            hectareAt.add(`${c[1].toFixed(9)},${c[0].toFixed(9)}`);
        }
        // Integer fine-lattice index range covering the viewport (+1 over-draw).
        // Both lattices mint coordinates through the SAME cellCentre expression,
        // so a coinciding hectare/fine index pair yields bit-identical floats and
        // the toFixed(9) dedup key always matches.
        const fRowLo = Math.floor((sw.lat - LAT_ORIGIN) / FINE_STEP_LAT_DEG) - 1;
        const fRowHi = Math.ceil((ne.lat - LAT_ORIGIN) / FINE_STEP_LAT_DEG) + 1;
        const fColLo = Math.floor((sw.lng - LNG_ORIGIN) / FINE_STEP_LNG_DEG) - 1;
        const fColHi = Math.ceil((ne.lng - LNG_ORIGIN) / FINE_STEP_LNG_DEG) + 1;
        for (let i = fColLo; i <= fColHi; i++) {
            const flng = cellCentre(LNG_ORIGIN, i * FINE_CELLS_LNG);
            // Hoisted out of the inner loop: flng is constant for this column,
            // so formatting it per ROW allocated one redundant string for every
            // cell in the viewport — the hottest allocation in this function.
            const flngKey = flng.toFixed(9);
            for (let j = fRowLo; j <= fRowHi; j++) {
                const flat = cellCentre(LAT_ORIGIN, j * FINE_CELLS_LAT);
                if (hectareAt.has(`${flat.toFixed(9)},${flngKey}`)) continue;
                // The dot sits on a whole-cell multiple, so it lands on a real
                // cell centre and its +2 code is honest (~14m) AND unique — same
                // precision as the big dots. No +3 anywhere on the grid.
                const fineCode = encodePlusCode(flat, flng, 10);
                fineFeatures.push({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [flng, flat] },
                    properties: {
                        plot: fineCode, // display = real +2 code
                        plusCode: fineCode,
                        copyCode: fineCode,
                    },
                });
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
    // (MapDrawControls/plotDrop) owns what "throw a plot" actually does. It
    // returns true only if the plot actually dropped; false = the host refused
    // (duplicate number, half-done plot, …) and the button must retract its
    // "confirmed" flash and re-arm instead of confirming a plot that never was.
    onPlotFromDot?: (dot: {
        lng: number;
        lat: number;
        plusCode: string;
    }) => boolean,
    // A TOOL OWNS THE TAP: while the host is placing geometry (an armed palette
    // tool, an active Snake Ruler) the dots must NOT intercept — no Plus-Code
    // popup, no camera nudge, no "Plot" offer mid-draw. The host supplies the
    // live answer; undefined = never suppressed.
    suppressTaps?: () => boolean,
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
        if (suppressTaps?.()) return; // a draw/measure tool owns this tap
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
        // `plot`/`plusCode` and `copyCode` are the SAME real Plus Code (+2 /
        // 10-char, big AND sub — see plusCode.ts header). COPY hands over
        // the FULL code (realCode). The POPUP shows the SHORT id (shortId): the full
        // code minus its 5-char region prefix — e.g. "87G3J24G+62" → "24G+62".
        // Every dot is +2 now, so the tail is always 6 chars. The prefix is identical across the whole
        // region, so it's noise; the short tail is the only part worth reading and it
        // fits the pill (no ellipsis). It's still a real, recoverable Plus Code.
        const realCode =
            typeof feat.properties?.copyCode === "string"
                ? (feat.properties.copyCode as string)
                : plusCode;
        const shortId = realCode.slice(5);
        // Which lattice was tapped — picks the matching pulse-ring curve.
        const kind: "fine" | "big" =
            (feat as { layer?: { id?: string } }).layer?.id === GRID_HIT_FINE_LAYER
                ? "fine"
                : "big";

        // BOTH renderers reach this: online = Mapbox, offline (/mobile/offlinev4)
        // = MapLibre. A Popup from the wrong library does not throw here, which
        // makes it worse — it gets the other namespace's DOM classes, so no CSS
        // matches and its close button is unreachable. Ask the live instance who
        // built it; defaults to Mapbox for anything unrecognised.
        const isMaplibre = (
            map as unknown as { getCanvasContainer?: () => HTMLElement | undefined }
        )
            .getCanvasContainer?.()
            ?.className?.includes("maplibregl");
        const mbgl = isMaplibre
            ? ((await import("maplibre-gl"))
                  .default as unknown as typeof import("mapbox-gl").default)
            : (await import("mapbox-gl")).default;
        popup?.remove();

        // Narrow camera surface we need from the map (avoids repeated casts).
        const cam = map as unknown as {
            project: (c: [number, number]) => { x: number; y: number };
            unproject: (p: [number, number]) => { lng: number; lat: number };
            getCenter: () => { lng: number; lat: number };
            getContainer: () => HTMLElement;
            once: (e: string, f: () => void) => void;
            easeTo: (o: {
                center: [number, number];
                duration: number;
                essential?: boolean;
            }) => void;
        };

        const buildGridPopup = () => {
            // Layout: [copy ⧉] [code] [quality ✦]. Copy hands back the raw real
            // Plus Code; quality throws a plot. Both bound after mount (the popup
            // HTML is a string). Code shows the SHORT id (region prefix dropped).
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
                    `<button type="button" class="grid-copy-btn" aria-label="Copy this point's Plus Code">` +
                    COPY_ICON_SVG +
                    `</button>` +
                    `<span class="grid-plot-number">${shortId}</span>` +
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

        // HALO — first flash the ORANGE forgiveness ring (0.7s) so you see how
        // wide the tap target is, THEN settle into the gold "selected" halo.
        setGridGlowOrange(map, { lng: dotLng, lat: dotLat, kind });
        setGridGlow(map, null);
        const haloTimer = setTimeout(() => {
            setGridGlowOrange(map, null);
            setGridGlow(map, { lng: dotLng, lat: dotLat, plusCode });
        }, 700);
        // Tracks the popup's own close (tap-away / closeOnMove) so a late glow
        // timer never re-lights a halo on a dot whose popup is already gone.
        let popupClosed = false;
        (popup as unknown as { on?: (e: string, f: () => void) => void }).on?.(
            "close",
            () => {
                popupClosed = true;
                clearTimeout(haloTimer);
                setGridGlowOrange(map, null);
                setGridGlow(map, null);
            },
        );

        // Bind the buttons now that the popup DOM exists.
        const el = (
            popup as unknown as { getElement?: () => HTMLElement | undefined }
        ).getElement?.();

        // COPY — copies the real Google-able code (or its Maps URL). Flashes a
        // checkmark-ish confirm so you know it landed; great for testing URLs.
        const copyBtn = el?.querySelector(".grid-copy-btn");
        copyBtn?.addEventListener("click", (ev) => {
            ev.stopPropagation();
            // The raw, real Plus Code — paste it straight into Google Maps /
            // anywhere. NOT wrapped in a URL (the user wants the bare code).
            void navigator.clipboard?.writeText(realCode).then(
                () => copyBtn.classList.add("is-copied"),
                () => {
                    /* codestyle-allow-swallow: clipboard denied → no-op */
                },
            );
        });

        // PLOT — throw a Quality 704 plot dead-centre on this dot.
        if (onPlotFromDot) {
            const btn = el?.querySelector(".grid-plot-btn");
            let fired = false;
            btn?.addEventListener("click", (ev) => {
                ev.stopPropagation();
                if (fired) return; // guard double-tap
                fired = true;
                // VISIBLE CONFIRM: flash the button solid-gold so the user is
                // certain the tap registered on THIS dot, then drop the plot.
                btn.classList.add("is-confirmed");
                setTimeout(() => {
                    // The gold "confirmed" only STAYS if the drop actually took —
                    // the host can refuse (duplicate number, half-done plot). A
                    // solid-gold flash over a refused drop confirmed a plot that
                    // never existed, and the tap then read as done-but-broken.
                    const ok = onPlotFromDot({
                        lng: dotLng,
                        lat: dotLat,
                        plusCode,
                    });
                    if (ok) {
                        popup?.remove();
                        return;
                    }
                    // REFUSED: retract the confirm + re-arm so a retry can fire,
                    // and replay the existing orange→gold attention halo on the
                    // dot — the tap is never silent. Skip the halo if the refusal
                    // already closed the popup (e.g. the host confronted a
                    // half-done plot and the camera move closed us) — its own
                    // popover is the cue there, and this dot is no longer staged.
                    btn.classList.remove("is-confirmed");
                    fired = false;
                    if (popupClosed) return;
                    clearTimeout(haloTimer);
                    setGridGlowOrange(map, { lng: dotLng, lat: dotLat, kind });
                    setGridGlow(map, null);
                    setTimeout(() => {
                        setGridGlowOrange(map, null);
                        if (!popupClosed) {
                            setGridGlow(map, {
                                lng: dotLng,
                                lat: dotLat,
                                plusCode,
                            });
                        }
                    }, 700);
                }, 160);
            });
        }
        }; // end buildGridPopup

        // The ONLY chrome the card can hide under is the top-RIGHT button cluster
        // (eye + online/offline), which lives in the DOM outside the map so Mapbox
        // can't avoid it. (Mapbox already auto-flips the popup vertically to dodge
        // the top/bottom edges, so we DON'T touch the vertical — that was the
        // source of the big downward jumps.) So: if the card's right portion would
        // sit under those buttons, slide the dot LEFT by just enough to clear them
        // with PAD breathing room. Pure horizontal, minimal, smooth.
        const POPUP_W = 250; // card width (centred on the dot)
        const POPUP_H = 90; // card height
        const TIP = 22; // dot→card gap
        const PAD = 10; // clearance left past the buttons (5–10px feel)
        const BTN_ZONE_W = 100; // width of the top-right button cluster
        const BTN_ZONE_BOTTOM = 240; // how far down it reaches — must cover the eye
        // (top 4, h 62) AND the crow below it (top 80, h ~74) even when the map
        // canvas runs full-bleed under the nav (~64px taller frame of reference).
        const cw = cam.getContainer().clientWidth;
        const dotPt = cam.project([dotLng, dotLat]);

        const boxRight = dotPt.x + POPUP_W / 2;
        const boxTop = dotPt.y - TIP - POPUP_H;
        // Trigger only when the card's top-right actually reaches under the button
        // cluster (right edge past the cluster's left, and high enough to collide).
        const underButtons =
            boxRight > cw - BTN_ZONE_W && boxTop < BTN_ZONE_BOTTOM;
        let dx = 0;
        if (underButtons) {
            const needed = boxRight - (cw - BTN_ZONE_W - PAD); // px to clear (>0)
            // The cluster is treated exactly like the viewport edge: the card must
            // NEVER end up under it, however far that slide is. Cap only so the
            // card's own left edge stays on-screen (a screen too narrow for card +
            // cluster slides as far as it can and eats the difference).
            const maxSlide = Math.max(0, dotPt.x - POPUP_W / 2 - PAD);
            dx = -Math.min(needed, maxSlide);
        }
        const dy = 0; // never move vertically — Mapbox handles top/bottom flips

        // Only move on a meaningful overlap (≥8px) — ignore a graze (no twitch).
        if (Math.abs(dx) >= 8) {
            const centerPt = cam.project([
                cam.getCenter().lng,
                cam.getCenter().lat,
            ]);
            // Move the MAP centre opposite to the dot nudge (shift dot by +dx,+dy
            // ⇒ move centre by −dx,−dy).
            const newCenter = cam.unproject([
                centerPt.x - dx,
                centerPt.y - dy,
            ]);
            cam.once("moveend", buildGridPopup);
            // Smooth glide (not a jump) — just far enough to clear the chrome.
            // `essential: true` forces the animation even under prefers-reduced-
            // motion (else Mapbox jump-cuts it, which read as the "no ease").
            cam.easeTo({
                center: [newCenter.lng, newCenter.lat],
                duration: 420,
                essential: true,
            });
        } else {
            buildGridPopup();
        }
    };
    // Cursor feedback — lets the user know pins are tappable. Suppressed while
    // a tool owns taps (the pointer cursor would falsely promise a popup).
    const onPinEnter = () => {
        if (suppressTaps?.()) return;
        map.getCanvas().style.cursor = "pointer";
    };
    const onPinLeave = () => {
        map.getCanvas().style.cursor = "";
    };

    map.on("moveend", schedule);
    map.on("zoomend", schedule);
    map.on("styledata", onStyleData);
    // Bind to the WIDE invisible hit-circles, not the tiny visible dots, so a
    // near-miss tap still pairs.
    map.on("click", GRID_HIT_HECTARE_LAYER, onPinClick);
    map.on("click", GRID_HIT_FINE_LAYER, onPinClick);
    map.on("mouseenter", GRID_HIT_HECTARE_LAYER, onPinEnter);
    map.on("mouseleave", GRID_HIT_HECTARE_LAYER, onPinLeave);
    map.on("mouseenter", GRID_HIT_FINE_LAYER, onPinEnter);
    map.on("mouseleave", GRID_HIT_FINE_LAYER, onPinLeave);

    return () => {
        if (timer) clearTimeout(timer);
        popup?.remove();
        map.off("moveend", schedule);
        map.off("zoomend", schedule);
        map.off("styledata", onStyleData);
        map.off("click", GRID_HIT_HECTARE_LAYER, onPinClick);
        map.off("click", GRID_HIT_FINE_LAYER, onPinClick);
        map.off("mouseenter", GRID_HIT_HECTARE_LAYER, onPinEnter);
        map.off("mouseleave", GRID_HIT_HECTARE_LAYER, onPinLeave);
        map.off("mouseenter", GRID_HIT_FINE_LAYER, onPinEnter);
        map.off("mouseleave", GRID_HIT_FINE_LAYER, onPinLeave);
    };
}
