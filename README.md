# OSEM 🌍

**Open-Source Environmental Mapping** - A SvelteKit template for environmental data visualization.

**Live Demo:** [osemsauce.org](https://osemsauce.org)  
**Source:** [github.com/OSEMSAUCE/OSEM](https://github.com/OSEMSAUCE/OSEM)

## Features

- ✅ **Interactive Map** - Mapbox GL with GeoJSON polygon support
- ✅ **Data Dashboard** - Browse projects, lands, crops, plantings
- ✅ **API-First** - Fetches data from any REST API
- ✅ **No Database Required** - Just point to your API
- ✅ **Minimal Setup** - Just Mapbox token and API URL needed

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env:
# PUBLIC_API_URL=https://your-api.com
# VITE_MAPBOX_TOKEN=your-token-here

# 3. Start dev server
npm run dev
```

**That's it!** The app is now running:

- **Frontend:** http://localhost:5174
- **Map:** http://localhost:5174/map
- **Dashboard:** http://localhost:5174/dashboard

## Environment Variables

```bash
# .env
PUBLIC_API_URL=https://your-api.com   # Your data API
VITE_MAPBOX_TOKEN=your-mapbox-token   # Get free at mapbox.com
```

## Tech Stack

- **Frontend:** SvelteKit 5 + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn-svelte
- **Maps:** Mapbox GL JS v3.14
- **State:** Svelte 5 runes ($state, $derived, $effect)
- **Deployment:** Vercel, Netlify, or any static host

## Project Structure

```
src/
├── routes/              # SvelteKit pages
├── lib/
│   └── subwoof/         # Shared components
│       ├── components/  # UI components
│       ├── routes/      # Dashboard & Map pages
│       ├── styles/      # CSS (base.css, map.css)
│       └── types/       # TypeScript types
└── app.css              # Theme & Tailwind config
```

## Customization

### Styling

Edit `src/app.css` to customize the theme:

```css
@theme {
	--color-primary: #your-brand-color;
	--color-accent: #your-accent-color;
}
```

### Static Data

Add GeoJSON files to `static/claims/` for map layers.

### Components

The `src/lib/subwoof/components/ui/` directory contains shadcn-svelte components. Create wrapper components in `components/dashboard/` for customization.

## API Requirements

OSEM expects these endpoints from your API:

- `GET /api/dashboard` - Dashboard data
- `GET /api/map/polygons` - GeoJSON FeatureCollection

## Deployment

Deploy to any static host:

```bash
npm run build
```

**Environment variables needed:**

- `PUBLIC_API_URL` - Your API endpoint
- `VITE_MAPBOX_TOKEN` - Mapbox access token

---

**Questions?** Open an issue on [GitHub](https://github.com/OSEMSAUCE/OSEM/issues).
