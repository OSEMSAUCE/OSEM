<script lang="ts" generics="TData">
	import { Input } from '$lib/components/ui/input';

	type Column<T> = {
		key: keyof T;
		header: string;
		cell?: (row: T) => string;
	};

	type FilterConfig = {
		columnKey: string;
		placeholder: string;
	};

	type DataTableProps<TData> = {
		columns: Column<TData>[];
		data: TData[];
		filterConfig?: FilterConfig | null;
	};

	let { data, columns, filterConfig = null }: DataTableProps<TData> = $props();

	// State
	let sortKey = $state<keyof TData | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let filterValue = $state('');
	let pageIndex = $state(0);
	const pageSize = 10;

	// Filtered data
	const filteredData = $derived(
		!filterConfig || !filterValue
			? data
			: data.filter((row) => {
					const value = row[filterConfig.columnKey as keyof TData];
					return String(value).toLowerCase().includes(filterValue.toLowerCase());
				})
	);

	// Sorted data
	const sortedData = $derived(
		!sortKey
			? filteredData
			: [...filteredData].sort((a, b) => {
					const key = sortKey as keyof TData;
					const aVal = a[key];
					const bVal = b[key];
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
	function toggleSort(key: keyof TData) {
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

	function getCellValue(row: TData, column: Column<TData>): string {
		if (column.cell) return column.cell(row);
		return String(row[column.key] ?? 'N/A');
	}
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
				class="px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent/30 hover:border-accent transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={previousPage}
				disabled={!canPrevious}
			>
				Previous
			</button>
			<button
				class="px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent/30 hover:border-accent transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={nextPage}
				disabled={!canNext}
			>
				Next
			</button>
		</div>
	</div>
</div>
