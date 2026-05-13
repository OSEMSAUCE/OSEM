// Branded coordinate type. A `Coord` is a [lng, lat] tuple that has been
// validated: both components are finite numbers within geographic range.
//
// The brand makes the type unforgeable — code cannot construct a `Coord`
// except by calling one of the `toCoord*` factories below, each of which
// rejects NaN/Infinity/out-of-range inputs by returning `null`.
//
// Why: Mapbox crashes deep inside its render loop (`_evaluateOpacity` →
// `unproject`) whenever a NaN reaches its projection math. The crash
// stack points at Mapbox internals, not the caller, so the leak is
// nearly impossible to locate after the fact. Validating at the boundary
// — wherever raw coords enter the system (GPS, geojson, user clicks,
// persisted data) — means a Coord value is, by construction, safe.
//
// Use:
//   const c = toCoord(lng, lat);
//   if (!c) return;            // rejected — caller decides fallback
//   marker.setLngLat(c);       // safe; type system guarantees finite
//
// Boundary-only. Internal pure-geometry code that always operates on
// already-validated Coords does not need to re-validate.

declare const CoordBrand: unique symbol;

export type Coord = readonly [number, number] & {
    readonly [CoordBrand]: true;
};

// Geographic bounds. Coords outside these ranges are almost certainly
// a bug (swapped lng/lat, unconverted radians, etc.) and Mapbox will
// either wrap weirdly or produce NaN in projection math.
const LNG_MIN = -180;
const LNG_MAX = 180;
const LAT_MIN = -90;
const LAT_MAX = 90;

function inRange(lng: number, lat: number): boolean {
    return lng >= LNG_MIN && lng <= LNG_MAX && lat >= LAT_MIN && lat <= LAT_MAX;
}

export function toCoord(lng: unknown, lat: unknown): Coord | null {
    if (typeof lng !== "number" || typeof lat !== "number") return null;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (!inRange(lng, lat)) return null;
    return [lng, lat] as unknown as Coord;
}

export function toCoordFromLngLat(
    p: { lng?: unknown; lat?: unknown } | null | undefined,
): Coord | null {
    if (!p) return null;
    return toCoord(p.lng, p.lat);
}

export function toCoordFromArray(a: unknown): Coord | null {
    if (!Array.isArray(a)) return null;
    return toCoord(a[0], a[1]);
}

// Common shape: GeoJSON Point feature, or anything with geometry.coordinates.
export function toCoordFromFeature(
    f: { geometry?: { coordinates?: unknown } } | null | undefined,
): Coord | null {
    if (!f) return null;
    return toCoordFromArray(f.geometry?.coordinates);
}

// Runtime predicate — for cases where the value is already a tuple but
// the type system can't prove it's been validated (e.g. crossing an
// any/unknown boundary). Prefer toCoord/toCoordFromArray for new code.
export function isCoord(c: unknown): c is Coord {
    if (!Array.isArray(c) || c.length < 2) return false;
    const [lng, lat] = c;
    return (
        typeof lng === "number" &&
        typeof lat === "number" &&
        Number.isFinite(lng) &&
        Number.isFinite(lat) &&
        inRange(lng, lat)
    );
}
