<script lang="ts">
import type { Feature } from "geojson";
import { measureFeature } from "./mapDrawUtils";

let {
    feature,
    bbox,
    containerWidth,
    containerHeight,
    onShare,
    onSave,
    onDelete,
    onClose,
    onChangeIcon,
}: {
    feature: Feature;
    bbox: { minX: number; minY: number; maxX: number; maxY: number };
    containerWidth: number;
    containerHeight: number;
    onShare: () => void;
    onSave: (name: string, notes: string) => void;
    onDelete: () => void;
    onClose: () => void;
    // Provided when the feature is a Point — popover renders an inline icon
    // picker. Tap a swatch → onChangeIcon(key) updates the feature in place.
    onChangeIcon?: (key: string) => void;
} = $props();

let name = $state("");
let notes = $state("");

// Only reset name/notes when the *identity* of the feature changes, not on
// every property mutation (e.g. icon swap). Otherwise picking an icon while
// typing the name would clobber unsaved typing.
let lastKey: string | undefined;
$effect(() => {
    const k = feature.properties?.mapFeatureKey as string | undefined;
    if (k === lastKey) return;
    lastKey = k;
    name = (feature.properties?.name as string) ?? "";
    notes = (feature.properties?.notes as string) ?? "";
});

const isPoint = $derived(feature.geometry?.type === "Point");
const currentIcon = $derived(
    (feature.properties?.pinTypeKey as string | undefined) ?? "default",
);
let measurement = $derived(measureFeature(feature));

// Pin types — kept tiny + colocated so the popover is self-contained.
// "default" is the gold teardrop; the rest are the colored PNGs in
// /mobileAssets/pin_library_small/.
const PIN_TYPES: { key: string; label: string }[] = [
    { key: "default", label: "Classic" },
    { key: "atv", label: "Quad" },
    { key: "cache", label: "Cache" },
    { key: "crossing_good", label: "Crossing" },
    { key: "crossing_bad", label: "No crossing" },
    { key: "helicopter", label: "Heli" },
    { key: "muster_point", label: "Muster" },
    { key: "truck", label: "Truck" },
];

let style = $derived.by(() => {
    const OFFSET = 15;
    const PW = isPoint ? 260 : 220;
    const PH = isPoint ? 200 : 100;
    const PAD = 8;

    const roomAbove = bbox.minY;
    const roomBelow = containerHeight - bbox.maxY;
    const top =
        roomAbove > roomBelow
            ? Math.max(PAD, bbox.minY - OFFSET - PH)
            : Math.min(containerHeight - PH - PAD, bbox.maxY + OFFSET);

    const centerX = (bbox.minX + bbox.maxX) / 2;
    let left = centerX - PW / 2;
    left = Math.max(PAD, Math.min(left, containerWidth - PW - PAD));
    return `left:${left}px;top:${top}px;width:${PW}px`;
});
</script>

<div class="feature-popover" {style}>
    {#if isPoint && onChangeIcon}
        <div class="fp-icon-row" role="radiogroup" aria-label="Pin icon">
            {#each PIN_TYPES as pt (pt.key)}
                <button
                    type="button"
                    class="fp-swatch"
                    class:fp-swatch-active={pt.key === currentIcon}
                    role="radio"
                    aria-checked={pt.key === currentIcon}
                    aria-label={pt.label}
                    title={pt.label}
                    onclick={() => onChangeIcon?.(pt.key)}
                >
                    {#if pt.key === "default"}
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#ffd700" stroke="#ffd700" stroke-width="0.5">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                        </svg>
                    {:else}
                        <img
                            src="/mobileAssets/pin_library_small/pin_{pt.key}.png"
                            alt=""
                            class="fp-swatch-img"
                        />
                    {/if}
                </button>
            {/each}
        </div>
    {/if}
    <div class="fp-actions">
        <button class="fp-btn" onclick={onShare} title="Share">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span>Share</span>
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
    <input
        type="text"
        class="fp-inline-name"
        bind:value={name}
        placeholder="Name this feature"
        onblur={() => onSave(name, notes)}
        onkeydown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
    />
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
        gap: 0.25rem;
        padding: 0.375rem;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 215, 0, 0.5);
        border-radius: 0.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        animation: popover-in 0.15s ease-out;
    }

    .fp-icon-row {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 2px;
    }

    .fp-swatch {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 0.25rem;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
    }
    .fp-swatch:active {
        background: rgba(255, 215, 0, 0.2);
    }
    .fp-swatch-active {
        border-color: rgba(255, 215, 0, 0.8);
        background: rgba(255, 215, 0, 0.15);
    }
    .fp-swatch-img {
        width: 22px;
        height: 22px;
        object-fit: contain;
        display: block;
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
        color: #ffffff;
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.03em;
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
        margin-left: auto;
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

    .fp-inline-name {
        width: 100%;
        padding: 0.25rem 0.4rem;
        border-radius: 0.3rem;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.06);
        color: #fafafa;
        font-size: 0.75rem;
        font-weight: 600;
        text-align: center;
        outline: none;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
    }
    .fp-inline-name::placeholder {
        color: rgba(255, 255, 255, 0.45);
        font-weight: 400;
    }
    .fp-inline-name:focus {
        border-color: rgba(255, 215, 0, 0.5);
        background: rgba(255, 255, 255, 0.1);
    }
</style>
