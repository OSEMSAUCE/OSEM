<script lang="ts">
	import WhoListTemplate from "../../lib/components/who/whoList-template.svelte";
	import { type WhoOrganization } from "../../lib/contracts/zodSchemas";

	export let data: { organizations: WhoOrganization[] };
</script>

<div class="flex h-screen w-full">
	<div class="w-full h-full">
		<WhoListTemplate organizations={data.organizations} />
	</div>
</div>
