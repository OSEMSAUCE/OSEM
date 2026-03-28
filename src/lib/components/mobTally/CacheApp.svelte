<script lang="ts">
	import * as Popover from '$osem/components/ui/popover';
	import * as Table from '$osem/components/ui/table';
	import { Input } from '$osem/components/ui/input';
	import { Plus, Share2, Trash2 } from 'lucide-svelte';
	import type { CacheStore } from '$osem/mobTally/types.js';
	import { parseRetreeverFile, buildRetreeverFile } from '$osem/mobTally/seedlotPackage.js';

	let { store }: { store: CacheStore } = $props();

	let removePopoverOpen = $state(false);
	let clearPopoverOpen = $state(false);
	let addPressed = $state(false);
	let removePressed = $state(false);
	let confirmPressed = $state(false);
	let clearPressed = $state(false);
	let confirmClearPressed = $state(false);
	let buzzingRows = $state<Set<number>>(new Set());
	let conflictingRows = $state<Map<number, 'box' | 'bundle'>>(new Map());
	let invalidInputs = $state<Map<number, 'box' | 'bundle'>>(new Map());
	let snappingCounts = $state<Set<number>>(new Set());
	let pendingCounts = $state<Map<number, number>>(new Map());
	const snapTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();

	function calcTotal(row: typeof store.activeRows[0]): number {
		return Math.floor((row.containerSize ?? 0) * (row.count ?? 0));
	}

	const ALLOWED_KEYS = new Set(['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown']);
	function rejectKey(e: KeyboardEvent, index: number, type: 'box' | 'bundle') {
		if (ALLOWED_KEYS.has(e.key) || e.metaKey || e.ctrlKey) return;
		if (!/^[0-9.]$/.test(e.key)) {
			e.preventDefault();
			invalidInputs = new Map([...invalidInputs, [index, type]]);
			setTimeout(() => {
				invalidInputs = new Map([...invalidInputs].filter(([k]) => k !== index));
			}, 1500);
		}
	}

	function triggerConflict(index: number, filled: 'box' | 'bundle') {
		conflictingRows = new Map([...conflictingRows, [index, filled]]);
		setTimeout(() => {
			conflictingRows = new Map([...conflictingRows].filter(([k]) => k !== index));
		}, 1600);
	}

	function snapToHalf(value: number): number {
		return Math.round(value * 2) / 2;
	}

	function handleCountInput(index: number, raw: number | null, isBox: boolean) {
		if (raw == null || isNaN(raw)) { store.updateRow(index, { count: null }); return; }
		const snapped = isBox ? snapToHalf(raw) : Math.round(raw);

		if (isBox && snapped !== raw) {
			// Cancel any in-flight snap for this row (user still typing)
			if (snapTimers.has(index)) clearTimeout(snapTimers.get(index)!);

			// Show raw value with red error flash, then snap after short delay
			pendingCounts = new Map([...pendingCounts, [index, raw]]);
			snappingCounts = new Set([...snappingCounts, index]);

			const timer = setTimeout(() => {
				snapTimers.delete(index);
				pendingCounts = new Map([...pendingCounts].filter(([k]) => k !== index));
				store.updateRow(index, { count: snapped });
				setTimeout(() => {
					snappingCounts = new Set([...snappingCounts].filter(i => i !== index));
				}, 1200);
			}, 420);
			snapTimers.set(index, timer);
			return;
		}

		store.updateRow(index, { count: snapped });
	}

	function handleBagTap(index: number) {
		const row = store.activeRows[index];
		const noSeedlot = !row.seedlot && !row.speciesCode;
		const noTotal = calcTotal(row) === 0;
		if (noSeedlot || noTotal) {
			buzzingRows = new Set([...buzzingRows, index]);
			setTimeout(() => {
				buzzingRows = new Set([...buzzingRows].filter(i => i !== index));
			}, 1600);
			return;
		}
		store.bagUpRow(index);
	}

	const baggedTrees = $derived(
		store.activeRows.filter(r => r.bagged).reduce((sum, r) => sum + calcTotal(r), 0)
	);
	const baggedValue = $derived(
		store.activeRows.filter(r => r.bagged).reduce((sum, r) => sum + calcTotal(r) * (r.pricePerTree ?? 0), 0)
	);
	const anyBagged = $derived(store.activeRows.some(r => r.bagged));

	// ── Share / import ──
	let fileInput: HTMLInputElement;
	let importError = $state<string | null>(null);

	async function shareCache() {
		const seedlots = store.activeRows.map(({ speciesCode, seedlot, containerSize, isBox, pricePerTree }) => ({
			speciesCode, seedlot, containerSize, isBox, pricePerTree
		}));
		const json = buildRetreeverFile(seedlots);
		const file = new File([json], 'seedlots.retreever', { type: 'application/x-retreever' });
		try {
			if (navigator.share && navigator.canShare({ files: [file] })) {
				await navigator.share({ files: [file] });
				return;
			}
		} catch (e) {
			if ((e as Error).name === 'AbortError') return; // user cancelled
		}
		// Fallback: download the file
		const url = URL.createObjectURL(file);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'seedlots.retreever';
		a.click();
		URL.revokeObjectURL(url);
	}

	async function handleFileImport(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		try {
			const text = await file.text();
			const pkg = parseRetreeverFile(text);
			store.importSeedlots(pkg.seedlots);
		} catch (err) {
			importError = (err as Error).message;
		}
		(e.target as HTMLInputElement).value = '';
	}
