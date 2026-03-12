<script lang="ts">
	import WhoListTemplate from "../../lib/components/who/whoList-template.svelte";
	import WhoMapTemplate from "../../lib/components/who/whoMap-template.svelte";
	import { type WhoOrganization } from "../../lib/contracts/zodSchemas";

	export let data: { organizations: WhoOrganization[] };
	export let markerUrl: string | undefined = undefined;
</script>

<div class="flex h-screen w-full flex-col md:flex-row">
	<div class="w-full md:w-1/3 lg:w-1/4 h-1/2 md:h-full">
		<WhoListTemplate organizations={data.organizations} />
	</div>

	<div
		class="w-full md:w-2/3 lg:w-3/4 h-1/2 md:h-full relative border-t-2 border-accent md:border-t-0"
	>
		<WhoMapTemplate organizations={data.organizations} {markerUrl} />
	</div>
</div>

<!-- // add components here with matching borders -->
