/**
 * bitmapCacheEviction.test.ts — the LRU drain rule shared by the two decoded-
 * tile caches (`satBakeWorker.ts` CACHE_MAX, `satelliteImage.ts` TILE_CACHE_MAX).
 *
 * ── Why this test exists ──
 * Both caches evicted with `if (size > CAP)`, which removes at most ONE entry
 * per insert. That is fine while a cache grows one step at a time, and silently
 * wrong the moment it is already over — most importantly after the cap was
 * LOWERED (256 → 48). With `if`, the cache sits at its old high-water mark
 * forever and the new cap is a lie; the memory is never actually returned.
 *
 * The caches themselves are module-private Maps with no test seam, and widening
 * their API purely to observe them would be worse than the bug. So this pins the
 * RULE — the same loop both files run — on a plain Map.
 *
 * ⚠️ If you change the eviction in either file, change it here too, or this
 * stops describing the code it is named for.
 */
import { describe, expect, it } from "vitest";

/** The drain loop, verbatim in shape from both caches. Returns evicted keys in
 *  eviction order so a test can assert oldest-first. */
function drainToCap(
	cache: Map<string, unknown>,
	cap: number,
	justInserted: string,
): string[] {
	const evicted: string[] = [];
	while (cache.size > cap) {
		const oldest = cache.keys().next().value as string | undefined;
		if (oldest === undefined || oldest === justInserted) break;
		cache.delete(oldest);
		evicted.push(oldest);
	}
	return evicted;
}

const seed = (n: number): Map<string, number> =>
	new Map(Array.from({ length: n }, (_, i) => [`t${i}`, i]));

describe("decoded-tile cache eviction", () => {
	it("drains an OVER-CAP cache all the way down (the cap-reduction case)", () => {
		// The exact scenario the `if` version stranded: a cache holding the old
		// 256 when the cap has just become 48.
		const cache = seed(256);
		drainToCap(cache, 48, "t255");
		expect(cache.size).toBe(48);
	});

	it("evicts OLDEST first — it is an LRU, not an arbitrary cull", () => {
		const cache = seed(10);
		const evicted = drainToCap(cache, 7, "t9");
		expect(evicted).toEqual(["t0", "t1", "t2"]);
		// The newest survive.
		expect(cache.has("t9")).toBe(true);
		expect(cache.has("t8")).toBe(true);
	});

	it("never evicts the entry just inserted", () => {
		// Cap of 0 with one entry: the only candidate IS the new one, so the loop
		// must stop rather than drop the tile the caller is about to use — and
		// must not spin forever trying.
		const cache = new Map<string, number>([["fresh", 1]]);
		const evicted = drainToCap(cache, 0, "fresh");
		expect(evicted).toEqual([]);
		expect(cache.has("fresh")).toBe(true);
	});

	it("does nothing when already at or under the cap", () => {
		const cache = seed(48);
		expect(drainToCap(cache, 48, "t47")).toEqual([]);
		expect(cache.size).toBe(48);
	});

	it("⛔ a single-step evictor would NOT satisfy the cap-reduction case", () => {
		// The regression, stated as a test: this is what the old `if` did. Kept so
		// the difference is executable rather than a claim in a comment.
		const cache = seed(256);
		if (cache.size > 48) {
			const oldest = cache.keys().next().value as string;
			cache.delete(oldest);
		}
		expect(cache.size).toBe(255); // still ~5× over the cap
	});
});
