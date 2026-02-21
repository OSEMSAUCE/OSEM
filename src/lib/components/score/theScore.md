# The Score.md
**Updated: 20 Feb 2026 - Unified Transparent Scoring System Complete**

## Current Status ✅
- **Dynamic scoring via schema discovery** - Real-time calculation from database structure
- **Single source of truth:** `dynamicScoring.ts` contains complete transparent scoring logic
- **Public API endpoints:** No authentication required for full transparency
- **Scores:** ~38% average (realistic range based on actual data completeness)
- **Performance:** Direct database queries with efficient field analysis
- **Data governance focus:** Projects with geometry (20pts) + GPS coordinates (5pts each) + good stakeholder data score highest
- **Real-time calculation:** No pre-calculation needed, scores reflect current database state
- **Unified endpoints:** One calculation method, two response formats (summary + detailed)

## Recent Major Update (Feb 20, 2026)
- **Unified scoring system:** Consolidated from dual calculation methods to single transparent approach
- **Moved logic to OSEM:** All scoring code now in `/OSEM/src/lib/components/score/dynamicScoring.ts` for transparency
- **Fixed score discrepancy:** Eliminated difference between materialized view (93pts) and dynamic discovery (104pts)
- **Public API:** Removed authentication requirement - anyone can query project scores
- **Proper endpoint nesting:** `/api/score` (summary) and `/api/score/report` (detailed breakdown)
- **Single calculation:** Both endpoints use identical logic, just different response formats

---

## How The Unified Scoring System Works

### Core Concept
Projects are scored based on **data completeness** across all database tables. Each field has a point value based on its importance for transparency and verification.

### Point Values
- **Geometry (20 pts)** - Proves the site physically exists
- **GPS coordinates (5 pts each)** - High-value location data  
- **Species/crop data (5 pts)** - What's being planted
- **Planting dates (5 pts)** - When work happened
- **Tree counts (3 pts)** - Quantified impact
- **Stakeholder info (2 pts)** - Who's involved
- **Everything else (1 pt)** - General completeness

### Calculation Method
1. **Discover all database fields** via `INFORMATION_SCHEMA.COLUMNS`
2. **Check each field** for actual data (not null/empty)
3. **Apply point weights** based on field importance
4. **Calculate percentage**: `(points_scored / points_available) * 100`

### Files Structure
```
/OSEM/src/lib/components/score/
├── dynamicScoring.ts    — Single source of truth (transparent logic)
├── scoreSourceTruth.sql — Legacy reference (kept for comparison)
└── theScore.md         — This documentation

/src/routes/api/score/
├── +server.ts          — Summary endpoint
└── report/+server.ts   — Detailed breakdown
```

---

## API Usage

### New Unified Scoring System (Feb 20, 2026)

**Get project score summary:**
```bash
curl "http://localhost:5173/api/score?projectId=b|projectName:1661949769192"
```
Returns: `{"projectId": "...", "score": 38.5, "pointsScored": 40, "pointsAvailable": 104}`

**Get detailed score breakdown:**
```bash
curl "http://localhost:5173/api/score/report?projectId=b|projectName:1661949769192"
```
Returns: Full field-by-field analysis with ✅/❌ status for every database column

### Key Features:
- **No authentication required** - Public API for transparency
- **Real-time calculation** - No pre-calculation needed, reflects current data
- **Single source of truth** - Both endpoints use identical logic from `dynamicScoring.ts`
- **Database schema discovery** - Automatically finds all fields via `INFORMATION_SCHEMA`

---

## Summary

The scoring system is now **unified, transparent, and dynamic**:

- **One calculation method** in `dynamicScoring.ts` 
- **Two API endpoints** with identical logic, different formats
- **Public access** for full transparency
- **Real-time schema discovery** - no hardcoded field lists
- **Consistent results** - eliminated scoring discrepancies

All scoring logic is visible in the open-source OSEM directory, making the system fully auditable and trustworthy.