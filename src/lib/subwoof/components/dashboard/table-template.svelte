<script lang="ts">
	import * as ShadTable from '$lib/subwoof/components/ui/table/index.js';
	import * as Tooltip from '$lib/subwoof/components/ui/tooltip';
	import type { Table } from '@tanstack/table-core';
	import { FlexRender } from '../ui/data-table';

	type TableInstance = Table<DataRow>;

	type DataRow = Record<string, unknown>;

	type Props = {
		table: TableInstance;
		totalRows: number;
		onPreviousPage: () => void;
		onNextPage: () => void;
		canPrevious: boolean;
		canNext: boolean;
		columnCount: number;
		emptyColumns: Set<string>;
	};

	let {
		table,
		totalRows,
		onPreviousPage,
		onNextPage,
		canPrevious,
		canNext,
		columnCount,
		emptyColumns
	}: Props = $props();

	// Get width class based on whether column has data
	function getWidthClass(columnId: string): string {
		return emptyColumns.has(columnId) ? 'max-w-10' : 'max-w-28';
	}
</script>

<Tooltip.Provider>
	<div class="border border-border rounded-md overflow-hidden">
		<ShadTable.Root>
			<ShadTable.Header>
				{#each table.getHeaderGroups() as headerGroup}
					<ShadTable.Row>
						{#each headerGroup.headers as header, i}
							<ShadTable.Head
								class="cursor-pointer select-none hover:bg-muted/50 transition-colors {getWidthClass(
									header.id
								)} {i < headerGroup.headers.length - 1 ? 'border-r border-border' : ''}"
								onclick={() => header.column.getToggleSortingHandler()?.({} as MouseEvent)}
							>
								<Tooltip.Root>
									<Tooltip.Trigger class="flex items-center gap-1 w-full cursor-pointer">
										<span class="truncate">
											{String(header.column.columnDef.header ?? '')}
										</span>
										{#if header.column.getIsSorted()}
											<span class="text-xs text-accent flex-shrink-0">
												{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
											</span>
										{/if}
									</Tooltip.Trigger>
									<Tooltip.Content>
										{String(header.column.columnDef.header ?? '')}
									</Tooltip.Content>
								</Tooltip.Root>
							</ShadTable.Head>
						{/each}
					</ShadTable.Row>
				{/each}
			</ShadTable.Header>
			<ShadTable.Body>
				{#if table.getRowModel().rows.length}
					{#each table.getRowModel().rows as row}
						<ShadTable.Row>
							{#each row.getVisibleCells() as cell, i}
								<ShadTable.Cell
									class="text-xs {getWidthClass(cell.column.id)} {i <
									row.getVisibleCells().length - 1
										? 'border-r border-border'
										: ''}"
								>
									<Tooltip.Root>
										<Tooltip.Trigger class="w-full truncate block text-left cursor-default">
											{String(cell.getValue() ?? '')}
										</Tooltip.Trigger>
										<Tooltip.Content>
											{String(cell.getValue() ?? '')}
										</Tooltip.Content>
									</Tooltip.Root>
								</ShadTable.Cell>
							{/each}
						</ShadTable.Row>
					{/each}
				{:else}
					<ShadTable.Row>
						<ShadTable.Cell colspan={columnCount} class="h-24 text-center"
							>No results.</ShadTable.Cell
						>
					</ShadTable.Row>
				{/if}
			</ShadTable.Body>
		</ShadTable.Root>
	</div>
</Tooltip.Provider>

<!-- Pagination -->
<div class="flex items-center justify-end gap-2 py-4">
	<div class="flex-1 text-sm text-muted-foreground">
		{totalRows} row(s) total
	</div>
	<div class="flex gap-2">
		<button
			class="px-4 py-2 text-sm font-medium border border-border bg-background hover:border-accent hover:text-accent transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
			onclick={onPreviousPage}
			disabled={!canPrevious}
		>
			Previous
		</button>
		<button
			class="px-4 py-2 text-sm font-medium border border-border bg-background hover:border-accent hover:text-accent transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
			onclick={onNextPage}
			disabled={!canNext}
		>
			Next
		</button>
	</div>
</div>
