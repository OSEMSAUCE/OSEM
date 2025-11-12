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

Here's the schema fyi.generator client {
  provider = "prisma-client-js"
  output   = "../lib/generated/prisma-sqlite"
}

datasource db {
  provider = "sqlite"
  url      = "file:./staging.db"
}

model projectTable {
  projectId                  String                  @id @unique
  projectName                String
  url                        String?
  platformId                 String?
  platform                   String? // FK to organizationLocalTable (domain like "restor.eco")
  projectNotes               String?
  createdAt                  DateTime?               @default(now())
  lastEditedAt               DateTime?               @default(now()) @updatedAt
  deleted                    Boolean?                @default(false)
  carbonRegistryType         CarbonRegistryType?
  carbonRegistry             CarbonRegistry?
  employmentClaim            Int?
  employmentClaimDescription String?
  projectDateEnd             DateTime?
  projectDateStart           DateTime?
  registryId                 String?
  cropTable                  cropTable[]
  landTable                  landTable[]
  plantingTable              plantingTable[]
  sourceTable                sourceTable[]
  stakeholderTable           stakeholderTable[]
  polyTable                  polyTable[]
  organizationLocalTable     organizationLocalTable? @relation(fields: [platform], references: [organizationLocalName], onDelete: NoAction, onUpdate: NoAction)

  @@index([platformId])
}

model landTable {
  landId        String         @id
  landName      String
  projectId     String
  hectares      Decimal?
  gpsLat        Decimal?
  gpsLon        Decimal?
  landNotes     String?
  createdAt     DateTime?      @default(now())
  lastEditedAt  DateTime?      @default(now()) @updatedAt
  treatmentType TreatmentType?
  editedBy      String?
  deleted       Boolean?       @default(false)
  preparation   String?
  projectTable  projectTable?  @relation(fields: [projectId], references: [projectId], onDelete: NoAction, onUpdate: NoAction)
  sourceTable   sourceTable[]

  polygonTable polygonTable[]

  // @@unique([projectId, landName])
  @@index([projectId])
  @@index([landName])
}

model cropTable {
  cropId                String         @id
  cropName              String
  projectId             String?
  speciesLocalName      String?
  speciesId             String?
  seedInfo              String?
  cropStock             String?
  createdAt             DateTime?      @default(now())
  lastEditedAt          DateTime?      @default(now()) @updatedAt
  editedBy              String?
  deleted               Boolean?       @default(false)
  organizationLocalName String?
  cropNotes             String?
  speciesTable          speciesTable[]
  projectTable          projectTable?  @relation(fields: [projectId], references: [projectId], onDelete: NoAction, onUpdate: NoAction)
  sourceTable           sourceTable[]

  @@unique([projectId, cropName])
  @@index([organizationLocalName])
  @@index([projectId])
}

/// This model contains row level security and requires additional setup for migrations. Visit https://pris.ly/d/row-level-security for more info.
model plantingTable {
  plantingId   String     @id @unique
  // projectId &if landName? &if year?
  planted      Int?
  projectId    String
  parentId     String
  parentType   ParentType
  allocated    Int?
  plantingDate DateTime?
  createdAt    DateTime?  @default(now())
  lastEditedAt DateTime?  @default(now()) @updatedAt
  deleted      Boolean?   @default(false)

  // Generic unitized activity fields (simplified)
  // When treatmentType = planted, units typically equals planted (count of trees)
  units    Decimal?
  unitType UnitType?

  pricePerUnit Decimal?
  currency     String?

  projectTable projectTable @relation(fields: [projectId], references: [projectId], onDelete: NoAction, onUpdate: NoAction)

  sourceTable sourceTable[]

  @@index([projectId])
  @@index([parentId])
  @@index([parentType])
  @@index([parentId, parentType])
}

model speciesTable {
  speciesName    String      @id @unique
  commonName     String
  scientificName String?
  type           String?
  family         String?
  reference      String?
  createdAt      DateTime?   @default(now())
  lastEditedAt   DateTime?   @default(now()) @updatedAt
  editedBy       String?
  deleted        Boolean?    @default(false)
  cropTable      cropTable[]
}

model polygonTable {
  landId       String // FK to landTable
  polygonId    String     @id
  landName     String? // Kept for readability
  geometry     String? // Store full GeoJSON as JSON string
  coordinates  String? // Store coordinates as JSON string
  type         String? // "Polygon" or "MultiPolygon" 
  polygonNotes String?
  lastEditedAt DateTime?  @default(now()) @updatedAt
  landTable    landTable? @relation(fields: [landId], references: [landId], onDelete: NoAction, onUpdate: NoAction)

  @@index([landId])
}

