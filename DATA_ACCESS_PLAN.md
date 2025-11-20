# OSEM Data Access Strategy

**Domain:** osemsauce.org  
**Owner:** ReTreever (data owner)  
**Purpose:** Public demo with limited/throttled data access

---

## Current State

- OSEM syncs components from ReTreever via `sync-to-osem.sh`
- Map components expect static GeoJSON files in `/static/claims/` and `/static/geographic/`
- Supabase client exists but should primarily use static data for demo

---

## Data Access Options

### Option 1: Static GeoJSON Only (Current/Recommended for Demo)

**Status:** Should be working but needs verification

**How it works:**

- Static files in `/static/claims/` and `/static/geographic/`
- No API calls, no rate limits needed
- Synced from ReTreever via rsync

**Pros:**

- No API key exposure risk
- Fast, no backend needed
- Perfect for public demo

**Cons:**

- Data gets stale (must re-sync to update)
- Limited to what's in static files

**Action items:**

- ✅ Verify static files exist in OSEM
- ⏳ Check map components are reading from `/static/` correctly
- ⏳ Test map loads with static data

---

### Option 2: Throttled Supabase Access (Future)

**Status:** Not implemented

**Strategy:**

- Create separate Supabase RLS policies for OSEM
- Limit to 50% of data or specific regions
- Use separate anon key with restricted permissions

**Implementation:**

```sql
-- Example RLS policy for OSEM (in ReTreever Supabase)
CREATE POLICY "osem_limited_access"
ON claims
FOR SELECT
USING (
  -- Only show 50% of claims (deterministic sampling)
  (hashtext(id::text)::bigint % 100) < 50
  OR
  -- Or limit by region/status
  status = 'approved'
);
```

**Security:**

- Separate `PUBLIC_SUPABASE_ANON_KEY` for OSEM
- RLS policies prevent full data access
- Key can be rotated independently
- Rate limiting at Supabase project level

**Pros:**

- Live data updates
- Controlled access via RLS
- Can show subset of data

**Cons:**

- Exposes Supabase URL (but protected by RLS)
- Requires careful RLS policy design
- API key in public repo (even if limited)

---

### Option 3: Proxy API (Most Secure, Future)

**Status:** Not implemented

**How it works:**

- ReTreever hosts API endpoint (e.g., `api.retreever.com/osem/claims`)
- OSEM calls this instead of Supabase directly
- Backend controls what data is returned
- No Supabase credentials exposed

**Pros:**

- Full control over data exposure
- No credential leaks
- Can add caching, rate limiting
- Can transform/filter data server-side

**Cons:**

- Requires backend infrastructure
- More complex to maintain

---

## Recommended Approach

**Phase 1 (Now):** Static data only

- Fix current static file loading issue
- No Supabase needed for OSEM
- Keep `.env.local` Supabase vars commented out

**Phase 2 (Later):** If live data needed

- Implement Option 2 (Throttled Supabase) with RLS policies
- Create OSEM-specific anon key with limited permissions
- Document which data is public vs. private

**Phase 3 (Future):** If security critical

- Build proxy API (Option 3)
- Migrate OSEM to use proxy instead of direct Supabase

---

## Current Issue

Map components are trying to import `$lib/supabase` but should be using static files.

**Next steps:**

1. ✅ Create `src/lib/supabase.ts` (done - with placeholder values)
2. Check if map components have static data fallback logic
3. Verify static GeoJSON files exist and are valid
4. Test map rendering with static data

---

## Static Data Sync

Current sync script copies:

```bash
# From sync-to-osem.sh
rsync -av "$RETRIEVER_DIR/static/claims/" "$OSEM_DIR/static/claims/"
rsync -av "$RETRIEVER_DIR/static/geographic/" "$OSEM_DIR/static/geographic/"
```

**To update OSEM data:**

```bash
cd /path/to/OSEM
npm run sync  # Runs sync-to-osem.sh
```
