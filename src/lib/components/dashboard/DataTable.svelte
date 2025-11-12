<script lang="ts" generics="TData, TValue">
	import {
		type ColumnDef,
		getCoreRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		getFilteredRowModel,
		type SortingState,
		type ColumnFiltersState
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/tanstackTable';
	import * as ShadTable from '$lib/components/ui/shadTable';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { writable } from 'svelte/store';

	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		data: TData[];
	};

	let { data, columns }: DataTableProps<TData, TValue> = $props();

	const sorting = writable<SortingState>([]);
	const columnFilters = writable<ColumnFiltersState>([]);

	const table = $derived(
		createSvelteTable({
			get data() {
				return data;
			},
			columns,
			getCoreRowModel: getCoreRowModel(),
			getPaginationRowModel: getPaginationRowModel(),
			getSortedRowModel: getSortedRowModel(),
			getFilteredRowModel: getFilteredRowModel(),
			onSortingChange: (updater) => {
				if (updater instanceof Function) {
					sorting.update(updater);
				} else {
					sorting.set(updater);
				}
			},
			onColumnFiltersChange: (updater) => {
				if (updater instanceof Function) {
					columnFilters.update(updater);
				} else {
					columnFilters.set(updater);
				}
			},
			state: {
				get sorting() {
					return $sorting;
				},
				get columnFilters() {
					return $columnFilters;
				}
			}
		})
	);
</script>

<div class="w-full">
	<!-- Filters -->
	<div class="flex items-center py-4">
		<Input
			class="max-w-sm"
			placeholder="Filter by land name..."
			type="text"
			value={table.getColumn('landName')?.getFilterValue() ?? ''}
			oninput={(e) => table.getColumn('landName')?.setFilterValue(e.currentTarget.value)}
		/>
	</div>

	<!-- Table -->
	<div class="rounded-md border">
		<ShadTable.RootCn>
			<ShadTable.HeaderCn>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<ShadTable.RowCn>
						{#each headerGroup.headers as header (header.id)}
							<ShadTable.HeadCn>
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</ShadTable.HeadCn>
						{/each}
					</ShadTable.RowCn>
				{/each}
			</ShadTable.HeaderCn>
			<ShadTable.BodyCn>
				{#if table.getRowModel().rows?.length}
					{#each table.getRowModel().rows as row (row.id)}
						<ShadTable.RowCn data-state={row.getIsSelected() && 'selected'}>
							{#each row.getVisibleCells() as cell (cell.id)}
								<ShadTable.CellCn>
									<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								</ShadTable.CellCn>
							{/each}
						</ShadTable.RowCn>
					{/each}
				{:else}
					<ShadTable.RowCn>
						<ShadTable.CellCn colspan={columns.length} class="h-24 text-center"
							>No results.</ShadTable.CellCn
						>
					</ShadTable.RowCn>
				{/if}
			</ShadTable.BodyCn>
		</ShadTable.RootCn>
	</div>

	<!-- Pagination -->
	<div class="flex items-center justify-end space-x-2 py-4">
		<div class="flex-1 text-sm text-muted-foreground">
			{table.getFilteredRowModel().rows.length} row(s) total.
		</div>
		<div class="space-x-2">
			<Button
				variant="outline"
				size="sm"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				Previous
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				Next
			</Button>
		</div>
	</div>
</div>
