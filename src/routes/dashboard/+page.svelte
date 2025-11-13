<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import DataTable from '$lib/components/dashboard/DataTable.svelte';
	import { columns as landColumns } from '$lib/components/dashboard/columns/landColumns';
	import { columns as cropColumns } from '$lib/components/dashboard/columns/cropColumns';
	import { columns as plantingColumns } from '$lib/components/dashboard/columns/plantingColumns';
	import Breadcrumb from '$lib/components/dashboard/Breadcrumb.svelte';
	import * as Select from '$lib/components/ui/select';
	import type { Selected } from 'bits-ui';

	let { data }: { data: PageData } = $props();

	// Get current selections from URL
	const selectedProjectId = $derived(data.selectedProjectId);
	const selectedTable = $derived(data.selectedTable);

	// Find selected project
	const selectedProject = $derived(
		data.projects.find((p) => p.projectId === selectedProjectId)
	);

	// Setup select component values as state
	let projectSelectValue = $state<Selected<string> | undefined>(undefined);
	let tableSelectValue = $state<Selected<string> | undefined>(undefined);

	// Available tables
	const availableTables = [
		{ value: 'lands', label: 'Lands' },
		{ value: 'crops', label: 'Crops' },
		{ value: 'plantings', label: 'Plantings' }
	];

	// Sync select values with URL changes
	$effect(() => {
		if (selectedProject) {
			projectSelectValue = {
				value: selectedProject.projectId,
				label: selectedProject.projectName
			};
		}
		if (selectedTable) {
			const table = availableTables.find(t => t.value === selectedTable);
			if (table) {
				tableSelectValue = {
					value: table.value,
					label: table.label
				};
			}
		}
	});

	// Update URL when project selection changes
	function handleProjectChange(newValue: Selected<string> | undefined) {
		if (newValue?.value && newValue.value !== selectedProjectId) {
			const url = new URL($page.url);
			url.searchParams.set('project', newValue.value);
			// Clear table selection when project changes
			url.searchParams.delete('table');
			goto(url.toString(), { replaceState: false, keepFocus: true });
		}
	}

	// Update URL when table selection changes
	function handleTableChange(newValue: Selected<string> | undefined) {
		if (newValue?.value && newValue.value !== selectedTable) {
			const url = new URL($page.url);
			if (selectedProjectId) {
				url.searchParams.set('project', selectedProjectId);
			}
			url.searchParams.set('table', newValue.value);
			goto(url.toString(), { replaceState: false, keepFocus: true });
		}
	}

	// Watch for changes to select values
	$effect(() => {
		if (projectSelectValue) {
			handleProjectChange(projectSelectValue);
		}
	});

	$effect(() => {
		if (tableSelectValue) {
			handleTableChange(tableSelectValue);
		}
	});

	// Get table display name
	const tableDisplayName = $derived(
		selectedTable ? availableTables.find(t => t.value === selectedTable)?.label || selectedTable : null
	);

	// Update breadcrumb items based on current selections
	const breadcrumbItems = $derived([
		{ label: 'Home', href: '/' },
		{ label: 'Dashboard', href: '/dashboard' },
		...(selectedProject ? [{ label: selectedProject.projectName, href: `/dashboard?project=${selectedProject.projectId}` }] : [{ label: 'Select a project' }]),
		...(selectedTable && tableDisplayName ? [{ label: tableDisplayName }] : [])
	]);

	// Get appropriate columns based on selected table
	const columns = $derived(
		selectedTable === 'lands' ? landColumns :
		selectedTable === 'crops' ? cropColumns :
		selectedTable === 'plantings' ? plantingColumns :
		landColumns // default
	);

	// Get filter config based on table type
	const filterConfig = $derived(
		selectedTable === 'lands' ? { columnKey: 'landName', placeholder: 'Filter by land name...' } :
		selectedTable === 'crops' ? { columnKey: 'cropName', placeholder: 'Filter by crop name...' } :
		selectedTable === 'plantings' ? { columnKey: 'landName', placeholder: 'Filter by land name...' } :
		{ columnKey: 'landName', placeholder: 'Filter...' }
	);
</script>

<div class="dashboard">
	<Breadcrumb items={breadcrumbItems} />

	<div class="content">
		{#if data.error}
			<div class="warning-banner">
				<strong>API Error:</strong> {data.error}
				<br />
				<small>Check browser console for details.</small>
			</div>
		{/if}

		<!-- Two-step selection: Project then Table -->
		<div class="selectors-container">
			<!-- Step 1: Project Selector -->
			<div class="selector-group">
				<label for="project-select" class="selector-label">1. Select Project:</label>
				<Select.Root bind:selected={projectSelectValue}>
					<Select.Trigger class="w-[300px]">
						{selectedProject?.projectName || 'Choose a project...'}
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

			<!-- Step 2: Table Selector (only show if project is selected) -->
			{#if selectedProjectId}
				<div class="selector-group">
					<label for="table-select" class="selector-label">2. Select Table:</label>
					<Select.Root bind:selected={tableSelectValue}>
						<Select.Trigger class="w-[300px]">
							{tableDisplayName || 'Choose a table...'}
						</Select.Trigger>
						<Select.Content>
							{#each availableTables as table (table.value)}
								<Select.Item value={table.value} label={table.label}>
									{table.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}
		</div>

		<!-- Show table only when both project and table are selected -->
		{#if selectedProjectId && selectedTable}
			<main class="table-container">
				<h2>{tableDisplayName} {selectedProject ? `for ${selectedProject.projectName}` : ''}</h2>
				{#if data.tableData.length > 0}
					<DataTable
						data={data.tableData}
						columns={columns}
						filterConfig={filterConfig}
					/>
				{:else}
					<p class="no-data-message">No {tableDisplayName?.toLowerCase()} found for this project</p>
				{/if}
			</main>
		{:else if selectedProjectId && !selectedTable}
			<div class="empty-state">
				<div>
					<h2>Select a Table</h2>
					<p>Please select a table type to view data for {selectedProject?.projectName}</p>
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<div>
					<h2>No Projects Available</h2>
					<p>There are no projects to display. Please check the API connection.</p>
				</div>
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

	.warning-banner {
		padding: 1rem 1.5rem;
		background: rgba(255, 193, 7, 0.1);
		border: 1px solid rgba(255, 193, 7, 0.3);
		border-radius: 0.5rem;
		color: rgba(255, 193, 7, 0.9);
		margin-bottom: 1.5rem;
	}

	.warning-banner strong {
		font-weight: 600;
	}

	.selectors-container {
		display: flex;
		gap: 2rem;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		flex-wrap: wrap;
	}

	.selector-group {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.selector-label {
		font-size: 1rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
		white-space: nowrap;
	}

	.table-container {
		background: rgba(255, 255, 255, 0.03);
		padding: 1.5rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.table-container h2 {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.no-data-message {
		color: rgba(255, 255, 255, 0.6);
		font-size: 1rem;
		padding: 2rem;
		text-align: center;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		text-align: center;
	}

	.empty-state h2 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.empty-state p {
		color: rgba(255, 255, 255, 0.6);
		font-size: 1.1rem;
		margin: 0;
	}

	@media (max-width: 1024px) {
		.dashboard {
			padding: 1rem;
		}

		.selectors-container {
			flex-direction: column;
			gap: 1rem;
		}

		.selector-group {
			flex-direction: column;
			align-items: flex-start;
			width: 100%;
		}

		.table-container h2 {
			font-size: 1.25rem;
		}
	}
</style>
