<script lang="ts">
	import * as Card from "../ui/card";
	import DotMatrix from "./DotMatrix.svelte";

	let {
		scoreLabel,
		percentile,
		dataCompletion,
		fieldPointsScored,
		fieldPointsAvail,
		treesClaimed = null,
		treesDisclosed = null,
		projectCount = null,
	}: {
		scoreLabel: string;
		percentile: number | null | undefined;
		dataCompletion: number | null | undefined;
		fieldPointsScored: number | null | undefined;
		fieldPointsAvail: number | null | undefined;
		treesClaimed?: number | null;
		treesDisclosed?: number | null;
		projectCount?: number | null;
	} = $props();

	const dotMatrixText = $derived(scoreLabel.replace(/\s+/g, " ").toUpperCase());

	const showTrees = $derived(treesClaimed != null || treesDisclosed != null);
	const showFieldPoints = $derived(fieldPointsScored != null && fieldPointsAvail != null);
	const showProjects = $derived(projectCount != null);
	const showSecondaryStats = $derived(showTrees || showFieldPoints || showProjects);

	const secondaryColCount = $derived(
		(treesClaimed != null ? 1 : 0) +
		(treesDisclosed != null ? 1 : 0) +
		(showFieldPoints ? 1 : 0) +
		(showProjects ? 1 : 0),
	);

	const gridColsClass = $derived(
		secondaryColCount === 1 ? "grid-cols-1" :
		secondaryColCount === 2 ? "grid-cols-2" :
		secondaryColCount === 3 ? "grid-cols-3" :
		"grid-cols-4"
	);
</script>

