<script lang="ts">
	import Check from "lucide-svelte/icons/check";
	import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
	import * as Command from "../ui/command";
	import * as Popover from "../ui/popover";
	import { cn } from "../../core/utils";

	type SearchItem = {
		id: string;
		name: string;
	};

	let {
		placeholder = "Search...",
		items = [],
		selectedId = $bindable<string | null>(null),
		onSearch,
		minChars = 3,
	}: {
		placeholder?: string;
		items: SearchItem[];
		selectedId?: string | null;
		onSearch?: (query: string) => void;
		minChars?: number;
	} = $props();

	let open = $state(false);
	let searchValue = $state("");
	let debounceTimer: ReturnType<typeof setTimeout>;

	const selectedItem = $derived(items.find((item) => item.id === selectedId));

	function handleInput(value: string) {
		searchValue = value;

		clearTimeout(debounceTimer);
		if (value.length >= minChars && onSearch) {
			debounceTimer = setTimeout(() => {
				onSearch(value);
			}, 300);
		}
	}

	function handleSelect(item: SearchItem) {
		selectedId = item.id;
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class="combobox-trigger flex h-14 w-full items-center justify-between rounded-2xl border-2 bg-background px-4 text-base"
	>
		<span class={cn("truncate", !selectedItem && "text-muted-foreground")}>
			{selectedItem?.name ?? placeholder}
		</span>
		<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
	</Popover.Trigger>
	<Popover.Content
		class="w-[--radix-popover-trigger-width] p-0"
		align="start"
	>
		<Command.Root shouldFilter={false}>
			<Command.Input
				placeholder={`Type ${minChars}+ characters to search...`}
				value={searchValue}
				oninput={(e) => handleInput(e.currentTarget.value)}
				class="h-12"
			/>
			<Command.List>
				{#if searchValue.length < minChars}
					<Command.Empty
						>Type at least {minChars} characters to search</Command.Empty
					>
				{:else if items.length === 0}
					<Command.Empty>No results found</Command.Empty>
				{:else}
					<Command.Group>
						{#each items as item (item.id)}
							<Command.Item
								value={item.id}
								onSelect={() => handleSelect(item)}
								class="cursor-pointer"
							>
								<Check
									class={cn(
										"mr-2 size-4",
										selectedId === item.id
											? "opacity-100"
											: "opacity-0",
									)}
								/>
								{item.name}
							</Command.Item>
						{/each}
					</Command.Group>
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>

<style>
	:global(.combobox-trigger) {
		border-color: #d4a017 !important;
		animation: pulse-glow 2s ease-in-out infinite;
	}

	:global(.combobox-trigger:hover) {
		box-shadow:
			0 0 16px #d4a01780,
			0 0 28px #d4a01760;
	}

	:global(.combobox-trigger:focus),
	:global(.combobox-trigger[aria-expanded="true"]) {
		outline: none;
		animation: none;
		border-color: #ffd700 !important;
		box-shadow:
			0 0 20px #ffd700b0,
			0 0 40px #ffd70080,
			0 0 60px #d4a01760;
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
</style>
