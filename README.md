# OSEM 🌍

Open-Source Environmental Mapping - Public demo and source of truth for shared UI.

**Live Demo:** [osemsauce.org](https://osemsauce.org)  
**Source:** [github.com/OSEMSAUCE/OSEM](https://github.com/OSEMSAUCE/OSEM)

**Note:** OSEM is the **public source of truth** for shared UI components. ReTreever (private repo) syncs from OSEM.

## Architecture

**OSEM is API-only** - No direct database access:

- **Frontend:** SvelteKit 5 + Tailwind CSS v4
- **Data Source:** Calls ReTreever's API at `PUBLIC_API_URL`
- **Shared UI:** Source of truth in `/src/lib/subwoof/`
- **Security:** No database credentials, only API endpoint
- **Deployment:** Static frontend, no backend needed

## Features

- ✅ **Interactive Map** - Mapbox GL with restoration polygons
- ✅ **Data Dashboard** - Browse projects, lands, crops, plantings
- ✅ **API-First** - Fetches all data from ReTreever's API
- ✅ **No Database** - Secure, no credentials exposed
- ✅ **Minimal Setup** - Just Mapbox token and API URL needed

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env:
# PUBLIC_API_URL=http://localhost:3001  # ReTreever API
# VITE_MAPBOX_TOKEN=your-token-here

# 3. Start dev server
npm run dev
```

**That's it!** The app is now running:

- **Frontend:** http://localhost:5174
- **Map:** http://localhost:5174/map
- **Dashboard:** http://localhost:5174/dashboard

**Note:** You need ReTreever's API server running at `http://localhost:3001` for data.

## Environment Setup

OSEM requires **NO database credentials** - only API access:

### Required Variables

```bash
# .env
PUBLIC_API_URL=http://localhost:3001  # ReTreever API (local dev)
VITE_MAPBOX_TOKEN=your-mapbox-token   # Get from mapbox.com
```

### Local Development

1. Start ReTreever API server (port 3001)
2. Set `PUBLIC_API_URL=http://localhost:3001`
3. Run OSEM on port 5174

### Production

1. Deploy ReTreever API to production
2. Set `PUBLIC_API_URL=https://your-api-domain.com`
3. Deploy OSEM as static site (Netlify/Vercel)

**See [../MASTER_GUIDE.md](../MASTER_GUIDE.md) for complete documentation.**

## Tech Stack

- **Frontend:** SvelteKit 5 + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn-svelte
- **Maps:** Mapbox GL JS v3.14
- **State:** Svelte 5 runes ($state, $derived, $effect)
- **Deployment:** Static site (Netlify/Vercel)

## Shared UI (Source of Truth)

OSEM's `/src/lib/subwoof/` directory is the **source of truth** for shared UI:

- **Routes:** Dashboard, Map pages
- **Components:** UI components, map controls
- **Styles:** base.css, map.css
- **Types:** TypeScript interfaces

**To update ReTreever:** Run `../sync-osem.sh` from project root.

## OSEM-Specific Files

These files are OSEM-only (not synced):

- `src/routes/+page.svelte` - Homepage
- `src/app.css` - OSEM theme (purple accent)
- `.env` - Environment config
- `package.json` - Dependencies

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
