<script lang="ts">
	import * as Popover from "$osem/components/ui/popover";
	import * as Table from "$osem/components/ui/table";
	import { Input } from "$osem/components/ui/input";
	import { Plus, Share2, TreePine, User } from "lucide-svelte";
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
	let bagOutFlashing = $state(false);
	let bagOutFlashImg = $state<string | null>(null);
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
	const sizeValidationTimers: Map<
		string,
		ReturnType<typeof setTimeout>
	> = new Map();
	let sizePopoverOpenIndex = $state<number | null>(null);
	// Local staging state — inputs write here while popover is open, committed to store on close
	let localBoxSize = $state<string>("");
	let localBundleSize = $state<string>("");

	// Initialize local state whenever the size popover opens
	$effect(() => {
		if (sizePopoverOpenIndex !== null) {
			const row = store.activeRows[sizePopoverOpenIndex];
			localBoxSize = row.boxSize?.toString() ?? "";
			localBundleSize = row.bundleSize?.toString() ?? "";
		}
	});

	// On mount only, check for invalid rows and force popover open
	let hasCheckedOnMount = false;
	$effect(() => {
		if (hasCheckedOnMount) return;
		hasCheckedOnMount = true;
		const invalidIndex = store.activeRows.findIndex(
			(row) =>
				row.boxSize &&
				row.bundleSize &&
				row.boxSize % row.bundleSize !== 0,
		);
		if (invalidIndex !== -1) {
			sizePopoverOpenIndex = invalidIndex;
			triggerInvalidBoth(invalidIndex);
		}
	});

	// Default price override (in dollars, null = no override)
	let defaultPricePopoverOpen = $state(false);
	let defaultPrice = $state<number | null>(null);
	let defaultPriceEdited = $state(false); // tracks if user edited in current session

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

	function commitSizeAndClose(index: number): boolean {
		const boxVal = parseFloat(localBoxSize) || null;
		const bundleVal = parseFloat(localBundleSize) || null;
		if (boxVal && bundleVal && boxVal % bundleVal !== 0) {
			triggerInvalidBoth(index);
			return false;
		}
		store.updateRow(index, { boxSize: boxVal, bundleSize: bundleVal });
		sizePopoverOpenIndex = null;
		return true;
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
		// Clear first to re-trigger animation if already set
		invalidInputs = new Map(
			[...invalidInputs].filter(([k]) => k !== index),
		);
		// Use microtask to ensure the clear renders before re-setting
		queueMicrotask(() => {
			invalidInputs = new Map([...invalidInputs, [index, "both"]]);
		});
	}

	function clearInvalidBoth(index: number) {
		invalidInputs = new Map(
			[...invalidInputs].filter(([k]) => k !== index),
		);
	}

	function validateSizeOnBlur(
		index: number,
		boxSize: number | null,
		bundleSize: number | null,
	) {
		// Clear any pending validation timer
		const timerKey = `${index}`;
		if (sizeValidationTimers.has(timerKey)) {
			clearTimeout(sizeValidationTimers.get(timerKey)!);
			sizeValidationTimers.delete(timerKey);
		}

		// If both are set, check divisibility
		if (boxSize && bundleSize && boxSize % bundleSize !== 0) {
			triggerInvalidBoth(index);
			return false;
		}
		clearInvalidBoth(index);
		return true;
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
					sum + calcTotal(r) * (defaultPrice ?? r.pricePerTree ?? 0),
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

	// Average price per tree for bagged rows
	const avgPricePerTree = $derived(
		baggedTrees > 0 ? baggedValue / baggedTrees : 0,
	);

	// Format price with smart decimals: min 2, max 3
	function formatPrice(price: number): string {
		const rounded3 = Math.round(price * 1000) / 1000;
		const rounded2 = Math.round(price * 100) / 100;
		// If rounding to 2 decimals loses precision, use 3
		if (Math.abs(rounded3 - rounded2) >= 0.001) {
			return rounded3.toFixed(3);
		}
		return rounded2.toFixed(2);
	}

	// Cents-based price input: type cents directly, decimal for fractional cents
	// 2 → 2¢ ($0.02), 22 → 22¢ ($0.22), 225 → 225¢ ($2.25), 22.5 → 22.5¢ ($0.225)
	function handlePriceInput(index: number, e: Event) {
		const input = e.target as HTMLInputElement;
		// Allow digits and one decimal point
		const raw = input.value.replace(/[^\d.]/g, "");
		// Handle multiple decimals - keep only first
		const parts = raw.split(".");
		const cleaned =
			parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");

		if (!cleaned || cleaned === ".") {
			store.updateRow(index, { pricePerTree: null });
			input.value = "";
			return;
		}

		const cents = parseFloat(cleaned);
		if (isNaN(cents)) {
			store.updateRow(index, { pricePerTree: null });
			input.value = "";
			return;
		}

		// Store as dollars internally
		const dollars = cents / 100;
		store.updateRow(index, { pricePerTree: dollars });
		// Display the cents value as typed
		input.value = cleaned;
	}

	// Format price for display in input (show cents)
	function displayPrice(price: number | null): string {
		if (price == null) return "";
		// Round to avoid floating point errors (e.g. 2.03 * 100 = 202.99999...)
		const cents = Math.round(price * 1000) / 10;
		// Show decimal only if fractional cents
		if (cents % 1 === 0) {
			return cents.toFixed(0);
		}
		// Limit to 1 decimal place for fractional cents
		return cents.toFixed(1);
	}

	// Format price for display on plaque (cents, with ¢ symbol)
	function displayPricePlaque(price: number | null): string {
		if (price == null) return "—";
		// Round to avoid floating point errors
		const cents = Math.round(price * 1000) / 10;
		// Show decimal only if fractional cents
		if (cents % 1 === 0) {
			return cents.toFixed(0) + "¢";
		}
		return cents.toFixed(1) + "¢";
	}

	// Get effective price for a row (default override or row's own price)
	function getEffectivePrice(row: CacheRow): number | null {
		return defaultPrice ?? row.pricePerTree;
	}

	// Handle default price input (same cents-based logic)
	function handleDefaultPriceInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const raw = input.value.replace(/[^\d.]/g, "");
		const parts = raw.split(".");
		const cleaned =
			parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");

		if (!cleaned || cleaned === ".") {
			defaultPrice = null;
			input.value = "";
			return;
		}

		const cents = parseFloat(cleaned);
		if (isNaN(cents)) {
			defaultPrice = null;
			input.value = "";
			return;
		}

		defaultPrice = cents / 100;
		input.value = cleaned;
	}

	// Clear default price (called when header clicked again)
	function clearDefaultPrice() {
		defaultPrice = null;
		defaultPricePopoverOpen = false;
	}

	// Reset edited flag when popover closes
	$effect(() => {
		if (!defaultPricePopoverOpen) {
			defaultPriceEdited = false;
		}
	});

	// Bag-out with flash animation
	function handleBagOut() {
		// Brief delay so user sees the button release before popover closes
		setTimeout(() => {
			bagOutPopoverOpen = false;

			// Start flash sequence: 3 cycles of bags-3 → bags-0
			bagOutFlashing = true;
			const flashSequence = [
				"/pub-Rtvr/bags-3.webp",
				"/pub-Rtvr/bags-0.webp",
				"/pub-Rtvr/bags-3.webp",
				"/pub-Rtvr/bags-0.webp",
				"/pub-Rtvr/bags-3.webp",
				"/pub-Rtvr/bags-0.webp",
			];
			let i = 0;
			bagOutFlashImg = flashSequence[0];

			const flashInterval = setInterval(() => {
				i++;
				if (i >= flashSequence.length) {
					clearInterval(flashInterval);
					// Actually bag out now (clears the rows)
					store.bagOut();
					bagOutFlashing = false;
					bagOutFlashImg = null;
					return;
				}
				bagOutFlashImg = flashSequence[i];
			}, 400);
		}, 350);
	}

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

	// Svelte action: clamp element to viewport
	function clampToViewport(node: HTMLElement) {
		const rect = node.getBoundingClientRect();
		const pad = 8;
		// Clamp left edge
		if (rect.left < pad) {
			node.style.left = `${pad - rect.left + parseFloat(getComputedStyle(node).left || "0")}px`;
			node.style.right = "auto";
		}
		// Clamp right edge
		if (rect.right > window.innerWidth - pad) {
			node.style.right = `${rect.right - window.innerWidth + pad}px`;
			node.style.left = "auto";
		}
	}
