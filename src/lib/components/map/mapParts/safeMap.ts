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
    easeTo(opts: Record<string, unknown>): void;
    jumpTo(opts: Record<string, unknown>): void;
    stop(): void;
    getCenter(): { lng: number; lat: number };
    getZoom(): number;
};

type Coord = [number, number];

export function isFiniteCoord(c: unknown): c is Coord {
    return (
        Array.isArray(c) &&
        c.length >= 2 &&
        Number.isFinite(c[0]) &&
        Number.isFinite(c[1])
    );
}

export function isFiniteLngLat(
    p: { lng: number; lat: number } | null | undefined,
): p is { lng: number; lat: number } {
    return !!p && Number.isFinite(p.lng) && Number.isFinite(p.lat);
}

function isFiniteNumber(n: unknown): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

// Recover from corrupt camera state: if the map's current center or
// zoom is NaN, no animated transition can succeed. Reset to a known-
// good state with jumpTo first, then the new call can proceed.
// Returns false and logs if the rescue itself can't determine a target.
function ensureCleanCamera(
    map: CameraMap,
    fallbackCenter?: Coord,
    fallbackZoom?: number,
): boolean {
    const c = map.getCenter();
    const z = map.getZoom();
    const cleanCenter = Number.isFinite(c.lng) && Number.isFinite(c.lat);
    const cleanZoom = Number.isFinite(z);
    if (cleanCenter && cleanZoom) return true;

    const target = fallbackCenter && isFiniteCoord(fallbackCenter)
        ? fallbackCenter
        : cleanCenter
        ? [c.lng, c.lat] as Coord
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
    center: Coord;
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
    if (opts.offset && !isFiniteCoord(opts.offset)) {
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
    sw: Coord,
    ne: Coord,
    opts: SafeFitBoundsOptions = {},
): void {
    if (!isFiniteCoord(sw) || !isFiniteCoord(ne)) {
        reportRejection("fitBounds", "corner is not finite");
        return;
    }
    // Degenerate bounds (sw === ne or zero-area). Mapbox's fit math
    // produces NaN. Fall back to flyTo on the single point.
    const sameLng = sw[0] === ne[0];
    const sameLat = sw[1] === ne[1];
    if (sameLng && sameLat) {
        safeFlyTo(map, {
            center: sw,
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
    if (!ensureCleanCamera(map, sw)) return;

    map.stop();
    map.fitBounds([sw, ne], opts as Record<string, unknown>);
}

export type SafeJumpToOptions = {
    center?: Coord;
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
    center?: Coord;
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
