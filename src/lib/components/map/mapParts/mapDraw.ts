// Shared draw-engine helpers.
//
// Pure, side-effect-free builders for GeoJSON FeatureCollections that feed the
// Mapbox sources used by the draw UX (polygon + line). The reactive state
// (drawIntent, drawnVertices, completedFeatures, …) stays in the Svelte
// component that owns the draw UI. This module only knows about geometry.
//
// Consumers: `mobMapPage.svelte` today. `mapPage.svelte` when the desktop
// draw UI lands (see mapDocs.md).

import { area, featureCollection, intersect } from "@turf/turf";
import type {
	Feature,
	FeatureCollection,
	LineString,
	MultiPolygon,
	Point,
	Polygon,
} from "geojson";
import type {
	ExpressionSpecification,
	FilterSpecification,
	GeoJSONSource,
	Map as MapboxMap,
} from "mapbox-gl";
import { deriveHandle } from "./labelPlacement";
import { newId } from "./newId";

export type DrawIntent = "polygon" | "line" | "pin" | null;
export type Lnglat = [number, number];

const DRAW_SOURCE_IDS = [
	"draw-edges",
	"draw-vertices",
	"provisional-polygon",
] as const;
const COMPLETED_SOURCE_ID = "completed-features";

// ── Boundary pins ───────────────────────────────────────────────────────
// Below this zoom a multi-hectare polygon is a sub-8px speck, so each saved
// polygon ALSO feeds a clustered centroid source that renders as a tappable
// rust pin (solo) or a counted bubble (several close together) — the stock
// polygon-to-point degradation convention, same native-clustering recipe as
// the gold pin bubbles in pinMarkers.ts. At/above this zoom the pins vanish
// and the polygons + area-name labels (areaLabels.ts) take over.
export const BOUNDARY_PIN_MAXZOOM = 11;
const CENTROID_SOURCE_ID = "completed-centroids";
const CENTROID_CLUSTER_LAYER = "completed-centroid-cluster";
const CENTROID_CLUSTER_COUNT_LAYER = "completed-centroid-cluster-count";
const CENTROID_PIN_LAYER = "completed-centroid-pin";
const CENTROID_PIN_LABEL_LAYER = "completed-centroid-pin-label";

// Polygon draw colours. The fill is a light orange; the outline + vertex
// dots are a deeper orange rust so a polygon reads as orange — distinct
// from lines, which keep the brown `accent` rust. The completed-stroke
// and completed-vertices-dot layers are shared by both shape types, so
// they switch colour with a data-driven `case` expression.
// POLYGON_OUTLINE is exported as the polygon's default identity colour —
// areaLabels.ts paints the area-name text with it when a polygon carries no
// overlap-cycle colour.
const POLYGON_FILL = "#e8a06a";
export const POLYGON_OUTLINE = "#d97c33";
// Recorded GPS tracks render SAGE so they read apart from hand-drawn lines
// (brown accent) at a glance. Matches the app's --palette-sage token
// (Mapbox paint can't read CSS vars, so the hex is duplicated here).
const TRACK_SAGE = "#838963";

// ── Overlap colour cycle ────────────────────────────────────────────────
// Overlapping polygons cycle through rainbow colours so stacked plots stay
// tellable-apart. Slot 0 is the original rust — a polygon that overlaps
// nothing keeps it and anchors a "stack" as its parent. Every later polygon
// that joins a stack (overlaps any member) takes the NEXT rainbow colour in
// creation order — red, yellow, green, blue, indigo, violet, then red again —
// a plain per-stack sequence, NOT smallest-unused-colour (that made every
// child that only overlaps the parent identically red). Each stack counts
// from red independently. "Earlier" = array order, i.e. creation order, so
// colours are stable as a map grows.
const POLYGON_COLOR_CYCLE: ReadonlyArray<{ fill: string; stroke: string }> = [
	{ fill: POLYGON_FILL, stroke: POLYGON_OUTLINE }, // rust — the original
	{ fill: "#cf4444", stroke: "#b82222" }, // red
	{ fill: "#ecd36e", stroke: "#c9a227" }, // yellow
	{ fill: "#8fd48a", stroke: "#3a9e4e" }, // green
	{ fill: "#7db4ec", stroke: "#2f7fd1" }, // blue
	{ fill: "#9c92ea", stroke: "#5a4bc9" }, // indigo
	{ fill: "#d386e8", stroke: "#a33bc9" }, // violet
];

export type RingBbox = [number, number, number, number];

function outerRingBbox(poly: Polygon): RingBbox {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const [x, y] of poly.coordinates[0] ?? []) {
		if (x < minX) minX = x;
		if (x > maxX) maxX = x;
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;
	}
	return [minX, minY, maxX, maxY];
}

