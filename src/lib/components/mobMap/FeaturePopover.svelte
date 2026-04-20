<script lang="ts">
import type { Feature } from "geojson";
import { measureFeature } from "./drawUtils";

let {
    feature,
    bbox,
    containerWidth,
    containerHeight,
    onShare,
    onEdit,
    onDelete,
    onClose,
}: {
    feature: Feature;
    bbox: { minX: number; minY: number; maxX: number; maxY: number };
    containerWidth: number;
    containerHeight: number;
    onShare: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
} = $props();

let measurement = $derived(measureFeature(feature));

let style = $derived.by(() => {
    const OFFSET = 15;
    const PW = 200;
    const PH = 72;
    const PAD = 8;

    const roomAbove = bbox.minY;
    const roomBelow = containerHeight - bbox.maxY;
    const top = roomAbove > roomBelow
        ? Math.max(PAD, bbox.minY - OFFSET - PH)
        : Math.min(containerHeight - PH - PAD, bbox.maxY + OFFSET);

    const centerX = (bbox.minX + bbox.maxX) / 2;
    let left = centerX - PW / 2;
    left = Math.max(PAD, Math.min(left, containerWidth - PW - PAD));
    return `left:${left}px;top:${top}px`;
});
</script>

<div class="feature-popover" {style}>
	<div class="fp-actions">
		<button class="fp-btn" onclick={onShare} title="Share">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
				<polyline points="16 6 12 2 8 6"/>
				<line x1="12" y1="2" x2="12" y2="15"/>
			</svg>
			<span>Share</span>
		</button>
		<button class="fp-btn" onclick={onEdit} title="Edit">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
			</svg>
			<span>Edit</span>
		</button>
		<button class="fp-btn fp-btn-delete" onclick={onDelete} title="Delete">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="3 6 5 6 21 6"/>
				<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
			</svg>
			<span>Delete</span>
		</button>
		<button class="fp-btn fp-btn-close" onclick={onClose} title="Close">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18"/>
				<line x1="6" y1="6" x2="18" y2="18"/>
			</svg>
		</button>
	</div>
	{#if measurement}
		<div class="fp-measure">{measurement}</div>
	{/if}
</div>

<style>
	@keyframes popover-in {
		from { opacity: 0; transform: scale(0.92); }
		to   { opacity: 1; transform: scale(1); }
	}

	.feature-popover {
		position: absolute;
		z-index: 30;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.375rem;
		background: rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(255, 215, 0, 0.5);
		border-radius: 0.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
		animation: popover-in 0.15s ease-out;
	}

	.fp-actions {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	.fp-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: none;
		background: transparent;
		color: #ffd700;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		-webkit-tap-highlight-color: transparent;
	}

	.fp-btn:active {
		background: rgba(255, 215, 0, 0.2);
	}

	.fp-btn-delete {
		color: #ef4444;
	}

	.fp-btn-delete:active {
		background: rgba(239, 68, 68, 0.2);
	}

	.fp-btn-close {
		color: #9ca3af;
		padding: 0.375rem;
	}

	.fp-btn-close:active {
		background: rgba(255, 255, 255, 0.1);
	}

	.fp-measure {
		text-align: center;
		color: #d1d5db;
		font-size: 0.6875rem;
		font-weight: 600;
		font-family: ui-monospace, monospace;
		padding: 0 0.25rem 0.125rem;
	}
</style>
