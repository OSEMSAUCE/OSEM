<script lang="ts">
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';

  // Props
  export let accessToken = ''; // Mapbox access token
  export let mapStyle = 'mapbox://styles/mapbox/streets-v12'; // Default style
  export let center: [number, number] = [-74.5, 40]; // Default center (longitude, latitude)
  export let zoom = 9; // Default zoom level
  export let interactive = true; // Whether the map is interactive
  export let height = '400px'; // Default height
  export let width = '100%'; // Default width

  // Container for the map
  let mapContainer: HTMLDivElement;
  let map: mapboxgl.Map;

  onMount(() => {a
    if (!accessToken) {
      console.error('Mapbox access token is required');
      return;
    }

    // Set the access token
    mapboxgl.accessToken = accessToken;

    // Initialize the map
    map = new mapboxgl.Map({
      container: mapContainer,
      style: mapStyle,
      center: center,
      zoom: zoom,
      interactive: interactive
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Clean up on unmount
    return () => {
      if (map) map.remove();
    };
  });

  // Function to expose the map instance to parent components
  export function getMap() {
    return map;
  }
</script>

<div bind:this={mapContainer} style="width: {width}; height: {height};"></div>

<style>
  /* Ensure the container takes up the specified dimensions */
  div {
    position: relative;
  }
</style>