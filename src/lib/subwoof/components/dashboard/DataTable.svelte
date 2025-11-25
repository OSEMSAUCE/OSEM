<script lang="ts">
	import { Input } from '../ui/input';
	import { createSvelteTable, FlexRender } from '../ui/data-table';
	import {
		Table as ShadcnTable,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '../ui/table';
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

	<ShadcnTable>
		<TableHeader>
			{#each shadcnTable.getHeaderGroups() as headerGroup}
				<TableRow>
					{#each headerGroup.headers as header}
						<TableHead
							class="cursor-pointer select-none hover:bg-muted/50 transition-colors"
							onclick={() => header.column.getToggleSortingHandler()?.({} as MouseEvent)}
						>
							<div class="flex items-center gap-2">
								<FlexRender content={header.column.columnDef.header} context={header.getContext()} />
								{#if header.column.getIsSorted()}
									<span class="text-xs text-accent">
										{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
									</span>
								{/if}
							</div>
						</TableHead>
					{/each}
				</TableRow>
			{/each}
		</TableHeader>
		<TableBody>
			{#if shadcnTable.getRowModel().rows.length}
				{#each shadcnTable.getRowModel().rows as row}
					<TableRow>
						{#each row.getVisibleCells() as cell}
							<TableCell>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</TableCell>
						{/each}
					</TableRow>
				{/each}
			{:else}
				<TableRow>
					<TableCell colspan={columns.length} class="h-24 text-center">No results.</TableCell>
				</TableRow>
			{/if}
		</TableBody>
	</ShadcnTable>

	<div class="flex items-center justify-end gap-2 py-4">
		<div class="flex-1 text-sm text-muted-foreground">
			{shadcnTable.getFilteredRowModel().rows.length} row(s) in shadcn table
		</div>
		<div class="flex gap-2">
			<button
				class="px-4 py-2 text-sm font-medium border border-border bg-background hover:border-accent hover:text-accent transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={() => shadcnTable.previousPage()}
				disabled={!shadcnTable.getCanPreviousPage()}
			>
				Previous
			</button>
			<button
				class="px-4 py-2 text-sm font-medium border border-border bg-background hover:border-accent hover:text-accent transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={() => shadcnTable.nextPage()}
				disabled={!shadcnTable.getCanNextPage()}
			>
				Next
			</button>
		</div>
	</div>

	<h1>Custom Table🌏️</h1>
	
	<!-- Table -->
	<div class="rounded-md overflow-hidden border border-border">
		<table>
			<thead>
				<tr>
					{#each columns as column}
						<th onclick={() => toggleSort(column.key)} class="sortable">
							{column.header}
							{#if sortKey === column.key}
								<span class="ml-1 text-xs text-accent">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if paginatedData.length}
					{#each paginatedData as row}
						<tr>
							{#each columns as column}
								<td>{getCellValue(row, column)}</td>
							{/each}
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan={columns.length} class="h-24 text-center">No results.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	<div class="flex items-center justify-end gap-2 py-4">
		<div class="flex-1 text-sm text-muted-foreground">
			{sortedData.length} row(s) total
		</div>
		<div class="flex gap-2">
			<button
				class="px-4 py-2 text-sm font-medium border border-border bg-background hover:border-accent hover:text-accent transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={previousPage}
				disabled={!canPrevious}
			>
				Previous
			</button>
			<button
				class="px-4 py-2 text-sm font-medium border border-border bg-background hover:border-accent hover:text-accent transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={nextPage}
				disabled={!canNext}
			>
				Next
			</button>
		</div>
	</div>
</div>
