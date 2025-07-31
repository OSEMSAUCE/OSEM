<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="app">
	<Header />

	<main>
		{@render children()}
	</main>

	<footer>
		<h3>
			By <a href="https://groundtruth.app/">Ground Truth Data Inc.</a> 
		</h3>
		<p>
			© {new Date().getFullYear()} Ground Truth Data Inc. All rights reserved.	
		</p>
	</footer>
</div>

<style>

footer {
	text-align: left;
	justify-content: left;
	padding: 1rem;
}
	h3 {
		font-size: 1rem;
		text-align: left;
	justify-content: left;
	}
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}a

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 1rem;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 5rem 0;
		}
	}
</style>
