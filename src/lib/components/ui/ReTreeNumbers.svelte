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

function formatChars(val: number, dec: number, withDollar: boolean): string[] {
    const formatted = dec > 0 ? val.toFixed(dec) : Math.round(val).toString();
    const withCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const parts = withCommas.split("");
    return withDollar ? ["$", ...parts] : parts;
}

const chars = $derived(formatChars(value, decimals, money));
</script>

<span {id} class="retree-numbers" style="--sprite-height: {height};">
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

	.retree-numbers-char {
		height: var(--sprite-height);
		width: auto;
	}
</style>
