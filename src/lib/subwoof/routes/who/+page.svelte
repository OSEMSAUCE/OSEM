<script lang="ts">
	import WhoListTemplate from '$lib/subwoof/components/who/whoList-template.svelte';
	import WhoMapTemplate from '$lib/subwoof/components/who/whoMap-template.svelte';
	import { type organizationLocalTable } from '$lib/subwoof/types';
	
	export let data: { organizations: organizationLocalTable[]};
</script>

<div class="flex h-screen w-full flex-col md:flex-row">
	<div class="w-full md:w-1/3 lg:w-1/4 h-1/2 md:h-full">
		<WhoListTemplate organizations={data.organizations} />
	</div>

	<div class="w-full md:w-2/3 lg:w-3/4 h-1/2 md:h-full relative">
		<WhoMapTemplate organizations={data.organizations} />
	</div>
</div>

<!-- // add components here with matching borders -->
