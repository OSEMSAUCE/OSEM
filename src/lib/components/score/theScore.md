# The Score
**Updated: 21 Feb 2026**

---

## Overview: A Tiered Scoring System

Scoring is not a single number — it is a multi-level system where each tier feeds the next:

```
Field         → is this field populated? (pts per field)
    ↓
Project Score → sum of field pts / total possible pts = score %
    ↓
Project Percentile → where does this project rank among ALL projects?
    ↓
Org Score     → aggregate of all projects this org is associated with
    ↓
Org Percentile → where does this org rank among ALL orgs?
    ↓
Org by Stakeholder Type → org percentile within its category
                          (implementer vs funder vs verifier etc.)
```

Each tier is meaningfully different. A project with 60% data completeness might be in the 85th percentile if most projects are poorly documented. An org might have one great project and five thin ones — the aggregate tells a different story. Stakeholder type matters because an implementer and a funder have different data obligations.

This system is the integrity backbone of the platform. The tiers all the way up.

---

## Tier 1 — Field Level

Every database field is evaluated: is it populated (not null, not empty string)?

**Point weights:**

| Field | Points | Reason |
|-------|--------|--------|
| `geometry` | 20 | Proves the site physically exists |
| `gpsLat`, `gpsLon` | 5 each | High-value location verification |
| `cropName`, `speciesId` | 5 each | What's being planted |
| `plantingDate` | 5 | When work happened |
| `plotCenter`, `radius` | 5 each | Plot geometry definition |
| `planted` | 3 | Quantified impact |
| `stakeholderType` | 2 | Who's involved |
| `pricePerUnit`, `pricePerUnitUSD` | 2 each | Economic transparency |
| Everything else scoreable | 1 | General completeness |
| System fields (IDs, timestamps, `deleted`, `editedBy`, `platformId`, etc.) | 0 | Not data quality signals |

The weight table (`getFieldPoints()`) currently lives inside `/src/routes/api/score/report/+server.ts`. It should be extracted to `OSEM/src/lib/components/score/fieldPoints.ts` (not server-restricted) so it's importable by client code and readable as a transparent public artifact. **Not done yet.**

---

## Tier 2 — Project Score

```
score % = (sum of points for populated fields) / (sum of all possible points) × 100
```

Calculated dynamically per request via schema discovery:
1. Query `INFORMATION_SCHEMA.COLUMNS` to find all fields across the 8 scored tables
2. Fetch actual project data from those tables
3. Walk every field, apply point weight, check if populated
4. Return `scorePercentage`, `totalScoredPoints`, `totalPossiblePoints`, `allFields[]`

**Live path:**
```
GET /api/score/report?projectId=...
  → getFieldPoints()          (weight table, TypeScript)
  → INFORMATION_SCHEMA query  (field discovery)
  → 8 table data queries      (actual project data)
  → returns scoreReport       (single source of truth for display)
```

`data.scoreReport` is what the `/what` page displays. Both the score dashboard card and the field breakdown table read from this one object. They cannot diverge.

**Schema storage** (`Score` table in schema.prisma):
```prisma
model Score {
  scoreId         String       @id
  projectId       String       @unique
  score           Decimal
  pointsAvailible Int
  pointsScored    Int
  createdAt       DateTime     @default(now())
  deleted         Boolean      @default(false)
  projectTable    ProjectTable @relation(...)
  // percentile   Int?         ← needs adding (see Tier 3)
}
```

---

## Tier 3 — Project Percentile

**What it means:** Where does this project rank among all projects on the platform? A project with 60% data completeness might be in the 85th percentile if most projects are poorly documented. The raw score and the percentile tell different stories and both matter.

**Why it must be stored:** Percentile requires knowing the full distribution. You can't calculate "this project is in the Nth percentile" without all other project scores. Recalculating the entire distribution on every page load is not feasible.

**Calculation:** One SQL window function after the materialized view is refreshed:
```sql
SELECT
  "projectId",
  ROUND(PERCENT_RANK() OVER (ORDER BY score) * 100)::int AS percentile
FROM project_score_view
```
Then upsert each row into the `Score` table.

**Schema change needed:**
```prisma
model Score {
  ...
  percentile      Int?    ← add this
}
```
Pattern already established — `OrgScore` has `orgPercentile Int`.

