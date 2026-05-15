// Global Marker.setLngLat guard.
//
// safeMap.ts covers camera mutations (flyTo, easeTo, fitBounds...). Markers
// take coords via a different path — `new Marker().setLngLat([lng, lat])` —
// and aren't covered by the camera lint. When NaN slips through there,
// Mapbox throws `Invalid LngLat object: (NaN, NaN)` deep inside its render
// loop with no caller stack, which is the bug memory `mapbox-camera-via-
// safeMap` was about.
//
// This module patches `Marker.prototype.setLngLat` once at app boot:
//   - finite coords pass through unchanged
//   - non-finite coords short-circuit (no Mapbox throw, no marker move),
//     log a `console.error` with the originating call stack, and return
//     the marker so chaining still works.
//
// Boundary patching, not a refactor — every existing setLngLat site keeps
// working. Idempotent: re-installing is a no-op.

import mapboxgl from "mapbox-gl";

const INSTALLED = Symbol.for("retreever.safeMarker.installed");

type LngLatLike =
    | [number, number]
    | { lng: number; lat: number }
    | { lon: number; lat: number };

function lngLatIsFinite(p: unknown): boolean {
    if (Array.isArray(p)) {
        return (
            p.length >= 2 &&
            Number.isFinite(p[0]) &&
            Number.isFinite(p[1])
        );
    }
    if (p && typeof p === "object") {
        const o = p as { lng?: unknown; lon?: unknown; lat?: unknown };
        const lng = o.lng ?? o.lon;
        return Number.isFinite(lng) && Number.isFinite(o.lat);
    }
    return false;
}

export function installMarkerNanGuard(): void {
    const proto = mapboxgl?.Marker?.prototype as
        | (Record<string, unknown> & {
              setLngLat?: (p: LngLatLike) => unknown;
          })
        | undefined;
    if (!proto || typeof proto.setLngLat !== "function") return;
    if ((proto as Record<symbol, unknown>)[INSTALLED]) return;

    const original = proto.setLngLat;
    proto.setLngLat = function patchedSetLngLat(this: unknown, p: LngLatLike) {
        if (!lngLatIsFinite(p)) {
            const err = new Error("Marker.setLngLat rejected non-finite coord");
            console.error("[safeMarker]", p, err.stack);
            return this;
        }
        return (original as (p: LngLatLike) => unknown).call(this, p);
    } as typeof proto.setLngLat;

    (proto as Record<symbol, unknown>)[INSTALLED] = true;
}
