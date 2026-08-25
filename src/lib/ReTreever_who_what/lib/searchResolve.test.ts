import { describe, expect, it } from "vitest";
import { normalizeQuery, resolveSearchKey } from "./searchResolve";
import type { SearchListItem } from "./searchTypes";

/**
 * These rules decide where a submitted search LANDS, and every way of getting
 * them wrong is silent: a wrong key navigates confidently to the wrong record,
 * and an over-eager match sends someone to a page they didn't ask for. None of
 * that surfaces as an error, so it has to be asserted.
 *
 * The duplicate-name cases are not hypothetical — 9 organizations in the live
 * data share a name with another org, which is the whole reason the resolver
 * takes a `selected` row at all.
 */

const ITEMS: SearchListItem[] = [
	{ key: "c-12tree", name: "12Tree" },
	// Keys are stored already percent-encoded; the resolver must return them
	// untouched and leave encoding to the route builder.
	{ key: "a-active%20trees", name: "ACTIVE TREES" },
	{ key: "x-green-1", name: "Green Land Group" },
	{ key: "x-green-2", name: "Green Land Group" },
	{ key: "y-tree-aid", name: "Tree Aid International" },
	// Deliberately a PREFIX of the row above: "tree aid" is this row's exact
	// name and also a substring of that one, which is what makes the
	// exact-beats-substring test below able to fail.
	{ key: "z-tree-aid", name: "Tree Aid" },
];

describe("normalizeQuery", () => {
	it("folds case, trims, and collapses internal whitespace runs", () => {
		expect(normalizeQuery("  A  b ")).toBe("a b");
	});
});

describe("resolveSearchKey", () => {
	it("matches a name regardless of case and stray whitespace", () => {
		expect(resolveSearchKey("  active   trees ", ITEMS)).toBe(
			"a-active%20trees",
		);
	});

	it("returns the stored key verbatim, without re-encoding it", () => {
		expect(resolveSearchKey("ACTIVE TREES", ITEMS)).toBe("a-active%20trees");
	});

	it("resolves a substring when exactly one row contains it", () => {
		expect(resolveSearchKey("aid international", ITEMS)).toBe("y-tree-aid");
	});

	it("refuses an ambiguous substring rather than guessing a row", () => {
		// "tree" is in 12Tree and Tree Aid International. Picking either would
		// navigate away from what the user was still narrowing down.
		expect(resolveSearchKey("tree", ITEMS)).toBeNull();
	});

	it("returns null when nothing matches", () => {
		expect(resolveSearchKey("zzz", ITEMS)).toBeNull();
	});

	it("returns null for a blank query", () => {
		expect(resolveSearchKey("   ", ITEMS)).toBeNull();
	});

	it("prefers an exact match over a substring one", () => {
		// "tree aid" is the exact name of one row and a substring of another.
		// Without the exact tier the substring tier would see 2 matches and
		// give up, so typing a full name that happens to prefix a longer one
		// would refuse to go anywhere.
		expect(resolveSearchKey("tree aid", ITEMS)).toBe("z-tree-aid");
	});

	it("falls back to the first row when two share a name", () => {
		expect(resolveSearchKey("green land group", ITEMS)).toBe("x-green-1");
	});

	it("uses the picked row to break a duplicate-name tie", () => {
		// The whole reason `selected` exists: text alone cannot distinguish
		// these two, so a click carries information a name match cannot.
		expect(resolveSearchKey("Green Land Group", ITEMS, ITEMS[3])).toBe(
			"x-green-2",
		);
	});

	it("ignores a selection the query has since been edited away from", () => {
		// Picked Green Land Group, then typed something else: the old selection
		// must not hijack the new query.
		expect(resolveSearchKey("12Tree", ITEMS, ITEMS[3])).toBe("c-12tree");
	});

	it("returns null against an empty list rather than throwing", () => {
		// The list is streamed, so a submit can genuinely arrive before it.
		expect(resolveSearchKey("12Tree", [])).toBeNull();
	});
});
