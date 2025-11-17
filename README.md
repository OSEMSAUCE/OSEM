# OSEM - Shared Components

Minimal SvelteKit app containing shared map and dashboard components from ReTreever.

## What's Here

- `/map` - Interactive Mapbox map with polygon data
- `/dashboard` - Data table with filtering and sorting
- Shared UI components (shadcn-svelte)

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your Supabase and Mapbox credentials
npm run dev
```

## Syncing from ReTreever

This repo receives components from the main ReTreever project via `sync-to-osem.sh`.

**Do not edit components directly in OSEM** - changes will be overwritten on next sync.

Work in ReTreever, then sync here.
