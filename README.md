# OSEM🤘🌲

🌲 Open-Source Restoration Project Platform

An interactive web app for visualizing and exploring restoration projects worldwide. Features an interactive map and data dashboard for browsing project specs, polygons, land, planting, crops, stakeholders, sources, and more.

## Design System
- **Clean, minimal UI** with strong black/white contrast
- **Purple (#8028DE)** used sparingly for accents, links, and highlights
- **Tailwind CSS** 
- **Shadcn UI**
- **([selfKit](https://github.com/tommylec/selfkit)) Boilerplate** by TommyLec - very helpful, I copied the site to a very great extent
- **JetBrains Mono** + system monospace fonts (SF Mono, Menlo, Consolas)

## Features

### Interactive Map 
- View restoration project polygons worldwide
- Toggle layers (Restoration Polygons, US Eco Regions, BC Test Layer)
- Switch between Street and Satellite views
- Zoom and pan controls
- Click polygons for details

### Data Dashboard ([/dashboard](http://localhost:5173/dashboard))
- Browse projects, lands, crops, and plantings
- Filter by project
- View detailed data tables
- Export capabilities (coming soon)

## Tech Stack

- **Frontend:** SvelteKit + TypeScript + Bootstrap 5
- **Database:** Supabase (PostgreSQL)
- **Mapping:** Mapbox GL JS v3.14
- **Deployment:** Vercel

## Local Development

### Prerequisites

- Node.js v18+
- Supabase CLI (for local database)
- Mapbox access token ([get one free](https://account.mapbox.com/access-tokens/))

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Supabase (in OSEMData directory)
cd ../OSEMData
supabase start

# 3. Configure environment (create OSEM/.env)
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_MAPBOX_TOKEN=pk.eyJ1...

# 4. Start dev server
cd ../OSEM
npm run dev
```

Visit:
- **Dashboard:** http://localhost:5173/dashboard
- **Map:** http://localhost:5173/OSEM
- **Supabase Studio:** http://127.0.0.1:54323

See [README_DASHBOARD.md](../README_DASHBOARD.md) for detailed setup instructions.

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
/OSEM/
├── src/
│   ├── routes/
│   │   ├── dashboard/        # Data table view
│   │   ├── OSEM/          # Map application
│   │   └── +layout.svelte    # Global layout
│   ├── lib/
│   │   ├── components/       # Reusable components
│   │   │   ├── dashboard/
│   │   │   ├── map/
│   │   │   └── shared/
│   │   ├── supabase.ts       # Database client
│   │   └── utils.ts
│   └── app.css               # Global styles (Bootstrap + custom)
├── static/
│   └── polygons/             # GeoJSON polygon data
└── .env                      # Environment config
```

## Data Sources

**Current:** Supabase PostgreSQL database with sample data
**Future:** Connect to production treevr database

Tables:
- `projectTable` - Restoration projects
- `landTable` - Land parcels
- `cropTable` - Planted species
- `plantingTable` - Planting events
- `polygonTable` - Geographic boundaries

## Coding Conventions

### Database Field Naming

**IMPORTANT:** All TypeScript interfaces and types MUST use the exact field names from the database.

- Use database field names exactly as they appear (e.g., `projectDateStart`, `lastEditedAt`, `hectares`)
- Do NOT create renamed/aliased versions (e.g., don't use `startDate`, `updatedAt`, `areaHectares`)
- Do NOT add fictional fields that don't exist in the database
- Keep type definitions synchronized with actual database schema

This convention ensures:
- Clear traceability between code and database
- No confusion about which fields actually exist
- Easy debugging and maintenance
- No made-up data fields

See [ARCHITECTURE.md](../ARCHITECTURE.md#database--data-layer) for complete schema documentation.

### CSS & Styling

See [src/appStyle.md](src/appStyle.md) for complete CSS rules and style guide.

**Quick rules:**
- All CSS in `src/app.css` (single source of truth)
- Use Bootstrap 5 classes first
- Purple (#8028DE) for accents ONLY
- Strong black/white contrast
- No inline `<style>` blocks

## Contributing

We welcome contributions! Areas of focus:
- Adding new map layers (seed zones, biomes, climate data)
- Dashboard enhancements (charts, filters, exports)
- Performance optimization (lazy loading, pagination)
- Testing and documentation

## Roadmap

**Phase 1 (Current):**
- ✅ Direct Supabase integration
- ✅ Dashboard with project/table filtering
- ✅ Interactive map with polygon layers
- ✅ Bootstrap 5 migration (clean, minimal UI)

**Phase 2:**
- [ ] Advanced filtering (biome, size, organization)
- [ ] Data visualization (charts, metrics)
- [ ] Export functionality (CSV, GeoJSON)
- [ ] Authentication (optional, for premium features)

**Phase 3:**
- [ ] Migrate to MapLibre GL (open-source alternative to Mapbox)
- [ ] Self-host vector tiles (PMTiles)
- [ ] Custom map styles (Maputnik)

See [plan.md](../ARCHITECTURE.md#future-roadmap) for detailed roadmap.

---

**Questions?** Open an issue or reach out if you'd like to contribute seed zone data for your region!
