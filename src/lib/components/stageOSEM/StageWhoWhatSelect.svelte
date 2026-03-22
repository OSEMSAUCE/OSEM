<script lang="ts">
	import Globe from "lucide-svelte/icons/globe";
	import { Input } from "../ui/input";
	import { PUBLIC_API_URL } from "$env/static/public";
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
		// TODO: Navigate or emit selection
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
		}, 200);
	}
</script>

<section
	class="flex h-full items-start justify-start px-4 pb-4 pt-[15%] sm:px-6 lg:pl-[20%]"
>
	<div class="glow-sync flex w-full max-w-md items-center gap-3 lg:max-w-lg">
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
				autocomplete="off"
				class="glow-input h-14 w-full rounded-2xl border-2 px-4 text-base"
			/>
			{#if showResults}
				<div class="results-dropdown">
					{#if isLoading}
						<div class="result-item loading">Searching...</div>
					{:else if results.length === 0}
						<div class="result-item empty">No results found</div>
					{:else}
						{#each results as item (item.id)}
							<button
								type="button"
								class="result-item"
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
		filter: drop-shadow(0 0 8px #d4a017) drop-shadow(0 0 16px #d4a01780);
		animation: globe-pulse 2s ease-in-out infinite;
	}

	@keyframes globe-pulse {
		0%,
		100% {
			filter: drop-shadow(0 0 8px #d4a017) drop-shadow(0 0 16px #d4a01780);
		}
		50% {
			filter: drop-shadow(0 0 14px #d4a017) drop-shadow(0 0 24px #d4a017)
				drop-shadow(0 0 32px #d4a01780);
		}
	}

	.globe-container :global(.globe-icon) {
		color: #d4a017;
	}

	:global(.glow-sync .glow-input) {
		border-color: #d4a017 !important;
		animation: pulse-glow 2s ease-in-out infinite;
		caret-color: #ffd700;
		font-size: 1.25rem;
		font-weight: 600;
	}

	:global(.glow-input::placeholder) {
		color: #d4a017;
		font-weight: 600;
		opacity: 1;
	}

	:global(.glow-input:hover) {
		box-shadow:
			0 0 16px #d4a01780,
			0 0 28px #d4a01760;
	}

	:global(.glow-input:focus) {
		outline: none;
		animation: none;
		border-color: #ffd700 !important;
		box-shadow:
			0 0 20px #ffd700b0,
			0 0 40px #ffd70080,
			0 0 60px #d4a01760;
		caret-color: #ffd700;
		color: #ffd700;
	}

	:global(.glow-input:focus::placeholder) {
		color: #ffd700;
	}

	@keyframes pulse-glow {
		0%,
		100% {
			box-shadow:
				0 0 8px #d4a01740,
				0 0 16px #d4a01720;
		}
		50% {
			box-shadow:
				0 0 14px #d4a01770,
				0 0 28px #d4a01750;
		}
	}

	.results-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.5rem;
		background: var(--background, #1a1a1a);
		border: 2px solid #d4a017;
		border-radius: 1rem;
		overflow: hidden;
		box-shadow:
			0 0 12px #d4a01760,
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

	.result-item:hover {
		background: #d4a01720;
	}

	.result-item.loading,
	.result-item.empty {
		color: #d4a017;
		cursor: default;
		font-style: italic;
	}

	.result-item.empty:hover,
	.result-item.loading:hover {
		background: transparent;
	}
</style>
