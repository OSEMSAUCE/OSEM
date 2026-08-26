<script lang="ts">
/**
 * THE DEV BAR — the harness shell, as a component the child's layout renders.
 *
 * It is a near-copy of the bar getCache_OfflineMap has carried in its
 * routes/+layout.svelte since 24 Aug 2026, and the copy is deliberate: a child
 * may not import another child (childBoundary.test.ts), and the alternative —
 * hoisting it into a shared parent — cannot work while SvelteKit requires
 * +layout.svelte to live INSIDE kit.files.routes. Whichever child rapper is
 * installed with is the child that must carry the shell.
 *
 * Keep the two in step by hand. There is no build step that will tell you they
 * have drifted, exactly as with cn.ts.
 *
 * WHY THE WHOLE BAR IS DEV-ONLY. `import.meta.env.DEV` is a compile-time
 * constant, so `{#if dev}` is never emitted into a production build. The bar
 * is a developer's instrument for comparing tiers; it is not product chrome.
 *
 * WHY RAPPER OWNS THE BRANDING. A child never knows whose it is. The owner
 * name and logo arrive as PROPS from the layout that mounts this, so this
 * component names no product — hand it different props and it is a different
 * owner's bar. What a child must never do is import its owner's identity, then
 * carry it into a repo handed to a contractor.
 */
/**
 * THE SHARED PILL — one file, above both repos, rendered by both parents.
 * See $devPill/HostPill.svelte. The child's own copy was deleted: it had
 * already drifted from ReTreever's in padding, font-size and half-order.
 */
import HostPill from "./sharedParentPill/HostPill.svelte";

type View = { href: string; label: string; missing?: boolean };

let {
	owner,
	name,
	logo,
	repo,
	views = [],
	ghIcon,
	pathname = "",
	tier,
	otherTier,
	tierSlot,
	otherHost,
	otherPath,
}: {
	owner: string;
	name: string;
	logo: string;
	repo: string;
	views?: View[];
	ghIcon: string;
	/** The pill's four facts, passed straight through. This bar does not know
	 *  which tier it is either — see HostPill for why a child may not guess. */
	tier: string;
	otherTier: string;
	/** Which half this tier occupies — fixed, so the pill never reorders. */
	tierSlot?: "left" | "right";
	otherHost?: string;
	otherPath?: string;
	/** The live pathname, so a view can render as the current one. Passed in
	 *  rather than read from $app/state here: this component is also mounted
	 *  by a parent that may not be SvelteKit, and importing $app/state would
	 *  make it refuse to build there. */
	pathname?: string;
} = $props();

const dev = import.meta.env.DEV;

// The pill's halves in FIXED order, derived from this tier's own slot. The
// shared component renders left/right exactly as given, so both parents must
// agree — and they do, because each knows only where IT sits.
const leftTier = $derived(tierSlot === "left" ? tier : otherTier);
const rightTier = $derived(tierSlot === "left" ? otherTier : tier);

const GH = "https://github.com/Ground-Truth-Data";
</script>

{#if dev}
	<header>
		<span class="left">
			<img src={logo} alt={owner} class="logo" />
			<span class="title">{owner}</span>
			<span class="child-name">{name}</span>
		</span>

		<nav class="views">
			{#each views as v (v.label)}
				{#if v.missing}
					<span class="btn dead" title="No route for this in rapper yet">
						{v.label}
					</span>
				{:else}
					<a href={v.href} class="btn" class:on={pathname === v.href}>
						{v.label}
					</a>
				{/if}
			{/each}
		</nav>

		<span class="right">
			<a class="btn gh" href="{GH}/rapper" target="_blank" rel="noreferrer">
				<img src={ghIcon} alt="" /> rapper
			</a>
			<a class="btn gh" href="{GH}/{repo}" target="_blank" rel="noreferrer">
				<img src={ghIcon} alt="" /> {repo}
			</a>
			<!-- THE PILL LIVES HERE, at the top of the page, in the bar — not
			     floating in a corner. It is the control that answers "which
			     tier am I looking at", so it belongs beside the other facts
			     about the mount rather than hovering over the artwork. -->
			<HostPill
				leftLabel={leftTier}
				rightLabel={rightTier}
				current={tier}
				href={otherHost ? otherHost + (otherPath ?? "/") : undefined}
			/>
		</span>
	</header>
{/if}

<style>
	/* A child may own the whole viewport — a map stage is position:fixed, which
	   ignores a header in normal flow. So the bar is fixed too and declares its
	   height via --host-chrome for the child to start below. */
	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10000;
		height: var(--host-chrome, 67px);
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1.1rem;
		/* Same chrome as the real navbars: near-black bar, gold rule under it.
		   Hard-coded rather than tokenised — the bar must look identical when a
		   parent's tokens are absent, which is the state it exists to show. */
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
		color: #f0b60a;
		white-space: nowrap;
	}
	.child-name {
		color: #6b6b78;
		font-size: 13px;
		white-space: nowrap;
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
</style>
