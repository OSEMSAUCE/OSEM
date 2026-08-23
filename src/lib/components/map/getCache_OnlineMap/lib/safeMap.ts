// The ONLY sanctioned way to mutate the Mapbox camera.
//
// Why this exists: any NaN that reaches Mapbox's projection math
// (lng, lat, zoom, bearing, pitch, padding, offset) corrupts the
// camera's internal state. Once corrupt, every subsequent call —
// even valid ones — crashes in `_calcMatrices` with
// "Cannot read properties of null". A spot fix at one call site
// doesn't help: the next call inherits the corruption.
//
// Every `flyTo`, `fitBounds`, `easeTo`, `jumpTo`, `panTo`,
// `setCenter`, `setZoom`, `setBearing`, `setPitch` MUST go through
// these wrappers. Direct calls are banned by the lint check in
// scripts/check-direct-mapbox-camera.sh.

// Structural type instead of `import { Map } from "mapbox-gl"`. ReTreever
// and OSEM both depend on mapbox-gl; npm hoists two copies, which produces
// "Types of property 'style' are incompatible" everywhere a Map crosses
// the boundary. A structural shape sidesteps that — we only need the
// methods we actually call.
type CameraMap = {
    flyTo(opts: Record<string, unknown>): void;
    fitBounds(
        bounds: [[number, number], [number, number]],
        opts?: Record<string, unknown>,
    ): void;
    // Runs fitBounds' zoom math (log2(viewport / bounds)) WITHOUT mutating
    // the camera. Returns undefined when the map has no usable viewport
    // (0×0 canvas). We use it to validate the target zoom before committing.
    cameraForBounds?(
        bounds: [[number, number], [number, number]],
        opts?: Record<string, unknown>,
    ): { zoom?: number } | null | undefined;
    easeTo(opts: Record<string, unknown>): void;
    jumpTo(opts: Record<string, unknown>): void;
    stop(): void;
    getCenter(): { lng: number; lat: number };
    getZoom(): number;
};

// Coord is the branded, validated type from coord.ts. safeMap accepts
// either a branded Coord (preferred for new code) or a raw [number,
// number] tuple (existing callers) — the tuple path re-validates via
// isCoord, so safety is preserved either way. New code should construct
// Coord at the boundary via toCoord() and avoid re-validation downstream.
import { type Coord, isCoord } from "./coord";

export { isCoord, toCoord, toCoordFromLngLat, toCoordFromArray, toCoordFromFeature } from "./coord";
export type { Coord };

// Back-compat alias. New code should prefer `isCoord` from coord.ts.
export const isFiniteCoord = isCoord;

export function isFiniteLngLat(
    p: { lng: number; lat: number } | null | undefined,
): p is { lng: number; lat: number } {
    return !!p && Number.isFinite(p.lng) && Number.isFinite(p.lat);
}

// Internal type for the wrapper option shapes — accepts either a
// branded Coord or a raw tuple. Validated by isCoord at the wrapper
// boundary before any value reaches Mapbox.
type CoordInput = Coord | readonly [number, number] | [number, number];

function isFiniteNumber(n: unknown): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

// Pixel-pair predicate for camera `offset` options. Distinct from
// `isFiniteCoord` (= `isCoord`) which adds a geographic range check
// (lng ∈ [-180, 180], lat ∈ [-90, 90]) — that's correct for `center`
// but rejects perfectly valid pixel offsets like `[0, -160]` used by
// popoverPositioning to put a pin at top-center. Regression introduced
// during the branded-Coord migration when the two validators were
// collapsed into one alias.
function isFinitePixelPair(p: unknown): p is [number, number] {
    return (
        Array.isArray(p) &&
        p.length >= 2 &&
        Number.isFinite(p[0]) &&
        Number.isFinite(p[1])
    );
}

// Recover from corrupt camera state: if the map's current center or
// zoom is NaN, no animated transition can succeed. Reset to a known-
// good state with jumpTo first, then the new call can proceed.
// Returns false and logs if the rescue itself can't determine a target.
function ensureCleanCamera(
    map: CameraMap,
    fallbackCenter?: CoordInput,
    fallbackZoom?: number,
): boolean {
    const c = map.getCenter();
    const z = map.getZoom();
    const cleanCenter = Number.isFinite(c.lng) && Number.isFinite(c.lat);
    const cleanZoom = Number.isFinite(z);
    if (cleanCenter && cleanZoom) return true;

    const target: Coord | null = fallbackCenter && isCoord(fallbackCenter)
        ? (fallbackCenter as Coord)
        : cleanCenter
        ? ([c.lng, c.lat] as unknown as Coord)
        : null;
    const targetZoom = isFiniteNumber(fallbackZoom)
        ? fallbackZoom
        : cleanZoom
        ? z
        : 2;

    if (!target) {
        reportRejection("ensureCleanCamera", "no fallback center available");
        return false;
    }
    map.jumpTo({ center: target, zoom: targetZoom });
    return true;
}

// Single channel for telemetry. console.warn in dev so issues are
// visible during development; production wires to Sentry breadcrumb
// via the global error handler.
function reportRejection(method: string, reason: string): void {
    if (typeof console !== "undefined") {
        console.warn(`[safeMap] rejected ${method}: ${reason}`);
    }
}

export type SafeFlyToOptions = {
    center: CoordInput;
    zoom?: number;
    bearing?: number;
    pitch?: number;
    duration?: number;
    curve?: number;
    offset?: [number, number];
    padding?: { top?: number; bottom?: number; left?: number; right?: number };
    essential?: boolean;
};

