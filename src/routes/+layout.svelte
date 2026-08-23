<script lang="ts">
/**
 * THE HARNESS MENU — the thing a child sits on.
 *
 * This repo is not a site. It does not deploy, has no privacy page, no auth.
 * It is a bare SvelteKit project whose only job is to hold ONE child so it can
 * be run and debugged. The bar:
 *
 *   [GC logo]   GET CACHE   [map] [debugger]      [gh] harness  [gh] child   [feature flag]
 *
 * WHY THE HARNESS OWNS THE BRANDING. A child never knows whose it is. A child
 * that imported a logo would carry its owner's identity into a repo meant to be
 * handed to a contractor. The registry below is the only place that mapping
 * lives, so a ReTreever child flies the dog and a Get Cache child flies the GC.
 *
 * WHY THE WHOLE BAR IS DEV-ONLY. `import.meta.env.DEV` is a compile-time
 * constant, so `{#if dev}` is never emitted into a production build.
 */
import { page } from "$app/state";

const dev = import.meta.env.DEV;

const GC_LOGO = "/mobileAssets/GC_fly_logo_transparent.webp";
const RT_LOGO = "/mobileAssets/retreever-logo_squooshed.webp";
const GH_ICON = "/mobileAssets/github-logo.png";

const GH = "https://github.com/Ground-Truth-Data";

/**
 * THE CHILD REGISTRY — the harness's whole job, in one table.
 *
 * `views` is a LIST because one child is not one page: the offline map has a
 * map and a debugger. Adding a child is one row here plus its mount page.
 */
type View = { href: string; label: string; missing?: boolean };
type Child = {
	name: string;
	owner: string;
	logo: string;
	repo: string;
	views: View[];
};

const CHILDREN: Child[] = [
	{
		name: "offlineMap",
		owner: "Get Cache",
		logo: GC_LOGO,
		repo: "getCache_offlineMap",
		// Same page, same engine, same fixtures — /offline just hides the debug
		// rails. Two routes, one implementation.
		views: [
			{ href: "/debug/map", label: "debugger" },
			{ href: "/offline", label: "offline map" },
		],
	},
	{
		name: "onlineMap",
		owner: "Get Cache",
		logo: GC_LOGO,
		repo: "getCache_OnlineMap",
		views: [{ href: "/who/map", label: "map" }],
	},
	// ReTreever children land here as they are carved — same shape, dog logo:
	// { name: "where", owner: "ReTreever", logo: RT_LOGO, repo: "ReTreever_where",
	//   views: [{ href: "/where", label: "where" }] },
];

const child = $derived(
	CHILDREN.find((c) => c.views.some((v) => v.href === page.url.pathname)),
);

/**
 * THE FEATURE FLAG — is the trailer hitched to the truck?
 *
 * A child is a trailer. Hitched to ReTreever it gets app.css, the utils, the
 * whole parent app: full dress. Unhitched it must still STAND — plainer, fewer
 * features, but RUNNING. What it must never do is collapse.
 *
 * So this switch does not GRANT anything. It REMOVES, so whoever has the
 * parent can see what a developer without it sees. Off is the honest view.
 *
 * WHAT IT CANNOT DO, AND WHY THAT IS FINE. This flips CSS variables at
 * RUNTIME. Coupling to ReTreever is import statements, resolved at BUILD — by
 * the time this checkbox exists, an import either compiled or it did not. So
 * this cannot air-gap anything, and must never be asked to: the real wall is
 * the ABSENCE of a `$lib` alias in svelte.config.js, which makes a child that
 * reaches for ReTreever fail to build. See harnessIsolation.test.ts.
 *
 * This flag is the DECOR half of the same idea, and only that half.
 *
 */
/**
 * THE SWITCH IS ALWAYS LIVE IN THE HARNESS. It used to be gated on
 * `parentHere` — measured by asking whether ReTreever's `--rt-bg` resolved.
 * In the harness it never does (no app.css here, by design), so the checkbox
 * was permanently greyed: a switch that could not move, in the one place you
 * most need to see it move. Backwards. The harness is the SURROGATE PARENT —
 * it is precisely where both states must be viewable.
 *
 * So the harness now SUPPLIES the decor itself when the flag is on, and
 * withholds it when off. That is what a surrogate does: it stands in.
 */
let want = $state(true);
const featureOn = $derived(want);

let { children } = $props();
</script>

