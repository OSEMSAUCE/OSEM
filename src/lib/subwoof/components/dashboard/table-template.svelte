<script lang="ts">
	import {
		Table as ShadcnTable,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '../ui/table';
	import { FlexRender } from '../ui/data-table';

	type DataRow = Record<string, unknown>;

	// Using any for the table type to avoid TanStack import issues
	type TableInstance = any;

	type Props = {
		table: TableInstance;
		totalRows: number;
		onPreviousPage: () => void;
		onNextPage: () => void;
		canPrevious: boolean;
		canNext: boolean;
		columnCount: number;
	};

	let { table, totalRows, onPreviousPage, onNextPage, canPrevious, canNext, columnCount }: Props =
		$props();
</script>

<ShadcnTable>
	<TableHeader>
		{#each table.getHeaderGroups() as headerGroup}
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
		{#if table.getRowModel().rows.length}
			{#each table.getRowModel().rows as row}
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
				<TableCell colspan={columnCount} class="h-24 text-center">No results.</TableCell>
			</TableRow>
		{/if}
	</TableBody>
</ShadcnTable>

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