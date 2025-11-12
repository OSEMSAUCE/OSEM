# Breadcrumb Navigation & Multi-Table Dashboard Implementation Plan

## Overview

Create a unified dashboard with breadcrumb navigation that allows viewing different data entities (Land, Crops, Plantings, Projects) using the same DataTable component, with URL-based navigation and filtering.

## Goals

- Reuse the existing generic DataTable component for all entity types
- Implement breadcrumb navigation using shadcn-ui breadcrumb component
- Enable URL-based routing for different table views
- Support hierarchical filtering (e.g., view all plantings for a specific project)
- Make the filter input dynamic based on the current view

## Architecture Design

### URL Structure

```
/dashboard                                    → Projects view (default)
/dashboard/projects                           → All projects
/dashboard/projects/[projectId]               → Single project overview
/dashboard/projects/[projectId]/land          → All land parcels for this project
/dashboard/projects/[projectId]/land/[landId] → Single land parcel details
/dashboard/projects/[projectId]/plantings     → All plantings for this project
/dashboard/projects/[projectId]/plantings/[plantingId] → Single planting details
/dashboard/projects/[projectId]/crops         → All crops used in this project
/dashboard/projects/[projectId]/crops/[cropId] → Single crop details within project context
```

### Component Structure

```
src/lib/components/dashboard/
├── DataTable.svelte              (existing - needs updates)
├── Breadcrumb.svelte             (new - navigation component)
├── columns/
│   ├── projectColumns.ts         (refactor from existing columns.ts)
│   ├── landColumns.ts            (new)
│   ├── cropColumns.ts            (new)
│   └── plantingColumns.ts        (new)
└── views/
    ├── DashboardLayout.svelte    (new - wrapper with breadcrumbs)
    ├── ProjectsView.svelte       (new)
    ├── LandView.svelte           (new)
    ├── CropsView.svelte          (new)
    └── PlantingsView.svelte      (new)
```

## Implementation Steps

### Phase 1: Setup & Preparation

1. **Install shadcn-ui breadcrumb component**

   ```bash
   npx shadcn-svelte@latest add breadcrumb
   ```

2. **Create type definitions**
   - Create `src/lib/types/land.ts` for Land entity
   - Create `src/lib/types/crop.ts` for Crop entity
   - Create `src/lib/types/planting.ts` for Planting entity
   - Add hierarchical relationships between types

3. **Update DataTable component**
   - Make filter configuration flexible via props
   - Remove hardcoded `landName` filter
   - Add optional `filterConfig` prop:
     ```typescript
     type FilterConfig = {
     	columnKey: string;
     	placeholder: string;
     };
     ```

### Phase 2: Routing & Data Loading

1. **Create route structure**
   - `src/routes/dashboard/+layout.svelte` - shared layout with breadcrumbs
   - `src/routes/dashboard/+layout.ts` - shared data loading
   - `src/routes/dashboard/+page.svelte` - projects view (default)
   - `src/routes/dashboard/land/+page.svelte` - land view
   - `src/routes/dashboard/crops/+page.svelte` - crops view
   - `src/routes/dashboard/plantings/+page.svelte` - plantings view

2. **Create load functions**
   - Each route needs a `+page.ts` or `+page.server.ts`
   - Load appropriate data from database/API
   - Support URL query parameters for filtering (e.g., `?project=123`)

### Phase 3: Breadcrumb Component

1. **Create Breadcrumb.svelte**
   - Use shadcn breadcrumb components
   - Accept `items` prop with breadcrumb data:
     ```typescript
     type BreadcrumbItem = {
     	label: string;
     	href?: string; // undefined for current page
     };
     ```
   - Example breadcrumb chains:
     - Home → Dashboard → Projects
     - Home → Dashboard → Projects → [Project Name]
     - Home → Dashboard → Projects → [Project Name] → Land
     - Home → Dashboard → Projects → [Project Name] → Land → [Land Name]
     - Home → Dashboard → Projects → [Project Name] → Plantings
     - Home → Dashboard → Projects → [Project Name] → Crops

2. **Breadcrumb state management**
   - Use URL to derive breadcrumb state
   - Store entity names for IDs (e.g., fetch project name for breadcrumb)

### Phase 4: Column Definitions

1. **Refactor existing columns.ts**
   - Rename to `projectColumns.ts`
   - Move to `columns/` subdirectory

2. **Create column definitions for each entity**
   - `landColumns.ts`:
     ```typescript
     -landName - hectares - gpsLat / gpsLon - treatmentType - treesPlanted;
     ```
   - `cropColumns.ts`:
     ```typescript
     -cropName - scientificName - category - growthRate;
     ```
   - `plantingColumns.ts`:
     ```typescript
     - plantingDate
     - landName (with link)
     - projectName (with link)
     - cropType
     - quantity
     - status
     ```

3. **Add interactive columns**
   - Make entity names clickable (navigate to detail view)
   - Add action columns (view, edit, delete buttons)

