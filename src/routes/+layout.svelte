<script>
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Navbar from '$lib/components/layout/navbar.svelte';
	import Footer from '$lib/components/layout/footer.svelte';

	let { children } = $props();
</script>

<ModeWatcher defaultMode="light" />

<Navbar />

{@render children()}

<Footer />
