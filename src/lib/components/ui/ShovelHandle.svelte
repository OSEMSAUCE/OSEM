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
// This is a pure presentational component. The DRAG is owned by the parent
// drawer's grab band ($harness/components/ui/shovelGrabBand).
//
// ── THE SHOVEL IS A HANDLE, NOT A BUTTON ───────────────────────────────────
// You swipe it up. A pointer TAP must do nothing — it used to toggle the
// drawer, which made a grab handle behave like a button and fired on every
// stray brush of the shovel art. There is deliberately no `onclick` prop:
// the toggle-on-tap is gone at the source, not suppressed per-drawer.
//
// `onActivate` is the KEYBOARD affordance only. Dragging is pointer-only, so
// without it a keyboard/screen-reader user would have no way to open the
// drawer at all. It fires on Enter/Space and never on a pointer tap.

type Props = {
    /** True while pointer is down OR the drawer is open — both states show
     *  the fist-on-shovel asset. */
    dragging?: boolean;
    /** Light up the gold glow ball behind the handle. Only true during the
     *  auto-peek animation. */
    glow?: boolean;
    /** KEYBOARD ONLY (Enter/Space). Never fires from a pointer tap — see the
     *  note above. Omit to make the handle purely drag-operated. */
    onActivate?: () => void;
    ariaLabel?: string;
};

let {
    dragging = false,
    glow = false,
    onActivate,
    ariaLabel = "Pull to open",
}: Props = $props();

function onKeyDown(e: KeyboardEvent) {
    if (!onActivate) return;
    if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
    // Space would otherwise scroll the page behind the drawer.
    e.preventDefault();
    onActivate();
}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<div
    class="shovel-handle"
    role={onActivate ? "button" : "presentation"}
    tabindex={onActivate ? 0 : -1}
    aria-label={onActivate ? ariaLabel : undefined}
    onkeydown={onKeyDown}
>
    <!-- Glowing gold ball behind the center of the handle (same gold as the
         bags glow). Bottom z-index — shines through the shovel art. -->
    <span class="shovel-glow" class:shovel-glow--on={glow} aria-hidden="true"></span>
    <img
        class="shovel-handle-img"
        src={dragging
            ? "/mobileAssets/shovel-pullBarFist.webp"
            : "/mobileAssets/shovel-pullBar.webp"}
        alt=""
        draggable="false"
    />
</div>

<style>
    .shovel-handle {
        position: relative;
        width: 100%;
        /* grab, never pointer — this is a thing you pull, not a thing you
           click. The cursor is the honest signal for that. */
        cursor: grab;
        touch-action: none;
        -webkit-tap-highlight-color: transparent;
        display: flex;
        justify-content: center;
        overflow: visible;
        /* Lift the pull-handle up — it was reading too low on every
           drawer that uses it. transform = no layout shift to the body. */
        transform: translateY(-6px);
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
    /* ───────────────────────────────────────────────────────────────────
       SHOVEL GLOW BALL — adjust SIZE here (--shovel-glow-size). 40×40 now.
       Gold matches the bags glow: rgba(234, 179, 8, …).
       ─────────────────────────────────────────────────────────────────── */
    .shovel-glow {
        --shovel-glow-size: 70px; /* ← SIZE KNOB (width & height of the ball) */
        position: absolute;
        top: 50%;
        left: 50%;
        width: var(--shovel-glow-size);
        height: var(--shovel-glow-size);
        transform: translate(-50%, -50%);
        border-radius: 50%;
        z-index: 0; /* behind the shovel image */
        pointer-events: none;
        background: radial-gradient(
            circle,
            rgba(234, 179, 8, 0.9) 0%,
            rgba(234, 179, 8, 0.55) 35%,
            rgba(234, 179, 8, 0.22) 60%,
            rgba(234, 179, 8, 0) 80%
        );
        filter: blur(2px);
        /* OFF by default — only lights up during the auto-peek (glow prop). */
        opacity: 0;
        transition: opacity 200ms ease;
    }
    .shovel-glow--on {
        opacity: 1;
    }
    .shovel-handle-img {
        position: relative;
        z-index: 1; /* sit above the glow ball */
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
