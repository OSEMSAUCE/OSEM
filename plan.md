# FirSure Plan

### 6 Nov 2025

## Project Vision
Open-source restoration project mapping platform displaying data from treevr database. Similar to restor.eco and plant-for-the-planet - map-centric with dashboard views for filtering and visualizing large-scale restoration project data.

## Architecture

### Phase 1 - MVP (Current Focus)
**Goal:** Public map + dashboard with basic filtering, no auth required

**Structure:**
```
src/
├── routes/
│   ├── map/                 # Public map view (current firsure page)
│   ├── dashboard/           # Public dashboard with data table/charts
│   ├── profile/             # User profile (auth optional, future)
│   └── +layout.svelte       # Global nav
│
├── lib/
│   ├── components/
│   │   ├── map/             # Map components
│   │   │   ├── mapParent.ts
│   │   │   └── mapPlugins/
│   │   ├── dashboard/       # Dashboard components
│   │   └── shared/          # Shared UI
│   │
│   ├── data/
│   │   ├── api.ts           # API client (future: treevr connection)
│   │   └── polygons/        # Static test data
│   │
│   ├── stores/              # Svelte stores for state
│   │   ├── auth.ts          # Optional auth state
│   │   ├── projects.ts      # Project data & filters
│   │   └── mapState.ts      # Map viewport, selected features
│   │
│   └── types/
│       └── project.ts       # Shared TypeScript types
│
└── static/
    └── polygons/            # GeoJSON files (will migrate to API)
```

**Data Strategy:**
- Start: Static GeoJSON in `/static/polygons/`
- Next: Viewport-based loading (fetch only visible area)
- Later: Pagination, server-side filtering for "massive" datasets

### Phase 2 - Connect to treevr
- SvelteKit API routes (`/api/projects`)
- Fetch from treevr database
- Implement pagination & bounds filtering
- Migrate from static files to dynamic data

### Phase 3 - Auth & Throttling
- Public users: Limited data (e.g., 100 projects)
- Authenticated: Full access (10,000+ projects)
- Auth affects API limits, not route access
- Optional sign-in banner: "View all 45,000 projects - sign in for more"

### Phase 4 - Scale
- Virtual scrolling for dashboard
- Lazy load map layers
- Advanced filtering (biome, size, organization)
- Data visualization (charts, metrics)

## Tech Stack
- **Framework:** SvelteKit (classic structure)
- **Map:** Mapbox GL JS
- **Auth:** TBD (Supabase/Auth.js - public-first approach)
- **Database:** treevr (existing)
- **Deployment:** Vercel

## Current Status
- ✅ Map component with plugins architecture
- ✅ Polygon display with opacity controls
- ✅ Draw tools for user interaction
- 🚧 Setting up route structure
- ⏳ Dashboard skeleton
- ⏳ Stores for state management
