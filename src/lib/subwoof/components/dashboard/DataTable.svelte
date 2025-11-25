<script lang="ts">
	import { Input } from '../ui/input';
	import { createSvelteTable, FlexRender } from '../ui/data-table';
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
	let sortKey = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let filterValue = $state('');
	let pageIndex = $state(0);
	const pageSize = 10;

	// Filtered data
	const filteredData = $derived(
		!filterConfig || !filterValue
			? data
			: data.filter((row) => {
					const value = row[filterConfig.columnKey];
					return String(value).toLowerCase().includes(filterValue.toLowerCase());
				})
	);

	// Sorted data
	const sortedData = $derived(
		!sortKey
			? filteredData
			: [...filteredData].sort((a, b) => {
					const aVal = a[sortKey];
					const bVal = b[sortKey];
					if (aVal === bVal) return 0;
					const comparison = aVal < bVal ? -1 : 1;
					return sortDirection === 'asc' ? comparison : -comparison;
				})
	);

	// Paginated data
	const paginatedData = $derived(
		sortedData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
	);
	const totalPages = $derived(Math.ceil(sortedData.length / pageSize));
	const canPrevious = $derived(pageIndex > 0);
	const canNext = $derived(pageIndex < totalPages - 1);

	// Handlers
	function toggleSort(key: string) {
		if (sortKey === key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDirection = 'asc';
		}
	}

	function previousPage() {
		if (canPrevious) pageIndex--;
	}

	function nextPage() {
		if (canNext) pageIndex++;
	}

	function getCellValue(row: DataRow, column: Column): string {
		if (column.cell) return column.cell(row);
		return String(row[column.key] ?? 'N/A');
	}

	// TanStack Table setup for shadcn table
	const columnDefs: ColumnDef<DataRow>[] = columns.map((col) => ({
		accessorKey: col.key,
		header: col.header,
		cell: (info: CellContext<DataRow, unknown>) => {
			if (col.cell) {
				return col.cell(info.row.original);
			}
			return String(info.getValue() ?? 'N/A');
		}
	}));

	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);

	const shadcnTable = createSvelteTable({
		data,
		columns: columnDefs,
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

<div class="w-full">
	<!-- Filters -->
	{#if filterConfig}
		<div class="mb-4 max-w-xs">
			<Input
				placeholder={filterConfig.placeholder}
				type="text"
				value={filterValue}
				oninput={(e: Event) => (filterValue = (e.currentTarget as HTMLInputElement).value)}
				class="border-border focus:border-accent hover:border-accent/50 transition-colors"
			/>
		</div>
	{/if}

	<h1>Shadcn Table (TanStack)🌏️</h1>

	<TableTemplate
		table={shadcnTable}
		totalRows={sortedData.length}
		onPreviousPage={previousPage}
		onNextPage={nextPage}
		{canPrevious}
		{canNext}
		columnCount={columns.length}
	/>
</div>