<svelte:head>
	<!-- IDENTITY FOLLOWS THE CHILD. The harness is a surrogate parent: it has no
	     brand of its own, so the tab shows whichever product the mounted child
	     belongs to. This used to be OSEM's favicon in app.html, which put an
	     OSEM mark on a Get Cache page. -->
	<title>{child ? `${child.owner} — ${child.name}` : "harness"}</title>
	{#if child}
		<link rel="icon" href={child.logo} />
	{/if}
	{#if dev}
		<!-- How much room the bar takes off the top. A child that owns the
		     viewport starts below it; one that doesn't is unaffected. Declared
		     only while the bar exists, so production reserves nothing. -->
		<style>
			:root {
				/* Matches the real ReTreever / Get Cache navbar: 64px bar plus
				   the 3px gold rule under it. */
				--host-chrome: 67px;
			}
		</style>
	{/if}
	{#if dev && featureOn}
		<!-- FEATURE FLAG ON — HITCHED. The harness stands in for the parent and
		     lends the child its full-dress version: the child reads --host-decor
		     and puts back its backdrop and hand, and the artwork then provides
		     the phone's edge, so the plain gold bezel steps aside.

		     OFF sets NOTHING AT ALL. That is the point: unhitched is not a
		     stripped-down variant we compute, it is simply the absence of a
		     parent. What you see with the box unticked is what a developer who
		     has never had ReTreever sees. The assets here are the HARNESS's own
		     (/mobileAssets is its static folder), never fetched from ReTreever —
		     a surrogate supplies its own, or it is not a surrogate. -->
		<style>
			:root {
				--host-decor: 1;
				--demo-backdrop: url("/mobileAssets/getcache_DT_bg.webp");
				--demo-bezel: none;
			}
		</style>
	{/if}
</svelte:head>

{#if dev}
	<header>
		<span class="left">
			{#if child}
				<img src={child.logo} alt={child.owner} class="logo" />
				<span class="title">{child.owner}</span>
			{:else}
				<span class="title dim">harness</span>
			{/if}
		</span>

		<nav class="views">
			{#if child}
				{#each child.views as v (v.label)}
					{#if v.missing}
						<span class="btn dead" title="No route for this in the harness yet">
							{v.label}
						</span>
					{:else}
						<a href={v.href} class="btn" class:on={page.url.pathname === v.href}>
							{v.label}
						</a>
					{/if}
				{/each}
			{/if}
		</nav>

		<span class="right">
			<a class="btn gh" href="{GH}/harness" target="_blank" rel="noreferrer">
				<img src={GH_ICON} alt="" /> harness
			</a>
			{#if child}
				<a
					class="btn gh"
					href="{GH}/{child.repo}"
					target="_blank"
					rel="noreferrer"
				>
					<img src={GH_ICON} alt="" /> {child.repo}
				</a>
			{/if}
			<label
				class="flag"
				title="On = hitched to a parent (full dress). Off = unhitched: what a developer WITHOUT ReTreever sees."
			>
				<input type="checkbox" bind:checked={want} />
				feature flag
			</label>
		</span>
	</header>
{/if}

<main>
	{@render children()}
</main>

<style>
	/* A child may own the whole viewport — the offline demo's stage is
	   position:fixed, which ignores a header in normal flow. So the bar is fixed
	   too and declares its height via --host-chrome. */
	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10000;
		height: var(--host-chrome);
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1.1rem;
		/* Same chrome as the real ReTreever / Get Cache navbar: near-black bar,
		   gold rule underneath. Values taken from ReTreever's app.css
		   (--rt-bg #0b0b0b, --color-gold-bar #f5a119) rather than eyeballed,
		   but hard-coded here — the bar must look identical when the parent's
		   tokens are stripped by the feature flag. */
		background: #0b0b0b;
		border-bottom: 3px solid #f5a119;
		font: 500 13px/1 "JetBrains Mono", ui-monospace, monospace;
		color: #c9c9d1;
	}
	.left,
	.right {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		flex: 1;
	}
	.right {
		justify-content: flex-end;
	}
	.logo {
		height: 48px;
		width: auto;
		display: block;
	}
	.title {
		font-size: 28px;
		font-weight: 700;
		letter-spacing: 0.01em;
		/* Gold display title, like GET CA¢HE / ReTreever on the real bars.
		   --color-gold-shard, hard-coded so the flag cannot strip it. */
		color: #f0b60a;
		white-space: nowrap;
	}
	.title.dim {
		color: #6b6b78;
		font-size: 20px;
	}
	.views {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.38rem 0.7rem;
		border: 1px solid #33333d;
		border-radius: 5px;
		background: #1a1a20;
		color: #d8d8e0;
		text-decoration: none;
		white-space: nowrap;
	}
	.btn:hover {
		background: #26262e;
		border-color: #45454f;
	}
	.btn.on {
		background: #f0b60a;
		border-color: #f0b60a;
		color: #17170f;
		font-weight: 700;
	}
	/* A view the harness cannot serve yet: shown so you know it exists, dead so
	   you never click through to a 404. */
	.btn.dead {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.btn.gh img {
		height: 15px;
		width: 15px;
		display: block;
		/* The mark is solid black; invert it to read on a dark bar. */
		filter: invert(1);
	}
	.flag {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		cursor: pointer;
		user-select: none;
		padding-left: 0.3rem;
		/* Two words in a fixed-height bar — same nowrap the buttons use, or
		   "feature flag" breaks across two lines and shoves the bar's contents
		   out of vertical centre. */
		white-space: nowrap;
	}
	main {
		min-height: calc(100dvh - var(--host-chrome, 0px));
	}
</style>
