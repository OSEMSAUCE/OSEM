<script>
	import "$lib/styles/app.css";
	// dark mode here!
	// import { ModeWatcher } from 'mode-watcher';
	import Navbar from "../lib/components/layoutV1/navbar.svelte";
	import Footer from "../lib/components/layoutV1/footer.svelte";

	let { children } = $props();
</script>

<!-- dark mode here! -->
<!-- <ModeWatcher defaultMode="light" track={true} /> -->

<Navbar />

{@render children()}

<Footer />
