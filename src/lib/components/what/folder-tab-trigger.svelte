<script lang="ts">
	import { cn } from '$lib/utils';
	import * as Tabs from '../ui/tabs';

	let { value, class: className = undefined, children, ...restProps } = $props();
</script>

<Tabs.Trigger
	{value}
	class={cn(
		'folder-tab inline-flex items-center justify-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all',
		'border-x border-t border-border rounded-t-lg rounded-b-none',
		'bg-muted/50 text-muted-foreground',
		'hover:bg-accent/10 hover:text-accent',
		'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:-mb-px data-[state=active]:z-10 data-[state=active]:shadow-none',
		'disabled:pointer-events-none disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</Tabs.Trigger>

<style>
	:global(.folder-tab[data-state='active']) {
		border-color: var(--color-primary);
		border-bottom-color: transparent;
		border-width: 0.5px;
	}
</style>