function bboxesIntersect(a: RingBbox, b: RingBbox): boolean {
	return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
}

/** True when two polygons share interior AREA. Uses polygon clipping rather
 *  than `booleanOverlap` because the latter line-intersects the boundaries —
 *  adjacent plots sharing an edge or corner would count, and touching must
 *  NOT recolour. Containment falls out for free (the clip is the inner
 *  polygon). The 1 m² floor ignores sliver artifacts from near-coincident
 *  edges. */
function polygonsShareArea(a: Feature<Polygon>, b: Feature<Polygon>): boolean {
	try {
		const clip = intersect(featureCollection<Polygon>([a, b]));
		return clip !== null && area(clip) > 1;
	} catch {
		return false; // degenerate ring — treat as no overlap
	}
}

/** Colour-cycle entry per feature index for polygons that need a non-rust
 *  colour. Polygons that overlap nothing are absent (they keep the default
 *  rust paint via the layer's `coalesce` fallback). Exported so
 *  areaLabels.ts can paint each name label in its polygon's identity
 *  colour from the SAME assignment the fill/stroke layers use. */
export function assignOverlapColors(
	features: Feature[],
): Map<number, { fill: string; stroke: string }> {
	const out = new Map<number, { fill: string; stroke: string }>();
	const placed: {
		feat: Feature<Polygon>;
		bbox: RingBbox;
		/** placed-index of this polygon's stack anchor (a root points at itself). */
		root: number;
	}[] = [];
	// Rainbow colours already handed out per stack, keyed by root index.
	const stackSize = new Map<number, number>();
	for (let i = 0; i < features.length; i++) {
		const feat = features[i];
		if (feat.geometry?.type !== "Polygon") continue;
		const poly = feat as Feature<Polygon>;
		const bbox = outerRingBbox(poly.geometry);
		// Earliest-drawn overlapping polygon decides which stack this one
		// joins (a polygon bridging two stacks joins the older one).
		let root = -1;
		for (let p = 0; p < placed.length; p++) {
			const prev = placed[p];
			if (!bboxesIntersect(bbox, prev.bbox)) continue;
			if (polygonsShareArea(poly, prev.feat)) {
				root = prev.root;
				break;
			}
		}
		if (root === -1) {
			// Overlaps nothing → rust, and anchors a new stack.
			placed.push({ feat: poly, bbox, root: placed.length });
			continue;
		}
		const n = stackSize.get(root) ?? 0;
		stackSize.set(root, n + 1);
		// Slot 0 is rust (the parent's) — children walk slots 1..6 forever.
		const color = 1 + (n % (POLYGON_COLOR_CYCLE.length - 1));
		placed.push({ feat: poly, bbox, root });
		out.set(i, POLYGON_COLOR_CYCLE[color]);
	}
	return out;
}

/** Fill opacity for a completed polygon with no per-feature override.
 *  Exported so the fill-opacity slider UI shows the same resting value
 *  the layer paints with. Per-feature override = a `fillOpacity` (0–1)
 *  property on the feature, persisted in its geometry JSON. */
export const POLYGON_FILL_OPACITY_DEFAULT = 0.3;

/** Stacked polygons compound their translucency (Mapbox paints each fill
 *  separately — there's no flatten), so a 3-deep pile of 0.3 fills reads
 *  0.66 and hides the imagery. Children of a stack therefore paint thinner:
 *  compounding still happens (depth stays legible) but much slower.
 *  Display-only, stamped as `_stackFillOp` by buildCompletedFC. */
const STACKED_FILL_OPACITY = 0.15;

/** Data-driven fill-opacity: a polygon's own `fillOpacity` property wins
 *  (the user moved the slider), then the stacked-child damper, then the
 *  default. `to-number` guards string values that survive a KML share
 *  round-trip. */
const POLYGON_FILL_OPACITY_EXPR: ExpressionSpecification = [
	"case",
	["has", "fillOpacity"],
	["to-number", ["get", "fillOpacity"], POLYGON_FILL_OPACITY_DEFAULT],
	["has", "_stackFillOp"],
	["to-number", ["get", "_stackFillOp"], POLYGON_FILL_OPACITY_DEFAULT],
	POLYGON_FILL_OPACITY_DEFAULT,
];

