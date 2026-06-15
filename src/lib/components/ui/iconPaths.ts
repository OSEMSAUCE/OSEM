// iconPaths.ts — THE inline line-icon catalog for the whole app.
//
// One row per icon: a name → its inner SVG markup (`body`) plus the
// canonical stroke width (`sw`) the icon was drawn at. The <Icon> component
// (Icon.svelte, same folder) wraps these in a shared 24×24 viewBox and
// applies stroke="currentColor", round caps/joins — so every glyph is
// written down ONCE here instead of pasted inline across components.
//
// These are monochrome lucide-style line icons. Multi-colour brand marks
// (Google/Apple), gradient sliders and animated SVGs are NOT here — they're
// genuinely bespoke and stay inline.
//
// Add an icon = add a row. Reuse one = `<Icon name="…" />`.

export type IconDef = {
	/** Inner SVG markup (paths/polylines/circles), drawn in a 24×24 box. */
	body: string;
	/** The stroke width the icon was authored at. Overridable per call via
	 *  the <Icon stroke={…}> prop, but this is the faithful default. */
	sw: number;
};

export const ICONS = {
	// ── editing / tools ────────────────────────────────────────────────
	edit: {
		body: `<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>`,
		sw: 2,
	},
	"edit-tilt": {
		// pencil drawn along the NW–SE diagonal (mapDrawOSEM draw-line affordance)
		body: `<path d="M3 21l3-1 12-12-2-2L4 18l-1 3z"/><path d="M14 6l4 4"/>`,
		sw: 2,
	},
	close: { body: `<path d="M5 5l14 14M19 5L5 19"/>`, sw: 2.4 },
	undo: {
		body: `<path d="M9 7L4 11l5 4"/><path d="M4 11h9a5 5 0 015 5v2"/>`,
		sw: 2.4,
	},
	plus: { body: `<path d="M12 5v14M5 12h14"/>`, sw: 2.4 },

	// ── map / geometry ─────────────────────────────────────────────────
	layers: {
		body: `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,
		sw: 1.9,
	},
	globe: {
		body: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 010 18"/><path d="M12 3a14 14 0 000 18"/>`,
		sw: 1.8,
	},
	navigation: { body: `<path d="M12 3l5 18-5-5-5 5z"/>`, sw: 2 },
	pentagon: { body: `<path d="M12 3l9 6-3.5 11h-11L3 9z"/>`, sw: 2.2 },
	"map-pin": {
		body: `<path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/>`,
		sw: 2.2,
	},
	"share-nodes": {
		body: `<circle cx="6" cy="18" r="2.2" fill="currentColor"/><circle cx="18" cy="6" r="2.2" fill="currentColor"/><path d="M7.4 16.6L16.6 7.4"/>`,
		sw: 2.2,
	},
	grid: {
		body: `<path d="M3 3h18v18H3z"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>`,
		sw: 1.8,
	},

	// ── actions ────────────────────────────────────────────────────────
	search: {
		body: `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>`,
		sw: 2,
	},
	upload: {
		body: `<path d="M12 16V3M7 8l5-5 5 5"/><path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>`,
		sw: 2,
	},
	download: {
		body: `<path d="M12 3v13M7 12l5 5 5-5"/><path d="M4 17v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>`,
		sw: 2.4,
	},
	trash: {
		body: `<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>`,
		sw: 2,
	},
	"log-out": {
		body: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>`,
		sw: 2.4,
	},

	// ── glyphs / chrome ────────────────────────────────────────────────
	check: { body: `<polyline points="20 6 9 17 4 12"/>`, sw: 2.4 },
	"check-bold": { body: `<path d="M5 12l5 5L20 7"/>`, sw: 3.5 },
	menu: { body: `<path d="M3 5h18M6 12h12M10 19h4"/>`, sw: 2.4 },
	info: {
		body: `<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>`,
		sw: 2.2,
	},
	users: {
		body: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
		sw: 2,
	},

	// ── chevrons (one shape per direction; point order doesn't change the
	//    visual for an open stroke, so mirrored variants map here too) ──
	"chevron-right": { body: `<polyline points="9 18 15 12 9 6"/>`, sw: 2 },
	"chevron-left": { body: `<polyline points="15 18 9 12 15 6"/>`, sw: 2.5 },
	"chevron-down": { body: `<polyline points="6 9 12 15 18 9"/>`, sw: 2.4 },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;
