<script lang="ts">
	import StageBreadcrumbs from "./StageBreadcrumbs.svelte";
	import StageWhoWhatSelect from "./StageWhoWhatSelect.svelte";
	import type { StagePageData } from "./stageTypes";

	let { entity, heading, description, routePath }: StagePageData = $props();
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
		<StageWhoWhatSelect {entity} {heading} {routePath} />
	</section>
</div>
