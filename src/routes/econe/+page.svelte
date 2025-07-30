<script lang="ts">
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';
  
  // Using Mapbox public token from environment variable
  const mapboxAccessToken = import.meta.env.VITE_MAPBOX_DEFAULT_PUBLIC_TOKEN;
  const tileUrl = 'http://localhost:3000';
  
  // Map container reference
  let mapContainer: HTMLDivElement;
  
  onMount(() => {
    // Set the token directly
    mapboxgl.accessToken = mapboxAccessToken;
    
    // Create the map
    const map = new mapboxgl.Map({
      
      container: mapContainer,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-120, 45],
      zoom: 4
    });
    
    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Clean up on unmount
    return () => {
      map.remove();
    };
  });
</script>


  
  <h1>Econeomics</h1>
<div style="display: flex; gap: 2rem; align-items: flex-start;">
  <div style="flex: 1; min-width: 400px;">
    <!-- Map moved to #map div as requested -->
  </div>

<Map />

  <div id="map">
    <div bind:this={mapContainer} style="width: 100%; height: 80vh;"></div>
  </div>
  

  <div style="flex: 1; min-width: 400px;">
    
    <h2>Tile Debugger</h2>
    <p>Sample tile: <a href={`${tileUrl.replace('{z}/{x}/{y}', '7/9268/3575')}`} target="_blank">View PBF</a></p>
    <iframe 
      src="http://localhost:3000/styles/basic/#7/20.5/41.3" 
      width="100%" 
      height="400"
    />
  </div>
</div>