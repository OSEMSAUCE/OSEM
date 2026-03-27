<script lang="ts">
	import * as Popover from '$osem/components/ui/popover';
	import * as Table from '$osem/components/ui/table';
	import { Input } from '$osem/components/ui/input';
	import { Plus } from 'lucide-svelte';
	import type { CacheStore } from '$osem/mobTally/types.js';

	let { store }: { store: CacheStore } = $props();

	let removePopoverOpen = $state(false);
	let addPressed = $state(false);
	let removePressed = $state(false);
	let confirmPressed = $state(false);

	function calcTotal(row: typeof store.activeRows[0]): number {
		return Math.floor((row.containerSize ?? 0) * (row.count ?? 0));
	}

	function snapToHalf(value: number): number {
		return Math.round(value * 2) / 2;
	}

	function handleCountInput(index: number, raw: number | null, isBox: boolean) {
		if (raw == null || isNaN(raw)) { store.updateRow(index, { count: null }); return; }
		store.updateRow(index, { count: isBox ? snapToHalf(raw) : Math.round(raw) });
	}

	const baggedTrees = $derived(
		store.activeRows.filter(r => r.bagged).reduce((sum, r) => sum + calcTotal(r), 0)
	);
	const baggedValue = $derived(
		store.activeRows.filter(r => r.bagged).reduce((sum, r) => sum + calcTotal(r) * (r.pricePerTree ?? 0), 0)
	);
	const anyBagged = $derived(store.activeRows.some(r => r.bagged));
</script>

