/**
 * THE CHILD BOUNDARY — what makes a child a child.
 *
 * lib/ holds CHILDREN: self-contained folders (getCache_*) each
 * with a flat `lib/` + `routes/`, meant to be lifted into their own repo with
 * `git subtree split` and handed to a contractor. This test states the two
 * rules that make that lift possible, and it discovers children by folder
 * name, so a new one is governed the day it is created — nobody has to
 * remember to add it here.
 *
 * RULE 1 — A CHILD NEVER NAMES ITSELF THROUGH THE ALIAS.
 * `$harness` only exists because the shell's vite config defines it. A child that
 * reaches its own files through `$harness/<self>/...` breaks the
 * moment it leaves the shell — and it breaks 61 times at once, which is what
 * getCache_OfflineMap actually did before this guard existed. Inside the
 * child, imports are relative.
 *
 * RULE 2 — A CHILD NEVER REACHES INTO ANOTHER CHILD, OR INTO RETREEVER.
 * Two children that import each other are one child wearing two folders, and
 * neither can be handed out alone. `$lib` / `$tinyStore` / `$mobRoutes` are
 * ReTreever's proprietary side; a child that touches them cannot be given to
 * anyone. `$harness/ui` IS allowed: that is the harness's own furniture.
 *
 * RULE 3 — mapShared IS THE SEAM BETWEEN CHILDREN, NOT A SECOND HOME.
 * mapShared was once allowed wholesale, as "the harness's furniture". Measured,
 * that seam leaked badly: getCache_OfflineMap imported 16 modules from it across
 * 27 sites, while getCache_OnlineMap imported ONE. Most of mapShared was simply
 * the offline map's own code sitting outside the offline map — including three
 * panels named Offline*. A module only one child imports is not shared, and the
 * child cannot be lifted into a bare repo without it. So the rule is now
 * COMPUTED: a child may import a mapShared module only if a second child imports
 * it too. Nothing to maintain, nothing to go stale.
 *
 * WHY A GREP HERE AND A REAL IMPORT IN enginePortability.test.ts. That test
 * proves one module LOADS with no host. This one proves a whole folder is
 * SHAPED right — including files no test imports and files that are pure
 * types. They catch different things; keep both.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Children now sit directly in lib/ — there is no components/ or map/ level
// left to walk up through. One dir constant, because there is one dir.
const LIB_DIR = fileURLToPath(new URL(".", import.meta.url));

/**
 * Every child in the harness. SHAPE, not owner, and not location either.
 *
 * TWICE NOW this predicate has encoded something that was merely true at the
 * time instead of what a child IS, and both times a new child inherited no
 * rules at all while every test stayed green:
 *
 *   1. `startsWith("getCache_")` — read as "the marker of a child", actually
 *      the marker of an OWNER. `ReTreever_where` fell straight through and sat
 *      there importing another child and $lib in 21 places, 13 tests green.
 *   2. Scanning only `lib/` — read as "where children are",
 *      actually where they HAPPENED to be. `ReTreever_who_what` lives in
 *      `lib/` and was invisible, 22 tests green.
 *
 * So the search is now over the whole component tree, and the test asserts a
 * MINIMUM COUNT — a discovery bug that finds nothing can no longer pass by
 * finding nothing.
 *
 * A child is a folder with a `lib/` in it. That is the actual definition — a
 * flat lib/ (+ optional routes/) is precisely what gets lifted into its own
 * repo. So a new owner is governed the day it appears, and nobody has to
 * remember to add a prefix here.
 */
const COMPONENTS_DIR = LIB_DIR;

/** Every folder in the component tree that has a `lib/` — that is a child. */
function findChildren(dir: string, depth = 0): string[] {
	if (depth > 2) return []; // children are shallow; do not walk node_modules-deep
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		if (entry.name === "mapShared") continue; // the shared parent, not a child
		if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
		const p = join(dir, entry.name);
		if (existsSync(join(p, "lib"))) out.push(relative(COMPONENTS_DIR, p));
		else out.push(...findChildren(p, depth + 1));
	}
	return out;
}

const CHILDREN = findChildren(COMPONENTS_DIR);

