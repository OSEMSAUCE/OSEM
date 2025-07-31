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
		<p>By  <a href="https://groundtruth.app/"> Ground Truth Data Inc.</a> © {new Date().getFullYear()} All rights reserved.
	</footer>
</div>

<style>

.global-footer {
	/* text-align: center; */
	padding: 0.5rem;
	white-space: nowrap;
	font-size: 0.9rem;
	overflow-x: auto;
}
	.app {
		/* display: flex; */
		flex-direction: column;
		/* min-height: 100vh; */
	}
	main {
		flex: 1;
		/* display: flex; */
		/* flex-direction: column; */
		padding: 1rem;
		width: 100%;
		max-width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
	}

	.global-footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    white-space: nowrap;
    font-size: 0.9rem;
    overflow-x: auto;
    text-align: center;
}


.global-footer a {
	font-weight: bold;
}

.content {
	flex: 1;
	display: flex;
	flex-direction: column;
	width: 100%;
}

@media (min-width: 480px) {
	.global-footer {
		padding: 1.5rem 0;
	}
}
</style>
