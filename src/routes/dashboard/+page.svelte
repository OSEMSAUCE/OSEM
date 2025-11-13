<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from '$lib/components/dashboard/DataTable.svelte';
	import { columns as landColumns } from '$lib/components/dashboard/columns/landColumns';
	import Breadcrumb from '$lib/components/dashboard/Breadcrumb.svelte';
	import * as Select from '$lib/components/ui/select';
	import type { Land } from '$lib/types/land';
	import type { Selected } from 'bits-ui';

	let { data }: { data: PageData } = $props();

	// Default to first project
	let selectedValue = $state<Selected<string> | undefined>({
		value: data.projects[0]?.projectId || '',
		label: data.projects[0]?.projectName || ''
	});

	// Extract current project details from selected value
	const selectedProjectId = $derived(selectedValue?.value || '');
	const selectedProjectName = $derived(selectedValue?.label || '');

	// Filter lands based on selected project
	const filteredLands = $derived<Land[]>(
		selectedProjectId
			? data.lands.filter((land) => land.projectId === selectedProjectId)
			: []
	);

	// Update breadcrumb items based on selection
	const breadcrumbItems = $derived([
		{ label: 'Home', href: '/' },
		{ label: 'Dashboard', href: '/dashboard' },
		selectedProjectName
			? { label: selectedProjectName }
			: { label: 'Select a project' }
	]);
</script>

<div class="dashboard">
	<Breadcrumb items={breadcrumbItems} />

	<div class="content">
		<div class="project-selector">
			<label for="project-select" class="selector-label">Select Project:</label>
			<Select.Root bind:selected={selectedValue}>
				<Select.Trigger class="w-[300px]">
					{selectedProjectName || 'Choose a project...'}
				</Select.Trigger>
				<Select.Content>
					{#each data.projects as project (project.projectId)}
						<Select.Item value={project.projectId} label={project.projectName}>
							{project.projectName}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		{#if selectedProjectId}
			<main class="lands-table">
				<h2>Land Parcels for {selectedProjectName}</h2>
				<DataTable
					data={filteredLands}
					columns={landColumns}
					filterConfig={{ columnKey: 'landName', placeholder: 'Filter by land name...' }}
				/>
			</main>
		{:else}
			<div class="empty-state">
				<p>Please select a project to view its land parcels</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.dashboard {
		padding: 2rem;
		max-width: 1600px;
		margin: 0 auto;
	}

	.content {
		margin-top: 2rem;
	}

	.project-selector {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.selector-label {
		font-size: 1rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
		white-space: nowrap;
	}

	.lands-table {
		background: rgba(255, 255, 255, 0.03);
		padding: 1.5rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.lands-table h2 {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.empty-state p {
		color: rgba(255, 255, 255, 0.6);
		font-size: 1.1rem;
	}

	@media (max-width: 1024px) {
		.dashboard {
			padding: 1rem;
		}

		.project-selector {
			flex-direction: column;
			align-items: flex-start;
		}

		.lands-table h2 {
			font-size: 1.25rem;
		}
	}
</style>
