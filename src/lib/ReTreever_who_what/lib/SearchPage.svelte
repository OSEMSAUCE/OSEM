<script lang="ts">
import FindRaw from "./homeAssets/Search_page_Find.svg?raw";
import TruthInReforestationRaw from "./homeAssets/Search_page_Truth_in_Reforestation.svg?raw";
import OrgsSelectedRaw from "./homeAssets/Search_page_Orgs_Selected.svg?raw";
import OrgsUnselectedRaw from "./homeAssets/Search_page_Orgs_Unselected.svg?raw";
import ProjectsSelectedRaw from "./homeAssets/Search_page_Projects_Selected.svg?raw";
import ProjectsUnselectedRaw from "./homeAssets/Search_page_Projects_Unselected.svg?raw";
import GrassMascot from "./GrassMascot.svelte";
import GrassTufts from "./GrassTufts.svelte";
import GlobeSpinIcon from "./GlobeSpinIcon.svelte";
import SearchBar from "./SearchBar.svelte";
import poly1Raw from "./homeAssets/poly/Search_page_SP_poly_1.svg?raw";
import poly2Raw from "./homeAssets/poly/Search_page_SP_poly_2.svg?raw";
import poly3Raw from "./homeAssets/poly/Search_page_SP_poly_3.svg?raw";
import poly4Raw from "./homeAssets/poly/Search_page_SP_poly_4.svg?raw";
import poly5Raw from "./homeAssets/poly/Search_page_SP_poly_5.svg?raw";
import poly6Raw from "./homeAssets/poly/Search_page_SP_poly_6.svg?raw";
import poly7Raw from "./homeAssets/poly/Search_page_SP_poly_7.svg?raw";
import poly8Raw from "./homeAssets/poly/Search_page_SP_poly_8.svg?raw";
import poly9Raw from "./homeAssets/poly/Search_page_SP_poly_9.svg?raw";
import poly10Raw from "./homeAssets/poly/Search_page_SP_poly_10.svg?raw";
import poly11Raw from "./homeAssets/poly/Search_page_SP_poly_11.svg?raw";
import MiddleDividerRaw from "./homeAssets/poly/Search_page_Middle_Divider.svg?raw";
import {
	HEADLINE,
	HOME,
	depthOf,
	layerOf,
	layoutPage,
	parallaxY,
	type Placed,
} from "./shardLayout";
/**
 * Shard ids come from the INDEX, never from a literal typed here. The layout
 * config works in artwork numbers (poly 1..11); the index owns the site-wide shard
 * numbers, and `byArt` is the bridge between the two. Hardcoding an id here is
 * what let two pages both claim "number 5" — see shardIndex.ts.
 */
import { byArt, shard, shardId } from "./shared/shardIndex";
import type { WhoWhatRoutes } from "./whoWhatTypes";
import type { SearchListItem } from "./searchTypes";
import type { Snippet } from "svelte";

/**
 * Markup and artwork for the retreeve search page — served at /retreeve/who
 * (Orgs) and /retreeve/what (Projects); /retreeve itself is the globe hero,
 * not this page. It owns the layout and the presentational state (whether
 * the dropdown caret is flipped); it owns no data. `SearchRoute.svelte`
 * supplies `activeTab` from the route and `onsearch`, so the actual search —
 * server action, API call, navigation — stays in the route. The tabs are
 * plain links to /who and /what (the tab IS the route, so the filter lives
 * in the URL) — anchors, not buttons + goto(), so the app-wide
 * data-sveltekit-preload-data="hover" starts the target's server load on
 * hover/touchstart instead of at click time.
 *
 * Kept as one file: both sections derive their bands from the shared `--art`
 * token block below, so splitting them would trade size for coupling.
 *
 * THE RESULTS PAGES RENDER THIS SAME COMPONENT. A submitted search lands on
 * /retreeve/who/[organizationKey] (or the projects twin), which renders this
 * page with its answer passed in through the optional `results` snippet — so
 * the artwork, the shard layout and the fold rule exist once, and a fix to
 * any of them reaches both pages. With no snippet the page is exactly what it
 * has always been; it never learns that a results page exists.
 */
let {
	query = $bindable(""),
	activeTab = "orgs",
	dropdownOpen = $bindable(false),
	selected = $bindable(null),
	notice = null,
	routes = {},
	mapHref = undefined,
	orgs = [],
	projects = [],
	onsearch,
	onactivate,
	listLoading = false,
	results,
}: {
	query?: string;
	activeTab?: "orgs" | "projects";
	dropdownOpen?: boolean;
	/**
	 * The row the user last picked from the dropdown, handed back so the route
	 * can navigate to the exact record rather than re-deriving it from the
	 * text. Names are not unique, so the text alone can be ambiguous.
	 */
	selected?: SearchListItem | null;
	/** Short message under the bar, e.g. when a submit matched nothing. */
	notice?: string | null;
	/** Where the spinning globe beside the caption points. */
	mapHref?: string;
	/**
	 * The host's URL map. ReTreever passes its AppRoutes; the harness passes
	 * nothing and the tab stickers render without hrefs.
	 */
	routes?: WhoWhatRoutes;
	/** Rows for the dropdown under the Orgs tab; the route loads them. */
	orgs?: SearchListItem[];
	/** Rows for the dropdown under the Projects tab. */
	projects?: SearchListItem[];
	/** Fired on submit; the tab rides along so the route knows what to query. */
	onsearch?: (query: string, tab: "orgs" | "projects") => void;
	/** Threaded to the bar; fires on first focus/open so the route lazy-loads
	 *  the dropdown rows. */
	onactivate?: () => void;
	/** True while the lazy list fetch is in flight — shows "Loading…" in the
	 *  dropdown rather than a misleading "none loaded". */
	listLoading?: boolean;
	/**
	 * A submitted search's answer, rendered inside the search card under the
	 * caption. Absent on the search page itself — that's the seam the results
	 * pages hang off, and the only thing that distinguishes them.
	 */
	results?: Snippet;
} = $props();

// The "search by list" dropdown: the active tab's rows, narrowed live by
// whatever is typed in the bar, so the caret button doubles as a browse-all
// when the query is empty.
const listItems = $derived(activeTab === "orgs" ? orgs : projects);

// searchIndex lowercases each name ONCE per list change, so filtering doesn't
// call item.name.toLowerCase() for every catalogue row on every keystroke.
const searchIndex = $derived(
	listItems.map((item) => ({ item, hay: item.name.toLowerCase() })),
);

// The dropdown can browse the FULL catalogue (every org / every scored project
// — the loader applies no limit). Cap the rendered rows so an empty query (or a
// broad match) can't mount thousands of <li><button> subtrees the instant the
// caret opens; `total` drives a "keep typing to narrow" row so the overflow is
// signalled, not silently dropped.
const MAX_DROPDOWN_ROWS = 50;
const filtered = $derived.by(() => {
	const q = query.trim().toLowerCase();
	const matches = q
		? searchIndex.filter((e) => e.hay.includes(q))
		: searchIndex;
	return {
		total: matches.length,
		rows: matches.slice(0, MAX_DROPDOWN_ROWS).map((e) => e.item),
	};
});

/**
 * Picking a row is a fill, not a search: the route only hears `onsearch`.
 * The row itself rides out through `selected` so a later submit can use its
 * key instead of matching the text back to a row.
 */
