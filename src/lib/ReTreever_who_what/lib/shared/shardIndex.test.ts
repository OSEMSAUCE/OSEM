import { describe, expect, it } from 'vitest';
import { SHARDS, byArt, shard, shardId, shardsFor } from './shardIndex';

/**
 * These tests exist to make a collision IMPOSSIBLE, not merely noticed.
 *
 * The whole reason shardIndex.ts was written is that ids used to be hand-typed
 * into markup, so two pages could — and did — both claim "number 5". Grepping
 * afterwards catches a collision that already shipped. A failing test catches
 * it before it can.
 */
describe('shard numbers are unique across the whole site', () => {
	it('never reuses a number, on any page', () => {
		const seen = new Map<number, string>();
		const collisions: string[] = [];
		for (const s of SHARDS) {
			const prev = seen.get(s.n);
			if (prev) collisions.push(`${s.n}: "${prev}" and "${s.what}"`);
			seen.set(s.n, s.what);
		}
		expect(collisions, `numbers claimed twice:\n${collisions.join('\n')}`)
			.toEqual([]);
	});

	it('produces a unique DOM id for every shard', () => {
		const ids = SHARDS.map(shardId);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('uses positive whole numbers only', () => {
		for (const s of SHARDS) {
			expect(Number.isInteger(s.n), `shard ${s.n} is not a whole number`)
				.toBe(true);
			expect(s.n, `shard numbers start at 1`).toBeGreaterThan(0);
		}
	});
});

describe('the index describes something real', () => {
	it('gives every shard a human description', () => {
		for (const s of SHARDS) expect(s.what.length).toBeGreaterThan(0);
	});

	it('builds ids as <page>_shard-<n>[-<slug>]', () => {
		expect(shardId({ n: 5, page: 'search', what: 'x' })).toBe('search_shard-5');
		expect(shardId({ n: 22, page: 'why', slug: 'polygons', what: 'x' }))
			.toBe('why_shard-22-polygons');
	});

	it('finds a shard by number', () => {
		expect(shard(22).what).toContain('Polygons');
		expect(shard(22).page).toBe('why');
	});

	it('throws on a number nobody allocated, rather than returning undefined', () => {
		// A silent undefined would render id="undefined" somewhere far from the
		// typo; throwing points at the call site that invented the number.
		expect(() => shard(9999)).toThrow(/No shard numbered 9999/);
	});
});

describe('artwork mapping', () => {
	it('maps artwork numbers to shards per page', () => {
		const m = byArt('search');
		// artwork 9 is shard 6 — the two number lines diverged once numbering
		// went global, which is exactly why this bridge exists.
		expect(m.get(9)?.n).toBe(6);
		expect(m.get(1)?.n).toBe(1);
	});

	it('never maps one artwork to two shards on the same page', () => {
		for (const page of ['search', 'why'] as const) {
			const arts = shardsFor(page)
				.map((s) => s.art)
				.filter((a): a is number => a !== undefined);
			expect(new Set(arts).size, `${page} reuses an artwork number`)
				.toBe(arts.length);
		}
	});
});