/**
 * DECLARED child→child dependencies — the ONLY exceptions to "never imports
 * another child", each one a decision somebody made on purpose.
 *
 * The default is still no. A pair listed here can no longer be handed out
 * separately, which is the whole cost. It is worth paying only when the shared
 * piece is genuinely too big to move into mapShared/ — and "too big" means
 * measured, not felt.
 *
 * ReTreever_where → getCache_OnlineMap. The `where` page IS a Mapbox map: it
 * needs mapInit (the bootstrapper), mapConfig (its option presets) and
 * mapDrawControls (the polygon-drawing UI). Measured 23 Aug, promoting those to
 * mapShared drags 5, 11 and 9 further files with them — roughly 1,400, 4,100
 * and 4,100 lines, including the whole 1,138-line grid engine and an 838-line
 * marker engine. That would move most of the online map into the shared parent
 * and make mapShared exactly what it is documented never to be: one child's
 * code in a communal folder.
 *
 * So the dependency stands, declared and visible. `where` ships WITH the online
 * map or not at all. The three GENERIC pieces it also needed — coord, safeEase,
 * safeMap, 535 lines closing over nothing — did move, and live in mapShared now.
 */
const DECLARED_CHILD_DEPS: Record<string, string[]> = {
	ReTreever_where: ["getCache_OnlineMap"],
};

/** Aliases a child may never touch: ReTreever's proprietary side. */
const FORBIDDEN_ALIASES = ["$lib/", "$tinyStore", "$mobRoutes"];

function sourceFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...sourceFiles(p));
		else if (/\.(ts|js|svelte)$/.test(entry.name)) out.push(p);
	}
	return out;
}

/** Import specifiers only — so a path inside a comment or a doc string,
 *  which harms nothing, does not fail the build. */
