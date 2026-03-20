<script lang="ts">
	import GtStaticPage from "$lib/components/gt/GtStaticPage.svelte";
	import StageBreadcrumbs from "$osem/components/stageOSEM/StageBreadcrumbs.svelte";
	import StageHero from "$lib/components/stage/StageHero.svelte";

	let {
		entity,
		heading,
		description,
		routePath,
	}: {
		entity: "organization" | "project";
		heading: string;
		description: string;
		routePath: "/who" | "/what";
	} = $props();
</script>

<svelte:head>
	<title>{heading}</title>
	<meta name="description" content={description} />
</svelte:head>

<StageBreadcrumbs {heading} {routePath} />

<StageHero {description} {entity} {heading} />

<GtStaticPage {entity} />
