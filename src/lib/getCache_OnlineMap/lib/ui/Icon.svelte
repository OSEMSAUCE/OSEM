<!--
  Icon — the one inline line-icon component for the whole app.

  Renders a named glyph from `iconPaths.ts` in a shared 24×24 viewBox with
  stroke="currentColor" and round caps/joins. Colour comes from the parent's
  CSS `color` (currentColor), exactly like the inline <svg>s it replaces.

      <Icon name="search" size={20} />
      <Icon name="pentagon" size={14} stroke={2.2} style="flex-shrink:0" />

  size  → width/height in px (the old svg width/height)
  stroke→ override the icon's canonical stroke width (defaults per-icon)
  class → forwarded to the <svg> (note: a parent's *scoped* CSS class won't
          reach this child svg — express sizing via size/style instead)

  TWO COPIES ON PURPOSE — this one belongs to getCache_OnlineMap and travels
  WITH it when the child is lifted into its own repo. ReTreever has its own at
  $lib/core/icon/.

  It used to be one file in the harness, shared by both sides. RAPPER ends
  that: the harness becomes a thin standalone package a stranger installs, so
  a child cannot reach into a parent that is no longer there. A published
  child must be self-contained, and a third package for one 24x24 icon
  component is not worth the release ceremony.

  Only the icons this map actually draws need to stay in iconPaths.ts here —
  the catalog is shared history, not a shared dependency.
-->
<script lang="ts">
import { ICONS, type IconName } from "./iconPaths";

let {
	name,
	size = 24,
	stroke = undefined,
	fill = "none",
	class: cls = "",
	style = "",
	ariaLabel = undefined,
}: {
	name: IconName;
	size?: number;
	stroke?: number;
	fill?: string;
	class?: string;
	style?: string;
	ariaLabel?: string;
} = $props();

const def = $derived(ICONS[name]);
</script>

<svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    {fill}
    stroke="currentColor"
    stroke-width={stroke ?? def.sw}
    stroke-linecap="round"
    stroke-linejoin="round"
    class={cls}
    {style}
    role={ariaLabel ? "img" : undefined}
    aria-label={ariaLabel}
    aria-hidden={ariaLabel ? undefined : "true"}
>
    <!-- eslint-disable-next-line svelte/no-at-html-tags — static, in-repo icon markup -->
    {@html def.body}
</svg>
