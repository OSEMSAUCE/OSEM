<script lang="ts">
	import type { EntityDetail } from "./stageTypes";
	import ExternalLink from "lucide-svelte/icons/external-link";

	let { selectedEntity }: { selectedEntity: EntityDetail } = $props();

	const isOrg = $derived(selectedEntity.entity === "organization");
	const data = $derived(selectedEntity.data);

	const name = $derived(
		isOrg
			? (selectedEntity.data as typeof selectedEntity.data & { organizationName: string | null }).organizationName
			: (selectedEntity.data as typeof selectedEntity.data & { projectName: string | null }).projectName,
	);

	const description = $derived(
		isOrg
			? (selectedEntity.data as typeof selectedEntity.data & { organizationDesc: string | null }).organizationDesc
			: (selectedEntity.data as typeof selectedEntity.data & { projectDesc: string | null }).projectDesc,
	);

	const score = $derived(
		isOrg
			? (selectedEntity.data as typeof selectedEntity.data & { scoreOrgFinal: number | null }).scoreOrgFinal
			: (selectedEntity.data as typeof selectedEntity.data & { scoreProject: number | null }).scoreProject,
	);

	const rank = $derived(
		isOrg
			? (selectedEntity.data as typeof selectedEntity.data & { scoreRankOverall: number | null }).scoreRankOverall
			: (selectedEntity.data as typeof selectedEntity.data & { scoreProjectRank: number | null }).scoreProjectRank,
	);

	const website = $derived(
		isOrg
			? (selectedEntity.data as typeof selectedEntity.data & { website: string | null }).website
			: null,
	);

	const category = $derived(
		isOrg
			? (selectedEntity.data as typeof selectedEntity.data & { primaryStakeholderCategory: string | null }).primaryStakeholderCategory
			: null,
	);

	function formatScore(value: number | null): string {
		if (value === null) return "—";
		return `${(value * 100).toFixed(0)}%`;
	}

	function formatRank(value: number | null): string {
		if (value === null) return "—";
		return `Top ${100 - value}%`;
	}
</script>

<div class="stage-entity-detail">
	<div class="stage-entity-detail-header">
		<h2 class="stage-entity-detail-name">{name ?? "Unknown"}</h2>
		{#if category}
			<span class="stage-entity-detail-category">{category}</span>
		{/if}
	</div>

	<div class="stage-entity-detail-scores">
		<div class="stage-entity-detail-score-item">
			<span class="stage-entity-detail-score-label">Score</span>
			<span class="stage-entity-detail-score-value">{formatScore(score)}</span>
		</div>
		<div class="stage-entity-detail-score-item">
			<span class="stage-entity-detail-score-label">Rank</span>
			<span class="stage-entity-detail-score-value">{formatRank(rank)}</span>
		</div>
	</div>

	{#if description}
		<p class="stage-entity-detail-description">{description}</p>
	{/if}

	{#if website}
		<a
			href={website.startsWith("http") ? website : `https://${website}`}
			target="_blank"
			rel="noopener noreferrer"
			class="stage-entity-detail-website"
		>
			<ExternalLink size={16} />
			<span>{website.replace(/^https?:\/\//, "")}</span>
		</a>
	{/if}
</div>

<style>
	.stage-entity-detail {
		padding: 1.5rem;
		background: var(--color-card);
		border-radius: 1rem;
		border: 1px solid var(--color-border-accent);
		max-width: 32rem;
	}

	.stage-entity-detail-header {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}

	.stage-entity-detail-name {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0;
	}

	.stage-entity-detail-category {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
		text-transform: capitalize;
	}

	.stage-entity-detail-scores {
		display: flex;
		gap: 2rem;
		margin-bottom: 1rem;
	}

	.stage-entity-detail-score-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.stage-entity-detail-score-label {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stage-entity-detail-score-value {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-accent);
	}

	.stage-entity-detail-description {
		font-size: 0.875rem;
		color: var(--color-foreground);
		line-height: 1.5;
		margin: 0 0 1rem 0;
	}

	.stage-entity-detail-website {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-accent);
		text-decoration: none;
	}

	.stage-entity-detail-website:hover {
		text-decoration: underline;
	}
</style>
