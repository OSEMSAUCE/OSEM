<script>
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';
  
  let mapContainer;
  
  onMount(() => {
    // Set token directly
    mapboxgl.accessToken = 'REMOVEDbWRtOXN4bXkwMmhwMmlwa2Z0aHdkaTA4In0.ZQ4nyAf69HoT_5gZ4rPEaQ';
    
    // Create map
    const map = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.5, 40],
      zoom: 9
    });
    
    // Add navigation control
    map.addControl(new mapboxgl.NavigationControl());
    
    // Cleanup
    return () => map.remove();
  });
</script>

<h1>Mapbox Test Page</h1>

<div bind:this={mapContainer} style="width: 100%; height: 500px;"></div>

<style>
  div {
    margin: 20px 0;
    border: 1px solid #ccc;
  }
</style>