<div class="cache-page" style="padding-top: calc(env(safe-area-inset-top) + 0.5rem);">

	<!-- Header -->
	<div class="page-header">
		<h1 class="page-title">cache</h1>
	</div>

	<!-- Active Entry Table -->
	<div class="entry-section">
		<!-- Column headers -->
		<div class="row-grid header-row">
			<span>seedlot</span>
			<span>bundle · box</span>
			<span>count</span>
			<span>total</span>
			<span></span>
		</div>

		<!-- Rows -->
		<div class="rows-list">
			{#each store.activeRows as row, index (row.id)}
				<div class="row-card {row.bagged ? 'row-card--bagged' : ''} {calcTotal(row) > 0 ? 'row-card--filled' : ''}">
					<div class="row-grid">

						<!-- Seedlot plaque -->
						<Popover.Root>
							<Popover.Trigger class="plaque-trigger">
								<div class="plaque {row.seedlot || row.speciesCode ? '' : 'plaque--empty'}">
									<span class="plaque-text">{row.seedlot || row.speciesCode || 'tap'}</span>
								</div>
							</Popover.Trigger>
							<Popover.Content class="w-80 p-3" align="start">
								<div class="flex flex-col gap-3">
									<div class="flex items-center gap-2">
										<span class="text-sm text-muted-foreground w-16">species</span>
										<Input value={row.speciesCode} oninput={(e) => store.updateRow(index, { speciesCode: (e.target as HTMLInputElement).value })} placeholder="PL" class="h-10 text-base flex-1" />
									</div>
									<div class="flex items-center gap-2">
										<span class="text-sm text-muted-foreground w-16">seedlot</span>
										<Input value={row.seedlot} oninput={(e) => store.updateRow(index, { seedlot: (e.target as HTMLInputElement).value })} placeholder="LF1.2 futureTP 2026" class="h-10 text-base flex-1" />
									</div>
								</div>
							</Popover.Content>
						</Popover.Root>

						<!-- Bundle/Box plaque -->
						<Popover.Root>
							<Popover.Trigger class="plaque-trigger">
								<div class="plaque {row.containerSize ? '' : 'plaque--empty'}">
									<span class="plaque-text">{row.containerSize ?? '—'}</span>
								</div>
							</Popover.Trigger>
							<Popover.Content class="w-44 p-2" align="center">
								<div class="flex flex-col gap-2">
									<div class="flex items-center gap-2">
										<span class="text-sm w-14 {row.isBox ? 'text-foreground font-medium' : 'text-muted-foreground'}">box</span>
										<Input type="number" value={row.isBox ? (row.containerSize ?? '') : ''} oninput={(e) => { const v = (e.target as HTMLInputElement).valueAsNumber; store.updateRow(index, { containerSize: v || null, isBox: true }); }} placeholder="270" class="h-9 text-base w-16" onfocus={() => store.updateRow(index, { isBox: true })} />
									</div>
									<div class="flex items-center gap-2">
										<span class="text-sm w-14 {!row.isBox ? 'text-foreground font-medium' : 'text-muted-foreground'}">bundle</span>
										<Input type="number" value={!row.isBox ? (row.containerSize ?? '') : ''} oninput={(e) => { const v = (e.target as HTMLInputElement).valueAsNumber; store.updateRow(index, { containerSize: v || null, isBox: false }); }} placeholder="15" class="h-9 text-base w-16" onfocus={() => store.updateRow(index, { isBox: false })} />
									</div>
								</div>
							</Popover.Content>
						</Popover.Root>

						<!-- Count plaque -->
						<Popover.Root>
							<Popover.Trigger class="plaque-trigger">
								<div class="plaque {row.count ? '' : 'plaque--empty'}">
									<span class="plaque-text">{row.count ?? '—'}</span>
								</div>
							</Popover.Trigger>
							<Popover.Content class="w-44 p-2" align="center">
								<div class="flex flex-col gap-2">
									<div class="flex items-center gap-2">
										<span class="text-sm text-muted-foreground w-12">count</span>
										<Input type="number" value={row.count ?? ''} placeholder={row.isBox ? '1.5' : '1'} oninput={(e) => { const v = (e.target as HTMLInputElement).valueAsNumber; handleCountInput(index, isNaN(v) ? null : v, row.isBox); }} class="h-9 text-base w-16" />
									</div>
									<div class="flex items-center gap-2">
										<span class="text-sm text-muted-foreground w-12">price $</span>
										<Input type="number" value={row.pricePerTree ?? ''} placeholder="0.00" oninput={(e) => store.updateRow(index, { pricePerTree: (e.target as HTMLInputElement).valueAsNumber || null })} class="h-9 text-base w-16" />
									</div>
								</div>
							</Popover.Content>
						</Popover.Root>

						<!-- Total plaque (non-interactive) -->
						<div class="plaque plaque--total">
							<span class="plaque-text">{calcTotal(row) || '—'}</span>
						</div>

						<!-- Bag up button -->
						<button class="bag-btn" onclick={() => store.bagUpRow(index)} disabled={calcTotal(row) === 0}>
							<img src={row.bagged ? '/pub-Rtvr/bag_full.webp' : '/pub-Rtvr/bag_empty.webp'} alt={row.bagged ? 'full' : 'empty'} />
						</button>
					</div>
				</div>
			{/each}
		</div>

		<!-- Row controls -->
		<div class="row-controls">
			<button
				class="row-ctrl {addPressed ? 'pressed' : ''} text-muted-foreground"
				onpointerdown={() => (addPressed = true)}
				onpointerup={() => (addPressed = false)}
				onpointercancel={() => (addPressed = false)}
				onclick={() => { store.addRow(); removePopoverOpen = false; }}
			>
				<Plus class="size-4" /> new row
			</button>
			{#if store.activeRows.length > 1}
				<Popover.Root bind:open={removePopoverOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<button {...props} class="row-ctrl {removePressed ? 'pressed' : ''} text-red-400/40"
								onpointerdown={() => (removePressed = true)}
								onpointerup={() => (removePressed = false)}
								onpointercancel={() => (removePressed = false)}>
								<span class="text-base leading-none">−</span> row
							</button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto p-3" align="start">
						<p class="text-sm text-muted-foreground mb-2">Remove last row?</p>
						<button class="row-ctrl row-ctrl--sm {confirmPressed ? 'pressed' : ''} text-red-400/70"
							onpointerdown={() => (confirmPressed = true)}
							onpointerup={() => (confirmPressed = false)}
							onpointercancel={() => (confirmPressed = false)}
							onclick={() => { store.removeLastRow(); removePopoverOpen = false; }}>
							<span class="leading-none">−</span> row
						</button>
					</Popover.Content>
				</Popover.Root>
			{/if}
		</div>
	</div>

	<!-- Bags panel — always visible -->
	<div class="bags-panel">
		<div class="bags-totals">
			{#if baggedTrees > 0}
				<span class="total-trees">{baggedTrees}</span>
				<span class="total-label">trees</span>
			{/if}
			{#if baggedValue > 0}
				<span class="total-money">${baggedValue.toFixed(2)}</span>
			{/if}
		</div>
		<img src="/pub-Rtvr/bags-0.webp" alt="planting bags" class="bags-img" />
		{#if anyBagged}
			<button class="row-ctrl text-muted-foreground" onclick={() => store.bagOut()}>
				bag out
			</button>
		{/if}
	</div>

	<!-- Today's tallies -->
	{#if store.bagOuts.length > 0}
		<div class="history-section">
			<h2 class="history-heading">today's tallies</h2>
			{#each store.bagOuts as bagOut (bagOut.id)}
				<div class="bagout-group">
					<div class="bagout-header">
						<span>bagged at {new Date(bagOut.baggedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
						<span class="bagout-summary">{bagOut.totalTrees} trees{bagOut.totalValue > 0 ? ` · $${bagOut.totalValue.toFixed(2)}` : ''}</span>
					</div>
					<Table.Root>
						<Table.Body>
							{#each bagOut.rows as row (row.id)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.speciesCode}</Table.Cell>
									<Table.Cell class="text-muted-foreground text-xs">{row.seedlot}</Table.Cell>
									<Table.Cell class="text-center text-sm">{row.containerSize ?? ''}</Table.Cell>
									<Table.Cell class="text-center text-sm">{row.count ?? ''}</Table.Cell>
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
	/* ── Theme palette (permanent dark) ──
	   background: #1a1a1a   card: #222222   foreground: #fafafa
	   muted-fg: #6b7280     accent/gold: #ffd700
	*/

	/* ── Header ── */
	.page-header {
		padding: 0.75rem 1rem 0.5rem;
		border-bottom: 1px solid #2a2a2a;
		margin-bottom: 0.25rem;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: lowercase;
		color: #ffd700;
		line-height: 1;
	}

	/* ── Page ── */
	.cache-page {
		max-width: 100vw;
		overflow-x: hidden;
		overflow-y: auto;
		height: 100%;
		box-sizing: border-box;
		background: #1a1a1a;
		padding-bottom: 2rem;
	}

	/* ── Entry section ── */
	.entry-section {
		padding: 0.5rem 0.5rem 0.75rem;
	}

	/* Column headers */
	.header-row {
		padding: 0 0.75rem 0.25rem;
		margin-bottom: 0.25rem;
	}

	.header-row span {
		display: block;
		text-align: center;
		font-size: 0.7rem;
		text-transform: lowercase;
		letter-spacing: 0.03em;
		color: #4b5563;
	}

	.header-row span:last-child {
		visibility: hidden;
	}

	/* Grid */
	.row-grid {
		display: grid;
		grid-template-columns: 1.5fr 1fr 1fr 1fr 2.5rem;
		gap: 0.2rem;
		align-items: center;
	}

	/* Rows list */
	.rows-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* ── Row pill card ── */
	.row-card {
		border-radius: 1.5rem;
		padding: 0.35rem 0.4rem;
		background: #272727;
		box-shadow: none;
		transition: background 250ms ease, box-shadow 250ms ease;
	}

	.row-card--bagged {
		background: #2e2e2e;
		box-shadow:
			0 8px 28px rgba(0, 0, 0, 0.7),
			0 3px 8px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 215, 0, 0.2);
	}

	/* Lock inputs when bagged (no pointer events), but don't dim them */
	.row-card--bagged .row-grid > :not(:last-child) {
		pointer-events: none;
	}

	/* All plaque text brightens when bagged */
	.row-card--bagged .plaque-text {
		color: #d4d4d4;
	}

	/* All plaques pop when bagged */
	.row-card--bagged .plaque {
		box-shadow:
			0 5px 14px rgba(0, 0, 0, 0.65),
			0 2px 5px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.07);
	}

	/* Total gets gold border + glow */
	.row-card--bagged .plaque--total {
		border: 1px solid rgba(255, 215, 0, 0.3);
		box-shadow:
			0 5px 14px rgba(0, 0, 0, 0.65),
			0 0 10px rgba(255, 215, 0, 0.08);
	}

	.row-card--bagged .plaque--total .plaque-text {
		color: #ffd700;
		font-size: 1rem;
		font-weight: 700;
	}

	/* ── Plaque display buttons ── */
	:global(.plaque-trigger) {
		display: block !important;
		width: 100%;
		min-width: 0;
		background: none;
		border: none;
		padding: 0;
	}

	.plaque {
		height: 2.25rem;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 0.25rem;
		background: #333333;
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
		cursor: pointer;
		transition: background 100ms;
		-webkit-tap-highlight-color: transparent;
		overflow: hidden;
	}

	.plaque:hover {
		background: #3d3d3d;
	}

	.plaque--empty {
		background: #262626;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.plaque--total {
		cursor: default;
		pointer-events: none;
		background: #2a2a2a;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.03);
		font-weight: 600;
	}

	.plaque-text {
		font-size: 0.9rem;
		color: #6b7280;  /* always gray until bagged */
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.plaque--empty .plaque-text {
		color: #4b5563;
		font-size: 0.75rem;
	}

	/* ── Bag button ── */
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

	.bag-btn:disabled {
		opacity: 0.2;
		cursor: default;
	}

	/* ── Row controls ── */
	.row-controls {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding: 0 0.25rem;
	}

	/* ── Bags panel ── */
	.bags-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem 1rem;
	}

	.bags-totals {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		min-height: 2.25rem;
	}

	.total-trees {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1;
		color: #fafafa;
	}

	.total-label {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.total-money {
		font-size: 1.375rem;
		font-weight: 600;
		color: #ffd700;
		margin-left: 0.25rem;
	}

	.bags-img {
		width: 220px;
		height: auto;
		object-fit: contain;
	}

	/* ── History ── */
	.history-section {
		padding: 0 0.5rem 1rem;
	}

	.history-heading {
		font-size: 1rem;
		font-weight: 500;
		color: #fafafa;
		margin-bottom: 0.75rem;
		padding: 0 0.25rem;
	}

	.bagout-group {
		margin-bottom: 1rem;
		border-radius: 1rem;
		background: #222222;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		overflow: hidden;
	}

	.bagout-header {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		color: #6b7280;
		padding: 0.5rem 0.75rem 0.25rem;
	}

	.bagout-summary {
		font-weight: 600;
		color: #fafafa;
	}

	/* ── Remove spinners globally (popovers render outside .cache-page in the DOM) ── */
	:global(input[type='number']::-webkit-outer-spin-button),
	:global(input[type='number']::-webkit-inner-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}
	:global(input[type='number']) {
		appearance: textfield;
	}

	/* ── No lingering focus ring ── */
	:global(.cache-page *:focus),
	:global(.cache-page *:focus-visible) {
		outline: none !important;
		box-shadow: none !important;
		--tw-ring-shadow: 0 0 #0000 !important;
		--tw-ring-offset-shadow: 0 0 #0000 !important;
	}

	/* ── Row control buttons ── */
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
