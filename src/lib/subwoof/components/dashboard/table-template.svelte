<script lang="ts">
	import * as ShadTable from '$lib/subwoof/components/ui/table/index.js';
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
	};

	let { table, totalRows, onPreviousPage, onNextPage, canPrevious, canNext, columnCount }: Props =
		$props();
</script>

<div class="border border-border rounded-md overflow-hidden">
	<ShadTable.Root>
		<ShadTable.Header>
			{#each table.getHeaderGroups() as headerGroup}
				<ShadTable.Row>
					{#each headerGroup.headers as header, i}
						<ShadTable.Head
							class="cursor-pointer select-none hover:bg-muted/50 transition-colors {i <
							headerGroup.headers.length - 1
								? 'border-r border-border'
								: ''}"
							onclick={() => header.column.getToggleSortingHandler()?.({} as MouseEvent)}
						>
							<div class="flex items-center gap-2">
								<FlexRender
									content={header.column.columnDef.header}
									context={header.getContext()}
								/>
								{#if header.column.getIsSorted()}
									<span class="text-xs text-accent">
										{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
									</span>
								{/if}
							</div>
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
								class="text-xs {i < row.getVisibleCells().length - 1
									? 'border-r border-border'
									: ''}"
							>
								<div class="max-w-28 truncate">
									<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								</div>
							</ShadTable.Cell>
						{/each}
					</ShadTable.Row>
				{/each}
			{:else}
				<ShadTable.Row>
					<ShadTable.Cell colspan={columnCount} class="h-24 text-center">No results.</ShadTable.Cell
					>
				</ShadTable.Row>
			{/if}
		</ShadTable.Body>
	</ShadTable.Root>
</div>

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
