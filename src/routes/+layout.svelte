<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import Header from './Header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<ModeWatcher defaultMode="dark" />

<div class="app">
	<Header />

	<main class="content">
		{@render children()}
	</main>

	<footer class="global-footer">
		<p>By  <a href="https://groundtruth.app/"> Ground Truth Data Inc.</a> © {new Date().getFullYear()} All rights reserved. </p>
	</footer>
</div>

<style>


	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	main {
		flex: 1;
		/* display: flex; */
		/* flex-direction: column; */
		padding: 0rem;
		width: 100%;
		max-width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
	}

	




.content {
	flex: 1;
	display: flex;
	flex-direction: column;
	width: 100%;
}


</style>
