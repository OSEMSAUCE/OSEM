<script lang="ts">
	import ScoreHero from "../score/ScoreHero.svelte";
	import type { TopConfig } from "./TopConfig";

	let {
		config,
		percentile,
	}: {
		config: TopConfig;
		percentile: number | null | undefined;
	} = $props();
</script>

{#if config.features.showRank && percentile != null}
	<ScoreHero scoreLabel={config.labels.scoreLabel} {percentile} />
{/if}
