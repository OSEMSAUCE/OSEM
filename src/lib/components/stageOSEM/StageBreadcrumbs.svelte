<script lang="ts">
	import * as Breadcrumb from "../ui/breadcrumb";
	import type { StageRoutePath } from "./stageTypes";

	let {
		heading,
		routePath,
	}: {
		heading: string;
		routePath: StageRoutePath;
	} = $props();
</script>

<Breadcrumb.Breadcrumb
	aria-label="Breadcrumbs"
	class="px-4 py-3 sm:px-6 lg:px-8"
>
	<Breadcrumb.BreadcrumbList>
		<Breadcrumb.BreadcrumbItem>
			<Breadcrumb.BreadcrumbLink href="/">Home</Breadcrumb.BreadcrumbLink>
		</Breadcrumb.BreadcrumbItem>
		<Breadcrumb.BreadcrumbSeparator />
		<Breadcrumb.BreadcrumbItem>
			<Breadcrumb.BreadcrumbLink href={routePath}
				>{heading}</Breadcrumb.BreadcrumbLink
			>
		</Breadcrumb.BreadcrumbItem>
	</Breadcrumb.BreadcrumbList>
</Breadcrumb.Breadcrumb>