// ── Blanket polygon fill opacity ────────────────────────────────────────
// The Legend's Polygon-row slider (polygonOpacity store) fades or BOOSTS
// every polygon fill at once — a 0–2 multiplier over the per-feature
// expression above (centre = 1 = as designed), so per-feature sliders and
// the stack damper keep their relative look. Boosted opacities are capped
// at fully opaque. Outlines never fade. Module-level so a mid-session
// setupDrawSourcesAndLayers self-heal (post-setStyle re-add) recreates the
// fill layer at the CURRENT slider value, not the default.
let polygonFillFactor = 1;

function polygonFillOpacityExpr(): ExpressionSpecification {
	if (polygonFillFactor === 1) return POLYGON_FILL_OPACITY_EXPR;
	return ["min", 1, ["*", polygonFillFactor, POLYGON_FILL_OPACITY_EXPR]];
}

/** Set the blanket fill-opacity factor (0–2, centre 1) and push it onto the
 *  mounted completed-fill layer. Called by the polygonOpacity store's
 *  applier (which maps its 0–1 slider value to 0–2). */
export function applyPolygonFillOpacity(map: MapboxMap, factor: number): void {
	polygonFillFactor = Math.max(0, Math.min(2, factor));
	if (map.getLayer("completed-fill")) {
		map.setPaintProperty(
			"completed-fill",
			"fill-opacity",
			polygonFillOpacityExpr(),
		);
	}
}

function emptyFC(): FeatureCollection {
	return { type: "FeatureCollection", features: [] };
}

export function getAccentColor(fallback = "#b36940"): string {
	if (typeof document === "undefined") return fallback;
	return (
		getComputedStyle(document.documentElement)
			.getPropertyValue("--color-draw")
			.trim() || fallback
	);
}

const VERTEX_HANDLE_LAYERS = [
	"completed-vertices-halo",
	"completed-vertices-dot",
] as const;

// Default filter for the vertex-handle layers: matches Point geometries
// whose `_idx` is -1 — i.e. nothing, since every real feature's `_idx` is
// >= 0. `setVertexHandlesForFeature` swaps in the selected feature's index.
const VERTEX_HANDLES_HIDDEN: FilterSpecification = [
	"all",
	["==", ["geometry-type"], "Point"],
	["==", ["get", "_idx"], -1],
];

/**
 * Adds all sources + layers required by the draw UX to the given map.
 * Truly idempotent — safe to call multiple times on the same map instance.
 */
