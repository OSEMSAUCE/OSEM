# SelfKit Migration Plan for Retreever

## CLARIFICATION NEEDED

**API Routes:** Your `/src/routes/api/` contains 4 routes:
- `api/polygons/+server.ts` - SQLite (hardcoded paths, NOT used by live map)
- `api/polygons/markers/+server.ts` - SQLite (hardcoded paths, NOT used by live map)
- `api/retreever/projects/+server.ts` - Proxy to fly.dev
- `api/retreever/lands/+server.ts` - Proxy to fly.dev

**Live map uses Supabase DIRECTLY in components, not these routes.** Skip the SQLite ones? Keep only fly.dev proxies if needed?

---

## SELFKIT FEATURES - KEEP/REMOVE

**REMOVE:**
- ❌ Koolify deployment
- ❌ Plunk email service
- ❌ Stripe payments (not mentioned, likely unneeded)

**KEEP:**
- ✅ Analytics (if already set up)
- ✅ SEO features
- ✅ Blog (as option, unpublished)
- ✅ Internationalization
- ✅ Legal pages
- ✅ shadcn-svelte components (core reason for migration)
- ✅ Tailwind v4 + design tokens

---

## FILES TO PORT FROM CURRENT RETREEVER

### ESSENTIAL (Map Core)
```
src/routes/firsure/+page.svelte
src/lib/components/map/
  ├── mapParent.ts (222 lines)
  └── mapPlugins/
      ├── claimLayers.ts (429 lines)
      ├── drawToolTip.ts (80 lines)
      └── geoToggleFeature/
          ├── geoToggle.ts (160 lines)
          └── geographicLayers.ts (93 lines)

src/lib/supabase.ts (Supabase client)

src/lib/types/
  ├── land.ts
  ├── project.ts
  ├── crop.ts
  └── planting.ts

static/claims/
  └── restorPoly2.geojson (4KB)

static/geographic/
  ├── usEco.geojson (98MB)
  └── bc_test_poly.geojson
```

### DASHBOARD (Confirmed Keep)
```
src/routes/dashboard/
  ├── +page.svelte (160 lines)
  └── +page.ts (151 lines - filtering logic)

src/lib/components/dashboard/
  ├── DataTable.svelte (243 lines)
  ├── Breadcrumb.svelte
  └── columns/
      ├── landColumns.ts
      ├── cropColumns.ts
      ├── plantingColumns.ts
      └── projectColumns.ts

src/lib/tanstackTable/ (custom Svelte 5 wrapper)
  ├── index.ts
  ├── table.svelte.ts
  ├── flex-render.svelte
  └── render-component.ts
```

### MAYBE (API Proxies - Clarify Above)
```
src/routes/api/retreever/projects/+server.ts
src/routes/api/retreever/lands/+server.ts
```

### SKIP
```
src/routes/api/polygons/+server.ts (SQLite, unused)
src/routes/api/polygons/markers/+server.ts (SQLite, unused)
src/routes/about/ (rebuilding with SelfKit)
All other routes except map + dashboard
```

---

## MIGRATION WORKFLOW

### PHASE 1: Setup Dual Repos
```bash
cd ~/Dropbox/DEV_PROJECTS/retreever_dir

# 1. Duplicate current retreever AS SOURCE for extraction
cp -r retreever retreever_source

# 2. Clone SelfKit as NEW BASE
git clone https://github.com/TommyLec/SelfKit.git retreever_selfkit
cd retreever_selfkit

# 3. Remove SelfKit git, init new repo
rm -rf .git
git init
git add -A
git commit -m "Initial SelfKit base"

# 4. Add original retreever remote (optional, for history)
git remote add original ../retreever/.git
```

### PHASE 2: Port Map Components
```bash
# Copy map files from retreever_source to retreever_selfkit
cd ~/Dropbox/DEV_PROJECTS/retreever_dir

# Map route
mkdir -p retreever_selfkit/src/routes/firsure
cp retreever_source/src/routes/firsure/+page.svelte retreever_selfkit/src/routes/firsure/

# Map components
cp -r retreever_source/src/lib/components/map retreever_selfkit/src/lib/components/

# Supabase
mkdir -p retreever_selfkit/src/lib
cp retreever_source/src/lib/supabase.ts retreever_selfkit/src/lib/

# Types
cp -r retreever_source/src/lib/types retreever_selfkit/src/lib/

# Static assets
cp -r retreever_source/static/claims retreever_selfkit/static/
cp -r retreever_source/static/geographic retreever_selfkit/static/

# Commit
cd retreever_selfkit
git add -A
git commit -m "Port map functionality from original retreever"
```

### PHASE 3: Port Dashboard
```bash
# Dashboard route
cp -r retreever_source/src/routes/dashboard retreever_selfkit/src/routes/

# Dashboard components
cp -r retreever_source/src/lib/components/dashboard retreever_selfkit/src/lib/components/

# TanStack table wrapper
cp -r retreever_source/src/lib/tanstackTable retreever_selfkit/src/lib/

# Utils (if not exists in SelfKit)
cp retreever_source/src/lib/utils.ts retreever_selfkit/src/lib/ 2>/dev/null || echo "utils.ts exists, merge manually"

git add -A
git commit -m "Port dashboard functionality"
```

