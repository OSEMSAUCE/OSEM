/**
 * THE ASSET HALF OF THE LINCHPIN — no file may reach up out of the harness.
 *
 * harnessIsolation.test.ts closes the IMPORT escape (no `$lib` alias). This
 * closes the FILESYSTEM one, which is a different hole and was open the whole
 * time the other was shut.
 *
 * MEASURED, not imagined. The harness sits INSIDE ReTreever, so `..` always
 * finds the parent — and four assets in static/mobileAssets were symlinks doing
 * exactly that: getcache_DT_bg.webp (the feature flag's own backdrop),
 * hand_phoneV3.webp, pin_library_small, worldBase. On this machine they
 * resolved and everything looked self-contained. Copied to a directory with no
 * ReTreever above it, the build died:
 *
 *     ENOENT: no such file or directory ... static/mobileAssets/getcache_DT_bg.webp
 *
 * SvelteKit walks static/ at build time and dies on a dangling link, so this is
 * not cosmetic — it is the difference between a harness a contractor can run
 * and one that fails on first `npm run build`.
 *
 * THE ONE EXEMPTION IS worldBase, and it is a real decision rather than a
 * leftover: 49 MB of basemap tiles that deliberately live outside git.
 * getCache_OfflineMap/fetchAssets.sh repairs it in a fresh clone. Anything
 * ELSE that starts pointing outward is a regression, and this test says so on
 * the day it appears instead of on a contractor's laptop.
 */
import { readdirSync, readlinkSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HARNESS = fileURLToPath(new URL("../../../", import.meta.url));
const STATIC = join(HARNESS, "static");

/**
 * Fetched by fetchAssets.sh in a fresh clone — see ASSETS.md.
 *
 * mobileAssets and pub-Rtvr joined worldBase on 24 Aug 2026, during the
 * RAPPER strip, and for a DIFFERENT reason worth stating plainly: they are
 * not fetched, they are DE-DUPLICATED. Both trees existed twice — 3.2 MB and
 * 6.3 MB inside the harness, and again inside ReTreever, which is the heavier
 * consumer of each (120 vs 21 files for mobileAssets; 39 vs 19 for pub-Rtvr).
 * Two copies of an asset tree drift; one of them silently goes stale and the
 * bug surfaces as a wrong image months later.
 *
 * ReTreever is the single source, and the harness reaches it by symlink. That
 * is a KNOWN outward reach, not a regression — and it is temporary. When
 * rapper moves out of ReTreever (Phase 2), these links break by construction,
 * which is the point: a plain rapper install has no business shipping
 * ReTreever's brand assets. Whatever a child genuinely needs to render must
 * by then travel WITH the child, not be borrowed from a parent that is no
 * longer there.
 *
 * static/pub-OSEM was deleted in the same pass and RESTORED minutes later —
 * a mistake worth keeping written down. It has zero references from
 * harness/src, which is true and irrelevant: ReTreever's own
 * static/pub-OSEM is a symlink pointing INTO the harness, so the harness
 * copy is the real one and the parent is its consumer. "Nothing imports it"
 * was measured in source code and missed a symlink in the other repo.
 *
 * So the two directions now both exist, deliberately:
 *   harness/static/{mobileAssets,pub-Rtvr} -> ReTreever  (ReTreever owns)
 *   ReTreever/static/pub-OSEM              -> harness    (harness owns)
 * Before deleting any asset directory, check BOTH trees for a link pointing
 * at it. grep alone will tell you it is safe when it is not.
 */
const ALLOWED_OUTWARD = new Set(["worldBase", "mobileAssets", "pub-Rtvr"]);

/** Every symlink under a directory, walked without following links. */
function symlinks(dir: string): string[] {
	const out: string[] = [];
	let entries: ReturnType<typeof readdirSync>;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return out; // absent in this checkout — nothing to police
	}
	for (const e of entries) {
		const p = join(dir, e.name);
		if (e.isSymbolicLink()) out.push(p);
		else if (e.isDirectory()) out.push(...symlinks(p));
	}
	return out;
}

/** Does this link resolve to somewhere outside the harness? */
function escapes(link: string): boolean {
	const raw = readlinkSync(link);
	const target = isAbsolute(raw) ? raw : resolve(link, "..", raw);
	const rel = relative(HARNESS, target);
	return rel.startsWith("..") || isAbsolute(rel);
}

describe("no asset reaches out of the harness", () => {
	const links = symlinks(STATIC);

	it("static/ exists (the walk must actually be looking at something)", () => {
		expect(statSync(STATIC).isDirectory()).toBe(true);
	});

	it("every symlink resolves INSIDE the harness, or is a declared exemption", () => {
		const offenders = links
			.filter(escapes)
			.map((l) => relative(HARNESS, l))
			.filter((rel) => !ALLOWED_OUTWARD.has(rel.split("/").pop() ?? ""))
			.sort();
		expect(
			offenders,
			"These point up into ReTreever. On a machine without it they DANGLE and\n" +
				"the build dies with ENOENT — SvelteKit walks static/ and refuses a dead\n" +
				"link. Copy the real file into the harness instead:\n" +
				offenders.join("\n"),
		).toEqual([]);
	});

	it("no symlink DANGLES right here, exemptions included", () => {
		const dead = links
			.filter((l) => {
				try {
					statSync(l);
					return false;
				} catch {
					return true;
				}
			})
			.map((l) => relative(HARNESS, l))
			.sort();
		expect(
			dead,
			`Dangling even in this checkout — run getCache_OfflineMap/fetchAssets.sh:\n${dead.join("\n")}`,
		).toEqual([]);
	});
});
