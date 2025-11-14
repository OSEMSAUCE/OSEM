<script lang="ts">
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

<section class="home-section">
	<h1>
		<span class="welcome">
			<picture>
				<source srcset={welcome} type="image/webp" class="prtHero fade-bottom" />
				<img src={welcomeFallback} alt="prtHero" class="prtHero fade-bottom" />
			</picture>
		</span>
		<div class="logo-row">
			<img src="/favicon.svg" alt="favicon" class="favicon" />
			<span class="logo-text"> Fir Sure </span>
			<img src="/favicon.svg" alt="favicon" class="favicon" />
		</div>
	</h1>
	

	<h2>
		Track trees fir real 🌲️🌲️🌳️
	</h2>
</section>
