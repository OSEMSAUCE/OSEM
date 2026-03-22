<script lang="ts">
	import StageBreadcrumbs from "./StageBreadcrumbs.svelte";
	import StageFilterPills from "./StageFilterPills.svelte";
	import StageWhoWhatSelect from "./StageWhoWhatSelect.svelte";
	import type { StagePageData } from "./stageTypes";
	import type { FilterOption } from "./StageFilterPills.svelte";

	let { entity, heading, description, routePath }: StagePageData = $props();

	let filters = $state<FilterOption[]>([
		{ id: "best_rank", label: "Best Rank", checked: false },
		{ id: "worst_rank", label: "Worst Rank", checked: false },
	]);

	const activeFilters = $derived(
		filters.filter((f) => f.checked).map((f) => f.id),
	);
</script>

<svelte:head>
	<title>{heading}</title>
	<meta name="description" content={description} />
</svelte:head>

<div class="flex h-[calc(100vh-8rem)] flex-col">
	<section>
		<StageBreadcrumbs {heading} {routePath} />
	</section>

	<section class="flex-1">
		<StageWhoWhatSelect {entity} {heading} {routePath} {activeFilters} />
		<div class="px-4 pt-4 sm:px-6 lg:pl-[20%]">
			<StageFilterPills bind:filters />
		</div>
	</section>
</div>
