# The Score
**Updated: 9 Mar 2026**

---

## Table of Contents

1. [Overview: A Tiered Scoring System](#overview-a-tiered-scoring-system)
2. [Tier 1 — Field Level](#tier-1--field-level)
3. [Tier 2 — Project Score](#tier-2--project-score-live-per-page-load)
4. [Tier 3 — Project Percentile](#tier-3--project-percentile)
5. [Tiers 4–8 — Organization Scoring](#tiers-48--organization-scoring)
6. [Bonusable Table Concept](#bonusable-table-concept)
7. [Scoring Examples](#scoring-examples)
8. [Schema: Current State](#schema-current-state)
9. [The Batch: Full Data Flow](#the-batch-full-data-flow)
10. [Running Score Calculations](#running-score-calculations)
11. [Score Display — Tiers](#score-display--tiers)
12. [Current Architecture](#current-architecture)
13. [Cube.js Semantic Layer](#cubejs-semantic-layer)
14. [Testing & Verification](#testing--verification)
15. [What Needs to Happen Next](#what-needs-to-happen-next)

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

**The disclosure ratio is the most important factor in org scoring.** An org can have thoroughly documented projects and still score near zero if they've claimed to have plantedQty millions of trees but only disclosed a few thousand. The platform is measuring transparency — not just field completeness. Most orgs will have disclosed a tiny fraction of what they claim — this is expected and intentional. The few orgs that have documented a meaningful percentage of their claimed work will rise to the top percentiles.

Everything in this system is **stored in the database after a batch run**, not calculated on the fly. Percentile calculations require the full distribution — you cannot know where one entity ranks without knowing all others. Only the live project score (Tier 2) is calculated fresh per page load.

---

## Tier 1 — Field Level

Every database field is evaluated: is it populated (not null, not empty string)?

**Point weights:**

| Field | Points | Reason |
|-------|--------|--------|
| `geometry` | 20 | Proves the site physically exists |
| `latitude`, `longitude` | 5 each | High-value location verification |
| `cropName`, `speciesId` | 5 each | What's being plantedQty |
| `plantingDate` | 5 | When work happened |
| `plotCenter`, `radius` | 5 each | Plot geometry definition |
| `plantedQty` | 3 | Quantified impact |
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
GET /api/score/report?projectKey=...   (no auth)
```

Returns: `scorePercentage`, `totalScoredPoints`, `totalPossiblePoints`, `percentile` (stored), `allFields[]`

**Stored in `Score` table** (one row per project, written by batch):
```prisma
model Score {
  scoreId         String   @id
  projectKey       String   @unique
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

## Bonusable Table Concept

**Bonusable tables** use a **mandatory baseline + bonus** model where:

- **Baseline (always applied)**: All projects are scored against one record's worth of baseline fields
  - If project has 0 records → baseline fields scored as `awarded=false` (penalty)
  - If project has 1+ records → first record establishes baseline (all fields count)
- **Bonus (additional records)**: Only populated fields count (empty fields ignored)

This ensures all projects meet minimum data requirements while incentivizing breadth.

### Why Mandatory Baseline?

**Every project must provide baseline data** for CropTable, SourceTable, StakeholderTable, and PlantingTable:

- Projects planting trees **must** document what species (CropTable baseline)
- Projects **must** cite sources (SourceTable baseline)
- Projects **must** identify stakeholders (StakeholderTable baseline)
- Projects **must** report planting data (PlantingTable baseline)

**Without baseline requirement:**
- Project with 0 sources = 0/0 = undefined (no penalty)
- Project could score 100% by only filling ProjectTable perfectly
- **This is broken** - tree planting projects need sources, crops, etc.

**With mandatory baseline:**
- Project with 0 sources = 0/6 baseline fields = 0% on SourceTable
- Project with 1 source, 3 fields = 3/6 baseline fields = 50% on SourceTable
- Project with 10 sources, 3 fields each = 3/6 baseline + 27 bonus = 500% (capped at 100%)
- **Additional records only add bonus points** (no penalty for sparse data)

### Table Classification

**Standard Tables** (all fields always count):
- **ProjectTable**: Single record, all fields count
- **LandTable**: Expected to have complete data
- **PolygonTable**: Geographic data, completeness matters
- **PolyTable**: Motivation/type data, should be complete

**Bonusable Tables** (first record = baseline, additional records = bonus):
- **CropTable**: Baseline required, additional species = bonus
- **SourceTable**: Baseline required, additional sources = bonus
- **StakeholderTable**: Baseline required, additional = bonus
- **PlantingTable**: Baseline required, additional = bonus

### Baseline Fields

**CropTable** (7 fields):
- `cropName`, `speciesLocalName`, `speciesId`, `seedInfo`, `cropStock`, `organizationName`, `cropDesc`

**SourceTable** (6 fields):
- `url`, `urlType`, `disclosureType`, `sourceDescription`, `sourceCredit`, `stakeholderType`

**StakeholderTable** (2 fields):
- `organizationKey`, `stakeholderType`

**PlantingTable** (8 fields):
- `plantedQty`, `allocatedQty`, `plantingDate`, `units`, `unitType`, `pricePerUnit`, `currency`, `pricePerUnitUSD`

---

## Scoring Examples

### Example 1: Project with Zero Sources (Baseline Penalty)

**Scenario**: Project has no SourceTable records

```
Baseline fields (6 fields, all awarded=false):
  - url: ✗ (1 point available, 0 awarded)
  - urlType: ✗ (1 point available, 0 awarded)
  - disclosureType: ✗ (1 point available, 0 awarded)
  - sourceDescription: ✗ (1 point available, 0 awarded)
  - sourceCredit: ✗ (1 point available, 0 awarded)
  - stakeholderType: ✗ (2 points available, 0 awarded)

Total: 7 points available, 0 points awarded = 0% on SourceTable
```

### Example 2: Project with 3 Sources (Baseline + Bonus)

**Scenario**: Project has 3 sources with varying completeness

```
Source 1 (baseline - first record, all fields count):
  - url: ✓ (1 point awarded)
  - urlType: ✓ (1 point awarded)
  - disclosureType: ✗ (1 point available, 0 awarded)
  - sourceDescription: ✗ (1 point available, 0 awarded)
  - sourceCredit: ✗ (1 point available, 0 awarded)
  - stakeholderType: ✗ (2 points available, 0 awarded)
  Subtotal: 7 points available, 2 points awarded

Source 2 (bonus - only populated fields count):
  - url: ✓ (+1 bonus point)
  - urlType: ✓ (+1 bonus point)
  - disclosureType: ✗ (ignored, no penalty)
  - ... other empty fields (ignored, no penalty)
  Subtotal: +2 bonus points

Source 3 (bonus - only populated fields count):
  - url: ✓ (+1 bonus point)
  - urlType: ✓ (+1 bonus point)
  - stakeholderType: ✓ (+2 bonus points)
  - ... other empty fields (ignored, no penalty)
  Subtotal: +4 bonus points

Total: 7 points available, 8 points awarded = 114% (capped at 100%)
```

---

## Tiers 4–8 — Organization Scoring

### The data model

```
organizationTable     ← canonical identity (one per real-world org)
      has many ↓
OrganizationTable      ← regional/platform instance of that org
      linked via ↓ organizationKey
StakeholderTable            ← org × project relationship, with stakeholderType per row
ClaimTable                  ← how many trees this org claims to have plantedQty
                               (linked to organizationKey — parent IDs only)
```

**Every local org must have a parent.** If a local org has no parent, auto-promote it: create a parent using the local's name and data, link the local to it. No orphaned locals. The scoring system always aggregates at the parent level.

### Tier 4 — Org Field Score

The average project score across all projects this parent org is associated with:

1. Find all `OrganizationTable` records for this parent (via `organizationKey`)
2. Find all `StakeholderTable` rows for those locals (via `organizationKey`)
3. Get all `projectKey` values from those rows
4. Look up the stored `Score.score` for each project
5. Aggregate → `orgPointsScored` (sum) and `orgPointsAvailible` (sum)

Field score = `orgPointsScored / orgPointsAvailible`. Stored as the numerator/denominator pair in `OrgScore` for display.

### Tier 5 — Disclosure Ratio (the key differentiator)

The disclosure ratio measures how much of what an org *claims* they've plantedQty they have actually *documented* on the platform.

```
disclosureRatio = treesDisclosed / treesClaimed
```

- **`treesClaimed`** — sum of `ClaimTable.claimQty` for this parent org. This is what the org publicly states they have plantedQty.
- **`treesDisclosed`** — sum of `PlantingTable.plantedQty` across all projects associated with this org on the platform. This is what they have actually documented with verifiable data.

**Example:**
```
Org claims:     10,000,000 trees plantedQty
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

**Primary stakeholder type** = the `StakeholderType` that appears most often across all `StakeholderTable` rows for all locals under this parent:

```
developer × 8 projects
nursery   × 2 projects
→ primaryStakeholderType = developer
```

Alphabetical tiebreaker for determinism. One type per org. Stored on `organizationTable` and `OrgScore.primaryStakeholderType`.

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

- **`ClaimTable`** — uses `organizationKey` (not local) ✓
- **`organizationTable`** — has `primaryStakeholderType StakeholderType?` ✓
- **`OrgScore`** — rationalized fields, current state:

```prisma
model OrgScore {
  orgScoreId              String           @id
  organizationKey    String           @unique

  // What users see — percentile is the primary display value
  orgPercentile           Int?             // rank among all orgs by orgScore
  orgPercentileByType     Int?             // rank among orgs with same primaryStakeholderType
  primaryStakeholderType  StakeholderType? // mode of StakeholderType across all project associations

  // Final transparency score — used for PERCENT_RANK; = (orgPointsScored/orgPointsAvailible) × disclosureRatio
  orgScore                Decimal

  // Disclosure components — what fraction of claimed trees are documented on the platform
  treesClaimed            Int              // sum of ClaimTable.claimQty for this org
  treesDisclosed          Int              // sum of PlantingTable.plantedQty across associated projects
  disclosureRatio         Decimal          // treesDisclosed / treesClaimed, capped at 1.0

  // Field completeness across disclosed projects — numerator/denominator for display
  orgPointsScored         Int
  orgPointsAvailible      Int

  orgScoreDate            DateTime         @default(now()) @db.Timestamptz(3)
  deleted                 Boolean          @default(false)

  @@index([organizationKey])
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
  For each organizationTable:
    → collect all StakeholderTable.stakeholderType values across all associated locals
    → MODE = primaryStakeholderType (alphabetical tiebreaker)
    → upsert organizationTable.primaryStakeholderType

PHASE 3 — ORG SCORING
  For each organizationTable:
    → find all locals → find all stakeholder rows → find all projectKeys
    → sum Score.pointsScored → orgPointsScored
    → sum Score.pointsAvailible → orgPointsAvailible
    → sum ClaimTable.claimQty → treesClaimed
    → sum PlantingTable.plantedQty across those projects → treesDisclosed
    → disclosureRatio = MIN(treesDisclosed / treesClaimed, 1.0)
    → orgScore = (orgPointsScored / orgPointsAvailible) × disclosureRatio
    → upsert OrgScore row (with primaryStakeholderType from Phase 2)

  Then: PERCENT_RANK() across all OrgScore.orgScore → OrgScore.orgPercentile
  Then: PERCENT_RANK() PARTITION BY primaryStakeholderType → OrgScore.orgPercentileByType
```

**Triggering:** Runs automatically at the end of every `./CLI.sh orchestrator` run. To run standalone (requires dev server on :5173):

```bash
./CLI.sh score
```

No cron needed. The batch is the orchestrator.

---

## Running Score Calculations

### Commands

```bash
# Global scoring (manual full recalculation)
./CLI.sh global_score_projects    # Score ALL projects (granular + aggregated)
./CLI.sh global_score_orgs        # Score ALL organizations
./CLI.sh rank_projects            # Rank ALL projects (percentiles)
./CLI.sh rank_orgs                # Rank ALL organizations (percentiles)

# Batch scoring (orchestrator use only)
# Called automatically by orchestrator after batch upsert
# Can test manually: tsx OSEM/score_scripts/calc_batch_score_projects.ts <projectKey1> <projectKey2>

# Cube.js semantic layer
./CLI.sh start_cube               # Opens playground at http://localhost:4000
```

### Recalculating Scores

To regenerate all scores from scratch:

```bash
# Delete existing scores
psql $DIRECT_URL -c 'DELETE FROM "ProjectScore_granular_helper"'
psql $DIRECT_URL -c 'DELETE FROM "ProjectScore_agg_helper"'
psql $DIRECT_URL -c 'DELETE FROM "OrgScore_helper"'

# Regenerate everything
./CLI.sh global_score_projects
./CLI.sh global_score_orgs
./CLI.sh rank_projects
./CLI.sh rank_orgs
```

### Scripts in this Directory

**Projects:**
- **calc_batch_score_projects.ts** - Score specific projects (granular + aggregated)
- **calc_global_score_projects.ts** - Score ALL projects (calls batch_score_projects with all IDs)
- **calc_rank_projects.ts** - Rank ALL projects (percentiles via SQL window function)

**Organizations:**
- **calc_batch_score_orgs.ts** - Score specific orgs (or all if no IDs provided)
- **calc_global_score_orgs.ts** - Score ALL orgs (calls batch_score_orgs with no args)
- **calc_rank_orgs.ts** - Rank ALL orgs (percentiles via SQL window function)

### Performance: Batch vs Global Scoring

**The 6 Operations:**

| Operation | Scope | Output | Performance | When to Use |
|-----------|-------|--------|-------------|-------------|
| `batch_score_projects` | Specific projects | Scores (0.0-1.0) | ~2-5 sec for 50 | Orchestrator (new projects only) |
| `global_score_projects` | ALL projects | Scores (0.0-1.0) | ~5-10 min for 10K | Manual full recalc |
| `rank_projects` | ALL projects | Ranks (0-100) | <1 sec for 10K | After any scoring (always global) |
| `batch_score_orgs` | Specific/all orgs | Scores (0.0-1.0) | ~2-3 sec for all | Orchestrator (all orgs are fast) |
| `global_score_orgs` | ALL orgs | Scores (0.0-1.0) | ~2-3 sec for all | Manual full recalc |
| `rank_orgs` | ALL orgs | Ranks (0-100) | <1 sec for all | After any scoring (always global) |

**Orchestrator workflow** (after batch upsert):
1. `batch_score_projects(newprojectKeys)` - score only new projects
2. `batch_score_orgs()` - recalc all orgs (fast anyway)
3. `rank_projects()` - re-rank all projects (fast SQL)
4. `rank_orgs()` - re-rank all orgs (fast SQL)
**Total: ~5-10 seconds**

**Manual full recalculation:**
1. `global_score_projects` - score all projects (~5-10 min)
2. `global_score_orgs` - score all orgs (~2-3 sec)
3. `rank_projects` - rank all projects (<1 sec)
4. `rank_orgs` - rank all orgs (<1 sec)
**Total: ~5-10 minutes**

**Key insight:** Ranking (percentiles) is always global and always fast, so we can re-rank everything after each batch.

### Organization Scoring Strategy

**Organization score = average of all project scores for that organization**

This approach is:
- **Faster**: Reuses already-calculated project scores instead of re-aggregating thousands of granular scores
- **Fairer**: Each project counts equally, regardless of size
- **Simpler**: "This org's average project score is 75%" is easier to understand
- **Cached**: Project scores are already in `ProjectScore_agg_helper`

**Example:**
- Org has 3 projects with scores: 0.80, 0.60, 0.90
- org_score_pre_claim = (0.80 + 0.60 + 0.90) / 3 = 0.767
- sum_claimed = 10,000 trees, sum_plantedQty = 5,000 trees
- Disclosure ratio = 5,000 / 10,000 = 0.5 (50% disclosed)
- org_score_final = 0.767 × 0.5 = 0.383 (38.3% after penalty)

**Field Naming Convention:**
- **Scores** (0.0-1.0 decimal): `project_score`, `org_score_pre_claim`, `org_score_final`
- **Ranks** (0-100 integer): `project_rank`, `org_rank_overall`, `org_rank_by_type`
- Aggregations: `sum_*` (e.g., `sum_claimed`, `sum_plantedQty`)
- Flags: `is_*` (e.g., `is_awarded`)
- IDs and metadata: camelCase (e.g., `projectKey`, `lastUpdated`)

**Visual distinction:**
- Score of `0.847` = 84.7% performance
- Rank of `73` = 73rd percentile

---

## Score Display — Tiers

The org score (0–100 percentile) is broken into four labeled tiers for human readability:

| Score | Label | Color | What it means |
|---|---|---|---|
| 0–35 | **Opaque** | red | Bottom third. Little to no data available. |
| 36–70 | **Partial** | amber | Average disclosure. Some data, gaps remain. |
| 71–90 | **Open** | green | Well above average. Most key information accessible. |
| 91–100 | **Transparent** | deep green | Top 10%. Comprehensive disclosure. |

### Display rules
- Tier label appears beneath the score number on `/who/[orgId]`
- Color: Tailwind `text-red-500` → `text-amber-500` → `text-green-500` → `text-green-700`
- No tooltips — a collapsible legend ("How the ReTreever Score works") lives inside the hero card
- Template: `OSEM/src/lib/components/who/whoSpecific-template.svelte` — hero section

### What "score" means in the display
- **ReTreever Score** (column 1, gold) = `orgPercentile` — rank among all orgs
- **Data Completeness** (column 2, white) = `Math.round(orgScore * 100)%` — field score × disclosure ratio

---

## Current Architecture

### Working
- **Dynamic project score** — `GET /api/score/report?projectKey=...` — always live. Includes stored `percentile`.
- **Batch (all 3 phases)** — `POST /api/score/batch?code=...` — project scoring, org stakeholder type resolution, org scoring + all percentiles.
- **Percentile display** — `/what` dashboard card shows real value when available, amber `—` until batch has run.
- **Org score display** — `/who/[orgId]` shows 2-column hero: orgPercentile (gold, with tier label) + data completeness (white). Collapsible tier legend below.
- **Orchestrator hook** — `calcScore()` in `Foundr/scripts/orchestrator.ts` calls the batch as the final step after every pipeline run.

### Shared code
- `src/lib/server/score/fieldPoints.ts` — field weights, scored tables, table queries. Used by both endpoints.

### Legacy / to retire
- `GET/POST /api/score?code=...` — reads/refreshes `project_score_view` materialized view. Superseded. Safe to delete.
- `project_score_view` and `score_field_points()` SQL — still in DB. Safe to drop.

---

## Cube.js Semantic Layer

### What is Cube.js?

Cube.js is a **semantic layer** that sits between your database and your application. It:
- Defines metrics (measures) and dimensions in schema files
- Enforces consistent definitions (if the schema is wrong, queries fail)
- Provides an API to query metrics
- Caches results for performance

**Why use it?**
- **Enforced conventions**: Schema files must be valid or Cube.js won't start
- **Self-documenting**: The schema IS the documentation
- **AI-readable**: Standard format that any AI can understand
- **No drift**: You can't accidentally use wrong field names

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Application                        │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Cube.js                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Schema Files (model/*.yml)                          │    │
│  │  - Dimensions (what you group by)                    │    │
│  │  - Measures (what you compute)                       │    │
│  │  - Joins (how tables relate)                         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────┘
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Supabase)                     │
│  - ProjectTable, OrganizationTable, etc.                    │
│  - ProjectScore_agg_helper, OrgScore_helper                 │
└─────────────────────────────────────────────────────────────┘
```

### Setup

**Directory structure:**
```
ReTreever/
└── cube/
    ├── docker-compose.yml
    ├── .env
    └── model/
        ├── projects.yml
        └── organizations.yml
```

**Running Cube.js:**
```bash
./CLI.sh start_cube
# Opens playground at http://localhost:4000
```

### Cube.js Vocabulary

| Cube.js Term | Your System | Example |
|--------------|-------------|---------|
| **Cube** | Table | `ProjectScore_agg_helper` |
| **Dimension** | Attribute/Field | `projectKey`, `organizationName` |
| **Measure** | Computed Field | `project_pct_score`, `org_pct_final` |
| **Join** | Relation | Project → Org via Stakeholder |

### Querying via API

Once running, query metrics via REST API:

```bash
curl http://localhost:4000/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -d '{
    "measures": ["org_scores.org_pct_final"],
    "dimensions": ["org_scores.organization_name"],
    "order": {"org_scores.org_pct_final": "desc"},
    "limit": 10
  }'
```

### Schema Files

Schema files define your metrics:
- `cube/model/projects.yml` - Project scoring metrics
- `cube/model/organizations.yml` - Organization scoring metrics

**Dimensions** = attributes you group/filter by (project name, org name, stakeholder type)
**Measures** = computed values (sum, avg, count, percentile)

If the schema is wrong, Cube.js will error on startup - this enforces correctness.

---

## Testing & Verification

### Quick Sanity Check (5 min)

**Step 1: Run project scoring with limit**
```bash
./CLI.sh calculate_project_scores 10
```

Expected output:
- `Total projects: X`
- `Projects with scores: Y`
- `Processed 10/10 projects`
- `✅ Calculated X project aggregated scores`

**Step 2: Verify project scores in database**
```bash
cd ~/DEV/fetch/ReTreever && source .env
psql $DIRECT_URL -c "SELECT \"projectKey\", \"projectScore\", \"projectPercentile\" FROM \"ProjectScore_agg_helper\" ORDER BY \"projectScore\" DESC LIMIT 5"
```

Check:
- Scores should be 0-100 (percentages)
- Percentiles should be 0-100
- Higher scores should have higher percentiles

**Step 3: Run org scoring**
```bash
./CLI.sh calculate_org_scores
```

Expected output:
- `Found X organizations to score`
- Lines like `✅ Org Name: 45.0% → 45.0% (3 projects, 100% disclosed)`
- `✅ Scored X organizations`

**Step 4: Verify org scores in database**
```bash
psql $DIRECT_URL -c "SELECT o.\"organizationName\", os.\"preClaimScore\", os.\"orgScore\", os.\"orgPercentile\" FROM \"OrgScore_agg_helper\" os JOIN \"OrganizationTable\" o ON os.\"organizationKey\" = o.\"organizationKey\" ORDER BY os.\"orgScore\" DESC LIMIT 5"
```

Check:
- `preClaimScore` = average of project scores (before penalty)
- `orgScore` = preClaimScore × claimVsplantedQty (after penalty)
- If 100% disclosed, preClaimScore = orgScore

### Full Data Verification (15 min)

**Check the data chain exists:**

```bash
# Projects exist?
psql $DIRECT_URL -c "SELECT COUNT(*) as projects FROM \"ProjectTable\" WHERE \"deletedAt\" IS NULL"

# Projects linked to orgs via stakeholders?
psql $DIRECT_URL -c "SELECT COUNT(DISTINCT \"projectKey\") as projects_with_org FROM \"StakeholderTable\" WHERE \"organizationKey\" IS NOT NULL"

# Granular scores exist?
psql $DIRECT_URL -c "SELECT COUNT(*) as granular_scores FROM \"ProjectScore_granular_helper\""

# Aggregated scores exist?
psql $DIRECT_URL -c "SELECT COUNT(*) as agg_scores FROM \"ProjectScore_agg_helper\""
```

**Verify a specific project's math:**

```bash
# Get a project ID
psql $DIRECT_URL -c "SELECT \"projectKey\", \"projectName\" FROM \"ProjectTable\" LIMIT 1"

# Check its granular scores (replace PROJECT_ID)
psql $DIRECT_URL -c "SELECT \"attributeName\", \"AttributeScore\", \"awarded\" FROM \"ProjectScore_granular_helper\" WHERE \"projectKey\" = 'PROJECT_ID' LIMIT 10"

# Check its aggregated score
psql $DIRECT_URL -c "SELECT \"projectScore\", \"pointsScored\", \"pointsAvailible\" FROM \"ProjectScore_agg_helper\" WHERE \"projectKey\" = 'PROJECT_ID'"
```

Check: `projectScore` should equal `pointsScored / pointsAvailible * 100`

**Verify a specific org's math:**

```bash
# Get an org with scores
psql $DIRECT_URL -c "SELECT os.\"organizationKey\", o.\"organizationName\", os.\"preClaimScore\", os.\"orgScore\" FROM \"OrgScore_agg_helper\" os JOIN \"OrganizationTable\" o ON os.\"organizationKey\" = o.\"organizationKey\" LIMIT 1"

# Get its local org IDs (replace ORG_ID)
psql $DIRECT_URL -c "SELECT \"organizationKey\" FROM \"OrganizationTable\" WHERE \"organizationKey\" = 'ORG_ID'"

# Get project IDs via stakeholders (replace LOCAL_IDS)
psql $DIRECT_URL -c "SELECT DISTINCT \"projectKey\" FROM \"StakeholderTable\" WHERE \"organizationKey\" IN ('LOCAL_ID_1', 'LOCAL_ID_2')"

# Get those projects' scores (replace PROJECT_IDS)
psql $DIRECT_URL -c "SELECT \"projectKey\", \"projectScore\" FROM \"ProjectScore_agg_helper\" WHERE \"projectKey\" IN ('PROJ_1', 'PROJ_2')"
```

Check: `preClaimScore` should be the AVERAGE of those project scores

### Common Issues

**"no scored projects" for all orgs:**
- Projects aren't linked to orgs via StakeholderTable
- Check: `SELECT COUNT(*) FROM "StakeholderTable" WHERE "organizationKey" IS NOT NULL`

**"Scored 0 organizations":**
- Project scores don't exist yet
- Run `./CLI.sh calculate_project_scores` first

**Percentiles all 0:**
- Only one org/project scored (can't rank against itself)
- Need more data to calculate meaningful percentiles

**preClaimScore ≠ orgScore:**
- Claim disclosure penalty applied
- Check `claimVsplantedQty` ratio in `OrgScore_agg_helper`

---

## What Needs to Happen Next

1. **Retire legacy endpoints** — delete `src/routes/api/score/+server.ts`, drop `project_score_view` and `score_field_points()` from DB (safe to do any time)
2. **Tier display on `/who` list** — add tier color chip/badge to org list table
3. **Tier display on project cards** — project-level score also gets Opaque/Partial/Open/Transparent label
4. **Score info page** — `/about/scoring` static page with full methodology (currently only inline collapsible)