### PHASE 4: Dependencies
```bash
cd retreever_selfkit

# Install map dependencies
npm install mapbox-gl @mapbox/mapbox-gl-draw @mapbox-controls/styles mapbox-gl-opacity maplibre-gl pmtiles @turf/turf
npm install --save-dev @types/mapbox__mapbox-gl-draw

# Install Supabase
npm install @supabase/supabase-js

# Install TanStack Table (if not in SelfKit)
npm install @tanstack/svelte-table

git add package.json package-lock.json
git commit -m "Add map + dashboard dependencies"
```

### PHASE 5: Environment Variables
```bash
# Copy .env or create new one
cat > .env.local << 'EOF'
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiY2hyaXN0b2JpbmhhcnJpcyIsImEiOiJjbWRtOXN4bXkwMmhwMmlwa2Z0aHdkaTA4In0.ZQ4nyAf69HoT_5gZ4rPEaQ
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF
```

### PHASE 6: CSS Integration
```bash
# Add Mapbox CSS to app.css
echo "
/* Mapbox styles */
@import 'mapbox-gl/dist/mapbox-gl.css';
@import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
@import 'mapbox-gl-opacity/dist/mapbox-gl-opacity.css';
" >> src/app.css

git add -A
git commit -m "Add map CSS imports"
```

### PHASE 7: Test & Fix
```bash
npm install
npm run dev

# Fix any import errors
# Fix any type errors
# Test map loads
# Test dashboard loads
# Test filtering works
```

### PHASE 8: Replace Original (FINAL STEP)
```bash
cd ~/Dropbox/DEV_PROJECTS/retreever_dir

# Backup original one more time
mv retreever retreever_old_$(date +%Y%m%d)

# Rename new SelfKit version
mv retreever_selfkit retreever

# Cleanup
rm -rf retreever_source
```

---

## POST-MIGRATION TASKS

### 1. Update Navigation
- Add map link to SelfKit navbar: `/firsure`
- Add dashboard link: `/dashboard`
- Update home page with spinning globe concept

### 2. Configure SelfKit Features
- Remove Koolify config
- Remove Plunk email config
- Keep analytics setup
- Configure SEO metadata
- Set blog to draft/unpublished

### 3. Supabase RLS
- Set up Row Level Security policies
- Configure auth integration if needed
- Test data access permissions

### 4. API Routes (If Keeping Proxies)
- Copy fly.dev proxy routes if needed
- Update any hardcoded URLs
- Test API connectivity

### 5. Styling Harmonization
- Map tooltips → match SelfKit design tokens
- Dashboard table → use SelfKit shadcn components
- Ensure monospace fonts loaded

---

## POTENTIAL GOTCHAS

1. **SelfKit may have conflicting routes** - Check for `/dashboard` or other conflicts
2. **Different Tailwind config** - May need to merge configs
3. **SSR issues** - Dashboard has `export const ssr = false`, ensure SelfKit respects this
4. **Large GeoJSON files (98MB)** - May hit deployment limits (Vercel 250MB max)
5. **Supabase client setup** - Ensure SelfKit doesn't override your client
6. **Type conflicts** - SelfKit may have different TypeScript setup

---

## ROLLBACK PLAN

If migration fails:
```bash
cd ~/Dropbox/DEV_PROJECTS/retreever_dir
rm -rf retreever
mv retreever_old_[DATE] retreever
```

Or use git branches:
```bash
cd retreever
git checkout pre-selfkit-backup
```

---

## WINDSURF SETUP

Once files are in place:

1. Open Windsurf with parent directory:
   ```bash
   cd ~/Dropbox/DEV_PROJECTS/retreever_dir
   # Open Windsurf here
   ```

2. Windsurf will see:
   - `retreever/` (original - will become backup)
   - `retreever_selfkit/` (new base + ported features)
   - `retreever_source/` (copy for extraction)

3. Use Windsurf AI to:
   - Fix import paths
   - Resolve type errors
   - Merge conflicting configs
   - Test functionality

---

## ESTIMATED TIMELINE

- **Setup (Phase 1):** 30 min
- **Port Map (Phase 2):** 1 hour
- **Port Dashboard (Phase 3):** 1 hour
- **Dependencies (Phase 4):** 30 min
- **Config (Phase 5-6):** 30 min
- **Test & Fix (Phase 7):** 2-4 hours
- **SelfKit Feature Removal (Post-migration):** 1 hour
- **Total: 6-9 hours**

---

## DECISIONS LOG

**Date:** 2025-11-15

1. ✅ **Dashboard:** Keep - filtering logic was hard to build
2. ✅ **Database:** Supabase (essential for data)
3. ✅ **GeoJSON:** Keep 98MB files (demo feature for later)
4. ✅ **Approach:** Option A (duplicate → clone SelfKit → port)
5. ❓ **API Routes:** Pending - keep fly.dev proxies?
6. ✅ **SelfKit Features:**
   - Remove: Koolify, Plunk
   - Keep: Analytics, SEO, Blog (unpublished), i18n, Legal
   - Core: shadcn-svelte + Tailwind v4

---

## NEXT STEPS

1. Clarify API routes decision (SQLite skip, proxies?)
2. Start Phase 1: Duplicate repos
3. Continue through phases sequentially
4. Open new Windsurf instance at parent dir when ready
