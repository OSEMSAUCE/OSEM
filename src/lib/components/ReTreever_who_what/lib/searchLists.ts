import type { WhoWhatEndpoints } from "./whoWhatTypes";
import type { SearchListItem } from "./searchTypes";

/**
 * The dropdown lists behind the search bar — every org /who explores, every
 * scored project. Which orgs those are is the endpoint's business, not this
 * file's: it serves parents by default and children too under
 * WHO_ORG_SCOPE=all, so there is nothing to filter here either way (see
 * explorableOrgs() in src/routes/api/who/organizations/orgFields.ts).
 *
 * Shared by the search page and the results pages, because the results pages
 * carry the same search bar: without these the caret would open an empty
 * panel there, and (from Block 4 on) a typed query would have nothing to
 * resolve a key against.
 *
 * Both are STREAMED by their callers, never awaited: the page renders fine
 * without them — the dropdown just fills in — and a tab switch must not stall
 * for a round trip when the hover preload hasn't finished.
 *
 * Neither rejects. An unhandled rejection in a streamed promise crashes the
 * page, and an empty dropdown is a far better failure than no page.
 */

/** The columns the who tab asks the collection endpoint for. */
interface OrgListRow {
	organizationKey: string;
	organizationName: string;
	primaryStakeholderCategory: string | null;
}

/** The columns the what tab asks the collection endpoint for. */
interface ProjectListRow {
	projectKey: string;
	projectName: string;
}

export async function loadOrgList(
	fetch: typeof globalThis.fetch,
	endpoints: WhoWhatEndpoints,
): Promise<SearchListItem[]> {
	// No host endpoint → an empty list, not a fetch at "/undefined".
	if (!endpoints.organizations) return [];
	// Server-side fetch of an internal route calls the handler directly — no
	// HTTP round trip — and keeps the org query in one place (the API).
	const endpoint = `${endpoints.organizations}?fields=organizationKey,organizationName,primaryStakeholderCategory`;

	try {
		const res = await fetch(endpoint);
		if (!res.ok) {
			throw new Error(`${endpoint} responded ${res.status}`);
		}
		const { organizations } = (await res.json()) as {
			organizations: OrgListRow[];
		};

		// Rename into the dropdown's vocabulary; the endpoint already sorts.
		return organizations.map((org) => ({
			key: org.organizationKey,
			name: org.organizationName,
			hint: org.primaryStakeholderCategory,
		}));
	} catch (error) {
		console.error("who: failed to load organizations list", error);
		return [];
	}
}

export async function loadProjectList(
	fetch: typeof globalThis.fetch,
	endpoints: WhoWhatEndpoints,
): Promise<SearchListItem[]> {
	if (!endpoints.projects) return [];
	// `scored` matches whatV1: only projects whose detail views have a score.
	const endpoint = `${endpoints.projects}?scored=true&fields=projectKey,projectName`;

	try {
		const res = await fetch(endpoint);
		if (!res.ok) {
			throw new Error(`${endpoint} responded ${res.status}`);
		}
		const { projects } = (await res.json()) as {
			projects: ProjectListRow[];
		};

		// Rename into the dropdown's vocabulary; the endpoint already sorts.
		return projects.map((project) => ({
			key: project.projectKey,
			name: project.projectName,
		}));
	} catch (error) {
		console.error("what: failed to load projects list", error);
		return [];
	}
}
