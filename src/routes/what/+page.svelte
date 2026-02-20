<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import DotMatrix from "../../lib/components/score/DotMatrix.svelte";
	import * as Breadcrumb from "../../lib/components/ui/breadcrumb";
	import { Button } from "../../lib/components/ui/button";
	import * as Card from "../../lib/components/ui/card";
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
		projectScore?: {
			score: number;
			pointsScored: number;
			pointsAvailible: number;
		} | null;
		error?: string | null;
	}
	// test 20 Jan 2026 1:29PM
	let { data }: { data: PageData } = $props();

	let projectSearchQuery = $state("");
	let projectDropdownOpen = $state(false);

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
		goto(
			`/what?projectName=${encodeURIComponent(project.projectName || project.projectId)}`,
		);
	}

	// Auto-log detailed score report to console when project is selected
	$effect(() => {
		if (data.selectedProjectId && data.projectScore) {
			// Fetch and display full field breakdown
			fetch(
				`/api/score-report?projectId=${encodeURIComponent(data.selectedProjectId)}`,
			)
				.then((response) => response.json())
				.then((report) => {
					console.log(
						`\n🎯 DETAILED SCORE REPORT for Project: ${data.selectedProjectId}`,
					);
					console.log("=".repeat(80));
					console.log(
						`📊 Score: ${data.projectScore.score.toFixed(1)}% (${data.projectScore.pointsScored}/${data.projectScore.pointsAvailible} points)`,
					);
					console.log("=".repeat(80));

					// Table header
					console.log(
						"Table".padEnd(15) +
							"Attribute".padEnd(25) +
							"Available".padEnd(10) +
							"Points".padEnd(8) +
							"Scored",
					);
					console.log("-".repeat(70));

					let totalPoints = 0;
					let earnedPoints = 0;

					// Display each field
					report.fields.forEach((field) => {
						const table = field.Table.padEnd(15);
						const attribute = field.Attribute.padEnd(25);
						const available = field.Available ? "true" : "false";
						const points = field.Points.toString().padEnd(8);
						const scored = field.Scored ? "1" : "0";

						console.log(
							`${table}${attribute}${available.padEnd(10)}${points}${scored}`,
						);

						totalPoints += field.Points;
						if (field.Scored) earnedPoints += field.Points;
					});

					// Summary
					console.log("-".repeat(70));
					console.log(
						"".padEnd(40) +
							"TOTALS:".padEnd(10) +
							totalPoints.toString().padEnd(8) +
							earnedPoints,
					);
					console.log("=".repeat(80));
				})
				.catch((error) => {
					console.error("Failed to fetch detailed report:", error);
					// Fallback to simple report
					console.log(
						`\n🎯 SCORE REPORT for Project: ${data.selectedProjectId}`,
					);
					console.log(
						`📊 Score: ${data.projectScore.score.toFixed(1)}% (${data.projectScore.pointsScored}/${data.projectScore.pointsAvailible} points)`,
					);
				});
		}
	});

	// Get current selections from URL (derived from page data)
	const selectedProjectId = $derived(data.selectedProjectId);
	const selectedTable = $derived(data.selectedTable);
	const searchParam = $derived($page.url.searchParams.get("search") ?? "");

	// Get project name from URL — clean natural key, no encoded IDs
	const urlProjectName = $derived($page.url.searchParams.get("projectName"));

	// Find selected project by name
	const selectedProject = $derived(() => {
		return (
			data.projects.find((p) => p.projectName === urlProjectName) ?? null
		);
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
						href: `/what?projectName=${encodeURIComponent(selectedProject()?.projectName || "")}`,
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
		if (selectedTable === "ProjectTable" && urlProjectName) {
			return data.tableData.filter(
				(row: any) => row.projectName === urlProjectName,
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
			const href = urlProjectName
				? `/what?projectName=${encodeURIComponent(urlProjectName)}&table=${encodeURIComponent(tabName)}`
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
			_row: Record<string, unknown>,
		) => {
			if (!value) return { component: "text", props: { label: "" } };
			const name = String(value);
			return {
				component: "link",
				props: {
					href: `/what?projectName=${encodeURIComponent(name)}`,
					label: name,
					class: "text-blue-500 hover:underline",
				},
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
		<div class="relative w-full max-w-[28rem]">
			<input
				type="text"
				placeholder={urlProjectName || "Search projects..."}
				class="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
				bind:value={projectSearchQuery}
				onfocus={() => (projectDropdownOpen = true)}
			/>
			{#if projectDropdownOpen && filteredProjects.length > 0}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-border bg-background shadow-lg"
					onmousedown={(e) => e.preventDefault()}
				>
					{#each filteredProjects as project (project.projectId)}
						<button
							type="button"
							class="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors truncate {project.projectName ===
							urlProjectName
								? 'bg-accent'
								: ''}"
							onclick={() => selectProject(project)}
						>
							{project.projectName || project.projectId}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		{#if urlProjectName}
			<a
				href="/where?projectName={encodeURIComponent(urlProjectName)}"
				class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-accent/50 bg-accent/10 text-accent hover:bg-accent/20 hover:border-accent transition-all duration-200"
			>
				MAP
			</a>
		{/if}
	</div>

	<div>
		<DotMatrix text="THE SCORE" />

		<br />
		{#if data.projectScore}
			<div class="my-4 grid grid-cols-3 gap-3">
				<Card.Root>
					<Card.Content class="pt-4 pb-3 text-center">
						<p class="text-3xl font-bold text-accent">
							{data.projectScore.score.toFixed(1)}%
						</p>
						<p class="text-xs text-muted-foreground mt-1">Score</p>
					</Card.Content>
				</Card.Root>
				<Card.Root>
					<Card.Content class="pt-4 pb-3 text-center">
						<p class="text-3xl font-bold">
							{data.projectScore.pointsScored.toLocaleString()}
						</p>
						<p class="text-xs text-muted-foreground mt-1">
							Points Scored
						</p>
					</Card.Content>
				</Card.Root>
				<Card.Root>
					<Card.Content class="pt-4 pb-3 text-center">
						<p class="text-3xl font-bold">
							{data.projectScore.pointsAvailible.toLocaleString()}
						</p>
						<p class="text-xs text-muted-foreground mt-1">
							Points Available
						</p>
					</Card.Content>
				</Card.Root>
			</div>
		{:else if urlProjectName}
			<p class="text-sm text-muted-foreground my-4">
				No score calculated for this project yet.
			</p>
		{/if}

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
						if (urlProjectName) {
							goto(
								`/what?projectName=${encodeURIComponent(urlProjectName)}`,
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
							if (urlProjectName) {
								goto(
									`/what?projectName=${encodeURIComponent(urlProjectName)}&table=${encodeURIComponent(
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
