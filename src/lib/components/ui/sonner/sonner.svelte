<script lang="ts">
	import { browser } from '$app/environment';
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
	import { mode } from "mode-watcher";

	let { ...restProps }: SonnerProps = $props();
</script>

{#if browser}
	<Sonner
		theme={mode.current}
		class="toaster group"
		style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border);"
		{...restProps}
	/>
{/if}
