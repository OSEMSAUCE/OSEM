<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { Input } from "../../lib/components/ui/input";
	import DataTable from "../../lib/components/what/DataTable.svelte";
	import FolderTabTrigger from "../../lib/components/what/folder-tab-trigger.svelte";
	import TabsTemplate from "../../lib/components/what/tabs-template.svelte";
	import { getTableLabel, HIDDEN_COLUMNS } from "$lib/core/schema-lookup.js";

	interface PageData {
		selectedOrganizationKey: string | null;
		selectedTable: string | null;
		organizations: Record<string, unknown>[];
		availableTables: { tableName: string }[];
		tableData: Record<string, unknown>[];
		tableCounts: Record<string, number>;
		lazy: Promise<{
			tableData: Record<string, unknown>[];
			tableCounts: Record<string, number>;
		}>;
	}

	let { data }: { data: PageData } = $props();
	let organizationSearchQuery = $state("");
	let organizationDropdownOpen = $state(false);
	let organizationSearchInput = $state<HTMLInputElement | undefined>(
		undefined,
	);

	const filteredOrganizations = $derived(
		organizationSearchQuery.trim()
			? data.organizations.filter((org) => {
					const q = organizationSearchQuery.toLowerCase();
					return (
						org.organizationName?.toLowerCase().includes(q) ||
						org.organizationKey?.toLowerCase().includes(q)
					);
				})
			: data.organizations,
	);

	function selectOrganization(org: {
		organizationKey: string;
		organizationName: string | null;
	}) {
		organizationSearchQuery = "";
		organizationDropdownOpen = false;
		goto(`/who?organizationKey=${encodeURIComponent(org.organizationKey)}`);
	}

	function focusOrganizationSearch() {
		organizationSearchInput?.focus();
		organizationDropdownOpen = true;
	}

	const selectedOrganizationKey = $derived(data.selectedOrganizationKey);
	const selectedTable = $derived(data.selectedTable);
	const urlOrganizationKey = $derived(
		$page.url.searchParams.get("organizationKey"),
	);

	const selectedOrganization = $derived(() => {
		return (
			data.organizations.find(
				(org) => org.organizationKey === urlOrganizationKey,
			) ?? null
		);
	});

	const availableTables = $derived(
		data.availableTables
			.filter((table) => table.tableName !== "ProjectTable")
			.map((table) => ({
				value: table.tableName,
				label: getTableLabel(table.tableName),
			})),
	);

	const filteredTableData = $derived(() => {
		if (selectedTable === "OrganizationTable" && urlOrganizationKey) {
			return data.tableData.filter(
				(row: any) => row.organizationKey === urlOrganizationKey,
			);
		}
		return data.tableData;
	});
</script>

<div class="container mx-auto px-4 py-6 max-w-7xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold mb-4">Organizations</h1>

		<div class="relative max-w-md">
			<Input
				type="text"
				placeholder="Search organizations..."
				bind:value={organizationSearchQuery}
				bind:this={organizationSearchInput}
				onfocus={() => (organizationDropdownOpen = true)}
				onblur={() =>
					setTimeout(() => (organizationDropdownOpen = false), 200)}
			/>

			{#if organizationDropdownOpen && filteredOrganizations.length > 0}
				<div
					class="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
				>
					{#each filteredOrganizations.slice(0, 10) as org}
						<button
							type="button"
							class="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground"
							onclick={() =>
								selectOrganization({
									organizationKey:
										org.organizationKey as string,
									organizationName: org.organizationName as
										| string
										| null,
								})}
						>
							<div class="font-medium">
								{org.organizationName || org.organizationKey}
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	{#await data.lazy}
		<div class="mb-6">
			<TabsTemplate value={selectedTable || "OrganizationTable"}>
				<FolderTabTrigger value="OrganizationTable">
					{getTableLabel("OrganizationTable")}
				</FolderTabTrigger>
				{#each availableTables as table}
					<FolderTabTrigger value={table.value}
						>{table.label}</FolderTabTrigger
					>
				{/each}
			</TabsTemplate>
		</div>
		<p class="text-muted-foreground">Loading...</p>
	{:then lazy}
		{@const tData = lazy.tableData}
		{@const tCounts = lazy.tableCounts}
		{@const hasData = (t: string) => (tCounts?.[t] ?? 0) > 0}
		{@const rows =
			selectedTable === "OrganizationTable" && urlOrganizationKey
				? tData.filter(
						(row: any) =>
							row.organizationKey === urlOrganizationKey,
					)
				: tData}

		<div class="mb-6">
			<TabsTemplate value={selectedTable || "OrganizationTable"}>
				<FolderTabTrigger
					value="OrganizationTable"
					class={hasData("OrganizationTable")
						? "hover:text-accent"
						: "opacity-50 pointer-events-none"}
					onclick={() =>
						urlOrganizationKey
							? goto(
									`/who?organizationKey=${urlOrganizationKey}&table=OrganizationTable`,
									{ noScroll: true },
								)
							: goto("/who", { noScroll: true })}
				>
					{getTableLabel("OrganizationTable")}
				</FolderTabTrigger>
				{#each availableTables as table}
					<FolderTabTrigger
						value={table.value}
						class={hasData(table.value)
							? "hover:text-accent"
							: "opacity-50 pointer-events-none"}
						onclick={() =>
							goto(`/who?table=${table.value}`, {
								noScroll: true,
							})}
					>
						{table.label}
					</FolderTabTrigger>
				{/each}
			</TabsTemplate>
		</div>

		<DataTable
			data={rows}
			hiddenColumns={HIDDEN_COLUMNS[
				selectedTable || "OrganizationTable"
			] || []}
		/>
	{/await}
</div>
