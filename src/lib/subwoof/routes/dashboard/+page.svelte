<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from '$lib/subwoof/components/dashboard/DataTable.svelte';
	import * as Breadcrumb from '$lib/subwoof/components/ui/breadcrumb';
	import * as DropdownMenu from '$lib/subwoof/components/ui/dropdown-menu';
	import * as Tabs from '$lib/subwoof/components/ui/tabs';
	import { Button } from '$lib/subwoof/components/ui/button';
	import * as Card from '$lib/subwoof/components/ui/card';

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

<div class="page-container mx-3">
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

	<div class="mb-6 flex items-center gap-3">
		<span>Select Project:</span>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Button variant="outline">
					{selectedProject?.projectName || 'Choose a project...'}
					<span>▼</span>
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



	<!-- <div class="content"> -->
	{#if data.error}
		<Card.Root class="mb-6 border border-destructive">
			<Card.Content>
				<strong>API Error:</strong>
				{data.error}
				<div class="text-sm text-muted-foreground mt-2">Check browser console for details.</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Tabs define the top edge of the folder - always show when table is selected -->
	{#if selectedTable}
		<div class="mb-6">
			<Tabs.Root value={selectedTable || 'projectTable'}>
				<div class="flex w-full items-end">
				<Tabs.List>
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
				<div class="flex-1 border-b border-border"></div>
			</div>
			</Tabs.Root>
			
			<!-- Content area with borders that connect to the active tab -->
			<div class="border border-t-0 border-border rounded-b-lg bg-background px-6 pb-6 pt-4">
				{#if data.tableData.length > 0}
					<DataTable data={data.tableData} {filterConfig} />
				{:else}
					<div class="text-center py-12">
						<h2 class="text-xl font-semibold mb-2">No Data</h2>
						<p class="text-muted-foreground">
							No data found {selectedProject ? `for ${selectedProject.projectName}` : ''} in {tableDisplayName}
						</p>
					</div>
				{/if}
			</div>
		</div>
	{:else if data.projects.length === 0}
		<Card.Root class="mb-6 bg-card/50">
			<Card.Content class="text-center py-12">
				<h2 class="text-xl font-semibold mb-2">No Projects Available</h2>
				<p class="text-muted-foreground">
					There are no projects to display. Please check the database connection.
				</p>
			</Card.Content>
		</Card.Root>
	{/if}
	<!-- </div> -->
</div>
