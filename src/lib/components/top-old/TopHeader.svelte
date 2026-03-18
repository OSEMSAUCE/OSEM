<script lang="ts">
	import { goto } from "$app/navigation";
	import * as Breadcrumb from "../ui/breadcrumb";
	import { Button } from "../ui/button";
	import type { TopConfig } from "./TopConfig";

	let {
		config,
		entities,
		selectedEntity,
		onSelectEntity,
		showMapButton = false,
	}: {
		config: TopConfig;
		entities: Array<{ key: string; name: string | null }>;
		selectedEntity: { key: string; name: string | null } | null;
		onSelectEntity?: (entity: { key: string; name: string | null }) => void;
		showMapButton?: boolean;
	} = $props();

	let entitySearchQuery = $state("");
	let entityDropdownOpen = $state(false);
	let entitySearchInput = $state<HTMLInputElement | undefined>(undefined);

	const filteredEntities = $derived(
		entitySearchQuery.trim()
			? entities.filter((e) => {
					const q = entitySearchQuery.toLowerCase();
					return (
						e.name?.toLowerCase().includes(q) ||
						e.key?.toLowerCase().includes(q)
					);
				})
			: entities,
	);

	function selectEntity(entity: { key: string; name: string | null }) {
		entitySearchQuery = "";
		entityDropdownOpen = false;
		if (onSelectEntity) {
			onSelectEntity(entity);
		} else {
			const route = config.entityType === "project" ? "/what" : "/who";
			const keyParam = config.dataKeys.key;
			goto(`${route}?${keyParam}=${encodeURIComponent(entity.key)}`);
		}
	}

	function focusEntitySearch() {
		entitySearchInput?.focus();
		entityDropdownOpen = true;
	}

	const breadcrumbItems = $derived(() => {
		const items = [
			{ label: "Home", href: "/" },
			{
				label: config.labels.entityNamePlural,
				href: config.entityType === "project" ? "/what" : "/who",
			},
		];
		if (selectedEntity) {
			items.push({
				label: selectedEntity.name || selectedEntity.key,
				href: undefined,
			});
		}
		return items;
	});
</script>

<div class="py-4">
	<!-- Breadcrumbs -->
	<Breadcrumb.Breadcrumb class="pb-4">
		<Breadcrumb.BreadcrumbList>
			{#each breadcrumbItems() as item, index}
				<Breadcrumb.BreadcrumbItem>
					{#if index === breadcrumbItems().length - 1}
						<Breadcrumb.BreadcrumbPage
							>{item.label}</Breadcrumb.BreadcrumbPage
						>
					{:else if item.href}
						<Breadcrumb.BreadcrumbLink href={item.href}
							>{item.label}</Breadcrumb.BreadcrumbLink
						>
					{:else}
						{item.label}
					{/if}
				</Breadcrumb.BreadcrumbItem>
				{#if index < breadcrumbItems().length - 1}
					<Breadcrumb.BreadcrumbSeparator />
				{/if}
			{/each}
		</Breadcrumb.BreadcrumbList>
	</Breadcrumb.Breadcrumb>

	<!-- Entity Selector -->
	<div class="flex items-center gap-4 mb-4">
		<div class="relative flex-1 max-w-md">
			<input
				type="text"
				bind:this={entitySearchInput}
				bind:value={entitySearchQuery}
				onfocus={() => (entityDropdownOpen = true)}
				onblur={() =>
					setTimeout(() => (entityDropdownOpen = false), 200)}
				placeholder="Search {config.labels.entityNamePlural.toLowerCase()}..."
				class="w-full px-4 py-2 border border-border rounded-md"
			/>
			{#if entityDropdownOpen && filteredEntities.length > 0}
				<div
					class="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
				>
					{#each filteredEntities.slice(0, 50) as entity}
						<button
							type="button"
							onclick={() => selectEntity(entity)}
							class="w-full px-4 py-2 text-left hover:bg-muted"
						>
							<div class="font-medium">
								{entity.name || entity.key}
							</div>
							<div class="text-xs text-muted-foreground">
								{entity.key}
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
		{#if showMapButton && config.features.showMapButton}
			<Button variant="outline" onclick={() => goto("/where")}>
				View Map
			</Button>
		{/if}
	</div>

	<!-- Selected Entity Display -->
	{#if selectedEntity}
		<div class="mb-4">
			<h1 class="text-2xl font-bold">
				{selectedEntity.name || selectedEntity.key}
			</h1>
			<p class="text-sm text-muted-foreground">
				{config.labels.entityName} Key: {selectedEntity.key}
			</p>
		</div>
	{/if}
</div>
