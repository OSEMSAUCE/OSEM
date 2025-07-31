<script lang="ts">
	import Counter from './Counter.svelte';
	import welcome from '$lib/images/2025-07-30_Prt.webp';
	import welcomeFallback from '$lib/images/2025-07-30_Prt.jpg';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { Protocol } from 'pmtiles';
	const protocol = new Protocol();
	maplibregl.addProtocol('pmtiles', protocol.tile);
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<h1>
		<span class="welcome">
			<picture>
				<source srcset={welcome} type="image/webp" class="fade-bottom" />
				<img src={welcomeFallback} alt="Welcome" class="fade-bottom" />
			</picture>
		</span>

		<br />Fir Sure 🌲️🌲️🌳️
	</h1>

	<h2>
		try editing <strong>src/routes/+page.svelte</strong>
	</h2>

	<!-- <Counter /> -->
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}
	.welcome {
	display: block;
	width: 100%;
	max-width: 80rem;
	margin: 0 auto;
}

.fade-bottom {
  /* For most browsers */
  mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
  /* For Safari */
  -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
}

.welcome picture,
.welcome img {
	width: 100%;
	height: auto;
	display: block;
	object-fit: contain;
}
</style>
