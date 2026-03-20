<script lang="ts">
	import StageBreadcrumbs from "./StageBreadcrumbs.svelte";
	import type { StagePageData } from "./stageTypes";

	let { heading, description, routePath }: StagePageData = $props();
</script>

<svelte:head>
	<title>{heading}</title>
	<meta name="description" content={description} />
</svelte:head>

<section>
	<StageBreadcrumbs {heading} {routePath} />
	<div class="min-h-64"></div>
</section>
