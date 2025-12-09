<script lang="ts">
	import Button from '$lib/subwoof/components/ui/button/button.svelte';
	import { ArrowRight, Users, Database, Map as MapIcon, Globe, Sprout, Check } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let visible = false;

	onMount(() => {
		visible = true;
	});

	const mainImage =
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
	<!-- Navigation/Bento Grid -->
	<section id="explore" class="px-6 py-24 bg-secondary/5 relative">
		<div class="container mx-auto max-w-7xl">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px] md:auto-rows-[420px]">
				<!-- WHO CARD (Large Span 2) -->
				<a
					href="/who"
					class="group md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:border-zinc-200 hover:-translate-y-1"
				>
					<div
						class="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent opacity-100"
					></div>

					<div
						class="relative h-full p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 z-10"
					>
						<div class="space-y-6 max-w-lg">
							<div class="inline-flex items-center space-x-2">
								<span
									class="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold tracking-widest uppercase"
								>
									Network
								</span>
							</div>
							<div>
								<h3 class="text-5xl md:text-6xl font-black tracking-tight text-zinc-900">WHO_</h3>
								<p class="mt-4 text-xl text-zinc-600 font-medium leading-relaxed">
									The people behind the trees.
									<span class="block mt-1 text-zinc-400 font-normal text-base"
										>Organizations, stakeholders, and stewards.</span
									>
								</p>
							</div>
							<div
								class="flex items-center text-indigo-600 font-bold group-hover:translate-x-2 transition-transform"
							>
								View Profiles <ArrowRight class="ml-2 w-5 h-5" />
							</div>
						</div>

						<!-- "Avatar" Graphic -->
						<div class="relative shrink-0 hidden md:block group-hover:scale-105 transition-transform duration-500">
							<!-- Main Avatar -->
							<div
								class="relative w-40 h-40 bg-zinc-900 rounded-full shadow-2xl flex items-center justify-center z-20 ring-8 ring-white"
							>
								<Users class="w-16 h-16 text-white" strokeWidth={1.5} />
								<div class="absolute bottom-1 right-1 bg-green-500 rounded-full p-2 border-4 border-white">
									<Check class="w-5 h-5 text-white" strokeWidth={3} />
								</div>
							</div>
							<!-- Decorative circles -->
							<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-indigo-100 rounded-full -z-10"></div>
							<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-indigo-50 rounded-full -z-20"></div>
						</div>
					</div>
				</a>

				<!-- WHAT CARD (Span 1) -->
				<a
					href="/what"
					class="group relative overflow-hidden rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)] hover:border-blue-100 hover:-translate-y-1"
				>
					<div
						class="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent"
					></div>

					<div class="relative h-full p-10 flex flex-col justify-between z-10">
						<div class="space-y-6">
							<div
								class="h-16 w-16 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500"
							>
								<Database class="h-8 w-8" strokeWidth={1.5} />
							</div>
							<div>
								<h3 class="text-4xl font-black tracking-tight text-zinc-900">WHAT</h3>
								<p class="mt-3 text-lg text-zinc-500 leading-snug">
									Comprehensive data metrics & taxonomies.
								</p>
							</div>
						</div>

						<div
							class="flex items-center text-blue-600 font-bold opacity-80 group-hover:opacity-100 group-hover:translate-x-2 transition-all"
						>
							Explore Data <ArrowRight class="ml-2 h-5 w-5" />
						</div>
					</div>
				</a>

				<!-- WHERE CARD (Span 1) -->
				<a
					href="/where"
					class="group relative overflow-hidden rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(34,197,94,0.15)] hover:border-green-100 hover:-translate-y-1"
				>
					<div
						class="absolute inset-0 bg-gradient-to-br from-green-50/50 via-transparent to-transparent"
					></div>

					<div class="relative h-full p-10 flex flex-col justify-between z-10">
						<div class="space-y-6">
							<div
								class="h-16 w-16 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-500"
							>
								<MapIcon class="h-8 w-8" strokeWidth={1.5} />
							</div>
							<div>
								<h3 class="text-4xl font-black tracking-tight text-zinc-900">WHERE</h3>
								<p class="mt-3 text-lg text-zinc-500 leading-snug">
									Geospatial tracking & site verification.
								</p>
							</div>
						</div>

						<div
							class="flex items-center text-green-600 font-bold opacity-80 group-hover:opacity-100 group-hover:translate-x-2 transition-all"
						>
							Open Map <ArrowRight class="ml-2 h-5 w-5" />
						</div>
					</div>
				</a>

				<!-- IMAGE CARD (Span 2) -->
				<div
					class="group md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-zinc-800 shadow-sm transition-all duration-500 hover:shadow-2xl"
				>
					<img
						src={mainImage}
						alt="Field Work"
						class="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100"
					/>
					<div
						class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-12 flex flex-col justify-end"
					>
						<span
							class="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest text-white/90 uppercase bg-white/10 backdrop-blur-md rounded-full w-fit border border-white/10"
						>
							2023 Field Season
						</span>
						<h3 class="text-white text-3xl md:text-5xl font-bold tracking-tight mb-4">
							Victoria Park Restoration
						</h3>
						<p class="text-zinc-300 text-lg md:text-xl max-w-2xl leading-relaxed">
							Active reforestation project capturing carbon and restoring biodiversity in the heart of the city.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer Minimal -->
	<footer class="py-12 text-center text-muted-foreground/50 text-sm">
		<p>© 2025 OSEM. Built for the planet.</p>
	</footer>
</div>
