# econeomics
Best seedzone map app ever. 

🌲 Seed Zone Explorer

A lightweight open-source map app to explore seed zones, ecological restoration areas, and elevation overlays across North America. Built using fully open components — no Mapbox, no vendor lock-in.

Inspired by tools like:
	•	[Tree-Nation](https://tree-nation.com/projects/plant-to-stop-poverty/updates)
	•	[Restor.eco](https://restor.eco)
	•	[Grid Atlas](https://www.gridatlas.com/map/places)

This project uses:
	•	[OpenMapTiles](https://openmaptiles.org) – generate vector tiles for base layers
	•	[Maputnik](https://maputnik.com) – visually style the map (rivers, roads, landuse, terrain)
	•	[PMTiles](https://github.com/protomaps/pmtiles) – package and serve tile layers (e.g., base + seed zone overlays)
	•	[MapLibre GL JS](https://maplibre.org) – interactive rendering in the browser

🔍 What It Shows
	•	Polygons for seed zones across North America (ecoregions, elevation bands, climate zones, etc.)
	•	Overlays for restoration areas and projects
	•	Potential to integrate real-time or public datasets via Supabase (optional)

🧩 Stack Overview
	•	Use the stack described in the [this article by Kevin Schaul](https://kschaul.com/post/2023/02/16/how-the-post-is-replacing-mapbox-with-open-source-solutions)
	•	Map style lives in style.json, created with Maputnik
	•	Map tiles are served via .pmtiles archive (hosted statically or with pmtiles-serve)
	•	Frontend is plain HTML + JS using MapLibre GL JS

## Dev Guardrails
- Use `npx serve .` for local dev server, NOT Python http.server
- Always use MapLibre, not Mapbox GL JS
- Always use PMTiles, not MBTiles

⸻

🛠️ Setup Instructions

1. Get Vector Tiles

Option A (Download): https://openmaptiles.org/downloads/

Option B (Build Yourself):

```git clone https://github.com/openmaptiles/openmaptiles.git
cd openmaptiles
make
```

Convert MBTiles to PMTiles:

```npm install -g @protomaps/pmtiles
pmtiles convert data.mbtiles data.pmtiles
```

2. Style the Map

```npx maputnik --watch --file style.json
```

Visit http://localhost:8000 to visually build your map style. Export when ready.

3. Host Tiles (local dev)

```go install github.com/protomaps/pmtiles/cmd/serve@latest
pmtiles-serve --file data.pmtiles
```

4. View Map in Browser

Ensure your style.json references the PMTiles source and load it with MapLibre:

```const map = new maplibregl.Map({
  container: 'map',
  style: './style.json',
  center: [-100, 50],
  zoom: 4
});
```

⸻
	
🔄 Optional Integrations
	•	Supabase for dynamic overlays, project metadata, filters
	•	Deck.gl or Tangram for extra visual layers
	•	Offline use with bundled PMTiles

⸻

Let us know if you want to add your region’s seed zone layer — or customize styling for your terrain data.
