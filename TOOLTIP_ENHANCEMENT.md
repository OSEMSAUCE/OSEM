# Tooltip Enhancement Project

## Current Status

Working on improving map tooltips to display more meaningful and user-friendly information.

## Goals

Transform tooltips from showing raw database IDs to displaying rich, contextual information about land parcels.

---

## Completed Tasks ✅

### 1. Basic Tooltip System

- ✅ Implemented click-to-show tooltips on claim polygon layers
- ✅ Implemented click-to-show popups on marker clusters
- ✅ Created CSS styling system for tooltips ([mapStyles.css](src/lib/components/map/mapStyles.css))
- ✅ Auto-display all properties from GeoJSON data
- ✅ Format property names (camelCase → "Camel Case")

### 2. Land Name Extraction

- Fixed null `landName` values by extracting from `landId` field
- Updated both `/api/polygons` and `/api/polygons/markers` endpoints
- Pattern matching: `landName:Mgwashi` → displays as "Mgwashi"

### 3. Backend API Enhancement (Nov 10, 2025)

- Updated `/api/polygons/+server.ts` with SQL JOINs to fetch related data
- Updated `/api/polygons/markers/+server.ts` with same enhancements
- Removed `polygonId` and `landId` from API response properties
- Added `area` field with automatic "ha" suffix (e.g., "120.5 ha")
- Added `platform` field from projectTable JOIN
- Added `projectName` field from projectTable JOIN
- Added `stakeholders` field with comma-separated organization names
- Area calculation: Uses database `hectares` field or calculates from geometry using Turf.js
- Stakeholder lookup: Queries both land-level and project-level stakeholders

### 4. Frontend Tooltip Filtering (Nov 10, 2025)

- Updated `claimLayers.ts` to filter out null/empty values from tooltips
- Hidden internal fields: `centroid`, `polygonId`, `landId`
- Updated marker popups to show enhanced fields
- Added CSS styling for platform and area in marker popups

---

## In Progress Tasks

### 5. Testing & Verification

**Status**: All code complete, ready for browser testing

**Action needed**: Load map and verify tooltips display correctly

**Expected tooltip content**:

- Land Name
- Project Name (if not null)
- Platform (if not null)
- Area (with "ha" suffix)
- Stakeholders (if any exist)
- Notes (if not empty)

---

## Technical Implementation

### Database Schema (Staging DB)

```
polygonTable
├── polygonId (PRIMARY KEY)
├── landId (FOREIGN KEY → landTable.landId)
├── landName
├── geometry (GeoJSON coordinates)
└── polygonNotes

landTable
├── landId (PRIMARY KEY)
├── landName
├── projectId (FOREIGN KEY → projectTable.projectId)
├── hectares ⭐ (area in hectares)
└── landNotes

projectTable
├── projectId (PRIMARY KEY)
├── projectName ⭐ (display name)
├── platform ⭐ (e.g., "plant-for-the-planet.org")
└── projectNotes

stakeholderTable
├── stakeholderId
├── organizationLocalId (FOREIGN KEY → organizationLocalTable)
├── parentId (links to landId or projectId)
├── parentType (e.g., "land", "project")
└── stakeholderType

organizationLocalTable
├── organizationLocalId (PRIMARY KEY)
├── organizationLocalName ⭐ (stakeholder name)
└── contactName
```

### API Endpoints to Modify

1. **`/api/polygons/+server.ts`** - Main polygon endpoint
2. **`/api/polygons/markers/+server.ts`** - Marker cluster endpoint

### Changes Required

- Add SQL JOINs to fetch related data
- Calculate area using Turf.js if `hectares` is null
- Filter out internal IDs from tooltip display
- Format hectares with "ha" suffix

---

## Expected Tooltip Output

### Before (Current):

```
Staging Projects
━━━━━━━━━━━━━━━━
Land Id:          Tree planting for biodiversity conservation|landName:Mgwashi
Land Name:        Mgwashi
Polygon Id:       plant-for-the-planet.org|projectName:Tree planting...
Polygon Notes:    null
Centroid:         [38.41480, -4.81572]
```

### After (Target):

```
Staging Projects
━━━━━━━━━━━━━━━━
Land Name:        Mgwashi
Project:          Tree planting for biodiversity conservation
Platform:         plant-for-the-planet.org
Area:             120.5 ha
Stakeholders:     Local Community Group, Forest Conservation NGO
Notes:            Reforestation project started 2023
```

---

## Next Steps

1. ✅ Create this TODO document
2. 🔄 Update `/api/polygons/+server.ts` with JOINs
3. 🔄 Add hectares calculation
4. 🔄 Filter out unwanted fields in tooltip display
5. 🔄 Test with live data
6. 🔄 Style stakeholders list (comma-separated or badges)

---

## Notes

- Tooltip styling controlled in [mapStyles.css](src/lib/components/map/mapStyles.css)
- Tooltip content built in [claimLayers.ts](src/lib/components/map/mapPlugins/claimLayers.ts) (lines 262-281)
- Database located at: `/Users/chrisharris/Library/CloudStorage/Dropbox/DEV_PROJECTS/retreever/staging/staging.db`
