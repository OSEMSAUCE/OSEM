<script lang="ts">
	import * as Table from '$osem/components/ui/table';
	import * as Popover from '$osem/components/ui/popover';
	import { Input } from '$osem/components/ui/input';
	import { Plus } from 'lucide-svelte';
	import type { CacheStore } from '$osem/mobTally/types.js';

	let { store }: { store: CacheStore } = $props();

	let removePopoverOpen = $state(false);
	let addPressed = $state(false);
	let removePressed = $state(false);
	let confirmPressed = $state(false);

	function calcTotal(row: typeof store.activeRows[0]): number {
		return (row.containerSize ?? 0) * (row.count ?? 0);
	}

	function snapToHalf(value: number): number {
		return Math.round(value * 2) / 2;
	}

	function handleCountInput(index: number, raw: number | null, isBox: boolean) {
		if (raw == null || isNaN(raw)) {
			store.updateRow(index, { count: null });
			return;
		}
		store.updateRow(index, { count: isBox ? snapToHalf(raw) : Math.round(raw) });
	}

	const baggedTrees = $derived(
		store.activeRows
			.filter(r => r.bagged)
			.reduce((sum, r) => sum + calcTotal(r), 0)
	);

	const baggedValue = $derived(
		store.activeRows
			.filter(r => r.bagged)
			.reduce((sum, r) => sum + calcTotal(r) * (r.pricePerTree ?? 0), 0)
	);

	const anyBagged = $derived(store.activeRows.some(r => r.bagged));
</script>

