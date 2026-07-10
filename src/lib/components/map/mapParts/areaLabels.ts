// Area-name labels — the polygon's NAME crammed inside the shape.
//
// DOM markers (mapboxgl.Marker), not a symbol layer: the label wants the
// app's display font, a multi-layer dark halo (text-shadow), and a per-
// polygon wrapping width — none of which GL text can do. Same DOM-marker
// convention as pins. Markers survive setStyle (no-blink), so consumers
// only re-sync when the feature array changes, not on style reloads.
//
// The resting label is the name ONLY — hectares live in the AREA popover on
// tap, never on the map. Halo text, no pill: the text takes the polygon's
// identity colour (its overlap-cycle stroke; rust when unstacked) over a
// heavy dark halo so it reads on satellite imagery. It wraps to ~86% of the
// polygon's projected bbox width and NEVER truncates — a half-name is
// useless. Hidden below BOUNDARY_PIN_MAXZOOM, where the boundary pins carry
// the name instead.
//
// TRACK name labels ride along in the same reconcile: a recorded GPS track
// (LineString, featureType "track") gets its name at the track's midpoint in
// the quieter tier-2 caption style (small, neutral white — same look as the
// pin captions in pinMarkers.ts), not the loud coloured area treatment.
import type { Feature, LineString, MultiPolygon, Polygon } from "geojson";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import {
	assignOverlapColors,
	BOUNDARY_PIN_MAXZOOM,
	geometryBbox,
	POLYGON_OUTLINE,
	type RingBbox,
} from "./mapDraw";

const MAX_WIDTH_FRACTION = 0.86;

type Entry = {
	marker: Marker;
	el: HTMLDivElement;
	/** Geo bbox driving the wrap width — null for track labels (nowrap). */
	bbox: RingBbox | null;
};
type MapState = {
	entries: Map<string, Entry>;
	selectedKey: string | null;
	wired: boolean;
};

const stateByMap = new WeakMap<MapboxMap, MapState>();

// Injected once per document — the module owns its own CSS so every consumer
// (mobile route, OSEM demo) renders identical labels without duplicating a
// :global block. Selected state = white ink + one extra halo layer; still
// halo text, never a pill, in any state.
//
// Z-ORDER CONTRACT (label tiers): area names are TIER 1 — z-index 3 paints
// them above the pin markers (z auto) and pin captions, so a marker or
// caption never covers an area name. Pin captions (tier 2, pinMarkers.ts)
// additionally treat these labels' rects as occupied space — see
// getAreaLabelRects below.
const STYLE_ID = "osem-area-label-style";
const CSS = `
.area-label {
	z-index: 3;
	font-family: "Baloo 2", var(--rt-font-display, sans-serif);
	font-weight: 800;
	font-size: 15px;
	line-height: 1.14;
	letter-spacing: 0.01em;
	color: var(--area-color, #F3C61E);
	text-shadow:
		0 0 2px #000, 0 0 4px #000,
		0 1px 3px rgba(0, 0, 0, 0.95),
		1px 0 0 rgba(0, 0, 0, 0.85), -1px 0 0 rgba(0, 0, 0, 0.85),
		0 1px 0 rgba(0, 0, 0, 0.85), 0 -1px 0 rgba(0, 0, 0, 0.85);
	white-space: normal;
	text-wrap: pretty;
	text-align: center;
	pointer-events: none;
}
.area-label--selected {
	color: #fff;
	text-shadow:
		0 0 2px #000, 0 0 4px #000, 0 0 6px #000,
		0 1px 3px rgba(0, 0, 0, 0.95),
		1px 0 0 rgba(0, 0, 0, 0.85), -1px 0 0 rgba(0, 0, 0, 0.85),
		0 1px 0 rgba(0, 0, 0, 0.85), 0 -1px 0 rgba(0, 0, 0, 0.85);
}
.track-label {
	font-family: "Baloo 2", var(--rt-font-display, sans-serif);
	font-weight: 700;
	font-size: 12.5px;
	line-height: 1.14;
	color: #f2f3ea;
	text-align: center;
	white-space: nowrap;
	pointer-events: none;
	text-shadow:
		0 0 2px #000, 0 1px 2px #000, 0 0 5px rgba(0, 0, 0, 0.92),
		1px 0 0 rgba(0, 0, 0, 0.8), -1px 0 0 rgba(0, 0, 0, 0.8);
}
`;

function ensureCss(): void {
	if (typeof document === "undefined") return;
	if (document.getElementById(STYLE_ID)) return;
	const style = document.createElement("style");
	style.id = STYLE_ID;
	style.textContent = CSS;
	document.head.appendChild(style);
}

function getState(map: MapboxMap): MapState {
	let state = stateByMap.get(map);
	if (!state) {
		state = { entries: new Map(), selectedKey: null, wired: false };
		stateByMap.set(map, state);
	}
	return state;
}

/** Stable marker identity: the persisted mapFeatureKey when present (mobile
 *  features always carry one), array index otherwise (OSEM demo). */
function labelKey(feat: Feature, idx: number): string {
	const k = feat.properties?.mapFeatureKey;
	return typeof k === "string" && k !== "" ? k : `__idx:${idx}`;
}

