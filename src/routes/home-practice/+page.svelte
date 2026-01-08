<script lang="ts">
// TEST
import Button from '../../lib/components/ui/button/button.svelte';
import { ArrowRight, Users, Database, Map as MapIcon } from 'lucide-svelte';
import { initializeMap, compactGlobeOptions } from '../../lib/components/where/mapParent';
import { fly } from 'svelte/transition';
import { onMount } from 'svelte';


//  ==============================================================================
// 🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️🦩️
// THIS IS THE HOME PRACTICE PAGE.
// 🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️🦚️	
//  DO NOT MIX IT UP WITH THE HOME PAGE.
// 🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞
// // ==============================================================================

	let mapContainer: HTMLDivElement;

	onMount(() => {
		let cleanupMap: (() => void) | undefined;
		const init = () => {
			cleanupMap = initializeMap(mapContainer, {
				...compactGlobeOptions,
				style: 'mapbox://styles/mapbox/satellite-v9', // Satellite for texture
				loadMarkers: false, // Clean look without markers
				rotationSpeed: 2.5, // Slow rotation
				compact: true,
				initialZoom: 2, // Make globe bigger
				transparentBackground: true // Remove stars and make background transparent
			});
		};

		if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
			(window as any).requestIdleCallback(init, { timeout: 1500 });
		} else {
			setTimeout(init, 0);
		}

		return () => {
			cleanupMap?.();
		}
	});

	// Placeholder images from the project
	const whoImage =
	 '/pictures/2016_stephan_019.webp';
	const whatImage =
		'/pictures/2023-12Seedling_pic_replant.ca_003.webp';
	const whereImage =
		'/pictures/2002_Chris_and_Greg_Kilborn_map_plant_plan_great_pic.webp';
	
</script>

<div class="min-h-screen w-full relative overflow-x-hidden">
	<div 
		class="fixed inset-0 z-0 bg-gray-100 flex flex-col items-center justify-center"
	>
		<div
			bind:this={mapContainer}
			class="w-full h-full bg-transparent relative"
		></div>
	</div>

	<!-- CONTENT SIDE (Overlapping) -->
	<!-- Venn Diagram: Square 2 (The Content) -->
	<!-- Venn Diagram: Square 2 (The Content) -->
	<div class="min-h-screen z-10 bg-white/70 shadow-2xl relative">
		<!-- Hero Section -->
		<section class="relative px-6 pt-24 pb-32 md:pt-40 md:pb-48 overflow-hidden">
			<div class="container mx-auto max-w-7xl relative z-10">
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
						<span class="text-foreground font-medium">Open source</span>
						reforestation data tools ⚙️️ <br />
						<span class="text-foreground font-medium">who</span> planted <span class="text-foreground font-medium">what</span> trees <span class="text-foreground font-medium">where</span> and <span class="text-foreground font-medium">why? 🌲️ </span>
							
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
			</div>
		</section>

		<!-- Navigation/Bento Grid -->
		<section id="explore" class="px-3 md:px-6 py-24 bg-secondary/5 relative">
			<div class="container mx-auto max-w-7xl">
				<div class="grid grid-cols-3 gap-3 md:gap-6 auto-rows-[140px] md:auto-rows-[300px]">
					
					<!-- ROW 1: WHO -->
					<!-- Text Card -->
					<a
						href="/who"
						class="order-1 group relative overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 p-4 md:p-8 flex flex-col justify-between"
					>
						<div class="flex justify-between items-start">
							<div class="p-1.5 md:p-3 rounded-xl md:rounded-2xl bg-purple-50 text-purple-600">
								<Users class="w-5 h-5 md:w-8 md:h-8" />
							</div>
							<div class="hidden md:block p-2 rounded-full border border-zinc-100 text-zinc-300 group-hover:text-indigo-600 transition-colors">
								<ArrowRight class="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform" />
							</div>
						</div>
						<div>
							<h3 class="text-lg md:text-4xl font-black tracking-tight text-zinc-900 group-hover:text-accent transition-colors">WHO</h3>
							<p class="mt-1 md:mt-2 text-xs md:text-xl font-bold text-zinc-600">Organizations</p>
						</div>
					</a>
					<!-- Image Card -->
					<a
						href="/who"
						class="order-2 col-span-2 group relative overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
					>
						<img
							src={whoImage}
							alt="Who"
							class="absolute inset-0 h-full w-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
						/>
						<div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
					</a>


					<!-- ROW 2: WHAT -->
					<!-- Text Card - Moved before Image for Mobile Flow -->
					<a
						href="/what"
						class="order-4 group relative overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 p-4 md:p-8 flex flex-col justify-between"
					>
						<div class="flex justify-between items-start">
							<div class="p-1.5 md:p-3 rounded-xl md:rounded-2xl bg-purple-50 text-purple-600">
								<Database class="w-5 h-5 md:w-8 md:h-8" />
							</div>
							<div class="hidden md:block p-2 rounded-full border border-zinc-100 text-zinc-300 group-hover:text-blue-600 transition-colors">
								<ArrowRight class="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform" />
							</div>
						</div>
						<div>
							<h3 class="text-lg md:text-4xl font-black tracking-tight text-zinc-900 group-hover:text-accent transition-colors">WHAT</h3>
							<p class="mt-1 md:mt-2 text-xs md:text-xl font-bold text-zinc-600">Trees</p>
						</div>
					</a>
					<!-- Image Card - Swapped with Text and ordered 3rd for desktop -->
					<a
						href="/what"
						class="order-3 col-span-2 group relative overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
					>
						<img
							src={whatImage}
							alt="What"
							class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
						/>
						<div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
					</a>


					<!-- ROW 3: WHERE -->
					<!-- Text Card -->
					<a
						href="/where"
						class="order-5 group relative overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-green-100 hover:-translate-y-1 p-4 md:p-8 flex flex-col justify-between"
					>
						<div class="flex justify-between items-start">
							<div class="p-1.5 md:p-3 rounded-xl md:rounded-2xl bg-purple-50 text-purple-600">
								<MapIcon class="w-5 h-5 md:w-8 md:h-8" />
							</div>
							<div class="hidden md:block p-2 rounded-full border border-zinc-100 text-zinc-300 group-hover:text-green-600 transition-colors">
								<ArrowRight class="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform" />
							</div>
						</div>
						<div>
							<h3 class="text-lg md:text-4xl font-black tracking-tight text-zinc-900 group-hover:text-accent transition-colors">WHERE</h3>
							<p class="mt-1 md:mt-2 text-xs md:text-xl font-bold text-zinc-600">Map / polygons</p>
						</div>
					</a>
					<!-- Image Card -->
					<a
						href="/where"
						class="order-6 col-span-2 group relative overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
					>
						<img
							src={whereImage}
							alt="Where"
							class="absolute inset-0 h-full w-full object-cover object-[center_90%] transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
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
</div>
