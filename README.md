# OSEM - Open Source Environmental Mapping 🌍

**Complete standalone application** for environmental mapping and reforestation data visualization.

> **🚀 Works Out-of-the-Box!**
>
> OSEM is a **complete, runnable application** with frontend + API server. Fork it, run `npm run dev:all`, and you have a working app with demo data. No complex setup required!

## What Makes OSEM Special

OSEM is a **fully functional open-source application**, not just a UI demo:

- **Complete Stack** - Frontend (SvelteKit) + API Server (Express) + Database connection
- **Works Immediately** - Uses public demo database by default (throttled, read-only)
- **Fully Customizable** - Bring your own database for full access
- **True Open Source** - All code is public, community can contribute
- **Production Ready** - Deploy frontend and API separately or together

## Features

- ✅ **Interactive Map** - Mapbox GL with restoration polygons
- ✅ **Data Dashboard** - Browse projects, lands, crops, plantings
- ✅ **Built-in API Server** - Express.js with rate limiting and CORS
- ✅ **Public Demo Database** - Works out of the box (10 items/request)
- ✅ **Your Own Database** - Optional PostgreSQL/Supabase connection
- ✅ **Minimal Setup** - Just Mapbox token needed

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional - works with defaults)
cp .env.example .env
# Add your Mapbox token:
# VITE_MAPBOX_TOKEN=your-token-here

# 3. Run everything (frontend + API)
npm run dev:all
```

**That's it!** The app is now running:

- **Frontend:** http://localhost:5174
- **API:** http://localhost:3001
- **Map:** http://localhost:5174/map
- **Dashboard:** http://localhost:5174/dashboard

The app uses a **public demo database** by default (throttled to 10 items per request). Perfect for testing and demos!

### Using Your Own Database

Want full data access? Set up your own database:

1. **Get a PostgreSQL or Supabase database**
2. **Update `.env`:**

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
# or
DATABASE_URL=https://your-project.supabase.co
```

3. **Run the app:**

```bash
npm run dev:all
```

Now you have full, unlimited access to your own data!

**See [API_README.md](./API_README.md) for complete API documentation.**

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
