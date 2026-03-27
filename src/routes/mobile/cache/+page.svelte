<script lang="ts">
	import CacheApp from '$lib/components/mobTally/CacheApp.svelte';
	import { createMockStore } from '$lib/mobTally/mockStore.svelte.js';

	const store = createMockStore();
</script>

<CacheApp {store} />
