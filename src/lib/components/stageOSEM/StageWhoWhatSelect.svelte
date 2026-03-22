<script lang="ts">
	import Globe from "lucide-svelte/icons/globe";
	import { Input } from "../ui/input";
	import type { StageEntity, StageRoutePath } from "./stageTypes";

	let {
		entity,
		heading,
		routePath,
	}: {
		entity: StageEntity;
		heading: string;
		routePath: StageRoutePath;
	} = $props();

	const inputPlaceholder = $derived(
		entity === "organization" ? "Search Organizations" : "Search Projects",
	);
</script>

<section
	class="flex h-full items-start justify-start px-4 pb-4 pt-[15%] sm:px-6 lg:pl-[20%]"
>
	<div class="glow-sync flex w-full max-w-md items-center gap-3 lg:max-w-lg">
		<div class="globe-container" aria-hidden="true">
			<Globe class="globe-icon" size={36} />
		</div>
		<Input
			id="stage-entity-input"
			type="text"
			name="stageEntity"
			placeholder={inputPlaceholder}
			class="glow-input h-14 flex-1 rounded-2xl border-2 px-4 text-base"
		/>
	</div>
</section>

<style>
	.glow-sync {
		animation: sync-pulse 2s ease-in-out infinite;
	}

	@keyframes sync-pulse {
		0%,
		100% {
			--glow-intensity: 0;
		}
		50% {
			--glow-intensity: 1;
		}
	}

	.globe-container {
		display: flex;
		align-items: center;
		justify-content: center;
		filter: drop-shadow(0 0 8px #d4a017) drop-shadow(0 0 16px #d4a01780);
		animation: globe-pulse 2s ease-in-out infinite;
	}

	@keyframes globe-pulse {
		0%,
		100% {
			filter: drop-shadow(0 0 8px #d4a017) drop-shadow(0 0 16px #d4a01780);
		}
		50% {
			filter: drop-shadow(0 0 14px #d4a017) drop-shadow(0 0 24px #d4a017)
				drop-shadow(0 0 32px #d4a01780);
		}
	}

	.globe-container :global(.globe-icon) {
		color: #d4a017;
	}

	:global(.glow-sync .glow-input) {
		border-color: #d4a017 !important;
		animation: pulse-glow 2s ease-in-out infinite;
		caret-color: #ffd700;
		font-size: 1.25rem;
		font-weight: 600;
	}

	:global(.glow-input::placeholder) {
		color: #d4a017;
		font-weight: 600;
		opacity: 1;
	}

	:global(.glow-input:hover) {
		box-shadow:
			0 0 16px #d4a01780,
			0 0 28px #d4a01760;
	}

	:global(.glow-input:focus) {
		outline: none;
		animation: none;
		border-color: #ffd700 !important;
		box-shadow:
			0 0 20px #ffd700b0,
			0 0 40px #ffd70080,
			0 0 60px #d4a01760;
		caret-color: #ffd700;
		color: #ffd700;
	}

	:global(.glow-input:focus::placeholder) {
		color: #ffd700;
	}

	@keyframes pulse-glow {
		0%,
		100% {
			box-shadow:
				0 0 8px #d4a01740,
				0 0 16px #d4a01720;
		}
		50% {
			box-shadow:
				0 0 14px #d4a01770,
				0 0 28px #d4a01750;
		}
	}
</style>
