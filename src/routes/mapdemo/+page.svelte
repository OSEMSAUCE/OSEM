<script lang="ts">
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';

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

<div class="viewport-layout">
  <header class="demo-header">
    <span>Econe Demo</span>
  </header>

  <main class="demo-map-area">
    <div bind:this={mapContainer} class="mapbox-map"></div>
  </main>

  <footer class="demo-footer">
    <!-- Controls panel (blank for now) -->
  </footer>
</div>

<style>
  html, body, .viewport-layout {
    height: 100%;
    margin: 0;
    padding: 0;
  }
  .viewport-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }
  .demo-header {
    min-height: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 2rem;
    background: #fff;
    font-size: 1.2rem;
    font-weight: 600;
    border-bottom: 1px solid #e2e2e2;
    z-index: 2;
  }
  .demo-map-area {
    flex: 1 1 auto;
    position: relative;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    background: #eaf0fa;
  }
  .mapbox-map {
    position: absolute;
    left: 0; right: 0; top: 0; bottom: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .demo-footer {
    min-height: 56px;
    height: 56px;
    background: #1a237e;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 500;
    box-shadow: 0 -2px 8px rgba(30,40,80,0.08);
    z-index: 2;
    border-top: 1px solid #0d1331;
  }
</style>
