/**
 * THE LINCHPIN, AS A TEST — the harness must not be hitched to ReTreever.
 *
 * THE TRAILER RULE. A child is a trailer. Hitched to ReTreever it gets app.css,
 * the utils, the whole parent app — full dress. Unhitched it must still STAND:
 * plainer, fewer features, but RUNNING. What it must never do is collapse.
 *
 * WHY A SECOND TEST, WHEN childBoundary.test.ts ALREADY BANS $lib.
 * That test reads a child's import strings and asserts none say `$lib`. It
 * cannot tell you whether `$lib` would RESOLVE if one did. Those are different
 * claims, and the gap between them is exactly where this went wrong: the
 * harness defined `$lib: "./src/lib"` — the SAME directory as `$osem` — so any
 * child reaching for ReTreever quietly resolved into the harness's own lib and
 * appeared to work. On this machine. Where ReTreever sits next door.
 *
 * `$generated` was the blunter version: `"../src/lib/generated"` climbed up out
 * of the harness and into ReTreever by relative path.
 *
 * So childBoundary asserts the RULE; this asserts the WALL that makes the rule
 * true. Keep both — one governs what children say, the other what the harness
 * would answer.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CONFIG = readFileSync(
	fileURLToPath(new URL("../../../../svelte.config.js", import.meta.url)),
	"utf8",
);

/** The alias block only — comments elsewhere in the file may mention $lib. */
function aliasBlock(src: string): string {
	const start = src.indexOf("alias: {");
	if (start === -1) return "";
	return src.slice(start, src.indexOf("}", start));
}

describe("the harness defines no alias that leaves it", () => {
	const aliases = aliasBlock(CONFIG);

	it("has an alias block at all (the parse must work)", () => {
		expect(aliases).toContain("$osem");
	});

	it("never defines $lib — a child reaching for ReTreever must FAIL TO BUILD", () => {
		expect(
			aliases.includes("$lib"),
			"Defining $lib here re-hitches the trailer to the truck. A child that " +
				"imports $lib would resolve into the harness's own lib and look fine " +
				"on this machine, then die on a contractor's. Delete the alias and " +
				"fix the child's import instead.",
		).toBe(false);
	});

	it("never defines $generated — it pointed up and out, into ReTreever", () => {
		expect(aliases.includes("$generated")).toBe(false);
	});

	it("no alias target climbs above the harness with ..", () => {
		const climbers = [...aliases.matchAll(/"(\.\.[^"]*)"/g)].map((m) => m[1]);
		expect(
			climbers,
			`An alias resolving outside the harness is a hitch by another name:\n${climbers.join("\n")}`,
		).toEqual([]);
	});
});
