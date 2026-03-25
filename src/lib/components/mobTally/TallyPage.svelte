<script lang="ts">
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import * as Table from "$lib/components/ui/table";
	import * as Accordion from "$lib/components/ui/accordion";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
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

<div class="tally-page min-h-screen bg-background p-4">
	<h1 class="text-xl font-semibold mb-4 text-foreground">Tally Entry</h1>

	<!-- Active Entry Table -->
	<div class="tally-entry-section mb-8">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<!-- Seedlot group header (merged: speciesCode + seedlot) -->
					<Table.Head
						colspan={2}
						class="cursor-pointer hover:bg-muted/50 text-center border"
						onclick={() => toggleSection("seedlot")}
					>
						Seedlot
						<span class="text-xs text-muted-foreground ml-1">
							{expandedSection === "seedlot" ? "▼" : "▶"}
						</span>
					</Table.Head>

					<!-- Trees per box/bundle group header (merged: treesPerBundle + bundleCount) -->
					<Table.Head
						colspan={2}
						class="cursor-pointer hover:bg-muted/50 text-center border"
						onclick={() => toggleSection("trees")}
					>
						Trees per box / bundle
						<span class="text-xs text-muted-foreground ml-1">
							{expandedSection === "trees" ? "▼" : "▶"}
						</span>
					</Table.Head>

					<!-- Individual headers -->
					<Table.Head class="border text-center">count</Table.Head>
					<Table.Head class="border text-center">total</Table.Head>
					<Table.Head class="border w-12"></Table.Head>
				</Table.Row>

				<!-- Expanded sub-headers row (shows when a section is expanded) -->
				{#if expandedSection}
					<Table.Row class="bg-muted/30">
						{#if expandedSection === "seedlot"}
							<Table.Head class="border text-xs"
								>Species</Table.Head
							>
							<Table.Head class="border text-xs"
								>Seedlot #</Table.Head
							>
						{:else}
							<Table.Head colspan={2} class="border"></Table.Head>
						{/if}

						{#if expandedSection === "trees"}
							<Table.Head class="border text-xs"
								>Per Bundle</Table.Head
							>
							<Table.Head class="border text-xs"
								>Bundles</Table.Head
							>
						{:else}
							<Table.Head colspan={2} class="border"></Table.Head>
						{/if}

						<Table.Head class="border"></Table.Head>
						<Table.Head class="border"></Table.Head>
						<Table.Head class="border"></Table.Head>
					</Table.Row>
				{/if}
			</Table.Header>

			<Table.Body>
				{#each activeRows as row, index (row.id)}
					<Table.Row>
						<!-- Seedlot group cells -->
						<Table.Cell class="border p-1">
							<Input
								bind:value={row.speciesCode}
								placeholder="pl"
								class="h-8 text-sm"
							/>
						</Table.Cell>
						<Table.Cell class="border p-1">
							<Input
								bind:value={row.seedlot}
								placeholder="pl 2024 foe2221"
								class="h-8 text-sm"
							/>
						</Table.Cell>

						<!-- Trees per bundle group cells -->
						<Table.Cell class="border p-1">
							<Input
								type="number"
								bind:value={row.treesPerBundle}
								placeholder="15"
								class="h-8 text-sm w-16"
							/>
						</Table.Cell>
						<Table.Cell class="border p-1">
							<Input
								type="number"
								bind:value={row.bundleCount}
								placeholder="10"
								class="h-8 text-sm w-16"
							/>
						</Table.Cell>

						<!-- Count -->
						<Table.Cell class="border p-1">
							<Input
								type="number"
								bind:value={row.count}
								placeholder="0"
								class="h-8 text-sm w-16"
							/>
						</Table.Cell>

						<!-- Total (calculated or manual?) -->
						<Table.Cell class="border p-1">
							<Input
								type="number"
								bind:value={row.total}
								placeholder="0"
								class="h-8 text-sm w-16"
							/>
						</Table.Cell>

						<!-- Commit button (green +) -->
						<Table.Cell class="border p-1">
							<Button
								size="icon-sm"
								class="bg-green-600 hover:bg-green-700 rounded-full"
								onclick={() => commitRow(index)}
							>
								<Plus class="size-5 text-white" />
							</Button>
						</Table.Cell>
					</Table.Row>
				{/each}

				<!-- New Row button row -->
				<Table.Row>
					<Table.Cell colspan={7} class="border p-2">
						<Button
							variant="ghost"
							class="w-full flex items-center gap-2 text-muted-foreground"
							onclick={addNewRow}
						>
							<Plus class="size-5" />
							New Row
						</Button>
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Committed Tallies Table -->
	{#if committedRows.length > 0}
		<div class="tally-committed-section">
			<h2 class="text-lg font-medium mb-2 text-foreground">
				Today's Tallies
			</h2>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="border">Species</Table.Head>
						<Table.Head class="border">Seedlot</Table.Head>
						<Table.Head class="border">Per Bundle</Table.Head>
						<Table.Head class="border">Bundles</Table.Head>
						<Table.Head class="border">Count</Table.Head>
						<Table.Head class="border">Total</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each committedRows as row (row.id)}
						<Table.Row>
							<Table.Cell class="border"
								>{row.speciesCode}</Table.Cell
							>
							<Table.Cell class="border">{row.seedlot}</Table.Cell
							>
							<Table.Cell class="border"
								>{row.treesPerBundle ?? ""}</Table.Cell
							>
							<Table.Cell class="border"
								>{row.bundleCount ?? ""}</Table.Cell
							>
							<Table.Cell class="border"
								>{row.count ?? ""}</Table.Cell
							>
							<Table.Cell class="border"
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
		overflow-x: auto;
	}
</style>
