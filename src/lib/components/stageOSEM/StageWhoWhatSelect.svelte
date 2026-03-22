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
			class="stage-who-what-select-container flex w-full max-w-md items-center gap-3 lg:max-w-lg"
		>
			<div class="stage-who-what-select-globe" aria-hidden="true">
				<Globe size={36} />
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
					class="stage-who-what-select-input h-14 w-full rounded-2xl border-2 px-4 text-base {isSelecting
						? 'stage-who-what-select-input--selecting'
						: ''}"
				/>
				{#if showResults}
					<div
						class="stage-who-what-select-dropdown"
						id="search-results"
						role="listbox"
					>
						{#if isLoading}
							<div
								class="stage-who-what-select-item stage-who-what-select-item--loading"
							>
								Searching...
							</div>
						{:else if results.length === 0}
							<div
								class="stage-who-what-select-item stage-who-what-select-item--empty"
							>
								No results found
							</div>
						{:else}
							{#each results as item, index (item.id)}
								<button
									type="button"
									class="stage-who-what-select-item {index ===
									highlightedIndex
										? 'stage-who-what-select-item--highlighted'
										: ''}"
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