function selectItem(item: SearchListItem) {
	query = item.name;
	selected = item;
	dropdownOpen = false;
}

// Dismiss the dropdown on a click/tap outside, or on Escape. `searchWrapEl`
// wraps BOTH the bar and the list, so a pointerdown inside either (a row, the
// caret, the input) is "inside" and never closes it — selectItem / the caret
// own those. Guarded on dropdownOpen so the listeners are inert when closed.
let searchWrapEl = $state<HTMLElement | null>(null);

function dismissOnOutside(e: PointerEvent) {
	if (!dropdownOpen) return;
	if (searchWrapEl && !searchWrapEl.contains(e.target as Node)) {
		dropdownOpen = false;
	}
}

function dismissOnEscape(e: KeyboardEvent) {
	if (dropdownOpen && e.key === "Escape") {
		dropdownOpen = false;
		// First Escape closes the list; stop the browser ALSO clearing the
		// type="search" field (Chrome does) so a second Escape can do that.
		e.preventDefault();
	}
}

// Edge-pinned decorative forest-photo shards, ringed around the search card.
// Their artwork is here; their POSITIONS are authored outright in
// shardLayout.ts — one config file, one entry per shard, no shard aware of any
// other. See that file for why the collision solver that used to place them is
// gone.
const shardArt: Record<number, string> = {
	1: poly1Raw,
	2: poly2Raw,
	3: poly3Raw,
	4: poly4Raw,
	5: poly5Raw,
	6: poly6Raw,
	7: poly7Raw,
	8: poly8Raw,
	9: poly9Raw,
	10: poly10Raw,
	11: poly11Raw,
};

/**
 * Solved shard positions. Empty until measured, so the server renders no
 * shards rather than guessing a viewport and flashing them into place.
 */
let shards = $state<Placed[]>([]);
let headlineShards = $state<Placed[]>([]);
let heroEl = $state<HTMLElement | null>(null);
let headlineEl = $state<HTMLElement | null>(null);

/**
 * How far the page is scrolled, in px — the input to the shard parallax.
 *
 * The shards drift against the background as you scroll, the same way they
 * move against it when the window is resized. Depth comes from shard width
 * (see `depthOf`), so the big foreground reaches travel most and the small
 * punctuation barely moves, and the layers visibly separate.
 */
let scrolled = $state(0);

/**
 * The widest shard ON THE PAGE, across BOTH sections.
 *
 * Depth has to be normalised against one shared reference or the two sections
 * would each get their own scale — the headline ring's biggest shard is
 * narrower than the hero's, so a per-section maximum would push it to depth 1
 * and make it drift like a foreground piece while sitting visually behind one.
 */
const widestShard = $derived(
	Math.max(
		1,
		...shards.map((p) => p.w),
		...headlineShards.map((p) => p.w),
	),
);

/**
 * Artwork number -> the indexed shard, so the template can ask for an id
 * instead of building one. Computed once: the mapping is static data.
 */
const searchShards = byArt("search");

/**
 * The divider's id, resolved HERE rather than inline in the template.
 * `{#each shards as shard}` binds a local named `shard`, which shadows the
 * imported `shard()` lookup inside those blocks — so calling it in the markup
 * works only by virtue of where the divider happens to sit. Resolving it in the
 * script means moving the markup can't quietly break it.
 */
const dividerId = shardId(shard(26));

/**
 * The DOM id for a laid-out shard, looked up by the artwork it draws.
 * Falls back to the artwork number only if the index has no entry — which
 * means someone added a shard to shardLayout.ts without registering it, so the
 * id is deliberately ugly rather than silently plausible.
 */
const idForArt = (art: number) => {
	const entry = searchShards.get(art);
	return entry ? shardId(entry) : `search_shard-UNREGISTERED-art${art}`;
};

/**
 * Distance from the top of the PAGE to the headline section, measured live.
 *
 * The headline ring is solved in its own local coordinates but sits far down
 * the page, so driving it from raw `window.scrollY` would hand it a large
 * offset the moment it scrolled into view — its shards would arrive already
 * shoved out of the arrangement. Subtracting the section's own offset makes
 * its parallax start from zero as it enters the viewport, so both rings behave
 * identically relative to the viewer rather than to the document origin.
 */
let headlineOffset = $state(0);

const headlineScrolled = $derived(Math.max(0, scrolled - headlineOffset));

/**
 * Resolve both rings to px for the current viewport.
 *
 * This used to solve both sections together in one page coordinate space,
 * because a collision solver had to see shards from both at once. With
 * positions authored outright in shardLayout.ts there is nothing to solve —
 * each section just scales its own config against its own height, and the
 * inter-section gap measurement that fed the shared space is gone with it.
 */
function resolveShards() {
	if (!heroEl || !headlineEl) return;
	const vw = heroEl.clientWidth;
	const heroH = heroEl.clientHeight;
	const headH = headlineEl.clientHeight;
	if (vw <= 0 || heroH <= 0 || headH <= 0) return;

	const [hero, head] = layoutPage(vw, [
		{ height: heroH, specs: HOME },
		{ height: headH, specs: HEADLINE },
	]);
	shards = hero;
	headlineShards = head;
}

/**
 * Publish the hero's distance from the top of the viewport as `--hero-top`.
 *
 * The greenery band is `bottom: 0` of the hero, and the FOLD RULE (see the
 * `.hero-section` CSS) sizes that band from `100dvh` minus everything above
 * it. The site header is part of "above it" but lives outside this component,
 * so its height can only be measured, not written as a constant — a hardcoded
 * 80px left the band's foot exactly the header's height past the fold.
 */
let lastHeroTop = -1;
function measureHeroTop() {
	if (!heroEl) return;
	const top = Math.round(heroEl.getBoundingClientRect().top + window.scrollY);
	// Skip the style write when the hero hasn't actually moved. `--hero-top`
	// feeds the greenery-band height via calc (the fold rule), so writing it
	// unconditionally re-dirties layout even when a resize/settle left the hero's
	// position unchanged — the common case for an observer burst.
	if (top === lastHeroTop) return;
	lastHeroTop = top;
	heroEl.style.setProperty("--hero-top", `${top}px`);
}

/**
 * Where the headline section starts, in page coordinates. Re-measured with the
 * hero's own offset because both move when the header's height changes or the
 * hero reflows — a stale value would bias that ring's parallax by the drift.
 */
function measureHeadlineOffset() {
	if (!headlineEl) return;
	// Subtract one viewport: parallax should start as the section ENTERS view
	// (its top reaching the bottom edge), not once it reaches the very top.
	const top = headlineEl.getBoundingClientRect().top + window.scrollY;
	headlineOffset = Math.max(0, top - window.innerHeight);
}

