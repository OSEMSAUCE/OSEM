/**
 * glyphStack.ts — THE font stack for every symbol layer, chosen from the LIVE map.
 *
 * ── Why this exists ──
 * There is no single `text-font` value that is correct on both maps, and trying
 * to write one is how this bug kept coming back:
 *
 *   • `/mobile/map` uses a hosted Mapbox style, whose glyph endpoint has
 *     "DIN Pro Medium" / "Arial Unicode MS Bold" and **not** "Noto Sans Regular".
 *   • `/mobile/offlinev4` serves its own glyphs from `/mobileAssets/worldBase/glyphs/` and
 *     bundles **only** "Noto Sans Regular".
 *
 * A hardcoded DIN stack 404s forever on the offline map. Appending Noto as a
 * fallback fixes that map and creates the MIRROR of the same bug online, where
 * Mapbox 404s `api.mapbox.com/fonts/v1/mapbox/Noto%20Sans%20Regular/...`. Both
 * observed in one session — the DIN 404s on offlinev4, the Noto 404 on map.
 *
 * And a 404 here is not one failed request: Mapbox re-asks for a missing font
 * range **on every tile, forever**, so the console fills with hundreds of
 * identical errors and the label never draws.
 *
 * ── The rule ──
 * Ask the style which endpoint it is using. `map.getStyle().glyphs` is a URL
 * template, and the offline one is same-origin (`/mobileAssets/worldBase/...`) while the
 * hosted one points at api.mapbox.com. That is the ONE fact that distinguishes
 * them, it is always current, and it needs no flag threaded through callers.
 *
 * ⚠️ Never hardcode a `text-font` array in a layer definition again. If you add
 * a symbol layer, call this. The guard in `src/lib/core/glyphStacks.test.ts`
 * fails the build if a literal stack cannot resolve offline.
 */
import type { Map as MapboxMap } from "mapbox-gl";

/** The only family bundled in `static/mobileAssets/worldBase/glyphs/`. */
const OFFLINE_STACK = ["Noto Sans Regular"];

/** The hosted Mapbox style's stack — Medium weight, the app's default. */
const ONLINE_STACK = ["DIN Pro Medium", "Arial Unicode MS Bold"];

/** Bold variant, for count badges and other emphasis. */
const ONLINE_STACK_BOLD = ["DIN Pro Bold", "Arial Unicode MS Bold"];

/**
 * Does this map serve its glyphs from our own origin (the offline base style)?
 *
 * Defensive on purpose: this runs during layer setup, where the style may not
 * be loaded yet and `getStyle()` can throw or return undefined. Unknown →
 * treat as ONLINE, because that is the map users are on the overwhelming
 * majority of the time, and a wrong guess costs a font fallback, not a crash.
 */
export function usesBundledGlyphs(map: MapboxMap): boolean {
	try {
		const glyphs = map.getStyle?.()?.glyphs;
		return typeof glyphs === "string" && glyphs.startsWith("/");
	} catch {
		return false;
	}
}

/** The `text-font` value for a symbol layer on THIS map. */
export function glyphStack(map: MapboxMap, weight: "medium" | "bold" = "medium"): string[] {
	if (usesBundledGlyphs(map)) return OFFLINE_STACK;
	return weight === "bold" ? ONLINE_STACK_BOLD : ONLINE_STACK;
}
