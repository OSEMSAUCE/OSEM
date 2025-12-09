<script lang="ts">
	import Button from '$lib/subwoof/components/ui/button/button.svelte';
	import { ArrowRight, Users, Database, Map as MapIcon, Globe, Sprout, Check } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let visible = false;

	onMount(() => {
		visible = true;
	});

	// Placeholder images from the project
	const whoImage =
		'/pictures/2023-12  Seedlign pics replant.ca_environmental_victoria_park_2023_photo_003 copy$$ copy.jpg';
	const whatImage = '/pictures/example.jpg';
	const whereImage = '/pictures/example2.webp';
	const reportImage =
		'/pictures/2023-12  Seedlign pics replant.ca_environmental_victoria_park_2023_photo_003 copy$$ copy.jpg';
</script>

<div
	class="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden"
>
	<!-- Hero Section -->
	<section class="relative px-6 pt-24 pb-32 md:pt-40 md:pb-48 overflow-hidden">
		<!-- Background Elements -->
		<div
			class="absolute top-0 right-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] filter"
		></div>
		<div
			class="absolute bottom-0 left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px] filter"
		></div>

		<div class="container mx-auto max-w-7xl relative z-10">
			{#if visible}
				<div
					in:fly={{ y: 200, duration: 1000, delay: 200 }}
					class="flex flex-col items-center text-center space-y-6 md:space-y-10"
				>
					<a
						href="https://osemsauce.org/where"
						class="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-md hover:bg-primary/20 transition-colors"
					>
						<span class="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse shadow-[0_0_8px_2px_rgba(34,197,94,0.9)]"></span>
						OSEM v4.0 is live
					</a>
					<h1
						class="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50"
					>
						OSEM<span class="text-primary"></span>
					</h1>
					<p
						class="text-xl md:text-3xl text-muted-foreground/80 max-w-3xl font-light tracking-wide leading-relaxed"
					>
						Open source 
						<span class="text-foreground font-medium">reforestation tracking</span>. <br />
						What trees were planted by <span class="text-foreground font-medium">who, where, and why.</span>. <br />
					</p>

					<div class="pt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
						<Button
							href="#explore"
							size="lg"
							class="rounded-full text-lg h-14 px-10 group relative overflow-hidden transition-all hover:shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)]"
						>
							<span class="relative z-10 flex items-center">
								Start Tracking <ArrowRight
									class="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform"
								/>
							</span>
						</Button>
						<Button
							variant="outline"
							size="lg"
							href="https://github.com/OSEMSAUCE/OSEM"
							target="_blank"
							class="rounded-full text-lg h-14 px-10 border-2"
						>
							Documentation
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Navigation/Bento Grid -->
	<section id="explore" class="px-6 py-24 bg-secondary/5 relative">
		<div class="container mx-auto max-w-7xl">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
				
				<!-- ROW 1: WHO -->
				<!-- Text Card -->
				<a
					href="/who"
					class="group relative overflow-hidden rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 p-8 flex flex-col justify-between"
				>
					<div class="flex justify-between items-start">
						<div class="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
							<Users class="w-8 h-8" />
						</div>
						<div class="p-2 rounded-full border border-zinc-100 text-zinc-300 group-hover:text-indigo-600 transition-colors">
							<ArrowRight class="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform" />
						</div>
					</div>
					<div>
						<h3 class="text-4xl font-black tracking-tight text-zinc-900">WHO_</h3>
						<p class="mt-2 text-zinc-500 font-medium">Network & People</p>
					</div>
				</a>
				<!-- Image Card -->
				<a
					href="/who"
					class="group md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
				>
					<img
						src={whoImage}
						alt="Who"
						class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
					/>
					<div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
				</a>


				<!-- ROW 2: WHAT -->
				<!-- Image Card (Left on Desktop) -->
				<a
					href="/what"
					class="group md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 order-last md:order-0"
				>
					<img
						src={whatImage}
						alt="What"
						class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
					/>
					<div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
				</a>
				<!-- Text Card -->
				<a
					href="/what"
					class="group relative overflow-hidden rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 p-8 flex flex-col justify-between"
				>
					<div class="flex justify-between items-start">
						<div class="p-3 rounded-2xl bg-blue-50 text-blue-600">
							<Database class="w-8 h-8" />
						</div>
						<div class="p-2 rounded-full border border-zinc-100 text-zinc-300 group-hover:text-blue-600 transition-colors">
							<ArrowRight class="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform" />
						</div>
					</div>
					<div>
						<h3 class="text-4xl font-black tracking-tight text-zinc-900">WHAT</h3>
						<p class="mt-2 text-zinc-500 font-medium">Data & Metrics</p>
					</div>
				</a>


				<!-- ROW 3: WHERE -->
				<!-- Text Card -->
				<a
					href="/where"
					class="group relative overflow-hidden rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-green-100 hover:-translate-y-1 p-8 flex flex-col justify-between"
				>
					<div class="flex justify-between items-start">
						<div class="p-3 rounded-2xl bg-green-50 text-green-600">
							<MapIcon class="w-8 h-8" />
						</div>
						<div class="p-2 rounded-full border border-zinc-100 text-zinc-300 group-hover:text-green-600 transition-colors">
							<ArrowRight class="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform" />
						</div>
					</div>
					<div>
						<h3 class="text-4xl font-black tracking-tight text-zinc-900">WHERE</h3>
						<p class="mt-2 text-zinc-500 font-medium">Maps & Locations</p>
					</div>
				</a>
				<!-- Image Card -->
				<a
					href="/where"
					class="group md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
				>
					<img
						src={whereImage}
						alt="Where"
						class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
					/>
					<div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
				</a>

			</div>
		</div>
	</section>

	<!-- Footer Minimal -->
	<footer class="py-12 text-center text-muted-foreground/50 text-sm">
		<p>© 2025 OSEM. Built for the planet.</p>
	</footer>
</div>
