<script>
	let sections = [
		{
			name: 'Company',
			items: [
				{
					name: 'About',
					href: '/about'
				},
				{
					name: 'Ground Truth Data',
					href: 'https://groundtruth.app'
				},
				{
					name: 'Contact',
					href: '/contact'
				}
			]
		},
		{
			name: 'Legal',
			items: [
				{
					name: 'Terms of Use',
					href: '/legals/terms-of-services'
				},
				{
					name: 'Privacy Policy',
					href: '/legals/privacy'
				}
			]
		},
		{
			name: 'Partners',
			items: [
				{
					name: 'ReTreever',
					href: 'https://retreever.app'
				},
				{
					name: 'OpenSustain.tech',
					href: 'https://opensustain.tech'
				}
			]
		}
	];
</script>

<footer class="w-full p-10 border-t border-accent backdrop-blur-xl">
	<div class="grid sm:grid-flow-col gap-8 text-sm pb-16">
		<a class="flex items-center gap-2 w-fit sm:col-span-2" aria-label="OSEM" href="/">
			<img
				src="/favicon.png"
				alt="OSEM - Open Source Environmental Movement"
				class="h-16 w-auto"
				loading="lazy"
			/>
			<span class="sr-only">OSEM - Open Source Environmental Movement</span>
		</a>
		{#each sections as section}
			<div class="w-fit">
				<h4 class="font-semibold mb-4 uppercase">{section.name}</h4>
				<nav class="grid gap-2" aria-label={`${section.name} menu`}>
					{#each section.items as { name, href }}
						<a class="text-muted-foreground hover:underline hover:text-primary" {href}> {name} </a>
					{/each}
				</nav>
			</div>
		{/each}
	</div>
	<aside class="border-t w-full pt-5 mt-5">
		<p class="text-xs antialiased text-start">
			Copyright @ OSEM
			{new Date().getFullYear()}
		</p>
	</aside>

	<div class="flex justify-center items-center text-xs font-light">
		<a
			href="https://github.com/OSEMSAUCE/OSEM"
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center justify-center border px-2 py-1 rounded-lg hover:bg-accent transition-colors"
		>
			<span class="leading-none text-lg">OSEM🤘🏼🌲</span>
			<img src="/2025-11-17 Github Logo.png" alt="GitHub" class="w-5 h-5 ml-1.5" />
		</a>
	</div>
</footer>

<style>
	footer {
		view-transition-name: footer;
	}
</style>
