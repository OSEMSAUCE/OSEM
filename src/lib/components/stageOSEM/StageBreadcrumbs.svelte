<script lang="ts">
	let {
		heading,
		routePath,
	}: {
		heading: string;
		routePath: "/who" | "/what";
	} = $props();
</script>

<nav aria-label="Breadcrumbs">
	<a href="/">Home</a>
	<span>/</span>
	<a href={routePath}>{heading}</a>
</nav>
