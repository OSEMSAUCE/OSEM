<script lang="ts">
	import { compactGlobeOptions } from "../../lib/components/map/config";
	import MapComponent from "../../lib/components/map/Map.svelte";
</script>

<div class="h-screen w-full">
	<h1 class="text-2xl font-bold p-4">Test Map Component</h1>
	<div class="h-96 w-full border-2 border-gray-300">
		<MapComponent
			options={{
				...compactGlobeOptions,
				style: "mapbox://styles/mapbox/satellite-v9",
				loadMarkers: true,
				apiBaseUrl: import.meta.env.PUBLIC_API_URL?.replace(/\/$/, ""),
				rotationSpeed: 2.5,
				compact: true,
				initialZoom: 2,
				transparentBackground: true,
			}}
			containerClass="w-full h-full"
		/>
	</div>
</div>
