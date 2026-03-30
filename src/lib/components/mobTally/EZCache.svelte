<script lang="ts">
	import * as Popover from "$osem/components/ui/popover";
	import * as Table from "$osem/components/ui/table";
	import { Input } from "$osem/components/ui/input";
	import { Plus, Share2, Trash2, User } from "lucide-svelte";
	import type {
		CacheStore,
		CacheRow,
		SeedlotSpec,
	} from "$osem/mobTally/types.js";
	import {
		parseRetreeverFile,
		buildRetreeverFile,
	} from "$osem/mobTally/seedlotPackage.js";

	let { store }: { store: CacheStore } = $props();

	let removePopoverOpen = $state(false);
	let clearPopoverOpen = $state(false);
	let bagOutPopoverOpen = $state(false);
	let addPressed = $state(false);
	let removePressed = $state(false);
	let confirmPressed = $state(false);
	let clearPressed = $state(false);
	let confirmClearPressed = $state(false);
	let buzzingRows = $state<Set<number>>(new Set());
	let conflictingRows = $state<Map<number, "box" | "bundle">>(new Map());
	let invalidInputs = $state<Map<number, "box" | "bundle" | "both">>(
		new Map(),
	);
	let snappingCounts = $state<Set<number>>(new Set());
	let pendingCounts = $state<Map<number, number>>(new Map());
	const snapTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();

	function calcTotal(row: (typeof store.activeRows)[0]): number {
		if (row.isBox) {
			return Math.floor((row.boxSize ?? 0) * (row.boxCount ?? 0));
		}
		return Math.floor((row.bundleSize ?? 0) * (row.bundleCount ?? 0));
	}

	const ALLOWED_KEYS = new Set([
		"Backspace",
		"Delete",
		"Tab",
		"Enter",
		"ArrowLeft",
		"ArrowRight",
		"ArrowUp",
		"ArrowDown",
	]);
	function rejectKey(
		e: KeyboardEvent,
		index: number,
		type: "box" | "bundle",
	) {
		if (ALLOWED_KEYS.has(e.key) || e.metaKey || e.ctrlKey) return;
		if (!/^[0-9.]$/.test(e.key)) {
			e.preventDefault();
			invalidInputs = new Map([...invalidInputs, [index, type]]);
			setTimeout(() => {
				invalidInputs = new Map(
					[...invalidInputs].filter(([k]) => k !== index),
				);
			}, 1500);
		}
	}

	function triggerConflict(index: number, filled: "box" | "bundle") {
		conflictingRows = new Map([...conflictingRows, [index, filled]]);
		setTimeout(() => {
			conflictingRows = new Map(
				[...conflictingRows].filter(([k]) => k !== index),
			);
		}, 1600);
	}

	function triggerInvalidBoth(index: number) {
		invalidInputs = new Map([...invalidInputs, [index, "both"]]);
		setTimeout(() => {
			invalidInputs = new Map(
				[...invalidInputs].filter(([k]) => k !== index),
			);
		}, 1500);
	}

	function snapToHalf(value: number): number {
		return Math.round(value * 2) / 2;
	}

	function handleCountInput(
		index: number,
		raw: number | null,
		isBox: boolean,
	) {
		const countField = isBox ? "boxCount" : "bundleCount";
		if (raw == null || isNaN(raw)) {
			store.updateRow(index, { [countField]: null });
			return;
		}
		const snapped = isBox ? snapToHalf(raw) : Math.round(raw);

		if (isBox && snapped !== raw) {
			// Cancel any in-flight snap for this row (user still typing)
			if (snapTimers.has(index)) clearTimeout(snapTimers.get(index)!);

			// Show raw value with red error flash, then snap after short delay
			pendingCounts = new Map([...pendingCounts, [index, raw]]);
			snappingCounts = new Set([...snappingCounts, index]);

			const timer = setTimeout(() => {
				snapTimers.delete(index);
				pendingCounts = new Map(
					[...pendingCounts].filter(([k]) => k !== index),
				);
				store.updateRow(index, { [countField]: snapped });
				setTimeout(() => {
					snappingCounts = new Set(
						[...snappingCounts].filter((i) => i !== index),
					);
				}, 1200);
			}, 420);
			snapTimers.set(index, timer);
			return;
		}

		store.updateRow(index, { [countField]: snapped });
	}

	function handleBagTap(index: number) {
		const row = store.activeRows[index];
		const noSeedlot = !row.seedlot && !row.speciesCode;
		const noTotal = calcTotal(row) === 0;
		if (noSeedlot || noTotal) {
			buzzingRows = new Set([...buzzingRows, index]);
			setTimeout(() => {
				buzzingRows = new Set(
					[...buzzingRows].filter((i) => i !== index),
				);
			}, 1600);
			return;
		}
		store.bagUpRow(index);
	}

	const baggedTrees = $derived(
		store.activeRows
			.filter((r: CacheRow) => r.bagged)
			.reduce((sum: number, r: CacheRow) => sum + calcTotal(r), 0),
	);
	const baggedValue = $derived(
		store.activeRows
			.filter((r: CacheRow) => r.bagged)
			.reduce(
				(sum: number, r: CacheRow) =>
					sum + calcTotal(r) * (r.pricePerTree ?? 0),
				0,
			),
	);
	const anyBagged = $derived(
		store.activeRows.some((r: CacheRow) => r.bagged),
	);
	const baggedCount = $derived(
		store.activeRows.filter((r: CacheRow) => r.bagged).length,
	);
	const bagsImg = $derived(`/pub-Rtvr/bags-${Math.min(baggedCount, 4)}.webp`);

	// ── Share / import ──
	let fileInput: HTMLInputElement;
	let importError = $state<string | null>(null);

	async function shareCache() {
		const seedlots: SeedlotSpec[] = store.activeRows.map(
			({
				speciesCode,
				seedlot,
				boxSize,
				bundleSize,
				isBox,
				pricePerTree,
			}: CacheRow) => ({
				speciesCode,
				seedlot,
				boxSize,
				bundleSize,
				isBox,
				pricePerTree,
			}),
		);
		const json = buildRetreeverFile(seedlots);
		const file = new File([json], "seedlots.retreever", {
			type: "application/x-retreever",
		});
		try {
			if (navigator.share && navigator.canShare({ files: [file] })) {
				await navigator.share({ files: [file] });
				return;
			}
		} catch (e) {
			if ((e as Error).name === "AbortError") return; // user cancelled
		}
		// Fallback: download the file
		const url = URL.createObjectURL(file);
		const a = document.createElement("a");
		a.href = url;
		a.download = "seedlots.retreever";
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
		(e.target as HTMLInputElement).value = "";
	}
