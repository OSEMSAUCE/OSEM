<!--
    OgPanel — minimal "feed the gopher" UI.

    Bottom-anchored card with three states:
        idle     no blob exists      → "Feed the gopher" button
        running  prefetch in flight  → progress bar + cancel
        full     a blob is cached    → blob meta + "Re-feed" button

    Stays in OSEM (open source). No cache/tally imports. Caller owns
    the action — pass `onFeed` / `onCancel` props.
-->
<script lang="ts">
import type { OgBlob } from "./types";
import type { PrefetchProgress } from "./ogPrefetch";

let {
    blob = null,
    progress = null,
    onFeed,
    onCancel,
    error = null,
    hungry = false,
}: {
    blob?: OgBlob | null;
    progress?: PrefetchProgress | null;
    onFeed: () => void;
    onCancel?: () => void;
    error?: string | null;
    hungry?: boolean;
} = $props();

let collapsed = $state(false);

const sizeKB = (b: Blob | null | undefined) =>
    b ? Math.round(b.size / 1024) : 0;

// Force open while a download is running so the user can see progress
// and cancel. Otherwise honor the user's collapse choice.
const open = $derived(progress !== null || !collapsed);
</script>

{#if open}
<div class="og-panel">
    <header>
        <span class="og-panel__title">Offline Gopher</span>
        <span class="og-panel__head-right">
            {#if hungry}
                <span class="og-panel__chip og-panel__chip--hungry">hungry</span>
            {:else if blob}
                <span class="og-panel__chip og-panel__chip--full">fed</span>
            {/if}
            {#if !progress}
                <button
                    class="og-panel__close"
                    aria-label="Collapse"
                    onclick={() => (collapsed = true)}
                >×</button>
            {/if}
        </span>
    </header>

    {#if progress}
        <div class="og-panel__row">
            <div class="og-panel__bar">
                <div
                    class="og-panel__bar-fill"
                    style:width="{Math.round(progress.fraction * 100)}%"
                ></div>
            </div>
            <span class="og-panel__pct">
                {Math.round(progress.fraction * 100)}%
            </span>
        </div>
        <p class="og-panel__detail">
            {progress.fetched} / {progress.total} tiles
            {#if progress.failed > 0}· {progress.failed} failed{/if}
        </p>
        {#if onCancel}
            <button class="og-panel__btn og-panel__btn--ghost" onclick={onCancel}>
                cancel
            </button>
        {/if}
    {:else if blob}
        <p class="og-panel__detail">
            {blob.tileCount} tiles · {sizeKB(blob.compositeBlob)} KB ·
            {new Date(blob.composedAt).toLocaleString()}
        </p>
        <button class="og-panel__btn" onclick={onFeed}>
            feed (replace blob here)
        </button>
    {:else}
        <p class="og-panel__detail">
            No blob yet. Tap to download a 60 km offline area at your location.
        </p>
        <button class="og-panel__btn og-panel__btn--primary" onclick={onFeed}>
            feed the gopher
        </button>
    {/if}

    {#if error}
        <p class="og-panel__error">{error}</p>
    {/if}
</div>
{:else}
<button
    class="og-panel__pin"
    onclick={() => (collapsed = false)}
    aria-label="Open Offline Gopher panel"
>
    OG
    {#if hungry}
        <span class="og-panel__pin-dot"></span>
    {/if}
</button>
{/if}

<style>
/* Anchored at the top, below the topbar/back row.
   The bottom of the screen is taken up by the shovel-grabber drawer
   handle, so the panel sits up here where it's always reachable. */
.og-panel {
    position: absolute;
    left: 12px;
    right: 12px;
    top: calc(env(safe-area-inset-top, 0) + 56px);
    background: rgba(20, 20, 20, 0.92);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    padding: 12px 14px;
    font-size: 13px;
    z-index: 12;
    backdrop-filter: blur(8px);
}
header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    gap: 8px;
}
.og-panel__head-right {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
.og-panel__close {
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    border: none;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    padding: 0 4px;
}
.og-panel__close:hover { color: #fff; }

/* Collapsed pin — small floating button beside the back row. */
.og-panel__pin {
    position: absolute;
    top: calc(env(safe-area-inset-top, 0) + 56px);
    right: 12px;
    z-index: 13;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(20, 20, 20, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #f5c14a;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.04em;
    cursor: pointer;
    backdrop-filter: blur(8px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.og-panel__pin-dot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f5a07a;
    box-shadow: 0 0 0 2px rgba(20, 20, 20, 0.92);
}
.og-panel__title {
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
}
.og-panel__chip {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 8px;
    border-radius: 999px;
}
.og-panel__chip--hungry {
    background: rgba(220, 110, 70, 0.2);
    color: #f5a07a;
}
.og-panel__chip--full {
    background: rgba(140, 200, 130, 0.2);
    color: #a3d49b;
}
.og-panel__detail {
    color: rgba(255, 255, 255, 0.7);
    margin: 6px 0 8px;
    line-height: 1.35;
}
.og-panel__row {
    display: flex;
    align-items: center;
    gap: 10px;
}
.og-panel__bar {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 3px;
    overflow: hidden;
}
.og-panel__bar-fill {
    height: 100%;
    background: #f5c14a;
    transition: width 200ms ease-out;
}
.og-panel__pct {
    font-variant-numeric: tabular-nums;
    color: #f5c14a;
    font-weight: 600;
}
.og-panel__btn {
    margin-top: 6px;
    width: 100%;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
}
.og-panel__btn--primary {
    background: #f5c14a;
    color: #111;
    border-color: transparent;
    font-weight: 600;
}
.og-panel__btn--ghost {
    background: transparent;
}
.og-panel__error {
    color: #f5a07a;
    margin: 6px 0 0;
}
</style>
