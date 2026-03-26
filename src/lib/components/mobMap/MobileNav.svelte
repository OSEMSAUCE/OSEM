<script lang="ts">
	import { page } from '$app/state';

	const tabs = [
		{ title: 'MAP', href: '/mobile' },
		{ title: 'TALLY', href: '/mobile/tally' },
		{ title: 'FILES', href: '/mobile/files' },
		{ title: 'UPLOAD', href: '/mobile/upload' },
	] as const;

	function isActive(href: string): boolean {
		if (href === '/mobile') return page.url.pathname === '/mobile';
		return page.url.pathname.startsWith(href);
	}
</script>

<nav class="mobile-subnav">
	{#each tabs as { title, href }}
		<a {href} class="tab" class:active={isActive(href)}>{title}</a>
	{/each}
</nav>

<style>
	.mobile-subnav {
		position: sticky;
		top: 0;
		z-index: 50;
		display: flex;
		align-items: flex-end;
		padding-top: env(safe-area-inset-top);
		height: calc(2.5rem + env(safe-area-inset-top));
		padding-left: max(1rem, env(safe-area-inset-left));
		padding-right: max(1rem, env(safe-area-inset-right));
		background-color: var(--color-background);
		border-bottom: 1px solid rgb(from var(--color-accent) r g b / 0.25);
		backdrop-filter: blur(8px);
	}

	.tab {
		position: relative;
		display: flex;
		align-items: center;
		height: 100%;
		padding: 0 1rem;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: rgb(from var(--color-foreground) r g b / 0.45);
		text-decoration: none;
		transition: color 0.15s;
	}

	.tab:hover {
		color: rgb(from var(--color-foreground) r g b / 0.8);
	}

	.tab.active {
		color: var(--color-accent);
	}

	.tab.active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0.5rem;
		right: 0.5rem;
		height: 2px;
		background-color: var(--color-accent);
		border-radius: 1px;
	}
</style>
