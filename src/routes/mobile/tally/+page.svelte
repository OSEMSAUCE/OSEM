<script lang="ts">
	import TallyPage from '$lib/components/mobTally/TallyPage.svelte';
	import { createMockStore } from '$lib/mobTally/mockStore.js';

	const store = createMockStore();
</script>

<TallyPage {store} />