export function safeFlyTo(map: CameraMap, opts: SafeFlyToOptions): void {
    if (!isFiniteCoord(opts.center)) {
        reportRejection("flyTo", "center is not finite");
        return;
    }
    if (opts.zoom !== undefined && !isFiniteNumber(opts.zoom)) {
        reportRejection("flyTo", "zoom is not finite");
        return;
    }
    if (opts.duration !== undefined && !isFiniteNumber(opts.duration)) {
        reportRejection("flyTo", "duration is not finite");
        return;
    }
    if (opts.offset && !isFinitePixelPair(opts.offset)) {
        reportRejection("flyTo", "offset has non-finite component");
        return;
    }
    if (!ensureCleanCamera(map, opts.center, opts.zoom)) return;

    map.stop();
    map.flyTo(opts);
}

export type SafeFitBoundsOptions = {
    padding?:
        | number
        | { top?: number; bottom?: number; left?: number; right?: number };
    duration?: number;
    maxZoom?: number;
    essential?: boolean;
    bearing?: number;
    pitch?: number;
};

export function safeFitBounds(
    map: CameraMap,
    sw: CoordInput,
    ne: CoordInput,
    opts: SafeFitBoundsOptions = {},
): void {
    if (!isCoord(sw) || !isCoord(ne)) {
        reportRejection("fitBounds", "corner is not finite");
        return;
    }
    // Degenerate bounds (sw === ne or zero-area). Mapbox's fit math
    // produces NaN. Fall back to flyTo on the single point.
    const sameLng = sw[0] === ne[0];
    const sameLat = sw[1] === ne[1];
    if (sameLng && sameLat) {
        safeFlyTo(map, {
            center: sw as Coord,
            zoom: opts.maxZoom ?? 16,
            duration: opts.duration ?? 1200,
            essential: opts.essential,
        });
        return;
    }
    if (opts.duration !== undefined && !isFiniteNumber(opts.duration)) {
        reportRejection("fitBounds", "duration is not finite");
        return;
    }
    // The corner check above is not enough: fitBounds derives the zoom as
    // log2(viewport / bounds-size). Padding that exceeds the viewport (a
    // small or mid-layout canvas) drives that scale negative → NaN zoom, and
    // NaN survives Mapbox's min/max clamp (every NaN comparison is false) and
    // corrupts the camera for every later call. cameraForBounds runs the same
    // math without mutating; if it can't produce a finite zoom (or the canvas
    // has no size), reject loudly rather than animate toward NaN.
    if (map.cameraForBounds) {
        const cam = map.cameraForBounds(
            [
                sw as unknown as [number, number],
                ne as unknown as [number, number],
            ],
            opts as Record<string, unknown>,
        );
        if (!cam || !Number.isFinite(cam.zoom)) {
            reportRejection(
                "fitBounds",
                "computed zoom is non-finite (padding exceeds viewport, degenerate bounds, or unsized canvas)",
            );
            return;
        }
    }
    if (!ensureCleanCamera(map, sw)) return;

    map.stop();
    // sw/ne validated by isCoord above. Cast strips the brand for the
    // structural CameraMap type, which expects a plain tuple.
    map.fitBounds(
        [
            sw as unknown as [number, number],
            ne as unknown as [number, number],
        ],
        opts as Record<string, unknown>,
    );
}

export type SafeJumpToOptions = {
    center?: CoordInput;
    zoom?: number;
    bearing?: number;
    pitch?: number;
};

export function safeJumpTo(map: CameraMap, opts: SafeJumpToOptions): void {
    if (opts.center !== undefined && !isFiniteCoord(opts.center)) {
        reportRejection("jumpTo", "center is not finite");
        return;
    }
    if (opts.zoom !== undefined && !isFiniteNumber(opts.zoom)) {
        reportRejection("jumpTo", "zoom is not finite");
        return;
    }
    map.jumpTo(opts);
}

export type SafeEaseToOptions = {
    center?: CoordInput;
    zoom?: number;
    bearing?: number;
    pitch?: number;
    duration?: number;
    padding?: { top?: number; bottom?: number; left?: number; right?: number };
    essential?: boolean;
};

export function safeEaseTo(map: CameraMap, opts: SafeEaseToOptions): void {
    if (opts.center !== undefined && !isFiniteCoord(opts.center)) {
        reportRejection("easeTo", "center is not finite");
        return;
    }
    if (opts.zoom !== undefined && !isFiniteNumber(opts.zoom)) {
        reportRejection("easeTo", "zoom is not finite");
        return;
    }
    if (opts.duration !== undefined && !isFiniteNumber(opts.duration)) {
        reportRejection("easeTo", "duration is not finite");
        return;
    }
    if (!ensureCleanCamera(map, opts.center, opts.zoom)) return;

    map.stop();
    map.easeTo(opts);
}

// safeGetBounds — map.getBounds() THROWS ("Invalid LngLat object: (NaN, NaN)")
// when the camera transform is momentarily degenerate (zoom === NaN), which can
// happen for one frame during a jump/ease before the renderGuard restores the
// camera. An UNGUARDED getBounds() in a moveend handler then crashes to the red
// screen. Callers that only need the viewport bbox should use this: it returns
// null on a non-finite camera (skip this frame; the next settled frame succeeds)
// instead of throwing. Returns the LngLatBounds object on success.
export function safeGetBounds<T>(map: {
    getZoom(): number;
    getBounds(): T;
}): T | null {
    if (!isFiniteNumber(map.getZoom())) {
        reportRejection("getBounds", "camera zoom is not finite");
        return null;
    }
    try {
        return map.getBounds();
    } catch (e) {
        reportRejection("getBounds", String(e));
        return null;
    }
}
