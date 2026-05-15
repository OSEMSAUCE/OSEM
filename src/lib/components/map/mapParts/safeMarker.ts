// Global runtime guards against NaN reaching Mapbox.
//
// `safeMap.ts` covers the camera-mutation boundary (flyTo/easeTo/...) and
// is lint-enforced. But three other call paths also feed coords to Mapbox
// and have caused the same "Invalid LngLat (NaN, NaN)" /
// `_calcMatrices: cannot read properties of null` crashes:
//
//   1. `marker.setLngLat(coord)` — pin placement
//   2. `popup.setLngLat(coord)`  — info popups
//   3. `source.setData(geojson)` — pin/line/polygon source updates
//
// Patching the prototypes once at app boot puts a wall in front of all
// three. Each guard:
//   - lets finite input through unchanged
//   - short-circuits non-finite input (no Mapbox throw, no state corruption)
//   - logs a `console.error` tagged for grep with the originating stack
//   - is idempotent (re-install is a no-op)
//
// Boundary patching, not a refactor — every existing call site keeps
// working. Call `installMapboxNanGuards()` once on mobile-layout mount.

import type {
	Feature,
	FeatureCollection,
	GeoJsonProperties,
	Geometry,
} from "geojson";
import mapboxgl from "mapbox-gl";
import { isCoord } from "./coord";

const MARKER_INSTALLED = Symbol.for("retreever.safeMarker.installed");
const POPUP_INSTALLED = Symbol.for("retreever.safePopup.installed");
const SOURCE_INSTALLED = Symbol.for("retreever.safeSource.installed");
const ADDSOURCE_INSTALLED = Symbol.for("retreever.safeAddSource.installed");
const OPACITY_INSTALLED = Symbol.for("retreever.safeMarkerOpacity.installed");

type LngLatLike =
	| [number, number]
	| { lng: number; lat: number }
	| { lon: number; lat: number };

function lngLatIsFinite(p: unknown): boolean {
	if (Array.isArray(p)) {
		return p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]);
	}
	if (p && typeof p === "object") {
		const o = p as { lng?: unknown; lon?: unknown; lat?: unknown };
		const lng = o.lng ?? o.lon;
		return Number.isFinite(lng) && Number.isFinite(o.lat);
	}
	return false;
}

function patchSetLngLat(
	proto:
		| (Record<string, unknown> & {
				setLngLat?: (p: LngLatLike) => unknown;
		  })
		| undefined,
	installedKey: symbol,
	tag: string,
): void {
	if (!proto || typeof proto.setLngLat !== "function") return;
	if ((proto as Record<symbol, unknown>)[installedKey]) return;

	const original = proto.setLngLat;
	proto.setLngLat = function patched(this: unknown, p: LngLatLike) {
		if (!lngLatIsFinite(p)) {
			const err = new Error(`${tag}.setLngLat rejected non-finite coord`);
			console.error(`[${tag.toLowerCase()}NanGuard]`, p, err.stack);
			return this;
		}
		return (original as (p: LngLatLike) => unknown).call(this, p);
	} as typeof proto.setLngLat;

	(proto as Record<symbol, unknown>)[installedKey] = true;
}

export function installMarkerNanGuard(): void {
	patchSetLngLat(
		mapboxgl?.Marker?.prototype as unknown as Parameters<typeof patchSetLngLat>[0],
		MARKER_INSTALLED,
		"Marker",
	);
}

export function installPopupNanGuard(): void {
	patchSetLngLat(
		mapboxgl?.Popup?.prototype as unknown as Parameters<typeof patchSetLngLat>[0],
		POPUP_INSTALLED,
		"Popup",
	);
}

// Filter geojson features whose Point geometry has non-finite coords.
// Non-Point geometries pass through (their crash modes are different
// and rarer; lines/polygons made of NaN tuples would need a deeper walk).
function filterFiniteFeatures(
	data: FeatureCollection<Geometry, GeoJsonProperties> | Feature | unknown,
): typeof data {
	if (!data || typeof data !== "object") return data;
	const d = data as { type?: string; features?: unknown };
	if (d.type === "FeatureCollection" && Array.isArray(d.features)) {
		let dropped = 0;
		const safe = (d.features as Feature[]).filter((f) => {
			if (!f?.geometry) return false;
			if (f.geometry.type !== "Point") return true;
			const ok = isCoord(f.geometry.coordinates);
			if (!ok) dropped++;
			return ok;
		});
		if (dropped > 0) {
			console.error(
				`[sourceNanGuard] dropped ${dropped} non-finite Point feature(s)`,
				new Error("setData received non-finite coords").stack,
			);
		}
		if (safe.length === (d.features as Feature[]).length) return data;
		return { ...(data as object), features: safe } as typeof data;
	}
	if (d.type === "Feature") {
		const f = data as Feature;
		if (f.geometry?.type === "Point" && !isCoord(f.geometry.coordinates)) {
			console.error(
				"[sourceNanGuard] rejected non-finite Point feature",
				new Error("setData received non-finite coord").stack,
			);
			return { ...f, geometry: { ...f.geometry, coordinates: [0, 0] } };
		}
	}
	return data;
}

