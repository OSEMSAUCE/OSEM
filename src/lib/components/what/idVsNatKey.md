# ID vs Natural Key Issue Resolution

## Problem
The `/what` page was showing project IDs instead of human-readable project names in:
1. **Project search input placeholder** - showed raw `projectId` when project name lookup failed
2. **Table data** - system was configured to hide ID fields but wasn't properly displaying natural keys with navigation links

## Root Cause
- `selectedProjectName()` function fell back to showing `urlProjectId` when project lookup failed
- Missing custom renderers for `projectName` and `landName` fields to create clickable links to map views
- Natural key system was defined in `schema-lookup.ts` but not fully implemented in table rendering

## Solution Implemented
1. **Fixed project search placeholder**: Modified `selectedProjectName()` to return `null` instead of raw ID when project lookup fails
2. **Added custom renderers**:
   - `projectName` → clickable link to `/map?project={projectId}` with "View project on map" tooltip
   - `landName` → clickable link to `/map?project={projectId}&land={landId}` with "View land area on map" tooltip
3. **Preserved existing functionality**: Platform and organization links still work as before

## Files Modified
- `@/Users/chrisharris/DEV/fetch/ReTreever/OSEM/src/routes/what/+page.svelte:59-70` - Fixed selectedProjectName logic
- `@/Users/chrisharris/DEV/fetch/ReTreever/OSEM/src/routes/what/+page.svelte:327` - Fixed placeholder display
- `@/Users/chrisharris/DEV/fetch/ReTreever/OSEM/src/routes/what/+page.svelte:246-292` - Added projectName and landName custom renderers

## Result
- Project search input now shows "Selected: {Project Name}" or "Search projects..." instead of raw IDs
- Table entries for projects and land areas are now clickable links that navigate to map views
- Users can navigate from table data directly to map visualizations