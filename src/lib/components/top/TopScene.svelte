<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		topStageVisual,
		groundStageVisual,
		children,
	}: {
		topStageVisual?: Snippet;
		groundStageVisual?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="top-scene" style="min-height: 100vh; position: relative;">
	<!-- Top Stage Visual (weeds/dog for ReTreever) -->
	{#if topStageVisual}
		{@render topStageVisual()}
	{/if}

	<!-- Main Content -->
	{@render children()}

	<!-- Ground Stage Visual (roots for ReTreever) -->
	{#if groundStageVisual}
		{@render groundStageVisual()}
	{/if}
</div>
