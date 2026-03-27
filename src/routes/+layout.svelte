<script>
	import "$lib/styles/app.css";
	import { page } from "$app/state";
	// dark mode here!
	// import { ModeWatcher } from 'mode-watcher';
	import Navbar from "../lib/components/layout/navbar.svelte";
	import Footer from "../lib/components/layout/footer.svelte";

	let { children } = $props();

	const isMobileApp = $derived(page.url.pathname.startsWith("/mobile"));
</script>

<!-- dark mode here! -->
<!-- <ModeWatcher defaultMode="light" track={true} /> -->

{#if !isMobileApp}
	<Navbar />
{/if}

{@render children()}

{#if !isMobileApp}
	<Footer />
{/if}
