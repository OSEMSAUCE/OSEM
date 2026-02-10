<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import DotMatrix from "../../lib/components/score/DotMatrix.svelte";
	import * as Breadcrumb from "../../lib/components/ui/breadcrumb";
	import { Button, buttonVariants } from "../../lib/components/ui/button";
	import * as Card from "../../lib/components/ui/card";
	import * as DropdownMenu from "../../lib/components/ui/dropdown-menu";
	import DataTable from "../../lib/components/what/DataTable.svelte";
	import FolderTabTrigger from "../../lib/components/what/folder-tab-trigger.svelte";
	import TabsTemplate from "../../lib/components/what/tabs-template.svelte";
	import { getTableLabel, HIDDEN_COLUMNS } from "../../lib/schema-lookup";
	import type { ProjectTable } from "../../lib/types/index";

	interface PageData {
		selectedProjectId: string | null;
		selectedTable: string | null;
		projects: ProjectTable[];
		availableTables: { tableName: string }[];
		tableData: Record<string, unknown>[];
		tableCounts: Record<string, number>;
		error?: string | null;
	}
	// test 20 Jan 2026 1:29PM
	let { data }: { data: PageData } = $props();

	// Get current selections from URL (derived from page data)
	const selectedProjectId = $derived(data.selectedProjectId);
	const selectedTable = $derived(data.selectedTable);
	const searchParam = $derived($page.url.searchParams.get("search") ?? "");

	// Get project from URL directly
	const urlProjectId = $derived($page.url.searchParams.get("project"));
	const selectedProjectName = $derived(() => {
		if (!urlProjectId) return null;
		// Try to find project by matching the decoded URL or exact match
		const decodedUrlProjectId = decodeURIComponent(urlProjectId);
		const project = data.projects.find(
			(p) =>
				p.projectId === urlProjectId ||
				p.projectId === decodedUrlProjectId ||
				p.projectId === encodeURIComponent(urlProjectId),
		);
		return project?.projectName || urlProjectId;
	});

	// Find selected project
	const selectedProject = $derived(() => {
		const found = data.projects.find(
			(p) => p.projectId === data.selectedProjectId,
		);

		return found;
	});

	// Available tables from data (comes from Supabase)
	const availableTables = $derived(
		data.availableTables
			.filter((table) => table.tableName !== "OrganizationLocalTable")
			.map((table) => ({
				value: table.tableName,
				label: getTableLabel(table.tableName),
			})),
	);

	// Get table display name (use actual table name from database)
	const tableDisplayName = $derived(
		selectedTable ? getTableLabel(selectedTable) : null,
	);

	const hasTableData = (tableName: string): boolean => {
		return (data.tableCounts?.[tableName] ?? 0) > 0;
	};

	// Update breadcrumb items based on current selections
	const breadcrumbItems = $derived([
		...(selectedProject
			? [
					{
						label: selectedProject()?.projectName,
						href: `/what?project=${selectedProject()?.projectId}`,
					},
				]
			: [{ label: "Select project" }]),
		...(selectedTable && tableDisplayName
			? [{ label: tableDisplayName }]
			: []),
	]);

	// Get filter config based on table type
	const filterConfig = $derived(
		selectedTable === "ProjectTable"
			? {
					columnKey: "projectName",
					placeholder: "Filter by project name...",
				}
			: selectedTable === "LandTable"
				? {
						columnKey: "landName",
						placeholder: "Filter by land name...",
					}
				: selectedTable === "CropTable"
					? {
							columnKey: "cropName",
							placeholder: "Filter by crop name...",
						}
					: selectedTable === "PlantingTable"
						? {
								columnKey: "landName",
								placeholder: "Filter by land name...",
							}
						: selectedTable === "OrganizationLocalTable"
							? {
									columnKey: "organizationLocalName",
									placeholder:
										"Filter by organization name...",
								}
							: {
									columnKey: "landName",
									placeholder: "Filter...",
								},
	);

	// Filter table data based on selected project
	const filteredTableData = $derived(() => {
		if (selectedTable === "ProjectTable" && urlProjectId) {
			return data.tableData.filter(
				(row: any) => row.projectId === urlProjectId,
			);
		}
		// UniqueTable: expand randomJson keys into individual columns
		if (selectedTable === "UniqueTable") {
			return data.tableData
				.filter((row: any) => row.randomJson)
				.map((row: any) => {
					let parsed: Record<string, unknown> = {};
					try {
						parsed = JSON.parse(row.randomJson);
					} catch {
						return { parentTable: row.parentTable };
					}
					return {
						parentTable: row.parentTable,
						...parsed,
					};
				});
		}
		return data.tableData;
	});

	// Map lowercase DB parentTable values to PascalCase tab names
	const parentTableToTab: Record<string, string> = {
		projectTable: "ProjectTable",
		landTable: "LandTable",
		cropTable: "CropTable",
		plantingTable: "PlantingTable",
		stakeholderTable: "StakeholderTable",
		sourceTable: "SourceTable",
		polyTable: "PolyTable",
	};

	// Custom renderers — applied to all tables that have these columns
	const customRenderers = $derived(() => {
		const renderers: Record<
			string,
			(value: unknown, row: Record<string, unknown>) => any
		> = {};

		// parentTable → link to that tab (e.g. "projectTable" → Projects tab)
		renderers.parentTable = (
			value: unknown,
			row: Record<string, unknown>,
		) => {
			const tabName = parentTableToTab[String(value)];
			if (!tabName)
				return { component: "text", props: { label: String(value) } };
			const href = urlProjectId
				? `/what?project=${encodeURIComponent(urlProjectId)}&table=${encodeURIComponent(tabName)}`
				: `/what?table=${encodeURIComponent(tabName)}`;
			return {
				component: "link",
				props: {
					href,
					label: getTableLabel(tabName),
					class: "text-blue-500 hover:underline",
				},
			};
		};

		// platform → link to /who org search
		renderers.platform = (
			value: unknown,
			_row: Record<string, unknown>,
		) => {
			if (!value) return { component: "text", props: { label: "" } };
			return {
				component: "link",
				props: {
					href: `/who?search=${encodeURIComponent(String(value))}`,
					label: String(value),
					class: "text-blue-500 hover:underline",
				},
			};
		};

		// organizationLocalName → link to /who org search (on StakeholderTable)
		if (selectedTable === "StakeholderTable") {
			renderers.organizationLocalName = (
				value: unknown,
				_row: Record<string, unknown>,
			) => ({
				component: "link",
				props: {
					href: `/who?search=${encodeURIComponent(String(value))}`,
					label: String(value),
					class: "text-blue-500 hover:underline",
				},
			});
		}

		return renderers;
	});

	const weedsBannerUrl = "/THE_WEEDS_banner.webp";
