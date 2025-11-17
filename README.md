# OSEM - Open Source Environment Map 🌍

**Independent** SvelteKit demo app showcasing restoration project visualization.

## Philosophy

OSEM is a **standalone application**, not a stripped-down copy of ReTreever. While it receives map and dashboard components from ReTreever, it has its own:

- Mock data (no database needed!)
- Styling and branding
- Homepage and marketing content
- Deployment configuration

## Features

- **Interactive Map** (`/map`) - Mapbox GL with restoration polygons
- **Data Dashboard** (`/dashboard`) - Browse projects, lands, crops, plantings
- **No Database Required** - Uses mock data for demo purposes
- **Minimal Setup** - Just a Mapbox token needed

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and add your Mapbox token:
# VITE_MAPBOX_TOKEN=your-token-here

# 3. Start dev server
npm run dev
```

**That's it!** No Supabase, no database setup needed.

- Map: http://localhost:5173/map
- Dashboard: http://localhost:5173/dashboard

## OSEM-Specific Files (Never Overwritten)

These files belong to OSEM and won't be touched by sync from ReTreever:

- **Mock Data:** `src/lib/data/mockData.ts` - Demo dataset
- **Homepage:** `src/routes/+page.svelte` - Landing page
- **Styling:** `src/app.css` - OSEM-specific styles
- **Config:** `.env.local`, `package.json`, deployment configs
- **Blog Posts:** `src/posts/` - Content files

## Synced Components (Updated Periodically)

These components come from ReTreever via `../sync-to-osem.sh`:

- Map components (`src/lib/components/map/`)
- Dashboard components (`src/lib/components/dashboard/`)
- UI components (`src/lib/components/ui/`)
- TypeScript types (`src/lib/types/`)
- Core routes (`src/routes/map/`, `src/routes/dashboard/`)

**Note:** After initial sync, you CAN modify these for OSEM-specific needs. Just document your changes and be ready to re-apply them after future syncs.

## Customizing OSEM

### Update Mock Data

Edit `src/lib/data/mockData.ts` to change demo projects, lands, crops, or plantings:

```typescript
export const mockProjects: ProjectWithStats[] = [
	{
		projectId: 1,
		projectName: 'Your Custom Demo Project',
		landCount: 5,
		totalHectares: 150.0,
		platform: 'OSEM Demo'
	}
];
```

### Override Component Styling

Add OSEM-specific styles to `src/app.css`:

```css
/* Override synced component styles */
.dashboard-table {
	border: 2px solid #your-brand-color;
}

.map-container {
	/* OSEM-specific map styling */
}
```

### Add Static Files

You can add your own GeoJSON files to `static/` directory. They won't be deleted by sync.

## Development Workflow

**For contributors working on OSEM:**

1. Clone this repo
2. Install dependencies
3. Add Mapbox token to `.env.local`
4. Start coding!

**You own the OSEM experience** - customize the homepage, styling, and mock data as needed.

## Relationship with ReTreever

ReTreever is the private, full-featured platform with database integration. OSEM is the public demo.

**Component updates flow one-way:** ReTreever → OSEM

This happens manually via sync script (not automatic). Check git history to see when components were last synced.

## Deployment

OSEM is designed to be deployed easily:

- No database setup needed
- Just set `VITE_MAPBOX_TOKEN` in deployment env vars
- Deploy to Vercel, Netlify, or any static host

---

**Questions?** See [../OSEM_INDEPENDENCE.md](../OSEM_INDEPENDENCE.md) for detailed architecture guide.
