<script lang="ts">
	import { page } from "$app/state";
	import { Map, ClipboardList } from "lucide-svelte";

	const tabs = [
		{ title: "MAP", href: "/mobile", icon: Map },
		{ title: "EZCache", href: "/mobile/cache", icon: ClipboardList },
	] as const;

	function isActive(href: string): boolean {
		if (href === "/mobile") return page.url.pathname === "/mobile";
		return page.url.pathname.startsWith(href);
	}
</script>

<nav class="bottom-nav">
	{#each tabs as { title, href, icon: Icon }}
		<a {href} class="tab" class:active={isActive(href)}>
			<Icon class="w-6 h-6" />
			<span>{title}</span>
		</a>
	{/each}
</nav>

<style>
	.bottom-nav {
		display: flex;
		flex-shrink: 0;
		height: calc(3.5rem + env(safe-area-inset-bottom));
		padding-bottom: env(safe-area-inset-bottom);
		padding-left: env(safe-area-inset-left);
		padding-right: env(safe-area-inset-right);
		background-color: var(--color-background);
		border-top: 1px solid rgb(from var(--color-accent) r g b / 0.2);
		backdrop-filter: blur(8px);
	}

	.tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: rgb(from var(--color-foreground) r g b / 0.4);
		text-decoration: none;
		transition: color 0.15s;
		-webkit-tap-highlight-color: transparent;
	}

	.tab.active {
		color: var(--color-accent);
	}
</style>
