<script lang="ts">
	import Icon from "@iconify/svelte";
	import { page } from "$app/state";
	import { cn } from "../../utils";
	import { Button } from "../ui/button";
	import * as Sheet from "../ui/sheet/index.js";

	const menu = [
		{
			title: "HOME",
			href: "/",
		},
		{
			title: "WHO",
			href: "/who",
		},
		{
			title: "WHAT",
			href: "/what",
		},
		{
			title: "WHERE",
			href: "/where",
		},
	];
</script>

{#snippet titles(classname?: string)}
	{#each menu as { title, href }}
		<Button
			variant="link"
			{href}
			class={cn(
				page.url.pathname === href ? "" : "text-opacity-70",
				"font-bold",
				classname,
			)}>{title}</Button
		>
	{/each}
{/snippet}

<nav
	aria-label="Site menu"
	class="flex items-center justify-between sticky top-0 w-full h-16 backdrop-blur-xl bg-white border-b-2 border-accent px-3 z-50"
>
	<!-- Logo - fixed width, doesn't grow -->
	<div class="shrink-0 ml-1 md:ml-4">
		<a class="flex items-center gap-2 w-fit" aria-label="OSEM" href="/">
			<img
				src="/logos/2026-01-01_OSEM_logo_Letterhead.webp"
				alt="OSEM Logo"
				class="h-11 md:h-13 w-auto"
			/>
		</a>
	</div>

	<!-- Desktop nav links - flex-1 centers in remaining space -->
<div class="hidden md:flex gap-4 absolute left-1/2 -translate-x-1/3">
		{@render titles()}
	</div>

	<!-- Right side: hamburger on mobile -->
	<div class="flex gap-2 shrink-0 justify-end items-center mr-4">
		<div class="block md:hidden">
			<Sheet.Root>
				<Sheet.Trigger
					><Icon class="w-6 h-6" icon="line-md:menu" /></Sheet.Trigger
				>
				<Sheet.Content
					side="right"
					style="view-transition-name: sheet;"
				>
					<Sheet.Header>
						<Sheet.Title>
							<a
								class="flex items-center gap-2 w-fit"
								aria-label="OSEM"
								href="/"
							>
								<img
									src="/logos/2026-01-01_OSEM_logo_Letterhead.webp"
									alt="OSEM Logo"
									class="h-10 w-auto"
								/>
								<span class="text-lg font-bold">OSEM</span>
							</a>
						</Sheet.Title>
						<Sheet.Description
							class="grid gap-2 items-start text-start"
						>
							{#each menu as { title, href }}
								<Sheet.Close>
									{#snippet child({ props })}
										<a
											{...props}
											{href}
											class={cn(
												"inline-flex items-center justify-center font-bold text-primary underline-offset-4 hover:underline text-lg justify-self-start",
												page.url.pathname === href
													? ""
													: "text-opacity-70",
											)}
										>
											{title}
										</a>
									{/snippet}
								</Sheet.Close>
							{/each}
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
