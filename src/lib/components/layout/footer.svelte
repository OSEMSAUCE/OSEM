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
			<svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="50" cy="50" r="45" fill="#2E7D32" />
				<path
					d="M50 20 L65 35 L60 35 L60 50 L70 50 L70 55 L60 55 L60 70 L55 70 L55 55 L45 55 L45 70 L40 70 L40 55 L30 55 L30 50 L40 50 L40 35 L35 35 L50 20Z"
					fill="#FFF"
				/>
			</svg>
			
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