</script>

<div class="cache-page" style="padding-top: calc(env(safe-area-inset-top) + 0.5rem);">

	<!-- Hidden file input for .retreever import -->
	<input
		type="file"
		accept=".retreever,application/x-retreever,application/json"
		style="display:none"
		bind:this={fileInput}
		onchange={handleFileImport}
	/>

	<!-- Header -->
	<div class="page-header">
		<h1 class="page-title">cache</h1>
		<div class="header-actions">
			<button class="hdr-btn" onclick={shareCache} title="Share seedlots">
				<Share2 class="size-5" />
			</button>
		</div>
	</div>

	<!-- Import error toast -->
	{#if importError}
		<div class="import-error" role="alert">
			{importError}
			<button onclick={() => (importError = null)}>✕</button>
		</div>
	{/if}

	<!-- Active Entry Table -->
	<div class="entry-section">
		<!-- Column headers -->
		<div class="row-grid header-row">
			<span>seedlot</span>
			<span class="col-hdr-imgs">
					<img src="/pub-Rtvr/box.webp" alt="tree box" class="hdr-type-img" />
					<img src="/pub-Rtvr/bundle.webp" alt="tree bundle" class="hdr-type-img" />
				</span>
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
								<div class="plaque plaque--seedlot {row.seedlot || row.speciesCode ? '' : 'plaque--empty'} {buzzingRows.has(index) && !row.seedlot && !row.speciesCode ? 'plaque--buzz' : ''}">
									<span class="plaque-text">{row.speciesCode && row.seedlot ? `${row.speciesCode}/${row.seedlot}` : row.speciesCode || row.seedlot || 'tap'}</span>
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
								<div class="plaque {row.containerSize ? '' : 'plaque--empty'} {buzzingRows.has(index) && !row.containerSize ? 'plaque--buzz' : ''}">
									<span class="plaque-text">{row.containerSize ?? '—'}</span>
								</div>
							</Popover.Trigger>
							<Popover.Content class="w-44 p-2" align="center">
								<div class="flex flex-col gap-2">
									<!-- Box input — blocked if bundle already has a value -->
									<div class="flex items-center gap-2">
										<img src="/pub-Rtvr/box.webp" alt="tree box" class="type-label-img {row.isBox ? '' : 'type-label-img--dim'}" />
										<Input type="number"
											value={row.isBox ? (row.containerSize ?? '') : ''}
											placeholder="270"
											class="h-9 text-base w-16 {conflictingRows.get(index) === 'box' || invalidInputs.get(index) === 'box' ? 'input-row--buzz' : ''}"
											onkeydown={(e) => rejectKey(e, index, 'box')}
											onfocus={(e) => {
												if (!row.isBox && row.containerSize) { triggerConflict(index, 'bundle'); (e.target as HTMLInputElement).blur(); return; }
												store.updateRow(index, { isBox: true });
											}}
											oninput={(e) => {
												if (!row.isBox && row.containerSize) { triggerConflict(index, 'bundle'); (e.target as HTMLInputElement).value = ''; return; }
												const v = (e.target as HTMLInputElement).valueAsNumber;
												store.updateRow(index, { containerSize: v || null, isBox: true });
											}}
										/>
									</div>
									<!-- Bundle input — blocked if box already has a value -->
									<div class="flex items-center gap-2">
										<img src="/pub-Rtvr/bundle.webp" alt="tree bundle" class="type-label-img {!row.isBox ? '' : 'type-label-img--dim'}" />
										<Input type="number"
											value={!row.isBox ? (row.containerSize ?? '') : ''}
											placeholder="15"
											class="h-9 text-base w-16 {conflictingRows.get(index) === 'bundle' || invalidInputs.get(index) === 'bundle' ? 'input-row--buzz' : ''}"
											onkeydown={(e) => rejectKey(e, index, 'bundle')}
											onfocus={(e) => {
												if (row.isBox && row.containerSize) { triggerConflict(index, 'box'); (e.target as HTMLInputElement).blur(); return; }
												store.updateRow(index, { isBox: false });
											}}
											oninput={(e) => {
												if (row.isBox && row.containerSize) { triggerConflict(index, 'box'); (e.target as HTMLInputElement).value = ''; return; }
												const v = (e.target as HTMLInputElement).valueAsNumber;
												store.updateRow(index, { containerSize: v || null, isBox: false });
											}}
										/>
									</div>
								</div>
							</Popover.Content>
						</Popover.Root>

						<!-- Count plaque -->
						<Popover.Root>
							<Popover.Trigger class="plaque-trigger">
								<div class="plaque {row.count ? '' : 'plaque--empty'} {(buzzingRows.has(index) && !row.count) || snappingCounts.has(index) ? 'plaque--buzz' : ''}">
									<span class="plaque-text">{#if pendingCounts.has(index)}{pendingCounts.get(index)}{:else if row.isBox && row.count != null}{row.count % 1 === 0 ? row.count.toFixed(1) : row.count}{:else}{row.count ?? '—'}{/if}</span>
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
						<button class="bag-btn {calcTotal(row) === 0 && !row.bagged ? 'bag-btn--empty' : ''}" onclick={() => handleBagTap(index)}>
							<img src={row.bagged ? '/pub-Rtvr/bag_full.webp' : '/pub-Rtvr/bag_empty.webp'} alt={row.bagged ? 'full' : 'empty'} />
						</button>
					</div>
				</div>
			{/each}
		</div>

		<!-- Row controls -->
		<div class="row-controls">
			<div class="row-ctrl-group">
				<button
					class="row-ctrl {addPressed ? 'pressed' : ''} text-muted-foreground"
					onpointerdown={() => (addPressed = true)}
					onpointerup={() => (addPressed = false)}
					onpointercancel={() => (addPressed = false)}
					onclick={() => { store.addRow(); removePopoverOpen = false; }}
				>
					<Plus class="size-4" /> row
				</button>
				{#if store.activeRows.length > 1}
					<Popover.Root bind:open={removePopoverOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<button {...props} class="row-ctrl {removePressed ? 'pressed' : ''} text-muted-foreground"
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

			<Popover.Root bind:open={clearPopoverOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<button {...props} class="row-ctrl {clearPressed ? 'pressed' : ''} text-muted-foreground"
							onpointerdown={() => (clearPressed = true)}
							onpointerup={() => (clearPressed = false)}
							onpointercancel={() => (clearPressed = false)}
							title="Clear cache">
							<Trash2 class="size-3.5" /> clear cache
						</button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-auto p-3" align="end">
					<p class="text-sm text-muted-foreground mb-2">Clear all rows?</p>
					<button class="row-ctrl row-ctrl--sm {confirmClearPressed ? 'pressed' : ''} text-red-400/70"
						onpointerdown={() => (confirmClearPressed = true)}
						onpointerup={() => (confirmClearPressed = false)}
						onpointercancel={() => (confirmClearPressed = false)}
						onclick={() => { store.clearCache(); clearPopoverOpen = false; }}>
						<Trash2 class="size-3.5" /> clear
					</button>
				</Popover.Content>
			</Popover.Root>
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
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: lowercase;
		color: #ffd700;
		line-height: 1;
	}

	.header-actions {
		display: flex;
		gap: 0.25rem;
	}

	.hdr-btn {
		width: 2.25rem;
		height: 2.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		color: #ffd700;
		background: transparent;
		border: none;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition: color 120ms, background 120ms;
	}

	.hdr-btn:active {
		color: #ffe566;
		background: #2e2e2e;
	}

	/* ── Import error toast ── */
	.import-error {
		position: fixed;
		bottom: 5rem;
		left: 1rem;
		right: 1rem;
		background: #2d1c1c;
		border: 1px solid rgba(140, 55, 55, 0.5);
		color: #d4d4d4;
		font-size: 0.85rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		z-index: 100;
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
		padding: 0.35rem 0.75rem;
		margin-bottom: 0.4rem;
		background: #242424;
		border-radius: 0.75rem;
		border: 1px solid #2e2e2e;
	}

	.header-row span:not(.col-hdr-imgs) {
		display: block;
		text-align: center;
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: lowercase;
		letter-spacing: 0.03em;
		color: #9ca3af;
	}

	.header-row span:last-child {
		visibility: hidden;
	}

	.col-hdr-imgs {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.05rem;
		white-space: nowrap;
		flex-wrap: nowrap;
	}

	.hdr-type-img {
		height: 1.3rem;
		width: auto;
		object-fit: contain;
		flex-shrink: 0;
	}

	/* Grid */
	.row-grid {
		display: grid;
		grid-template-columns: 2fr 0.95fr 0.95fr 0.95fr 2.5rem;
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

	.row-card--bagged .plaque--total {
		box-shadow:
			0 5px 14px rgba(0, 0, 0, 0.65),
			0 2px 5px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
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
		font-size: 0.85rem;
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

	.bag-btn--empty {
		opacity: 0.6;
		cursor: default;
	}

	/* Bundle/box type label images in popover */
	:global(.type-label-img) {
		height: 1.5rem;
		width: 2.5rem;
		object-fit: contain;
		flex-shrink: 0;
		transition: opacity 150ms;
	}
	:global(.type-label-img--dim) {
		opacity: 0.3;
	}

	/* Input red buzz — fires on the FILLED input when user tries to switch types */
	@keyframes input-buzz-red {
		0%   { box-shadow: none; }
		20%  { box-shadow: 0 0 0 2px rgba(180, 55, 55, 0.8), inset 0 0 0 999px rgba(60, 18, 18, 0.75); }
		100% { box-shadow: none; }
	}
	:global(.input-row--buzz) {
		animation: input-buzz-red 1.5s ease-out forwards;
	}

	/* Buzz animation — fires on empty-bag tap when total = 0 */
	@keyframes buzz-red {
		0%   { box-shadow: none; background: #333333; }
		20%  { box-shadow: 0 0 0 1px rgba(140, 55, 55, 0.55); background: #2d1c1c; }
		100% { box-shadow: none; background: #333333; }
	}
	.plaque--buzz {
		animation: buzz-red 1.5s ease-out forwards;
	}


	/* ── Row controls ── */
	.row-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.75rem;
		padding: 0 0.25rem;
	}

	.row-ctrl-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
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
