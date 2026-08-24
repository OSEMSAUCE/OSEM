<script lang="ts">
import { untrack, type Snippet } from "svelte";
import { goto } from "$app/navigation";
import { AppRoutes } from "$lib/core/appRoutes";
import SearchPage from "./SearchPage.svelte";
import { loadOrgList, loadProjectList } from "./searchLists";
import { resolveSearchKey } from "./searchResolve";
import type { SearchListItem } from "./searchTypes";

/**
 * One search page, two URLs, ONE route. The tab IS the route param: Orgs
 * lives at /retreeve/who, Projects at /retreeve/what, both served by
 * [tab=searchTab]. (/retreeve itself stays the globe hero — it does not use
 * this page.) The tabs are links inside SearchPage itself, so the filter
 * always rides in the URL — and because both URLs are the same route, a tab
 * switch keeps this whole tree mounted and only swaps the data.
 *
 * The lists are lazy-loaded HERE on first focus/open of the bar (not by the
 * server load), and cached per tab: the tab is the route, so this component
 * survives a tab switch and a revisited tab's rows are already filled.
 *
 * THE RESULTS PAGES USE THIS COMPONENT TOO, passing `results` (the answer
 * card) and `initialQuery` (what was searched for). They are the same page
 * with an extra card, so they get the same search state, the same submit
 * handling and — from here — the same navigation behaviour, instead of a
 * second copy of it that could drift.
 */
let {
	tab,
	title,
	initialQuery = "",
	results,
}: {
	tab: "orgs" | "projects";
	title: string;
	/** Pre-fills the bar — the results pages show what was searched for. */
	initialQuery?: string;
	/** The results card; absent on the search page itself. */
	results?: Snippet;
} = $props();

// Dropdown lists, LAZY-loaded on first focus/open of the bar (see `activate`),
// not on page load — a visitor who never searches never fetches the
// ~1,800-org / ~8,300-project list. Cached per tab for the life of the mount.
let orgs = $state<SearchListItem[]>([]);
let projects = $state<SearchListItem[]>([]);
let orgsLoaded = false;
let projectsLoaded = false;
let activated = false;
let listLoading = $state(false);

async function loadTab(which: "orgs" | "projects") {
	// Flag set BEFORE the await so a focus + the tab effect can't double-fetch.
	if (which === "orgs" ? orgsLoaded : projectsLoaded) return;
	if (which === "orgs") orgsLoaded = true;
	else projectsLoaded = true;

	listLoading = true;
	try {
		if (which === "orgs") orgs = await loadOrgList(fetch);
		else projects = await loadProjectList(fetch);
	} finally {
		listLoading = false;
	}
}

/** First focus / list-open: load the active tab's rows. */
function activate() {
	activated = true;
	loadTab(tab);
}

// Once activated, a tab switch (same route → this component stays mounted)
// loads the newly-active tab on demand too.
$effect(() => {
	tab; // re-run when the tab changes
	if (activated) loadTab(tab);
});

// Warm the active tab's list during idle, just after the page becomes
// interactive — so the rows are already there by the time the user reaches for
// the bar, the way the old eager load felt, but WITHOUT competing with first
// paint and now served from the CDN cache (the list endpoints set
// Cache-Control). Hover/focus still trigger it sooner for anyone who beats the
// idle timer; loadTab is idempotent, so the warm-up and a real interaction
// can't double-fetch.
$effect(() => {
	let idleHandle = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	if (typeof window.requestIdleCallback === "function") {
		idleHandle = window.requestIdleCallback(() => activate(), {
			timeout: 2000,
		});
	} else {
		// Safari < 16.4 and anything else without requestIdleCallback.
		timer = setTimeout(() => activate(), 200);
	}
	return () => {
		if (idleHandle) window.cancelIdleCallback?.(idleHandle);
		if (timer) clearTimeout(timer);
	};
});

/**
 * Seeded from the prop so the SERVER renders the bar already filled — an
 * effect alone would leave it empty in the SSR'd HTML and pop the name in
 * after hydration. `untrack` because this is genuinely a one-time read; the
 * effect below owns every later change.
 */
let query = $state(untrack(() => initialQuery));
let dropdownOpen = $state(false);
/** The dropdown row the user last clicked; see SearchPage's `selected`. */
let selected = $state<SearchListItem | null>(null);
let notice = $state<string | null>(null);

/**
 * Re-seed the bar when the ROUTE's subject changes — navigating from one
 * result to another keeps this component mounted, so a plain initialiser
 * would leave the previous org's name in the bar. Reads only `initialQuery`,
 * so typing never re-triggers it, and on the search page (where it is always
 * "") it never fires after mount.
 */
$effect(() => {
	query = initialQuery;
});

/**
 * Editing the bar retires the last submit's message — leaving "No match" up
 * while the user types the correction reads as a live verdict on what they
 * are currently typing, which it isn't. Reads `query` only, so it can't loop
 * against the write below.
 */
$effect(() => {
	query;
	notice = null;
});

/**
 * Submit = go to that record's results page.
 *
 * The key comes from the list the dropdown already holds (see
 * searchResolve.ts) — there is no server-side free-text search, so an
 * unresolvable query stays put with a message rather than navigating to a
 * guessed key and 404ing.
 */
function submitSearch(q: string, t: "orgs" | "projects") {
	const items = t === "orgs" ? orgs : projects;

	if (!q.trim()) {
		notice = "Type a name, or open the list to browse.";
		return;
	}

	// The list is streamed, so a submit within the first moments of a cold
	// visit can arrive before it does. That is not a failed match, and saying
	// so would send the user off to re-check a name that was fine.
	if (items.length === 0) {
		notice = "Still loading — try again in a moment.";
		return;
	}

	const key = resolveSearchKey(q, items, selected);
	if (!key) {
		notice = "No match — pick one from the list.";
		return;
	}

	notice = null;
	goto(t === "orgs" ? AppRoutes.whoOrg(key) : AppRoutes.whatProject(key));
}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<SearchPage
	bind:query
	bind:dropdownOpen
	bind:selected
	{notice}
	activeTab={tab}
	{orgs}
	{projects}
	{listLoading}
	{results}
	onsearch={submitSearch}
	onactivate={activate}
/>