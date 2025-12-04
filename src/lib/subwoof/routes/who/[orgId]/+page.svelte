<script lang="ts">
	import WhoSpecificTemplate from '$lib/subwoof/components/who/whoSpecific-template.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<WhoSpecificTemplate org={data.org} />
