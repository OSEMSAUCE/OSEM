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
		<div class="footer-content">
			<h3>
				By <a href="https://groundtruth.app/">Ground Truth Data Inc.</a> 
			</h3>
			<p>
				© {new Date().getFullYear()} Ground Truth Data Inc. All rights reserved.	
			</p>
		</div>
	</footer>
</div>

<style>

footer {
	text-align: left;
	justify-content: left;
	align-items: wrap;
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
	}
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

	.global-footer {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: 1rem;
	margin-top: auto;
	background-color: var(--color-bg-2);
	border-top: 1px solid rgba(0, 0, 0, 0.1);
	width: 100%;
	text-align: center;
}

.footer-content {
	max-width: var(--column-width);
	width: 100%;
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
