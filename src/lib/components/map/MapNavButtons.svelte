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

<div class="map-nav-buttons mapboxgl-ctrl mapboxgl-ctrl-group">
	<button class="map-nav-button" class:active={isWhoMap} on:click={goToWho} aria-label="Who map">
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
		aria-label="Where map"
	>
		<img
			src="/mobileAssets/tree icon nick font_gold.png"
			alt=""
			width="28"
			height="28"
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
		z-index: 1;
	}

	/* .map-nav-button sizing, bg, border, hover all inherit from global
	   .mapboxgl-ctrl-group button rules in OSEM/src/lib/styles/map.css */
	.map-nav-button {
		cursor: pointer;
	}

	.map-nav-button.active {
		background-color: rgba(255, 215, 0, 0.25) !important;
	}

	.map-nav-button img {
		display: block;
	}
</style>
