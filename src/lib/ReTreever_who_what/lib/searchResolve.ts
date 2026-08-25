import type { SearchListItem } from "./searchTypes";

/**
 * Turning what's in the search bar into the key of a row to navigate to.
 *
 * Submit resolves against the list ALREADY LOADED for the dropdown — there is
 * no server-side free-text search. That's why this is a pure function over an
 * array rather than a fetch: the rows are in memory anyway, and matching them
 * here costs one pass over ~1,800 orgs / ~8,300 projects.
 *
 * Its own module, not a closure inside SearchRoute, so the matching rules are
 * testable without mounting a component.
 */

/**
 * Case, surrounding space and internal runs of whitespace are noise when
 * comparing a typed name against a stored one — "  active   trees " and
 * "ACTIVE TREES" are the same search.
 */
export function normalizeQuery(raw: string): string {
	return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * The key to navigate to, or null when the query doesn't identify one row.
 *
 * Three tiers, most certain first:
 *
 *  1. `selected` — the row the user actually clicked in the dropdown, used
 *     only while the bar still reads exactly what that click wrote. This tier
 *     exists because names are NOT unique: 9 organizations share a name with
 *     another, so a click has information an exact name match cannot recover.
 *     Once the text is edited the selection is stale and is ignored.
 *  2. An exact name match. With duplicate names the first wins — landing on
 *     one of two identically-named orgs beats refusing to move.
 *  3. A substring match, but ONLY if exactly one row contains the query.
 *     Several matches means the query hasn't picked anything yet; guessing
 *     one would send the user somewhere they didn't ask for.
 */
export function resolveSearchKey(
	query: string,
	items: SearchListItem[],
	selected?: SearchListItem | null,
): string | null {
	const q = normalizeQuery(query);
	if (!q) return null;

	if (selected && normalizeQuery(selected.name) === q) {
		return selected.key;
	}

	const exact = items.find((item) => normalizeQuery(item.name) === q);
	if (exact) return exact.key;

	const partial = items.filter((item) =>
		normalizeQuery(item.name).includes(q),
	);
	return partial.length === 1 ? partial[0].key : null;
}
