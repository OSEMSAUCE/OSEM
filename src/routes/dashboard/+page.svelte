<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import DataTable from '$lib/components/dashboard/DataTable.svelte';
	import { columns as landColumns } from '$lib/components/dashboard/columns/landColumns';
	import { columns as cropColumns } from '$lib/components/dashboard/columns/cropColumns';
	import { columns as plantingColumns } from '$lib/components/dashboard/columns/plantingColumns';
	import Breadcrumb from '$lib/components/dashboard/Breadcrumb.svelte';

	let { data }: { data: PageData } = $props();

	// Get current selections from URL (derived from page data)
	const selectedProjectId = $derived(data.selectedProjectId);
	const selectedTable = $derived(data.selectedTable);

	// Find selected project
	const selectedProject = $derived(
		data.projects.find((p) => p.projectId === selectedProjectId)
	);

	// Available tables from data (comes from Supabase)
	const availableTables = $derived(
		data.availableTables.map(table => ({
			value: table.tableName,
			label: table.tableName
		}))
	);

	// Get table display name (use actual table name from database)
	const tableDisplayName = $derived(selectedTable);

	// Update breadcrumb items based on current selections
	const breadcrumbItems = $derived([
		{ label: 'Home', href: '/' },
		{ label: 'Dashboard', href: '/dashboard' },
		...(selectedProject ? [{ label: selectedProject.projectName, href: `/dashboard?project=${selectedProject.projectId}` }] : [{ label: 'Select a project' }]),
		...(selectedTable && tableDisplayName ? [{ label: tableDisplayName }] : [])
	]);

	// Get appropriate columns based on selected table
	const columns = $derived(
		selectedTable === 'landTable' ? landColumns :
		selectedTable === 'cropTable' ? cropColumns :
		selectedTable === 'plantingTable' ? plantingColumns :
		landColumns // default
	);

	// Get filter config based on table type
	const filterConfig = $derived(
		selectedTable === 'landTable' ? { columnKey: 'landName', placeholder: 'Filter by land name...' } :
		selectedTable === 'cropTable' ? { columnKey: 'cropName', placeholder: 'Filter by crop name...' } :
		selectedTable === 'plantingTable' ? { columnKey: 'landName', placeholder: 'Filter by land name...' } :
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

		<!-- Two-step selection: Project then Table (using basic HTML selects for reliability) -->
		<div class="selectors-container">
			<!-- Step 1: Project Selector -->
			<div class="selector-group">
				<label for="project-select" class="selector-label">1. Select Project:</label>
				<select
					id="project-select"
					class="basic-select"
					value={selectedProjectId || ''}
					onchange={(e) => {
						const value = e.currentTarget.value;
						if (value) {
							window.location.href = `/dashboard?project=${value}`;
						}
					}}
				>
					<option value="">Choose a project...</option>
					{#each data.projects as project (project.projectId)}
						<option value={project.projectId}>{project.projectName}</option>
					{/each}
				</select>
			</div>

			<!-- Step 2: Table Selector -->
			<div class="selector-group">
				<label for="table-select" class="selector-label">2. Select Table:</label>
				<select
					id="table-select"
					class="basic-select"
					value={selectedTable || ''}
					disabled={!selectedProjectId}
					onchange={(e) => {
						const value = e.currentTarget.value;
						if (value && selectedProjectId) {
							window.location.href = `/dashboard?project=${selectedProjectId}&table=${value}`;
						}
					}}
				>
					<option value="">Choose a table...</option>
					{#each availableTables as table (table.value)}
						<option value={table.value}>{table.label}</option>
					{/each}
				</select>
			</div>
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
					<p class="no-data-message">No data found for this project in {tableDisplayName}</p>
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
					<p>There are no projects to display. Please check the database connection.</p>
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

	.basic-select {
		width: 300px;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		color: rgba(255, 255, 255, 0.9);
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.basic-select:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.basic-select:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.basic-select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.basic-select option {
		background: #1a1a1a;
		color: #fff;
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
