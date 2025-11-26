<script>
	import '../app.css';
	// dark mode here!
	// import { ModeWatcher } from 'mode-watcher';
	import Navbar from '$lib/components/layout/navbar.svelte';
	import Footer from '$lib/components/layout/footer.svelte';

	let { children } = $props();
</script>

<!-- dark mode here! -->
<!-- `<ModeWatcher defaultMode="light" track={false} />` -->

<Navbar />

{@render children()}

<Footer />
