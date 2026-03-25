<script lang="ts">
	import "$lib/styles/app.css";
	import { Toaster } from "$lib/components/ui/sonner";
	let { children } = $props();
</script>

<Toaster position="top-center" />
<div class="mobile-app-container min-h-screen bg-background">
	{@render children()}
</div>
