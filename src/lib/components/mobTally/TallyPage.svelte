<script lang="ts">
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import * as Table from "$osem/components/ui/table";
	import * as Accordion from "$osem/components/ui/accordion";
	import { Button } from "$osem/components/ui/button";
	import { Input } from "$osem/components/ui/input";
	import { Plus, Check } from "lucide-svelte";
	import { toast } from "svelte-sonner";

	const STORAGE_KEY = "tally-data";

	interface TallyRow {
		id: string;
		speciesCode: string;
		seedlot: string;
		treesPerBundle: number | null;
		bundleCount: number | null;
		count: number | null;
		total: number | null;
		committedAt?: string;
	}

	interface TallyData {
		activeRows: TallyRow[];
		committedRows: TallyRow[];
	}

	function createEmptyRow(): TallyRow {
		return {
			id: crypto.randomUUID(),
			speciesCode: "",
			seedlot: "",
			treesPerBundle: null,
			bundleCount: null,
			count: null,
			total: null,
		};
	}

	function copyRow(source: TallyRow): TallyRow {
		return {
			...source,
			id: crypto.randomUUID(),
		};
	}

	function loadFromStorage(): TallyData {
		if (!browser)
			return { activeRows: [createEmptyRow()], committedRows: [] };
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const data = JSON.parse(stored) as TallyData;
				if (data.activeRows.length === 0) {
					data.activeRows = [createEmptyRow()];
				}
				return data;
			}
		} catch (e) {
			console.error("Failed to load tally data:", e);
		}
		return { activeRows: [createEmptyRow()], committedRows: [] };
	}

	function saveToStorage() {
		if (!browser) return;
		try {
			const data: TallyData = { activeRows, committedRows };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch (e) {
			console.error("Failed to save tally data:", e);
		}
	}

	let activeRows = $state<TallyRow[]>([createEmptyRow()]);
	let committedRows = $state<TallyRow[]>([]);
	let expandedSection = $state<string | null>(null);

	onMount(() => {
		const data = loadFromStorage();
		activeRows = data.activeRows;
		committedRows = data.committedRows;
	});

	$effect(() => {
		saveToStorage();
	});

	function addNewRow() {
		const lastRow = activeRows[activeRows.length - 1];
		activeRows = [...activeRows, copyRow(lastRow)];
	}

	function commitRow(index: number) {
		const row = activeRows[index];

		// Warn if trying to commit same row twice (check if it's already in committed)
		const isDuplicate = committedRows.some(
			(r) =>
				r.speciesCode === row.speciesCode &&
				r.seedlot === row.seedlot &&
				r.treesPerBundle === row.treesPerBundle &&
				r.count === row.count,
		);

		if (isDuplicate) {
			toast.warning("This looks like a duplicate entry. Are you sure?");
			return;
		}

		committedRows = [
			...committedRows,
			{
				...row,
				id: crypto.randomUUID(),
				committedAt: new Date().toISOString(),
			},
		];
		activeRows = activeRows.filter((_, i) => i !== index);

		if (activeRows.length === 0) {
			activeRows = [createEmptyRow()];
		}

		toast.success("Row committed");
	}

	function toggleSection(section: string) {
		expandedSection = expandedSection === section ? null : section;
	}
</script>

<div class="tally-page min-h-screen bg-background py-2">
	<h1 class="text-xl font-semibold mb-4 text-foreground">Tally Entry</h1>

	<!-- Active Entry Table -->
	<div class="tally-entry-section mb-8 rounded-xl bg-card shadow-lg p-1">
		<!-- Header -->
		<div class="flex bg-muted/30 rounded-lg mb-3">
			<span class="flex-1 text-center py-2 text-sm">Seedlot</span>
			<span class="flex-1 text-center py-1 text-sm">
				<div class="leading-tight">
					<div>trees per</div>
					<div>bundle / box</div>
				</div>
			</span>
			<span class="flex-1 text-center py-2 text-sm">count</span>
			<span class="flex-1 text-center py-2 text-sm">total</span>
			<span class="w-10"></span>
		</div>

		<!-- Rows -->
		<div class="flex flex-col gap-3">
			{#each activeRows as row, index (row.id)}
				<div class="flex gap-0.5 items-center">
					<Input
						bind:value={row.seedlot}
						placeholder="seedlot"
						class="h-10 text-base shadow-sm flex-1 px-1"
					/>
					<Input
						type="number"
						bind:value={row.treesPerBundle}
						placeholder="15"
						class="h-10 text-base text-center shadow-sm flex-1 px-1"
					/>
					<Input
						type="number"
						bind:value={row.bundleCount}
						placeholder="10"
						class="h-10 text-base text-center shadow-sm flex-1 px-1"
					/>
					<Input
						type="number"
						bind:value={row.count}
						placeholder="0"
						class="h-10 text-base text-center shadow-sm flex-1 px-1"
					/>
					<Input
						type="number"
						bind:value={row.total}
						placeholder="0"
						class="h-10 text-base text-center shadow-sm flex-1 px-1"
					/>
					<Button
						size="icon"
						class="bg-accent hover:bg-accent/80 rounded-full shadow-md shrink-0"
						onclick={() => commitRow(index)}
					>
						<Plus class="size-5 text-foreground" />
					</Button>
				</div>
			{/each}
		</div>

		<!-- New Row button -->
		<Button
			variant="outline"
			class="w-full mt-3 h-10 flex items-center gap-2 text-muted-foreground border-dashed rounded-lg shadow-sm"
			onclick={addNewRow}
		>
			<Plus class="size-5" />
			New Row
		</Button>
	</div>

	<!-- Committed Tallies Table -->
	{#if committedRows.length > 0}
		<div class="tally-committed-section rounded-xl bg-card shadow-md p-3">
			<h2 class="text-lg font-medium mb-2 text-foreground">
				Today's Tallies
			</h2>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="bg-muted/20">Species</Table.Head>
						<Table.Head class="bg-muted/20">Seedlot</Table.Head>
						<Table.Head class="bg-muted/20 text-center"
							>Box</Table.Head
						>
						<Table.Head class="bg-muted/20 text-center"
							>Bundle</Table.Head
						>
						<Table.Head class="bg-muted/20 text-center"
							>Count</Table.Head
						>
						<Table.Head class="bg-muted/20 text-center"
							>Total</Table.Head
						>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each committedRows as row (row.id)}
						<Table.Row>
							<Table.Cell>{row.speciesCode}</Table.Cell>
							<Table.Cell>{row.seedlot}</Table.Cell>
							<Table.Cell class="text-center"
								>{row.treesPerBundle ?? ""}</Table.Cell
							>
							<Table.Cell class="text-center"
								>{row.bundleCount ?? ""}</Table.Cell
							>
							<Table.Cell class="text-center"
								>{row.count ?? ""}</Table.Cell
							>
							<Table.Cell class="text-center font-semibold"
								>{row.total ?? ""}</Table.Cell
							>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

<style>
	.tally-page {
		max-width: 100vw;
		overflow-x: hidden;
		box-sizing: border-box;
	}

	.tally-entry-section :global(table) {
		width: 100%;
		table-layout: fixed;
		border-collapse: separate;
		border-spacing: 0 0.75rem;
	}

	.tally-entry-section :global(tr) {
		border: none;
	}

	.tally-entry-section :global(td),
	.tally-entry-section :global(th) {
		border: none;
	}

	.tally-entry-section :global(td input) {
		width: 100%;
	}

	.tally-entry-section :global(td:last-child) {
		width: 2.5rem;
	}

	.tally-entry-section :global(input) {
		padding-left: 0.25rem !important;
		padding-right: 0.25rem !important;
	}
</style>
