<script>
	import selfie from '$lib/images/ChrisConesSelfie.jpg';
</script>

<svelte:head>
	<title>About</title>
	<meta name="description" content="About this app" />
</svelte:head>

<div class="text-column">
	<h1>About FirSure</h1>

	<p>
		<strong>FirSure</strong> is an map and data app designed for tracking trees seeds and tree genetics for industrial nursery seedling production. Our goal is to make it easy to explore, track, and understand seed zones and tree genetics across North America.
	</p>

	<p>
		With FirSure, you can:
	</p>
	<ul>
		<li>Visualize seed zones, environmental regions, and elevation on an interactive map</li>
		<li>Leverage the API to produce reports and validate nursery data accross various platforms.</li>
		<li>Track trees and their genetic origins for better reforestation and nursery planning</li>
		<li>Overlay restoration areas, project sites, and custom data</li>
		<li>Integrate tree and nursery records with real-time or public datasets</li>
	</ul>


	<p>
		Whether you’re a forester, nursery manager, restoration practitioner, or just passionate about trees, FirSure helps you make informed decisions about planting, sourcing, and conserving genetic diversity.
	</p>
	<img class="selfie" src={selfie} alt="Chris Cones Selfie" />	<p>
		Inspired by the best in reforestation apps, and always improving. Have ideas or want to contribute? <a href="mailto:info@groundtruth.app">Contact us!</a>
	</p>
</div>

<style>
	.text-column {
		max-width: 800px;
		margin: 0 auto;
	}
	.selfie {
		display: block;
		max-width: 20rem;
		height: auto;
		margin: 1rem auto;
	}
</style>
