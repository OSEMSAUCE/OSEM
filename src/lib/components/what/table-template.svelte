<script lang="ts">
	import type { Table } from "@tanstack/table-core";
	import { Button } from "../ui/button";
	import { FlexRender } from "../ui/data-table";
	import * as ShadTable from "../ui/table/index.js";
	import * as Tooltip from "../ui/tooltip";

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
		customRenderers = {},
	}: Props = $props();

	// Unified width style for headers and cells
	function getColumnStyle(columnId: string): string {
		const width = columnWidths.get(columnId) ?? 10;
		// 1. Base calc: existing multiplier (4px)
		// 2. Safety: Enforce minimum 80px width so columns don't collapse on small screens
		const finalWidth = Math.max(width * 4, 80);

		return `max-width: ${finalWidth}px; min-width: ${finalWidth}px; `;
	}

	// Format ISO date strings to "28 Nov 2025" format
	function formatCellValue(value: unknown): string {
		if (value === null || value === undefined) return "";
		const str = String(value);
		// Check if it looks like an ISO date (e.g., 2025-11-28T... or 2025-11-28)
		if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(str)) {
			const date = new Date(str);
			if (!Number.isNaN(date.getTime())) {
				return date.toLocaleDateString("en-GB", {
					day: "numeric",
					month: "short",
					year: "numeric",
				});
			}
		}
		return str;
	}

	function getSafeLinkHref(value: unknown): string | null {
		if (typeof value !== "string") return null;
		const raw = value.trim();
		if (!raw) return null;
		if (!/^https?:\/\//i.test(raw)) return null;
		try {
			const url = new URL(raw);
			if (url.protocol !== "http:" && url.protocol !== "https:")
				return null;
			return url.toString();
		} catch {
			return null;
		}
	}
</script>

<Tooltip.Provider delayDuration={100}>
	<div class=" rounded-md overflow-hidden border border-border">
		<ShadTable.Root>
			<ShadTable.Header>
				{#each table.getHeaderGroups() as headerGroup}
					<ShadTable.Row>
						{#each headerGroup.headers as header, i}
							<ShadTable.Head
								class="cursor-pointer select-none hover:bg-muted/50 hover:text-accent transition-colors {i <
								headerGroup.headers.length - 1
									? 'border-r border-border'
									: ''}"
								style="{getColumnStyle(
									header.id,
								)} word-break: break-word; white-space: normal; overflow-wrap: break-word;"
								onclick={() =>
									header.column.getToggleSortingHandler()?.(
										{} as MouseEvent,
									)}
							>
								<Tooltip.Root>
									<Tooltip.Trigger
										class="flex items-center gap-1 w-full cursor-pointer flex-wrap"
									>
										<span
											class="wrap-break-word"
											style="white-space: normal;"
										>
											{String(
												header.column.columnDef
													.header ?? "",
											)}
										</span>
										{#if header.column.getIsSorted()}
											<span
												class="text-xs text-accent shrink-0"
											>
												{header.column.getIsSorted() ===
												"asc"
													? "↑"
													: "↓"}
											</span>
										{/if}
									</Tooltip.Trigger>
									<Tooltip.Content>
										{String(
											header.column.columnDef.header ??
												"",
										)}
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
									class="text-xs {i <
									row.getVisibleCells().length - 1
										? 'border-r border-border'
										: ''}"
									style={getColumnStyle(cell.column.id)}
								>
									{#if customRenderers && customRenderers[cell.column.id]}
										{@const renderConfig = customRenderers[
											cell.column.id
										](cell.getValue(), row.original)}
										{#if renderConfig.component === "link"}
											<a
												href={renderConfig.props.href}
												class={renderConfig.props.class}
												onclick={(e) =>
													e.stopPropagation()}
											>
												{renderConfig.props.label}
											</a>
										{:else if renderConfig.component === "text"}
											{renderConfig.props?.label ??
												formatCellValue(
													cell.getValue(),
												)}
										{:else}
											{formatCellValue(cell.getValue())}
										{/if}
									{:else}
										<Tooltip.Root>
											<Tooltip.Trigger
												class="w-full truncate block text-left cursor-default"
											>
												{@const linkHref =
													getSafeLinkHref(
														cell.getValue(),
													)}
												{#if linkHref}
													<a
														href={linkHref}
														target="_blank"
														rel="noopener noreferrer"
														class="underline underline-offset-2 text-sky-400 hover:text-sky-500"
														onclick={(e) =>
															e.stopPropagation()}
													>
														{formatCellValue(
															cell.getValue(),
														)}
													</a>
												{:else}
													{formatCellValue(
														cell.getValue(),
													)}
												{/if}
											</Tooltip.Trigger>
											<Tooltip.Content>
												{formatCellValue(
													cell.getValue(),
												)}
											</Tooltip.Content>
										</Tooltip.Root>
									{/if}
								</ShadTable.Cell>
							{/each}
						</ShadTable.Row>
					{/each}
				{:else}
					<ShadTable.Row>
						<ShadTable.Cell
							colspan={columnCount}
							class="h-24 text-center">No results.</ShadTable.Cell
						>
					</ShadTable.Row>
				{/if}
			</ShadTable.Body>
		</ShadTable.Root>
	</div>
</Tooltip.Provider>

<!-- Pagination -->
<div
	class="flex items-center border-t border-t-muted/50 justify-end gap-2 py-4"
>
	<div class="flex-1 text-sm text-muted-foreground">
		{totalRows} row(s) total
	</div>
	<div class="flex gap-2">
		<Button
			variant="outline"
			size="sm"
			onclick={onPreviousPage}
			disabled={!canPrevious}
		>
			Previous
		</Button>
		<Button
			variant="outline"
			size="sm"
			onclick={onNextPage}
			disabled={!canNext}>Next</Button
		>
	</div>
</div>
