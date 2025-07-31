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

<section>
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




<style>
	:root {
		--logo-size: 8rem;
	}
	section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 0.6;
  margin-top: 1;
  padding-top: 0;
}
h1 {
  width: 100%;
  margin-top: 0;
  padding-top: 0;
}

	h2 {
		font-size: 2.5rem;
		margin-top: 1.5rem;
		font-weight: 400;
	}
	h1 {
		width: 100%;
	}

	.prtHero {
		display: block;
		width: 100%;
		max-width: 65rem;
		margin: 0 auto;
		transform: scaleX(1.2);
		/* Optional: to keep the center aligned after stretching */
		transform-origin: center;
	}
	.logo-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 0.5rem;
		font-size: 2rem;
	}

	.favicon {
		width: var(--logo-size);
		height: var(--logo-size);
		display: inline-block;
	}

	.logo-text {
		font-weight: bold;
		display: flex;
		font-size: var(--logo-size);
		align-items: center;
		gap: 0.5rem;
	}

	.fade-bottom {
		/* For most browsers */
		mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
		/* For Safari */
		-webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
	}
</style>