</script>

<div class="page-container mx-3">
	<Breadcrumb.Breadcrumb class="py-4 p">
		<Breadcrumb.BreadcrumbList>
			{#each breadcrumbItems as item, index}
				<Breadcrumb.BreadcrumbItem>
					{#if index === breadcrumbItems.length - 1}
						<Breadcrumb.BreadcrumbPage
							>{item.label}</Breadcrumb.BreadcrumbPage
						>
					{:else if item.href}
						<Breadcrumb.BreadcrumbLink href={item.href}
							>{item.label}</Breadcrumb.BreadcrumbLink
						>
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
			<DropdownMenu.Trigger
				class={buttonVariants({ variant: "outline" })}
			>
				<span class="truncate max-w-[22rem] block"
					>{selectedProjectName() || "Choose a project..."}</span
				>
				<span class="ml-2 flex-shrink-0">▼</span>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-fit max-w-[22rem]">
				{#each data.projects as project (project.projectId)}
					<DropdownMenu.Item
						class={project.projectId === urlProjectId
							? "bg-accent"
							: ""}
						onclick={() => {
							goto(`/what?project=${project.projectId}`);
						}}
					>
						{project.projectName || project.projectId}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<div>
		<DotMatrix text="The Score" />
		<br />
		<br />

		<br />
		<br />
		<div class="overflow-hidden mb-2">
			<img
				src={weedsBannerUrl}
				alt="The Weeds"
				class="block h-auto w-[140%] max-w-none sm:w-[130%] md:w-full"
			/>
		</div>
	</div>

	{#if data.error}
		<Card.Root class="mb-6 group hover:border-accent transition-colors">
			<Card.Content class="group-hover:text-accent transition-colors">
				<strong>API Error:</strong>
				{data.error}
				<div class="text-sm text-muted-foreground mt-2">
					Check browser console for details.
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	{#if selectedTable}
		<div class="mb-6">
			<TabsTemplate value={selectedTable}>
				<FolderTabTrigger
					value="ProjectTable"
					class={hasTableData("ProjectTable")
						? "hover:text-accent"
						: "opacity-50 pointer-events-none hover:bg-muted/80 hover:text-muted-foreground data-[state=active]:bg-muted/80 data-[state=active]:text-muted-foreground"}
					onclick={() => {
						if (urlProjectId) {
							goto(
								`/what?project=${encodeURIComponent(urlProjectId)}`,
								{ noScroll: true },
							);
						} else {
							goto("/what", { noScroll: true });
						}
					}}
				>
					{getTableLabel("ProjectTable")}
				</FolderTabTrigger>
				{#each availableTables as table (table.value)}
					<FolderTabTrigger
						value={table.value}
						class={hasTableData(table.value)
							? "hover:text-accent"
							: "opacity-50 pointer-events-none hover:bg-muted/80 hover:text-muted-foreground data-[state=active]:bg-muted/80 data-[state=active]:text-muted-foreground"}
						onclick={() => {
							if (urlProjectId) {
								goto(
									`/what?project=${encodeURIComponent(urlProjectId)}&table=${encodeURIComponent(
										table.value,
									)}`,
									{ noScroll: true },
								);
							} else {
								goto(
									`/what?table=${encodeURIComponent(table.value)}`,
									{ noScroll: true },
								);
							}
						}}
					>
						{table.label}
					</FolderTabTrigger>
				{/each}
			</TabsTemplate>

			<div
				class="border border-t-0 border-border rounded-b-lg bg-background px-6 pb-6 pt-4"
			>
				{#if filteredTableData().length > 0}
					<DataTable
						data={filteredTableData()}
						{filterConfig}
						initialFilterValue={searchParam}
						customRenderers={customRenderers()}
						exclude={HIDDEN_COLUMNS}
					/>
				{:else}
					<div class="text-center py-12">
						<h2 class="text-xl font-semibold mb-2">No Data</h2>
						<p class="text-muted-foreground">
							No data found {selectedProject
								? `for ${selectedProject()?.projectName}`
								: ""} in {tableDisplayName}
						</p>
					</div>
				{/if}
			</div>
		</div>
	{:else if data.projects.length === 0}
		<Card.Root class="mb-6 bg-card/50">
			<Card.Content class="text-center py-12">
				<h2 class="text-xl font-semibold mb-2">
					No Projects Available
				</h2>
				<p class="text-muted-foreground">
					There are no projects to display. Please check the database
					connection.
				</p>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
