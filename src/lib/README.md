# Library Structure

## Components
- **map/** - Map-related components and plugins
  - `mapParent.ts` - Main map initialization
  - `mapPlugins/` - Modular map plugins (draw, toggle, etc.)
- **dashboard/** - Dashboard UI components (future)
- **shared/** - Shared/reusable UI components

## Data
- `api.ts` - API client for fetching data from treevr

## Stores
Svelte stores for app-wide state management:
- `auth.ts` - Authentication state
- `projects.ts` - Project data and filtering
- `mapState.ts` - Map viewport and interaction state

## Types
- `project.ts` - Shared TypeScript interfaces and types
