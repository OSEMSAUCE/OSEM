<script lang="ts">
	// ⚠️ READ-ONLY: This file imports from OSEM subwoof
	// 📝 To edit: /OSEM/src/lib/subwoof/routes/dashboard/orgs/[orgId]/+page.svelte
	import OrgDetailPage from '$lib/subwoof/routes/dashboard/orgs/[orgId]/+page.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<OrgDetailPage {data} />
