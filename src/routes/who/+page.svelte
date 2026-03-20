<script lang="ts">
	import StagePage from "$lib/components/stageOSEM/StagePage.svelte";
	import type { StagePageData } from "$lib/components/stageOSEM/stageTypes";

	let {
		data,
	}: {
		data: StagePageData;
	} = $props();
</script>

<StagePage {...data} />
