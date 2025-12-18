<script lang="ts">
	import * as Tabs from '../ui/tabs';
	import { cn } from '../../../utils';

	let { value = $bindable(), class: className = undefined, children, ...restProps } = $props();
</script>

<Tabs.Root bind:value {...restProps} class={cn('w-full', className)}>
	<div class="flex w-full items-end overflow-x-auto">
		<Tabs.List class="bg-transparent p-0 gap-1 shrink-0">
			{@render children?.()}
		</Tabs.List>
		<div class="flex-1 border-b border-border min-w-4"></div>
	</div>
</Tabs.Root>
