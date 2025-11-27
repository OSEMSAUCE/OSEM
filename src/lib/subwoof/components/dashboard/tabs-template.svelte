<script lang="ts">
	import * as Tabs from '$lib/subwoof/components/ui/tabs';
	import { cn } from '$lib/utils.js';

	let {
		value = $bindable(),
		class: className = undefined,
		children,
		...restProps
	} = $props();
</script>

<Tabs.Root bind:value {...restProps} class={cn("w-full", className)}>
	<div class="flex w-full items-end">
		<Tabs.List class="bg-transparent p-0 gap-1">
			{@render children?.()}
		</Tabs.List>
		<div class="flex-1 border-b border-border"></div>
	</div>
</Tabs.Root>