<div class="tally-page bg-background py-2" style="padding-top: calc(env(safe-area-inset-top) + 0.5rem); overflow-y: auto; height: 100%;">

	<!-- Active Entry Table -->
	<div class="tally-entry-section mb-4 rounded-xl bg-card shadow-lg p-1">
		<!-- Header -->
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
				<div class="tally-grid items-center {row.bagged ? 'bagged-row' : ''}">
					<!-- Seedlot popover -->
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

					<!-- Bundle/Box popover -->
					<Popover.Root>
						<Popover.Trigger class="min-w-0">
							<div class="h-10 text-base shadow-sm rounded border bg-background flex items-center justify-center px-1 cursor-pointer hover:bg-muted/20 {row.containerSize ? 'text-foreground' : 'text-muted-foreground/40 italic'}">
								{row.containerSize ?? (row.isBox ? '270' : '15')}
							</div>
						</Popover.Trigger>
						<Popover.Content class="w-44 p-2" align="center">
							<div class="flex flex-col gap-2">
								<div class="flex items-center gap-2">
									<span class="text-sm w-14 {row.isBox ? 'text-foreground font-medium' : 'text-muted-foreground'}">box</span>
									<Input
										type="number"
										value={row.isBox ? (row.containerSize ?? '') : ''}
										oninput={(e) => {
											const v = (e.target as HTMLInputElement).valueAsNumber;
											store.updateRow(index, { containerSize: v || null, isBox: true });
										}}
										placeholder="270"
										class="h-9 text-base w-16"
										onfocus={() => store.updateRow(index, { isBox: true })}
									/>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-sm w-14 {!row.isBox ? 'text-foreground font-medium' : 'text-muted-foreground'}">bundle</span>
									<Input
										type="number"
										value={!row.isBox ? (row.containerSize ?? '') : ''}
										oninput={(e) => {
											const v = (e.target as HTMLInputElement).valueAsNumber;
											store.updateRow(index, { containerSize: v || null, isBox: false });
										}}
										placeholder="15"
										class="h-9 text-base w-16"
										onfocus={() => store.updateRow(index, { isBox: false })}
									/>
								</div>
							</div>
						</Popover.Content>
					</Popover.Root>

					<!-- Count popover -->
					<Popover.Root>
						<Popover.Trigger class="min-w-0">
							<div class="h-10 text-base shadow-sm rounded border bg-background flex items-center justify-center px-1 cursor-pointer hover:bg-muted/20 {row.count ? 'text-foreground' : 'text-muted-foreground/40 italic'}">
								{row.count ?? ''}
							</div>
						</Popover.Trigger>
						<Popover.Content class="w-44 p-2" align="center">
							<div class="flex flex-col gap-2">
								<div class="flex items-center gap-2">
									<span class="text-sm text-muted-foreground w-12">count</span>
									<Input
										type="number"
										value={row.count ?? ''}
										placeholder={row.isBox ? '1.5' : '1'}
										oninput={(e) => {
											const v = (e.target as HTMLInputElement).valueAsNumber;
											handleCountInput(index, isNaN(v) ? null : v, row.isBox);
										}}
										class="h-9 text-base w-16"
									/>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-sm text-muted-foreground w-12">price $</span>
									<Input
										type="number"
										value={row.pricePerTree ?? ''}
										placeholder="0.00"
										oninput={(e) => store.updateRow(index, { pricePerTree: (e.target as HTMLInputElement).valueAsNumber || null })}
										class="h-9 text-base w-16"
									/>
								</div>
							</div>
						</Popover.Content>
					</Popover.Root>

					<!-- Total - plain text -->
					<div class="h-10 flex items-center justify-center font-semibold text-foreground text-base">
						{calcTotal(row) || ''}
					</div>

					<!-- Bag up button -->
					<button class="bag-btn" onclick={() => store.bagUpRow(index)}>
						<img
							src={row.bagged ? '/pub-Rtvr/bag_full.webp' : '/pub-Rtvr/bag_empty.webp'}
							alt={row.bagged ? 'full bag' : 'empty bag'}
						/>
					</button>
				</div>
			{/each}
		</div>

		<!-- Row controls -->
		<div class="mt-3 flex gap-2">
			<button
				class="row-ctrl {addPressed ? 'pressed' : ''} text-muted-foreground"
				onpointerdown={() => (addPressed = true)}
				onpointerup={() => (addPressed = false)}
				onpointercancel={() => (addPressed = false)}
				onclick={() => { store.addRow(); removePopoverOpen = false; }}
			>
				<Plus class="size-4" />
				new row
			</button>
			{#if store.activeRows.length > 1}
				<Popover.Root bind:open={removePopoverOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<button
								{...props}
								class="row-ctrl {removePressed ? 'pressed' : ''} text-red-400/40"
								onpointerdown={() => (removePressed = true)}
								onpointerup={() => (removePressed = false)}
								onpointercancel={() => (removePressed = false)}
							>
								<span class="text-base leading-none">−</span>
								row
							</button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto p-3" align="start">
						<p class="text-sm text-muted-foreground mb-2">Remove last row?</p>
						<button
							class="row-ctrl row-ctrl--sm {confirmPressed ? 'pressed' : ''} text-red-400/70"
							onpointerdown={() => (confirmPressed = true)}
							onpointerup={() => (confirmPressed = false)}
							onpointercancel={() => (confirmPressed = false)}
							onclick={() => { store.removeLastRow(); removePopoverOpen = false; }}
						>
							<span class="leading-none">−</span>
							row
						</button>
					</Popover.Content>
				</Popover.Root>
			{/if}
		</div>
	</div>

	<!-- Bags panel — always visible, totals update live as rows are bagged -->
	<div class="bags-panel mb-4">
		<div class="bags-totals">
			{#if baggedTrees > 0}
				<span class="trees-total">{baggedTrees}</span>
				<span class="trees-label">trees</span>
			{/if}
			{#if baggedValue > 0}
				<span class="money-total">${baggedValue.toFixed(2)}</span>
			{/if}
		</div>
		<img src="/pub-Rtvr/bags-0.webp" alt="planting bags" class="bags-img" />
		{#if anyBagged}
			<button class="row-ctrl bag-out-btn text-muted-foreground" onclick={() => store.bagOut()}>
				bag out
			</button>
		{/if}
	</div>

	<!-- Today's Tallies — Phase 4 will add grouped headers and slanted columns -->
	{#if store.bagOuts.length > 0}
		<div class="tally-committed-section rounded-xl bg-card shadow-md p-3">
			<h2 class="text-lg font-medium mb-2 text-foreground">today's tallies</h2>
			{#each store.bagOuts as bagOut (bagOut.id)}
				<div class="mb-4">
					<div class="flex justify-between text-sm text-muted-foreground mb-1 px-1">
						<span>bagged at {new Date(bagOut.baggedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
						<span class="font-medium">{bagOut.totalTrees} trees{bagOut.totalValue > 0 ? ` · $${bagOut.totalValue.toFixed(2)}` : ''}</span>
					</div>
					<Table.Root>
						<Table.Body>
							{#each bagOut.rows as row (row.id)}
								<Table.Row>
									<Table.Cell>{row.speciesCode}</Table.Cell>
									<Table.Cell class="text-muted-foreground text-xs">{row.seedlot}</Table.Cell>
									<Table.Cell class="text-center">{row.containerSize ?? ''}</Table.Cell>
									<Table.Cell class="text-center">{row.count ?? ''}</Table.Cell>
									<Table.Cell class="text-center font-bold">{row.total ?? ''}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/each}
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

	/* Bagged row — elevated and locked, bag button stays live */
	.bagged-row {
		border-radius: 0.5rem;
		background: hsl(var(--card));
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
		padding: 0.2rem;
	}

	.bagged-row > :not(:last-child) {
		opacity: 0.45;
		pointer-events: none;
	}

	/* Bag up button */
	.bag-btn {
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		background: transparent;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
		flex-shrink: 0;
	}

	.bag-btn img {
		width: 2.5rem;
		height: 2.5rem;
		object-fit: contain;
	}

	/* Bags panel */
	.bags-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
	}

	.bags-totals {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		min-height: 2rem;
	}

	.trees-total {
		font-size: 1.75rem;
		font-weight: 700;
		line-height: 1;
		color: hsl(var(--foreground));
	}

	.trees-label {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.money-total {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.bags-img {
		width: 220px;
		height: auto;
		object-fit: contain;
	}

	.bag-out-btn {
		margin-top: 0.25rem;
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

	/* No lingering gold ring anywhere */
	.tally-page :global(*:focus),
	.tally-page :global(*:focus-visible) {
		outline: none !important;
		box-shadow: none !important;
		--tw-ring-shadow: 0 0 #0000 !important;
		--tw-ring-offset-shadow: 0 0 #0000 !important;
	}

	/* Native row-control buttons */
	.row-ctrl {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		height: 2.5rem;
		padding: 0 0.75rem;
		border: 1px dashed currentColor;
		border-radius: 0.5rem;
		background: transparent;
		font-size: 0.875rem;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition: transform 150ms ease, filter 150ms ease, opacity 150ms ease;
	}
	.row-ctrl--sm {
		height: 2rem;
		padding: 0 0.625rem;
	}
	.row-ctrl.pressed {
		transform: scale(0.88);
		filter: brightness(1.6);
		opacity: 0.7;
		transition: transform 50ms ease, filter 50ms ease, opacity 50ms ease;
	}
</style>