</script>

<!-- Blocking overlay when size popover is open -->
{#if sizePopoverOpenIndex !== null}
	<div
		class="size-popover-overlay"
		onclick={() => {
			if (sizePopoverOpenIndex !== null)
				commitSizeAndClose(sizePopoverOpenIndex);
		}}
		onkeydown={() => {}}
		role="button"
		tabindex="-1"
	></div>
{/if}

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
			<span class="col-hdr-type">
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
			<Popover.Root bind:open={defaultPricePopoverOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							class="price-header-btn {defaultPrice !== null
								? 'price-header-btn--active'
								: ''}"
						>
							{#if defaultPrice !== null}
								{displayPricePlaque(defaultPrice)}
							{:else}
								price
							{/if}
						</button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-32 p-2" align="end">
					<div class="flex items-center gap-2">
						<span class="text-sm text-muted-foreground">¢/tree</span
						>
						<input
							type="text"
							inputmode="decimal"
							placeholder="0"
							value={displayPrice(defaultPrice)}
							oninput={(e) => {
								const input = e.target as HTMLInputElement;
								if (!defaultPriceEdited) {
									// First keystroke after reopen: keep only the new character
									const newChar = input.value.slice(-1);
									input.value = newChar;
									defaultPriceEdited = true;
								}
								handleDefaultPriceInput(e);
							}}
							class="h-9 w-14 text-right price-input border rounded px-1"
						/>
					</div>
				</Popover.Content>
			</Popover.Root>
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
								class="type-circle"
								onclick={() => {
									store.updateRow(index, {
										isBox: !row.isBox,
									});
								}}
							>
								<img
									src={row.isBox
										? "/pub-Rtvr/box.webp"
										: "/pub-Rtvr/bundle.webp"}
									alt={row.isBox ? "box" : "bundle"}
									class="type-circle-img"
								/>
							</button>

							<!-- Bundle/Box size plaque — plain div, no Popover, no focus trap -->
							<div class="size-plaque-wrapper">
								<button
									class="plaque-trigger"
									onclick={() => {
										if (sizePopoverOpenIndex === index) {
											commitSizeAndClose(index);
										} else {
											sizePopoverOpenIndex = index;
										}
									}}
								>
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
								</button>
								{#if sizePopoverOpenIndex === index}
									<div
										use:clampToViewport
										class="size-dropdown {index >=
										store.activeRows.length - 2
											? 'size-dropdown--up'
											: ''}"
									>
										<div class="size-dropdown-row">
											<img
												src="/pub-Rtvr/box.webp"
												alt="tree box"
												class="type-label-img"
											/>
											<input
												type="number"
												value={localBoxSize}
												placeholder="270"
												class="size-input {[
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
													localBoxSize = (
														e.target as HTMLInputElement
													).value;
												}}
											/>
										</div>
										<div class="size-dropdown-row">
											<img
												src="/pub-Rtvr/bundle.webp"
												alt="tree bundle"
												class="type-label-img"
											/>
											<input
												type="number"
												value={localBundleSize}
												placeholder="15"
												class="size-input {[
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
													localBundleSize = (
														e.target as HTMLInputElement
													).value;
												}}
											/>
										</div>
										{#if invalidInputs.get(index) === "both"}
											<p class="size-error">
												Box # must be divisible by
												bundle #
											</p>
										{/if}
									</div>
								{/if}
							</div>

							<!-- Count plaque -->
							<Popover.Root>
								<Popover.Trigger class="plaque-trigger">
									<div
										class="plaque {(
											row.isBox
												? row.boxCount
												: row.bundleCount
										)
											? ''
											: 'plaque--empty'} {(buzzingRows.has(
											index,
										) &&
											!(row.isBox
												? row.boxCount
												: row.bundleCount)) ||
										snappingCounts.has(index)
											? 'plaque--buzz'
											: ''}"
									>
										<span class="plaque-text"
											>{(row.isBox
												? row.boxCount
												: row.bundleCount) ?? "—"}</span
										>
									</div>
								</Popover.Trigger>
								<Popover.Content
									class="w-28 p-2"
									align="center"
								>
									<div class="flex items-center gap-2">
										<span
											class="text-sm text-muted-foreground"
											>count</span
										>
										<Input
											type="number"
											value={(row.isBox
												? row.boxCount
												: row.bundleCount) ?? ""}
											placeholder="0"
											oninput={(e) => {
												const v = (
													e.target as HTMLInputElement
												).valueAsNumber;
												handleCountInput(
													index,
													isNaN(v) ? null : v,
													row.isBox,
												);
											}}
											class="h-9 flex-1 text-right"
										/>
									</div>
								</Popover.Content>
							</Popover.Root>

							<!-- Total plaque (non-interactive) -->
							<div class="plaque plaque--total">
								<span class="plaque-text"
									><TreePine
										class="inline w-3 h-3 mr-0.5 -translate-y-px"
									/>{calcTotal(row) || "—"}</span
								>
							</div>

							<!-- Price plaque -->
							<Popover.Root>
								<Popover.Trigger class="plaque-trigger">
									<div
										class="plaque {getEffectivePrice(row)
											? ''
											: 'plaque--empty'} {defaultPrice !==
										null
											? 'plaque--override'
											: ''}"
									>
										<span class="plaque-text"
											>{displayPricePlaque(
												getEffectivePrice(row),
											)}</span
										>
									</div>
								</Popover.Trigger>
								<Popover.Content
									class="w-40 p-2"
									align="center"
								>
									<div class="flex items-center gap-2">
										<span
											class="text-sm text-muted-foreground"
											>¢/tree</span
										>
										<Input
											type="text"
											inputmode="decimal"
											value={displayPrice(
												row.pricePerTree,
											)}
											placeholder="0"
											onfocus={(e) => {
												(
													e.target as HTMLInputElement
												).value = "";
											}}
											oninput={(e) =>
												handlePriceInput(index, e)}
											class="h-9 flex-1 text-right price-input"
										/>
									</div>
								</Popover.Content>
							</Popover.Root>

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
					<span class="row-label">row:</span>
					<button
						class="row-ctrl row-ctrl--icon {addPressed
							? 'pressed'
							: ''} text-muted-foreground"
						onpointerdown={() => (addPressed = true)}
						onpointerup={() => (addPressed = false)}
						onpointercancel={() => (addPressed = false)}
						onclick={() => {
							store.addRow();
							removePopoverOpen = false;
						}}
						title="Add row"
					>
						<Plus class="size-4" />
					</button>
					{#if store.activeRows.length > 1}
						<Popover.Root bind:open={removePopoverOpen}>
							<Popover.Trigger>
								{#snippet child({ props })}
									<button
										{...props}
										class="row-ctrl row-ctrl--icon {removePressed
											? 'pressed'
											: ''} text-muted-foreground"
										onpointerdown={() =>
											(removePressed = true)}
										onpointerup={() =>
											(removePressed = false)}
										onpointercancel={() =>
											(removePressed = false)}
										title="Remove row"
									>
										<span class="text-base leading-none"
											>−</span
										>
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
									remove
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
								clean cache
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
							clear
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
			{#if baggedTrees > 0 && baggedValue > 0}
				<span class="totals-calc"
					><TreePine
						class="inline w-4 h-4 mr-0.5 -translate-y-0.5"
					/>{baggedTrees}</span
				><span class="totals-mult">
					× ${formatPrice(avgPricePerTree)} =</span
				>
				<span class="totals-result">${baggedValue.toFixed(2)}</span>
			{:else if baggedTrees > 0}
				<span class="totals-calc"
					><TreePine
						class="inline w-4 h-4 mr-0.5 -translate-y-0.5"
					/>{baggedTrees}</span
				>
			{/if}
		</div>
		{#if bagOutFlashing}
			<!-- Flash animation after bag-out -->
			<div class="bags-img-btn bags-img-btn--flashing">
				<img
					src={bagOutFlashImg}
					alt="planting bags"
					class="bags-img bags-img--flash"
				/>
			</div>
		{:else if anyBagged}
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
				<Popover.Content
					class="bagout-popover"
					align="center"
					side="top"
					sideOffset={-170}
				>
					<p class="bagout-confirm-label">confirm bag out?</p>
					<p class="bagout-confirm-totals">
						<TreePine
							class="inline w-4 h-4 mr-0.5 -translate-y-0.5"
						/>{baggedTrees}{baggedValue > 0
							? ` · $${baggedValue.toFixed(2)}`
							: ""}
					</p>
					<button
						class="bagout-btn"
						onclick={() => {
							handleBagOut();
						}}
					>
						bag out
						<img
							src="/pub-Rtvr/Ultimate_shovel_level.png"
							alt="shovel"
							class="bagout-shovel"
						/>
					</button>
				</Popover.Content>
			</Popover.Root>
		{:else}
			<div class="bags-img-wrap--flat">
				<img src={bagsImg} alt="planting bags" class="bags-img" />
			</div>
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

	/* ── Blocking overlay for size dropdown ── */
	.size-popover-overlay {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: transparent;
	}

	/* ── Plain size dropdown (no Popover, no focus trap) ── */
	.size-plaque-wrapper {
		position: relative;
		min-width: 0;
	}

	.size-dropdown {
		position: absolute;
		top: calc(100% + 0.25rem);
		right: 0;
		z-index: 50;
		background: #1e1e1e;
		border: 1px solid #333;
		border-radius: 0.625rem;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: max-content;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
	}

	.size-dropdown--up {
		top: auto;
		bottom: calc(100% + 0.25rem);
	}

	.size-dropdown-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.size-input {
		width: 4rem;
		height: 2.25rem;
		background: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 0.375rem;
		color: #fafafa;
		font-size: 0.9rem;
		padding: 0 0.5rem;
		-webkit-appearance: none;
		appearance: textfield;
	}

	.size-input:focus {
		outline: none;
		border-color: #555;
	}

	.size-input::-webkit-outer-spin-button,
	.size-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.size-error {
		color: #ef4444;
		font-size: 0.55rem;
		margin: 0;
		padding: 0.15rem 0 0;
		text-align: center;
		line-height: 1.2;
	}

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
		padding: 0.5rem 0.35rem 0;
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

	.header-row span:not(.col-hdr-type) {
		display: block;
		text-align: center;
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: lowercase;
		letter-spacing: 0.03em;
		color: #9ca3af;
	}

	.col-hdr-type {
		grid-column: 2 / 4;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}

	.header-row span:last-child {
		visibility: hidden;
	}

	/* Price header button — subtle like total plaque, pops when active */
	.price-header-btn {
		display: block;
		width: 100%;
		text-align: center;
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: lowercase;
		letter-spacing: 0.03em;
		color: #9ca3af;
		background: #2a2a2a;
		border: 1px solid #333;
		border-radius: 0.4rem;
		padding: 0.15rem 0.25rem;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			box-shadow 150ms ease,
			background 150ms ease;
	}

	.price-header-btn:active {
		background: #333;
	}

	.price-header-btn--active {
		background: #333333;
		border: 1px solid rgba(255, 255, 255, 0.07);
		box-shadow:
			0 4px 10px rgba(0, 0, 0, 0.5),
			0 2px 4px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
		color: #fafafa;
	}

	/* Clear default button in popover */
	.clear-default-btn {
		width: 100%;
		padding: 0.5rem;
		background: #2a2a2a;
		border: 1px dashed #555;
		border-radius: 0.375rem;
		color: #9ca3af;
		font-size: 0.8rem;
		cursor: pointer;
		transition: background 120ms;
	}

	.clear-default-btn:active {
		background: #333;
	}

	/* Override styling for price plaques when default is active */
	.plaque--override {
		opacity: 0.7;
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
		grid-template-columns: 1.2fr 2.2rem 0.65fr 0.65fr 0.65fr 0.6fr 2.2rem;
		gap: 0.1rem;
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

	/* Lock inputs when bagged, but allow type-circle toggle */
	.row-card--bagged .plaque-trigger,
	.row-card--bagged .size-plaque-wrapper {
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
		color: #fafafa;
		font-size: 0.75rem;
		font-weight: 400;
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
		height: 1.9rem;
		border-radius: 0.6rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 0.15rem;
		background: #333333;
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
		cursor: pointer;
		transition: background 100ms;
		-webkit-tap-highlight-color: transparent;
		overflow: visible;
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
		font-size: 0.75rem;
		color: #6b7280; /* always gray until bagged */
		white-space: nowrap;
		overflow: hidden;
		text-align: left;
		display: block;
		max-width: 100%;
	}

	.plaque--empty .plaque-text {
		color: #4b5563;
		font-size: 0.65rem;
	}

	/* ── Type (box/bundle) circle container ── */
	.type-circle {
		width: 2.2rem;
		height: 2.2rem;
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

	.type-circle-img {
		width: 1.8rem;
		height: 1.8rem;
		object-fit: contain;
	}

	/* ── Bag circle container ── */
	.bag-circle {
		width: 2.2rem;
		height: 2.2rem;
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

	/* ── Popover inputs: dimmer placeholders, brighter entered values ── */
	:global([data-slot="popover-content"] input::placeholder) {
		color: rgba(255, 255, 255, 0.15);
	}
	:global([data-slot="popover-content"] input) {
		color: rgba(255, 255, 255, 1);
	}

	/* ── Price input (reduced padding, no ellipsis, fit all digits) ── */
	:global(input.price-input) {
		padding-left: 0.15rem !important;
		padding-right: 0.15rem !important;
		text-overflow: unset !important;
		overflow: visible !important;
		white-space: nowrap !important;
		font-size: 0.875rem !important;
	}

	/* ── Count input ── */
	:global(input.count-input) {
		width: 100% !important;
		height: 1.9rem !important;
		text-align: center !important;
		font-size: 0.75rem !important;
		background: #333333 !important;
		border: none !important;
		border-radius: 0.6rem !important;
		color: #6b7280 !important;
		padding: 0 0.15rem !important;
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
	}

	:global(input.count-input:focus) {
		outline: none !important;
		border: none !important;
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
	}

	/* ── Bag button ── */
	.bag-btn {
		width: 2rem;
		height: 2rem;
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
		width: 2rem;
		height: 2rem;
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

	.totals-calc {
		font-size: 1.1rem;
		font-weight: 600;
		color: #fafafa;
	}

	.totals-mult {
		font-size: 1.1rem;
		font-weight: 400;
		color: #fafafa;
	}

	.totals-result {
		font-size: 1.1rem;
		font-weight: 600;
		color: #ffd700;
		margin-left: 0.25rem;
	}

	:global(.bagout-popover) {
		background: rgba(0, 0, 0, 0.2) !important;
		border: 1px solid rgba(255, 255, 255, 0.3) !important;
		border-radius: 0.75rem !important;
		padding: 0.75rem !important;
		backdrop-filter: blur(4px);
	}

	.bagout-confirm-label {
		font-size: 0.875rem;
		color: #a1a1aa;
		margin-bottom: 0.25rem;
		text-align: center;
		background: rgba(0, 0, 0, 0.5);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.bagout-confirm-totals {
		font-size: 0.95rem;
		font-weight: 600;
		color: #ffd700;
		margin-bottom: 0.5rem;
		text-align: center;
		background: rgba(0, 0, 0, 0.5);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.bagout-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%);
		border: 2px solid #ffd700;
		border-radius: 0.5rem;
		padding: 0.5rem 1rem;
		color: #ffd700;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.6),
			0 2px 4px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.15);
		transition:
			box-shadow 300ms ease-out,
			transform 300ms ease-out;
	}

	.bagout-btn:active {
		transform: scale(0.96);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.3),
			inset 0 1px 3px rgba(0, 0, 0, 0.4);
	}

	.bagout-shovel {
		height: 1.25rem;
		width: auto;
	}

	.bags-img-btn {
		background: #333333;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 0.75rem;
		padding: 0;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		display: block;
		overflow: hidden;
		position: relative;
		box-shadow:
			0 5px 14px rgba(0, 0, 0, 0.65),
			0 2px 5px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(255, 255, 255, 0.07);
		transition:
			box-shadow 250ms ease,
			background 250ms ease;
	}

	.bags-img-btn:active {
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.5),
			0 1px 2px rgba(0, 0, 0, 0.4);
	}

	/* Flashing state during bag-out animation */
	.bags-img-btn--flashing {
		cursor: default;
		pointer-events: none;
	}

	.bags-img--flash {
		animation: bagFlashPulse 400ms ease-in-out infinite alternate;
	}

	@keyframes bagFlashPulse {
		0% {
			opacity: 1;
			filter: brightness(1);
		}
		100% {
			opacity: 0.85;
			filter: brightness(1.1);
		}
	}

	/* Flat/disabled state for bags image (no bagged items) */
	.bags-img-wrap--flat {
		background: #2a2a2a;
		border: 1px solid rgba(255, 255, 255, 0.03);
		border-radius: 0.75rem;
		padding: 0;
		display: block;
		overflow: hidden;
		box-shadow: none;
	}

	.bags-img-wrap--flat .bags-img {
		opacity: 0.5;
	}

	.bags-img {
		width: 220px;
		height: 180px;
		object-fit: cover;
		object-position: center bottom;
		display: block;
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
		height: 1.5rem;
		padding: 0 0.5rem;
		border: 0.5px dashed currentColor;
		border-radius: 0.375rem;
		background: transparent;
		font-size: 0.75rem;
		opacity: 0.6;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			transform 150ms ease,
			filter 150ms ease,
			opacity 150ms ease;
	}

	.row-ctrl--sm {
		height: 1.5rem;
		padding: 0 0.5rem;
	}

	.row-ctrl--icon {
		width: 1.5rem;
		padding: 0;
	}

	.row-label {
		font-size: 0.7rem;
		color: #6b7280;
		opacity: 0.6;
		margin-right: 0.25rem;
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