<Card.Root class="my-4">
	<div
		class="px-8 pt-4 pb-4"
		style="--dot-size: 2; --dot-spacing: 3.1;"
	>
		<DotMatrix text={dotMatrixText} />
	</div>
	<Card.Content class="pt-0 pb-4">
		<!-- Score columns: Score (gold, first) + Data Completeness (white) -->
		<div class="flex items-start divide-x divide-border mb-6">
			<!-- Column 1: Score — primary ranking, shown in accent/gold -->
			<div class="flex-1 text-center px-4">
				<div class="flex justify-center"></div>
				<p
					class="text-2xl font-bold text-muted-foreground mb-2 tracking-wider"
				>
					{scoreLabel}
				</p>
			{#if percentile != null || percentile != undefined}
					<p
						class="text-8xl py-2 pb-4 font-bold text-accent tabular-nums leading-none"
					>
						{percentile}
					</p>
					{#if percentile <= 34}
						<p class="text-xl mt-1">😬 Opaque</p>
					{:else if percentile <= 69}
						<p class="text-xl mt-1">😐 Partial</p>
					{:else if percentile <= 89}
						<p class="text-xl mt-1">🙂 Open</p>
					{:else}
						<p class="text-xl mt-1">🏆 Transparent</p>
					{/if}
				{:else}
					<p
						class="text-6xl font-bold text-muted-foreground/20 leading-none"
					>
						
					</p>
				{/if}
			</div>

			<!-- Column 2: Data Completion — raw transparency score -->
			<div class="flex-1 text-center px-4">
				<p
					class="text-2xl font-bold text-muted-foreground mb-2 tracking-wider"
				>
					DATA COMPLETION
				</p>
				{#if dataCompletion != null}
					<p
						class="text-8xl py-2 pb-4 font-bold tabular-nums leading-none"
					>
						{dataCompletion}%
					</p>
				{:else}
					<p
						class="text-6xl py-2 pb-4 font-bold text-muted-foreground/20 leading-none"
					>
						—
					</p>
				{/if}
			</div>
		</div>

		<!-- Secondary stats row — only show cols with data -->
		{#if showSecondaryStats}
			<div class="grid {gridColsClass} gap-3 pt-4 border-t border-border/40 text-center">
				{#if treesClaimed != null}
					<div>
						<p class="font-semibold">
							{#if treesClaimed > 0}
								{treesClaimed.toLocaleString()}
							{:else}—{/if}
						</p>
						<p class="text-xs text-muted-foreground mt-0.5">
							Trees Claimed
						</p>
					</div>
				{/if}
				{#if treesDisclosed != null}
					<div>
						<p class="font-semibold">
							{#if treesDisclosed > 0}
								{treesDisclosed.toLocaleString()}
							{:else}—{/if}
						</p>
						<p class="text-xs text-muted-foreground mt-0.5">
							Trees Disclosed
						</p>
					</div>
				{/if}
				{#if fieldPointsScored != null && fieldPointsAvail != null}
					<div>
						<p class="font-semibold">
							{fieldPointsScored} / {fieldPointsAvail}
						</p>
						<p class="text-xs text-muted-foreground mt-0.5">
							Field Points
						</p>
					</div>
				{/if}
				{#if projectCount != null}
					<div>
						<p class="font-semibold">{projectCount}</p>
						<p class="text-xs text-muted-foreground mt-0.5">
							Projects
						</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Scoring legend — collapsible, below the fold -->
		<p class="mt-4 pt-3 border-t border-border/40"></p>
		<p class="text-xs text-muted-foreground leading-relaxed mt-2">
			This score reflects our best efforts to find publicly
			available data. Missing data? Help us improve this score at
			<a
				href="mailto:info@ReTreever.org"
				class="text-accent hover:underline"
				>info@ReTreever.org</a
			>.
		</p>
		<details class="mt-2 pt-1">
			<summary
				class="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none list-none flex items-center gap-1"
			>
				<span>How the ReTreever Score works</span>
				<span class="text-muted-foreground/50">↓</span>
			</summary>
			<div class="mt-3 space-y-3">
				<div
					class="grid grid-cols-4 gap-1.5 text-center text-xs"
				>
					<div
						class="rounded-lg p-2 bg-red-500/10 border border-red-500/20"
					>
						<p class="font-bold text-red-500">0–34</p>
						<p class="font-semibold text-red-500">
							 😬 Opaque
						</p>
						<p
							class="text-muted-foreground mt-0.5 leading-tight"
						>
							Little to no data
						</p>
					</div>
					<div
						class="rounded-lg p-2 bg-muted/20 border border-border"
					>
						<p class="font-bold">35–69</p>
						<p class="font-semibold"> 😐 Partial</p>
						<p
							class="text-muted-foreground mt-0.5 leading-tight"
						>
							Some data, gaps remain
						</p>
					</div>
					<div
						class="rounded-lg p-2 bg-muted/20 border border-border"
					>
						<p class="font-bold">70–89</p>
						<p class="font-semibold">🙂 Open</p>
						<p
							class="text-muted-foreground mt-0.5 leading-tight"
						>
							Most info accessible
						</p>
					</div>
					<div
						class="rounded-lg p-2 bg-accent/10 border border-accent/20"
					>
						<p class="font-bold text-accent">90–100</p>
						<p class="font-semibold text-accent">
							🏆 Transparent
						</p>
						<p
							class="text-muted-foreground mt-0.5 leading-tight"
						>
							Top 10%. Full disclosure
						</p>
					</div>
				</div>
				<p
					class="text-xs text-muted-foreground leading-relaxed"
				>
					The ReTreever Score (percentile 0–100) measures data
					availability across {scoreLabel === "ORGANIZATION SCORE"
						? "organizational project"
						: "project"} attributes. Score reflects how much information is
					publicly accessible relative to their total
					production claims, measured against other
					{scoreLabel === "ORGANIZATION SCORE"
						? "organizations"
						: "projects"} in the database. For more info see the
					data below, and the associated <a
						href="http://localhost:5173/what"
						>project pages</a
					>. Or check out the open source repository at
					<a href="https://github.com/OSEMSAUCE/OSEM"
						>github.com/OSEMSAUCE/OSEM🤘🌲</a
					>.
				</p>
			</div>
		</details>
	</Card.Content>
</Card.Root>
