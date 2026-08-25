/**
 * TWO ENVIRONMENTS MUST EXIST: local_dev AND r2_prod.
 *
 * This test exists because documentation did not work. The folders were
 * deleted at least four times — three of them in one afternoon (24 Aug 2026),
 * by an agent that had read the project's CLAUDE.md in the same session.
 *
 * The failure mode is always identical, and it is seductive rather than
 * careless: the two folders hold byte-for-byte identical files, so any tool or
 * agent auditing for duplication reports one as redundant and is CORRECT ABOUT
 * THE BYTES. It is wrong about the world. One of these is deployed to
 * Cloudflare and serves live traffic at tiles.retreever.org; the other runs on
 * a laptop at 127.0.0.1:8787 and exists to be broken. Same code, different
 * moment in its life. The gap between them is TIME, not content.
 *
 * A prose warning cannot stop that reasoning, because the reasoning never
 * doubts itself — it feels like tidying. A red test can, because it turns a
 * silent tidy-up into a build failure with this explanation attached.
 *
 * See README.md next to this file. Do not edit this test to make it pass.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const R2_WORKER = fileURLToPath(new URL(".", import.meta.url));

/** The two environments, by folder name. Both are load-bearing. */
const ENVIRONMENTS = ["local_dev", "r2_prod"] as const;

/** Files each environment must actually contain — an empty dir is not an env. */
const REQUIRED = ["tilesHost.ts", "roads/packDownload.ts", "fires/fireFetch.ts"];

describe("r2Worker keeps BOTH environments", () => {
	for (const env of ENVIRONMENTS) {
		it(`${env}/ exists`, () => {
			const dir = join(R2_WORKER, env);
			expect(
				existsSync(dir) && statSync(dir).isDirectory(),
				`r2Worker/${env}/ is MISSING.\n\n` +
					`You (or a tool) deleted an ENVIRONMENT, not a duplicate.\n` +
					`  local_dev/ = the worker running on your machine (127.0.0.1:8787)\n` +
					`  r2_prod/   = the worker DEPLOYED to tiles.retreever.org, serving users\n\n` +
					`They hold identical bytes on purpose: the same code at two stages of\n` +
					`readiness. That is what lets you break dev all day without touching\n` +
					`what is live.\n\n` +
					`Restore it — git log will have it — and read README.md next to this\n` +
					`test before touching this folder again.`,
			).toBe(true);
		});

		it(`${env}/ still has its worker files`, () => {
			const missing = REQUIRED.filter(
				(f) => !existsSync(join(R2_WORKER, env, f)),
			);
			expect(
				missing,
				`r2Worker/${env}/ exists but has been gutted. Missing:\n` +
					missing.map((m) => `  ${m}`).join("\n") +
					`\n\nAn environment that cannot serve tiles is not an environment.`,
			).toEqual([]);
		});
	}

	/**
	 * The identical-ness is the thing that gets them deleted, so assert it
	 * OUT LOUD. If this ever fails, the two environments have genuinely
	 * diverged — which is allowed, and means this expectation should be
	 * relaxed deliberately, not that a folder should be removed.
	 */
	it("both environments carry the same file names (identical is CORRECT)", () => {
		const names = ENVIRONMENTS.map((env) => {
			const walk = (d: string, prefix = ""): string[] =>
				readdirSync(d, { withFileTypes: true })
					.filter((e) => !e.name.startsWith("."))
					.flatMap((e) =>
						e.isDirectory()
							? walk(join(d, e.name), `${prefix}${e.name}/`)
							: [`${prefix}${e.name}`],
					);
			return walk(join(R2_WORKER, env)).sort();
		});

		expect(
			names[0],
			`local_dev/ and r2_prod/ no longer hold the same file names.\n` +
				`That is not automatically wrong — but it is a DECISION. If they have\n` +
				`deliberately diverged, update this test and README.md to say how.\n` +
				`Never resolve it by deleting one side.`,
		).toEqual(names[1]);
	});
});
