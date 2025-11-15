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
	import { Input } from '$lib/components/ui/input';

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

<div class="w-full">
	<!-- Filters -->
	{#if filterConfig}
		<div class="filter-container">
			<Input
				placeholder={filterConfig.placeholder}
				type="text"
				value={table.getColumn(filterConfig.columnKey)?.getFilterValue() ?? ''}
				oninput={(e: Event) => table.getColumn(filterConfig.columnKey)?.setFilterValue((e.currentTarget as HTMLInputElement).value)}
			/>
		</div>
	{/if}

	<!-- Table -->
	<div class="table-container">
		<table class="data-table">
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
						<tr data-state={row.getIsSelected() && 'selected'}>
							{#each row.getVisibleCells() as cell (cell.id)}
								<td>
									<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								</td>
							{/each}
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan={columns.length} class="no-results">No results.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	<div class="pagination-container">
		<div class="row-count">
			{table.getFilteredRowModel().rows.length} row(s) total.
		</div>
		<div class="pagination-buttons">
			<button
				class="btn btn-outline"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				Previous
			</button>
			<button
				class="btn btn-outline"
				onclick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				Next
			</button>
		</div>
	</div>
</div>

<style>
	.w-full {
		width: 100%;
	}

	.filter-container {
		padding: 1rem 0;
		max-width: 20rem;
	}

	.table-container {
		border: 1px solid var(--border-color, #ccc);
		border-radius: 0.375rem;
		overflow: hidden;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
	}

	.data-table thead {
		background-color: var(--table-header-bg, #f9fafb);
	}

	.data-table th,
	.data-table td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid var(--border-color, #e5e7eb);
	}

	.data-table tbody tr:hover {
		background-color: var(--table-row-hover, #f9fafb);
	}

	.no-results {
		height: 6rem;
		text-align: center;
	}

	.pagination-container {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 1rem 0;
	}

	.row-count {
		flex: 1;
		font-size: 0.875rem;
		color: var(--muted-foreground, #6b7280);
	}

	.pagination-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		background-color: var(--button-bg, #3b82f6);
		color: var(--button-text, white);
	}

	.btn-outline {
		background-color: transparent;
		color: var(--text-color, #374151);
		border: 1px solid var(--border-color, #d1d5db);
	}

	.btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