export function setupDrawSourcesAndLayers(
	map: MapboxMap,
	accent: string,
): void {
	if (map.getSource("draw-edges")) return;

	const empty = emptyFC();

	// In-progress drawing
	map.addSource("draw-edges", { type: "geojson", data: empty });
	map.addSource("draw-vertices", { type: "geojson", data: empty });
	map.addSource("provisional-polygon", { type: "geojson", data: empty });

	map.addLayer({
		id: "draw-edges-halo",
		type: "line",
		source: "draw-edges",
		layout: { "line-cap": "round", "line-join": "round" },
		paint: {
			"line-color": "#1a1a1a",
			"line-width": 6,
			"line-opacity": 0.55,
		},
	});
	map.addLayer({
		id: "draw-edges-line",
		type: "line",
		source: "draw-edges",
		layout: { "line-cap": "round", "line-join": "round" },
		paint: { "line-color": accent, "line-width": 4 },
	});
	map.addLayer({
		id: "provisional-polygon-fill",
		type: "fill",
		source: "provisional-polygon",
		filter: ["==", "$type", "Polygon"],
		paint: { "fill-color": POLYGON_FILL, "fill-opacity": 0.35 },
	});
	map.addLayer({
		id: "provisional-polygon-closing-edge",
		type: "line",
		source: "provisional-polygon",
		filter: ["==", "$type", "LineString"],
		// The provisional-polygon source only ever holds polygon geometry,
		// so this closing edge is always a polygon's — colour it orange.
		paint: {
			"line-color": POLYGON_OUTLINE,
			"line-width": 2.5,
			"line-dasharray": [6, 4],
		},
	});
	map.addLayer({
		id: "draw-vertices-halo",
		type: "circle",
		source: "draw-vertices",
		paint: { "circle-radius": 7, "circle-color": "#ffffff" },
	});
	map.addLayer({
		id: "draw-vertices-dot",
		type: "circle",
		source: "draw-vertices",
		paint: { "circle-radius": 4, "circle-color": accent },
	});

	// Completed features
	map.addSource(COMPLETED_SOURCE_ID, { type: "geojson", data: empty });

	map.addLayer({
		id: "completed-fill",
		type: "fill",
		source: COMPLETED_SOURCE_ID,
		filter: ["==", "$type", "Polygon"],
		// `_fillCol` is the overlap-cycle colour stamped by buildCompletedFC;
		// polygons that overlap nothing carry none and fall back to rust.
		paint: {
			"fill-color": ["coalesce", ["get", "_fillCol"], POLYGON_FILL],
			"fill-opacity": polygonFillOpacityExpr(),
		},
	});
	// Area label — the polygon's NAME at its centroid. Rendered as DOM
	// markers by areaLabels.ts (needs the display font + multi-layer halo +
	// per-polygon wrap width, which GL text can't do), NOT a symbol layer.
	map.addLayer({
		id: "completed-stroke-halo",
		type: "line",
		source: COMPLETED_SOURCE_ID,
		layout: { "line-cap": "round", "line-join": "round" },
		// Tracks draw as a THIN rail (below), so their halo slims to match.
		// Polygon outlines are slightly thinner than line strokes (accuracy >
		// heft), so their halo slims too — same 1.25px reveal each side.
		paint: {
			"line-color": "#1a1a1a",
			"line-width": [
				"case",
				["==", ["get", "featureType"], "track"],
				3,
				["==", ["geometry-type"], "Polygon"],
				5,
				5.5,
			],
			"line-opacity": 0.5,
		},
	});
	map.addLayer({
		id: "completed-stroke",
		type: "line",
		source: COMPLETED_SOURCE_ID,
		layout: { "line-cap": "round", "line-join": "round" },
		// Polygon outlines render orange; line strokes keep the brown
		// `accent` rust; recorded TRACKS go sage. One layer draws all
		// three, so switch on featureType then geometry type. A TRACK's rail
		// is deliberately THIN (1.5px) — the crosstie layer below carries the
		// railway joke; the rail itself stays whisper-subtle.
		paint: {
			"line-color": [
				"case",
				["==", ["get", "featureType"], "track"],
				TRACK_SAGE,
				["==", ["geometry-type"], "Polygon"],
				["coalesce", ["get", "_strokeCol"], POLYGON_OUTLINE],
				accent,
			],
			// Polygon outlines run a touch thinner (2.5px) than line strokes
			// (3px) — a boundary should trace the ground accurately, not bulk up.
			"line-width": [
				"case",
				["==", ["get", "featureType"], "track"],
				1.5,
				["==", ["geometry-type"], "Polygon"],
				2.5,
				3,
			],
		},
	});
	// THE RAILWAY JOKE — tracks get tiny crossties. The standard cartography
	// trick: a second line layer over the thin rail whose dash pattern is a
	// hair-short dash + long gap; because dash lengths scale with line-width,
	// a wide (7px) line with a 0.12-width dash paints as a ~1px-thin bar
	// ACROSS the rail every ~11px — little sleepers, no train required. Same
	// sage as the rail, and as small as the medium allows: it should read as
	// texture at track zoom and disappear into a plain line from afar.
	map.addLayer({
		id: "completed-track-ties",
		type: "line",
		source: COMPLETED_SOURCE_ID,
		filter: [
			"all",
			["==", ["get", "featureType"], "track"],
			["==", ["geometry-type"], "LineString"],
		],
		layout: { "line-cap": "butt", "line-join": "round" },
		paint: {
			"line-color": TRACK_SAGE,
			"line-width": 7,
			"line-dasharray": [0.12, 1.6],
		},
	});
	// Vertex handles (white halo + accent dot) are an EDITING affordance.
	// The completed-features source carries a synthesized Point per vertex
	// of every polygon/line, so rendering them all at once turns a map of
	// many shapes into a field of orbs. They start hidden and are revealed
	// one feature at a time via `setVertexHandlesForFeature` while that
	// feature is selected for editing.
	// Pins (the user's actual data) are NOT in this source — they're
	// rendered as DOM markers (mapboxgl.Marker), so click handling is
	// native and click-through-style-swap is automatic.
	map.addLayer({
		id: "completed-vertices-halo",
		type: "circle",
		source: COMPLETED_SOURCE_ID,
		filter: VERTEX_HANDLES_HIDDEN,
		// TRACK vertices carry no halo — they're breadcrumbs, not editing
		// handles, and a white ring on every GPS point reads as clutter.
		paint: {
			"circle-radius": ["case", ["==", ["get", "_isTrack"], true], 0, 7],
			"circle-color": "#ffffff",
		},
	});
	map.addLayer({
		id: "completed-vertices-dot",
		type: "circle",
		source: COMPLETED_SOURCE_ID,
		filter: VERTEX_HANDLES_HIDDEN,
		// A vertex dot matches its parent shape: orange for polygon
		// corners, brown `accent` for line vertices. `_parentType` is
		// stamped on each synthesized vertex Point by `buildCompletedFC`.
		// Track breadcrumbs go slightly bigger (they have no halo) so the
		// path keeps its texture.
		paint: {
			"circle-radius": ["case", ["==", ["get", "_isTrack"], true], 5.5, 4],
			"circle-color": [
				"case",
				["==", ["get", "_isTrack"], true],
				TRACK_SAGE,
				["==", ["get", "_parentType"], "Polygon"],
				["coalesce", ["get", "_strokeCol"], POLYGON_OUTLINE],
				accent,
			],
		},
	});

	// Boundary pins — clustered polygon centroids for far-out zooms (see the
	// constants block up top). Data is pushed by the consumer alongside
	// completed-features via buildCentroidFC. Painted in the polygon rust so
	// they read apart from the gold pin-cluster bubbles.
	map.addSource(CENTROID_SOURCE_ID, {
		type: "geojson",
		data: empty,
		cluster: true,
		clusterMaxZoom: BOUNDARY_PIN_MAXZOOM,
		clusterRadius: 40,
	});
	map.addLayer({
		id: CENTROID_CLUSTER_LAYER,
		type: "circle",
		source: CENTROID_SOURCE_ID,
		filter: ["has", "point_count"],
		maxzoom: BOUNDARY_PIN_MAXZOOM,
		paint: {
			"circle-color": POLYGON_OUTLINE,
			"circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 50, 24],
			"circle-stroke-width": 2,
			"circle-stroke-color": "#ffffff",
		},
	});
	map.addLayer({
		id: CENTROID_CLUSTER_COUNT_LAYER,
		type: "symbol",
		source: CENTROID_SOURCE_ID,
		filter: ["has", "point_count"],
		maxzoom: BOUNDARY_PIN_MAXZOOM,
		layout: {
			"text-field": ["get", "point_count_abbreviated"],
			"text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
			"text-size": 13,
			"text-allow-overlap": true,
		},
		paint: { "text-color": "#3a2410" },
	});
	map.addLayer({
		id: CENTROID_PIN_LAYER,
		type: "circle",
		source: CENTROID_SOURCE_ID,
		filter: ["!", ["has", "point_count"]],
		maxzoom: BOUNDARY_PIN_MAXZOOM,
		paint: {
			"circle-color": POLYGON_OUTLINE,
			"circle-radius": 7,
			"circle-stroke-width": 2,
			"circle-stroke-color": "#ffffff",
		},
	});
	// The solo pin keeps its polygon's NAME underneath, so a lone far-out
	// pin still says what it is. Never hectares — those live in the AREA
	// popover on tap, not on the map.
	map.addLayer({
		id: CENTROID_PIN_LABEL_LAYER,
		type: "symbol",
		source: CENTROID_SOURCE_ID,
		filter: ["all", ["!", ["has", "point_count"]], ["has", "_nameLabel"]],
		maxzoom: BOUNDARY_PIN_MAXZOOM,
		layout: {
			"text-field": ["get", "_nameLabel"],
			"text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
			"text-size": 11,
			"text-anchor": "top",
			"text-offset": [0, 1.1],
		},
		paint: {
			"text-color": "#3a2410",
			"text-halo-color": "#ffe9c2",
			"text-halo-width": 1.6,
		},
	});
}

