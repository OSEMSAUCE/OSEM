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

const HARNESS = fileURLToPath(new URL("../../../../", import.meta.url));
const STATIC = join(HARNESS, "static");

/** Fetched by fetchAssets.sh in a fresh clone — see ASSETS.md. */
const ALLOWED_OUTWARD = new Set(["worldBase"]);

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
