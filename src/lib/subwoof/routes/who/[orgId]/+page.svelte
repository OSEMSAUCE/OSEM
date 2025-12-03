<script lang="ts">
	// import type { PageData } from './$types';
	// import type { organizationLocalTable } from '$lib/subwoof/types';

	import WhoTemplate from '$lib/subwoof/components/who/whoList-template.svelte';

	// The API returns a transformed object, not the raw database table.
	// We define the interface to match what src/api/routes/who.ts returns.
	interface TransformedOrg {
		id: string;
		displayName: string;
		displayAddress?: string | null;
		displayWebsite?: string | null;
		claimCount?: number; // Optional because detail API might return 'claims' array instead
		[key: string]: any;
	}

	interface PageData {
		org: TransformedOrg;
	}

	export let data: PageData;
	const { org } = data;

	// Ensure claimCount exists for the template
	const orgWithCounts = {
		...org,
		claimCount: org.claimCount || (org.claims?.length ?? 0)
	};
</script>

<WhoTemplate organizations={[orgWithCounts]} />
