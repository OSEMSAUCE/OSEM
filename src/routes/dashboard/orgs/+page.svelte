<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from '$lib/subwoof/components/dashboard/DataTable.svelte';
	import { Button } from '$lib/subwoof/components/ui/button';
	import * as Card from '$lib/subwoof/components/ui/card';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	// Get search param for initial selection
	const searchParam = $derived($page.url.searchParams.get('search') ?? '');

	// Unique organizations for dropdown
	const organizations = $derived(
		[...new Set(data.tableData.map((row: any) => row.organizationLocalName as string))]
			.filter(Boolean)
			.sort()
	);

	// Handle dropdown selection
	function selectOrganization(orgName: string) {
		const url = new URL(window.location.href);
		url.searchParams.set('search', orgName);
		window.location.href = url.toString();
		isOpen = false;
	}

	// Combobox state
	let inputValue = $state(searchParam);
	let isOpen = $state(false);

	const filteredOrganizations = $derived(
		organizations.filter((org) => 
			org.toLowerCase().includes(inputValue.toLowerCase())
		)
	);

	// Sync input with URL param
	$effect(() => {
		inputValue = searchParam;
	});
</script>

<div class="page-container mx-6 py-6">
	<div class="mb-6 flex items-center gap-3 justify-between">
		<h1 class="text-2xl font-bold">Organizations</h1>
	</div>

	{#if data.error}
		<Card.Root class="mb-6 border border-destructive">
			<Card.Content>
				<strong>API Error:</strong>
				{data.error}
				<div class="text-sm text-muted-foreground mt-2">Check browser console for details.</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<div class="border border-border rounded-lg bg-background p-6">
		<div class="mb-6 relative w-[300px]">
			<input
				type="text"
				class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				placeholder="Select or type organization..."
				bind:value={inputValue}
				onfocus={() => isOpen = true}
				oninput={() => isOpen = true}
			/>
			{#if isOpen && filteredOrganizations.length > 0}
				<div class="absolute top-full mt-1 z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
					<div class="max-h-[300px] overflow-y-auto p-1">
						{#each filteredOrganizations as org}
							<button
								class="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
								onclick={() => selectOrganization(org)}
							>
								{org}
							</button>
						{/each}
					</div>
				</div>
			{/if}
			{#if isOpen}
				<div class="fixed inset-0 z-40" onclick={() => isOpen = false}></div>
			{/if}
		</div>

		{#if searchParam}
			{#if data.tableData.length > 0}
				<DataTable
					data={data.tableData}
					initialFilterValue={searchParam}
					exclude={[
						'organizationLocalId',
						'organizationMasterId',
						'polyId',
						'gpsLat',
						'gpsLon',
						'deleted',
						'lastEditedBy',
						'lastEditedAt',
						'createdAt'
					]}
				/>
			{:else}
				<div class="text-center py-12">
					<h2 class="text-xl font-semibold mb-2">No Data</h2>
					<p class="text-muted-foreground">
						No organization data found for "{searchParam}".
					</p>
				</div>
			{/if}
		{:else}
			<div class="text-center py-12">
				<h2 class="text-xl font-semibold mb-2">Select an Organization</h2>
				<p class="text-muted-foreground">
					Use the search box above to find an organization.
				</p>
			</div>
		{/if}
	</div>
</div>
