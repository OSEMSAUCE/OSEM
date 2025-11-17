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
	class="flex items-center justify-between sticky top-0 w-full h-[55px] backdrop-blur-xl border-b px-3 z-50"
>
	<div class="grow basis-1 ml-2 hidden md:block">
		<a class="flex items-center gap-2 w-fit" aria-label="OSEM" href="/">
			<svg
				width="30"
				height="30"
				viewBox="0 0 100 100"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="50" cy="50" r="45" fill="#2E7D32" />
				<path
					d="M50 20 L65 35 L60 35 L60 50 L70 50 L70 55 L60 55 L60 70 L55 70 L55 55 L45 55 L45 70 L40 70 L40 55 L30 55 L30 50 L40 50 L40 35 L35 35 L50 20Z"
					fill="#FFF"
				/>
			</svg>

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
							<svg
								width="30"
								height="30"
								viewBox="0 0 100 100"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle cx="50" cy="50" r="45" fill="#2E7D32" />
								<path
									d="M50 20 L65 35 L60 35 L60 50 L70 50 L70 55 L60 55 L60 70 L55 70 L55 55 L45 55 L45 70 L40 70 L40 55 L30 55 L30 50 L40 50 L40 35 L35 35 L50 20Z"
									fill="#FFF"
								/>
							</svg>

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
