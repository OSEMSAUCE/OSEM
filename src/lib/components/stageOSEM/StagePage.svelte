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

<section>
	<StageBreadcrumbs {heading} {routePath} />
	<div class="min-h-64"></div>
</section>

<section>
	<StageWhoWhatSelect {entity} {heading} {routePath} />
	<div class="min-h-64"></div>
</section>
