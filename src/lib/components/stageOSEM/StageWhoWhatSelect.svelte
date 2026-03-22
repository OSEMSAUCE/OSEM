<script lang="ts">
	import Globe from "lucide-svelte/icons/globe";
	import { Input } from "../ui/input";
	import { PUBLIC_API_URL } from "$env/static/public";
	import { goto } from "$app/navigation";
	import type { StageEntity, StageRoutePath } from "./stageTypes";

	type SearchResult = { id: string; name: string };

	let {
		entity,
		heading,
		routePath,
	}: {
		entity: StageEntity;
		heading: string;
		routePath: StageRoutePath;
	} = $props();

	const inputPlaceholder = $derived(
		entity === "organization" ? "Search Organizations" : "Search Projects",
	);

	let searchQuery = $state("");
	let results = $state<SearchResult[]>([]);
	let isLoading = $state(false);
	let showResults = $state(false);
	let highlightedIndex = $state(-1);
	let isSelecting = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout>;

	const DEBOUNCE_MS = 500;
	const MAX_RESULTS = 5;

	function handleInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		searchQuery = value;

		clearTimeout(debounceTimer);

		// Always show dropdown when typing
		showResults = true;

		// Debounce the search
		debounceTimer = setTimeout(() => {
			fetchResults(value);
		}, DEBOUNCE_MS);
	}

	async function fetchResults(query: string) {
		isLoading = true;
		const base = PUBLIC_API_URL.replace(/\/$/, "");
		const url = `${base}/api/search?entity=${entity}&q=${encodeURIComponent(query)}&limit=${MAX_RESULTS}`;
		console.log(`[StageWhoWhatSelect] fetching: ${url}`);
		try {
			const response = await fetch(url);
			console.log(
				`[StageWhoWhatSelect] response status: ${response.status}`,
			);
			if (!response.ok) {
				throw new Error(`Search failed: ${response.status}`);
			}
			const data = await response.json();
			console.log(
				`[StageWhoWhatSelect] got ${data.results?.length || 0} results`,
			);
			results = data.results;
		} catch (error) {
			console.error("[StageWhoWhatSelect] Search error:", error);
			results = [];
		} finally {
			isLoading = false;
		}
	}

	function handleSelect(item: SearchResult) {
		searchQuery = item.name;
		showResults = false;
		highlightedIndex = -1;
		isSelecting = true;

		// Brief visual feedback, then navigate
		setTimeout(() => {
			isSelecting = false;
			const param =
				entity === "organization" ? "organizationKey" : "projectKey";
			goto(`${routePath}?${param}=${encodeURIComponent(item.id)}`);
		}, 300);
	}

	function handleFocus() {
		showResults = true;
		// Load initial results if we don't have any
		if (results.length === 0 && !isLoading) {
			fetchResults(searchQuery);
		}
	}

	function handleBlur() {
		// Delay to allow click on result
		setTimeout(() => {
			showResults = false;
			highlightedIndex = -1;
		}, 200);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!showResults || results.length === 0) return;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				highlightedIndex = (highlightedIndex + 1) % results.length;
				break;
			case "ArrowUp":
				e.preventDefault();
				highlightedIndex =
					highlightedIndex <= 0
						? results.length - 1
						: highlightedIndex - 1;
				break;
			case "Enter":
				e.preventDefault();
				if (
					highlightedIndex >= 0 &&
					highlightedIndex < results.length
				) {
					handleSelect(results[highlightedIndex]);
				}
				break;
			case "Escape":
				e.preventDefault();
				showResults = false;
				highlightedIndex = -1;
				break;
			case "Tab":
				if (e.shiftKey) {
					highlightedIndex =
						highlightedIndex <= 0
							? results.length - 1
							: highlightedIndex - 1;
				} else {
					highlightedIndex = (highlightedIndex + 1) % results.length;
				}
				e.preventDefault();
				break;
		}
	}
</script>

