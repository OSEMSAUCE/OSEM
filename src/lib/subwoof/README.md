# SubWoof - Shared UI Components

Reusable UI components, routes, and utilities for OSEM.

## Structure

```
subwoof/
├── components/       # Svelte components
│   ├── map/         # Map components & plugins
│   ├── dashboard/   # Dashboard components
│   └── ui/          # shadcn-svelte components (DO NOT EDIT)
├── routes/          # SvelteKit route files
│   ├── map/         # Map page
│   └── dashboard/   # Dashboard page
├── styles/          # Shared CSS
│   ├── base.css     # Base styles
│   └── map.css      # Map-specific styles
├── types/           # TypeScript types
└── api-server/      # API utilities
```

## Important Rules

1. **NEVER edit** `components/ui/` - these are shadcn-svelte library files
2. Create wrapper components in `components/dashboard/` for customization
3. **API calls** use `PUBLIC_API_URL` env var

## Data Fetching

All data is fetched from the API:

```typescript
import { PUBLIC_API_URL } from '$env/static/public';

const response = await fetch(`${PUBLIC_API_URL}/api/map/polygons`);
```
