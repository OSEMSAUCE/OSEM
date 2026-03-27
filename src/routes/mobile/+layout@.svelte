<script lang="ts">
	import '../../../../src/app.css';
	import { Toaster } from '$osem/components/ui/sonner';
	import MobileNav from '$osem/components/mobMap/MobileNav.svelte';
	let { children } = $props();
</script>

<Toaster position="top-center" />
<div class="mobile-shell">
	<div class="mobile-content">
		{@render children()}
	</div>
	<MobileNav />
</div>

<style>
	.mobile-shell {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		overflow: hidden;
	}

	.mobile-content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		position: relative;
	}
</style>
