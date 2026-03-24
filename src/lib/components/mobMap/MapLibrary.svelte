<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import {
		listMaps,
		loadMap,
		deleteMap,
		storageEstimate,
		type StoredMap
	} from '$lib/mobMap/mapStorage';

	let {
		onLoad,
		open = $bindable(false)
	}: {
		onLoad: (file: File) => void;
		open?: boolean;
	} = $props();

	let maps: StoredMap[] = $state([]);
	let usedBytes = $state(0);
	let quotaBytes = $state(0);
	let loadingKey = $state<string | null>(null);

	onMount(refresh);

	async function refresh() {
		maps = await listMaps();
		const est = await storageEstimate();
		usedBytes = est.used;
		quotaBytes = est.quota;
	}

	async function openMap(key: string) {
		loadingKey = key;
		try {
			const file = await loadMap(key);
			open = false;
			onLoad(file);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to load map');
		} finally {
			loadingKey = null;
		}
	}

	async function removeMap(key: string) {
		await deleteMap(key);
		await refresh();
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDate(d: Date): string {
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

{#if open}
	<!-- Backdrop -->
	<button
		class="absolute inset-0 z-20 bg-black/40"
		onclick={() => (open = false)}
		aria-label="Close library"
	></button>

	<!-- Drawer -->
	<div
		class="absolute bottom-0 left-0 right-0 z-30 bg-neutral-900 text-white rounded-t-2xl max-h-[75vh] flex flex-col"
	>
		<!-- Handle -->
		<div class="flex justify-center pt-3 pb-1">
			<div class="w-10 h-1 rounded-full bg-white/30"></div>
		</div>

		<div class="px-4 pb-2 flex items-center justify-between">
			<h2 class="text-base font-semibold">Saved Maps</h2>
			<button onclick={() => (open = false)} class="text-xs text-white/60 active:text-white">
				Close
			</button>
		</div>

		<!-- Storage indicator -->
		{#if quotaBytes > 0}
			<div class="px-4 pb-2">
				<div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
					<div
						class="h-full bg-emerald-500 rounded-full"
						style="width: {Math.min(100, (usedBytes / quotaBytes) * 100).toFixed(1)}%"
					></div>
				</div>
				<p class="text-[11px] text-white/40 mt-1">
					{formatBytes(usedBytes)} used of {formatBytes(quotaBytes)}
				</p>
			</div>
		{/if}

		<!-- Map list -->
		<div class="overflow-y-auto flex-1 px-4 pb-6">
			{#if maps.length === 0}
				<p class="text-sm text-white/50 py-8 text-center">
					No maps saved yet. Load a PDF map to save it.
				</p>
			{:else}
				{#each maps as m (m.key)}
					<div class="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
						<button
							class="flex-1 text-left min-w-0"
							onclick={() => openMap(m.key)}
							disabled={loadingKey === m.key}
						>
							<p class="text-sm font-medium truncate">{m.name}</p>
							<p class="text-xs text-white/50">{formatDate(m.savedAt)} · {formatBytes(m.sizeBytes)}</p>
						</button>
						{#if loadingKey === m.key}
							<span
								class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"
							></span>
						{:else}
							<button
								onclick={() => removeMap(m.key)}
								title="Delete"
								class="text-white/40 active:text-red-400 shrink-0 p-1"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="w-4 h-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<polyline points="3 6 5 6 21 6" />
									<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
									<path d="M10 11v6M14 11v6" />
									<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
								</svg>
							</button>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}
