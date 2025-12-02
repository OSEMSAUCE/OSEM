<script lang="ts">
	import * as ShadTable from '$lib/subwoof/components/ui/table/index.js';
	import * as Tooltip from '$lib/subwoof/components/ui/tooltip';
	import type { Table } from '@tanstack/table-core';
	import { FlexRender } from '../ui/data-table';

	type TableInstance = Table<DataRow>;

	type DataRow = Record<string, unknown>;

	type Props = {
		table: TableInstance;
		totalRows: number;
		onPreviousPage: () => void;
		onNextPage: () => void;
		canPrevious: boolean;
		canNext: boolean;
		columnCount: number;
		columnWidths: Map<string, number>;
		customRenderers?: Record<string, (value: unknown, row: DataRow) => any>;
	};

	let {
		table,
		totalRows,
		onPreviousPage,
		onNextPage,
		canPrevious,
		canNext,
		columnCount,
		columnWidths,
		customRenderers = {}
	}: Props = $props();

	// Get width style based on column content length
	function getWidthStyle(columnId: string): string {
		const width = columnWidths.get(columnId) ?? 10;
		return `max-width: ${width * 4}px; min-width: ${width * 4}px; `;
	}

	// Get header width style - capped to force wrapping
	function getHeaderWidthStyle(columnId: string): string {
		const width = columnWidths.get(columnId) ?? 10;
		const calculatedWidth = width * 4;
		// Cap at 150px to force wrapping for long header names
		const maxWidth = Math.min(calculatedWidth, 150);
		return `max-width: ${maxWidth}px; min-width: ${width * 4}px; `;

	}

	// Format ISO date strings to "28 Nov 2025" format
	function formatCellValue(value: unknown): string {
		if (value === null || value === undefined) return '';
		const str = String(value);
		// Check if it looks like an ISO date (e.g., 2025-11-28T... or 2025-11-28)
		if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(str)) {
			const date = new Date(str);
			if (!isNaN(date.getTime())) {
				return date.toLocaleDateString('en-GB', {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				});
			}
		}
		return str;
	}
</script>

<Tooltip.Provider delayDuration={100}>
	<div class="border border-border rounded-md overflow-hidden">
		<ShadTable.Root>
			<ShadTable.Header>
				{#each table.getHeaderGroups() as headerGroup}
					<ShadTable.Row>
						{#each headerGroup.headers as header, i}
							<ShadTable.Head
								class="cursor-pointer select-none hover:bg-muted/50 transition-colors {i <
								headerGroup.headers.length - 1
									? 'border-r border-border'
									: ''}"
								style="{getHeaderWidthStyle(header.id)} word-break: break-word; white-space: normal; overflow-wrap: break-word;"
								onclick={() => header.column.getToggleSortingHandler()?.({} as MouseEvent)}
							>
								<Tooltip.Root>
									<Tooltip.Trigger class="flex items-center gap-1 w-full cursor-pointer flex-wrap">
										<span class="wrap-break-word" style="white-space: normal;">
											{String(header.column.columnDef.header ?? '')}
										</span>
										{#if header.column.getIsSorted()}
											<span class="text-xs text-accent shrink-0">
												{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
											</span>
										{/if}
									</Tooltip.Trigger>
									<Tooltip.Content>
										{String(header.column.columnDef.header ?? '')}
									</Tooltip.Content>
								</Tooltip.Root>
							</ShadTable.Head>
						{/each}
					</ShadTable.Row>
				{/each}
			</ShadTable.Header>
			<ShadTable.Body>
				{#if table.getRowModel().rows.length}
					{#each table.getRowModel().rows as row}
						<ShadTable.Row>
							{#each row.getVisibleCells() as cell, i}
								<ShadTable.Cell
									class="text-xs {i < row.getVisibleCells().length - 1
										? 'border-r border-border'
										: ''}"
									style={getWidthStyle(cell.column.id)}
								>
									{#if customRenderers && customRenderers[cell.column.id]}
										{@const renderConfig = customRenderers[cell.column.id](
											cell.getValue(),
											row.original
										)}
										{#if renderConfig.component === 'link'}
											<a
												href={renderConfig.props.href}
												class={renderConfig.props.class}
												onclick={(e) => e.stopPropagation()}
											>
												{renderConfig.props.label}
											</a>
										{/if}
									{:else}
										<Tooltip.Root>
											<Tooltip.Trigger class="w-full truncate block text-left cursor-default">
												{formatCellValue(cell.getValue())}
											</Tooltip.Trigger>
											<Tooltip.Content>
												{formatCellValue(cell.getValue())}
											</Tooltip.Content>
										</Tooltip.Root>
									{/if}
								</ShadTable.Cell>
							{/each}
						</ShadTable.Row>
					{/each}
				{:else}
					<ShadTable.Row>
						<ShadTable.Cell colspan={columnCount} class="h-24 text-center"
							>No results.</ShadTable.Cell
						>
					</ShadTable.Row>
				{/if}
			</ShadTable.Body>
		</ShadTable.Root>
	</div>
</Tooltip.Provider>

<!-- Pagination -->
<div class="flex items-center justify-end gap-2 py-4">
	<div class="flex-1 text-sm text-muted-foreground">
		{totalRows} row(s) total
	</div>
	<div class="flex gap-2">
		<button
			class="px-4 py-2 text-sm font-medium border border-border bg-background hover:border-accent hover:text-accent transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
			onclick={onPreviousPage}
			disabled={!canPrevious}
		>
			Previous
		</button>
		<button
			class="px-4 py-2 text-sm font-medium border border-border bg-background hover:border-accent hover:text-accent transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
			onclick={onNextPage}
			disabled={!canNext}
		>
			Next
		</button>
	</div>
</div>
