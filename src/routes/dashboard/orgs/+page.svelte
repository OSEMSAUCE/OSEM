<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from '$lib/subwoof/components/dashboard/DataTable.svelte';
	import { Button } from '$lib/subwoof/components/ui/button';
	import * as DropdownMenu from '$lib/subwoof/components/ui/dropdown-menu';
	import * as Card from '$lib/subwoof/components/ui/card';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	// Get search param for initial selection
	const searchParam = $derived($page.url.searchParams.get('search') ?? '');

	// Filter config for organization table
	const filterConfig = {
		columnKey: 'organizationLocalName',
		placeholder: 'Filter by organization name...'
	};

	// Unique organizations for dropdown
	const organizations = $derived(
		[...new Set(data.tableData.map((row: any) => row.organizationLocalName))]
			.filter(Boolean)
			.sort()
	);

	// Handle dropdown selection
	function selectOrganization(orgName: string) {
		const url = new URL(window.location.href);
		url.searchParams.set('search', orgName);
		window.location.href = url.toString();
	}

	function clearSelection() {
		const url = new URL(window.location.href);
		url.searchParams.delete('search');
		window.location.href = url.toString();
	}
</script>

<div class="page-container mx-6 py-6">
	<div class="mb-6 flex items-center gap-3 justify-between">
		<h1 class="text-2xl font-bold">Organizations</h1>
		
		<div class="flex items-center gap-2">
			{#if searchParam}
				<Button variant="ghost" onclick={clearSelection}>
					Clear Filter
				</Button>
			{/if}
			
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="outline">
						{searchParam || 'Select Organization...'}
						<span class="ml-2">▼</span>
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-[300px] max-h-[400px] overflow-y-auto">
					{#each organizations as org}
						<DropdownMenu.Item onclick={() => selectOrganization(org as string)}>
							{org}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
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
		{#if searchParam}
			{#if data.tableData.length > 0}
				<DataTable
					data={data.tableData}
					{filterConfig}
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
					Please select an organization from the dropdown above to view details.
				</p>
			</div>
		{/if}
	</div>
</div>
