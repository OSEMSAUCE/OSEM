<script lang="ts">
	import GtStaticPage from "../../../../../src/lib/components/gt/GtStaticPage.svelte";
	import StageBreadcrumbs from "./StageBreadcrumbs.svelte";
	import StageTextIntro from "./StageTextIntro.svelte";
	import StageEntitySelect from "./StageEntitySelect.svelte";
	import type { StagePageData } from "./stageTypes";

	let { entity, heading, description, routePath }: StagePageData = $props();
</script>

<svelte:head>
	<title>{heading}</title>
	<meta name="description" content={description} />
</svelte:head>

<StageBreadcrumbs {heading} {routePath} />

<StageTextIntro {description} {heading} />

<StageEntitySelect {entity} {heading} />

<GtStaticPage {entity} />
