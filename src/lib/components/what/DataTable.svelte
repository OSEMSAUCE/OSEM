// new code 12 Jan 2026 12:06PM
<script lang="ts">
	import { Input } from '../ui/input';
	import { createSvelteTable } from '../ui/data-table';
	import TableTemplate from './table-template.svelte';
	import { getAttributeLabel } from '../../config/schema-lookup';
	import {
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		type ColumnDef,
		type SortingState,
		type ColumnFiltersState,
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
		exclude?: readonly string[]; // columns to hide
		overrides?: ColumnOverride[]; // per-column settings like maxWidth
		customRenderers?: Record<string, (value: unknown, row: DataRow) => any>;
		initialFilterValue?: string;
	};
	

	let {
		data,
		filterConfig = null,
		exclude = [],
		overrides = [],
		customRenderers = {},
		initialFilterValue = ''
	}: Props = $props();

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
				header: getAttributeLabel(key),
				maxWidth: overrideMap.get(key)?.maxWidth
			}));
	});

	// State
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let pagination = $state({ pageIndex: 0, pageSize: 5 });
	let filterValue = $state('');

	// Sync local state if the prop changes (e.g. navigation) and satisfy Svelte 5 warning
	$effect(() => {
		filterValue = initialFilterValue;
	});

	// Sync filter input with table column filters
	$effect(() => {
		if (filterConfig) {
			columnFilters = filterValue ? [{ id: filterConfig.columnKey, value: filterValue }] : [];
		}
	});

	// Calculate max content length per column (in characters), capped at 28 chars
	const columnWidths = $derived(() => {
		if (!data || data.length === 0) return new Map<string, number>();
		const widths = new Map<string, number>();
		for (const col of columnList()) {
			let maxLen = String(col.header).length;
			for (const row of data) {
				const val = row[col.key];
				if (val !== null && val !== undefined && val !== '') {
					const len = String(val).length;
					if (len > maxLen) maxLen = len;
				}
			}
			// Convert char length to tailwind width class number (roughly 1 char = 0.5 units, min 10, max 28)
			// Clamp between 10 and 28
			const width = Math.min(28, Math.max(16, Math.ceil(maxLen * 0.6) + 4));
			widths.set(col.key, maxLen === 0 ? 16 : width);
		}
		return widths;
	});

	// TanStack Table setup for shadcn table
	const columnDefs: ColumnDef<DataRow>[] = $derived(
		columnList().map((col) => ({
			accessorKey: col.key,
			header: col.header
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
			},
			get pagination() {
				return pagination;
			}
		},
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
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
		<div class="mb-4 rounded-md max-w-xs">
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
		columnWidths={columnWidths()}
		{customRenderers}
	/>
</div>
