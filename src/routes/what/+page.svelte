<script lang="ts">
	// Re-export from SubWoof - single source of truth
	import WhatPage from '$subwoof/routes/what/+page.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<WhatPage data={data as any} />
