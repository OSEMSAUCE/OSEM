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
Org Raw Data Score → avg data quality across all projects this org is associated with
    ↓
Org Disclosure Ratio → what % of their claimed trees have they actually documented?
    ↓
Adjusted Org Score → Raw Data Score × Disclosure Ratio  ← the real score
    ↓
Org Percentile (overall) → where does this org rank among ALL orgs by adjusted score?
    ↓
Org Primary Stakeholder Type → what role does this org play most often?
    ↓
Org Percentile by Type → where does this org rank within its primary category?
```

**The disclosure ratio is the most important factor in org scoring.** An org can have beautifully documented projects and still score near zero if they've claimed to have planted millions of trees but only disclosed a few thousand. The platform is measuring transparency, not just data quality. Most orgs will have disclosed a tiny fraction of what they claim — this is expected and intentional. The few orgs that have documented a high percentage of their claimed work will rise to the top percentiles.

Everything in this system is **stored in the database after a batch run**, not calculated on the fly. Percentile calculations require the full distribution — you cannot know where one entity ranks without knowing all others. Only the live project score (Tier 2) is calculated fresh per page load.

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

**Single source of truth:** `src/lib/server/score/fieldPoints.ts` — imported by both the live report endpoint and the batch endpoint. Edit weights here and both update instantly.

---

## Tier 2 — Project Score (Live, Per Page Load)

```
score % = (sum of points for populated fields) / (sum of all possible points) × 100
```

Calculated fresh on every `/what` page load. Discovers the database schema dynamically so new fields are automatically included without code changes.

**Live endpoint:**
```
GET /api/score/report?projectId=...   (no auth)
```

Returns: `scorePercentage`, `totalScoredPoints`, `totalPossiblePoints`, `percentile` (stored), `allFields[]`

**Stored in `Score` table** (one row per project, written by batch):
```prisma
model Score {
  scoreId         String   @id
  projectId       String   @unique
  score           Decimal          ← score %
  pointsAvailible Int
  pointsScored    Int
  percentile      Int?             ← populated by batch
  createdAt       DateTime
  deleted         Boolean
}
```

---

## Tier 3 — Project Percentile

After the batch scores every project, one SQL window function assigns percentiles:

```sql
ROUND(PERCENT_RANK() OVER (ORDER BY score) * 100)::int AS percentile
```

A project in the 85th percentile has more complete data than 85% of all projects on the platform.

---

## Tiers 4–8 — Organization Scoring

### The data model

```
OrganizationMasterTable     ← canonical identity (one per real-world org)
      has many ↓
OrganizationLocalTable      ← regional/platform instance of that org
      linked via ↓ organizationLocalId
StakeholderTable            ← org × project relationship, with stakeholderType per row
ClaimTable                  ← how many trees this org claims to have planted
                               (linked to organizationMasterId — master IDs only)
```

**Every local org must have a master.** If a local org has no master, auto-promote it: create a master using the local's name and data, link the local to it. No orphaned locals. The scoring system always goes through master.

### Tier 4 — Org Raw Data Score

The average data quality score across all projects this master org is associated with:

1. Find all `OrganizationLocalTable` records for this master (via `organizationMasterId`)
2. Find all `StakeholderTable` rows for those locals (via `organizationLocalId`)
3. Get all `projectId` values from those rows
4. Look up the stored `Score.score` for each project
5. Average them → `rawDataScore`

This is stored in `OrgScore.rawDataScore`.

### Tier 5 — Disclosure Ratio (the key differentiator)

The disclosure ratio measures how much of what an org *claims* they've planted they have actually *documented* on the platform.

```
disclosureRatio = treesDisclosed / treesClaimed
```

- **`treesClaimed`** — sum of `ClaimTable.claimCount` for this master org. This is what the org publicly states they have planted.
- **`treesDisclosed`** — sum of `PlantingTable.planted` across all projects associated with this org on the platform. This is what they have actually documented with verifiable data.

**Example:**
```
Org claims:     10,000,000 trees planted
Org documented: 100,000 trees across 3 projects
Disclosure ratio: 1%
Raw data score on those 3 projects: 80%
Adjusted org score: 80% × 1% = 0.8%
```

This is intentional and expected. The vast majority of orgs will have a very low disclosure ratio. The few that have documented a meaningful percentage of their claimed work will dominate the top percentiles. The system rewards transparency above all else.

The `disclosureRatio` is capped at 1.0 — you cannot score above 100% even if `treesDisclosed` somehow exceeds `treesClaimed`.

### Tier 6 — Adjusted Org Score

```
adjustedOrgScore = rawDataScore × disclosureRatio
```

This is the number that everything else is ranked against. It is stored as `OrgScore.orgScore`.

### Tier 7 — Org Percentile (Overall)

Where does this org rank among all orgs by `adjustedOrgScore`?

```sql
ROUND(PERCENT_RANK() OVER (ORDER BY orgScore) * 100)::int AS orgPercentile
```

Stored as `OrgScore.orgPercentile`.

### Tier 8 — Primary Stakeholder Type and Percentile by Type

**Primary stakeholder type** = the `StakeholderType` that appears most often across all `StakeholderTable` rows for all locals under this master:

```
developer × 8 projects
nursery   × 2 projects
→ primaryStakeholderType = developer
```

Alphabetical tiebreaker for determinism. One type per org.

Stored on both `OrganizationLocalTable` (for that local's own associations) and `OrganizationMasterTable` (aggregated across all locals). Also stored on `OrgScore.primaryStakeholderType`.

**Percentile by type** = rank among orgs with the same primary stakeholder type:

```sql
ROUND(PERCENT_RANK() OVER (
    PARTITION BY primaryStakeholderType
    ORDER BY orgScore
) * 100)::int AS orgPercentileByType
```

An implementer org in the 60th percentile overall might be in the 90th percentile among implementers. The within-category percentile is the more actionable number.

Stored as `OrgScore.orgPercentileByType`.

---

## Schema: What Needs to Change

### `ClaimTable` — change FK from local to master
```prisma
// Change:
organizationLocalId  String   → organizationMasterId  String
// Update relation accordingly
```

### `OrganizationLocalTable` — add primary stakeholder type
```prisma
primaryStakeholderType  StakeholderType?
```

### `OrganizationMasterTable` — add primary stakeholder type
```prisma
primaryStakeholderType  StakeholderType?
```

### `OrgScore` — rationalize all fields

Current fields are confusing and some are orphaned. The clean version:

```prisma
model OrgScore {
  orgScoreId              String           @id
  organizationMasterId    String           @unique

  // Data quality across disclosed projects
  rawDataScore            Decimal          // avg of project scores
  orgPointsScored         Int
  orgPointsAvailible      Int

  // Disclosure ratio
  treesClaimed            Int              // sum of ClaimTable.claimCount
  treesDisclosed          Int              // sum of PlantingTable.planted
  disclosureRatio         Decimal          // treesDisclosed / treesClaimed, 0.0–1.0

  // Final score used for all ranking
  orgScore                Decimal          // rawDataScore × disclosureRatio

  // Stakeholder type
  primaryStakeholderType  StakeholderType?

  // Percentiles
  orgPercentile           Int?             // rank among all orgs
  orgPercentileByType     Int?             // rank among orgs with same primary type

  orgScoreDate            DateTime         @default(now())
  deleted                 Boolean          @default(false)

  @@index([organizationMasterId])
  @@map("OrgScore")
}
```

Fields being removed and why:
- `organizationLocalId` — no foreign key, no relation, no clear purpose at master level
- `organizationId` — same issue
- `orgSubScore` — renamed to `rawDataScore`
- `claimCounted` — renamed to `treesClaimed`
- `orgSubScoreByClaim` — renamed to `orgPercentileByType` / restructured
- `stakeholderType` — renamed to `primaryStakeholderType`
- `stakeholderAverage` — removed (unclear purpose, not needed with the new structure)

---

## The Batch: Full Data Flow

```
POST /api/score/batch?code=<HELPER_CODE>