</script>

<div
	class="cache-page"
	style="padding-top: calc(env(safe-area-inset-top) + 0.5rem);"
>
	<!-- Hidden file input for .retreever import -->
	<input
		type="file"
		accept=".retreever,application/x-retreever,application/json"
		style="display:none"
		bind:this={fileInput}
		onchange={handleFileImport}
	/>

	<!-- Header with navbar -->
	<div class="page-header">
		<div class="navbar">
			<h1 class="page-title">EZCache</h1>
			<a href="/mobile/account" class="account-link" title="Account">
				<User class="size-5" />
			</a>
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
		<!-- Column headers (fixed outside scroll) -->
		<div class="row-grid header-row">
			<span>seedlot</span>
			<span></span>
			<span class="col-hdr-imgs">
				<img
					src="/pub-Rtvr/box.webp"
					alt="tree box"
					class="hdr-type-img"
				/>
				<img
					src="/pub-Rtvr/bundle.webp"
					alt="tree bundle"
					class="hdr-type-img"
				/>
			</span>
			<span>count</span>
			<span>total</span>
			<span></span>
		</div>

		<!-- Scrollable rows container -->
		<div class="rows-scroll-container">
			<!-- Rows -->
			<div class="rows-list">
				{#each store.activeRows as row, index (row.id)}
					<div
						class="row-card {row.bagged
							? 'row-card--bagged'
							: ''} {calcTotal(row) > 0
							? 'row-card--filled'
							: ''}"
					>
						<div class="row-grid">
							<!-- Seedlot plaque -->
							<Popover.Root>
								<Popover.Trigger class="plaque-trigger">
									<div
										class="plaque plaque--seedlot {row.seedlot ||
										row.speciesCode
											? ''
											: 'plaque--empty'} {buzzingRows.has(
											index,
										) &&
										!row.seedlot &&
										!row.speciesCode
											? 'plaque--buzz'
											: ''}"
									>
										<span class="plaque-text"
											>{row.speciesCode && row.seedlot
												? `${row.speciesCode}/${row.seedlot}`
												: row.speciesCode ||
													row.seedlot ||
													"tap"}</span
										>
									</div>
								</Popover.Trigger>
								<Popover.Content class="w-80 p-3" align="start">
									<div class="flex flex-col gap-3">
										<div class="flex items-center gap-2">
											<span
												class="text-sm text-muted-foreground w-16"
												>species</span
											>
											<Input
												value={row.speciesCode}
												oninput={(e) =>
													store.updateRow(index, {
														speciesCode: (
															e.target as HTMLInputElement
														).value,
													})}
												placeholder="PL"
												class="h-10 text-base flex-1"
											/>
										</div>
										<div class="flex items-center gap-2">
											<span
												class="text-sm text-muted-foreground w-16"
												>seedlot</span
											>
											<Input
												value={row.seedlot}
												oninput={(e) =>
													store.updateRow(index, {
														seedlot: (
															e.target as HTMLInputElement
														).value,
													})}
												placeholder="LF1.2 futureTP 2026"
												class="h-10 text-base flex-1"
											/>
										</div>
									</div>
								</Popover.Content>
							</Popover.Root>

							<!-- Box/Bundle toggle circle -->
							<button
								class="type-circle {!row.boxSize ||
								!row.bundleSize
									? 'type-circle--flat'
									: ''}"
								onclick={() => {
									if (row.boxSize && row.bundleSize) {
										store.updateRow(index, {
											isBox: !row.isBox,
										});
									} else {
										triggerInvalidBoth(index);
									}
								}}
							>
								<img
									src={row.boxSize &&
									row.bundleSize &&
									!row.isBox
										? "/pub-Rtvr/bundle.webp"
										: "/pub-Rtvr/box.webp"}
									alt={row.boxSize &&
									row.bundleSize &&
									!row.isBox
										? "bundle"
										: "box"}
									class="type-circle-img"
								/>
							</button>

							<!-- Bundle/Box size plaque -->
							<Popover.Root>
								<Popover.Trigger class="plaque-trigger">
									<div
										class="plaque {(
											row.isBox
												? row.boxSize
												: row.bundleSize
										)
											? ''
											: 'plaque--empty'} {(buzzingRows.has(
											index,
										) &&
											!(row.isBox
												? row.boxSize
												: row.bundleSize)) ||
										invalidInputs.has(index)
											? 'plaque--buzz'
											: ''}"
									>
										<span class="plaque-text"
											>{(row.isBox
												? row.boxSize
												: row.bundleSize) ?? "—"}</span
										>
									</div>
								</Popover.Trigger>
								<Popover.Content
									class="w-44 p-2"
									align="center"
								>
									<div class="flex flex-col gap-2">
										<!-- Box size input -->
										<div class="flex items-center gap-2">
											<img
												src="/pub-Rtvr/box.webp"
												alt="tree box"
												class="type-label-img {row.isBox
													? ''
													: 'type-label-img--dim'}"
											/>
											<Input
												type="number"
												value={row.boxSize ?? ""}
												placeholder="270"
												class="h-9 text-base w-16 {[
													'box',
													'both',
												].includes(
													invalidInputs.get(index) ??
														'',
												)
													? 'input-row--buzz'
													: ''}"
												onkeydown={(e) =>
													rejectKey(e, index, "box")}
												oninput={(e) => {
													const v = (
														e.target as HTMLInputElement
													).valueAsNumber;
													if (
														v &&
														row.bundleSize &&
														v % row.bundleSize !== 0
													) {
														triggerInvalidBoth(
															index,
														);
														(
															e.target as HTMLInputElement
														).value = "";
														store.updateRow(index, {
															boxSize: null,
														});
														return;
													}
													store.updateRow(index, {
														boxSize: v || null,
													});
												}}
											/>
										</div>
										<!-- Bundle size input -->
										<div class="flex items-center gap-2">
											<img
												src="/pub-Rtvr/bundle.webp"
												alt="tree bundle"
												class="type-label-img {!row.isBox
													? ''
													: 'type-label-img--dim'}"
											/>
											<Input
												type="number"
												value={row.bundleSize ?? ""}
												placeholder="15"
												class="h-9 text-base w-16 {[
													'bundle',
													'both',
												].includes(
													invalidInputs.get(index) ??
														'',
												)
													? 'input-row--buzz'
													: ''}"
												onkeydown={(e) =>
													rejectKey(
														e,
														index,
														"bundle",
													)}
												oninput={(e) => {
													const v = (
														e.target as HTMLInputElement
													).valueAsNumber;
													if (
														v &&
														row.boxSize &&
														row.boxSize % v !== 0
													) {
														triggerInvalidBoth(
															index,
														);
														(
															e.target as HTMLInputElement
														).value = "";
														store.updateRow(index, {
															bundleSize: null,
														});
														return;
													}
													store.updateRow(index, {
														bundleSize: v || null,
													});
												}}
											/>
										</div>
										<!-- Price input -->
										<div
											class="flex items-center gap-2 mt-2 pt-2 border-t border-white/10"
										>
											<span
												class="text-sm text-muted-foreground w-10"
												>$/tree</span
											>
											<Input
												type="number"
												value={row.pricePerTree ?? ""}
												placeholder="0.00"
												oninput={(e) =>
													store.updateRow(index, {
														pricePerTree:
															(
																e.target as HTMLInputElement
															).valueAsNumber ||
															null,
													})}
												class="h-9 text-base w-16"
											/>
										</div>
									</div>
								</Popover.Content>
							</Popover.Root>

							<!-- Count input (direct, no popover) -->
							<Input
								type="number"
								value={(row.isBox
									? row.boxCount
									: row.bundleCount) ?? ""}
								placeholder={row.isBox ? "1.5" : "1"}
								oninput={(e) => {
									const v = (e.target as HTMLInputElement)
										.valueAsNumber;
									handleCountInput(
										index,
										isNaN(v) ? null : v,
										row.isBox,
									);
								}}
								class="count-input {(buzzingRows.has(index) &&
									!(row.isBox
										? row.boxCount
										: row.bundleCount)) ||
								snappingCounts.has(index)
									? 'input-row--buzz'
									: ''}"
							/>

							<!-- Total plaque (non-interactive) -->
							<div class="plaque plaque--total">
								<span class="plaque-text"
									>{calcTotal(row) || "—"}</span
								>
							</div>

							<!-- Bag up button -->
							<div
								class="bag-circle {row.bagged
									? 'bag-circle--bagged'
									: ''}"
							>
								<button
									class="bag-btn {calcTotal(row) === 0 &&
									!row.bagged
										? 'bag-btn--empty'
										: ''}"
									onclick={() => handleBagTap(index)}
								>
									<img
										src={row.bagged
											? "/pub-Rtvr/bag_full.webp"
											: "/pub-Rtvr/bag_empty.webp"}
										alt={row.bagged ? "full" : "empty"}
									/>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Row controls (scrolls with rows) -->
			<div class="row-controls">
				<div class="row-ctrl-group">
					<button
						class="row-ctrl {addPressed
							? 'pressed'
							: ''} text-muted-foreground"
						onpointerdown={() => (addPressed = true)}
						onpointerup={() => (addPressed = false)}
						onpointercancel={() => (addPressed = false)}
						onclick={() => {
							store.addRow();
							removePopoverOpen = false;
						}}
					>
						<Plus class="size-4" /> row
					</button>
					{#if store.activeRows.length > 1}
						<Popover.Root bind:open={removePopoverOpen}>
							<Popover.Trigger>
								{#snippet child({ props })}
									<button
										{...props}
										class="row-ctrl {removePressed
											? 'pressed'
											: ''} text-muted-foreground"
										onpointerdown={() =>
											(removePressed = true)}
										onpointerup={() =>
											(removePressed = false)}
										onpointercancel={() =>
											(removePressed = false)}
									>
										<span class="text-base leading-none"
											>−</span
										> row
									</button>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content class="w-auto p-3" align="start">
								<p class="text-sm text-muted-foreground mb-2">
									Remove last row?
								</p>
								<button
									class="row-ctrl row-ctrl--sm {confirmPressed
										? 'pressed'
										: ''} text-red-400/70"
									onpointerdown={() =>
										(confirmPressed = true)}
									onpointerup={() => (confirmPressed = false)}
									onpointercancel={() =>
										(confirmPressed = false)}
									onclick={() => {
										store.removeLastRow();
										removePopoverOpen = false;
									}}
								>
									<span class="leading-none">−</span> row
								</button>
							</Popover.Content>
						</Popover.Root>
					{/if}
				</div>

				<Popover.Root bind:open={clearPopoverOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<button
								{...props}
								class="row-ctrl {clearPressed
									? 'pressed'
									: ''} text-muted-foreground"
								onpointerdown={() => (clearPressed = true)}
								onpointerup={() => (clearPressed = false)}
								onpointercancel={() => (clearPressed = false)}
								title="Clear EZCache"
							>
								<Trash2 class="size-3.5" />
							</button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto p-3" align="end">
						<p class="text-sm text-muted-foreground mb-2">
							clear EZCache?
						</p>
						<button
							class="row-ctrl row-ctrl--sm {confirmClearPressed
								? 'pressed'
								: ''} text-red-400/70"
							onpointerdown={() => (confirmClearPressed = true)}
							onpointerup={() => (confirmClearPressed = false)}
							onpointercancel={() =>
								(confirmClearPressed = false)}
							onclick={() => {
								store.clearCache();
								clearPopoverOpen = false;
							}}
						>
							<Trash2 class="size-3.5" /> clear
						</button>
					</Popover.Content>
				</Popover.Root>
			</div>
		</div>
		<!-- end rows-scroll-container -->
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
		{#if anyBagged}
			<Popover.Root bind:open={bagOutPopoverOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							class="bags-img-btn"
							aria-label="Bag out"
						>
							<img
								src={bagsImg}
								alt="planting bags"
								class="bags-img bags-img--active"
							/>
						</button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-auto p-3" align="center" side="top">
					<p class="text-sm text-muted-foreground mb-1">
						confirm bag out?
					</p>
					<p class="bagout-confirm-totals">
						{baggedTrees} trees{baggedValue > 0
							? ` · $${baggedValue.toFixed(2)}`
							: ""}
					</p>
					<button
						class="row-ctrl text-muted-foreground"
						onclick={() => {
							store.bagOut();
							bagOutPopoverOpen = false;
						}}
					>
						bag out
					</button>
				</Popover.Content>
			</Popover.Root>
		{:else}
			<img src={bagsImg} alt="planting bags" class="bags-img" />
		{/if}
	</div>

	<!-- Today's tallies -->
	{#if store.bagOuts.length > 0}
		<div class="history-section">
			<h2 class="history-heading">today's tallies</h2>
			{#each store.bagOuts as bagOut (bagOut.id)}
				<div class="bagout-group">
					<div class="bagout-header">
						<span
							>bagged at {new Date(
								bagOut.baggedOutAt,
							).toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							})}</span
						>
						<span class="bagout-summary"
							>{bagOut.totalTrees} trees{bagOut.totalValue > 0
								? ` · $${bagOut.totalValue.toFixed(2)}`
								: ""}</span
						>
					</div>
					<Table.Root>
						<Table.Body>
							{#each bagOut.rows as row (row.id)}
								<Table.Row>
									<Table.Cell class="font-medium"
										>{row.speciesCode}</Table.Cell
									>
									<Table.Cell
										class="text-muted-foreground text-xs"
										>{row.seedlot}</Table.Cell
									>
									<Table.Cell class="text-center text-sm"
										>{(row.isBox
											? row.boxSize
											: row.bundleSize) ?? ""}</Table.Cell
									>
									<Table.Cell class="text-center text-sm"
										>{(row.isBox
											? row.boxCount
											: row.bundleCount) ??
											""}</Table.Cell
									>
									<Table.Cell class="text-center font-bold"
										>{Math.floor(
											row.isBox
												? (row.boxSize ?? 0) *
														(row.boxCount ?? 0)
												: (row.bundleSize ?? 0) *
														(row.bundleCount ?? 0),
										)}</Table.Cell
									>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Share FAB -->
	<button class="fab" onclick={shareCache} title="Share seedlots">
		<Share2 class="size-5" />
	</button>
</div>

<style>
	/* ── Theme palette (permanent dark) ──
	   background: #1a1a1a   card: #222222   foreground: #fafafa
	   muted-fg: #6b7280     accent/gold: #ffd700
	*/

	/* ── Header ── */
	.page-header {
		padding: 0.5rem 1rem 0.25rem;
		border-bottom: 1px solid #2a2a2a;
		margin-bottom: 0.25rem;
	}

	.navbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: #ffd700;
		line-height: 1;
	}

	.account-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		color: #6b7280;
		text-decoration: none;
		transition:
			color 120ms,
			background 120ms;
		-webkit-tap-highlight-color: transparent;
	}

	.account-link:active {
		background: rgba(255, 255, 255, 0.05);
		color: #9ca3af;
	}

	/* ── Share FAB ── */
	.fab {
		position: fixed;
		bottom: calc(env(safe-area-inset-bottom) + 1.25rem);
		right: 1.25rem;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		background: #222;
		border: 1px solid #3a3a3a;
		color: #ffd700;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
		transition:
			background 120ms,
			transform 120ms;
		z-index: 50;
	}

	.fab:active {
		background: #2e2e2e;
		transform: scale(0.94);
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
		padding: 0.5rem 0.5rem 0;
	}

	/* Scrollable rows container — fits exactly 4 rows */
	.rows-scroll-container {
		max-height: 14.5rem;
		overflow-y: auto;
		overflow-x: hidden;
		padding-right: 0.25rem;
	}

	/* Yellow scrollbar */
	.rows-scroll-container::-webkit-scrollbar {
		width: 4px;
	}

	.rows-scroll-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.rows-scroll-container::-webkit-scrollbar-thumb {
		background: #ffd700;
		border-radius: 2px;
	}

	/* Firefox scrollbar */
	.rows-scroll-container {
		scrollbar-width: thin;
		scrollbar-color: #ffd700 transparent;
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
		grid-template-columns: 1.6fr 3rem 0.8fr 0.8fr 0.8fr 3rem;
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
		padding: 0.15rem 0.25rem;
		background: #272727;
		box-shadow: none;
		transition:
			background 250ms ease,
			box-shadow 250ms ease;
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
		color: #6b7280; /* always gray until bagged */
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.plaque--empty .plaque-text {
		color: #4b5563;
		font-size: 0.75rem;
	}

	/* ── Type (box/bundle) circle container ── */
	.type-circle {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		background: #333333;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.5),
			0 2px 4px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			transform 100ms ease,
			background 100ms ease;
	}

	.type-circle:active:not(:disabled) {
		transform: scale(0.92);
		background: #3d3d3d;
	}

	.type-circle--flat {
		box-shadow: none;
		background: #2a2a2a;
		cursor: default;
	}

	.type-circle--flat .type-circle-img {
		opacity: 0.5;
	}

	.type-circle-img {
		width: 2.4rem;
		height: 2.4rem;
		object-fit: contain;
	}

	/* ── Bag circle container ── */
	.bag-circle {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		background: #333333;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.5),
			0 2px 4px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition:
			background 100ms,
			box-shadow 250ms ease;
	}

	.bag-circle--bagged {
		box-shadow:
			0 5px 14px rgba(0, 0, 0, 0.65),
			0 2px 5px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.07);
	}

	/* ── Count input ── */
	.count-input {
		width: 4rem;
		height: 2.5rem;
		text-align: center;
		font-size: 0.9rem;
		background: #262626;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
		color: #9ca3af;
	}

	.count-input:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.2);
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
		0% {
			box-shadow: none;
		}
		20% {
			box-shadow:
				0 0 0 2px rgba(180, 55, 55, 0.8),
				inset 0 0 0 999px rgba(60, 18, 18, 0.75);
		}
		100% {
			box-shadow: none;
		}
	}
	:global(.input-row--buzz) {
		animation: input-buzz-red 1.5s ease-out forwards;
	}

	/* Buzz animation — fires on empty-bag tap when total = 0 */
	@keyframes buzz-red {
		0% {
			box-shadow: none;
			background: #333333;
		}
		20% {
			box-shadow: 0 0 0 1px rgba(140, 55, 55, 0.55);
			background: #2d1c1c;
		}
		100% {
			box-shadow: none;
			background: #333333;
		}
	}
	.plaque--buzz {
		animation: buzz-red 1.5s ease-out forwards;
	}

	/* ── Row controls ── */
	.row-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.5rem;
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
		gap: 0.25rem;
		padding: 0.25rem 1rem 1rem;
	}

	.bags-totals {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		min-height: 1.5rem;
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

	.bagout-confirm-totals {
		font-size: 0.95rem;
		font-weight: 600;
		color: #ffd700;
		margin-bottom: 0.5rem;
		text-align: center;
	}

	.bags-img-btn {
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		display: block;
	}

	.bags-img {
		width: 220px;
		height: 180px;
		object-fit: cover;
		object-position: center bottom;
	}

	.bags-img--active {
		transition:
			transform 120ms ease,
			filter 120ms ease;
	}

	.bags-img-btn:active .bags-img--active {
		transform: scale(0.96);
		filter: brightness(1.15);
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
	:global(input[type="number"]::-webkit-outer-spin-button),
	:global(input[type="number"]::-webkit-inner-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}
	:global(input[type="number"]) {
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
		gap: 0.25rem;
		height: 2rem;
		padding: 0 0.5rem;
		border: 1px dashed currentColor;
		border-radius: 0.5rem;
		background: transparent;
		font-size: 0.8rem;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			transform 150ms ease,
			filter 150ms ease,
			opacity 150ms ease;
	}

	.row-ctrl--sm {
		height: 2rem;
		padding: 0 0.625rem;
	}

	.row-ctrl.pressed {
		transform: scale(0.88);
		filter: brightness(1.6);
		opacity: 0.7;
		transition:
			transform 50ms ease,
			filter 50ms ease,
			opacity 50ms ease;
	}
</style>
