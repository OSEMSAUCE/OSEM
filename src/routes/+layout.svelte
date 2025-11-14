<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';

	let { children } = $props();
</script>



<div class="app">
	<Header />

	<main class="content">
		{@render children()}
	</main>

	<footer class="global-footer">
		<p>© 2025 Ground Truth Data Inc. All rights reserved.
An <a href="https://github.com/OSEMSAUCE/">OSEM🤘🌲</a> project.</p>
	</footer>
</div>
