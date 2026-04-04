<script lang="ts">
	type Props = {
		value: number;
		height?: string;
	};

	let { value, height = "2rem" }: Props = $props();

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

	function formatMoney(val: number): string[] {
		const formatted = val.toFixed(2);
		const withCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return ["$", ...withCommas.split("")];
	}

	const chars = $derived(formatMoney(value));
</script>

<span class="money-sprite" style="--sprite-height: {height};">
	{#each chars as char}
		<img
			src="/mobileAssets/numbers/{charToFile[char]}"
			alt={char}
			class="money-sprite-char"
		/>
	{/each}
</span>

<style>
	.money-sprite {
		display: inline-flex;
		align-items: baseline;
	}

	.money-sprite-char {
		height: var(--sprite-height);
		width: auto;
	}
</style>
