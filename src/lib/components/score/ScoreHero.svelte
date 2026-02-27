<script lang="ts">
	import DotMatrix from "./DotMatrix.svelte";

	let {
		scoreLabel,
		percentile,
	}: {
		scoreLabel: string;
		percentile: number | null | undefined;
	} = $props();

	const dotMatrixText = "ReTreever Rating";
</script>

<div
	class="py-4 text-center score-hero"
	style="--dot-size: 2; --dot-spacing: 3.1;"
>
	<div class="px-2 sm:px-10 pb-4 flex justify-center">
		<DotMatrix text={dotMatrixText} />
	</div>
	<br />
	<p
		class="text-sm sm:text-2xl font-bold text-muted-foreground mb-2 tracking-wider"
	>
		{scoreLabel}
	</p>
	{#if percentile != null}
		<p
			class="text-5xl sm:text-8xl py-2 pb-2 font-bold text-accent tabular-nums leading-none"
		>
			{percentile}
		</p>
		{#if percentile <= 34}
			<p class="text-sm sm:text-xl mt-1">😬 Opaque</p>
		{:else if percentile <= 69}
			<p class="text-sm sm:text-xl mt-1">😐 Partial</p>
		{:else if percentile <= 89}
			<p class="text-sm sm:text-xl mt-1">🙂 Open</p>
		{:else}
			<p class="text-sm sm:text-xl mt-1">🏆 Transparent</p>
		{/if}
	{/if}
</div>

<style>
	/* ── DotMatrix size knobs ── tweak these values to resize the scoreboard */
	.score-hero {
		--scoreboard-width: 34rem;
	} /* desktop  */

	@media (max-width: 64rem) {
		/* tablet   */
		.score-hero {
			--scoreboard-width: 26rem;
		}
	}

	@media (max-width: 40rem) {
		/* mobile   */
		.score-hero {
			--scoreboard-width: 18rem;
		}
	}
</style>
