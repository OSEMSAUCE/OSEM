<script lang="ts" module>
import { SvelteSet } from "svelte/reactivity";

const charToFile: Record<string, string> = {
	$: "$.webp",
	"0": "0.webp",
	"1": "1.webp",
	"2": "2.webp",
	"3": "3.webp",
	"4": "4.webp",
	"5": "5.webp",
	"6": "6.webp",
	"7": "7.webp",
	"8": "8.webp",
	"9": "9.webp",
	",": "comma.webp",
	".": "period.webp",
};

// Which glyph files are KNOWN to be in the browser (loaded at least once this
// session). A number is only shown once every one of its glyphs is in this
// set — on a slow network Svelte reuses the <img> elements and the browser
// keeps painting the OLD sprite while the new src downloads, so an un-gated
// value change can display a different number than the value (100.0 rendered
// as 000.0). Hidden-then-correct is honest; stale digits are a lie.
const loadedGlyphs = new SvelteSet<string>();

// Warm every glyph once per session at module load (≈140 KB total) so by the
// time any readout changes value the sprites are already in the HTTP cache
// and the gate above never visibly holds a number back.
if (typeof Image !== "undefined") {
	for (const file of Object.values(charToFile)) {
		const img = new Image();
		img.onload = () => loadedGlyphs.add(file);
		// A failed glyph still un-gates the number: the browser renders its
		// broken-image/alt state, which is a LOUD failure — better than a
		// readout that stays blank forever or silently shows wrong digits.
		img.onerror = () => loadedGlyphs.add(file);
		img.src = `/mobileAssets/numbers/${file}`;
	}
}
</script>

<script lang="ts">
type Props = {
	value: number;
	height?: string;
	id?: string;
	decimals?: number;
	// money=true (default) renders a "$" prefix + thousands separators.
	// money=false renders a plain integer/number (no "$") — for plain counts
	// like the Quality 704 missed-spots digits.
	money?: boolean;
};

let { value, height = "2rem", id, decimals = 2, money = true }: Props = $props();

function formatChars(val: number, dec: number, withDollar: boolean): string[] {
	const formatted = dec > 0 ? val.toFixed(dec) : Math.round(val).toString();
	const withCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	const parts = withCommas.split("");
	return withDollar ? ["$", ...parts] : parts;
}

const chars = $derived(formatChars(value, decimals, money));
const ready = $derived(chars.every((c) => loadedGlyphs.has(charToFile[c])));
</script>

<span {id} class="retree-numbers" class:retree-numbers--pending={!ready} style="--sprite-height: {height};">
	{#each chars as char}
		<img
			src="/mobileAssets/numbers/{charToFile[char]}"
			alt={char}
			class="retree-numbers-char"
		/>
	{/each}
</span>

<style>
	.retree-numbers {
		display: inline-flex;
		align-items: baseline;
	}

	/* Glyphs still fetching — hide the whole number rather than show a partial
	   or stale one. visibility (not display) keeps the layout box. */
	.retree-numbers--pending {
		visibility: hidden;
	}

	.retree-numbers-char {
		height: var(--sprite-height);
		width: auto;
	}
</style>
