<script lang="ts">
	import * as Tabs from '$lib/subwoof/components/ui/tabs';
	import { cn } from '$lib/utils.js';

	let {
		value,
		class: className = undefined,
		children,
		...restProps
	} = $props();
</script>

<Tabs.Trigger
	{value}
	class={cn(
		"inline-flex items-center justify-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all relative",
		"border-x border-t border-border rounded-t-lg border-b",
		"bg-muted/50 text-muted-foreground",
		"hover:bg-muted hover:text-foreground",
		"data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-transparent data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:-mb-px data-[state=active]:relative data-[state=active]:z-10",
		"focus-visible:outline-ring focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-ring/50",
		"disabled:pointer-events-none disabled:opacity-50",
		"[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		// Connecting border line
		"after:content-[''] after:absolute after:-right-2 after:bottom-0 after:w-2 after:h-px after:bg-border last:after:hidden",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</Tabs.Trigger>
