/**
 * THE CHILD BOUNDARY — what makes a child a child.
 *
 * components/map/ holds CHILDREN: self-contained folders (getCache_*) each
 * with a flat `lib/` + `routes/`, meant to be lifted into their own repo with
 * `git subtree split` and handed to a contractor. This test states the two
 * rules that make that lift possible, and it discovers children by folder
 * name, so a new one is governed the day it is created — nobody has to
 * remember to add it here.
 *
 * RULE 1 — A CHILD NEVER NAMES ITSELF THROUGH THE ALIAS.
 * `$osem` only exists because the shell's vite config defines it. A child that
 * reaches its own files through `$osem/components/map/<self>/...` breaks the
 * moment it leaves the shell — and it breaks 61 times at once, which is what
 * getCache_OfflineMap actually did before this guard existed. Inside the
 * child, imports are relative.
 *
 * RULE 2 — A CHILD NEVER REACHES INTO ANOTHER CHILD, OR INTO RETREEVER.
 * Two children that import each other are one child wearing two folders, and
 * neither can be handed out alone. `$lib` / `$tinyStore` / `$mobRoutes` are
 * ReTreever's proprietary side; a child that touches them cannot be given to
 * anyone. `$osem/components/map/mapShared` and `$osem/components/ui` ARE
 * allowed: those are the shell's own furniture, the deliberate seam.
 *
 * WHY A GREP HERE AND A REAL IMPORT IN enginePortability.test.ts. That test
 * proves one module LOADS with no host. This one proves a whole folder is
 * SHAPED right — including files no test imports and files that are pure
 * types. They catch different things; keep both.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const MAP_DIR = fileURLToPath(new URL(".", import.meta.url));

/** Folders under components/map/ that are children. Named, not listed. */
const CHILDREN = readdirSync(MAP_DIR).filter(
	(n) => n.startsWith("getCache_") && statSync(join(MAP_DIR, n)).isDirectory(),
);

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

it("there is at least one child (the discovery itself must work)", () => {
	expect(CHILDREN.length).toBeGreaterThan(0);
});

describe.each(CHILDREN)("%s", (child) => {
	const files = sourceFiles(join(MAP_DIR, child));

	it("has files to check", () => {
		expect(files.length).toBeGreaterThan(0);
	});

	it("never names itself through $osem — it would not survive the lift", () => {
		const selfAlias = `$osem/components/map/${child}/`;
		const offenders = files.flatMap((f) =>
			importSpecifiers(readFileSync(f, "utf8"))
				.filter((s) => s.startsWith(selfAlias))
				.map((s) => `${relative(MAP_DIR, f)}  ->  ${s}`),
		);
		expect(
			offenders,
			`Use a relative path instead. These break the moment ${child} leaves the shell:\n${offenders.join("\n")}`,
		).toEqual([]);
	});

	it("never imports another child", () => {
		const others = CHILDREN.filter((c) => c !== child);
		const offenders = files.flatMap((f) =>
			importSpecifiers(readFileSync(f, "utf8"))
				.filter((s) => others.some((o) => s.includes(`components/map/${o}/`)))
				.map((s) => `${relative(MAP_DIR, f)}  ->  ${s}`),
		);
		expect(
			offenders,
			`Two children that import each other cannot be handed out separately.\nMove the shared piece to mapShared/ instead:\n${offenders.join("\n")}`,
		).toEqual([]);
	});

	it("never reaches into ReTreever ($lib / $tinyStore / $mobRoutes)", () => {
		const offenders = files.flatMap((f) =>
			importSpecifiers(readFileSync(f, "utf8"))
				.filter((s) => FORBIDDEN_ALIASES.some((a) => s.startsWith(a)))
				.map((s) => `${relative(MAP_DIR, f)}  ->  ${s}`),
		);
		expect(
			offenders,
			`A child that touches ReTreever's proprietary side cannot be given to anyone:\n${offenders.join("\n")}`,
		).toEqual([]);
	});

	it("keeps every relative import inside its own folder", () => {
		const offenders: string[] = [];
		for (const f of files) {
			for (const spec of importSpecifiers(readFileSync(f, "utf8"))) {
				if (!spec.startsWith(".")) continue;
				const resolved = relative(join(MAP_DIR, child), join(f, "..", spec));
				if (resolved.startsWith("..")) {
					offenders.push(`${relative(MAP_DIR, f)}  ->  ${spec}`);
				}
			}
		}
		expect(
			offenders,
			`A relative path that climbs out of ${child} is the same breakage as $osem, just harder to see:\n${offenders.join("\n")}`,
		).toEqual([]);
	});
});
