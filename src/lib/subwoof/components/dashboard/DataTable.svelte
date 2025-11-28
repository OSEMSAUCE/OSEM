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

	type FilterConfig = {
		columnKey: string;
		placeholder: string;
	};

	type ColumnOverride = {
		key: string;
		maxWidth?: number; // max characters before truncation
	};

	type Props = {
		data: DataRow[];
		filterConfig?: FilterConfig | null;
		exclude?: string[]; // columns to hide
		overrides?: ColumnOverride[]; // per-column settings like maxWidth
	};

	let { data, filterConfig = null, exclude = [], overrides = [] }: Props = $props();

	// Build column list: show all columns except excluded ones
	const columnList = $derived(() => {
		if (!data || data.length === 0) return [];
		const firstRow = data[0];
		const excludeSet = new Set(exclude);
		const overrideMap = new Map(overrides.map((o) => [o.key, o]));

		return Object.keys(firstRow)
			.filter((key) => !excludeSet.has(key))
			.map((key) => ({
				key,
				header: key,
				maxWidth: overrideMap.get(key)?.maxWidth
			}));
	});

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

	// Helper to truncate text with ellipsis
	function truncate(text: string, maxWidth?: number): string {
		if (!maxWidth || text.length <= maxWidth) return text;
		return text.slice(0, maxWidth) + '…';
	}

	// TanStack Table setup for shadcn table
	const columnDefs: ColumnDef<DataRow>[] = $derived(
		columnList().map((col) => ({
			accessorKey: col.key,
			header: col.header,
			cell: (info: CellContext<DataRow, unknown>) => {
				const value = info.getValue();
				if (value === null || value === undefined) return '';
				return truncate(String(value), col.maxWidth);
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

	<TableTemplate
		table={shadcnTable}
		totalRows={shadcnTable.getFilteredRowModel().rows.length}
		onPreviousPage={() => shadcnTable.previousPage()}
		onNextPage={() => shadcnTable.nextPage()}
		canPrevious={shadcnTable.getCanPreviousPage()}
		canNext={shadcnTable.getCanNextPage()}
		columnCount={columnList().length}
	/>
</div>
