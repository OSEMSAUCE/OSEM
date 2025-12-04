<script lang="ts">
	import * as Card from '$lib/subwoof/components/ui/card';
</script>

<div class="container mx-auto px-4 py-12 max-w-6xl">
	<!-- Header Section -->
	<div class="mb-12 text-center md:text-left space-y-2">
		<h1 class="text-5xl font-extrabold tracking-tight lg:text-6xl">
			OSEM <span class="text-primary">🤘🌲</span>
		</h1>
		<p class="text-xl text-muted-foreground">Professional Reforestation Tracking Tools</p>
	</div>

	<div class="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
		<!-- Left Column: Navigation Cards -->
		<div class="grid gap-4 w-full">
			<a href="/who" class="group block">
				<Card.Root
					class="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50"
				>
					<Card.Header>
						<Card.Title class="text-2xl flex items-center gap-2">
							WHO <span class="text-2xl">👩🏼‍🔬️ 🐶️</span>
						</Card.Title>
						<Card.Description class="text-base">
							List of reforestation organizations and attributes 📊
						</Card.Description>
					</Card.Header>
				</Card.Root>
			</a>

			<a href="/what" class="group block">
				<Card.Root
					class="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50"
				>
					<Card.Header>
						<Card.Title class="text-2xl flex items-center gap-2">WHAT</Card.Title>
						<Card.Description class="text-base">
							Reforestation Data Tables 🌲️🌳️🌴️
						</Card.Description>
					</Card.Header>
				</Card.Root>
			</a>

			<a href="/where" class="group block">
				<Card.Root
					class="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50"
				>
					<Card.Header>
						<Card.Title class="text-2xl flex items-center gap-2">WHERE</Card.Title>
						<Card.Description class="text-base">
							Interactive map with transparent polygons 🌏️
						</Card.Description>
					</Card.Header>
				</Card.Root>
			</a>
		</div>

		<!-- Right Column: Feature Image -->
		<div class="w-full h-full flex items-center justify-center p-2">
			<Card.Root class="w-full overflow-hidden shadow-xl border-2">
				<Card.Content class="p-4">
					<div class="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
						<img
							src="/pictures/2023-12  Seedlign pics replant.ca_environmental_victoria_park_2023_photo_003 copy$$ copy.jpg"
							alt="Reforestation Field Work"
							class="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
						/>
					</div>
				</Card.Content>
				<Card.Footer class="bg-muted/30 p-4 border-t">
					<p class="text-sm text-muted-foreground w-full text-center italic">
						"Field work in Victoria Park, 2023"
					</p>
				</Card.Footer>
			</Card.Root>
		</div>
	</div>
</div>