function importSpecifiers(src: string): string[] {
	const out: string[] = [];
	const re = /(?:from|import)\s*\(?\s*["'`]([^"'`]+)["'`]/g;
	for (const m of src.matchAll(re)) out.push(m[1]);
	return out;
}

/**
 * mapShared modules imported from OUTSIDE lib/ — i.e. by the host app
 * (ReTreever's src/, the harness's own routes). Scanned from the repo root two
 * levels up so it works from either checkout; a missing dir just yields nothing.
 */
function hostImports(): Set<string> {
	const out = new Set<string>();
	const roots = [
		join(LIB_DIR, ".."), // harness/src
		join(LIB_DIR, "..", "..", "..", "src"), // ReTreever/src
	];
	for (const root of roots) {
		let files: string[];
		try {
			files = sourceFiles(root);
		} catch {
			continue; // not present in this checkout — fine
		}
		for (const f of files) {
			if (f.startsWith(LIB_DIR)) continue; // children + mapShared itself
			for (const spec of importSpecifiers(readFileSync(f, "utf8"))) {
				const m = spec.match(/mapShared\/([A-Za-z0-9_.]+)/);
				if (m) out.add(m[1].replace(/\.(svelte|ts|js)$/, ""));
			}
		}
	}
	return out;
}

/** mapShared modules a given child imports, by bare module name. */
function sharedImportsOf(child: string): Set<string> {
	const out = new Set<string>();
	for (const f of sourceFiles(join(COMPONENTS_DIR, child))) {
		for (const spec of importSpecifiers(readFileSync(f, "utf8"))) {
			const m = spec.match(/mapShared\/([A-Za-z0-9_.]+)/);
			if (m) out.add(m[1].replace(/\.(svelte|ts|js)$/, ""));
		}
	}
	return out;
}

/**
 * Modules with MORE THAN ONE consumer — the only things that earn a place in
 * mapShared. A consumer is another child, or the host app outside lib/
 * (ReTreever imports the engine's seam too: hostPorts is literally the
 * engine↔host contract, and kmGeo/workMeter are used by six and three ReTreever
 * files respectively). Sole-consumer modules are that consumer's own code
 * sitting in a communal folder.
 *
 * Computed, never hand-listed: an allowlist goes stale the first time an import
 * is deleted, and a stale allowlist is exactly how mapShared silently became the
 * offline map's second home.
 */
const SHARED_BY_OTHERS = new Set<string>();
{
	const counts = new Map<string, number>();
	const bump = (mod: string) => counts.set(mod, (counts.get(mod) ?? 0) + 1);
	for (const c of CHILDREN) for (const mod of sharedImportsOf(c)) bump(mod);
	// The host app counts as one consumer: code it shares with a child is a
	// real seam, even when only one child is on the other side of it.
	for (const mod of hostImports()) bump(mod);
	for (const [mod, n] of counts) if (n >= 2) SHARED_BY_OTHERS.add(mod);
}

/**
 * A MINIMUM, not "more than zero". Both discovery bugs above were bugs that
 * found FEWER children than exist while still finding some, so `> 0` passed
 * happily through both. Raise this when a child is added.
 */
it("discovers every child that exists", () => {
	expect(CHILDREN.length, `found: ${CHILDREN.join(", ")}`).toBeGreaterThanOrEqual(4);
});

describe.each(CHILDREN)("%s", (child) => {
	const files = sourceFiles(join(COMPONENTS_DIR, child));

	it("has files to check", () => {
		expect(files.length).toBeGreaterThan(0);
	});

	it("never names itself through $harness — it would not survive the lift", () => {
		const selfAlias = `$harness/${child}/`;
		const offenders = files.flatMap((f) =>
			importSpecifiers(readFileSync(f, "utf8"))
				.filter((s) => s.startsWith(selfAlias))
				.map((s) => `${relative(COMPONENTS_DIR, f)}  ->  ${s}`),
		);
		expect(
			offenders,
			`Use a relative path instead. These break the moment ${child} leaves the shell:\n${offenders.join("\n")}`,
		).toEqual([]);
	});

	it("never imports another child, unless the pair is DECLARED", () => {
		const others = CHILDREN.filter((c) => c !== child);
		const allowed = DECLARED_CHILD_DEPS[child] ?? [];
		const offenders = files.flatMap((f) =>
			importSpecifiers(readFileSync(f, "utf8"))
				.filter((s) =>
					others.some(
						(o) => s.includes(`/${o}/`) && !allowed.includes(o),
					),
				)
				.map((s) => `${relative(COMPONENTS_DIR, f)}  ->  ${s}`),
		);
		expect(
			offenders,
			`Two children that import each other cannot be handed out separately.\n` +
				`Move the shared piece to mapShared/, or — if the dependency is real and\n` +
				`the shared piece is too big to move — DECLARE it in DECLARED_CHILD_DEPS\n` +
				`with the reason:\n${offenders.join("\n")}`,
		).toEqual([]);
	});

	it("declares no dependency it does not actually use", () => {
		const declared = DECLARED_CHILD_DEPS[child] ?? [];
		const actuallyImported = new Set(
			files.flatMap((f) =>
				importSpecifiers(readFileSync(f, "utf8")).flatMap((s) =>
					CHILDREN.filter(
						(c) => c !== child && s.includes(`/${c}/`),
					),
				),
			),
		);
		const stale = declared.filter((d) => !actuallyImported.has(d));
		expect(
			stale,
			`Declared but never imported. A declaration that outlives its import is\n` +
				`a hole in the wall nobody is using — delete it:\n${stale.join("\n")}`,
		).toEqual([]);
	});

	it("never reaches into ReTreever ($lib / $tinyStore / $mobRoutes)", () => {
		const offenders = files.flatMap((f) =>
			importSpecifiers(readFileSync(f, "utf8"))
				.filter((s) => FORBIDDEN_ALIASES.some((a) => s.startsWith(a)))
				.map((s) => `${relative(COMPONENTS_DIR, f)}  ->  ${s}`),
		);
		expect(
			offenders,
			`A child that touches ReTreever's proprietary side cannot be given to anyone:\n${offenders.join("\n")}`,
		).toEqual([]);
	});

	it("only uses mapShared modules that MORE THAN ONE child needs", () => {
		const used = new Set<string>();
		for (const f of files) {
			for (const spec of importSpecifiers(readFileSync(f, "utf8"))) {
				const m = spec.match(/mapShared\/([A-Za-z0-9_.]+)/);
				if (m) used.add(m[1].replace(/\.(svelte|ts|js)$/, ""));
			}
		}
		const soleUser = [...used].filter((mod) => !SHARED_BY_OTHERS.has(mod)).sort();
		expect(
			soleUser,
			`mapShared is the seam BETWEEN children. A module only ${child} imports is\n` +
				`not shared — it is this child's own code sitting outside it, and the child\n` +
				`cannot be lifted into a bare repo without it. Move these into ${child}/lib/:\n` +
				soleUser.join("\n"),
		).toEqual([]);
	});

	it("keeps every relative import inside its own folder", () => {
		const offenders: string[] = [];
		for (const f of files) {
			for (const spec of importSpecifiers(readFileSync(f, "utf8"))) {
				if (!spec.startsWith(".")) continue;
				const resolved = relative(join(COMPONENTS_DIR, child), join(f, "..", spec));
				if (resolved.startsWith("..")) {
					offenders.push(`${relative(COMPONENTS_DIR, f)}  ->  ${spec}`);
				}
			}
		}
		expect(
			offenders,
			`A relative path that climbs out of ${child} is the same breakage as $harness, just harder to see:\n${offenders.join("\n")}`,
		).toEqual([]);
	});
});