/**
 * Reveal the draggable vertex handles for exactly one completed feature.
 *
 * Handles are an *editing* affordance — without this gate, a map of 50
 * polygons renders as a field of white-haloed orbs. They show only for the
 * feature the user has selected (`idx` = its `_idx` in the completed-features
 * source); pass `null` to hide every handle once editing is finished.
 *
 * Edit-state ownership stays in the consuming route — this helper only maps
 * an index onto the two GL layer filters.
 */
export function setVertexHandlesForFeature(
	map: MapboxMap,
	idx: number | null,
): void {
	const filter: FilterSpecification =
		idx === null
			? VERTEX_HANDLES_HIDDEN
			: [
					"all",
					["==", ["geometry-type"], "Point"],
					["==", ["get", "_idx"], idx],
				];
	for (const id of VERTEX_HANDLE_LAYERS) {
		if (map.getLayer(id)) map.setFilter(id, filter);
	}
}

/** Geo bbox of a (Multi)Polygon's outer ring(s). Exported for
 *  areaLabels.ts, which anchors each name label at the bbox centre — the
 *  same point buildCentroidFC uses for the boundary pins. */
export function geometryBbox(g: Polygon | MultiPolygon): RingBbox | null {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
	for (const poly of polys) {
		for (const [x, y] of poly[0] ?? []) {
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
	}
	if (!Number.isFinite(minX)) return null;
	return [minX, minY, maxX, maxY];
}

/**
 * Builds the completed-centroids FC — one Point per saved polygon, at the
 * polygon's bbox centre. Feeds the clustered boundary-pin source so a map
 * stays findable when zoomed out past BOUNDARY_PIN_MAXZOOM. Consumers push
 * this alongside buildCompletedFC from the SAME feature array, so the pins
 * obey the same visibility toggles as the shapes they stand in for. `_bbox`
 * rides along so a pin tap can frame its polygon.
 */
export function buildCentroidFC(features: Feature[]): FeatureCollection {
	const out: Feature[] = [];
	for (const feat of features) {
		const g = feat.geometry;
		if (g?.type !== "Polygon" && g?.type !== "MultiPolygon") continue;
		const bbox = geometryBbox(g);
		if (!bbox) continue;
		// The solo-pin caption is the area's SHORT HANDLE (Rule 1 — one line,
		// never the raw paragraph; hectares stay in the AREA popover).
		// Unnamed polygons get a bare pin — the label layer's
		// `has _nameLabel` filter skips them. A handle that shows less than
		// the full name wears a "…" — truncation is visible truth.
		const fullName = String(feat.properties?.name ?? "").trim();
		const rawHandle =
			String(feat.properties?.displayName ?? "").trim() ||
			(fullName === "" ? "" : deriveHandle(fullName));
		const name =
			rawHandle !== "" && rawHandle !== fullName
				? `${rawHandle}…`
				: rawHandle;
		out.push({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
			},
			properties: {
				...(name === "" ? {} : { _nameLabel: name }),
				_bbox: bbox,
			},
		});
	}
	return { type: "FeatureCollection", features: out };
}

