<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import MobileNav from '$lib/components/mobMap/MobileNav.svelte';

	let { children } = $props();
</script>

<Toaster position="top-center" />
<div style="--subnav-height: 2.5rem">
	<MobileNav />
	{@render children()}
</div>
