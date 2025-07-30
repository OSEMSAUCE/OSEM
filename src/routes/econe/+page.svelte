<script lang="ts">
  import { onMount } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { Protocol } from 'pmtiles';
  // import map from './map.ts';
  const protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);

  let mapContainer: HTMLDivElement;
  const tileUrl = 'http://localhost:8080/data/openmaptiles/{z}/{x}/{y}.pbf';

  onMount(() => {
    const map = new maplibregl.Map({
      container: mapContainer,
      style: '/style.json', // Make sure this matches your static file path
      center: [-120, 45],   // Set your desired center
      zoom: 4               // Set your desired zoom
    });

    // Add any other map setup here (controls, layers, etc.)
    return () => map.remove();
  });
</script>


  
  <h1>Econeomics</h1>
<div style="display: flex; gap: 2rem; align-items: flex-start;">
  <div style="flex: 1; min-width: 400px;">
    <div bind:this={mapContainer} style="width: 100%; height: 80vh;"></div>
  </div>
  <div style="flex: 1; min-width: 400px;">
    <h2>Tile Debugger</h2>
    <p>Sample tile: <a href={`${tileUrl.replace('{z}/{x}/{y}', '7/9268/3575')}`} target="_blank">View PBF</a></p>
    <iframe 
      src="http://localhost:8080/styles/basic/#7/20.5/41.3" 
      width="100%" 
      height="400"
    />
  </div>
</div>