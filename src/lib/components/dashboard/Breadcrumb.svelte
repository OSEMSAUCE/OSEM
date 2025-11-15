<script lang="ts">
	export type BreadcrumbItem = {
		label: string;
		href?: string; // undefined for current page
	};

	type BreadcrumbProps = {
		items: BreadcrumbItem[];
	};

	let { items }: BreadcrumbProps = $props();
</script>

<nav aria-label="breadcrumb">
	<ol class="breadcrumb">
		{#each items as item, index (item.label + index)}
			<li class="breadcrumb-item {index === items.length - 1 ? 'active' : ''}" aria-current={index === items.length - 1 ? 'page' : undefined}>
				{#if index === items.length - 1}
					<!-- Last item (current page) -->
					{item.label}
				{:else if item.href}
					<!-- Clickable breadcrumb with link -->
					<a href={item.href}>{item.label}</a>
				{:else}
					<!-- Non-clickable breadcrumb -->
					{item.label}
				{/if}
			</li>
		{/each}
	</ol>
</nav>
