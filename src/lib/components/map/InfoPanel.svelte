<script lang="ts">
	let {
		selectedFeature = $bindable(null),
		onClose,
	}: { selectedFeature: any; onClose: () => void } = $props();

	function formatHectares(hectares: number): string {
		return Math.round(hectares).toLocaleString();
	}
</script>

{#if selectedFeature}
	<div class="info-panel">
		<button class="close-btn" onclick={onClose} aria-label="Close panel"
			>×</button
		>
		<div class="panel-content">
			<h3 class="panel-title">
				{selectedFeature.landName || "Unnamed Area"}
			</h3>
			<div class="divider"></div>

			{#if selectedFeature.landName}
				<div class="info-row">
					<span class="label">Land:</span>
					<a
						href="/what?project={encodeURIComponent(
							selectedFeature.projectId || '',
						)}&table=LandTable"
						class="link"
					>
						{selectedFeature.landName}
					</a>
				</div>
			{/if}

			{#if selectedFeature.projectName}
				<div class="info-row">
					<span class="label">Project:</span>
					<a
						href="/what?project={encodeURIComponent(
							selectedFeature.projectId || '',
						)}"
						class="link"
					>
						{selectedFeature.projectName}
					</a>
				</div>
			{/if}

			{#if selectedFeature.organizationLocalName}
				<div class="info-row">
					<span class="label">Organization:</span>
					<a
						href="/who/{encodeURIComponent(
							selectedFeature.organizationLocalName,
						)}"
						class="link"
					>
						{selectedFeature.organizationLocalName}
					</a>
				</div>
			{:else}
				<div class="info-row">
					<span class="label">Organization:</span>
					<span class="value">None</span>
				</div>
			{/if}

			{#if selectedFeature.hectaresCalc}
				<div class="info-row">
					<span class="label">Hectares:</span>
					<span class="value"
						>{formatHectares(
							Number(selectedFeature.hectaresCalc),
						)}</span
					>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.info-panel {
		position: absolute;
		background: var(--color-background, #1a1a1a);
		border: 1px solid var(--color-border, #333);
		z-index: 1000;
		overflow-y: auto;
		box-shadow: -0.25rem 0 1rem rgba(0, 0, 0, 0.3);
	}

	/* Desktop: right side panel */
	@media (min-width: 768px) {
		.info-panel {
			right: 1rem;
			top: 5rem;
			width: 20rem;
			max-height: calc(100vh - 6rem);
			border-radius: 0.5rem;
		}
	}

	/* Mobile: bottom panel */
	@media (max-width: 767px) {
		.info-panel {
			left: 0;
			right: 0;
			bottom: 0;
			max-height: 50vh;
			border-top-left-radius: 1rem;
			border-top-right-radius: 1rem;
			border-bottom: none;
		}
	}

	.close-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: var(--color-foreground, #fafafa);
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
		transition: background-color 0.2s;
	}

	.close-btn:hover {
		background: var(--color-accent, #a78bfa);
	}

	.panel-content {
		padding: 1rem;
		padding-top: 2.5rem;
	}

	.panel-title {
		color: var(--color-foreground, #fafafa);
		font-weight: bold;
		font-size: 1.125rem;
		margin: 0 0 0.5rem 0;
	}

	.divider {
		height: 1px;
		background: var(--color-border, #333);
		margin: 0.75rem 0;
	}

	.info-row {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
	}

	.label {
		color: var(--color-muted-foreground, #e6e6e6);
		min-width: 6rem;
		flex-shrink: 0;
	}

	.value {
		color: var(--color-foreground, #fafafa);
	}

	.link {
		color: var(--color-accent, #a78bfa);
		text-decoration: underline;
		text-decoration-color: var(--color-accent, #a78bfa);
		text-underline-offset: 0.125rem;
	}

	.link:hover {
		color: var(--color-accent-foreground, #8b5cf6);
		text-decoration-thickness: 0.125rem;
	}
</style>
