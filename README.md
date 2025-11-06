# FirSure

🌲 Seed Zone Explorer

An open-source web app for exploring seed zones, ecological restoration areas, and ecoregion overlays across North America.

Inspired by tools like [Tree-Nation](https://tree-nation.com/projects/plant-to-stop-poverty/updates), [Restor.eco](https://restor.eco), and [Grid Atlas](https://www.gridatlas.com/map/places).

## Current Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/) (TypeScript)
- **Mapping:** [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) v3.14
- **Map Controls:**
  - [mapbox-gl-opacity](https://github.com/dayjournal/mapbox-gl-opacity) for layer visibility/opacity
  - [@mapbox-controls/styles](https://github.com/bravecow/mapbox-gl-controls) for style switching
- **Data Format:** GeoJSON polygon layers
- **Deployment:** [Vercel](https://vercel.com) via `@sveltejs/adapter-vercel`

## What It Shows

The main map at [/firsure](src/routes/firsure/+page.svelte) displays:
- **Restoration Polygons** – restoration project areas (teal)
- **US Eco Regions** – ecological zones across the US (purple)
- **BC Test Layer** – sample British Columbia data (orange)

Interactive features:
- Style switching (Streets ↔ Satellite)
- Layer opacity controls with checkboxes
- Zoom and navigation controls

## Local Development

### Prerequisites

- Node.js (v18 or higher recommended)
- A Mapbox access token ([get one free here](https://account.mapbox.com/access-tokens/))

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Create a `.env` file in the project root:
   ```bash
   VITE_MAPBOX_TOKEN="your-mapbox-token-here"
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:5173](http://localhost:5173)

4. **View the map:**

   Navigate to [http://localhost:5173/firsure](http://localhost:5173/firsure)

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type-check with svelte-check
npm run lint         # Run ESLint and Prettier
npm run format       # Format code with Prettier
```

## Project Structure

```
/firsure/
├── src/
│   ├── routes/
│   │   ├── firsure/          # Main map application
│   │   ├── about/            # About page
│   │   ├── maptest/          # Testing route
│   │   └── +page.svelte      # Home page
│   ├── lib/
│   │   └── components/       # Reusable Svelte components
│   └── app.css               # Global styles
├── static/
│   └── polygons/             # GeoJSON data files
│       ├── restorPoly2.geojson
│       ├── usEco.geojson
│       └── bc_test_poly.geojson
├── .env                      # Environment variables (gitignored)
└── package.json
```

## Adding Your Own Data

To add custom seed zone or restoration layers:

1. Place your GeoJSON file in `static/polygons/`
2. Update [src/routes/firsure/+page.svelte](src/routes/firsure/+page.svelte) to load and display it
3. Add it to the opacity control for layer visibility

## Deployment

The project is configured for Vercel deployment:

```bash
npm run build
```

Vercel will automatically deploy from your Git repository. Ensure the `VITE_MAPBOX_TOKEN` environment variable is set in your Vercel project settings.

## Future Plans

We may eventually migrate to a fully open-source mapping stack using:
- [MapLibre GL JS](https://maplibre.org) – open alternative to Mapbox
- [PMTiles](https://github.com/protomaps/pmtiles) – cloud-optimized tile archives
- [OpenMapTiles](https://openmaptiles.org) – self-hosted vector tiles
- [Maputnik](https://maputnik.com) – visual style editor

See [this article by Kevin Schaul](https://kschaul.com/post/2023/02/16/how-the-post-is-replacing-mapbox-with-open-source-solutions/) for the full workflow.

---

**Questions?** Open an issue or reach out if you'd like to contribute seed zone data for your region!
