<script lang="ts">
	import { Button } from '$lib/subwoof/components/ui/button';
	import { page } from '$app/state';
	import Icon from '@iconify/svelte';
	import * as Sheet from '$lib/subwoof/components/ui/sheet/index.js';
	import { cn } from '$lib/utils';

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
	class="flex items-center justify-between sticky top-0 w-full h-16 backdrop-blur-xl border-b px-3 z-50"
>
	<!-- Logo - always visible -->
	<div class="grow basis-1 ml-2">
		<a class="flex items-center gap-2 w-fit" aria-label="OSEM" href="/">
			<img src="/2025-01-24_OSEM_logo_Letterhead copy.png" alt="OSEM Logo" class="h-14 w-auto" />
		</a>
	</div>

	<!-- Desktop nav links -->
	<div class="hidden lg:block">
		{@render titles()}
	</div>

	<!-- Right side: hamburger on mobile -->
	<div class="flex gap-2 grow basis-1 justify-end items-center">
		<div class="block lg:hidden">
			<Sheet.Root>
				<Sheet.Trigger><Icon class="w-6 h-6" icon="line-md:menu" /></Sheet.Trigger>
				<Sheet.Content side="right" style="view-transition-name: sheet;">
					<Sheet.Header>
						<Sheet.Title>
							<a class="flex items-center gap-2 w-fit" aria-label="OSEM" href="/">
								<img
									src="/2025-01-24_OSEM_logo_Letterhead copy.png"
									alt="OSEM Logo"
									class="h-12 w-auto"
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
	</div>
</nav>

<style>
	nav {
		display: flex;
		justify-content: space-between;
		view-transition-name: header;
	}
</style>
