<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import DataTable from "../what/DataTable.svelte";
	import FolderTabTrigger from "../what/folder-tab-trigger.svelte";
	import TabsTemplate from "../what/tabs-template.svelte";
	import { getTableLabel, HIDDEN_COLUMNS } from "$lib/core/schema-lookup.js";
	import type { TopConfig } from "./TopConfig";

	let {
		config,
		availableTables,
		selectedTable,
		tableData,
		tableCounts,
		customRenderers,
		searchConfig,
	}: {
		config: TopConfig;
		availableTables: { tableName: string }[];
		selectedTable: string | null;
		tableData: Record<string, unknown>[];
		tableCounts: Record<string, number>;
		customRenderers?: Record<
			string,
			(value: unknown, row: Record<string, unknown>) => any
		>;
		searchConfig?: {
			columnKey: string;
			placeholder: string;
		};
	} = $props();

	function handleTabChange(tableName: string) {
		const currentParams = new URLSearchParams($page.url.searchParams);
		currentParams.set("table", tableName);
		goto(`?${currentParams.toString()}`);
	}

	const tabCounts = $derived(
		availableTables.reduce(
			(acc, t) => {
				acc[t.tableName] = tableCounts[t.tableName] || 0;
				return acc;
			},
			{} as Record<string, number>,
		),
	);
</script>

{#if config.features.showTables && availableTables.length > 0}
	<div class="mt-6">
		<TabsTemplate value={selectedTable || availableTables[0].tableName}>
			<div slot="tabs-list">
				{#each availableTables as table}
					<FolderTabTrigger
						value={table.tableName}
						label={getTableLabel(table.tableName)}
						count={tabCounts[table.tableName]}
						onclick={() => handleTabChange(table.tableName)}
					/>
				{/each}
			</div>

			<div slot="tabs-content">
				{#if selectedTable}
					<DataTable
						data={tableData}
						tableName={selectedTable}
						hiddenColumns={HIDDEN_COLUMNS[selectedTable] || []}
						{customRenderers}
						{searchConfig}
					/>
				{:else}
					<p class="text-muted-foreground p-4">Select a table to view data</p>
				{/if}
			</div>
		</TabsTemplate>
	</div>
{/if}
