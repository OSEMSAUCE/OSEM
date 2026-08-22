<script lang="ts">
/**
 * THE PIN LIBRARY — the map's own pin artwork, as one reusable unit.
 *
 * Lives in OSEM because it is part of the MAP, not part of the app's business
 * logic: picking which artwork a dropped feature wears needs no database, no
 * auth and no inbox types. A contractor working on the offline map gets the
 * whole library with the map.
 *
 * ⚠️ WHY NOT `import { PIN_ICONS } from icons.ts`: ReTreever's icons.ts reaches
 * into `$lib/mobile/components/inboxTypes`, which does not exist in an OSEM
 * clone. So the TABLE is restated here, against the same artwork files.
 *
 * KEEP IN SYNC BY NAME. `key` is the app's PinKey — the string a feature is
 * actually saved with — so a pin chosen here names the same thing the app
 * would name. Add a pin to icons.ts, add the row here.
 */

export type DebugPin = { key: string; file: string };

/** Artwork pins — the library's top (untitled) section. Order matches
 *  icons.ts: the default "pin" sits LAST, because every feature starts
 *  wearing it and the library leads with the interesting ones. */
export const GLYPH_PINS: readonly DebugPin[] = [
	{ key: "truck", file: "pin_truck_sm.webp" },
	{ key: "cache", file: "pin_cache_sm.webp" },
	{ key: "atv", file: "pin_atv_sm.webp" },
	{ key: "bear", file: "pin_bear_sm.webp" },
	{ key: "heli", file: "pin_helicopter_sm.webp" },
	{ key: "crossing", file: "pin_crossing_good_sm.webp" },
	{ key: "noCrossing", file: "pin_crossing_bad_sm.webp" },
	{ key: "warning", file: "pin_warn_sm.webp" },
	{ key: "muster", file: "pin_muster_point_sm.webp" },
	{ key: "home", file: "pin_home_sm.webp" },
	{ key: "pin", file: "pin_default_sm.webp" },
];

/** Rainbow colour pins — the library's "RAINBOW" section. */
export const RAINBOW_PINS: readonly DebugPin[] = [
	{ key: "red", file: "1pin_red_sm.webp" },
	{ key: "orange", file: "2pin_orange_sm.webp" },
	{ key: "yellow", file: "3pin_yellow_sm.webp" },
	{ key: "green", file: "4pin_green_sm.webp" },
	{ key: "blue", file: "5pin_blue_sm.webp" },
	{ key: "purple", file: "6pin_purple_sm.webp" },
];

/** Every pin, glyphs then rainbow — what a marker looks a key up in. */
export const PIN_LIBRARY: readonly DebugPin[] = [...GLYPH_PINS, ...RAINBOW_PINS];

export const PIN_DIR = "/mobileAssets/pin_library_small";

/** Resolve a pin key to its artwork URL. Unknown keys fall back to the
 *  default pin rather than rendering a broken image. */
export function pinSrc(key: string): string {
	const found = PIN_LIBRARY.find((p) => p.key === key) ?? PIN_LIBRARY[10];
	return `${PIN_DIR}/${found.file}`;
}
</script>

<script lang="ts">
let {
	selected = $bindable("pin"),
	title = "PINS — double-tap or long-press the map",
	note = "",
}: {
	/** The chosen pin key. Bindable, so the host reads it without a callback. */
	selected?: string;
	title?: string;
	/** Optional line under the grid — e.g. a dropped-pin count. */
	note?: string;
} = $props();
</script>

<div class="pin-lib">
	<div class="pin-title">{title}</div>
	<!-- Two sections, same split (and same order) as the app's own PIN
	     LIBRARY: artwork glyphs first, untitled, then RAINBOW. -->
	<div class="pin-grid">
		{#each GLYPH_PINS as p (p.key)}
			<button
				class="pin-btn"
				class:sel={selected === p.key}
				title={p.key}
				onclick={() => (selected = p.key)}
			>
				<img src="{PIN_DIR}/{p.file}" alt={p.key} />
			</button>
		{/each}
	</div>
	<div class="pin-subtitle">RAINBOW</div>
	<div class="pin-grid">
		{#each RAINBOW_PINS as p (p.key)}
			<button
				class="pin-btn"
				class:sel={selected === p.key}
				title={p.key}
				onclick={() => (selected = p.key)}
			>
				<img src="{PIN_DIR}/{p.file}" alt={p.key} />
			</button>
		{/each}
	</div>
	{#if note}
		<div class="pin-note">{note}</div>
	{/if}
</div>

<style>
.pin-lib {
	font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
}
.pin-title {
	color: #e8b84b;
	letter-spacing: 0.04em;
	margin-bottom: 0.4rem;
}
.pin-subtitle {
	color: #7a7568;
	letter-spacing: 0.08em;
	margin-bottom: 0.3rem;
}
.pin-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem;
	margin-bottom: 0.5rem;
}
.pin-btn {
	background: none;
	border: 1px solid transparent;
	border-radius: 8px;
	padding: 2px;
	cursor: pointer;
	line-height: 0;
}
.pin-btn.sel {
	border-color: #e8b84b;
	background: #ffd24a1a;
}
.pin-btn img {
	width: 30px;
	height: 30px;
	object-fit: contain;
}
.pin-note {
	color: #8f8a76;
	margin-top: 0.2rem;
}
</style>
