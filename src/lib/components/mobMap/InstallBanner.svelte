<script lang="ts">
	import { onMount } from 'svelte';
	import { installPrompt, isInstalled } from '$lib/stores/pwa';
	import { browser } from '$app/environment';

	let dismissed = $state(false);
	let isIos = $state(false);
	let isIosSafari = $state(false);

	onMount(() => {
		if (!browser) return;

		// Detect iOS Safari (where beforeinstallprompt never fires)
		const ua = navigator.userAgent;
		isIos = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
		const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
		const isStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
		isIosSafari = isIos && isSafari && !isStandalone;

		// Already installed (matched media)
		if (window.matchMedia('(display-mode: standalone)').matches) {
			isInstalled.set(true);
		}
	});

	function dismiss() {
		dismissed = true;
		sessionStorage.setItem('pwa-banner-dismissed', '1');
	}

	onMount(() => {
		if (sessionStorage.getItem('pwa-banner-dismissed')) {
			dismissed = true;
		}
	});

	async function install() {
		const prompt = $installPrompt;
		if (!prompt) return;
		await prompt.prompt();
		const choice = await prompt.userChoice;
		if (choice.outcome === 'accepted') {
			isInstalled.set(true);
		}
		installPrompt.set(null);
	}

	const showAndroidBanner = $derived(!dismissed && !$isInstalled && !!$installPrompt);
	const showIosBanner = $derived(!dismissed && isIosSafari);
</script>

{#if showAndroidBanner}
	<div
		class="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 px-3 py-2 bg-emerald-900/90 backdrop-blur-sm text-white text-sm"
	>
		<span class="flex-1">Add ReTreever Map to your home screen for offline use.</span>
		<button
			onclick={install}
			class="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold active:scale-95 transition-transform"
		>
			Install
		</button>
		<button onclick={dismiss} aria-label="Dismiss" class="text-white/60 active:text-white ml-1">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<line x1="18" y1="6" x2="6" y2="18"/>
				<line x1="6" y1="6" x2="18" y2="18"/>
			</svg>
		</button>
	</div>
{/if}

{#if showIosBanner}
	<div
		class="absolute top-0 left-0 right-0 z-20 flex items-start gap-2 px-3 py-2 bg-emerald-900/90 backdrop-blur-sm text-white text-sm"
	>
		<span class="flex-1">
			To install: tap
			<svg xmlns="http://www.w3.org/2000/svg" class="inline w-4 h-4 align-text-bottom" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
				<polyline points="16 6 12 2 8 6"/>
				<line x1="12" y1="2" x2="12" y2="15"/>
			</svg>
			then <strong>"Add to Home Screen"</strong>
		</span>
		<button onclick={dismiss} aria-label="Dismiss" class="text-white/60 active:text-white mt-0.5">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<line x1="18" y1="6" x2="6" y2="18"/>
				<line x1="6" y1="6" x2="18" y2="18"/>
			</svg>
		</button>
	</div>
{/if}