<section class="grid h-full grid-rows-[1fr_2fr] px-4 sm:px-6 lg:pl-[20%]">
	<div class="flex items-end">
		<div
			class="glow-sync flex w-full max-w-md items-center gap-3 lg:max-w-lg"
		>
			<div class="globe-container" aria-hidden="true">
				<Globe class="globe-icon" size={36} />
			</div>
			<div class="relative flex-1">
				<Input
					id="stage-entity-input"
					type="text"
					name="stageEntity"
					placeholder={inputPlaceholder}
					value={searchQuery}
					oninput={handleInput}
					onfocus={handleFocus}
					onblur={handleBlur}
					onkeydown={handleKeydown}
					autocomplete="off"
					role="combobox"
					aria-expanded={showResults}
					aria-haspopup="listbox"
					aria-controls="search-results"
					class="glow-input h-14 w-full rounded-2xl border-2 px-4 text-base {isSelecting
						? 'selecting'
						: ''}"
				/>
				{#if showResults}
					<div
						class="results-dropdown"
						id="search-results"
						role="listbox"
					>
						{#if isLoading}
							<div class="result-item loading">Searching...</div>
						{:else if results.length === 0}
							<div class="result-item empty">
								No results found
							</div>
						{:else}
							{#each results as item, index (item.id)}
								<button
									type="button"
									class="result-item"
									class:highlighted={index ===
										highlightedIndex}
									role="option"
									aria-selected={index === highlightedIndex}
									onclick={() => handleSelect(item)}
								>
									{item.name}
								</button>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.glow-sync {
		animation: sync-pulse 2s ease-in-out infinite;
	}

	@keyframes sync-pulse {
		0%,
		100% {
			--glow-intensity: 0;
		}
		50% {
			--glow-intensity: 1;
		}
	}

	.globe-container {
		display: flex;
		align-items: center;
		justify-content: center;
		filter: drop-shadow(0 0 8px var(--color-accent))
			drop-shadow(
				0 0 16px
					color-mix(in srgb, var(--color-accent), transparent 50%)
			);
		animation: globe-pulse 2s ease-in-out infinite;
	}

	@keyframes globe-pulse {
		0%,
		100% {
			filter: drop-shadow(0 0 8px var(--color-accent))
				drop-shadow(
					0 0 16px
						color-mix(in srgb, var(--color-accent), transparent 50%)
				);
		}
		50% {
			filter: drop-shadow(0 0 14px var(--color-accent))
				drop-shadow(0 0 24px var(--color-accent))
				drop-shadow(
					0 0 32px
						color-mix(in srgb, var(--color-accent), transparent 50%)
				);
		}
	}

	.globe-container :global(.globe-icon) {
		color: var(--color-accent);
	}

	:global(.glow-sync .glow-input) {
		border-color: var(--color-accent) !important;
		animation: pulse-glow 2s ease-in-out infinite;
		caret-color: var(--color-accent);
		caret-shape: block;
		font-size: 1.25rem;
		font-weight: 600;
	}

	:global(.glow-input::placeholder) {
		color: var(--color-accent);
		font-weight: 600;
		opacity: 1;
	}

	:global(.glow-input:hover) {
		box-shadow:
			0 0 16px color-mix(in srgb, var(--color-accent), transparent 50%),
			0 0 28px color-mix(in srgb, var(--color-accent), transparent 60%);
	}

	:global(.glow-input:focus) {
		outline: none;
		animation: caret-blink 1s step-end infinite;
		border-color: var(--color-accent) !important;
		box-shadow:
			0 0 20px color-mix(in srgb, var(--color-accent), transparent 30%),
			0 0 40px color-mix(in srgb, var(--color-accent), transparent 50%),
			0 0 60px color-mix(in srgb, var(--color-accent), transparent 60%);
		caret-color: var(--color-accent);
		color: var(--color-accent);
	}

	@keyframes caret-blink {
		0%,
		100% {
			caret-color: var(--color-accent);
		}
		50% {
			caret-color: transparent;
		}
	}

	:global(.glow-input.selecting) {
		animation: selection-pulse 0.3s ease-out;
	}

	@keyframes selection-pulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.02);
			box-shadow: 0 0 30px var(--color-accent);
		}
		100% {
			transform: scale(1);
		}
	}

	:global(.glow-input:focus::placeholder) {
		color: var(--color-accent);
	}

	@keyframes pulse-glow {
		0%,
		100% {
			box-shadow:
				0 0 8px color-mix(in srgb, var(--color-accent), transparent 75%),
				0 0 16px
					color-mix(in srgb, var(--color-accent), transparent 85%);
		}
		50% {
			box-shadow:
				0 0 14px
					color-mix(in srgb, var(--color-accent), transparent 55%),
				0 0 28px
					color-mix(in srgb, var(--color-accent), transparent 70%);
		}
	}

	.results-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.5rem;
		background: var(--color-background, #1a1a1a);
		border: 2px solid var(--color-accent);
		border-radius: 1rem;
		overflow: hidden;
		box-shadow:
			0 0 12px color-mix(in srgb, var(--color-accent), transparent 60%),
			0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 50;
	}

	.result-item {
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		text-align: left;
		color: var(--foreground, #fff);
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		transition: background 0.15s;
	}

	.result-item:hover,
	.result-item.highlighted {
		background: color-mix(in srgb, var(--color-accent), transparent 85%);
	}

	.result-item.loading,
	.result-item.empty {
		color: var(--color-accent);
		cursor: default;
		font-style: italic;
	}

	.result-item.empty:hover,
	.result-item.loading:hover {
		background: transparent;
	}
</style>
