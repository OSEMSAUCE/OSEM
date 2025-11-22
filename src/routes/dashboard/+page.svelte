<script lang="ts">
	// Re-export from SubWoof - single source of truth
	import DashboardPage from '$lib/subwoof/routes/dashboard/+page.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<DashboardPage {data} />
