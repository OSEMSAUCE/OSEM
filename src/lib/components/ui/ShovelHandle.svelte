<script lang="ts">
// The shared shovel pull-handle. Used on the Map page (drawer for tools)
// and the GetCache page (drawer for stats). Identical asset, identical
// crop, identical sizing.
//
// Two images, one swap:
//   - shovel-pullBar.webp     — closed / idle
//   - shovel-pullBarFist.webp — being grabbed (mid-drag) or already open
//
// We do NOT overlay a separate fist sprite. The fist is baked into the
// second image so the swap is pixel-stable.
//
// This is a pure presentational component. Drag/tap behaviour lives in
// the parent drawer (drag-to-slide for stats, tap-to-toggle for the map
// drawer — those will be unified later).

type Props = {
    /** True while pointer is down OR the drawer is open — both states show
     *  the fist-on-shovel asset. */
    dragging?: boolean;
    onpointerdown?: (e: PointerEvent) => void;
    onclick?: (e: MouseEvent) => void;
    ariaLabel?: string;
};

let {
    dragging = false,
    onpointerdown,
    onclick,
    ariaLabel = "Pull to open",
}: Props = $props();
</script>

<button
    class="shovel-handle"
    type="button"
    aria-label={ariaLabel}
    {onpointerdown}
    {onclick}
>
    <img
        class="shovel-handle-img"
        src={dragging
            ? "/mobileAssets/shovel-pullBarFist.webp"
            : "/mobileAssets/shovel-pullBar.webp"}
        alt=""
        draggable="false"
    />
</button>

<style>
    .shovel-handle {
        position: relative;
        width: 100%;
        background: transparent;
        border: none;
        padding: 0;
        cursor: grab;
        touch-action: none;
        -webkit-tap-highlight-color: transparent;
        display: flex;
        justify-content: center;
        overflow: visible;
    }
    .shovel-handle::before {
        content: "";
        position: absolute;
        /* Forgiveness padding ABOVE the shovel only — extending the hit
           area downward bled into the action buttons in the drawer body. */
        top: -20px;
        bottom: 0;
        left: 0;
        right: 0;
    }
    .shovel-handle:active {
        cursor: grabbing;
    }
    .shovel-handle-img {
        width: 88%;
        max-width: 23.75rem;
        height: auto;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
    }
    @container (min-width: 700px) {
        .shovel-handle-img {
            max-width: 25.25rem;
        }
    }
</style>
