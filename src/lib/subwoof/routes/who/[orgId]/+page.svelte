<script lang="ts">
	import WhoSpecificTemplate from '../../../components/who/whoSpecific-template.svelte';

	type PageData = {
		org: unknown;
	};

	let { data }: { data: PageData } = $props();
</script>

<WhoSpecificTemplate org={data.org} />
