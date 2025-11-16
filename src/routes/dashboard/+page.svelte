<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from '$lib/components/dashboard/DataTable.svelte';
	import { columns as landColumns } from '$lib/components/dashboard/columns/landColumns';
	import { columns as cropColumns } from '$lib/components/dashboard/columns/cropColumns';
	import { columns as plantingColumns } from '$lib/components/dashboard/columns/plantingColumns';
	import { columns as projectColumns } from '$lib/components/dashboard/columns/projectColumns';
	import Breadcrumb from '$lib/components/dashboard/Breadcrumb.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';

	let { data }: { data: PageData } = $props();

	// Get current selections from URL (derived from page data)
	const selectedProjectId = $derived(data.selectedProjectId);
	const selectedTable = $derived(data.selectedTable);

	// Find selected project
	const selectedProject = $derived(data.projects.find((p) => p.projectId === selectedProjectId));

	// Available tables from data (comes from Supabase)
	const availableTables = $derived(
		data.availableTables.map((table) => ({
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
		...(selectedProject
			? [
					{
						label: selectedProject.projectName,
						href: `/dashboard?project=${selectedProject.projectId}`
					}
				]
			: [{ label: 'Select a project' }]),
		...(selectedTable && tableDisplayName ? [{ label: tableDisplayName }] : [])
	]);

	// Get appropriate columns based on selected table
	const columns = $derived(
		selectedTable === 'projectTable'
			? projectColumns
			: selectedTable === 'landTable'
				? landColumns
				: selectedTable === 'cropTable'
					? cropColumns
					: selectedTable === 'plantingTable'
						? plantingColumns
						: landColumns // default
	);

	// Get filter config based on table type
	const filterConfig = $derived(
		selectedTable === 'projectTable'
			? { columnKey: 'projectName', placeholder: 'Filter by project name...' }
			: selectedTable === 'landTable'
				? { columnKey: 'landName', placeholder: 'Filter by land name...' }
				: selectedTable === 'cropTable'
					? { columnKey: 'cropName', placeholder: 'Filter by crop name...' }
					: selectedTable === 'plantingTable'
						? { columnKey: 'landName', placeholder: 'Filter by land name...' }
						: { columnKey: 'landName', placeholder: 'Filter...' }
	);
</script>

<div class="page-container">
	<Breadcrumb items={breadcrumbItems} />

	<div class="content">
		{#if data.error}
		<div class="light-card">
			<div class="warning-banner">
				<strong>API Error:</strong>
				{data.error}
				<br />
				<small>Check browser console for details.</small>
			</div>
		</div>
		{/if}

		<!-- Two-step selection: Project then Table -->
		<div class="light-card selectors-container">
			<!-- Step 1: Project Selector -->
			<div class="selector-group">
				<span class="selector-label">1. Select Project:</span>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="outline" class="w-[200px] justify-between">
							{selectedProject?.projectName || 'Choose a project...'}
							<span class="ml-2">▼</span>
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-[200px]">
						{#each data.projects as project (project.projectId)}
							<DropdownMenu.Item
								onclick={() => {
									window.location.href = `/dashboard?project=${project.projectId}`;
								}}
							>
								{project.projectName}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>

			<!-- Step 2: Table Selector -->
			<div class="selector-group">
				<span class="selector-label">2. Select Table:</span>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="outline" class="w-[200px] justify-between">
							{tableDisplayName || 'projectTable'}
							<span class="ml-2">▼</span>
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-[200px]">
						<DropdownMenu.Item
							onclick={() => {
								window.location.href = '/dashboard';
							}}
						>
							projectTable
						</DropdownMenu.Item>
						{#each availableTables as table (table.value)}
							<DropdownMenu.Item
								onclick={() => {
									if (selectedProjectId) {
										window.location.href = `/dashboard?project=${selectedProjectId}&table=${table.value}`;
									} else {
										window.location.href = `/dashboard?table=${table.value}`;
									}
								}}
							>
								{table.label}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>

		<!-- Show table when we have data -->
		{#if selectedTable && data.tableData.length > 0}
			<main class="light-card">
				<h2>{tableDisplayName} {selectedProject ? `for ${selectedProject.projectName}` : ''}</h2>
				<DataTable data={data.tableData} {columns} {filterConfig} />
			</main>
		{:else if selectedTable}
			<div class="empty-state">
				<div>
					<h2>No Data</h2>
					<p>
						No data found {selectedProject ? `for ${selectedProject.projectName}` : ''} in {tableDisplayName}
					</p>
				</div>
			</div>
		{:else if data.projects.length === 0}
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
	.light-card {
		background: hsl(0 0% 98%);
		border: 1px solid hsl(0 0% 90%);
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	:global(.dark) .light-card {
		background: hsl(0 0% 12%);
		border-color: hsl(0 0% 20%);
	}
</style>
