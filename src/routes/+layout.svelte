<script>
	import "$lib/styles/app.css";
	import { page } from "$app/state";
	// dark mode here!
	// import { ModeWatcher } from 'mode-watcher';
	import Navbar from "../lib/components/layout/navbar.svelte";
	import Footer from "../lib/components/layout/footer.svelte";

	let { children } = $props();

	const isMobile = $derived(page.url.pathname.startsWith('/mobile'));
</script>

<!-- dark mode here! -->
<!-- <ModeWatcher defaultMode="light" track={true} /> -->

{#if !isMobile}
	<Navbar />
{/if}

{@render children()}

{#if !isMobile}
	<Footer />
{/if}
