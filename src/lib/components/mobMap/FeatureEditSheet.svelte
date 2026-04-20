<script lang="ts">
import type { Feature } from "geojson";
import { measureFeature } from "./drawUtils";

let {
    feature,
    onSave,
    onClose,
}: {
    feature: Feature;
    onSave: (name: string, notes: string) => void;
    onClose: () => void;
} = $props();

let name = $state((feature.properties?.name as string) ?? "");
let notes = $state((feature.properties?.notes as string) ?? "");

let measurement = $derived(measureFeature(feature));

let touchStartY = 0;

function handleTouchStart(e: TouchEvent) {
    touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e: TouchEvent) {
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (dy > 80) save();
}

function save() {
    onSave(name, notes);
}
</script>

<div
    class="edit-sheet"
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
>
    <div class="es-handle" aria-hidden="true"></div>
    <button class="es-close" onclick={save} aria-label="Close">&#x2715;</button>

    <div class="es-content">
        {#if measurement}
            <div class="es-measure">{measurement}</div>
        {/if}

        <label class="es-label">
            <span>Name</span>
            <input
                type="text"
                class="es-input"
                bind:value={name}
                placeholder="Untitled feature"
            />
        </label>

        <label class="es-label">
            <span>Notes</span>
            <textarea
                class="es-textarea"
                bind:value={notes}
                placeholder="Add notes..."
                rows="3"
            ></textarea>
        </label>
    </div>
</div>

<!-- svelte-ignore css_unused_selector -->
<style>
    .edit-sheet {
        position: absolute;
        z-index: 40;
        left: 0;
        right: 0;
        bottom: 0;
        max-height: 50%;
        background: rgba(15, 15, 15, 0.95);
        border-top-left-radius: 1rem;
        border-top-right-radius: 1rem;
        backdrop-filter: blur(12px);
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
        overflow-y: auto;
    }

    .es-handle {
        width: 2.5rem;
        height: 0.25rem;
        background: #666;
        border-radius: 9999px;
        margin: 0.625rem auto 0;
        opacity: 0.5;
    }

    .es-close {
        position: absolute;
        top: 0.5rem;
        right: 0.75rem;
        width: 2.25rem;
        height: 2.25rem;
        border: none;
        background: transparent;
        color: #9ca3af;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.375rem;
        -webkit-tap-highlight-color: transparent;
    }

    .es-close:active {
        background: rgba(255, 255, 255, 0.1);
    }

    .es-content {
        padding: 1.5rem 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .es-measure {
        text-align: center;
        color: #ffd700;
        font-size: 0.875rem;
        font-weight: 700;
        font-family: ui-monospace, monospace;
        padding-bottom: 0.25rem;
    }

    .es-label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        color: #9ca3af;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }

    .es-input,
    .es-textarea {
        width: 100%;
        padding: 0.5rem 0.625rem;
        border-radius: 0.375rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.08);
        color: #f3f4f6;
        font-size: 0.875rem;
        font-family: inherit;
        outline: none;
    }

    .es-input:focus,
    .es-textarea:focus {
        border-color: rgba(255, 215, 0, 0.5);
    }

    .es-textarea {
        resize: vertical;
        min-height: 3rem;
    }
</style>
