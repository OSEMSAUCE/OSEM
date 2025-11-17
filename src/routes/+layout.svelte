<script>
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.ts';
	import Navbar from '$lib/components/layout/navbar.svelte';
	import Footer from '$lib/components/layout/footer.svelte';

	let { children } = $props();
</script>

<Toaster />
<ModeWatcher />

<Navbar />

{@render children()}

<Footer />
