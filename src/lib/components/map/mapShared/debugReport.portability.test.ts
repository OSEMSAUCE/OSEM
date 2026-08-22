/**
 * THE GUARD THAT KEEPS THE MAP LIFTABLE.
 *
 * OFFLINE_MAP_SPEC.md §9 rule 5: "The offline map must not import app UI
 * components, stores, or utilities. Give it a narrow, explicit interface — it
 * needs a list of {lng, lat} and nothing else. Enforce it with a test that
 * fails if the module graph exceeds a file budget."
 *
 * The previous /offline route pulled in 175 files / 53,675 lines, of which only
 * ~8,600 were the offline map. The rest arrived because the route imported one
 * popover, which imported a store, which imported the inbox. Nobody chose that;
 * it accumulated one convenient import at a time.
 *
 * So this test reads debugReport.ts's own import list and fails on anything
 * outside the allow-list. It is what makes moving the map into OSEM a
 * mechanical lift instead of archaeology — and it fails the moment someone
 * reaches for mapStore because it was handy.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = readFileSync(
	fileURLToPath(new URL("./debugReport.ts", import.meta.url)),
	"utf8",
);

/** Import specifiers this module may legitimately reach for. */
const ALLOWED = [
	"$osem/components/map/mapShared/",
	"$osem/components/map/offline/contract/",
	"$osem/components/map/offline/onPhone/store/coverageRegistry",
	"$osem/components/map/offline/r2Worker/tilesHost",
];

/** Things whose presence means the boundary has been breached.
 *  NOTE these are matched against the WHOLE specifier, so a bare "svelte"
 *  entry would also hit the legitimate `mapShared/workMeter.svelte` — the
 *  framework ban is expressed as exact-match below instead. */
const BANNED = [
	"$tinyStore",
	"mapStore",
	// "$osem" was banned here when this file lived in ReTreever, where $osem
	// meant "reaching into the other repo". The engine now LIVES in OSEM, so
	// $osem is its own home and the ban is inverted — see the $lib/mobile entry
	// below, which is the direction that would now breach the boundary.
	"$lib/mobile/",
	"$mobRoutes",
	"$app/",
	"@supabase",
	"$lib/mobile/components/",
	"$lib/mobile/stores/",
];

/** Framework/runtime specifiers, banned by EXACT match. This module is plain
 *  TypeScript: it must run in a test, a Worker or a plain page with no Svelte
 *  runtime present. */
const BANNED_EXACT = ["svelte", "svelte/store", "mapbox-gl", "maplibre-gl"];

function imports(src: string): string[] {
	return [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
}

describe("debugReport stays portable", () => {
	it("imports nothing outside the allow-list", () => {
		const offenders = imports(SRC).filter(
			(s) =>
				!s.startsWith(".") &&
				!ALLOWED.some((a) => s.startsWith(a)),
		);
		expect(offenders).toEqual([]);
	});

	it("never reaches for the app's stores or UI", () => {
		for (const bad of BANNED) {
			expect(
				imports(SRC).some((s) => s.includes(bad)),
				`debugReport.ts must not import ${bad} — it is the one file that has to travel`,
			).toBe(false);
		}
	});

	it("pulls in no framework or renderer", () => {
		for (const bad of BANNED_EXACT) {
			expect(
				imports(SRC).includes(bad),
				`debugReport.ts must not import ${bad} — it has to run without a renderer`,
			).toBe(false);
		}
	});

	it("takes pins as a parameter rather than reading them", () => {
		// Rule 5's "a list of {lng,lat} and nothing else". If pins ever get read
		// from a store inside this module, the interface has collapsed.
		expect(SRC).toMatch(/pins\?:\s*LngLatPin\[\]/);
	});
});
