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

	type Props = {
		data: DataRow[];
		filterConfig?: FilterConfig | null;
	};

	let { data, filterConfig = null }: Props = $props();

	// Utility: Convert camelCase to Title Case
	function toTitleCase(str: string): string {
		return str
			.replace(/([A-Z])/g, ' $1') // Add space before capitals
			.replace(/^./, (s) => s.toUpperCase()) // Capitalize first letter
			.trim();
	}

	// Auto-generate columns from data keys
	const autoColumns = $derived(() => {
		if (!data || data.length === 0) return [];
		const firstRow = data[0];
		return Object.keys(firstRow).map((key) => ({
			key,
			header: toTitleCase(key)
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

	// TanStack Table setup for shadcn table
	const columnDefs: ColumnDef<DataRow>[] = $derived(
		autoColumns().map((col) => ({
			accessorKey: col.key,
			header: col.header,
			cell: (info: CellContext<DataRow, unknown>) => {
				const value = info.getValue();
				// Show actual value from database (null, empty string, etc.)
				return value === null || value === undefined ? '' : String(value);
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
		columnCount={autoColumns().length}
	/>

</div>
