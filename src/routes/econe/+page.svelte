<script lang="ts">
    import { onMount } from 'svelte';
    import maplibregl from 'maplibre-gl';
    import 'maplibre-gl/dist/maplibre-gl.css';
    import { Protocol } from 'pmtiles';
    // import map from './map.ts';
	const protocol = new Protocol();
	maplibregl.addProtocol('pmtiles', protocol.tile);
  
    let mapContainer: HTMLDivElement;
  
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
  <div bind:this={mapContainer} style="width: 100vw; height: 100vh;"></div>