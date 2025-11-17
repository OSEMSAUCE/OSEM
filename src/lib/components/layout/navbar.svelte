<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/state';
	import Icon from '@iconify/svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils';
	import Lightswitch from '../lightswitch.svelte';

	const menu = [
		{
			title: 'HOME',
			href: '/'
		},
		{
			title: 'DASHBOARD',
			href: '/dashboard'
		},
		{
			title: 'MAP',
			href: '/map'
		},
		{
			title: 'ABOUT',
			href: '/about'
		}
	];
</script>

{#snippet titles(classname?: string)}
	{#each menu as { title, href }}
		<Button
			variant="link"
			{href}
			class={cn(page.url.pathname === href ? '' : 'text-opacity-70', classname)}>{title}</Button
		>
	{/each}
{/snippet}

<nav
	aria-label="Site menu"
	class="flex items-center justify-between sticky top-0 w-full min-h-[80px] backdrop-blur-xl border-b px-3 z-50 py-2"
>
	<div class="grow basis-1 ml-2 hidden md:block">
		<a class="flex items-center gap-2 w-fit" aria-label="OSEM" href="/">
			<img 
		src="/2025-01-24_OSEM_logo_Letterhead copy.png" 
		alt="OSEM - Open Source Environmental Monitoring" 
		class="h-16 w-auto"
		loading="lazy"
	/>
			<span class="text-lg font-bold">OSEM</span>
		</a>
	</div>
	<div class="hidden md:block">
		{@render titles()}
	</div>
	<div class="block md:hidden">
		<Sheet.Root>
			<Sheet.Trigger><Icon class="w-5 h-5" icon="line-md:menu" /></Sheet.Trigger>
			<Sheet.Content side="left" style="view-transition-name: sheet;">
				<Sheet.Header>
					<Sheet.Title>
						<a class="flex items-center gap-2 w-fit" aria-label="OSEM" href="/">
							<img 
			src="/2025-01-24_OSEM_logo_Letterhead copy.png" 
			alt="OSEM - Open Source Environmental Monitoring" 
			class="h-14 w-auto"
			loading="lazy"
		/>
							<span class="text-lg font-bold">OSEM</span>
						</a>
					</Sheet.Title>
					<Sheet.Description class="grid gap-2 items-start text-start">
						{@render titles('text-lg justify-self-start')}
					</Sheet.Description>
				</Sheet.Header>
			</Sheet.Content>
		</Sheet.Root>
	</div>

	<div class="flex gap-2 grow basis-1 justify-end">
		<Lightswitch />
	</div>
</nav>

<style>
	nav {
		display: flex;
		justify-content: space-between;
		view-transition-name: header;
	}
</style>