$effect(() => {
	if (!heroEl && !headlineEl) return;
	resolveShards();
	measureHeroTop();
	measureHeadlineOffset();
	// Coalesce resize bursts into ONE solve per frame. A ResizeObserver can fire
	// several times as layout settles (font swap, scrollbar, late image), and
	// each callback re-resolved every shard plus several getBoundingClientRect
	// reads synchronously. rAF-batching collapses a burst to one pass, and
	// also breaks write-back re-entrancy: measureHeroTop writes `--hero-top` on
	// heroEl — which this observer watches — so a synchronous callback could feed
	// itself; a scheduled frame cannot re-enter mid-callback.
	let raf = 0;
	const schedule = () => {
		if (raf) return;
		raf = requestAnimationFrame(() => {
			raf = 0;
			resolveShards();
			measureHeroTop();
			measureHeadlineOffset();
		});
	};
	const ro = new ResizeObserver(schedule);
	if (heroEl) ro.observe(heroEl);
	if (headlineEl) ro.observe(headlineEl);
	// The hero's offset also changes with the HEADER's height (outside this
	// component), which doesn't resize heroEl's own box — so the element observer
	// can miss it. Watch the viewport too, through the same coalesced schedule.
	window.addEventListener("resize", schedule);

	return () => {
		if (raf) cancelAnimationFrame(raf);
		ro.disconnect();
		window.removeEventListener("resize", schedule);
	};
});

/**
 * Shard parallax — deliberately its OWN effect, not folded into the solve above.
 *
 * The layout effect READS `shards` (through resolveShards) and WRITES them, so
 * it re-runs every time a solve lands. A scroll listener registered inside it
 * is therefore torn down and re-added on each re-run, and during the window
 * where it is detached the scroll position simply stops being tracked — which
 * is exactly why the shards sat still while the page scrolled 600px. Splitting
 * it out gives the listener a lifecycle tied to the component, not to the
 * layout: registered once, removed once.
 *
 * This effect only WRITES `scrolled` and reads nothing reactive, so it never
 * re-runs on its own account.
 *
 * PASSIVE + rAF-coalesced: scroll fires far faster than the screen refreshes,
 * and doing work per event is what turns a parallax into a stutter. The
 * listener only records a number — the transform is computed in the template.
 *
 * NOT gated on prefers-reduced-motion: this user runs Reduce Motion ON
 * system-wide, so a gate here would ship an effect he could never see.
 */
$effect(() => {
	let ticking = false;
	const onScroll = () => {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			scrolled = window.scrollY;
			ticking = false;
		});
	};
	window.addEventListener("scroll", onScroll, { passive: true });
	// Seed from the current position — a reload part-way down the page must
	// start with the shards already offset rather than snapping on first scroll.
	scrolled = window.scrollY;

	return () => window.removeEventListener("scroll", onScroll);
});
</script>

<svelte:window onpointerdown={dismissOnOutside} onkeydown={dismissOnEscape} />

