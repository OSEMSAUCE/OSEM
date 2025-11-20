<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from '$lib/components/dashboard/DataTable.svelte';
	import { columns as landColumns } from '$lib/components/dashboard/columns/landColumns';
	import { columns as cropColumns } from '$lib/components/dashboard/columns/cropColumns';
	import { columns as plantingColumns } from '$lib/components/dashboard/columns/plantingColumns';
	import { columns as projectColumns } from '$lib/components/dashboard/columns/projectColumns';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Tabs from '$lib/components/ui/tabs';
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
			: [{ label: 'Select project' }]),
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

<div class="container mx-auto p-4">
	<Breadcrumb.Breadcrumb class="py-4 p">
		<Breadcrumb.BreadcrumbList>
			{#each breadcrumbItems as item, index}
				<Breadcrumb.BreadcrumbItem>
					{#if index === breadcrumbItems.length - 1}
						<Breadcrumb.BreadcrumbPage>{item.label}</Breadcrumb.BreadcrumbPage>
					{:else if item.href}
						<Breadcrumb.BreadcrumbLink href={item.href}>{item.label}</Breadcrumb.BreadcrumbLink>
					{:else}
						{item.label}
					{/if}
				</Breadcrumb.BreadcrumbItem>
				{#if index < breadcrumbItems.length - 1}
					<Breadcrumb.BreadcrumbSeparator />
				{/if}
			{/each}
		</Breadcrumb.BreadcrumbList>
	</Breadcrumb.Breadcrumb>

	<div class="content">
		{#if data.error}
			<div class="bg-card text-card-foreground border rounded-lg p-6 mb-6">
				<div class="warning-banner">
					<strong>API Error:</strong>
					{data.error}
					<br />
					<small>Check browser console for details.</small>
				</div>
			</div>
		{/if}

		<!-- Two-step selection: Project then Table -->
		<div class="bg-card text-card-foreground border rounded-lg p-6 mb-6 flex items-center gap-8">
			<!-- Step 1: Project Selector -->
			<div class="selector-group">
				<span class="selector-label">Select Project:</span>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="outline" class="w-[200px] justify-between hover:bg-muted/30">
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
				<span class="selector-label">Select Table:</span>
				<Tabs.Root value={selectedTable || 'projectTable'} class="w-full">
					<Tabs.List
						class="grid w-full"
						style="grid-template-columns: repeat({availableTables.length + 1}, 1fr);"
					>
						<Tabs.Trigger
							value="projectTable"
							onclick={() => {
								window.location.href = '/dashboard';
							}}
						>
							projectTable
						</Tabs.Trigger>
						{#each availableTables as table (table.value)}
							<Tabs.Trigger
								value={table.value}
								onclick={() => {
									if (selectedProjectId) {
										window.location.href = `/dashboard?project=${selectedProjectId}&table=${table.value}`;
									} else {
										window.location.href = `/dashboard?table=${table.value}`;
									}
								}}
							>
								{table.label}
							</Tabs.Trigger>
						{/each}
					</Tabs.List>
				</Tabs.Root>
			</div>
		</div>

		<!-- Show table when we have data -->
		{#if selectedTable && data.tableData.length > 0}
			<main class="bg-card text-card-foreground border rounded-lg p-6 mb-6">
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
