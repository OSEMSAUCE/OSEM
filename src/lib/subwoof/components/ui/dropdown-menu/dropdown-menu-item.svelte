<script lang="ts">
	import { cn } from '../../../../utils';
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	let {
		ref = $bindable<HTMLElement | null>(null),
		inset = false,
		class: className,
		children,
		variant = 'default',
		...restProps
	}: DropdownMenuPrimitive.ItemProps & {
		inset?: boolean;
		variant?: 'default' | 'destructive';
	} = $props();
</script>

	{...restProps}
>
	{@render children?.()}
</DropdownMenuPrimitive.Item>
