// Area-name labels — "a short handle on the map, the full name on tap."
//
// The renderer for the placement convention in labelPlacement.ts (design
// handoff design_handoff_area_names). Every named polygon gets a one-line
// CHIP with its short handle at the centroid — never the full free-text
// name, never wrapped. Labels are a budget placed by priority (recent +
// big); whoever loses the space collapses to a coloured DOT with the
// handle's initial. Zoom sets the budget: zooming out packs centroids,
// more boxes collide, more chips fall back to dots. The selected area
// always keeps its chip. Placement recomputes on zoom / rotate / pitch
// (rAF-debounced), every sync, and on selection change.
//
// DOM markers (mapboxgl.Marker), not a symbol layer: chips need the display
// font, real borders/shadows, and tap targets. Markers survive setStyle
// (no-blink), so consumers only re-sync when the feature array changes.
// Chips and dots are TAPPABLE — a tap fires opts.onSelect(key) (toggles the
// popover, which is where the full name + hectares live).
//
// Each marker element is a positioning ROOT (Mapbox owns its inline
// transform) with the chip/dot as an inner child — the selected scale-up
// animates the child, never the root.
//
// TRACK name labels ride along in the same reconcile: a recorded GPS track
// (LineString, featureType "track") gets its name at the track's midpoint
// as quiet halo text (small, neutral white — same look as the pin captions
// in pinMarkers.ts). Tracks are the lowest label tier: they draw only where
// they clear every placed chip/dot box, and hide otherwise (no dot).
//
// Z-ORDER CONTRACT (label tiers): area chips/dots are TIER 1 — z-index 3
// paints them above the pin markers (z auto) and pin captions. Pin captions
// (tier 2, pinMarkers.ts) additionally treat these labels' rects as
// occupied space — see getAreaLabelRects.
import { area as turfArea } from "@turf/turf";
import type { Feature, LineString, MultiPolygon, Polygon } from "geojson";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import {
	collidesWithPlaced,
	deriveHandle,
	type LabelArea,
	layoutLabels,
	type PlacedBox,
} from "./labelPlacement";
import {
	assignOverlapColors,
	BOUNDARY_PIN_MAXZOOM,
	geometryBbox,
	POLYGON_OUTLINE,
	type RingBbox,
} from "./mapDraw";

// Track-label font metrics — must match the .track-label CSS below.
const TRACK_PX = 12.5;
const TRACK_BOX_PAD = 4;

type Entry = {
	marker: Marker;
	/** Positioning root (the Mapbox marker element — inline transform). */
	root: HTMLDivElement;
	/** The chip/dot (areas) or the text itself (tracks). */
	inner: HTMLDivElement;
	kind: "area" | "track";
	center: [number, number];
	fullName: string;
	handle: string;
	hectares: number;
	visitedDaysAgo: number;
};

type MapState = {
	entries: Map<string, Entry>;
	selectedKey: string | null;
	onSelect: ((key: string) => void) | null;
	wired: boolean;
	raf: number | null;
};

const stateByMap = new WeakMap<MapboxMap, MapState>();

