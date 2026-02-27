<script lang="ts">
	import { goto } from "$app/navigation";
	import { navigating, page } from "$app/stores";
	import ScoreHero from "../../lib/components/score/ScoreHero.svelte";
	import * as Breadcrumb from "../../lib/components/ui/breadcrumb";
	import { Button } from "../../lib/components/ui/button";
	import * as Card from "../../lib/components/ui/card";
	import DataTable from "../../lib/components/what/DataTable.svelte";
	import FolderTabTrigger from "../../lib/components/what/folder-tab-trigger.svelte";
	import TabsTemplate from "../../lib/components/what/tabs-template.svelte";
	import { getTableLabel, HIDDEN_COLUMNS } from "../../lib/schema-lookup";
	import type { ProjectTable } from "../../lib/types/index";

	interface ScoreReportField {
		Table: string;
		Attribute: string;
		Points: number;
		HasData: boolean;
		Value: unknown;
		DataType: string;
	}

	interface PageData {
		selectedProjectId: string | null;
		selectedTable: string | null;
		projects: ProjectTable[];
		availableTables: { tableName: string }[];
		tableData: Record<string, unknown>[];
		tableCounts: Record<string, number>;
		projectScore?: {
			score: number;
			pointsScored: number;
			pointsAvailible: number;
		} | null;
		scoreReport?: {
			scorePercentage: number;
			totalScoredPoints: number;
			totalPossiblePoints: number;
			percentile?: number | null;
			allFields: ScoreReportField[];
		} | null;
		error?: string | null;
	}
	// test 20 Jan 2026 1:29PM
	let { data }: { data: PageData } = $props();

	let projectSearchQuery = $state("");
	let projectDropdownOpen = $state(false);
	let projectSearchInput: HTMLInputElement;

	const filteredProjects = $derived(
		projectSearchQuery.trim()
			? data.projects.filter((p) => {
					const q = projectSearchQuery.toLowerCase();
					return (
						p.projectName?.toLowerCase().includes(q) ||
						p.projectId?.toLowerCase().includes(q)
					);
				})
			: data.projects,
	);

	function selectProject(project: {
		projectId: string;
		projectName: string | null;
	}) {
		projectSearchQuery = "";
		projectDropdownOpen = false;
		goto(`/what?projectId=${encodeURIComponent(project.projectId)}`);
	}

	function focusProjectSearch() {
		projectSearchInput?.focus();
		projectDropdownOpen = true;
	}

	// Get current selections from URL (derived from page data)
	const selectedProjectId = $derived(data.selectedProjectId);
	const selectedTable = $derived(data.selectedTable);
	const searchParam = $derived($page.url.searchParams.get("search") ?? "");

	const urlProjectId = $derived($page.url.searchParams.get("projectId"));

	// Find selected project by ID
	const selectedProject = $derived(() => {
		return data.projects.find((p) => p.projectId === urlProjectId) ?? null;
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
		...(selectedProject()
			? [
					{
						label: selectedProject()?.projectName,
						href: `/what?projectId=${encodeURIComponent(selectedProject()?.projectId || "")}`,
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
				? `/what?projectId=${encodeURIComponent(urlProjectId)}&table=${encodeURIComponent(tabName)}`
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

		// projectName → always goes to /what project view (projects have no map centroid)
		renderers.projectName = (
			value: unknown,
			row: Record<string, unknown>,
		) => {
			if (!value) return { component: "text", props: { label: "" } };
			const name = String(value);
			const pid = row.projectId ? String(row.projectId) : null;
			return {
				component: pid ? "link" : "text",
				props: pid
					? {
							href: `/what?projectId=${encodeURIComponent(pid)}`,
							label: name,
							class: "text-blue-500 hover:underline",
						}
					: { label: name },
			};
		};

		// landName → link to map view using land name (same URL format as clicking a map marker)
		renderers.landName = (
			value: unknown,
			_row: Record<string, unknown>,
		) => {
			if (!value) return { component: "text", props: { label: "" } };
			return {
				component: "link",
				props: {
					href: `/where?land=${encodeURIComponent(String(value))}`,
					label: String(value),
					class: "text-blue-500 hover:underline",
					title: "View land area on map",
				},
			};
		};

		return renderers;
	});

	const weedsBannerUrl = "/2026-02-26_The_Weeds.webp";
</script>

{#if $navigating}
	<div class="loader-overlay">
		<div class="loader"></div>
	</div>
{/if}

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
	{#if urlProjectId}
		<!-- Normal position: top-left when project is selected -->
		<div class="mb-6 flex items-center gap-3">
			<div class="relative w-full max-w-md">
				<input
					bind:this={projectSearchInput}
					type="text"
					placeholder={selectedProject()?.projectName ||
						"Search projects..."}
					class="w-full px-3 py-2 pr-8 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-ring/50"
					bind:value={projectSearchQuery}
					onfocus={() => (projectDropdownOpen = true)}
				/>
				<!-- Chevron icon -->
				<div
					class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
				>
					<svg
						class="w-4 h-4 text-muted-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
				{#if projectDropdownOpen && filteredProjects.length > 0}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-border bg-background shadow-lg"
						onmousedown={(e) => e.preventDefault()}
					>
						{#each filteredProjects as project (project.projectId)}
							<button
								type="button"
								class="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors truncate {project.projectId ===
								urlProjectId
									? 'bg-accent/50'
									: ''}"
								onclick={() => selectProject(project)}
							>
								{project.projectName || project.projectId}
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<a
				href="/where?projectName={encodeURIComponent(
					selectedProject()?.projectName || '',
				)}"
				role="button"
				class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-accent/50 bg-accent/10 text-accent hover:bg-accent/20 hover:border-accent transition-all duration-200"
			>
				MAP
			</a>
		</div>
	{/if}

	{#if !urlProjectId}
		<!-- Empty state: No project selected -->
		<div class="max-w-2xl mx-auto text-center py-16">
			<div class="mb-8">
				<div
					class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center"
				>
					<svg
						class="w-12 h-12 text-accent"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
				</div>
				<h2 class="text-3xl font-bold mb-4 text-foreground">
					Explore Project Data
				</h2>
				<p class="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
					Select a project to view detailed scores, data tables, and
					insights about restoration efforts.
				</p>
			</div>

			<!-- Centered search input for empty state -->
			<div class="relative w-full max-w-lg mx-auto">
				<input
					bind:this={projectSearchInput}
					type="text"
					placeholder="Search projects..."
					class="w-full px-6 py-4 pr-12 text-lg rounded-lg border-2 border-primary/30 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 shadow-lg transition-all duration-200"
					bind:value={projectSearchQuery}
					onfocus={() => (projectDropdownOpen = true)}
				/>
				<!-- Search icon -->
				<div
					class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
				>
					<svg
						class="w-6 h-6 text-primary/60"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>
				{#if projectDropdownOpen && filteredProjects.length > 0}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="absolute z-20 mt-2 w-full max-h-60 overflow-auto rounded-lg border border-border bg-background shadow-xl"
						onmousedown={(e) => e.preventDefault()}
					>
						{#each filteredProjects as project (project.projectId)}
							<button
								type="button"
								class="w-full px-4 py-3 text-left text-base hover:bg-muted/50 transition-colors truncate {project.projectId ===
								urlProjectId
									? 'bg-accent/50'
									: ''}"
								onclick={() => selectProject(project)}
							>
								{project.projectName || project.projectId}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
				<div class="p-4 rounded-lg bg-muted/30 border border-muted">
					<div
						class="w-8 h-8 mx-auto mb-3 rounded-full bg-accent/20 flex items-center justify-center"
					>
						<svg
							class="w-4 h-4 text-accent"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h3 class="font-semibold mb-2">Project Scores</h3>
					<p class="text-muted-foreground">
						View data completion percentages and quality metrics
					</p>
				</div>
				<div class="p-4 rounded-lg bg-muted/30 border border-muted">
					<div
						class="w-8 h-8 mx-auto mb-3 rounded-full bg-accent/20 flex items-center justify-center"
					>
						<svg
							class="w-4 h-4 text-accent"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<h3 class="font-semibold mb-2">Data Tables</h3>
					<p class="text-muted-foreground">
						Browse lands, crops, plantings, and stakeholder
						information
					</p>
				</div>
				<div class="p-4 rounded-lg bg-muted/30 border border-muted">
					<div
						class="w-8 h-8 mx-auto mb-3 rounded-full bg-accent/20 flex items-center justify-center"
					>
						<svg
							class="w-4 h-4 text-accent"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
							/>
						</svg>
					</div>
					<h3 class="font-semibold mb-2">Map Integration</h3>
					<p class="text-muted-foreground">
						Connect to geographic data and land area visualizations
					</p>
				</div>
			</div>
		</div>
	{:else}
		<div class="max-w-4xl mx-auto">
			{#if data.scoreReport}
				<ScoreHero
					scoreLabel="PROJECT SCORE"
					percentile={data.scoreReport.percentile}
					dataCompletion={Math.round(
						data.scoreReport.scorePercentage,
					)}
					fieldPointsScored={data.scoreReport.totalScoredPoints}
					fieldPointsAvail={data.scoreReport.totalPossiblePoints}
				/>
			{:else}
				<p class="text-sm text-muted-foreground my-4">
					No score calculated for this project yet.
				</p>
			{/if}
		</div>
	{/if}
	<br />

	<div class="relative overflow-hidden mb-2">
		<img
			src={weedsBannerUrl}
			alt="The Weeds"
			class="block h-auto w-[140%] max-w-none sm:w-[130%] md:w-full"
		/>
		<div
			class="absolute bottom-0 left-0 w-full pointer-events-none"
			style="height: 0; overflow: visible;"
		>
			<img
				src="/2026-02-26_Roots.png"
				alt=""
				class="block w-full h-auto"
				style="mix-blend-mode: multiply; opacity: 0.85;"
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
								`/what?projectId=${encodeURIComponent(urlProjectId)}`,
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
									`/what?projectId=${encodeURIComponent(urlProjectId)}&table=${encodeURIComponent(
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
				class="border border-t-0 border-border rounded-b-lg bg-background/50 backdrop-blur-sm px-6 pb-6 pt-4"
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
{#if data.scoreReport}
	{@const scoredFields = data.scoreReport.allFields
		.filter((f) => f.Points > 0)
		.toSorted(
			(a, b) =>
				a.Table.localeCompare(b.Table) ||
				a.Attribute.localeCompare(b.Attribute),
		)}
	<div class="mx-3 mt-8 mb-8 max-w-4xl">
		<div class="flex items-baseline justify-between mb-3">
			<p class="text-lg text-muted-foreground font-mono">
				Score breakdown &mdash; {data.scoreReport.scorePercentage}% ({data
					.scoreReport.totalScoredPoints}&nbsp;/&nbsp;{data
					.scoreReport.totalPossiblePoints} pts)
			</p>
			<button
				class="text-xs font-mono border border-border rounded px-2 py-0.5 transition-all duration-200 text-muted-foreground hover:text-[#FFD700] hover:border-[#FFD700]"
				onclick={() => {
					const header = [
						"Table",
						"Field",
						"Scored",
						"Pts",
						"Sample value",
					].join("\t");
					const rows = scoredFields
						.map((f) =>
							[
								f.Table,
								f.Attribute,
								f.HasData ? f.Points : 0,
								f.Points,
								f.HasData && f.Value != null
									? String(f.Value)
									: "",
							].join("\t"),
						)
						.join("\n");
					navigator.clipboard.writeText(header + "\n" + rows);
				}}>copy</button
			>
		</div>
		<div class="overflow-x-auto rounded border border-border">
			<table
				class="text-xs font-mono"
				style="table-layout: fixed; width: 100%; min-width: 32rem;"
			>
				<colgroup>
					<col style="width: 7rem;" />
					<!-- Table -->
					<col style="width: 8rem;" />
					<!-- Field -->
					<col style="width: 2rem;" />
					<!-- Pts -->
					<col style="width: 3.5rem;" /><!-- Scored -->
					<!-- <col style="width: 3rem;" /> Status -->
					<col />
					<!-- Sample value, takes remaining -->
				</colgroup>
				<thead>
					<tr
						class="border-b border-border bg-muted/40 text-left text-muted-foreground"
					>
						<th class="px-2 py-1.5 truncate">Table</th>
						<th class="px-2 py-1.5 truncate">Field</th>
						<th class="px-2 py-1.5 text-right">Scored</th>
						<th class="px-2 py-1.5 text-right">Pts</th>
						<!-- <th class="px-2 py-1.5 text-center">Status</th> -->
						<th class="px-2 py-1.5 truncate">Sample value</th>
					</tr>
				</thead>
				<tbody>
					{#each scoredFields as field (field.Table + "." + field.Attribute)}
						<tr
							class="border-b border-border/40 last:border-0 {field.HasData
								? ''
								: 'opacity-40'}"
						>
							<td class="px-2 py-0.5 truncate">{field.Table}</td>
							<td class="px-2 py-0.5 truncate"
								>{field.Attribute}</td
							>

							<td class="px-2 py-0.5 text-right">
								{field.HasData ? field.Points : 0}
							</td>
							<td class="px-2 py-0.5 text-right"
								>{field.Points}</td
							>
							<!-- <td class="px-2 py-0.5 text-center"
								>{field.HasData ? "✅" : "❌"}</td
							> -->
							<td
								class="px-2 py-0.5 truncate text-muted-foreground"
							>
								{field.HasData && field.Value != null
									? String(field.Value).substring(0, 50)
									: ""}
							</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr
						class="border-t-2 border-border bg-muted/40 font-semibold"
					>
						<td class="px-2 py-1.5 truncate" colspan="2">Total</td>

						<td class="px-2 py-1.5 text-right">
							{data.scoreReport.totalScoredPoints}
						</td>
						<td class="px-2 py-1.5 text-right"
							>{data.scoreReport.totalPossiblePoints}</td
						>
						<td></td>
					</tr>
				</tfoot>
			</table>
		</div>
	</div>
{/if}

<style>
	.loader-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(6px);
	}

	.loader {
		width: calc(6 * 30px);
		height: 50px;
		display: flex;
		color: #8d7958;
		filter: drop-shadow(30px 25px 0 currentColor)
			drop-shadow(60px 0 0 currentColor)
			drop-shadow(120px 0 0 currentColor);
		clip-path: inset(0 100% 0 0);
		animation: l12 2s infinite steps(7);
	}

	.loader:before {
		content: "";
		width: 30px;
		height: 25px;
		--c: no-repeat radial-gradient(farthest-side, currentColor 92%, #0000);
		background:
			var(--c) left / 70% 70%,
			var(--c) right / 20% 20%,
			var(--c) top 0 right 15% / 20% 20%,
			var(--c) bottom 0 right 15% / 20% 20%;
	}

	@keyframes l12 {
		100% {
			clip-path: inset(0 -30px 0 0);
		}
	}
</style>
