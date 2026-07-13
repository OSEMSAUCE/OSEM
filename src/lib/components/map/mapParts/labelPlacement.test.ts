import { describe, expect, it } from "vitest";
import {
	deriveHandle,
	type LabelArea,
	layoutLabels,
	score,
} from "./labelPlacement.js";

// NOTE: the handoff README's examples drift from its own reference JS in two
// places ("Fulton's Maple" spell-fix, "GT User" camel-split) — the JS module
// is the stated deliverable ("port this, not the HTML"), so these tests lock
// the JS behaviour.
describe("deriveHandle — Rule 1 short-handle suggestion", () => {
	it("strips filler tokens and keeps the first two meaningful words", () => {
		expect(deriveHandle("Sugar Shack Decoration pile")).toBe("Sugar Shack");
		expect(deriveHandle("Fulton's Mapl Syrup blk restor mini")).toBe(
			"Fulton's Mapl",
		);
	});

	it("drops a leading polygon_ prefix", () => {
		expect(deriveHandle("polygon_GTUser")).toBe("GTUser");
	});

	it("treats underscores as word separators", () => {
		expect(deriveHandle("north_field_block")).toBe("north field");
	});

	it("never returns empty — an all-filler name falls back to the input", () => {
		expect(deriveHandle("blk restor")).toBe("blk restor");
	});
});

function area(
	id: string,
	hectares: number,
	visitedDaysAgo = 0,
): LabelArea {
	return { id, fullName: id, displayName: id, hectares, visitedDaysAgo };
}

// A projection that lets each test place areas by hand, and a flat-width
// measurer so box sizes are predictable.
function opts(
	positions: Record<string, { x: number; y: number }>,
	selectedId: string | null = null,
) {
	return {
		selectedId,
		project: (a: LabelArea) => positions[a.id],
		measureText: (text: string) => text.length * 7,
	};
}

describe("layoutLabels — Rule 2 priority budget", () => {
	it("far-apart areas all keep their labels", () => {
		const { decisions } = layoutLabels(
			[area("a", 10), area("b", 20)],
			opts({ a: { x: 0, y: 0 }, b: { x: 500, y: 500 } }),
		);
		expect(decisions.every((d) => d.kind === "label")).toBe(true);
	});

	it("of two colliding areas, the bigger keeps its label and the smaller collapses to a dot", () => {
		const { decisions } = layoutLabels(
			[area("small", 5), area("big", 50)],
			opts({ small: { x: 0, y: 0 }, big: { x: 10, y: 4 } }),
		);
		const byId = new Map(decisions.map((d) => [d.id, d.kind]));
		expect(byId.get("big")).toBe("label");
		expect(byId.get("small")).toBe("dot");
	});

	it("the selected area bypasses collision and always keeps its label", () => {
		const { decisions } = layoutLabels(
			[area("small", 5), area("big", 50)],
			opts({ small: { x: 0, y: 0 }, big: { x: 10, y: 4 } }, "small"),
		);
		const byId = new Map(decisions.map((d) => [d.id, d.kind]));
		expect(byId.get("small")).toBe("label");
	});

	it("recency breaks a size tie in 'both' mode", () => {
		const yesterday = area("yesterday", 10, 1);
		const lastMonth = area("lastMonth", 10, 30);
		const { decisions } = layoutLabels(
			[lastMonth, yesterday],
			opts({ yesterday: { x: 0, y: 0 }, lastMonth: { x: 10, y: 4 } }),
		);
		const byId = new Map(decisions.map((d) => [d.id, d.kind]));
		expect(byId.get("yesterday")).toBe("label");
		expect(byId.get("lastMonth")).toBe("dot");
	});

	it("labels reserve their boxes — a third area colliding with a placed dot also loses", () => {
		const { decisions, placed } = layoutLabels(
			[area("a", 50), area("b", 20), area("c", 5)],
			opts({
				a: { x: 0, y: 0 },
				b: { x: 10, y: 4 }, // collides with a → dot
				c: { x: 12, y: 6 }, // collides with b's dot box → dot
			}),
		);
		const byId = new Map(decisions.map((d) => [d.id, d.kind]));
		expect(byId.get("a")).toBe("label");
		expect(byId.get("b")).toBe("dot");
		expect(byId.get("c")).toBe("dot");
		expect(placed).toHaveLength(3); // every decision reserved a footprint
	});
});

describe("score — Rule 2 priority model", () => {
	const stats = { maxHectares: 100, minVisited: 0, maxVisited: 10 };
	it("'big' mode orders purely by size", () => {
		expect(score(area("x", 100, 10), "big", stats)).toBeGreaterThan(
			score(area("y", 50, 0), "big", stats),
		);
	});
	it("'recent' mode orders purely by recency", () => {
		expect(score(area("x", 1, 0), "recent", stats)).toBeGreaterThan(
			score(area("y", 100, 10), "recent", stats),
		);
	});
});
