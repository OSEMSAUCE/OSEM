<script lang="ts">
	import { onMount } from "svelte";

	let { onclick }: { onclick?: () => void } = $props();
	let lottieContainer: HTMLDivElement;

	onMount(async () => {
		// Dynamic import to avoid SSR issues
		const { DotLottieWC } = await import("@lottiefiles/dotlottie-wc");
		// Register the web component if not already registered
		if (!customElements.get("dotlottie-wc")) {
			customElements.define("dotlottie-wc", DotLottieWC);
		}
	});
</script>

<button
	type="button"
	class="spinning-globe-container"
	{onclick}
	aria-label="View organizations on map"
>
	<div class="spinning-globe-glow"></div>
	<div class="spinning-globe-lottie" bind:this={lottieContainer}>
		<dotlottie-wc
			src="/pub-OSEM/Earth Globe Looped Icon.lottie"
			loop
			autoplay
			speed="0.2"
		></dotlottie-wc>
	</div>
</button>

<style>
	.spinning-globe-container {
		position: relative;
		width: 100px;
		height: 100px;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spinning-globe-glow {
		position: absolute;
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(255, 193, 7, 0.15) 0%,
			rgba(255, 193, 7, 0.08) 40%,
			rgba(255, 193, 7, 0) 70%
		);
		/* No animation - container handles the unified glow */
	}

	.spinning-globe-lottie {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		overflow: hidden;
	}

	.spinning-globe-lottie dotlottie-wc {
		width: 100%;
		height: 100%;
	}

	@keyframes pulse-glow {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(1);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.05);
		}
	}

	.spinning-globe-container:hover .spinning-globe-glow {
		opacity: 1;
		transform: scale(1.2);
	}

	.spinning-globe-container:focus-visible {
		outline: 2px solid #8b5cf6;
		outline-offset: 4px;
		border-radius: 50%;
	}
</style>
