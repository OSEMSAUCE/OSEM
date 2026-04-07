<script lang="ts">
	type Props = {
		value: number;
		height?: string;
		id?: string;
		decimals?: number;
	};

	let { value, height = "2rem", id, decimals = 2 }: Props = $props();

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

	function formatMoney(val: number, dec: number): string[] {
		const formatted =
			dec > 0 ? val.toFixed(dec) : Math.round(val).toString();
		const withCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return ["$", ...withCommas.split("")];
	}

	const chars = $derived(formatMoney(value, decimals));
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