/** `_bbox` comes back JSON-stringified from queryRenderedFeatures (GL
 *  serializes non-scalar properties) — parse + finite-check it. */
function parseBbox(raw: unknown): RingBbox | null {
	let arr: unknown = raw;
	if (typeof raw === "string") {
		try {
			arr = JSON.parse(raw);
		} catch {
			return null;
		}
	}
	return Array.isArray(arr) &&
		arr.length === 4 &&
		arr.every((n) => Number.isFinite(n))
		? (arr as RingBbox)
		: null;
}

/**
 * True when a screen point hits a boundary pin or cluster bubble — an
 * EXCLUSIVE tap target (same contract as the grid dots): the tap belongs to
 * the pin's own layer handler, and the generic map-click hit-test must not
 * ALSO select the sub-pixel polygon underneath.
 */
export function boundaryPinAt(
	map: MapboxMap,
	point: { x: number; y: number },
): boolean {
	const layers = [CENTROID_CLUSTER_LAYER, CENTROID_PIN_LAYER].filter((l) =>
		map.getLayer(l),
	);
	if (layers.length === 0) return false;
	return map.queryRenderedFeatures([point.x, point.y], { layers }).length > 0;
}

const boundaryPinWired = new WeakSet<MapboxMap>();

/**
 * Tap navigation for the boundary pins: a cluster bubble eases to the zoom
 * where it splits (stock behaviour, matching the gold pin clusters), a solo
 * pin frames its polygon. Delegated listeners survive setStyle, so this wires
 * once per map instance no matter how often setup re-runs.
 *
 * `isNavigationAllowed` lets the consumer veto navigation while a draw tool
 * is armed — a tap meant to place a vertex must never also fly the camera.
 */
export function wireBoundaryPinNavigation(
	map: MapboxMap,
	isNavigationAllowed: () => boolean = () => true,
): void {
	if (boundaryPinWired.has(map)) return;
	boundaryPinWired.add(map);

	map.on("click", CENTROID_CLUSTER_LAYER, (e) => {
		if (!isNavigationAllowed()) return;
		const f = map.queryRenderedFeatures(e.point, {
			layers: [CENTROID_CLUSTER_LAYER],
		})[0];
		const clusterId = f?.properties?.cluster_id as number | undefined;
		const src = map.getSource(CENTROID_SOURCE_ID) as GeoJSONSource | undefined;
		if (clusterId == null || !src) return;
		src.getClusterExpansionZoom(clusterId, (err, zoom) => {
			if (err || zoom == null) return;
			const center = (f.geometry as Point).coordinates;
			if (!center.every((n) => Number.isFinite(n))) return;
			map.easeTo({ center: center as Lnglat, zoom });
		});
	});
	map.on("click", CENTROID_PIN_LAYER, (e) => {
		if (!isNavigationAllowed()) return;
		const f = map.queryRenderedFeatures(e.point, {
			layers: [CENTROID_PIN_LAYER],
		})[0];
		const bbox = parseBbox(f?.properties?._bbox);
		if (!bbox) return;
		map.fitBounds(
			[
				[bbox[0], bbox[1]],
				[bbox[2], bbox[3]],
			],
			{ padding: 80, maxZoom: 15, duration: 700 },
		);
	});
	for (const layer of [CENTROID_CLUSTER_LAYER, CENTROID_PIN_LAYER]) {
		map.on("mouseenter", layer, () => {
			map.getCanvas().style.cursor = "pointer";
		});
		map.on("mouseleave", layer, () => {
			map.getCanvas().style.cursor = "";
		});
	}
}

