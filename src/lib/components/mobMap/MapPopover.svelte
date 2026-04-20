<script lang="ts">
import type { Snippet } from "svelte";

let {
    pixel,
    containerWidth,
    containerHeight,
    children,
}: {
    pixel: { x: number; y: number };
    containerWidth: number;
    containerHeight: number;
    children: Snippet;
} = $props();

let el: HTMLDivElement | undefined = $state();
let measured = $state({ w: 140, h: 48 });

$effect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
        const r = entry.contentRect;
        if (r.width > 0 && r.height > 0) {
            measured = { w: Math.ceil(r.width), h: Math.ceil(r.height) };
        }
    });
    ro.observe(el);
    return () => ro.disconnect();
});

let style = $derived.by(() => {
    const { x, y } = pixel;
    const OFFSET = 20;
    const PW = measured.w + 4;
    const PH = measured.h + 4;
    let left = x + OFFSET;
    let top = y - OFFSET - PH;
    if (left + PW > containerWidth - 10) left = x - OFFSET - PW;
    if (top < 10) top = y + OFFSET;
    if (top + PH > containerHeight - 10) top = y - OFFSET - PH;
    return `left:${left}px;top:${top}px`;
});
</script>

<div class="map-popover" {style} bind:this={el}>
    {@render children()}
</div>

<style>
    .map-popover {
        position: absolute;
        z-index: 30;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        padding: 0.375rem;
        background: rgba(0, 0, 0, 0.88);
        border-radius: 0.5rem;
        backdrop-filter: blur(8px);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
    }
</style>
