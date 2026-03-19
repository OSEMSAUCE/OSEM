<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		weedsStage,
		groundStage,
		children,
	}: {
		weedsStage?: Snippet;
		groundStage?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="top-frame" style="position: relative;">
	<!-- Weeds Stage (top visual - weeds/dog) -->
	{#if weedsStage}
		<div style="position: absolute; bottom: 0; left: 0; right: 0; margin: 0; padding: 0;">
			{@render weedsStage()}
		</div>
	{/if}

	<!-- Main Content -->
	{@render children()}

	<!-- Ground Stage (bottom visual - roots) -->
	{#if groundStage}
		{@render groundStage()}
	{/if}
</div>