/** Re-fit every label to the current camera: the wrap width tracks the
 *  polygon's projected bbox, and the whole set hides below the boundary-pin
 *  handoff zoom (mirrors the old symbol layer's minzoom). */
function refit(map: MapboxMap): void {
	const state = stateByMap.get(map);
	if (!state) return;
	const visible = map.getZoom() >= BOUNDARY_PIN_MAXZOOM;
	for (const { el, bbox } of state.entries.values()) {
		if (!visible) {
			el.style.display = "none";
			continue;
		}
		el.style.display = "";
		// Track labels are nowrap — no wrap width to maintain.
		if (!bbox) continue;
		// Project all four bbox corners — under rotation/pitch the quad
		// tilts, and the widest projected extent is what the text may span.
		const corners: [number, number][] = [
			[bbox[0], bbox[1]],
			[bbox[2], bbox[1]],
			[bbox[2], bbox[3]],
			[bbox[0], bbox[3]],
		];
		let minX = Infinity;
		let maxX = -Infinity;
		for (const [lng, lat] of corners) {
			const p = map.project({ lng, lat });
			if (!Number.isFinite(p.x)) continue;
			if (p.x < minX) minX = p.x;
			if (p.x > maxX) maxX = p.x;
		}
		if (maxX <= minX) continue;
		el.style.maxWidth = `${Math.max(24, Math.round((maxX - minX) * MAX_WIDTH_FRACTION))}px`;
	}
}

/**
 * Reconcile the area-name + track-name markers to the given feature array.
 * Call alongside every completed-features source push — idempotent, cheap
 * for unchanged features (setLngLat + text compare). Features without a
 * name get no label.
 */
export function syncAreaLabels(map: MapboxMap, features: Feature[]): void {
	ensureCss();
	const state = getState(map);
	if (!state.wired) {
		state.wired = true;
		const onCamera = () => refit(map);
		map.on("zoom", onCamera);
		map.on("rotate", onCamera);
		map.on("pitch", onCamera);
	}
	const colors = assignOverlapColors(features);
	const seen = new Set<string>();
	for (let i = 0; i < features.length; i++) {
		const feat = features[i];
		const g = feat.geometry;
		const isArea = g?.type === "Polygon" || g?.type === "MultiPolygon";
		const isTrack =
			g?.type === "LineString" && feat.properties?.featureType === "track";
		if (!isArea && !isTrack) continue;
		const name = String(feat.properties?.name ?? "").trim();
		if (name === "") continue;
		// Areas anchor at the bbox centre (label wraps to the bbox width);
		// tracks anchor at their middle vertex (nowrap).
		let bbox: RingBbox | null = null;
		let center: [number, number];
		if (isArea) {
			bbox = geometryBbox(g as Polygon | MultiPolygon);
			if (!bbox) continue;
			center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
		} else {
			const coords = (g as LineString).coordinates;
			const mid = coords[Math.floor((coords.length - 1) / 2)];
			if (!mid || !mid.every((n) => Number.isFinite(n))) continue;
			center = [mid[0], mid[1]];
		}
		const key = labelKey(feat, i);
		seen.add(key);
		const className = isArea ? "area-label" : "track-label";
		let entry = state.entries.get(key);
		if (entry && !entry.el.classList.contains(className)) {
			// Geometry kind changed under the same key — rebuild the marker.
			entry.marker.remove();
			state.entries.delete(key);
			entry = undefined;
		}
		if (!entry) {
			const el = document.createElement("div");
			el.className = className;
			const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
				.setLngLat(center)
				.addTo(map);
			entry = { marker, el, bbox };
			state.entries.set(key, entry);
		} else {
			entry.marker.setLngLat(center);
			entry.bbox = bbox;
		}
		if (entry.el.textContent !== name) entry.el.textContent = name;
		if (isArea) {
			entry.el.style.setProperty(
				"--area-color",
				colors.get(i)?.stroke ?? POLYGON_OUTLINE,
			);
		}
		entry.el.classList.toggle(
			"area-label--selected",
			key === state.selectedKey,
		);
	}
	for (const [key, entry] of state.entries) {
		if (!seen.has(key)) {
			entry.marker.remove();
			state.entries.delete(key);
		}
	}
	refit(map);
}

/** Brighten the selected feature's name label (white ink + one extra halo
 *  layer for areas; white ink for tracks). Pass the feature's mapFeatureKey,
 *  or null to clear. Sticky across re-syncs until changed. */
export function setSelectedAreaLabel(map: MapboxMap, key: string | null): void {
	const state = getState(map);
	state.selectedKey = key;
	for (const [k, entry] of state.entries) {
		entry.el.classList.toggle("area-label--selected", k === key);
	}
}

/** Client-space bounding rects of the area + track name labels currently
 *  visible. Reserved space: the pin-caption placer (pinMarkers.ts) claims
 *  these first, so a pin caption is dropped rather than ever crowding an
 *  area or track name. */
export function getAreaLabelRects(map: MapboxMap): DOMRect[] {
	const state = stateByMap.get(map);
	if (!state) return [];
	const out: DOMRect[] = [];
	for (const { el } of state.entries.values()) {
		if (el.style.display === "none") continue;
		const r = el.getBoundingClientRect();
		if (r.width > 0 && r.height > 0) out.push(r);
	}
	return out;
}
