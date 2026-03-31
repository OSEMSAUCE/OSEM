<script lang="ts">
	let {
		onLoad,
		loading = false,
		libraryOpen = $bindable(false),
	}: {
		onLoad: (file: File) => void;
		loading?: boolean;
		libraryOpen?: boolean;
	} = $props();

	let fileInput: HTMLInputElement | undefined = $state();

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) onLoad(file);
		input.value = "";
	}
</script>

<!-- Hidden file input -->
<input
	bind:this={fileInput}
	type="file"
	accept=".pdf,application/pdf"
	onchange={onFileChange}
	class="hidden"
/>

<!-- Top-center action bar -->
<div class="flex gap-2">
	<button
		onclick={() => fileInput?.click()}
		disabled={loading}
		class="flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 text-accent text-sm font-medium shadow-md border border-white/30 active:scale-95 active:bg-accent/30 active:border-accent focus:border-accent focus:outline-none transition-all disabled:opacity-60"
	>
		{#if loading}
			<span
				class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
			></span>
			Loading…
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="w-4 h-4"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="17 8 12 3 7 8" />
				<line x1="12" y1="3" x2="12" y2="15" />
			</svg>
			Load PDF Map
		{/if}
	</button>

	<button
		onclick={() => (libraryOpen = true)}
		title="Map library"
		class="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-accent shadow-md border border-white/30 active:scale-95 active:bg-accent/30 active:border-accent focus:border-accent focus:outline-none transition-all"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="w-5 h-5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
			<path
				d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
			/>
		</svg>
	</button>
</div>