export function buildDrawEdgesFC(vertices: Lnglat[]): FeatureCollection {
	if (vertices.length < 2) return emptyFC();
	return {
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				geometry: { type: "LineString", coordinates: vertices },
				properties: {},
			},
		],
	};
}

export function buildDrawVerticesFC(vertices: Lnglat[]): FeatureCollection {
	return {
		type: "FeatureCollection",
		features: vertices.map((coord) => ({
			type: "Feature" as const,
			geometry: { type: "Point" as const, coordinates: coord },
			properties: {},
		})),
	};
}

export function buildProvisionalPolygonFC(
	vertices: Lnglat[],
	intent: DrawIntent,
): FeatureCollection {
	if (intent !== "polygon" || vertices.length < 2) return emptyFC();

	const ring = [...vertices, vertices[0]];
	const closingEdge = [vertices[vertices.length - 1], vertices[0]];

	const features: Feature[] = [
		{
			type: "Feature",
			geometry: { type: "LineString", coordinates: closingEdge },
			properties: {},
		},
	];
	if (vertices.length >= 3) {
		features.push({
			type: "Feature",
			geometry: { type: "Polygon", coordinates: [ring] },
			properties: {},
		});
	}
	return { type: "FeatureCollection", features };
}

/**
 * Builds the completed-features FC for the GL source. Pins (Point geometries)
 * are intentionally EXCLUDED — they're rendered as DOM markers
 * (mapboxgl.Marker) by the consumer, not as a symbol layer. Polygons, lines,
 * and the synthesized vertex Points stay here.
 */
export function buildCompletedFC(features: Feature[]): FeatureCollection {
	const out: Feature[] = [];
	// Display-only: stamped onto the FC copies, never onto the stored
	// features, so a polygon's colour re-derives from live geometry on
	// every rebuild (draw, drag, delete).
	const overlapColors = assignOverlapColors(features);
	for (let i = 0; i < features.length; i++) {
		const feat = features[i];
		if (feat.geometry?.type === "Point") continue; // pins → DOM markers
		// Area-name labels are DOM markers too (areaLabels.ts) — nothing
		// label-related rides on the FC.
		const overlapColor = overlapColors.get(i);
		out.push({
			...feat,
			properties: {
				...(feat.properties ?? {}),
				_idx: i,
				...(overlapColor
					? {
							_fillCol: overlapColor.fill,
							_strokeCol: overlapColor.stroke,
							_stackFillOp: STACKED_FILL_OPACITY,
						}
					: {}),
			},
		});

		if (feat.geometry?.type === "Polygon") {
			const ring = (feat.geometry as Polygon).coordinates[0];
			// Skip the closing-duplicate vertex (last === first) so we
			// don't emit two overlapping draggable points at vertex 0.
			const last = ring.length - 1;
			const closes =
				ring.length > 1 &&
				ring[0][0] === ring[last][0] &&
				ring[0][1] === ring[last][1];
			const stop = closes ? last : ring.length;
			for (let v = 0; v < stop; v++) {
				out.push({
					type: "Feature",
					geometry: {
						type: "Point",
						coordinates: ring[v],
					} as Point,
					properties: {
						_idx: i,
						_vertexIdx: v,
						_isEndpoint: false,
						_parentType: "Polygon",
						...(overlapColor ? { _strokeCol: overlapColor.stroke } : {}),
					},
				});
			}
		} else if (feat.geometry?.type === "LineString") {
			const coords = (feat.geometry as LineString).coordinates;
			// A recorded TRACK's vertices are breadcrumbs, not editing
			// handles — they render as plain accent balls (no white halo,
			// slightly bigger) purely for texture. Stamped here so the
			// vertex layers can style them apart from drawn lines.
			const isTrack = feat.properties?.featureType === "track";
			for (let v = 0; v < coords.length; v++) {
				const coord = coords[v];
				const isEndpoint = v === 0 || v === coords.length - 1;
				out.push({
					type: "Feature",
					geometry: { type: "Point", coordinates: coord } as Point,
					properties: {
						_idx: i,
						_vertexIdx: v,
						_isEndpoint: isEndpoint,
						_parentType: "LineString",
						...(isTrack ? { _isTrack: true } : {}),
					},
				});
			}
		}
	}
	return { type: "FeatureCollection", features: out };
}

