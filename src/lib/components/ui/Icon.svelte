<!--
  Icon — the one inline line-icon component for the whole app.

  Renders a named glyph from `iconPaths.ts` in a shared 24×24 viewBox with
  stroke="currentColor" and round caps/joins. Colour comes from the parent's
  CSS `color` (currentColor), exactly like the inline <svg>s it replaces.

  Lives in OSEM (UI-only, no store/API) so BOTH open OSEM map components and
  proprietary ReTreever components can share it — OSEM may not import from
  $lib/mobile, so this is the only home that lets both sides dedupe.

      <Icon name="search" size={20} />
      <Icon name="pentagon" size={14} stroke={2.2} style="flex-shrink:0" />

  size  → width/height in px (the old svg width/height)
  stroke→ override the icon's canonical stroke width (defaults per-icon)
  class → forwarded to the <svg> (note: a parent's *scoped* CSS class won't
          reach this child svg — express sizing via size/style instead)
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
