<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"inline-flex items-center justify-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all",
		"border-x border-t border-border rounded-t-lg border-b",
		"bg-muted/50 text-muted-foreground",
		"hover:bg-muted hover:text-foreground",
		"data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-transparent data-[state=active]:border-x data-[state=active]:border-t",
		"focus-visible:outline-ring focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-ring/50",
		"disabled:pointer-events-none disabled:opacity-50",
		"[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		className
	)}
	{...restProps}
/>