export interface PixelBbox {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

/**
 * Projects a set of lng/lat pairs to screen pixels and returns the bbox.
 * Returns null if the input is empty.
 */
export function projectLnglatBbox(
	map: MapboxMap,
	coords: ReadonlyArray<Lnglat | number[]>,
): PixelBbox | null {
	if (coords.length === 0) return null;
	let minX = Infinity,
		maxX = -Infinity,
		minY = Infinity,
		maxY = -Infinity;
	for (const c of coords) {
		const pt = map.project({ lng: c[0], lat: c[1] });
		if (pt.x < minX) minX = pt.x;
		if (pt.x > maxX) maxX = pt.x;
		if (pt.y < minY) minY = pt.y;
		if (pt.y > maxY) maxY = pt.y;
	}
	return { minX, minY, maxX, maxY };
}

/** Screen-space bbox of a completed feature's geometry. */
export function projectFeatureBbox(
	map: MapboxMap,
	feature: Feature,
): PixelBbox | null {
	if (!feature.geometry) return null;
	let coords: number[][] = [];
	if (feature.geometry.type === "Polygon") {
		coords = (feature.geometry as Polygon).coordinates[0];
	} else if (feature.geometry.type === "LineString") {
		coords = (feature.geometry as LineString).coordinates;
	} else if (feature.geometry.type === "Point") {
		coords = [(feature.geometry as Point).coordinates];
	}
	return projectLnglatBbox(map, coords);
}

/**
 * Hit tests the completed-features layers (polygons + lines + their
 * vertices) at a screen point. Pins are NOT in this set — they're DOM
 * markers and own their own click events.
 * Returns the `_idx` of the topmost feature hit, or null.
 *
 * `tolerancePx` widens the hit query into a square around the point.
 * Defaults to 12 px — lines render thin (~3 px) and are unhittable at
 * single-pixel tap precision on a phone; the wider window catches them
 * without changing polygon behavior (a tap already inside the fill still
 * resolves to that fill, since fill renders below stroke).
 */
export function hitTestCompleted(
	map: MapboxMap,
	point: { x: number; y: number },
	tolerancePx = 12,
): number | null {
	const layers = [
		"completed-fill",
		"completed-stroke",
		"completed-vertices-halo",
		"completed-vertices-dot",
	];
	const r = Math.max(0, tolerancePx);
	const bbox: [[number, number], [number, number]] = [
		[point.x - r, point.y - r],
		[point.x + r, point.y + r],
	];
	const hits = map.queryRenderedFeatures(bbox, { layers });
	if (hits.length === 0) return null;
	const idx = hits[0].properties?._idx;
	return typeof idx === "number" ? idx : null;
}

/**
 * Resets the three in-progress drawing sources to empty FCs. Doesn't touch
 * the completed-features source.
 */
export function clearInProgressSources(map: MapboxMap): void {
	const empty = emptyFC();
	for (const id of DRAW_SOURCE_IDS) {
		const src = map.getSource(id);
		if (src && "setData" in src) {
			(src as unknown as { setData: (d: FeatureCollection) => void }).setData(
				empty,
			);
		}
	}
}

/**
 * Build a new feature from the currently drawn vertices.
 *
 * `properties.name` is left empty on purpose — the proprietary mobile
 * layer (`ReTreever/src/lib/mobile/stores/mapStore.svelte.ts`) supplies
 * the canonical default via `defaultFeatureName` per
 * `ReTreever/src/lib/mobile/docs/NAMING_CONVENTIONS.md`. Don't fill it
 * here; OSEM is naming-convention-agnostic.
 */
export function finalizeFeature(
	intent: Exclude<DrawIntent, null>,
	vertices: Lnglat[],
): Feature {
	const id = newId();
	if (intent === "polygon") {
		const ring = [...vertices, vertices[0]];
		return {
			type: "Feature",
			id,
			geometry: { type: "Polygon", coordinates: [ring] },
			properties: { name: "", notes: "" },
		};
	}
	if (intent === "pin") {
		return {
			type: "Feature",
			id,
			geometry: { type: "Point", coordinates: vertices[0] },
			properties: { name: "", notes: "" },
		};
	}
	return {
		type: "Feature",
		id,
		geometry: { type: "LineString", coordinates: [...vertices] },
		properties: { name: "", notes: "" },
	};
}
