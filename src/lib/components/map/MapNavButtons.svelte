<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";

	// Determine active state from current route
	$: isWhoMap = $page.url.pathname === "/who/map";
	$: isWhereMap = $page.url.pathname === "/where";

	function goToWho() {
		goto("/who/map");
	}

	function goToWhat() {
		goto("/where");
	}
</script>

<div class="map-nav-buttons">
	<button class="map-nav-button" class:active={isWhoMap} on:click={goToWho}>
		<!-- People icon -->
		<svg
			width="28"
			height="28"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	</button>
	<button
		class="map-nav-button"
		class:active={isWhereMap}
		on:click={goToWhat}
	>
		<img
			src="/arc/logos/Ultimate shovel icon small.webp"
			alt="What"
			width="48"
			height="48"
		/>
	</button>
</div>

<style>
	.map-nav-buttons {
		position: absolute;
		top: 140px;
		right: 10px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		z-index: 1;
	}

	.map-nav-button {
		width: 56px;
		height: 56px;
		background: #888;
		border: 3px solid #222;
		border-radius: 6px;
		cursor: pointer;
		color: #333;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.map-nav-button:hover {
		background: #999;
	}

	.map-nav-button.active {
		background: #888;
		border-color: #fff;
		box-shadow: 0 0 12px 4px rgba(255, 200, 50, 0.6);
	}
</style>
