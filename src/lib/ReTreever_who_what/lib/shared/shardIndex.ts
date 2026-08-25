/**
 * THE SHARD INDEX — one number line for every shard on the site.
 *
 * Every decorative torn piece across every page is a SHARD, and each one owns
 * exactly one number. Number 22 is the Polygons strip, wherever you are and
 * whoever you are talking to. There is no second number 22.
 *
 * WHY THIS FILE EXISTS. The ids used to be typed by hand into each component's
 * markup. Nothing owned the numbers, so nothing prevented two pages picking the
 * same one — and they did: the search page's fifth shard and the why page's
 * frame were both "number 5". Uniqueness was only ever checked after the fact,
 * by grepping, which catches a collision that already shipped instead of
 * preventing it. Now the numbers are DATA, allocated here once, and
 * `shardIndex.test.ts` fails the build if two shards ever claim the same one.
 * That is the difference between "we checked" and "it cannot happen".
 *
 * ADDING A SHARD: append an entry to `SHARDS` with the next free `n`. Never
 * renumber an existing one — a number is a name, and renaming things people
 * refer to is how a shared vocabulary rots. Gaps are fine and expected: a
 * deleted shard leaves its number retired rather than recycled, so a stale note
 * saying "number 14" can never silently point at a different piece.
 *
 * The `page` field is not decoration — `shardId()` builds the DOM id from it,
 * so a shard declared on the wrong page gets the wrong id.
 */

export type ShardPage = 'search' | 'why';

export type ShardEntry = {
	/** the number — unique across the WHOLE SITE, never reused */
	n: number;
	/** which page it renders on; becomes the id prefix */
	page: ShardPage;
	/**
	 * Short slug describing the piece, e.g. `polygons`. Appended to the id so a
	 * human reading the DOM gets both the number AND what it is. Omitted for
	 * the numbered artwork shards, whose only identity IS their number.
	 */
	slug?: string;
	/** what it actually is, for humans reading this table */
	what: string;
	/**
	 * Which artwork the piece draws. For the solver-placed search shards this
	 * is the original poly number, which is NOT the same as `n` once the
	 * numbering went global — the artwork files are still `..._poly_3.svg`.
	 */
	art?: number;
};

/**
 * THE LINE. Ordered by number; read it top to bottom to see the whole site.
 *
 * 1..11   search page — the solver-placed hero shards (artwork poly 1..11)
 * 12..15  search page — the headline shards below the fold
 * 16..19  why page    — the four hand-placed corner polys
 * 20      why page    — the torn frame the photo strips sit in
 * 21..23  why page    — the three photo strips
 * 24..25  why page    — the header lockup and the affiliates panel
 * 26      search page — the middle divider strip
 */
export const SHARDS: ShardEntry[] = [
	// ---- search page: hero ring (solver-placed) ----
	{ n: 1, page: 'search', what: 'hero shard, top-left long reach', art: 1 },
	{ n: 2, page: 'search', what: 'hero shard, corner punctuation', art: 2 },
	{ n: 3, page: 'search', what: 'hero shard, top-right small', art: 3 },
	{ n: 4, page: 'search', what: 'hero shard, upper-right medium', art: 4 },
	{ n: 5, page: 'search', what: 'hero shard, mid-right long reach', art: 5 },
	{ n: 6, page: 'search', what: 'hero shard (artwork 9), bottom-left', art: 9 },
	{ n: 7, page: 'search', what: 'hero shard (artwork 11), mid-left', art: 11 },

	// ---- search page: headline section ----
	{ n: 12, page: 'search', slug: 'headline', what: 'headline shard, right', art: 7 },
	{ n: 13, page: 'search', slug: 'headline', what: 'headline shard, left', art: 6 },
	{ n: 14, page: 'search', slug: 'headline', what: 'headline shard, lower-left', art: 10 },
	{ n: 15, page: 'search', slug: 'headline', what: 'headline shard, lower-right', art: 8 },

	// ---- why page: hand-placed corner polys ----
	{ n: 16, page: 'why', what: 'corner poly 1 (D_poly_1.svg)', art: 1 },
	{ n: 17, page: 'why', what: 'corner poly 2 (D_poly_2.svg)', art: 2 },
	{ n: 18, page: 'why', what: 'corner poly 3 (D_poly_3.svg)', art: 3 },
	{ n: 19, page: 'why', what: 'corner poly 4 (D_poly_4.svg)', art: 4 },

	// ---- why page: the photo-strip composition ----
	{ n: 20, page: 'why', slug: 'frame', what: 'torn yellow outline behind the strips' },
	{ n: 21, page: 'why', slug: 'projects', what: 'Projects photo strip' },
	{ n: 22, page: 'why', slug: 'polygons', what: 'Polygons photo strip' },
	{ n: 23, page: 'why', slug: 'data', what: 'Data photo strip' },

	// ---- why page: overlays ----
	{ n: 24, page: 'why', slug: 'header', what: 'WHAT we do and WHY lockup' },
	{ n: 25, page: 'why', slug: 'affiliates', what: 'Affiliates panel' },

	// ---- search page: the band between the two sections ----
	// Numbered out of page order because numbers are ALLOCATED, never sorted:
	// 26 was the next free one when the divider was indexed. Renumbering it to
	// sit beside the other search shards would break the one rule this file has.
	{
		n: 26,
		page: 'search',
		slug: 'divider',
		what: 'middle divider — pine-seedling photo strip between hero and headline',
	},
];

/**
 * The DOM id for a shard: `<page>_shard-<n>[-<slug>]`.
 *
 * The number alone identifies it — the slug is a courtesy for whoever is
 * reading the DOM, and the page prefix answers "where do I find this?" without
 * a lookup. Neither is load-bearing: `n` is the name.
 */
export function shardId(entry: ShardEntry): string {
	const base = `${entry.page}_shard-${entry.n}`;
	return entry.slug ? `${base}-${entry.slug}` : base;
}

/** Look up one shard by its number. Throws rather than returning undefined —
 *  a missing number is a typo in the caller, and a silent undefined would
 *  render `id="undefined"` instead of failing where the mistake is. */
export function shard(n: number): ShardEntry {
	const found = SHARDS.find((s) => s.n === n);
	if (!found) {
		throw new Error(
			`No shard numbered ${n}. Numbers are allocated in shardIndex.ts; ` +
				`add an entry there rather than inventing one at the call site.`,
		);
	}
	return found;
}

/** Every shard on one page, in number order. */
export function shardsFor(page: ShardPage): ShardEntry[] {
	return SHARDS.filter((s) => s.page === page).sort((a, b) => a.n - b.n);
}

/**
 * Map from artwork number to shard number, for one page.
 *
 * The search page's solver works in ARTWORK numbers (`HOME`/`HEADLINE` in
 * shardLayout.ts reference `Search_page_SP_poly_N.svg`), which stopped matching
 * the shard numbers once the line went global — artwork 9 is shard 6. This is
 * the bridge, so the template can render a solver shard and still ask the index
 * for its id instead of guessing.
 */
export function byArt(page: ShardPage): Map<number, ShardEntry> {
	const m = new Map<number, ShardEntry>();
	for (const s of shardsFor(page)) if (s.art !== undefined) m.set(s.art, s);
	return m;
}
