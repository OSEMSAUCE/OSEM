import { error } from "@sveltejs/kit";
import { endpoints } from "$lib/core/endpoints";
import { toTransparencyScore } from "./whoWhatTypes";

/**
 * Loading one search result — the org or project a submitted search lands on.
 *
 * Both results routes share this so the two pages can't drift on the parts
 * that must match: which score column becomes "the rating", the 0–1 → 0–100
 * conversion, and what a missing key does. What differs between them is only
 * the endpoint, the field list, and the column names, so that's all each
 * loader below spells out.
 *
 * Unlike the search page's dropdown lists (streamed, page renders fine
 * without them), these loads are AWAITED: the name and the rating are the
 * page — there is nothing to show while they're in flight.
 */

/** What a results page renders, whichever resource it came from. */
export interface SearchResult {
	/** organizationKey / projectKey. */
	key: string;
	name: string;
	/** Transparency rating as a 0–100 percentage; null when unscored. */
	rating: number | null;
	/** Percentile rank, raw from the API; null when unranked. */
	rank: number | null;
	/** Secondary line — an org's stakeholder category. Projects have none. */
	hint?: string | null;
}

/**
 * Fetch one item from a collection's single-item endpoint.
 *
 * The API's own 404 (unknown key, or a soft-deleted row) becomes the page's
 * 404, so a mistyped URL renders the site error page instead of a results
 * page with empty fields. Anything else upstream is a 500: the caller asked
 * for a specific record and we can't say anything true about it.
 *
 * A redirect is followed ONCE. The organizations endpoint answers a child
 * org's key with a 302 to its parent, and SvelteKit's server-side fetch of an
 * internal route hands back the 3xx rather than following it — so without this
 * the results page would treat "go here instead" as an unusable response. One
 * hop, not a loop: the target is by construction a record the endpoint serves
 * directly, so a second redirect means the data is malformed, and following it
 * blindly would hang the request instead of failing it.
 */
async function fetchItem<T>(
	fetch: typeof globalThis.fetch,
	endpoint: string,
	envelopeKey: string,
	notFoundMessage: string,
): Promise<T> {
	let res: Response;
	try {
		// A server-side fetch of an internal route calls the handler directly —
		// no HTTP round trip — so the query stays in one place (the API).
		res = await fetch(endpoint);

		const redirectedTo = res.status === 302 && res.headers.get("location");
		if (redirectedTo) {
			res = await fetch(redirectedTo);
		}
	} catch (cause) {
		console.error(`results: ${endpoint} failed`, cause);
		throw error(500, "Could not reach the data service");
	}

	if (res.status === 404) {
		throw error(404, notFoundMessage);
	}
	if (!res.ok) {
		console.error(`results: ${endpoint} responded ${res.status}`);
		throw error(500, "Could not load this record");
	}

	const payload = (await res.json()) as Record<string, T>;
	const item = payload[envelopeKey];
	// A 200 with an empty envelope would otherwise reach the page as a card of
	// undefineds; treat it as the missing record it describes.
	if (!item) {
		throw error(404, notFoundMessage);
	}
	return item;
}

interface OrgRow {
	organizationKey: string;
	organizationName: string;
	scoreOrgFinal: unknown;
	scoreRankOverall: number | null;
	primaryStakeholderCategory: string | null;
}

/** The org's rating is `scoreOrgFinal` — the final blended org score. */
export async function loadOrganization(
	fetch: typeof globalThis.fetch,
	organizationKey: string,
): Promise<SearchResult> {
	const fields =
		"organizationKey,organizationName,scoreOrgFinal,scoreRankOverall,primaryStakeholderCategory";
	const org = await fetchItem<OrgRow>(
		fetch,
		`${endpoints.organization(organizationKey)}?fields=${fields}`,
		"organization",
		`No organization with the key "${organizationKey}"`,
	);

	return {
		key: org.organizationKey,
		name: org.organizationName,
		// Converted HERE, once, so the page only ever sees the 0–100 number —
		// scoreOrgFinal is a Prisma Decimal and arrives over json() as a string.
		rating: toTransparencyScore(org.scoreOrgFinal),
		rank: org.scoreRankOverall,
		hint: org.primaryStakeholderCategory,
	};
}

interface ProjectRow {
	projectKey: string;
	projectName: string;
	scoreProject: unknown;
	scoreProjectRank: number | null;
}

/** The project's rating is `scoreProject` — same 0–1 scale as the org score. */
export async function loadProject(
	fetch: typeof globalThis.fetch,
	projectKey: string,
): Promise<SearchResult> {
	const fields = "projectKey,projectName,scoreProject,scoreProjectRank";
	const project = await fetchItem<ProjectRow>(
		fetch,
		`${endpoints.project(projectKey)}?fields=${fields}`,
		"project",
		`No project with the key "${projectKey}"`,
	);

	return {
		key: project.projectKey,
		name: project.projectName,
		rating: toTransparencyScore(project.scoreProject),
		rank: project.scoreProjectRank,
	};
}
