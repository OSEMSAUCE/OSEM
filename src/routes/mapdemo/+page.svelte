<script lang="ts">
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';

  // Use only the env variable (never expose secrets)
  const mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;
  let mapContainer: HTMLDivElement;

  onMount(() => {
    if (!mapboxAccessToken) {
      console.error('Mapbox access token is required');
      return;
    }
    mapboxgl.accessToken = mapboxAccessToken;
    const map = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.5, 40],
      zoom: 9
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    return () => map.remove();
  });
</script>

<h1>Mapbox Demo</h1>
<div bind:this={mapContainer} style="width: 100%; height: 500px; border: 1px solid #ccc; margin: 2rem 0;"></div>
