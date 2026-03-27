<script lang="ts">
	import * as Table from '$osem/components/ui/table';
	import * as Popover from '$osem/components/ui/popover';
	import { Button } from '$osem/components/ui/button';
	import { Input } from '$osem/components/ui/input';
	import { Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { TallyStore } from '$osem/mobTally/types.js';

	let { store }: { store: TallyStore } = $props();

	let removePopoverOpen = $state(false);

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
								value={row.seedlot || row.speciesCode || ''}
								placeholder="SX_25_DSC668"
								class="h-10 w-full text-base shadow-sm rounded border bg-background px-1 cursor-pointer hover:bg-muted/20 text-foreground placeholder:text-muted-foreground/40 italic"
							/>
						</Popover.Trigger>
						<Popover.Content class="w-80 p-3" align="start">
							<div class="flex flex-col gap-3">
								<div class="flex items-center gap-2">
									<span class="text-sm text-muted-foreground w-16">species</span>
									<Input
										value={row.speciesCode}
										oninput={(e) => store.updateRow(index, { speciesCode: (e.target as HTMLInputElement).value })}
										placeholder="PL"
										class="h-10 text-base flex-1"
									/>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-sm text-muted-foreground w-16">seedlot</span>
									<Input
										value={row.seedlot}
										oninput={(e) => store.updateRow(index, { seedlot: (e.target as HTMLInputElement).value })}
										placeholder="LF1.2 futureTP 2026"
										class="h-10 text-base flex-1"
									/>
								</div>
							</div>
						</Popover.Content>
					</Popover.Root>

					<!-- Bundle/Box - mutually exclusive, popover with two inputs -->
					<Popover.Root>
						<Popover.Trigger class="min-w-0">
							<div class="h-10 text-base shadow-sm rounded border bg-background flex items-center justify-center px-1 cursor-pointer hover:bg-muted/20 {(row.treesPerBundle ?? row.bundleCount) ? 'text-foreground' : 'text-muted-foreground/40 italic'}">
								{row.treesPerBundle ?? row.bundleCount ?? '270'}
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
										placeholder="270"
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
										placeholder="15"
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

		<!-- Row controls -->
		<div class="mt-3 flex gap-2">
			<Button
				variant="outline"
				class="h-10 w-32 flex items-center justify-center gap-2 text-muted-foreground border-dashed rounded-lg shadow-sm focus-visible:ring-0 focus-visible:outline-none"
				onclick={() => { store.addRow(); removePopoverOpen = false; }}
			>
				<Plus class="size-4" />
				new row
			</Button>
			{#if store.activeRows.length > 1}
				<Popover.Root bind:open={removePopoverOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								class="h-10 w-24 flex items-center justify-center gap-1 text-red-400/30 border-dashed rounded-lg shadow-sm focus-visible:ring-0 focus-visible:outline-none"
							>
								<span class="text-base leading-none">−</span>
								row
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto p-3" align="start">
						<p class="text-sm text-muted-foreground mb-2">Remove last row?</p>
						<Button
							variant="outline"
							class="h-8 flex items-center gap-1 text-red-400/70 border-dashed text-sm focus-visible:ring-0 focus-visible:outline-none"
							onclick={() => { store.removeLastRow(); removePopoverOpen = false; }}
						>
							<span class="leading-none">−</span>
							row
						</Button>
					</Popover.Content>
				</Popover.Root>
			{/if}
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

	/* Remove number input spinners */
	.tally-entry-section :global(input[type='number']::-webkit-outer-spin-button),
	.tally-entry-section :global(input[type='number']::-webkit-inner-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}
	.tally-entry-section :global(input[type='number']) {
		appearance: textfield;
	}

	/* No lingering focus ring on any button/trigger in the tally */
	.tally-page :global(button:focus-visible),
	.tally-page :global([data-slot='button']:focus-visible),
	.tally-page :global([role='button']:focus-visible) {
		outline: none;
		box-shadow: none;
	}

	/* Press & release feedback */
	.tally-page :global(button),
	.tally-page :global([data-slot='button']) {
		transition: transform 120ms ease, filter 120ms ease;
	}
	.tally-page :global(button:active),
	.tally-page :global([data-slot='button']:active) {
		transform: scale(0.94);
		filter: brightness(0.82);
		transition: transform 60ms ease, filter 60ms ease;
	}
</style>
