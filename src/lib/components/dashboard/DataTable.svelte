<script lang="ts" generics="TData, TValue">
	import {
		type ColumnDef,
		getCoreRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		getFilteredRowModel,
		type SortingState,
		type ColumnFiltersState,
		type PaginationState
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/tanstackTable';
	import { writable } from 'svelte/store';

	type FilterConfig = {
		columnKey: string;
		placeholder: string;
	};

	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		data: TData[];
		filterConfig?: FilterConfig | null;
	};

	let { data, columns, filterConfig = null }: DataTableProps<TData, TValue> = $props();

	const sorting = writable<SortingState>([]);
	const columnFilters = writable<ColumnFiltersState>([]);
	const pagination = writable<PaginationState>({
		pageIndex: 0,
		pageSize: 10
	});

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
			onPaginationChange: (updater) => {
				if (updater instanceof Function) {
					pagination.update(updater);
				} else {
					pagination.set(updater);
				}
			},
			state: {
				get sorting() {
					return $sorting;
				},
				get columnFilters() {
					return $columnFilters;
				},
				get pagination() {
					return $pagination;
				}
			}
		})
	);
</script>

<div class="w-100">
	<!-- Filters -->
	{#if filterConfig}
		<div class="d-flex align-items-center py-3">
			<input
				type="text"
				class="form-control"
				style="max-width: 24rem;"
				placeholder={filterConfig.placeholder}
				value={table.getColumn(filterConfig.columnKey)?.getFilterValue() ?? ''}
				oninput={(e) => table.getColumn(filterConfig.columnKey)?.setFilterValue(e.currentTarget.value)}
			/>
		</div>
	{/if}

	<!-- Table -->
	<div class="table-responsive border rounded">
		<table class="table table-striped table-hover mb-0">
			<thead>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<tr>
						{#each headerGroup.headers as header (header.id)}
							<th>
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</th>
						{/each}
					</tr>
				{/each}
			</thead>
			<tbody>
				{#if table.getRowModel().rows?.length}
					{#each table.getRowModel().rows as row (row.id)}
						<tr>
							{#each row.getVisibleCells() as cell (cell.id)}
								<td>
									<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								</td>
							{/each}
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan={columns.length} class="text-center py-5">No results.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	<div class="d-flex align-items-center justify-content-between py-3">
		<div class="text-muted small">
			{table.getFilteredRowModel().rows.length} row(s) total.
		</div>
		<div class="d-flex gap-2">
			<button
				class="btn btn-outline-primary btn-sm"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				Previous
			</button>
			<button
				class="btn btn-outline-primary btn-sm"
				onclick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				Next
			</button>
		</div>
	</div>
</div>
