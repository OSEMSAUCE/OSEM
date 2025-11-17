<script>
	let sections = [
		{
			name: 'Product',
			items: [
				{
					name: 'Dashboard',
					href: '/dashboard'
				},
				{
					name: 'Map',
					href: '/map'
				}
			]
		},
		{
			name: 'Company',
			items: [
				{
					name: 'About',
					href: '/about'
				},
				{
					name: 'Contact',
					href: '/contact'
				}
			]
		},
		{
			name: 'Resources',
			items: [
				{
					name: 'Documentation',
					href: '/docs'
				}
			]
		}
	];
</script>

<footer class="w-full p-10 border-t backdrop-blur-xl">
	<div class="grid sm:grid-flow-col gap-8 text-sm pb-16">
		<a class="flex items-center gap-2 w-fit sm:col-span-2" aria-label="OSEM" href="/">
			<img src="/favicon.png" alt="OSEM Logo" width="50" height="50" />
			
			<span class="text-lg font-bold">OSEM</span>
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

	<div class="flex justify-center items-center text-xs font-light mt-4">
		<span class="flex items-center justify-center border px-2 py-1 rounded-lg">
			Open Source Environmental Monitoring
		</span>
	</div>
</footer>

<style>
	footer {
		view-transition-name: footer;
	}
</style>
