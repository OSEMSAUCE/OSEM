<script lang="ts">
	import type { StageRoutePath } from "./stageTypes";

	let {
		heading,
		routePath,
	}: {
		heading: string;
		routePath: StageRoutePath;
	} = $props();
</script>

<nav aria-label="Breadcrumbs">
	<a href="/">Home</a>
	<span>/</span>
	<a href={routePath}>{heading}</a>
</nav>
