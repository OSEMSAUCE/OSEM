/**
 * One row in the search page's dropdown list — the shape SearchPage needs,
 * regardless of whether the row came from the organizations API or (later)
 * a projects endpoint. Routes flatten their API payloads into this.
 */
export interface SearchListItem {
	/** Stable identifier (organizationKey / projectKey). */
	key: string;
	/** Display name, and what a selection writes into the query field. */
	name: string;
	/** Secondary line, e.g. an org's primaryStakeholderCategory. */
	hint?: string | null;
}