**When to calculate:**
- `deploy_scoring()` in MASTER.sh already refreshes `project_score_view` (all project scores updated)
- Add the percentile upsert as the next step in `deploy_scoring()` — right after the view refresh, before the audit summary
- Both `orchestrator()` and `orchestrator_full()` call `deploy_scoring()`, so percentiles stay current on every orchestrator run
- On individual project upload: the existing flow already refreshes the view; percentiles will update on the next orchestrator run (acceptable — percentile rank shifts slowly)
- `orchestrator_full()` with `PROCESS_ALL_BEFORE_BOOKMARK=true` is the "make everything square" run — the right place for a guaranteed full recalculation

**Display:** The amber `—` slot in the score dashboard card on `/what` is reserved for this value.

**No cron job needed.** The orchestrator already runs on the right cadence.

---

## Tier 4 — Organization Score

Aggregate of all projects associated with an organization, weighted by the organization's role on each project (via `StakeholderTable.stakeholderType`).

**Schema:** `OrgScore` table (already exists):
```prisma
model OrgScore {
  orgScoreId           String
  organizationId       String
  organizationMasterId String       @unique
  orgScore             Decimal      // aggregate score
  orgPercentile        Int          // tier 5
  orgSubScore          Decimal
  orgPointsAvailible   Int
  orgPointsScored      Int
  claimCounted         Int
  orgSubScoreByClaim   Int          // tier 6
  stakeholderType      StakeholderType?
  stakeholderAverage   Decimal
}
```

The `OrgScore` model already anticipates tiers 4, 5, and 6 in its field structure.

---

## Tier 5 — Organization Percentile

Where does this org rank among all orgs? Same pattern as project percentile — window function over all `OrgScore` rows after calculation. Already has a field (`orgPercentile`).

---

## Tier 6 — Organization Percentile by Stakeholder Type

Orgs are further categorized by what role they play on projects (implementer, funder, verifier, etc. — via `StakeholderType` enum). An org's percentile within its category is a more meaningful comparison than ranking all orgs together.

`OrgScore.orgSubScoreByClaim` and `OrgScore.stakeholderType` are the schema hooks for this. Implementation is deferred but the data model is already there.

---

## Current Calculation Architecture

### What's live and working
- **Dynamic project score** via `/api/score/report` — field-by-field, no auth, drives the `/what` page display
- **Materialized view** `project_score_view` — all-projects summary, refreshed by `deploy_scoring()` in MASTER.sh

### What's orphaned / legacy
- The `/api/score` GET/POST endpoints read/write the materialized view — still used by MASTER.sh `calcScore()` and `deploy_scoring()`, but the page no longer reads from it for display
- The SQL `score_field_points()` PostgreSQL function is deployed to the DB and powers the view, but is a parallel implementation to the TypeScript `getFieldPoints()` — they use different approaches (hardcoded fields vs schema discovery) and can diverge. This was the root cause of the score mismatch. They need to be reconciled when the materialized view is repurposed for percentile storage.

### SQL files in this directory

| File | Status |
|------|--------|
| `scoreSourceTruth.sql` | Deploys `score_field_points()` fn + `project_score_view`. Function still active in DB. View still used by MASTER.sh but not by page display. Keep — will be repurposed for percentile upsert. |
| `scoreAudit.sql` | Reference only. Full field inventory with weights. Valid Supabase SQL editor tool. |
| `scoreAuditSummary.sql` | Reference only. Queries `project_score_view` for aggregate stats. |

---

## API Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/score/report?projectId=...` | None | Dynamic field-by-field breakdown. Drives page display. |
| `GET /api/score?code=...` | HELPER_CODE | Summary from materialized view. Admin/legacy. |
| `POST /api/score?code=...` | HELPER_CODE | Refreshes materialized view. Called by MASTER.sh. |

---

## What Needs to Happen Next

In priority order:

1. **Add `percentile Int?` to `Score` in schema.prisma** — one field, Prisma migration
2. **Add percentile upsert to `deploy_scoring()` in MASTER.sh** — SQL window function after view refresh, upserts to `Score` table
3. **Return percentile from `/api/score/report`** — read from `Score` table alongside dynamic calculation, include in response
4. **Wire the amber `—` slot** in the `/what` dashboard card to `data.scoreReport.percentile`
5. **Extract `getFieldPoints()` to `fieldPoints.ts`** — transparency + single editable location
6. **Reconcile SQL and TypeScript weight tables** — either retire `score_field_points()` SQL function or generate it from the TypeScript source
