<script lang="ts">
  import Map from '$lib/components/map.svelte';
  
  // You'll need to replace this with your actual Mapbox access token
  const mapboxAccessToken = ''; // Add your Mapbox access token here
  const tileUrl = 'http://localhost:3000';
  
  // Map configuration
  const mapCenter: [number, number] = [-120, 45];
  const mapZoom = 4;
</script>


  
  <h1>Econeomics</h1>
<div style="display: flex; gap: 2rem; align-items: flex-start;">
  <div style="flex: 1; min-width: 400px;">
    <Map 
      accessToken={mapboxAccessToken}
      center={mapCenter}
      zoom={mapZoom}
      height="80vh"
      width="100%"
    />
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