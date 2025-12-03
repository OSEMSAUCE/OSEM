<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from '$lib/subwoof/components/what/DataTable.svelte';
	import * as Breadcrumb from '$lib/subwoof/components/ui/breadcrumb';
	import * as DropdownMenu from '$lib/subwoof/components/ui/dropdown-menu';
	import * as Tabs from '$lib/subwoof/components/ui/tabs';
	import { Button } from '$lib/subwoof/components/ui/button';
	import * as Card from '$lib/subwoof/components/ui/card';
	import TabsTemplate from '$lib/subwoof/components/what/tabs-template.svelte';
	import FolderTabTrigger from '$lib/subwoof/components/what/folder-tab-trigger.svelte';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	// Get current selections from URL (derived from page data)
	const selectedProjectId = $derived(data.selectedProjectId);
	const selectedTable = $derived(data.selectedTable);
	const searchParam = $derived($page.url.searchParams.get('search') ?? '');

	// Find selected project
	const selectedProject = $derived(data.projects.find((p) => p.projectId === selectedProjectId));

	// Available tables from data (comes from Supabase)
	const availableTables = $derived(
		data.availableTables
			.filter((table) => table.tableName !== 'organizationLocalTable')
			.map((table) => ({
				value: table.tableName,
				label: table.tableName
			}))
	);

	// Get table display name (use actual table name from database)
	const tableDisplayName = $derived(selectedTable);

	// Update breadcrumb items based on current selections
	const breadcrumbItems = $derived([
		...(selectedProject
			? [
					{
						label: selectedProject.projectName,
						href: `/what?project=${selectedProject.projectId}`
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
						: selectedTable === 'organizationLocalTable'
							? {
									columnKey: 'organizationLocalName',
									placeholder: 'Filter by organization name...'
								}
							: { columnKey: 'landName', placeholder: 'Filter...' }
	);

	// Custom renderers for specific tables
	const customRenderers = $derived(
		selectedTable === 'stakeholderTable'
			? {
					organizationLocalName: (value: unknown, row: Record<string, unknown>) => ({
						component: 'link',
						props: {
							href: `/who?search=${encodeURIComponent(String(value))}`, // Link to dedicated organization page
							label: String(value),
							class: 'text-blue-500 hover:underline'
						}
					})
				}
			: ({} as Record<string, (value: unknown, row: Record<string, unknown>) => any>)
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
							window.location.href = `/what?project=${project.projectId}`;
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
			<TabsTemplate value={selectedTable}>
				<FolderTabTrigger
					value="projectTable"
					onclick={() => {
						window.location.href = '/what';
					}}
				>
					projectTable
				</FolderTabTrigger>
				{#each availableTables as table (table.value)}
					<FolderTabTrigger
						value={table.value}
						onclick={() => {
							if (selectedProjectId) {
								window.location.href = `/what?project=${selectedProjectId}&table=${table.value}`;
							} else {
								window.location.href = `/what?table=${table.value}`;
							}
						}}
					>
						{table.label}
					</FolderTabTrigger>
				{/each}
			</TabsTemplate>

			<!-- Content area with borders that connect to the active tab -->
			<div class="border border-t-0 border-border rounded-b-lg bg-background px-6 pb-6 pt-4">
				{#if data.tableData.length > 0}
					<!-- blacklist columns -->
					<DataTable
						data={data.tableData}
						{filterConfig}
						initialFilterValue={searchParam}
						{customRenderers}
						exclude={[
							'cropId',
							'deleted',
							'landId',
							'lastEditedBy',
							'lastEditedAt',
							'organizationLocalId',
							'parentId',
							'plantingId',
							'polyId',
							'polygon',
							'projectId',
							'parentTable',
							'platformId',
							'sourceId',
							'stakeholderId',
							'randomJson',
							'registryId',

							''
						]}
					/>
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
