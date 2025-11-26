<script lang="ts">
	import { Input } from '../ui/input';
	import { createSvelteTable } from '../ui/data-table';
	import TableTemplate from './table-template.svelte';
	import {
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		type ColumnDef,
		type SortingState,
		type ColumnFiltersState,
		type CellContext,
		type Updater
	} from '@tanstack/table-core';

	type DataRow = Record<string, unknown>;

	type Column = {
		key: string;
		header: string;
		cell?: (row: DataRow) => string;
	};

	type FilterConfig = {
		columnKey: string;
		placeholder: string;
	};

	type Props = {
		columns: Column[];
		data: DataRow[];
		filterConfig?: FilterConfig | null;
	};

	let { data, columns, filterConfig = null }: Props = $props();

	// State
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let filterValue = $state('');

	// Sync filter input with table column filters
	$effect(() => {
		if (filterConfig) {
			columnFilters = filterValue ? [{ id: filterConfig.columnKey, value: filterValue }] : [];
		}
	});

	// TanStack Table setup for shadcn table
	const columnDefs: ColumnDef<DataRow>[] = $derived(
		columns.map((col) => ({
			accessorKey: col.key,
			header: col.header,
			cell: (info: CellContext<DataRow, unknown>) => {
				if (col.cell) {
					return col.cell(info.row.original);
				}
				return String(info.getValue() ?? 'N/A');
			}
		}))
	);

	const shadcnTable = createSvelteTable({
		get data() {
			return data;
		},
		get columns() {
			return columnDefs;
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: (updater: Updater<SortingState>) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		state: {
			get sorting() {
				return sorting;
			},
			get columnFilters() {
				return columnFilters;
			}
		},
		initialState: {
			pagination: {
				pageSize: 5
			}
		}
	});
</script>

<div>
	<!-- Filters -->
	{#if filterConfig}
		<div class="mb-4 max-w-xs">
			<Input
				placeholder={filterConfig.placeholder}
				type="text"
				value={filterValue}
				oninput={(e: Event) => (filterValue = (e.currentTarget as HTMLInputElement).value)}
			/>
		</div>
	{/if}

	<h1>Shadcn Table (TanStack)🌏️</h1>

	<TableTemplate
		table={shadcnTable}
		totalRows={shadcnTable.getFilteredRowModel().rows.length}
		onPreviousPage={() => shadcnTable.previousPage()}
		onNextPage={() => shadcnTable.nextPage()}
		canPrevious={shadcnTable.getCanPreviousPage()}
		canNext={shadcnTable.getCanNextPage()}
		columnCount={columns.length}
	/>
</div>
