<script lang="ts">
	import StagePage from "$osem/components/stageOSEM/StagePage.svelte";
	import type { StagePageData } from "$osem/components/stageOSEM/stageTypes";

	let {
		data,
	}: {
		data: StagePageData;
	} = $props();
</script>

<StagePage {...data} />