### Phase 5: View Components

1. **Create DashboardLayout.svelte**

   ```svelte
   <script>
   	import Breadcrumb from '$lib/components/dashboard/Breadcrumb.svelte';
   	let { breadcrumbItems } = $props();
   </script>

   <div class="dashboard-layout">
   	<Breadcrumb items={breadcrumbItems} />
   	<slot />
   	<!-- Child view content -->
   </div>
   ```

2. **Create entity view components**
   - Each view wraps DataTable with appropriate:
     - Column definitions
     - Filter configuration
     - Title/header
   - Example: `ProjectsView.svelte`:
     ```svelte
     <DataTable
     	data={projects}
     	columns={projectColumns}
     	filterConfig={{ columnKey: 'projectName', placeholder: 'Filter by project name...' }}
     />
     ```

### Phase 6: Detail Views & Hierarchical Navigation

1. **Create detail page routes**
   - `src/routes/dashboard/projects/[id]/+page.svelte`
   - Show single project details
   - Show related entities (lands, plantings) below

2. **Implement related entity tables**
   - When viewing a project, show its lands and plantings
   - Add "View all" links that navigate to filtered views
   - Example: `/dashboard/plantings?project=abc123`

3. **Add filtering logic**
   - Update load functions to respect query parameters
   - Filter data based on parent entity ID

### Phase 7: Enhanced Features

1. **Add sorting capabilities**
   - Already supported by DataTable via TanStack Table
   - Add sort indicators in column headers

2. **Add row actions**
   - Add actions column with buttons:
     - View (navigate to detail page)
     - Edit (open modal or navigate to edit page)
     - Delete (confirm and delete)

3. **Add row selection**
   - Enable multi-select in DataTable
   - Add bulk actions toolbar
   - Actions: Delete selected, Export selected, etc.

4. **Responsive breadcrumbs**
   - Collapse breadcrumbs on mobile
   - Show only last 2-3 items with dropdown for rest

## Technical Considerations

### State Management

- Use SvelteKit's URL state for filtering (`$page.url.searchParams`)
- Store selected entity IDs in URL for deep linking
- Use page stores for reactive breadcrumb updates

### Data Fetching

- Use SvelteKit load functions for SSR support
- Implement proper loading states in DataTable
- Add error handling for failed loads

### Type Safety

- Ensure all entity types match database schema
- Use discriminated unions for different view states
- Type-safe column definitions with generics

### Performance

- Implement pagination (already in DataTable)
- Consider virtual scrolling for large datasets
- Lazy load related entities in detail views

### Database Schema Alignment

Based on existing types, ensure views align with:

- `landTable` - land parcels
- `projectTable` - projects
- `cropTable` - crop types (needs schema verification)
- `plantingTable` - planting records (needs schema verification)
- Join tables for relationships (stakeholderTable, etc.)

## Example User Flows

### Flow 1: Browse Projects → View Land → See Plantings

1. User lands on `/dashboard` (projects view)
2. Breadcrumb: **Home → Dashboard → Projects**
3. Clicks on project "Reforestation Alpha"
4. Navigates to `/dashboard/projects/proj-123`
5. Breadcrumb: **Home → Dashboard → Projects → Reforestation Alpha**
6. Sees project overview with summary cards for land, plantings, crops
7. Clicks "View Land" or navigates to Land tab
8. Navigates to `/dashboard/projects/proj-123/land`
9. Breadcrumb: **Home → Dashboard → Projects → Reforestation Alpha → Land**
10. Sees all land parcels for this project
11. Clicks on land "North Parcel"
12. Navigates to `/dashboard/projects/proj-123/land/land-456`
13. Breadcrumb: **Home → Dashboard → Projects → Reforestation Alpha → Land → North Parcel**
14. Sees land details and plantings on that land

### Flow 2: View All Plantings for a Project

1. User on `/dashboard/projects/proj-123`
2. Clicks "View Plantings" or navigates to Plantings tab
3. Navigates to `/dashboard/projects/proj-123/plantings`
4. Breadcrumb: **Home → Dashboard → Projects → Reforestation Alpha → Plantings**
5. DataTable shows only plantings for project proj-123
6. Can filter further by land parcel, crop type, date range, etc.

## shadcn-ui Breadcrumb Reference

- Documentation: https://ui.shadcn.com/docs/components/breadcrumb
- Components to use:
  - `Breadcrumb` - root component
  - `BreadcrumbList` - container for items
  - `BreadcrumbItem` - individual breadcrumb
  - `BreadcrumbLink` - clickable breadcrumb
  - `BreadcrumbPage` - current page (not clickable)
  - `BreadcrumbSeparator` - separator between items

## Next Steps

1. Review and approve this plan
2. Verify database schema for crops and plantings tables
3. Begin Phase 1 implementation
4. Iteratively build and test each phase

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->
