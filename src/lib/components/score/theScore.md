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
Org Field Score → avg project score across all projects this org is associated with
    ↓
Org Disclosure Ratio → what % of their claimed trees have they actually documented?
    ↓
Org Score → (orgPointsScored / orgPointsAvailible) × disclosureRatio  ← the ranking value
    ↓
Org Percentile (overall) → where does this org rank among ALL orgs?
    ↓
Org Primary Stakeholder Type → what role does this org play most often?
    ↓
Org Percentile by Type → where does this org rank within its primary category?
```

**The disclosure ratio is the most important factor in org scoring.** An org can have thoroughly documented projects and still score near zero if they've claimed to have planted millions of trees but only disclosed a few thousand. The platform is measuring transparency — not just field completeness. Most orgs will have disclosed a tiny fraction of what they claim — this is expected and intentional. The few orgs that have documented a meaningful percentage of their claimed work will rise to the top percentiles.

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
| System fields (IDs, timestamps, `deleted`, `editedBy`, `platformId`, etc.) | 0 | Not transparency signals |

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

A project in the 85th percentile has more complete documentation than 85% of all projects on the platform.

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

**Every local org must have a master.** If a local org has no master, auto-promote it: create a master using the local's name and data, link the local to it. No orphaned locals. The scoring system always aggregates at the master level.

### Tier 4 — Org Field Score

The average project score across all projects this master org is associated with:

1. Find all `OrganizationLocalTable` records for this master (via `organizationMasterId`)
2. Find all `StakeholderTable` rows for those locals (via `organizationLocalId`)
3. Get all `projectId` values from those rows
4. Look up the stored `Score.score` for each project
5. Aggregate → `orgPointsScored` (sum) and `orgPointsAvailible` (sum)

Field score = `orgPointsScored / orgPointsAvailible`. Stored as the numerator/denominator pair in `OrgScore` for display.

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
Field score on those 3 projects: 80%
Org score: 80% × 1% = 0.8%
```

This is intentional and expected. The vast majority of orgs will have a very low disclosure ratio. The few that have documented a meaningful percentage of their claimed work will dominate the top percentiles. The system rewards transparency above all else.

The `disclosureRatio` is capped at 1.0 — you cannot score above 100% even if `treesDisclosed` somehow exceeds `treesClaimed`.

**No claims = full disclosure.** If an org has no `ClaimTable` entries, `disclosureRatio = 1.0`. We can't penalise orgs for not making public claims — their project data stands on its own. Orgs with large claims are the ones measured against their marketing.

### Tier 6 — Org Score

```
orgScore = (orgPointsScored / orgPointsAvailible) × disclosureRatio
```

This is the number that everything else is ranked against. Stored as `OrgScore.orgScore`.

### Tier 7 — Org Percentile (Overall)

Where does this org rank among all orgs by `orgScore`?

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

Alphabetical tiebreaker for determinism. One type per org. Stored on `OrganizationMasterTable` and `OrgScore.primaryStakeholderType`.

**Percentile by type** = rank among orgs with the same primary stakeholder type:

```sql
ROUND(PERCENT_RANK() OVER (
    PARTITION BY primaryStakeholderType
    ORDER BY orgScore
) * 100)::int AS orgPercentileByType
```

An org in the 60th percentile overall might be in the 90th percentile within its category. The within-category percentile is the more actionable number for orgs comparing themselves to peers.

Stored as `OrgScore.orgPercentileByType`.

---

## Schema: Current State

All of the following have been applied:

- **`ClaimTable`** — uses `organizationMasterId` (not local) ✓
- **`OrganizationMasterTable`** — has `primaryStakeholderType StakeholderType?` ✓
- **`OrgScore`** — rationalized fields, current state:

```prisma
model OrgScore {
  orgScoreId              String           @id
  organizationMasterId    String           @unique

  // What users see — percentile is the primary display value
  orgPercentile           Int?             // rank among all orgs by orgScore
  orgPercentileByType     Int?             // rank among orgs with same primaryStakeholderType
  primaryStakeholderType  StakeholderType? // mode of StakeholderType across all project associations

  // Final transparency score — used for PERCENT_RANK; = (orgPointsScored/orgPointsAvailible) × disclosureRatio
  orgScore                Decimal

  // Disclosure components — what fraction of claimed trees are documented on the platform
  treesClaimed            Int              // sum of ClaimTable.claimCount for this org
  treesDisclosed          Int              // sum of PlantingTable.planted across associated projects
  disclosureRatio         Decimal          // treesDisclosed / treesClaimed, capped at 1.0

  // Field completeness across disclosed projects — numerator/denominator for display
  orgPointsScored         Int
  orgPointsAvailible      Int

  orgScoreDate            DateTime         @default(now()) @db.Timestamptz(3)
  deleted                 Boolean          @default(false)

  @@index([organizationMasterId])
  @@map("OrgScore")
}
```

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
  For each OrganizationMasterTable:
    → collect all StakeholderTable.stakeholderType values across all associated locals
    → MODE = primaryStakeholderType (alphabetical tiebreaker)
    → upsert OrganizationMasterTable.primaryStakeholderType

PHASE 3 — ORG SCORING
  For each OrganizationMasterTable:
    → find all locals → find all stakeholder rows → find all projectIds
    → sum Score.pointsScored → orgPointsScored
    → sum Score.pointsAvailible → orgPointsAvailible
    → sum ClaimTable.claimCount → treesClaimed
    → sum PlantingTable.planted across those projects → treesDisclosed
    → disclosureRatio = MIN(treesDisclosed / treesClaimed, 1.0)
    → orgScore = (orgPointsScored / orgPointsAvailible) × disclosureRatio
    → upsert OrgScore row (with primaryStakeholderType from Phase 2)

  Then: PERCENT_RANK() across all OrgScore.orgScore → OrgScore.orgPercentile
  Then: PERCENT_RANK() PARTITION BY primaryStakeholderType → OrgScore.orgPercentileByType
```

**Triggering:** Runs automatically at the end of every `./MASTER.sh orchestrator` run. To run standalone (requires dev server on :5173):

```bash
./MASTER.sh score
```

No cron needed. The batch is the orchestrator.

---

## Current Architecture

### Working
- **Dynamic project score** — `GET /api/score/report?projectId=...` — always live. Includes stored `percentile`.
- **Batch (all 3 phases)** — `POST /api/score/batch?code=...` — project scoring, org stakeholder type resolution, org scoring + all percentiles.
- **Percentile display** — `/what` dashboard card shows real value when available, amber `—` until batch has run.
- **Orchestrator hook** — `calcScore()` in `Foundr/scripts/orchestrator.ts` calls the batch as the final step after every pipeline run.

### Shared code
- `src/lib/server/score/fieldPoints.ts` — field weights, scored tables, table queries. Used by both endpoints.

### Legacy / to retire
- `GET/POST /api/score?code=...` — reads/refreshes `project_score_view` materialized view. Superseded. Safe to delete.
- `project_score_view` and `score_field_points()` SQL — still in DB. Safe to drop.

---

## What Needs to Happen Next

1. **Retire legacy endpoints** — delete `src/routes/api/score/+server.ts`, drop `project_score_view` and `score_field_points()` from DB (safe to do any time)
