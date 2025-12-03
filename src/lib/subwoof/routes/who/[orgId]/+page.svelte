<script lang="ts">
	import type { PageData } from './$types';
	
	import WhoTemplate from '$lib/subwoof/components/who/who-template.svelte';

	export let data: PageData;
	const { org } = data;
</script>

<WhoTemplate org={org} />
