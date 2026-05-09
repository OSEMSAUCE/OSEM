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

// Format byte sizes adaptively: < 1 MB shows as KB (no decimals),
// >= 1 MB shows as MB (one decimal). 4.3 MB reads cleaner than 4400 KB.
function formatSize(bytes: number | undefined): string {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
}

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
        {#if progress.byZoomTotal && Object.keys(progress.byZoomTotal).length > 0}
        <table class="og-panel__zoom">
            <thead>
                <tr><th>z</th><th>got</th><th>of</th><th>size</th></tr>
            </thead>
            <tbody>
                {#each Object.keys(progress.byZoomTotal).map(Number).sort((a, b) => a - b) as z}
                    <tr>
                        <td>{z}</td>
                        <td>{progress.byZoom?.[z] ?? 0}</td>
                        <td>{progress.byZoomTotal[z]}</td>
                        <td>{formatSize(progress.bytesByZoom?.[z] ?? 0)}</td>
                    </tr>
                {/each}
                <tr class="og-panel__zoom-total">
                    <td>Σ</td>
                    <td>{progress.fetched}</td>
                    <td>{progress.total}</td>
                    <td>{formatSize(progress.bytesTotal ?? 0)}</td>
                </tr>
            </tbody>
        </table>
        {/if}
        {#if onCancel}
            <button class="og-panel__btn og-panel__btn--ghost" onclick={onCancel}>
                cancel
            </button>
        {/if}
    {:else if blob}
        <p class="og-panel__detail">
            {blob.tileCount} tiles ·
            {formatSize(blob.totalBytes ?? blob.compositeBlob?.size)} ·
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
/* Anchored ~150 px down from the top — below the topbar AND the back
   row, in the upper-third sweet spot where it's always reachable and
   not hidden by the iOS notch. The bottom is taken up by the shovel
   grabber so we can't put it there. */
.og-panel {
    position: absolute;
    left: 12px;
    right: 12px;
    top: calc(env(safe-area-inset-top, 0) + 150px);
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

/* Collapsed pin — small floating button at the same vertical
   position the panel would occupy. */
.og-panel__pin {
    position: absolute;
    top: calc(env(safe-area-inset-top, 0) + 150px);
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
.og-panel__zoom {
    width: 100%;
    margin: 6px 0 8px;
    border-collapse: collapse;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
}
.og-panel__zoom th {
    text-align: left;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
    padding: 2px 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.og-panel__zoom td {
    padding: 2px 6px;
    color: rgba(255, 255, 255, 0.85);
}
.og-panel__zoom td:first-child {
    color: #f5c14a;
    font-weight: 600;
}
.og-panel__zoom-total td {
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    font-weight: 600;
    color: #fff;
}
.og-panel__zoom-total td:first-child {
    color: #f5c14a;
}
</style>
