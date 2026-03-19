<script lang="ts">
	import ScoreDetails from "../score/ScoreDetails.svelte";
	import type { TopConfig } from "./TopConfig";

	let {
		config,
		dataCompletion,
		fieldPointsScored,
		fieldPointsAvail,
		treesClaimed = null,
		treesDisclosed = null,
		projectCount = null,
		children,
	}: {
		config: TopConfig;
		dataCompletion: number | null | undefined;
		fieldPointsScored: number | null | undefined;
		fieldPointsAvail: number | null | undefined;
		treesClaimed?: number | null;
		treesDisclosed?: number | null;
		projectCount?: number | null;
		children?: import("svelte").Snippet;
	} = $props();
</script>

{#if config.features.showScore}
	<ScoreDetails
		scoreLabel={config.labels.scoreLabel}
		{dataCompletion}
		{fieldPointsScored}
		{fieldPointsAvail}
		{treesClaimed}
		{treesDisclosed}
		{projectCount}
	>
		{#if children}
			{@render children()}
		{/if}
	</ScoreDetails>
{/if}
