<script lang="ts">
/**
 * THE HARNESS LAYOUT — the thing a child sits on.
 *
 * This repo is not a site. It does not deploy, it has no privacy page, no
 * marketing, no auth. It is a bare SvelteKit project whose only job is to hold
 * ONE child so it can be run and debugged. So this layout is deliberately
 * almost nothing: a header naming the child you are looking at, a switch for
 * the style, and the page itself.
 *
 * WHY THE HEADER IS DEV-ONLY. `import.meta.env.DEV` is a compile-time
 * constant, so `{#if dev}` is dead-code-eliminated from a production build —
 * the markup is not hidden, it is not emitted. The harness is a workbench;
 * nothing here should be able to reach a shipped app even by accident.
 *
 * WHY A STYLE SWITCH AT ALL. app.css lives in ReTreever and stays there — it
 * is the style moat. A child inherits tokens through the cascade when a host
 * provides them, and looks plain when nothing does. NAKED mode reproduces that
 * second case on demand, so you can see what a contractor sees without
 * checking anything out.
 */
import { page } from "$app/state";

const dev = import.meta.env.DEV;

/**
 * THE CHILD REGISTRY — the harness's whole job, in one table.
 *
 * A child brings its code; the harness says what to call it, which product it
 * belongs to, and which mark to fly. Swapping the logo is the harness's
 * responsibility precisely BECAUSE a child must not know about branding — a
 * child that imported a logo would be carrying its owner's identity into a
 * repo meant to be handed out.
 *
 * Adding a child: one row here plus its two-line mount page. Nothing else.
 */
type Child = { name: string; label: string; owner: string; logo: string };

const GET_CACHE = "/mobileAssets/getCacheLogo.webp";
// NOTE: ReTreever's dog logo is NOT in this repo yet. The only copy lives at
// static/arc/logos/retreever-logo.png, which is gitignored (.gitignore:119)
// and is a 1.8 MB PNG — it reaches no clone, and would be the wrong asset for
// an 18px header anyway. Before the first ReTreever child lands here, add a
// small web-sized mark to static/pub-OSEM/ and point this at it.
const RETREEVER = "";

const CHILDREN: Record<string, Child> = {
	"/debug/map": {
		name: "getCache_OfflineMap",
		label: "offline",
		owner: "Get Cache",
		logo: GET_CACHE,
	},
	"/who/map": {
		name: "getCache_OnlineMap",
		label: "online",
		owner: "Get Cache",
		logo: GET_CACHE,
	},
	// ReTreever children land here as they are carved — same shape, dog logo:
	// "/where": { name: "ReTreever_where", label: "where", owner: "ReTreever", logo: RETREEVER },
};

let naked = $state(false);
const child = $derived(CHILDREN[page.url.pathname]);
const routes = Object.entries(CHILDREN);

let { children } = $props();
</script>

<svelte:head>
	{#if naked}
		<!-- NAKED: reset every design token to its initial value. The child keeps
		     its own layout CSS and loses everything the host was lending it —
		     which is exactly what it looks like in a repo with no host. -->
		<style>
			:root {
				--gold: initial;
				--terracotta: initial;
				--sage: initial;
				--ink: initial;
				--paper: initial;
			}
		</style>
	{/if}
</svelte:head>

{#if dev}
	<header>
		{#if child}
			<!-- A missing mark shows the name alone rather than a broken image
			     icon: the header must never look like the harness is broken. -->
			{#if child.logo}<img src={child.logo} alt={child.owner} class="logo" />{/if}
			<span class="owner">{child.owner}</span>
		{/if}
		<span class="mark">harness</span>
		{#if child}<code>{child.name}</code>{/if}
		<nav>
			{#each routes as [href, c] (href)}
				<a {href} class:on={page.url.pathname === href}>{c.label}</a>
			{/each}
		</nav>
		<label title="Drop the host's design tokens — see the child as a contractor does">
			<input type="checkbox" bind:checked={naked} />
			naked
		</label>
	</header>
{/if}

<main class:naked={dev && naked}>
	{@render children()}
</main>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.4rem 0.75rem;
		font: 500 12px/1 "JetBrains Mono", ui-monospace, monospace;
		background: #16161a;
		color: #c9c9d1;
		border-bottom: 1px solid #2a2a32;
	}
	.logo {
		height: 18px;
		width: auto;
		display: block;
	}
	.owner {
		font-weight: 600;
		color: #e8e8ee;
	}
	.mark {
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.55;
	}
	code {
		color: #8fd7a7;
	}
	nav {
		display: flex;
		gap: 0.5rem;
		margin-left: auto;
	}
	nav a {
		color: #c9c9d1;
		text-decoration: none;
		padding: 0.2rem 0.45rem;
		border-radius: 3px;
	}
	nav a:hover {
		background: #24242c;
	}
	nav a.on {
		background: #2f2f3a;
		color: #fff;
	}
	label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		cursor: pointer;
		user-select: none;
	}
	main {
		/* The harness contributes height and nothing else. A child that needs a
		   full-height box gets one; a child that styles itself is untouched. */
		min-height: 100dvh;
	}
</style>
