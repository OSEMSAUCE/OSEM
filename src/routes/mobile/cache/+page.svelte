<script lang="ts">
	import EZCache from "$lib/components/mobTally/EZCache.svelte";
	import { createMockStore } from "$lib/mobTally/mockStore.svelte.js";

	const store = createMockStore();
</script>

<EZCache {store} />
