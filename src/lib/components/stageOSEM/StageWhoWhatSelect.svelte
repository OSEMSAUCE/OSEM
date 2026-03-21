<script lang="ts">
	import { Button } from "../ui/button";
	import { Input } from "../ui/input";
	import type { StageEntity, StageRoutePath } from "./stageTypes";

	let {
		entity,
		heading,
		routePath,
	}: {
		entity: StageEntity;
		heading: string;
		routePath: StageRoutePath;
	} = $props();

	const entityLabel = $derived(
		entity === "organization" ? "organization" : "project",
	);
	const entityLabelTitle = $derived(
		entity === "organization" ? "Organization" : "Project",
	);
	const inputPlaceholder = $derived(
		entity === "organization"
			? "Search organizations by name"
			: "Search projects by name",
	);
</script>

<section class="px-4 py-10 sm:px-6 lg:px-8">
	<div
		class="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs sm:flex-row sm:items-center sm:p-4"
	>
		<!-- <div
			class="flex h-14 items-center justify-center rounded-2xl bg-muted px-4 text-2xl"
			aria-hidden="true"
		>
			🌍
		</div> -->
		<div class="flex min-w-0 flex-1 flex-col gap-2">
			
			<Input/>
				<!-- id="stage-entity-input"
				type="text"
				name="stageEntity"
				placeholder={inputPlaceholder}
				class="h-14 rounded-2xl px-4 text-base"
			/> -->
		</div>
		<Button
			href={routePath}
			size="lg"
			class="h-14 shrink-0 rounded-2xl px-6 text-base"
		>
			Browse {heading}
		</Button>
	</div>
</section>
