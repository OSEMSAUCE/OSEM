<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Breadcrumb from '../../lib/components/ui/breadcrumb';
	import { Button, buttonVariants } from '../../lib/components/ui/button';
	import * as Card from '../../lib/components/ui/card';
	import * as DropdownMenu from '../../lib/components/ui/dropdown-menu';
	import DataTable from '../../lib/components/what/DataTable.svelte';
	import FolderTabTrigger from '../../lib/components/what/folder-tab-trigger.svelte';
	import TabsTemplate from '../../lib/components/what/tabs-template.svelte';
	import { getTableLabel, HIDDEN_COLUMNS } from '../../lib/schema-lookup';
	import type { ProjectTable } from '../../lib/types/index';

	interface PageData {
		selectedProjectId: string | null;
		selectedTable: string | null;
		projects: ProjectTable[];fil
		availableTables: { tableName: string }[];
		tableData: Record<string, unknown>[];
		error?: string | null;
	}
	// test 20 Jan 2026 1:29PM
	let { data }: { data: PageData } = $props();

	console.log('🔍 Page data:', data);

	// Get current selections from URL (derived from page data)
	const selectedProjectId = $derived(data.selectedProjectId);
	const selectedTable = $derived(data.selectedTable);
	const searchParam = $derived($page.url.searchParams.get('search') ?? '');

	// Get project from URL directly
	const urlProjectId = $derived($page.url.searchParams.get('project'));
	const selectedProjectName = $derived(() => {
		if (!urlProjectId) return null;
		const project = data.projects.find((p) => p.projectId === urlProjectId);
		return project?.projectName || urlProjectId;
	});

	// Find selected project
	const selectedProject = $derived(() => {
		console.log('🔍 Looking for selectedProjectId:', data.selectedProjectId);
		console.log(
			'🔍 Available projectIds:',
			data.projects.map((p) => p.projectId)
		);
		const found = data.projects.find((p) => p.projectId === data.selectedProjectId);
		console.log('🔍 Found selectedProject:', found);
		return found;
	});

	// Available tables from data (comes from Supabase)
	const availableTables = $derived(
		data.availableTables
			.filter((table) => table.tableName !== 'OrganizationLocalTable')
			.map((table) => ({
				value: table.tableName,
				label: getTableLabel(table.tableName)
			}))
	);

	// Get table display name (use actual table name from database)
	const tableDisplayName = $derived(selectedTable ? getTableLabel(selectedTable) : null);

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
		selectedTable === 'ProjectTable'
			? { columnKey: 'projectName', placeholder: 'Filter by project name...' }
			: selectedTable === 'LandTable'
				? { columnKey: 'landName', placeholder: 'Filter by land name...' }
				: selectedTable === 'CropTable'
					? { columnKey: 'cropName', placeholder: 'Filter by crop name...' }
					: selectedTable === 'PlantingTable'
						? { columnKey: 'landName', placeholder: 'Filter by land name...' }
						: selectedTable === 'OrganizationLocalTable'
							? {
									columnKey: 'organizationLocalName',
									placeholder: 'Filter by organization name...'
								}
							: { columnKey: 'landName', placeholder: 'Filter...' }
	);

	// Filter table data based on selected project
	const filteredTableData = $derived(() => {
		if (selectedTable === 'ProjectTable' && urlProjectId) {
			return data.tableData.filter((row: any) => row.projectId === urlProjectId);
		}
		return data.tableData;
	});

	// Custom renderers for specific tables
	const customRenderers = $derived(
		selectedTable === 'StakeholderTable'
			? {
					organizationLocalName: (value: unknown, row: Record<string, unknown>) => ({
						component: 'link',
						props: {
							href: `/who?search=${String(value)}`, // Link to dedicated organization page
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
			<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}>
				{selectedProjectName() || 'Choose a project...'}
				<span class="ml-2">▼</span>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-[200px]">
				{#each data.projects as project (project.projectId)}
					<DropdownMenu.Item
						class={project.projectId === urlProjectId ? 'bg-accent' : ''}
						onclick={() => {
							goto(`/what?project=${project.projectId}`);
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
					value="ProjectTable"
					onclick={() => {
						window.location.href = '/what';
					}}
				>
					ProjectTable
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
				{#if filteredTableData().length > 0}
					<DataTable
						data={filteredTableData()}
						{filterConfig}
						initialFilterValue={searchParam}
						{customRenderers}
						exclude={HIDDEN_COLUMNS}
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