// Injected once per document — the module owns its own CSS so every consumer
// (mobile route, OSEM demo) renders identical labels without duplicating a
// :global block. Tokens are the handoff's, with each chip taking its own
// polygon's identity colour via --area-color (overlap-cycle stroke; rust
// when unstacked). html.native kills backdrop-filter (device perf rule).
const STYLE_ID = "osem-area-label-style";
const FONT_STACK = `"Baloo 2", var(--rt-font-display, sans-serif)`;
const CSS = `
.area-label {
	z-index: 3;
}
.area-label--selected {
	z-index: 5;
}
.area-chip {
	font-family: ${FONT_STACK};
	font-weight: 700;
	font-size: 14px;
	line-height: 1.1;
	letter-spacing: 0.01em;
	color: var(--area-color, #F3C61E);
	background: rgba(13, 15, 8, 0.82);
	backdrop-filter: blur(2px);
	border: 1.6px solid color-mix(in srgb, var(--area-color, #F3C61E) 52%, transparent);
	padding: 4px 11px;
	border-radius: 11px;
	box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5);
	white-space: nowrap;
	max-width: 150px;
	overflow: hidden;
	text-overflow: ellipsis;
	text-align: center;
	cursor: pointer;
	transition:
		transform 0.16s cubic-bezier(0.3, 1.4, 0.5, 1),
		opacity 0.16s ease,
		background 0.16s ease;
}
html.native .area-chip {
	backdrop-filter: none;
}
.area-label--selected .area-chip {
	background: var(--area-color, #F3C61E);
	color: #15170f;
	border-color: color-mix(in srgb, var(--area-color, #F3C61E) 82%, #fff);
	transform: scale(1.06);
	box-shadow:
		0 8px 22px rgba(0, 0, 0, 0.55),
		0 0 0 3px color-mix(in srgb, var(--area-color, #F3C61E) 30%, transparent);
}
.area-dot {
	box-sizing: border-box;
	width: 26px;
	height: 26px;
	border-radius: 50%;
	background: var(--area-color, #F3C61E);
	border: 2px solid color-mix(in srgb, var(--area-color, #F3C61E) 80%, #fff);
	color: #15170f;
	font-family: ${FONT_STACK};
	font-weight: 800;
	font-size: 13px;
	line-height: 22px;
	text-align: center;
	box-shadow: 0 3px 9px rgba(0, 0, 0, 0.5);
	cursor: pointer;
	transition: transform 0.16s cubic-bezier(0.3, 1.4, 0.5, 1);
}
.track-label {
	font-family: ${FONT_STACK};
	font-weight: 700;
	font-size: ${TRACK_PX}px;
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
		state = {
			entries: new Map(),
			selectedKey: null,
			onSelect: null,
			wired: false,
			raf: null,
		};
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

// Shared canvas for text measuring — the placement pass needs label box
// widths without touching layout.
let measureCtx: CanvasRenderingContext2D | null = null;
function measureText(text: string, px: number, weight = 700): number {
	if (!measureCtx) {
		measureCtx = document.createElement("canvas").getContext("2d");
		if (!measureCtx) return text.length * px * 0.6; // headless fallback
	}
	measureCtx.font = `${weight} ${px}px "Baloo 2", sans-serif`;
	return measureCtx.measureText(text).width;
}

/** Days since an ISO timestamp — recency input to the priority score.
 *  0 when the feature carries no usable stamp (score falls back to size). */
function daysAgo(props: Record<string, unknown> | null | undefined): number {
	const iso = (props?.lastTouched ?? props?.createdAt) as string | undefined;
	if (!iso) return 0;
	const t = new Date(iso).getTime();
	if (!Number.isFinite(t)) return 0;
	return Math.max(0, (Date.now() - t) / 86_400_000);
}

/**
 * The placement pass — Rule 2 + Rule 3. Runs the priority/collision layout
 * over the area entries and applies each decision (chip / dot), then places
 * track labels as the lowest tier (hide on collide). Re-run on every camera
 * change (rAF-debounced), sync, and selection change.
 */
function place(map: MapboxMap): void {
	const state = stateByMap.get(map);
	if (!state) return;
	// Below the boundary-pin handoff zoom the pins carry the names — no
	// labels at all (mirrors the boundary-pin layers' zoom gates).
	const zoom = map.getZoom();
	if (!Number.isFinite(zoom) || zoom < BOUNDARY_PIN_MAXZOOM) {
		for (const { root } of state.entries.values()) {
			root.style.display = "none";
		}
		return;
	}

	const areaEntries: [string, Entry][] = [];
	const trackEntries: [string, Entry][] = [];
	for (const pair of state.entries) {
		(pair[1].kind === "area" ? areaEntries : trackEntries).push(pair);
	}

	const areas: LabelArea[] = areaEntries.map(([key, e]) => ({
		id: key,
		fullName: e.fullName,
		displayName: e.handle,
		hectares: e.hectares,
		visitedDaysAgo: e.visitedDaysAgo,
	}));
	const byId = new Map(areaEntries);

	const { decisions, placed } = layoutLabels(areas, {
		prioMode: "both",
		selectedId: state.selectedKey,
		collapseLosersToDot: true,
		project: (a) => {
			const e = byId.get(a.id) as Entry;
			const p = map.project({ lng: e.center[0], lat: e.center[1] });
			return { x: p.x, y: p.y };
		},
		measureText,
	});

	for (const d of decisions) {
		const e = byId.get(d.id);
		if (!e) continue;
		e.root.style.display = "";
		if (d.kind === "label") {
			e.inner.className = "area-chip";
			if (e.inner.textContent !== e.handle) e.inner.textContent = e.handle;
		} else if (d.kind === "dot") {
			e.inner.className = "area-dot";
			const mono = (e.handle[0] ?? "?").toUpperCase();
			if (e.inner.textContent !== mono) e.inner.textContent = mono;
		} else {
			e.root.style.display = "none";
		}
	}

	// Track labels — lowest tier: draw only where the text clears every
	// placed chip/dot box; a losing track name hides (no dot fallback).
	for (const [, e] of trackEntries) {
		const p = map.project({ lng: e.center[0], lat: e.center[1] });
		const w = measureText(e.handle, TRACK_PX);
		const h = TRACK_PX * 1.14;
		const box: PlacedBox = {
			x0: p.x - w / 2 - TRACK_BOX_PAD,
			y0: p.y - h / 2 - TRACK_BOX_PAD,
			x1: p.x + w / 2 + TRACK_BOX_PAD,
			y1: p.y + h / 2 + TRACK_BOX_PAD,
		};
		if (collidesWithPlaced(box, placed)) {
			e.root.style.display = "none";
		} else {
			e.root.style.display = "";
			placed.push(box);
		}
	}
}

function schedulePlace(map: MapboxMap): void {
	const state = stateByMap.get(map);
	if (!state || state.raf !== null) return;
	state.raf = requestAnimationFrame(() => {
		state.raf = null;
		place(map);
	});
}

export interface AreaLabelOpts {
	/** Tap on a chip or dot — the consumer toggles selection (popover with
	 *  the full name + hectares; "dim the rest" is the consumer's veil). */
	onSelect?: (key: string) => void;
}

/**
 * Reconcile the area chip/dot + track-name markers to the given feature
 * array. Call alongside every completed-features source push — idempotent,
 * cheap for unchanged features. Features without a name get no label.
 * The chip text is `displayName` (the editable short handle) when set,
 * else deriveHandle(name) — never the raw full name (Rule 1).
 */
export function syncAreaLabels(
	map: MapboxMap,
	features: Feature[],
	opts?: AreaLabelOpts,
): void {
	ensureCss();
	const state = getState(map);
	if (opts?.onSelect) state.onSelect = opts.onSelect;
	if (!state.wired) {
		state.wired = true;
		const onCamera = () => schedulePlace(map);
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
		const fullName = String(feat.properties?.name ?? "").trim();
		if (fullName === "") continue;
		// Areas anchor at the bbox centre; tracks at their middle vertex.
		let center: [number, number];
		if (isArea) {
			const bbox: RingBbox | null = geometryBbox(g as Polygon | MultiPolygon);
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
		const kind = isArea ? "area" : "track";
		// The chip shows the user-editable short handle; the derived
		// suggestion is the fallback, never the raw paragraph (Rule 1).
		const rawHandle = isArea
			? String(feat.properties?.displayName ?? "").trim() ||
				deriveHandle(fullName)
			: fullName;
		// TRUNCATION IS VISIBLE TRUTH — whenever the map shows anything less
		// than the full name (even a clean cut at a word boundary), the chip
		// wears a "…" so you know there's more on tap. If the text ALSO
		// overflows the 150px cap, the CSS ellipsis simply replaces this one.
		const handle =
			isArea && rawHandle !== fullName ? `${rawHandle}…` : rawHandle;
		let entry = state.entries.get(key);
		if (entry && entry.kind !== kind) {
			entry.marker.remove();
			state.entries.delete(key);
			entry = undefined;
		}
		if (!entry) {
			const root = document.createElement("div");
			let inner: HTMLDivElement;
			if (isArea) {
				root.className = "area-label";
				inner = document.createElement("div");
				inner.className = "area-chip";
				root.appendChild(inner);
				root.addEventListener("click", (e) => {
					e.stopPropagation();
					stateByMap.get(map)?.onSelect?.(key);
				});
			} else {
				root.className = "track-label";
				inner = root;
			}
			const marker = new mapboxgl.Marker({ element: root, anchor: "center" })
				.setLngLat(center)
				.addTo(map);
			entry = {
				marker,
				root,
				inner,
				kind,
				center,
				fullName,
				handle,
				hectares: 0,
				visitedDaysAgo: 0,
			};
			state.entries.set(key, entry);
		} else {
			entry.marker.setLngLat(center);
			entry.center = center;
		}
		entry.fullName = fullName;
		entry.handle = handle;
		entry.visitedDaysAgo = daysAgo(feat.properties);
		if (isArea) {
			// Cached hectares when the store computed them; else measure the
			// live geometry. Feeds the "big" half of the priority score.
			const cached = Number(feat.properties?.hectaresCalc);
			let ha = Number.isFinite(cached) && cached > 0 ? cached : 0;
			if (ha === 0) {
				try {
					ha = turfArea(feat) / 10_000;
				} catch {
					ha = 0; // degenerate ring — score by recency only
				}
			}
			entry.hectares = ha;
			entry.root.style.setProperty(
				"--area-color",
				colors.get(i)?.stroke ?? POLYGON_OUTLINE,
			);
		} else if (entry.inner.textContent !== fullName) {
			entry.inner.textContent = fullName;
		}
		entry.root.classList.toggle(
			"area-label--selected",
			isArea && key === state.selectedKey,
		);
	}
	for (const [key, entry] of state.entries) {
		if (!seen.has(key)) {
			entry.marker.remove();
			state.entries.delete(key);
		}
	}
	place(map);
}

/** Selection: the selected area is forced to the front of the budget and
 *  always keeps its chip (flooded with its colour, ink text, lifted).
 *  Pass the feature's mapFeatureKey, or null to clear. Re-runs placement —
 *  selection reshuffles who wins the space. */
export function setSelectedAreaLabel(map: MapboxMap, key: string | null): void {
	const state = getState(map);
	state.selectedKey = key;
	for (const [k, entry] of state.entries) {
		entry.root.classList.toggle(
			"area-label--selected",
			entry.kind === "area" && k === key,
		);
	}
	place(map);
}

/** Client-space bounding rects of the area chips/dots + track labels
 *  currently visible. Reserved space: the pin-caption placer
 *  (pinMarkers.ts) claims these first, so a pin caption is dropped rather
 *  than ever crowding a name label. */
export function getAreaLabelRects(map: MapboxMap): DOMRect[] {
	const state = stateByMap.get(map);
	if (!state) return [];
	const out: DOMRect[] = [];
	for (const { root } of state.entries.values()) {
		if (root.style.display === "none") continue;
		const r = root.getBoundingClientRect();
		if (r.width > 0 && r.height > 0) out.push(r);
	}
	return out;
}
