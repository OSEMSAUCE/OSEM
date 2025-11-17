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

<footer class="w-full p-6 border-t backdrop-blur-xl">
	<div class="grid sm:grid-flow-col gap-8 text-sm pb-2">
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

	<div class="flex justify-center items-center text-xs font-light mt-1">
		<a 
			href="https://github.com/OSEMSAUCE/OSEM" 
			target="_blank" 
			rel="noopener noreferrer"
			class="flex items-center justify-center gap-1.5 border px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
			aria-label="Visit OSEM on GitHub"
		>
			<span class="leading-none text-lg">OSEM🤘🌲</span>
			<img 
				src="/2025-11-17 Github Logo.png" 
				alt="GitHub" 
				class="w-5 h-5" 
			/>
		</a>
	</div>
</footer>

<style>
	footer {
		view-transition-name: footer;
	}
</style>
