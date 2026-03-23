<script lang="ts">
	let {
		heading,
		description,
	}: {
		heading: string;
		description: string;
	} = $props();
</script>

<section>
	<h1>{heading}</h1>
	<p>{description}</p>
</section>
