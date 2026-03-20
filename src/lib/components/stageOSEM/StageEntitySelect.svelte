<script lang="ts">
	import type { StageEntity } from "./stageTypes";

	let {
		entity,
		heading,
	}: {
		entity: StageEntity;
		heading: string;
	} = $props();
</script>

<section>
	<label for="stage-entity-select"
		>Explore {entity === "organization" ? "Organization" : "Project"} Data</label
	>
	<div>
		<div aria-hidden="true">🌍</div>
		<button
			id="stage-entity-select"
			type="button"
			aria-haspopup="listbox"
			aria-expanded="false"
		>
			<span>{heading}</span>
			<span aria-hidden="true">⌄</span>
		</button>
	</div>
</section>
