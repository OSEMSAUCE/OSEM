<script lang="ts">
	// import { Badge } from '$lib/subwoof/components/ui/badge';
	import { type organizationLocalTable } from '$lib/subwoof/types';

	let { organizations = [] }: { organizations: organizationLocalTable[] } = $props();
</script>

<div class="h-full flex flex-col bg-background border-r border-border">
	<div class="p-4 border-b border-border bg-background sticky top-0 z-10">
		<h1 class="text-xl font-bold mb-2 text-foreground">Organizations</h1>
		<p class="text-sm text-muted-foreground">{organizations.length} organizations found</p>
	</div>

	<div class="flex-1 overflow-auto">
		{#if organizations.length > 0}
			<div class="flex flex-col gap-3 p-4">
				{#each organizations as org}
					<a
						href="/who/{org.organizationLocalId}"
						class="group flex flex-col gap-1 p-4 border rounded-xl bg-card text-card-foreground hover:bg-muted/30 hover:shadow-md"
					>
						<div class="flex justify-between items-start gap-4">
							<div class="space-y-1">
								<span class="font-medium group-hover:text-primary transition-colors">
									{org.organizationLocalName}
								</span>
								{#if org.address}
									<p class="text-sm text-muted-foreground line-clamp-1">
										{org.address}
									</p>
								{/if}
							</div>
							<!-- {#if org.claimCount > 0}
								<Badge variant="secondary" class="shrink-0">
									{org.claimCount} Claims
								</Badge>
							{/if} -->
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="text-center py-8 text-muted-foreground">No organizations found.</div>
		{/if}
	</div>
</div>
