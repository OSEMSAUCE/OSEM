<script lang="ts">
	import Button from '$lib/subwoof/components/ui/button/button.svelte';
	import { ArrowRight, Users, Database, Map as MapIcon, Globe, Sprout } from 'lucide-svelte';
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
					in:fly={{ y: 50, duration: 1000, delay: 200 }}
					class="flex flex-col items-center text-center space-y-6 md:space-y-10"
				>
					<div
						class="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-md"
					>
						<span class="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
						OSEM v4.0 is live
					</div>
					<h1
						class="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50"
					>
						OSEM<span class="text-primary">.</span>
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
	<section id="explore" class="px-6 py-24 bg-secondary/30 relative">
		<div class="container mx-auto max-w-7xl">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px] md:auto-rows-[400px]">
				<!-- WHO CARD (Large Span 2) -->
				<a
					href="/who"
					class="group md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-card border border-border/50 shadow-sm transition-all duration-500 hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1"
				>
					<div
						class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
					></div>

					<!-- Content -->
					<div class="relative h-full p-10 flex flex-col justify-between z-10">
						<div class="space-y-4">
							<div
								class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
							>
								<Users size={32} />
							</div>
							<div>
								<h3 class="text-4xl font-bold tracking-tight">WHO</h3>
								<p class="mt-2 text-lg text-muted-foreground max-w-md">
									Manage stakeholders, organizations & workforce.
								</p>
							</div>
						</div>

						<div
							class="flex items-center text-primary font-medium text-lg opacity-80 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100"
						>
							View Agents <ArrowRight class="ml-2 h-5 w-5" />
						</div>
					</div>

					<!-- Decorative Background Icon -->
					<Users
						class="absolute -bottom-12 -right-12 h-96 w-96 text-primary/5 rotate-[-15deg] transition-all duration-700 group-hover:rotate-0 group-hover:scale-110"
					/>
				</a>

				<!-- WHAT CARD (Span 1) -->
				<a
					href="/what"
					class="group relative overflow-hidden rounded-[2.5rem] bg-card border border-border/50 shadow-sm transition-all duration-500 hover:shadow-2xl hover:border-blue-500/50 hover:-translate-y-1"
				>
					<div
						class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
					></div>

					<div class="relative h-full p-10 flex flex-col justify-between z-10">
						<div class="space-y-4">
							<div
								class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
							>
								<Database size={32} />
							</div>
							<div>
								<h3 class="text-4xl font-bold tracking-tight">WHAT</h3>
								<p class="mt-2 text-lg text-muted-foreground">Comprehensive data & metrics.</p>
							</div>
						</div>

						<div
							class="flex items-center text-blue-500 font-medium text-lg opacity-80 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100"
						>
							Explore Data <ArrowRight class="ml-2 h-5 w-5" />
						</div>
					</div>
					<Database
						class="absolute -bottom-12 -right-12 h-80 w-80 text-blue-500/5 rotate-[15deg] transition-all duration-700 group-hover:rotate-0 group-hover:scale-110"
					/>
				</a>

				<!-- WHERE CARD (Span 1) -->
				<a
					href="/where"
					class="group relative overflow-hidden rounded-[2.5rem] bg-card border border-border/50 shadow-sm transition-all duration-500 hover:shadow-2xl hover:border-green-500/50 hover:-translate-y-1"
				>
					<div
						class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
					></div>

					<div class="relative h-full p-10 flex flex-col justify-between z-10">
						<div class="space-y-4">
							<div
								class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
							>
								<MapIcon size={32} />
							</div>
							<div>
								<h3 class="text-4xl font-bold tracking-tight">WHERE</h3>
								<p class="mt-2 text-lg text-muted-foreground">Geospatial tracking & maps.</p>
							</div>
						</div>

						<div
							class="flex items-center text-green-500 font-medium text-lg opacity-80 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100"
						>
							Open Map <ArrowRight class="ml-2 h-5 w-5" />
						</div>
					</div>
					<Globe
						class="absolute -bottom-12 -right-12 h-80 w-80 text-green-500/5 rotate-[-15deg] transition-all duration-700 group-hover:rotate-0 group-hover:scale-110"
					/>
				</a>

				<!-- IMAGE CARD (Span 2) -->
				<div
					class="group md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-card border border-border/50 shadow-sm transition-all duration-500 hover:shadow-2xl"
				>
					<img
						src={mainImage}
						alt="Field Work"
						class="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0"
					/>
					<div
						class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-10 flex flex-col justify-end"
					>
						<span
							class="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-widest text-white/90 uppercase bg-white/10 backdrop-blur-md rounded-full w-fit"
						>
							Field Report
						</span>
						<h3 class="text-white text-3xl md:text-4xl font-bold tracking-tight mb-2">
							Victoria Park Restoration
						</h3>
						<p class="text-white/80 text-lg max-w-xl">
							Active reforestation project capturing carbon and restoring biodiversity. 2023 Field
							season documentation.
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
