<script lang="ts">
	import * as Table from '$osem/components/ui/table';
	import * as Popover from '$osem/components/ui/popover';
	import { Button } from '$osem/components/ui/button';
	import { Input } from '$osem/components/ui/input';
	import { Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { TallyStore } from '$osem/mobTally/types.js';

	let { store }: { store: TallyStore } = $props();

	function calcTotal(row: typeof store.activeRows[0]): number {
		const trees = row.treesPerBundle ?? 0;
		const bundles = row.bundleCount ?? 0;
		const count = row.count ?? 0;
		return trees * bundles + count;
	}

	function handleCommit(index: number) {
		const row = store.activeRows[index];
		const isDuplicate = store.committedRows.some(
			(r) =>
				r.speciesCode === row.speciesCode &&
				r.seedlot === row.seedlot &&
				r.treesPerBundle === row.treesPerBundle &&
				r.count === row.count,
		);
		if (isDuplicate) {
			toast.warning('This looks like a duplicate entry. Are you sure?');
			return;
		}
		store.commitRow(index);
		toast.success('Row committed');
	}
</script>

<div class="tally-page bg-background py-2" style="padding-top: calc(env(safe-area-inset-top) + 0.5rem); overflow-y: auto; height: 100%;">
	<h1 class="text-xl font-semibold mb-4 ml-2 text-foreground">TALLIES</h1>

	<!-- Active Entry Table -->
	<div class="tally-entry-section mb-8 rounded-xl bg-card shadow-lg p-1">
		<!-- Header: 4 columns + button spacer -->
		<div class="tally-grid bg-muted/30 rounded-lg mb-3 pb-1 items-end">
			<span class="text-center text-sm pb-1">seedlot</span>
			<span class="text-center text-sm leading-tight pb-1">bundle | box</span>
			<span class="text-center text-sm pb-1">count</span>
			<span class="text-center text-sm pb-1">total</span>
			<span></span>
		</div>

		<!-- Rows -->
		<div class="flex flex-col gap-3">
			{#each store.activeRows as row, index (row.id)}
				<div class="tally-grid items-center">
					<!-- Seedlot - Popover with Species + Seedlot -->
					<Popover.Root>
						<Popover.Trigger class="min-w-0">
							<input
								type="text"
								readonly
								value={row.seedlot || row.speciesCode || 'seedlot'}
								class="h-10 w-full text-base shadow-sm rounded border bg-background px-1 cursor-pointer hover:bg-muted/20 text-foreground"
							/>
						</Popover.Trigger>
						<Popover.Content class="w-80 p-3" align="start">
							<div class="flex flex-col gap-3">
								<div class="flex items-center gap-2">
									<span class="text-sm text-muted-foreground w-16">species</span>
									<Input
										value={row.speciesCode}
										oninput={(e) => store.updateRow(index, { speciesCode: (e.target as HTMLInputElement).value })}
										placeholder="pl"
										class="h-10 text-base flex-1"
									/>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-sm text-muted-foreground w-16">seedlot</span>
									<Input
										value={row.seedlot}
										oninput={(e) => store.updateRow(index, { seedlot: (e.target as HTMLInputElement).value })}
										placeholder="pl 2024 foe2221"
										class="h-10 text-base flex-1"
									/>
								</div>
							</div>
						</Popover.Content>
					</Popover.Root>

					<!-- Bundle/Box - mutually exclusive, popover with two inputs -->
					<Popover.Root>
						<Popover.Trigger class="min-w-0">
							<div class="h-10 text-base shadow-sm rounded border bg-background flex items-center justify-center px-1 cursor-pointer hover:bg-muted/20 text-foreground">
								{row.treesPerBundle ?? row.bundleCount ?? '—'}
							</div>
						</Popover.Trigger>
						<Popover.Content class="w-44 p-2" align="center">
							<div class="flex flex-col gap-2">
								<div class="flex items-center gap-2">
									<span class="text-sm w-12 {row.bundleCount ? 'text-muted-foreground/40' : 'text-muted-foreground'}">box</span>
									<Input
										type="number"
										value={row.treesPerBundle ?? ''}
										oninput={(e) => store.updateRow(index, { treesPerBundle: (e.target as HTMLInputElement).valueAsNumber || null })}
										placeholder="15"
										class="h-9 text-base w-16 {row.bundleCount ? 'opacity-40' : ''}"
										disabled={!!row.bundleCount}
										onfocus={() => store.updateRow(index, { bundleCount: null })}
									/>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-sm w-12 {row.treesPerBundle ? 'text-muted-foreground/40' : 'text-muted-foreground'}">bundle</span>
									<Input
										type="number"
										value={row.bundleCount ?? ''}
										oninput={(e) => store.updateRow(index, { bundleCount: (e.target as HTMLInputElement).valueAsNumber || null })}
										placeholder="10"
										class="h-9 text-base w-16 {row.treesPerBundle ? 'opacity-40' : ''}"
										disabled={!!row.treesPerBundle}
										onfocus={() => store.updateRow(index, { treesPerBundle: null })}
									/>
								</div>
							</div>
						</Popover.Content>
					</Popover.Root>

					<!-- Count - the only direct input -->
					<Input
						type="number"
						value={row.count ?? ''}
						oninput={(e) => store.updateRow(index, { count: (e.target as HTMLInputElement).valueAsNumber || null })}
						placeholder="0"
						class="h-10 w-full text-base text-center shadow-sm px-1"
					/>

					<!-- Total - display only (calculated) -->
					<div class="h-10 text-base shadow-sm rounded-md border bg-background flex items-center justify-center px-1 font-semibold text-foreground">
						{calcTotal(row)}
					</div>

					<Button
						size="icon"
						class="bg-accent hover:bg-accent/80 rounded-full shadow-md"
						onclick={() => handleCommit(index)}
					>
						<Plus class="size-5 text-foreground" />
					</Button>
				</div>
			{/each}
		</div>

		<!-- New Row button -->
		<div class="mt-3">
			<Button
				variant="outline"
				class="h-10 w-32 flex items-center justify-center gap-2 text-muted-foreground border-dashed rounded-lg shadow-sm"
				onclick={() => store.addRow()}
			>
				<Plus class="size-4" />
				New Row
			</Button>
		</div>
	</div>

	<!-- Committed Tallies Table -->
	{#if store.committedRows.length > 0}
		<div class="tally-committed-section rounded-xl bg-card shadow-md p-3">
			<h2 class="text-lg font-medium mb-2 text-foreground">Today's Tallies</h2>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="bg-muted/20">species</Table.Head>
						<Table.Head class="bg-muted/20">seedlot</Table.Head>
						<Table.Head class="bg-muted/20 text-center">Box</Table.Head>
						<Table.Head class="bg-muted/20 text-center">Bundle</Table.Head>
						<Table.Head class="bg-muted/20 text-center">Count</Table.Head>
						<Table.Head class="bg-muted/20 text-center">Total</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each store.committedRows as row (row.id)}
						<Table.Row>
							<Table.Cell>{row.speciesCode}</Table.Cell>
							<Table.Cell>{row.seedlot}</Table.Cell>
							<Table.Cell class="text-center">{row.treesPerBundle ?? ''}</Table.Cell>
							<Table.Cell class="text-center">{row.bundleCount ?? ''}</Table.Cell>
							<Table.Cell class="text-center">{row.count ?? ''}</Table.Cell>
							<Table.Cell class="text-center font-bold">{row.total ?? ''}</Table.Cell>
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

	.tally-grid {
		display: grid;
		grid-template-columns: 1.5fr 1fr 1fr 1fr 2.5rem;
		gap: 0.25rem;
	}

	.tally-entry-section :global(input) {
		padding-left: 0.25rem !important;
		padding-right: 0.25rem !important;
	}
</style>