<div class="home-search-page">
	<!-- ---- Hero: golden sky over greenery, wildflower band at its foot ---- -->
	<section class="hero-section" class:has-results={results} bind:this={heroEl}>
		{#each shards as shard (shard.id)}
			<!-- id names the individual shard (there is exactly one of each, and it
			     is what you read in DevTools to know which piece you're looking at);
			     the CLASS carries the styling, shared by all of them. Section-
			     prefixed because the hero and the headline draw from the same
			     numbered artwork set, so a bare `shard-7` would appear twice.
			     Everything decorative on these pages is a SHARD and is named one:
			     `search_shard-N` here, `search_headline_shard-N` below,
			     `why_shard-*` on the why page. One word, one scheme. -->
			<div
				id={idForArt(shard.id)}
				class="bg-poly"
				aria-hidden="true"
				style:left="{shard.x}px"
				style:top="{shard.y}px"
				style:width="{shard.w}px"
				style:--depth={depthOf(shard, widestShard)}
				style:--layer={layerOf(depthOf(shard, widestShard))}
				style:transform="translateY({parallaxY(depthOf(shard, widestShard), scrolled)}px) rotate({shard.rot ?? 0}deg)"
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html shardArt[shard.id]}
			</div>
		{/each}

		<div class="greenery hero-greenery" aria-hidden="true"></div>
		<!-- Depth order, back to front: black silhouette wash (::before), green
		     wash (::after), the dog, then a sparse scatter of individual tufts
		     ON TOP of him. The two washes alone could only put him wholly
		     behind or wholly in front of the grass; the scattered clumps are
		     what let him pass BEHIND a few of them with open ground between,
		     which is what actually reads as running through grass. -->
		<div class="wildflower-band" aria-hidden="true">
			<GrassMascot ground="grass" />
			<GrassTufts />
		</div>

		<div class="search-card">
			<nav class="tabs" aria-label="Search by">
				<a
					href={routes.who ?? null}
					class="tab-sticker"
					aria-current={activeTab === "orgs" ? "page" : undefined}
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html activeTab === "orgs" ? OrgsSelectedRaw : OrgsUnselectedRaw}
				</a>
				<a
					href={routes.what ?? null}
					class="tab-sticker"
					aria-current={activeTab === "projects" ? "page" : undefined}
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html activeTab === "projects" ? ProjectsSelectedRaw : ProjectsUnselectedRaw}
				</a>
			</nav>

			<!-- The wrap is the dropdown's positioning context, so the panel hangs
			     off the bar itself rather than the whole card. -->
			<div class="search-bar-wrap" bind:this={searchWrapEl}>
				<SearchBar
					bind:value={query}
					bind:dropdownOpen
					placeholder={activeTab === "orgs" ? "Search organizations…" : "Search projects…"}
					ariaLabel={activeTab === "orgs" ? "Search organizations" : "Search projects"}
					onsearch={(q) => onsearch?.(q, activeTab)}
					{onactivate}
				/>

				<!-- Plain panel stand-in for the drop-window SVG from the design
				     (not yet exported); same palette as the bar so it reads as one
				     control. Swap the chrome when the artwork lands, keep the list. -->
				{#if dropdownOpen}
					<ul class="search-dropdown">
						{#each filtered.rows as item (item.key)}
							<li>
								<button
									type="button"
									class="dropdown-row"
									onclick={() => selectItem(item)}
								>
									<span class="row-name">{item.name}</span>
									{#if item.hint}
										<span class="row-hint">{item.hint}</span>
									{/if}
								</button>
							</li>
						{:else}
							<li class="dropdown-empty">
								{#if listLoading}
									Loading {activeTab === "orgs"
										? "organizations"
										: "projects"}…
								{:else}
									No {activeTab === "orgs" ? "organizations" : "projects"}
									{query.trim() ? "match" : "loaded"}
								{/if}
							</li>
						{/each}
						{#if filtered.total > filtered.rows.length}
							<li class="dropdown-more">
								Showing {filtered.rows.length} of {filtered.total} — keep
								typing to narrow
							</li>
						{/if}
					</ul>
				{/if}

				<!-- Submit feedback — nothing matched, or the list hasn't landed
				     yet. Absolutely positioned for the same reason the dropdown
				     is: appearing must not reflow the card and re-measure the
				     shard sections. aria-live so it is announced, not just drawn. -->
				{#if notice}
					<p class="search-notice" role="status" aria-live="polite">{notice}</p>
				{/if}
			</div>

			<!-- The globe belongs beside the caption, not beside the search bar —
			     see DESKTOP_LAYOUT_PLAN.png / MOBILE_LAYOUT_REFERENCE.jpg. -->
			<div class="caption-row">
				<p class="search-caption">Search transparency rating</p>
				<GlobeSpinIcon class="globe-icon" href={mapHref ?? routes.whoMap} />
			</div>

			<!-- The results pages' one addition to this page. Inside the card, so
			     it inherits --bar-scale and sits in the same column as the bar. -->
			{@render results?.()}
		</div>
	</section>

	<!-- The divider is a SHARD like everything else decorative here, so it takes
	     its id from the index rather than a literal — see shardIndex.ts. -->
	<div class="middle-divider" id={dividerId}>
		<div class="middle-divider-photo" aria-hidden="true">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html MiddleDividerRaw}
		</div>
	</div>

	<!-- ---- Headline: hill pattern all the way up, its own band at its foot ----
	     The design draws TWO different wildflower bands: the hero's (uppergrass,
	     shorter) and this one (lowergrass, taller and denser). An earlier cut of
	     this section reused the hero's band here and it read as the same row of
	     weeds twice — that's gone now that each section gets its own artwork. -->
	<section class="headline-section" bind:this={headlineEl}>
		<div class="greenery headline-greenery" aria-hidden="true"></div>
		<div class="wildflower-band wildflower-band--lower" aria-hidden="true"></div>

		{#each headlineShards as shard (shard.id)}
			<!-- see the hero's shards above for why id-per-shard + shared class. -->
			<div
				id={idForArt(shard.id)}
				class="bg-poly"
				aria-hidden="true"
				style:left="{shard.x}px"
				style:top="{shard.y}px"
				style:width="{shard.w}px"
				style:--depth={depthOf(shard, widestShard)}
				style:--layer={layerOf(depthOf(shard, widestShard))}
				style:transform="translateY({parallaxY(depthOf(shard, widestShard), headlineScrolled)}px) rotate({shard.rot ?? 0}deg)"
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html shardArt[shard.id]}
			</div>
		{/each}

		<div class="headline">
			<div class="headline-find" aria-hidden="true">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html FindRaw}
			</div>
			<div class="headline-truth" aria-hidden="true">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html TruthInReforestationRaw}
			</div>
			<h1 class="visually-hidden">Find Truth in Reforestation.</h1>
		</div>
	</section>
</div>

<style>
	/* The page itself carries no artwork — each section paints its own sky and
	   greenery mobile shows no tiled tree pattern behind
	   them). This colour only shows through the jagged notches of the middle
	   divider. */
	.home-search-page {
		position: relative;
		min-height: calc(100vh - 5rem);
		width: 100%;
		box-sizing: border-box;
		background: #0b1109;
		display: flex;
		flex-direction: column;
		/* clip, not hidden — hidden would make this a scroll container on
		   both axes and the sideways-overflowing divider/shards would give
		   trackpad gestures a hidden x-axis to rubber-band against. See the
		   long note on html/body in app.css. */
		overflow-x: clip;
	}

	/* ---- Sections ----
	   Every band on this page (hills, wildflower) is artwork drawn at page
	   WIDTH, so one width token drives all of them. Deriving them from a single
	   value is what keeps the stack in order — content, then the wave's deepest
	   trough, then the grass — instead of that ordering being a coincidence of
	   unrelated units that only held at the viewport sizes anyone checked.

	   All ratios come from ONE source: the MainSearchPage_BACKGROUND_elements
	   layers, exported on a shared 2049x4480 mobile-page canvas (2049px wide =
	   one phone width, so a layer's height in canvas px over 2049 IS its
	   height as a share of viewport width). Each webp below is that layer
	   cropped to its own band:
	     hill_pattern.webp        crest top y1126, troughs opaque by y1449
	                              → wave drop 323/2049 = 0.158
	     uppergrass_*.webp        y1247-2028 → hero band 781/2049 = 0.381
	     lowergrass_*.webp        y2677-3873 → bottom band 1196/2049 = 0.584
	     crest top → hero band bottom: 902/2049 = 0.440 (--greenery-h)

	   --art is capped so a desktop viewport doesn't scale these mobile-page
	   ratios into thousand-pixel bands — the desktop plan keeps the bands a
	   modest slice of the page. Below the cap --art is exactly 100vw, so
	   phones and tablets render the canvas undistorted; above it the grass
	   stretches horizontally rather than growing taller, which is the cheaper
	   artefact on organic texture. */
	.hero-section,
	.headline-section {
		--art: min(100vw, 1200px);
		--upper-band: calc(var(--art) * 0.381);
		--lower-band: calc(var(--art) * 0.584);
		/* Crest top to hero-band bottom, straight from the canvas. The floor
		   keeps the band reading as a band on narrow phones, where 0.44 x
		   width collapses below what the artwork needs. */
		--greenery-h: max(calc(var(--art) * 0.44), 230px);
		/* Everything the band must clear inside the fold: the site header the
		   hero starts below (--hero-top, measured live — a static guess here
		   is what left the band 21px past the fold), plus this section's own
		   top padding and the search card above it. Subtracting the total from
		   the viewport gives the tallest band whose FOOT lands on the fold. */
		--hero-top: 80px;
		/* 340px is the search card plus its breathing room — a FLOOR, not a
		   target: `min()` here would eat into it on tall windows and push the
		   band back past the fold (measured 15px over). On a viewport too
		   short for card + 230px band, the band's floor wins the clamp and
		   `max-height: 100dvh` on the section absorbs the remainder. */
		/* 416px. Two increases, both of which make the card TALLER and so must be
		   paid for here or the greenery band's foot lands past the fold — the
		   precise failure the fold rule exists to prevent:
		     340 → 400  card cap 480 → 576px (the bar's aspect is fixed, so a
		                wider bar is a taller one)
		     400 → 416  the active tab grew from 50px to 66px max, minus the
		                10px it tucks behind the bar */
		--hero-chrome: calc(var(--hero-top) + 416px);
		position: relative;
		width: 100%;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		/* Content is top-aligned and the bottom padding reserves the whole
		   greenery zone, so content physically cannot land in it. Centring let
		   the caption drift down into the wave on short viewports. */
		padding: clamp(28px, 7vh, 80px) 16px calc(var(--greenery-h) + 16px);
	}

	.hero-section {
		/* Low enough that the section is sized by its content plus the greenery
		   band, as the mock is — the old 76vh floor left a tall empty golden
		   gap between the caption and the crest that the design doesn't have. */
		min-height: min(56vh, 620px);
		/* THE FOLD RULE: the hero is the first screen, so its foot — where the
		   wildflower band's roots are — must land ON the viewport bottom, never
		   past it. The band is `bottom: 0` of this section, so pinning the
		   section's own height to the viewport pins the band with it.
		   Widening the window used to grow --greenery-h (0.44 x --art, up to
		   528px at the 1200px cap) while viewport height stayed put, pushing
		   the section's bottom below the fold and burying the weeds' bases —
		   only their tips showed. Capping the BAND rather than clipping the
		   section keeps the search card fully visible on short windows. */
		--greenery-h: clamp(
			230px,
			calc(var(--art) * 0.44),
			max(230px, calc(100dvh - var(--hero-chrome)))
		);
		max-height: 100dvh;
		/* The painted golden sky, not a CSS gradient. The artwork carries its
		   own brushed variation, which a radial-gradient approximation cannot.
		   The file is cropped to just the painted band (2049x1486) and `cover`
		   fills the section with it, so the brushwork keeps its proportions at
		   any aspect. The flat colour underneath matches the paint, so even a
		   viewport taller than the crop never reveals a hard cut. */
		background-color: #cc9f47;
		background-image: url("/golden_sky_background.webp");
		background-size: cover;
		background-position: center top;
		background-repeat: no-repeat;
	}

	/* The results card is content the FOLD RULE above doesn't know about:
	   --hero-chrome is what the greenery band must clear inside the fold, and
	   its 340px covers the search card as the search page draws it. A results
	   page puts ~120px more in that same card, so without this the band would
	   be sized for a shorter card and the extra would push its foot past the
	   viewport bottom — the exact failure the fold rule exists to prevent.
	   Measured rather than derived: the card's height is a clamp on
	   --bar-scale, and ~145px is its ceiling at the 576px card cap. */
	.hero-section.has-results {
		--hero-chrome: calc(var(--hero-top) + 561px);
	}

	/* Its greenery is full-bleed, so content only has to clear the dense part
	   of the bottom band (the front silhouette layer is the bottom 453/2049 =
	   0.221 of the band's own canvas; sparse stems above that may pass behind
	   the headline, as they do in the mock). */
	.headline-section {
		min-height: min(50vh, 560px);
		padding-top: clamp(48px, 12vh, 130px);
		padding-bottom: max(calc(var(--art) * 0.25), 150px);
		background: #0b1109;
	}

	/* ---- AVIF-first backgrounds ----
	   Every background layer below is declared TWICE: a plain `url(...webp)`
	   line, then an `image-set()` line offering AVIF with the same WebP as its
	   second entry. Browsers that don't understand `image-set()` (Safari < 16.4)
	   drop the second declaration wholesale and keep the WebP; everything newer
	   takes the AVIF. Re-encoding the WebPs in place was the alternative, but
	   AVIF is both ~50% smaller AND perceptually closer to today's asset than a
	   lower-quality WebP would be, so the WebPs stay untouched as pristine
	   fallbacks rather than being degraded for the minority that still need them.
	   Sizes/quality were picked per file by sweeping quality against dssim at the
	   width each layer is actually painted at -- see perf/BASELINE.md #4b. */

	/* ---- Greenery: the illustrated hill pattern ----
	   The hills are ARTWORK, not a shape carved out of a photograph.
	   `hill_pattern.webp` is an illustrated stack of layered rolling hills in
	   dark purple/green with the scalloped crest (and its golden glow) built
	   into the image, so the silhouette, the colours and the texture all
	   arrive together. */
	.greenery {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		background-repeat: no-repeat;
		z-index: 0;
	}

	/* `100% auto` draws the art at page width, so the crest keeps its exact
	   drawn proportion (the file is 2049 wide, cropped from the crest top);
	   whatever runs past the box bottom is clipped, which on a mid-pattern
	   texture is invisible — the wildflower band and the divider sit on that
	   edge anyway. The file is 1600 rows deep (0.781 x width when drawn),
	   which always exceeds the box: --greenery-h is at most 0.44 x --art. */
	.hero-greenery {
		top: auto;
		height: var(--greenery-h);
		background-image: url("/hill_pattern.webp");
		background-image: image-set(
			url("/hill_pattern.avif") type("image/avif"),
			url("/hill_pattern.webp") type("image/webp")
		);
		background-size: 100% auto;
		background-position: top center;
	}

	/* Same pattern, cropped from BELOW the crest's deepest trough (so no
	   golden glow edge shows under the middle divider) down to the art's full
	   depth (2049x2409). `cover` (not `100% auto`) because this box can be
	   taller than the art is deep on narrow phones — cover trades a
	   horizontal crop for guaranteed fill. The full depth matters: cover
	   scales to the box's tall side, so the deeper the file, the less the
	   scallops get enlarged on a phone-shaped box. */
	.headline-greenery {
		top: 0;
		background-image: url("/pub-Rtvr/home/hill_fill.webp");
		background-image: image-set(
			url("/pub-Rtvr/home/hill_fill.avif") type("image/avif"),
			url("/pub-Rtvr/home/hill_fill.webp") type("image/webp")
		);
		background-size: cover;
		background-position: top center;
	}

	/* ---- Wildflower bands: one at the foot of each section ----
	   Each band is TWO aligned layers cropped from the same canvas box: a
	   colored layer and a black silhouette layer, plus a scattered tuft layer
	   in front (see the depth table below the pseudo rule). Height is the
	   band's own canvas ratio of
	   --art, so below the cap (100vw) the art renders undistorted, exactly as
	   drawn on the mobile canvas.

	   No bottom mask any more: unlike the old footer-wildflower asset, whose
	   last rows were near-solid olive and seamed against the dark page, these
	   layers end in ~60%-coverage dark blade bases that dissolve into the
	   divider navy / page black on their own. */
	.wildflower-band {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: var(--upper-band);
		pointer-events: none;
		z-index: 3;
	}

	/* Explicit depth inside the band, back to front:
	     0  ::before  black silhouette wash
	     1  ::after   green wash
	     2  the dog   (GrassMascot, set on .mascot-track)
	     3  the tufts (GrassTufts, set on .tuft-layer)
	   These MUST be numbered rather than left to paint order: a pseudo's
	   ::after always paints above ordinary children, so without a z-index
	   the green wash would cover both the dog and the tufts and the whole
	   sandwich would collapse back to "dog behind grass". */
	.wildflower-band::before,
	.wildflower-band::after {
		content: "";
		position: absolute;
		inset: 0;
		background-size: 100% 100%;
		background-position: center bottom;
		background-repeat: no-repeat;
	}

	.wildflower-band::before {
		z-index: 0;
	}

	.wildflower-band::after {
		z-index: 1;
	}

	.wildflower-band :global(.mascot-track) {
		z-index: 2;
	}

	.wildflower-band :global(.tuft-layer) {
		z-index: 3;
	}

	/* LAYER ORDER, 2026-08-04: black BEHIND green.
	   The black silhouette layer used to paint in ::after — i.e. in FRONT of
	   everything — and full-bleed at that, so instead of reading as a few near
	   tufts the dog runs through, it read as a solid black wall across the
	   foreground. Swapping the two puts the dark blades behind the lit green
	   ones where they work as depth, and the dog (a child element, so it
	   stacks between the pseudos) now runs in front of the shadow layer but
	   behind the green grass — which is the "in front of most grass, behind
	   some of it" effect the two-file design was reaching for. */
	.wildflower-band::before {
		background-image: url("/pub-Rtvr/home/uppergrass_front.webp");
		background-image: image-set(
			url("/pub-Rtvr/home/uppergrass_front.avif") type("image/avif"),
			url("/pub-Rtvr/home/uppergrass_front.webp") type("image/webp")
		);
	}

	.wildflower-band::after {
		background-image: url("/pub-Rtvr/home/uppergrass_back.webp");
		background-image: image-set(
			url("/pub-Rtvr/home/uppergrass_back.avif") type("image/avif"),
			url("/pub-Rtvr/home/uppergrass_back.webp") type("image/webp")
		);
	}

	/* The bottom band is its own, taller artwork (0.584 x width vs 0.381),
	   denser and reaching higher — NOT the hero band repeated. */
	.wildflower-band--lower {
		height: var(--lower-band);
	}

	/* Same black-behind-green swap as the hero band above. */
	.wildflower-band--lower::before {
		background-image: url("/pub-Rtvr/home/lowergrass_front.webp");
		background-image: image-set(
			url("/pub-Rtvr/home/lowergrass_front.avif") type("image/avif"),
			url("/pub-Rtvr/home/lowergrass_front.webp") type("image/webp")
		);
	}

	.wildflower-band--lower::after {
		background-image: url("/pub-Rtvr/home/lowergrass_back.webp");
		background-image: image-set(
			url("/pub-Rtvr/home/lowergrass_back.avif") type("image/avif"),
			url("/pub-Rtvr/home/lowergrass_back.webp") type("image/webp")
		);
	}

	/* ---- Decorative forest-photo shards ringed around the search card ----
	   Position and width are inline, scaled from the percentages authored in
	   shardLayout.ts — that file is the whole arrangement, and nothing here
	   adjusts what it says. They can't be pure CSS because the widths clamp
	   between px floors/ceilings and drive depth, parallax and z-index, which
	   need the resolved number. The transform carries ONLY parallax and
	   rotation, so left/top always equal the config. */
	/* z-index 2 — BELOW the grass band (3), so the dog runs in FRONT of the
	   shards. They are scenery lying on the page behind the action; the
	   mascot is the action. Previously 4, which put every shard over the top
	   of him and made him look tucked in behind the set dressing. */
	.bg-poly {
		position: absolute;
		pointer-events: none;
		/* The artwork's torn border draws `stroke="currentColor"`, so every
		   shard on the page takes its gold from this one line. The twelve SVGs
		   used to each carry a hardcoded #f7d000 — twelve files to edit for one
		   colour decision, which is exactly how the site ended up with three
		   different golds. See app.css. */
		color: var(--color-gold-shard);
		/* Near shards stack ABOVE far ones, so the paint order agrees with the
		   shadow and the parallax rate — otherwise a far shard can paint over a
		   near one and flatly contradict the depth its own shade claims.

		   `--layer` is an INTEGER 0..2 computed in the template, not
		   `calc(2 + var(--depth))`. z-index only accepts integers, so a
		   fractional calc gets ROUNDED: measured in Chrome, depth 0.65 and 0.05
		   collapsed to z-index 3 and 2 — a hard cut at 0.5 rather than an
		   ordering. Three explicit bands are honest about being discrete.

		   `--layer` is 0 (near) .. -2 (far), SUBTRACTED from the base rather than
		   added, because 2 is a ceiling here, not a midpoint: the grass band is
		   z-index 3 and the dog must keep running in FRONT of every shard. So
		   the nearest band stays at 2 and the far ones sink to 1 and 0. */
		z-index: calc(2 + var(--layer, 0));
		will-change: transform;
	}

	/* Real shade, so a shard reads as a piece lying ON the page rather than a
	   flat cutout of it. `drop-shadow` (not `box-shadow`) is what this needs:
	   box-shadow would trace the element's rectangle, while drop-shadow follows
	   the actual jagged alpha of the artwork, so the shade has the same torn
	   silhouette as the shard casting it.

	   THREE stacked shadows, all offset down-right from a single implied light
	   source up and to the left (the direction the navy inner border in the
	   artwork is already lit from): a close one for the lift, a mid one, and a
	   wide soft cast for the ambient occlusion further out.

	   DENSITY RISES OUTWARD, WHICH IS BACKWARDS FROM THE OBVIOUS. The first
	   shadow used to be `1px 2px 1px / 0.75` — a near-opaque near-black at
	   almost no blur. A shadow with no blur is not a shadow, it is a LINE, and
	   because all three stack their alphas the first 1-3px outside the yellow
	   border summed to ~95% black. It read as a second, badly-drawn border
	   rather than as shade — a mistake, not a lift.

	   So the close shadow is now the FAINTEST and the widest is the strongest.
	   That is also what a real edge does: right where a print meets the paper
	   almost no light is blocked, and the shade only gains density as the gap
	   under the lifted edge opens up. Blur is never below ~6px for the same
	   reason — the eye reads a crisp dark offset as ink, and a soft one as air.

	   Keep the three alphas ASCENDING (0.22 -> 0.34 -> 0.46) if these are ever
	   retuned. Deepening the near shadow is the specific change that brings the
	   black outline back. */
	/* The shadow SCALES WITH DEPTH (`--depth`, 0 far .. 1 near, written inline
	   from depthOf()). A near shard throws a longer, softer, wider-cast shade
	   than one lying further back — that difference is what separates two
	   stacked shards into distinct layers instead of one flat collage, and it
	   is the same number driving the parallax, so a shard that MOVES like it is
	   in front also SHADES like it is in front.

	   `--lift` never reaches 0: even the furthest shard is a torn print resting
	   ON the page, not printed into it, so it keeps a contact shadow. The range
	   runs 0.55 (far) .. 1.3 (near) around the hand-tuned values below. */
	.bg-poly :global(svg) {
		--lift: calc(0.55 + (var(--depth, 0.5) * 0.75));
		width: 100%;
		height: auto;
		display: block;
		filter:
			drop-shadow(
				calc(2px * var(--lift)) calc(3px * var(--lift))
				calc(7px * var(--lift)) rgb(12 8 1 / 0.22)
			)
			drop-shadow(
				calc(7px * var(--lift)) calc(10px * var(--lift))
				calc(16px * var(--lift)) rgb(12 8 1 / 0.34)
			)
			drop-shadow(
				calc(18px * var(--lift)) calc(24px * var(--lift))
				calc(40px * var(--lift)) rgb(12 8 1 / 0.46)
			);
	}












	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* ---- Search card ----
	   Capped at the search bar's drawn proportion (Search_page_Search_Bar.svg is
	   284.7 x 49.2, so the bar is always 0.173 x its own width).

	   THE CAP IS ONE TOKEN, USED TWICE. It sets the card's max-width AND feeds
	   --bar-scale, which is how the caption and globe match the input's
	   on-screen size. Typed as two literals they could be changed apart, and the
	   page would look fine while every "matched to the input" size quietly
	   referred to a width the card no longer has.

	   576px = the original 480 plus 20%: on desktop the bar was reading small
	   against the artwork ringing it. Phones are unaffected — below ~608px
	   viewport the `min()` picks 100vw - 32px and the cap never applies, which
	   is why this needed no breakpoint. */
	.search-card {
		--card-max: 576px;
		position: relative;
		width: 100%;
		max-width: var(--card-max);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(8px, 1.4vw, 16px);
		z-index: 5;
		--bar-scale: calc(min(100vw - 32px, var(--card-max)) / 284.70643);
	}

	/* ---- Tabs: attached to the bar, not floating above it ----
	   In the layout template the tabs are FILE-FOLDER tabs — they emerge from
	   behind the search bar's top edge, and their bottom border is hidden
	   because the bar overlaps it. That overlap is the whole effect: with a gap
	   they read as two separate stickers that happen to sit near each other;
	   tucked under, they read as one control with the tabs belonging to it.

	   Built as a NEGATIVE MARGIN plus a stacking order, not as absolute
	   positioning — the row must keep its height in flow so the card's own
	   height (which the fold rule above depends on) stays truthful.

	   --tab-tuck is how far the bar covers them. It scales with --bar-scale so
	   the overlap is the same fraction of the artwork at every width; a fixed px
	   value would swallow the whole tab on a phone and barely graze it on
	   desktop. */
	.tabs {
		/* How deep the bar sits over the tabs: a FLAT 10px, not a scaled value.
		   What the tuck has to hide is the tab's bottom border plus its shadow —
		   both a constant few px at every viewport — so the overlap is a
		   constant too. Scaling it (this was `16 * var(--bar-scale)`) multiplied
		   10px by the card's ~2x scale factor at the 576px cap and ate a third
		   of the shorter tab: "Organizations" was sliced through its own text
		   while "Projects", being taller, still showed. A tuck deep enough to
		   crop the label is not a tuck. */
		--tab-tuck: 10px;
		/* The two tab sizes, in REAL px via clamp — deliberately NOT
		   `n * var(--bar-scale)`. --bar-scale is ~2.02 at the 576px card cap, so
		   viewBox-unit sizing doubles whatever number you write: 26 and 37 units
		   rendered as 53px and 75px against the old 48px shared height, and the
		   tabs towered over the bar they are supposed to hang off.
		   --bar-scale is the right tool for things that must MATCH the input's
		   drawn size (the caption, the globe); the tabs are chrome sitting
		   beside the bar, so they size like the rest of the page's chrome.
		   The active tab stays ~40% taller — that contrast is the point. */
		--tab-h-idle: clamp(34px, 4.4vw, 46px);
		--tab-h-active: clamp(48px, 6.4vw, 66px);
		display: flex;
		/* Bottoms aligned, so both tabs disappear into the SAME line no matter
		   how much taller the active one is — the size difference has to grow
		   upward, out of the bar, or the shorter tab would float clear of it. */
		align-items: flex-end;
		gap: 16px;
		/* Pull the row down so the bar's top edge crosses the tabs' feet. The
		   gap the card would otherwise add between them is cancelled here too,
		   so the tuck depth is exactly --tab-tuck and not "tuck minus gap". */
		/* THE TUCK. One displacement, nothing cancelling it.
		   Pull the row down by the overlap depth PLUS the card's flex gap (which
		   would otherwise hold the tabs off the bar), so the bar's top edge
		   genuinely crosses the tab artwork.

		   There is NO padding-bottom here, and adding one would be a bug: an
		   earlier cut of this rule paired the negative margin with an equal
		   `padding-bottom: var(--tab-tuck)` to keep the tucked strip from eating
		   clicks meant for the bar. Padding adds back exactly the height the
		   margin removes, so the two summed to zero and the tabs sat clear of
		   the bar with their bottom borders fully visible — the tuck looked
		   implemented and moved nothing. If clicks ever need protecting, do it
		   with pointer-events on the covered strip, never by re-adding height. */
		margin-bottom: calc(0px - var(--tab-tuck) - clamp(8px, 1.4vw, 16px));
		/* BELOW the bar (.search-bar-wrap is position:relative, so it wins the
		   paint order as a positioned sibling). This is what actually hides the
		   tabs' bottom border instead of merely crowding it. */
		position: relative;
		z-index: 0;
	}

	/* ---- "Search by list" dropdown ---- */
	.search-bar-wrap {
		position: relative;
		width: 100%;
		/* Above .tabs (z-index 0), so the bar's own artwork covers the tucked
		   bottom edge of the tab stickers. Stated rather than left to source
		   order: both are positioned, and a later `position: relative` sibling
		   winning by default is the kind of accident that breaks on reorder. */
		z-index: 1;
	}

	/* Overlays the caption rather than pushing it down — opening the list must
	   not reflow the card and re-measure the shard sections. */
	.search-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		max-height: min(40vh, 320px);
		overflow-y: auto;
		margin: 0;
		padding: 6px;
		list-style: none;
		background: #000;
		border: 3px solid var(--color-gold-bar);
		border-radius: 2px;
		z-index: 6;
	}

	.dropdown-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		padding: 8px 10px;
		background: none;
		border: none;
		border-radius: 2px;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
	}

	.dropdown-row:hover,
	.dropdown-row:focus-visible {
		background: rgb(250 215 2 / 0.14);
	}

	.row-name {
		color: #fff;
		font-size: 14px;
		line-height: 1.3;
	}

	.row-hint {
		color: #8d93a6;
		font-size: 12px;
		flex-shrink: 0;
	}

	.dropdown-empty {
		padding: 10px;
		color: #8d93a6;
		font-size: 13px;
	}

	/* Truncation note when the catalogue overflows MAX_DROPDOWN_ROWS. Muted and
	   non-interactive — it guides toward typing, it is not a selectable row. */
	.dropdown-more {
		padding: 8px 10px;
		color: #8d93a6;
		font-size: 12px;
		font-style: italic;
		border-top: 1px solid rgba(141, 147, 166, 0.2);
	}

	/* Sits just under the bar, out of flow — see the markup comment. Dark
	   text on the golden sky rather than the panel palette: it's a note on the
	   page, not part of the control stack. */
	.search-notice {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		margin: 0;
		color: #1d1405;
		font-size: calc(13 * var(--bar-scale, 1));
		line-height: 1.3;
		text-align: center;
		text-shadow: 0 1px 1px rgb(255 255 255 / 0.35);
		pointer-events: none;
	}

	@media (max-width: 550px) {
		.search-notice {
			font-size: 13px;
		}
	}

	/* ---- Tabs: the SELECTED one is dramatically bigger ----
	   Both tabs used to share one fixed height, so the only thing separating
	   selected from unselected was the artwork's grey-vs-black fill. In the
	   layout template the difference is SIZE first: the active tab stands a good
	   third taller than the dormant one and reads as the front card of the pair,
	   with colour merely confirming it. A single height threw that away — and it
	   also flattened the two SVGs' own drawn aspects (Projects is 85x49,
	   Organizations 72x27), so the artwork was already carrying a distinction
	   the CSS was busy erasing.

	   Height is set per state on the LINK, width follows from the SVG's aspect,
	   so nothing here has to know either file's proportions. */
	/* No transform/transform-origin here: the tabs never move. Only their height
	   animates, on the selected/unselected swap. See the hover rule below for
	   why motion is off the table for these two specifically. */
	.tab-sticker {
		display: block;
		height: var(--tab-h-idle);
		transition: height 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	/* The active tab. Sized off --bar-scale like everything else in this card,
	   so it holds its proportion against the bar at every width rather than
	   being right at one breakpoint. */
	.tab-sticker[aria-current="page"] {
		height: var(--tab-h-active);
	}

	/* ---- Tab hover: BRIGHTEN, never rotate and never grow ----
	   The tabs are the one hover on this page that must NOT go crooked, and the
	   reason is geometric, not stylistic: their bottom edge is tucked behind the
	   bar, and any rotation swings that edge out from under it — the corners lift
	   clear and the hidden border reappears mid-hover. The tuck and a tilt cannot
	   both be true. Same for scale: growing a dormant tab claims the size
	   language that now means "selected".

	   So the signal is light, not motion — the sticker brightens and its shade
	   deepens, which reads clearly without moving a single edge. BOTH tabs
	   respond, the current one included: hovering the active tab and getting
	   nothing back reads as a dead control. */
	.tab-sticker:hover :global(svg),
	.tab-sticker:focus-visible :global(svg) {
		filter:
			drop-shadow(1px 2px 6px rgb(12 8 1 / 0.34))
			drop-shadow(4px 8px 14px rgb(12 8 1 / 0.48))
			drop-shadow(12px 18px 28px rgb(12 8 1 / 0.56))
			brightness(1.18);
	}

	/* Same three-shadow recipe as the photo shards, so every sticker on this
	   page is lit from the same implied source (up and to the left) and reads
	   as lying ON the golden sky rather than printed into it. drop-shadow, not
	   box-shadow: these are torn-edge SVGs, and the shade has to follow the
	   real alpha rather than tracing a rectangle.

	   ALPHAS ASCEND OUTWARD (0.3 -> 0.42 -> 0.5), and the near shadow carries
	   real blur — the same rule the shards' shadow block explains at length. It
	   matters doubly here: the tabs' bottom edge is TUCKED under the bar, and a
	   near-opaque zero-blur shadow (this was `1px 2px 1px / 0.7`) draws a crisp
	   dark rule along exactly the seam the tuck exists to hide. A shadow with no
	   blur is a line, and a line at the join undoes the join. */
	.tab-sticker :global(svg) {
		height: 100%;
		width: auto;
		display: block;
		filter:
			drop-shadow(1px 2px 6px rgb(12 8 1 / 0.3))
			drop-shadow(4px 6px 12px rgb(12 8 1 / 0.42))
			drop-shadow(10px 14px 22px rgb(12 8 1 / 0.5));
		transition: filter 0.2s ease;
	}

	/* The search bar gets the same treatment, scaled up a touch: it's the
	   biggest sticker on the page, so it sits highest off the surface. */
	.search-bar-wrap :global(.search-bar-svg) {
		filter:
			drop-shadow(1px 2px 2px rgb(12 8 1 / 0.7))
			drop-shadow(4px 7px 8px rgb(12 8 1 / 0.55))
			drop-shadow(14px 20px 28px rgb(12 8 1 / 0.42));
	}

	/* ---- Caption + globe ---- */
	.caption-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: clamp(10px, 2.5vw, 28px);
		width: 100%;
	}

	/* Matched to the SEARCH INPUT's on-screen size, not to a px literal.
	   The input's `font-size: 15px` is in SVG USER UNITS inside a
	   foreignObject, and the bar's SVG (viewBox 284.7 wide) is scaled up to
	   the card's width — about 1.69x at the 480px cap. So the input renders
	   at ~25px on screen while this caption, set to a literal 15px, rendered
	   at 15px and looked tiny beside it.
	   --bar-scale reproduces that same scale factor, so the caption tracks
	   the input at every width instead of only at the one it was eyeballed
	   at. 15 user units x the scale = the same screen size as the input. */
	/* "Search transparency rating" is one short line, not the old three-line
	   paragraph, so the caption no longer needs to claim the row's full width —
	   `flex: 0 1 auto` lets it shrink to its text and sit right beside the
	   globe as a pair, instead of a stretched column with the globe pushed out
	   to the far edge. */
	.search-caption {
		flex: 0 1 auto;
		max-width: 420px;
		text-align: center;
		color: #1d1405;
		/* 18 user units, up from 15 (+20%). The caption is now three words
		   rather than a paragraph, so it can carry the weight of a statement —
		   at 15 it read as a footnote under the bar. Still expressed in viewBox
		   units x --bar-scale, so it keeps tracking the input's on-screen size
		   at every width instead of being eyeballed at one. */
		font-size: calc(18 * var(--bar-scale));
		line-height: 1.35;
		margin: 0;
		/* Lift it off the painted sky, same implied light source as the
		   stickers. Text shadow, not a filter — cheaper, and it keeps the
		   glyph edges crisp. */
		text-shadow:
			0 1px 1px rgb(255 255 255 / 0.35),
			1px 2px 3px rgb(12 8 1 / 0.4);
	}

	.caption-row :global(.globe-icon) {
		/* Scaled with the caption so the pair reads as one unit — it used to
		   be a fixed 62px cap beside 15px text, and now sits beside ~25px
		   text, so it grows to match.
		   58 → 92 when the caption shrank to one line, then 92 → 74 (-20%) on
		   seeing it rendered: at 92 the globe was competing with the text for
		   the row instead of accompanying it. The caption is the message here;
		   the globe is the invitation next to it. */
		width: calc(74 * var(--bar-scale));
		flex-shrink: 0;
		/* Same three-shadow recipe as the stickers, so the globe pops off the
		   sky instead of sitting flat on it. */
		filter:
			drop-shadow(1px 2px 1px rgb(12 8 1 / 0.7))
			drop-shadow(3px 5px 6px rgb(12 8 1 / 0.5))
			drop-shadow(9px 12px 18px rgb(12 8 1 / 0.38));
	}

	/* ---- Middle divider: pine-seedling photo strip ----
	   Runs wider than the viewport so both jagged ends are cut off by the page
	   edge instead of floating inside it, as in the desktop view. The
	   page's overflow-x: hidden does the clipping. */
	.middle-divider {
		position: relative;
		align-self: center;
		width: 116vw;
		flex-shrink: 0;
		/* matches Search_page_Middle_Divider.svg's own viewBox (1254 / 94.48) so
		   the clipped photo strip fills edge-to-edge without letterboxing */
		aspect-ratio: 1254.0259 / 94.484817;
		overflow: visible;
		z-index: 3;
		/* The strip is slanted inside a square block, so the corners it doesn't
		   cover are wedges. Left transparent they show the page's #0b1109 and
		   read as holes punched between the sections; filled with the strip's
		   OWN backing colour (Search_page_Middle_Divider.svg paints #171d31
		   behind the photo, under a #f7d000 border) the seam reads as one
		   continuous navy band. */
		background: #171d31;
	}

	/* Same currentColor arrangement as the shards — the divider is one of them
	   (shard 26), and its gold outline inherits from here. */
	.middle-divider-photo {
		position: absolute;
		inset: 0;
		color: var(--color-gold-shard);
	}

	.middle-divider-photo :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}

	/* ---- Headline ---- */
	.headline {
		position: relative;
		display: flex;
		align-items: center;
		gap: clamp(8px, 2vw, 24px);
		flex-wrap: wrap;
		justify-content: center;
		z-index: 5;
	}

	.headline-find :global(svg),
	.headline-truth :global(svg) {
		height: clamp(64px, 9vw, 130px);
		width: auto;
		display: block;
	}

	@media (max-width: 640px) {
		.headline {
			flex-direction: column;
			gap: 4px;
		}

		.caption-row {
			gap: 10px;
		}
	}

	/* ---- Mobile: 550px, the Get Cache breakpoint ----
	   Matching the value already used across /getcache (and its `min-width:
	   551px` mirror) rather than inventing a third number for this page.
	   The caption is normally locked to the search input's on-screen size via
	   --bar-scale, which is right on desktop but overbearing on a phone: at
	   that point the bar spans the whole screen, so "matching the input"
	   means a headline-sized paragraph. Below the breakpoint it drops to a
	   readable body size and the globe stops tracking it. */
	@media (max-width: 550px) {
		.search-caption {
			/* +20%, matching the desktop bump above. */
			font-size: 18px;
		}

		.caption-row :global(.globe-icon) {
			/* Tracks the desktop globe's correction: 44 → 70 → 56 (-20%), so
			   the caption-to-globe balance is the same on a phone as on a
			   laptop rather than being retuned independently. */
			width: 56px;
		}
	}
</style>
