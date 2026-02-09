<script lang="ts">
	// import { Badge } from '../ui/badge';
	import { type OrganizationLocalTable } from "../../types/index";

	let { organizations = [] }: { organizations: OrganizationLocalTable[] } =
		$props();

	let searchQuery = $state("");

	const filteredOrgs = $derived(
		searchQuery.trim()
			? organizations.filter((org) => {
					const q = searchQuery.toLowerCase();
					return (
						org.organizationLocalName?.toLowerCase().includes(q) ||
						org.address?.toLowerCase().includes(q) ||
						org.organizationLocalAddress?.toLowerCase().includes(q)
					);
				})
			: organizations,
	);
</script>

<div class="h-full flex flex-col bg-background border-r border-border">
	<div class="p-4 border-b border-border bg-background sticky top-0 z-10">
		<h1 class="text-xl font-bold mb-2 text-foreground">Organizations</h1>
		<input
			type="text"
			placeholder="Search organizations..."
			class="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
			bind:value={searchQuery}
		/>
		<p class="text-sm text-muted-foreground mt-2">
			{filteredOrgs.length}{searchQuery.trim()
				? ` of ${organizations.length}`
				: ""} organizations
		</p>
	</div>

	<div class="flex-1 overflow-auto">
		{#if filteredOrgs.length > 0}
			<div class="flex flex-col gap-3 p-4">
				{#each filteredOrgs as org}
					<a
						href="/who/{org.organizationLocalId}"
						class="group flex flex-col gap-1 p-4 border rounded-xl bg-card text-card-foreground hover:bg-muted/30 hover:shadow-md"
					>
						<div class="flex justify-between items-start gap-4">
							<div class="space-y-1">
								<span
									class="font-medium group-hover:text-primary transition-colors"
								>
									{org.organizationLocalName}
								</span>
								{#if org.address}
									<p
										class="text-sm text-muted-foreground line-clamp-1"
									>
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
			<div class="text-center py-8 text-muted-foreground">
				No organizations found.
			</div>
		{/if}
	</div>
</div>
