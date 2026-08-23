<script lang="ts">
/**
 * THE HARNESS MENU — the thing a child sits on.
 *
 * This repo is not a site. It does not deploy, has no privacy page, no
 * marketing, no auth. It is a bare SvelteKit project whose only job is to hold
 * ONE child so it can be run and debugged. So the UI is one bar:
 *
 *     [logo]        ReTreever — offlineMap debugger        [ style ▢ ]
 *      ^ owner       ^ owner in bold, then the child's links      ^ feature flag
 *
 * WHY THE HARNESS OWNS THE BRANDING. A child never knows whose it is. A child
 * that imported a logo would carry its owner's identity into a repo meant to be
 * handed to a contractor. The registry below is the only place that mapping
 * lives, so a ReTreever child flies the dog and a Get Cache child flies the GC.
 *
 * WHY THE WHOLE BAR IS DEV-ONLY. `import.meta.env.DEV` is a compile-time
 * constant, so `{#if dev}` is not hidden in a production build — it is never
 * emitted. The harness is a workbench; nothing here can reach a shipped app.
 */
import { page } from "$app/state";
import { onMount } from "svelte";

const dev = import.meta.env.DEV;

/**
 * THE CHILD REGISTRY — the harness's whole job, in one table.
 *
 * `links` is a list because one child is not one page: the offline map ships a
 * map AND a debugger. Adding a child is one row here plus its mount page.
 */
type Link = { href: string; label: string };
type Child = { name: string; owner: string; logo: string; links: Link[] };

const GET_CACHE = "/mobileAssets/getCacheLogo.webp";
// ReTreever's dog is NOT in this repo. The only copy is static/arc/logos/
// retreever-logo.png — gitignored (.gitignore:119) and 1.8 MB, so it reaches
// no clone and is the wrong asset for an 18px bar. Add a small mark to
// static/pub-OSEM/ before the first ReTreever child lands, then point here.
const RETREEVER = "";

const CHILDREN: Child[] = [
	{
		name: "offlineMap",
		owner: "Get Cache",
		logo: GET_CACHE,
		// Both point at the same route today: the debugger is not its own page,
		// it is the BLOB and CONFIG panels rendered inside the demo. Split the
		// panels into their own route and this becomes two real destinations.
		links: [
			{ href: "/debug/map", label: "map" },
			{ href: "/debug/map", label: "debugger" },
		],
	},
	{
		name: "onlineMap",
		owner: "Get Cache",
		logo: GET_CACHE,
		links: [{ href: "/who/map", label: "map" }],
	},
];

const child = $derived(
	CHILDREN.find((c) => c.links.some((l) => l.href === page.url.pathname)),
);

/**
 * THE PARENT-STYLE FLAG — a preview switch for whoever HAS the parent.
 *
 * The logo, the menu and the child itself are everyone's. What is not everyone's
 * is the parent: ReTreever lends nice styles and features that a standalone
 * child simply does not get. This switch does not grant that — it REMOVES it,
 * so the person who has the parent can see what the child looks like without
 * it. Turning it off is the whole point.
 *
 * `--rt-bg` is defined only by ReTreever's app.css and by nothing in this repo,
 * so `parentHere` is a measurement of "is a parent lending style right now",
 * not a guess. Measured on mount because it depends on what CSS actually
 * resolved in the browser.
 *
 * With no parent there is nothing to strip: the switch reads OFF and disabled,
 * which tells a contractor plainly that a richer style exists and this checkout
 * does not have it. That is honest, not a lockout — nothing is being withheld
 * by the switch, the style was never in their tree to begin with.
 */
let parentHere = $state(false);
onMount(() => {
	const v = getComputedStyle(document.documentElement)
		.getPropertyValue("--rt-bg")
		.trim();
	parentHere = v !== "";
});

/** Default ON: if you have the parent, you see the good version first. */
let want = $state(true);
const styleOn = $derived(parentHere && want);

let { children } = $props();
</script>

<svelte:head>
	{#if dev}
		<!-- How much room the harness's bar takes off the top. Children that
		     own the viewport start below it. Declared only while the bar exists,
		     so a production build reserves nothing. -->
		<style>
			:root {
				--host-chrome: 30px;
			}
		</style>
	{/if}
	{#if dev && !styleOn}
		<!-- NAKED: drop the parent's tokens back to initial. This is what the
		     child looks like in a repo with no ReTreever above it. -->
		<style>
			:root {
				--rt-bg: initial;
				--rt-fg: initial;
				--rt-fg-muted: initial;
				--rt-font-display: initial;
				--rt-font-web: initial;
			}
		</style>
	{/if}
</svelte:head>

{#if dev}
	<header>
		<span class="left">
			{#if child?.logo}
				<img src={child.logo} alt={child.owner} class="logo" />
			{/if}
		</span>

		<span class="title">
			{#if child}
				<strong>{child.owner}</strong> — {child.name}
				{#each child.links as l, i (l.label)}
					{#if i > 0}<span class="sep">·</span>{/if}
					<a href={l.href} class:on={page.url.pathname === l.href}>{l.label}</a>
				{/each}
			{:else}
				<strong>harness</strong>
			{/if}
		</span>

		<span class="right">
			<a
				class="gh"
				href="https://github.com/Ground-Truth-Data/harness"
				target="_blank"
				rel="noreferrer">GitHub</a
			>
			<label
				class:disabled={!parentHere}
				title={parentHere
					? "Off = see this child WITHOUT the parent app's style, the way a standalone checkout looks"
					: "No parent app in this checkout, so there is no parent style to strip"}
			>
				<input type="checkbox" bind:checked={want} disabled={!parentHere} />
				parent style
			</label>
		</span>
	</header>
{/if}

<main>
	{@render children()}
</main>

<style>
	/* A child is entitled to own the whole viewport — the offline demo's stage is
	   `position: fixed`, which ignores any header in normal flow and covered
	   this bar completely. So the bar is fixed too, and the host declares how
	   much room it took via --host-chrome. A child that honours that variable
	   starts below it; one that doesn't is simply unchanged. */
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
		gap: 0.75rem;
		padding: 0.4rem 0.75rem;
		font: 500 12px/1 "JetBrains Mono", ui-monospace, monospace;
		background: #16161a;
		color: #c9c9d1;
		border-bottom: 1px solid #2a2a32;
	}
	.left,
	.right {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex: 1;
	}
	.right {
		justify-content: flex-end;
	}
	.title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		white-space: nowrap;
	}
	.title strong {
		color: #fff;
		font-weight: 700;
	}
	.logo {
		height: 18px;
		width: auto;
		display: block;
	}
	.sep {
		opacity: 0.3;
	}
	a {
		color: #8fd7a7;
		text-decoration: none;
		padding: 0.15rem 0.35rem;
		border-radius: 3px;
	}
	a:hover {
		background: #24242c;
	}
	a.on {
		background: #2f2f3a;
		color: #fff;
	}
	.gh {
		color: #9aa0b4;
	}
	label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		cursor: pointer;
		user-select: none;
	}
	/* Greyed, not hidden: a contractor should SEE that a style exists and that
	   they do not have it, rather than wonder why the page looks plain. */
	label.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	main {
		/* The viewport minus the bar, so a normal-flow child does not overflow
		   by exactly the height the bar took. */
		/* No padding-top: a child that owns the viewport already starts below the
		   bar via --host-chrome in its own inset, and padding here would offset
		   it twice. This only stops a normal-flow child overflowing. */
		min-height: calc(100dvh - var(--host-chrome, 0px));
	}
</style>
