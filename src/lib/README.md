# Shared UI Components (lib)

**⚠️ OSEM is the source of truth for this directory**

Reusable UI components, routes, and utilities shared between OSEM and ReTreever.

## Structure

```
lib/
├── components/       # Svelte components
│   ├── map/         # Map components & plugins
│   ├── dashboard/   # Dashboard components
│   └── ui/          # shadcn-svelte components (DO NOT EDIT)
├── routes/          # Complete SvelteKit route files
│   ├── who/         # Organizations page (`/who` route)
│   ├── what/        # Projects/tables page (`/what` route)
│   └── where/       # Map page (`/where` route)
├── styles/          # Shared CSS
│   ├── base.css     # Base styles
│   └── map.css      # Map-specific styles
├── types/           # TypeScript types
└── config/          # Shared configuration
```

## Important Rules

1. **EDIT HERE (OSEM)** - This is the source of truth
2. **NEVER edit** `components/ui/` - these are shadcn-svelte library files
3. Create wrapper components in `components/dashboard/` for customization

## Workflow

**Edit in OSEM:**

```bash
cd OSEM
# Make your changes in src/lib/
git commit -m "Update shared components"
```

**Sync to ReTreever:**

```bash
# From project root
./sync-osem-to-retreever.sh
```

**Note:** ReTreever uses auth wrapper to inject API secrets, but UI code is identical.

## Data Fetching

All data is fetched from the API using `PUBLIC_API_URL`:

```typescript
import { PUBLIC_API_URL } from '$env/static/public';

// Example: fetch projects/tables data from the `/api/what` endpoint
const response = await fetch(`${PUBLIC_API_URL}/api/what`);
```

See [MASTER_GUIDE.md](../../../../MASTER_GUIDE.md) for complete architecture.
