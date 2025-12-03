<script lang="ts">
	import * as Card from '$lib/subwoof/components/ui/card';
	import { Badge } from '$lib/subwoof/components/ui/badge';

	let { organizations = [] }: { organizations: any[] } = $props();
</script>

<div class="h-full flex flex-col bg-background">
	<div class="p-4 border-b border-border bg-background sticky top-0 z-10">
		<h1 class="text-xl font-bold mb-2 text-foreground">Organizations</h1>
		<p class="text-sm text-muted-foreground">{organizations.length} organizations found</p>
	</div>

	<div class="flex-1 overflow-auto p-1 space-y-1">
		{#if organizations.length > 0}
			{#each organizations as org}
				<a href="/who/{org.id}" class="block group">
					<Card.Root class="h-full transition-colors hover:bg-muted/50">
						<Card.Header>
							<div class="flex justify-between items-start gap-4">
								<div>
									<Card.Title class="group-hover:text-primary">
										{org.displayName}
									</Card.Title>
									{#if org.displayAddress}
										<Card.Description class="line-clamp-1">
											{org.displayAddress}
										</Card.Description>
									{/if}
								</div>
								{#if org.claimCount > 0}
									<Badge variant="secondary" class="shrink-0">
										{org.claimCount} Claims
									</Badge>
								{/if}
							</div>
						</Card.Header>
					</Card.Root>
				</a>
			{/each}
		{:else}
			<div class="text-center py-8 text-muted-foreground">No organizations found.</div>
		{/if}
	</div>
</div>
