# SubWoof - Shared UI Components

**⚠️ OSEM is the source of truth for this directory**

Reusable UI components, routes, and utilities shared between OSEM and ReTreever.

## Structure

```
subwoof/
├── components/       # Svelte components
│   ├── map/         # Map components & plugins
│   ├── dashboard/   # Dashboard components
│   └── ui/          # shadcn-svelte components (DO NOT EDIT)
├── routes/          # Complete SvelteKit route files
│   ├── map/         # Map page (+page.svelte, +page.server.ts)
│   └── dashboard/   # Dashboard page (+page.svelte, +page.server.ts)
├── styles/          # Shared CSS
│   ├── base.css     # Base styles
│   └── map.css      # Map-specific styles
├── types/           # TypeScript types
└── config/          # Shared configuration
```

## Important Rules

1. **EDIT HERE (OSEM)** - This is the source of truth
2. **NEVER edit** in ReTreever's `/src/lib/subwoof/` (synced via rsync)
3. **NEVER edit** `components/ui/` - these are shadcn-svelte library files
4. Create wrapper components in `components/what/` for customization

## Workflow

**Edit in OSEM:**

```bash
cd OSEM
# Make your changes in src/lib/subwoof/
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

const response = await fetch(`${PUBLIC_API_URL}/api/dashboard`);
```

See [MASTER_GUIDE.md](../../../../MASTER_GUIDE.md) for complete architecture.
