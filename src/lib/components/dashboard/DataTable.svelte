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
					const aVal = a[sortKey];
					const bVal = b[sortKey];
					if (aVal === bVal) return 0;
					const comparison = aVal < bVal ? -1 : 1;
					return sortDirection === 'asc' ? comparison : -comparison;
				})
	);

	// Paginated data
	const paginatedData = $derived(sortedData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize));
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
		<div class="filter-container">
			<Input
				placeholder={filterConfig.placeholder}
				type="text"
				value={filterValue}
				oninput={(e: Event) => (filterValue = (e.currentTarget as HTMLInputElement).value)}
			/>
		</div>
	{/if}

	<!-- Table -->
	<div class="table-container">
		<table class="data-table">
			<thead>
				<tr>
					{#each columns as column}
						<th onclick={() => toggleSort(column.key)} class="sortable">
							{column.header}
							{#if sortKey === column.key}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if paginatedData.length}
					{#each paginatedData as row, i}
						<tr>
							{#each columns as column}
								<td>{getCellValue(row, column)}</td>
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
			{sortedData.length} row(s) total.
		</div>
		<div class="pagination-buttons">
			<button class="btn btn-outline" onclick={previousPage} disabled={!canPrevious}>
				Previous
			</button>
			<button class="btn btn-outline" onclick={nextPage} disabled={!canNext}> Next </button>
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
		background-color: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
	}

	.data-table th,
	.data-table td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid var(--border-color, #e5e7eb);
	}

	.data-table th.sortable {
		cursor: pointer;
		user-select: none;
	}

	.data-table th.sortable:hover {
		background-color: hsl(var(--accent));
	}

	.sort-indicator {
		margin-left: 0.25rem;
		font-size: 0.75rem;
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