model polyTable {
  polyId                String           @id @unique
  parentId              String
  parentType            ParentType
  projectId             String
  randomJson            String?
  survivalRate          Float?
  liabilityCause        String?
  ratePerTree           Float?
  motivation            String?
  restorationType       RestorationType?
  reviews               String?
  createdAt             DateTime?        @default(now())
  lastEditedAt          DateTime?        @default(now()) @updatedAt
  editedBy              String?
  deleted               Boolean?         @default(false)
  projectTable          projectTable?    @relation(fields: [projectId], references: [projectId])
  projectTableProjectId String?

  @@index([projectId])
  @@index([parentId])
  @@index([parentType])
  @@index([parentId, parentType])
}

model stakeholderTable {
  stakeholderId       String     @id
  organizationLocalId String
  parentId            String
  parentType          ParentType
  projectId           String?

  stakeholderType        stakeholderType?
  lastEditedAt           DateTime?               @default(now()) @updatedAt
  createdAt              DateTime?               @default(now())
  projectTable           projectTable?           @relation(fields: [projectId], references: [projectId], onUpdate: NoAction)
  organizationLocalTable organizationLocalTable? @relation(fields: [organizationLocalId], references: [organizationLocalId], onUpdate: NoAction)

  @@index([organizationLocalId])
}

model sourceTable {
  sourceId               String                   @id
  url                    String
  urlType                urlType?
  parentId               String?
  parentType             ParentType?
  projectId              String?
  disclosureType         disclosureType?
  sourceDescription      String?
  sourceCredit           String?
  lastEditedAt           DateTime?                @default(now()) @updatedAt
  createdAt              DateTime?                @default(now())
  projectTable           projectTable[]
  landTable              landTable[]
  cropTable              cropTable[]
  organizationLocalTable organizationLocalTable[]
  plantingTable          plantingTable[]

  @@index([parentId])
  @@index([parentType])
  @@index([parentId, parentType])
}

// Raw scraped organization names - UNIQUE by exact spelling
model organizationLocalTable {
  organizationLocalName String             @unique // "WWF", "World Wildlife Fund", etc - UNIQUE key
  organizationLocalId   String             @id // NULL until validated, FK to organizationMasterTable
  organizationMasterId  String?
  contactName           String?
  contactEmail          String?
  contactPhone          String?
  address               String?
  polyId                String?
  website               String?
  capacityPerYear       Int?
  organizationNotes     String?
  createdAt             DateTime?          @default(now())
  lastEditedAt          DateTime?          @default(now()) @updatedAt
  editedBy              String?
  deleted               Boolean?           @default(false)
  gpsLat                Float?
  gpsLon                Float?
  sourceTable           sourceTable[]
  stakeholderTable      stakeholderTable[]
  projectsHosted        projectTable[]

  // Link to validated master organization
  officialOrg organizationMasterTable? @relation(fields: [organizationMasterId], references: [organizationMasterId])

  @@index([organizationLocalId])
}

// Validated canonical organizations - UNIQUE by ID
model organizationMasterTable {
  // note: "organizationMasterId" needs to be concatenated with the orgName
  organizationMasterId   String @id
  organizationMasterName String @unique // Validated canonical name "World Wildlife Fund"

  // Minimal validated data only
  officialWebsite String?

  createdAt    DateTime? @default(now())
  lastEditedAt DateTime? @default(now()) @updatedAt
  editedBy     String?

  // Link back to all raw spelling variants
  rawVariants organizationLocalTable[]
}

enum ParentType {
  projectTable
  landTable
  cropTable
  plantingTable
  organizationTable
  sourceTable
  stakeholderTable
}

enum type {
  Polygon
  MultiPolygon
  MultiLineString
  LineString
  Point
  Feature
  FeatureCollection
  GeometryCollection
}

enum UnitType {
  cCO2e
  hectare
  acre
  tree
  credits
  project
  land
}

// TODO: make a table out of this
enum TreatmentType {
  ARR
  improved_forest_management
  avoided_deforestation
  forest_conservation
  regenerative_agriculture
  improved_agricultural_practices
  cover_cropping
  restoration
  agroforestry
}

enum urlType {
  webpage
  api
  image
  video
  document
  review
  other

  @@map("urlType")
}

enum stakeholderType {
  developer
  nursery
  marketplace
  NGO
  research
  supplier
  producer
}

enum disclosureType {
  publicDB
  company
  NGO
  marketplace
  disclosure
  research
}

enum CarbonRegistryType {
  ARR
  AD
  IFM
}

enum CarbonRegistry {
  Verra
  Gold_Standard
  Climate_Action_Reserve
  American_Carbon_Registry
  Plan_Vivo
  Social_Carbon
}

enum RestorationType {
  manual_planting
  drone_seeding
  mechanical_planting
  aerial_seeding
  natural_regeneration
  conservation
  improved_forest_management
  avoided_deforestation
  magrove_regeneration
  agroforestry
}

