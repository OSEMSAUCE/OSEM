import type * as mapboxgl from "mapbox-gl";
import type { Coord } from "./coord";

// mapbox-gl 3.x globe projection has an internal recursion in
// setLocationAtPoint → set center → _updateZoomFromElevation that any animated
// easeTo/flyTo triggers per-frame, blowing the stack. jumpTo skips
// setLocationAtPoint entirely. This helper interpolates with rAF + jumpTo when
// the map is on globe, and falls back to native easeTo on mercator.

export type SafeEaseOptions = {
    // Coord is the branded, validated tuple — `readonly [number, number]
    // & brand`. Listed first so callers passing the result of toCoord()
    // typecheck without casts. The raw tuple/LngLatLike paths stay for
    // back-compat with existing call sites that have not migrated.
    center?: Coord | [number, number] | mapboxgl.LngLatLike;
    zoom?: number;
    duration?: number;
};

const activeRaf = new WeakMap<mapboxgl.Map, number>();

function isGlobe(map: mapboxgl.Map): boolean {
    try {
        return map.getProjection()?.name === "globe";
    } catch {
        return false;
    }
}

function toLngLat(c: SafeEaseOptions["center"]): [number, number] | null {
    if (!c) return null;
    if (Array.isArray(c)) return [c[0], c[1]];
    const anyC = c as { lng?: number; lon?: number; lat?: number };
    if (typeof anyC.lat === "number") {
        const lng = anyC.lng ?? anyC.lon;
        if (typeof lng === "number") return [lng, anyC.lat];
    }
    return null;
}

// Shortest signed delta on the longitude axis (handles antimeridian wrap).
function shortestLngDelta(from: number, to: number): number {
    let d = ((to - from + 540) % 360) - 180;
    // Handle exact 180 case deterministically (eastward).
    if (d === -180) d = 180;
    return d;
}

// Cubic ease-out — feels close to mapbox default.
function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

export function safeEase(
    map: mapboxgl.Map,
    opts: SafeEaseOptions,
): void {
    // safeEase is the globe-projection sibling of safeMap.ts's wrappers,
    // and like them it must NEVER let a non-finite value reach the Mapbox
    // camera: a NaN zoom or center corrupts the transform and the map
    // renders blank white (the pin create/edit white-out). Validate every
    // input up front and bail loudly — never animate toward garbage.
    if (opts.zoom !== undefined && !Number.isFinite(opts.zoom)) {
        console.warn("[safeEase] rejected: zoom is not finite");
        return;
    }
    if (opts.center !== undefined) {
        const ll = toLngLat(opts.center);
        if (!ll || !Number.isFinite(ll[0]) || !Number.isFinite(ll[1])) {
            console.warn("[safeEase] rejected: center is not finite");
            return;
        }
    }

    const duration = Number.isFinite(opts.duration)
        ? Math.max(0, opts.duration as number)
        : 600;

    if (!isGlobe(map)) {
        map.easeTo({
            ...(opts.center && { center: opts.center as mapboxgl.LngLatLike }),
            ...(typeof opts.zoom === "number" && { zoom: opts.zoom }),
            duration,
        });
        return;
    }

    const prev = activeRaf.get(map);
    if (prev) {
        cancelAnimationFrame(prev);
        activeRaf.delete(map);
    }

    const startCenter = map.getCenter();
    const startLng = startCenter.lng;
    const startLat = startCenter.lat;
    const startZoom = map.getZoom();

    // The current camera is already corrupt — interpolating FROM a NaN
    // only spreads it frame by frame. Bail; the health watchdog in
    // mapInit.ts restores a finite camera.
    if (
        !Number.isFinite(startLng) ||
        !Number.isFinite(startLat) ||
        !Number.isFinite(startZoom)
    ) {
        console.warn("[safeEase] current camera non-finite — skipping ease");
        return;
    }

    const target = toLngLat(opts.center);
    const dLng = target ? shortestLngDelta(startLng, target[0]) : 0;
    const dLat = target ? target[1] - startLat : 0;
    const targetZoom = typeof opts.zoom === "number" ? opts.zoom : startZoom;
    const dZoom = targetZoom - startZoom;

    if (duration === 0) {
        map.jumpTo({
            center: target ? [startLng + dLng, startLat + dLat] : undefined,
            zoom: targetZoom,
        });
        return;
    }

    const t0 = performance.now();

    function step(now: number) {
        const raw = Math.min(1, (now - t0) / duration);
        const k = easeOutCubic(raw);
        const lng = startLng + dLng * k;
        const lat = startLat + dLat * k;
        const zoom = startZoom + dZoom * k;
        map.jumpTo({
            ...(target && { center: [lng, lat] as [number, number] }),
            zoom,
        });
        if (raw < 1) {
            const id = requestAnimationFrame(step);
            activeRaf.set(map, id);
        } else {
            activeRaf.delete(map);
            // jumpTo already fires moveend/zoomend; don't double-fire.
        }
    }

    const id = requestAnimationFrame(step);
    activeRaf.set(map, id);
}
