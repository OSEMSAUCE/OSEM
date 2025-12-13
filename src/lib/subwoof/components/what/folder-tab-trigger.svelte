<script lang="ts">
	import * as Tabs from '../ui/tabs';
	import { cn } from '$lib/utils.js';

	let { value, class: className = undefined, children, ...restProps } = $props();
</script>

<Tabs.Trigger
	{value}
	class={cn(
		'inline-flex items-center justify-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all',
		'border-x border-t border-border rounded-t-lg rounded-b-none border-b',
		'bg-muted/50 text-muted-foreground',
		'hover:bg-muted hover:text-foreground',
		'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-transparent data-[state=active]:-mb-px data-[state=active]:z-10 data-[state=active]:shadow-none',
		'disabled:pointer-events-none disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</Tabs.Trigger>
