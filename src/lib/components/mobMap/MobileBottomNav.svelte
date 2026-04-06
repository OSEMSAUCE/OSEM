<script lang="ts">
	import { page } from "$app/state";
	import { Map } from "lucide-svelte";

	const tabs = [
		{ title: "MAP", href: "/mobile", icon: Map, img: null },
		{
			title: "CACHE",
			href: "/mobile/cache",
			icon: null,
			img: "/mobileAssets/treeGraph.webp",
		},
		{
			title: "",
			href: "/mobile/getcache",
			icon: null,
			img: "/mobileAssets/getCacheLogo.webp",
		},
	] as const;

	function isActive(href: string): boolean {
		if (href === "/mobile") return page.url.pathname === "/mobile";
		return page.url.pathname.startsWith(href);
	}
</script>

<nav class="bottom-nav">
	{#each tabs as { title, href, icon: Icon, img }}
		<a {href} class="tab" class:active={isActive(href)}>
			{#if img}
				<img
					src={img}
					alt={title}
					class="nav-icon-img"
					class:nav-icon-cache={title === "CACHE"}
					class:nav-icon-getcache={title === ""}
				/>
			{:else if Icon}
				<Icon class="w-6 h-6" />
			{/if}
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
		background-color: transparent;
		border-top: 1px solid #ffd700;
	}

	.tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		padding-bottom: 0.5rem;
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

	.nav-icon-img {
		object-fit: contain;
		opacity: 0.4;
		filter: grayscale(100%) brightness(1.5);
		transition:
			opacity 0.15s,
			filter 0.15s;
	}

	.nav-icon-cache {
		width: 2.2rem;
		height: 2.2rem;
		margin-bottom: -0.3rem;
	}

	.nav-icon-getcache {
		width: 3.5rem;
		height: 3rem;
		margin-bottom: -0.6rem;
		margin-top: -0.4rem;
	}

	.tab.active .nav-icon-img {
		opacity: 1;
		filter: none;
	}
</style>
