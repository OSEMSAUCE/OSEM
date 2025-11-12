<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';

	export type BreadcrumbItem = {
		label: string;
		href?: string; // undefined for current page
	};

	type BreadcrumbProps = {
		items: BreadcrumbItem[];
	};

	let { items }: BreadcrumbProps = $props();
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		{#each items as item, index}
			<Breadcrumb.Item>
				{#if index === items.length - 1}
					<!-- Last item (current page) -->
					<Breadcrumb.Page>{item.label}</Breadcrumb.Page>
				{:else if item.href}
					<!-- Clickable breadcrumb with link -->
					<Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
				{:else}
					<!-- Non-clickable breadcrumb (shouldn't happen unless href is missing) -->
					<Breadcrumb.Page>{item.label}</Breadcrumb.Page>
				{/if}
			</Breadcrumb.Item>

			{#if index < items.length - 1}
				<Breadcrumb.Separator />
			{/if}
		{/each}
	</Breadcrumb.List>
</Breadcrumb.Root>
