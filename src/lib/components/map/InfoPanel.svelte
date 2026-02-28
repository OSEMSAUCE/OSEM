<script lang="ts">
	import type { Component } from "svelte";

	let {
		selectedFeature = $bindable(null),
		panel,
		onClose,
	}: {
		selectedFeature: any;
		panel: Component<{ selectedFeature: any }>;
		onClose: () => void;
	} = $props();

	let PanelComponent = $derived(panel);

	// Swipe-down-to-close
	let touchStartY = 0;

	function handleTouchStart(e: TouchEvent) {
		touchStartY = e.touches[0].clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		const dy = e.changedTouches[0].clientY - touchStartY;
		if (dy > 80) onClose();
	}
</script>

{#if selectedFeature}
	<div
		class="info-panel"
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
	>
		<div class="drag-handle" aria-hidden="true"></div>
		<button class="close-btn" onclick={onClose} aria-label="Close panel"
			>×</button
		>
		<div class="panel-content">
			<PanelComponent {selectedFeature} />
		</div>
	</div>
{/if}

<style>
	.info-panel {
		position: absolute;
		background: var(--color-background, #1a1a1a);
		border: 1px solid var(--color-border, #333);
		z-index: 1000;
		overflow-y: auto;
		box-shadow: -0.25rem 0 1rem rgba(0, 0, 0, 0.3);
	}

	/* Desktop: right side panel */
	@media (min-width: 768px) {
		.info-panel {
			right: 1rem;
			top: 5rem;
			width: 20rem;
			max-height: calc(100vh - 6rem);
			border-radius: 0.5rem;
		}

		.drag-handle {
			display: none;
		}
	}

	/* Mobile: bottom panel */
	@media (max-width: 767px) {
		.info-panel {
			left: 0;
			right: 0;
			bottom: 0;
			max-height: 50vh;
			border-top-left-radius: 1rem;
			border-top-right-radius: 1rem;
			border-bottom: none;
		}

		.close-btn {
			width: 2.75rem;
			height: 2.75rem;
		}

		.panel-content {
			padding-top: 1.25rem;
		}
	}

	.drag-handle {
		width: 2.5rem;
		height: 0.25rem;
		background: var(--color-muted-foreground, #666);
		border-radius: 9999px;
		margin: 0.625rem auto 0;
		opacity: 0.5;
	}

	.close-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: var(--color-foreground, #fafafa);
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
		transition: background-color 0.2s;
	}

	.close-btn:hover,
	.close-btn:active {
		background: var(--color-accent, #a78bfa);
	}

	.panel-content {
		padding: 1rem;
		padding-top: 2.5rem;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}
</style>