PHASE 1 — PROJECT SCORING
  For each project:
    → score all 8 tables via getFieldPoints()
    → upsert Score row
  Then: PERCENT_RANK() across all Score.score values → Score.percentile

PHASE 2 — ORG STAKEHOLDER TYPE RESOLUTION
  For each OrganizationLocalTable:
    → count StakeholderTable.stakeholderType occurrences
    → MODE = primaryStakeholderType
    → upsert OrganizationLocalTable.primaryStakeholderType

  For each OrganizationMasterTable:
    → collect all locals' primaryStakeholderType values
    → MODE = master's primaryStakeholderType
    → upsert OrganizationMasterTable.primaryStakeholderType

PHASE 3 — ORG SCORING
  For each OrganizationMasterTable:
    → find all locals → find all stakeholder rows → find all projectIds
    → average Score.score across those projects → rawDataScore
    → sum ClaimTable.claimCount → treesClaimed
    → sum PlantingTable.planted across those projects → treesDisclosed
    → disclosureRatio = MIN(treesDisclosed / treesClaimed, 1.0)
    → orgScore = rawDataScore × disclosureRatio
    → upsert OrgScore row

  Then: PERCENT_RANK() across all OrgScore.orgScore → OrgScore.orgPercentile
  Then: PERCENT_RANK() PARTITION BY primaryStakeholderType → OrgScore.orgPercentileByType
```

**Triggering:** Call the batch from your orchestrator / missMeta / whatever pipeline runs after bulk data changes. No cron needed. The batch is the orchestrator.

---

## Current Architecture

### Working
- **Dynamic project score** — `GET /api/score/report?projectId=...` — always live. Includes stored `percentile`.
- **Batch project scoring** — `POST /api/score/batch?code=...` — Phase 1 only (project scoring + percentiles). Phases 2–3 not yet implemented.
- **Percentile display** — `/what` dashboard card shows real value when available, amber `—` until batch has run.

### Shared code
- `src/lib/server/score/fieldPoints.ts` — field weights, scored tables, table queries. Used by both endpoints.

### Legacy / to retire
- `GET/POST /api/score?code=...` — reads/refreshes `project_score_view` materialized view. Superseded. Safe to delete.
- `project_score_view` and `score_field_points()` SQL — still in DB. Safe to drop.

---

## What Needs to Happen Next

1. **Schema migration** — apply the `OrgScore` rationalization, add `primaryStakeholderType` to both org tables, change `ClaimTable` FK from `organizationLocalId` to `organizationMasterId`
2. **Auto-promote orphaned locals** — one-time migration: for every local with no master, create a master from its data and link it
3. **Implement batch Phases 2–3** — org stakeholder type resolution + org scoring with disclosure ratio
4. **Trigger batch from pipeline** — call `POST /api/score/batch` as the final step of orchestrator / missMeta
5. **Retire legacy endpoints** — delete `GET/POST /api/score`, drop view and function from DB