export function installGeoJSONSourceNanGuard(): void {
	// GeoJSONSource is exposed on mapboxgl in v2+. Defensive lookup: if
	// the runtime shape changes, skip silently rather than crash boot.
	const Source = (
		mapboxgl as unknown as {
			GeoJSONSource?: { prototype?: Record<string, unknown> };
		}
	).GeoJSONSource;
	const proto = Source?.prototype as
		| (Record<string, unknown> & {
				setData?: (d: unknown) => unknown;
		  })
		| undefined;
	if (!proto || typeof proto.setData !== "function") return;
	if ((proto as Record<symbol, unknown>)[SOURCE_INSTALLED]) return;

	const original = proto.setData;
	proto.setData = function patched(this: unknown, data: unknown) {
		const safe = filterFiniteFeatures(data);
		return (original as (d: unknown) => unknown).call(this, safe);
	} as typeof proto.setData;

	(proto as Record<symbol, unknown>)[SOURCE_INSTALLED] = true;
}

// `GeoJSONSource.setData` only covers updates. The INITIAL `data` payload
// passed to `map.addSource({ type: 'geojson', data })` reaches the
// renderer without going through `setData` — that's the path
// `_evaluateOpacity` → `unproject` crashes on when an OSM/Overpass feed
// has a node with missing lat/lon. Patch `addSource` to filter geojson
// data on the way in too.
export function installAddSourceNanGuard(): void {
	const proto = (
		mapboxgl as unknown as {
			Map?: { prototype?: Record<string, unknown> };
		}
	).Map?.prototype as
		| (Record<string, unknown> & {
				addSource?: (id: string, source: unknown) => unknown;
		  })
		| undefined;
	if (!proto || typeof proto.addSource !== "function") return;
	if ((proto as Record<symbol, unknown>)[ADDSOURCE_INSTALLED]) return;

	const original = proto.addSource;
	proto.addSource = function patched(
		this: unknown,
		id: string,
		source: unknown,
	) {
		const s = source as { type?: string; data?: unknown } | null;
		if (s && s.type === "geojson" && s.data && typeof s.data === "object") {
			const safe = filterFiniteFeatures(s.data);
			if (safe !== s.data) {
				return (
					original as (id: string, src: unknown) => unknown
				).call(this, id, { ...s, data: safe });
			}
		}
		return (original as (id: string, src: unknown) => unknown).call(
			this,
			id,
			source,
		);
	} as typeof proto.addSource;

	(proto as Record<symbol, unknown>)[ADDSOURCE_INSTALLED] = true;
}

// `Marker._evaluateOpacity` runs every render frame to fade markers that
// are occluded by 3D terrain / behind the globe. It projects the marker's
// lnglat to a screen point and `unproject`s it back for an occlusion test.
// When the camera transform is momentarily degenerate (globe-projection
// transitions, a frame before the canvas has real dimensions, terrain
// settling), the projection yields a non-finite point and `unproject`
// throws `Invalid LngLat (NaN, NaN)`.
//
// That throw escapes the render loop and kills the whole frame — and it
// recurs every frame, so it floods the console. No coordinate guard can
// prevent it: the marker's lnglat is valid; it's the transform that's bad
// for that one frame. The opacity fade is purely cosmetic, so the fix is
// to make the method non-throwing: swallow the error and let the frame
// render (the marker just keeps its previous opacity that frame).
let opacityGuardLogged = false;
export function installMarkerOpacityGuard(): void {
	const proto = mapboxgl?.Marker?.prototype as unknown as
		| (Record<string, unknown> & { _evaluateOpacity?: () => unknown })
		| undefined;
	if (!proto || typeof proto._evaluateOpacity !== "function") return;
	if ((proto as Record<symbol, unknown>)[OPACITY_INSTALLED]) return;

	const original = proto._evaluateOpacity;
	proto._evaluateOpacity = function patched(this: unknown) {
		try {
			return (original as () => unknown).call(this);
		} catch (err) {
			// Log once — this fires per-frame, logging every time would
			// itself flood the console.
			if (!opacityGuardLogged) {
				opacityGuardLogged = true;
				console.error(
					"[markerOpacityGuard] suppressed _evaluateOpacity throw " +
						"(degenerate camera transform); marker opacity fade " +
						"skipped this frame.",
					err,
				);
			}
			return undefined;
		}
	} as typeof proto._evaluateOpacity;

	(proto as Record<symbol, unknown>)[OPACITY_INSTALLED] = true;
}

export function installMapboxNanGuards(): void {
	installMarkerNanGuard();
	installPopupNanGuard();
	installGeoJSONSourceNanGuard();
	installAddSourceNanGuard();
	installMarkerOpacityGuard();
}
