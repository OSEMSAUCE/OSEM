import maplibregl from 'maplibre-gl';
import CompassControl from '@mapbox-controls/compass';
import '@mapbox-controls/compass/src/index.css';

const map = new maplibregl.Map({
  container: 'map',
  style: './style.json',
  center: [-122.447303, 37.753574],
  zoom: 12
});

map.addControl(new CompassControl(), 'top-right');