# SelfKit Migration Plan for Retreever

## 🎉 MIGRATION COMPLETE - Nov 15, 2025

All phases complete! The original `retreever/` repo now contains:
- ✅ SelfKit base with shadcn-svelte + Tailwind v4
- ✅ Map functionality at `/firsure`
- ✅ Dashboard at `/dashboard`
- ✅ All dependencies installed
- ✅ Original git history preserved
- ✅ Dev server running on http://localhost:5176/

---

## CURRENT STATUS

**Working:**
- ✅ Map displays and loads polygon data from Supabase
- ✅ Dashboard shows data tables
- ✅ Minimal CSS added for map visibility
- ✅ Supabase running locally (Docker + retreeverData)

**Directory Structure:**
```
retreever_dir/
├── retreever/                    # ✅ MAIN REPO (merged SelfKit + your features)
├── retreeverData/                # Supabase backend
├── retreever_backup_20251115_*  # Safety backup
├── retreever_selfkit/            # Can be deleted
└── retreever_source/             # Can be deleted
```

---

## POST-MIGRATION TASKS (TODO)

### 1. Build Homepage ⭐
**Goal:** Create a marketing homepage matching selfkit.dev style
- [ ] Hero section with animations
- [ ] Tech stack display (orbiting icons)
- [ ] Problem statement section
- [ ] Features grid (BentoCards)
- [ ] Call to action
- [ ] Custom branding for Retreever (not SelfKit)

**Note:** The fancy selfkit.dev homepage isn't in the public SelfKit repo, so we'll build custom components.

### 2. Update Navigation
- [ ] Add "Map" link to navbar → `/firsure`
- [ ] Add "Dashboard" link to navbar → `/dashboard`
- [ ] Update branding from "SelfKit" to "Retreever"

### 3. Remove Unused SelfKit Features
- [ ] Remove/disable Koolify deployment configs
- [ ] Remove Plunk email service integration
- [ ] Remove Paddle payment integration (causing current warning)
- [ ] Keep: Analytics, SEO, Blog, i18n, Legal pages

### 4. Cleanup Temporary Folders
Once everything is tested and committed:
```bash
cd /Users/chrisharris/Library/CloudStorage/Dropbox/DEV_PROJECTS/retreever_dir
rm -rf retreever_selfkit
rm -rf retreever_source
# Keep retreever_backup_* for a while, then delete
```

### 5. Styling Harmonization (Optional)
- [ ] Map tooltips → match SelfKit design tokens
- [ ] Dashboard table → integrate more shadcn components
- [ ] Ensure consistent color scheme across map/dashboard/homepage

---

## FILES PORTED (Complete ✅)

### Map Core
```
✅ src/routes/firsure/+page.svelte
✅ src/lib/components/map/mapParent.ts
✅ src/lib/components/map/mapPlugins/
✅ src/lib/supabase.ts
✅ src/lib/types/land.ts, project.ts, crop.ts, planting.ts
✅ static/claims/restorPoly2.geojson
✅ static/geographic/usEco.geojson, bc_test_poly.geojson
```

### Dashboard
```
✅ src/routes/dashboard/+page.svelte
✅ src/routes/dashboard/+page.ts
✅ src/lib/components/dashboard/DataTable.svelte
✅ src/lib/components/dashboard/Breadcrumb.svelte
✅ src/lib/components/dashboard/columns/*
✅ src/lib/tanstackTable/
```

### Dependencies Installed
```
✅ mapbox-gl, @mapbox/mapbox-gl-draw, mapbox-gl-opacity
✅ @supabase/supabase-js
✅ @tanstack/svelte-table
✅ pmtiles, @turf/turf
```

---

## DECISIONS LOG

**Date:** 2025-11-15

1. ✅ **Migration Strategy:** Kept original git history in `retreever/`, replaced contents with SelfKit merge
2. ✅ **Database:** Supabase (local Docker in `retreeverData/`)
3. ✅ **Styling:** Minimal CSS for now - will build custom design later
4. ✅ **Homepage:** Will build custom components (selfkit.dev homepage not in public repo)
5. ⏳ **API Routes:** Skipped SQLite routes, fly.dev proxies not needed yet
6. ⏳ **Payment/Email:** Remove Paddle and Plunk integrations

---

## TESTING

**Dev Server:** `npm run dev` in `retreever/`
- Running on: http://localhost:5176/

**Test URLs:**
- http://localhost:5176/ - Homepage (SelfKit demo)
- http://localhost:5176/firsure - Map ✅
- http://localhost:5176/dashboard - Dashboard ✅

**Supabase Backend:**
- Location: `/Users/.../retreeverData/`
- Start: `cd retreeverData && supabase start`
- Status: `supabase status`

---

## NEXT SESSION PRIORITIES

1. **Build custom homepage** with selfkit.dev-inspired design
2. **Update navbar** with Map + Dashboard links
3. **Remove unused SelfKit features** (Paddle, Plunk, Koolify)
4. **Commit changes** to git
5. **Cleanup temporary folders**

---

## ROLLBACK PLAN

If needed:
```bash
cd /Users/chrisharris/Library/CloudStorage/Dropbox/DEV_PROJECTS/retreever_dir
rm -rf retreever
mv retreever_backup_20251115_* retreever
```
