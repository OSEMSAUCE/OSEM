# The Score
**Updated: 14 Mar 2026 - Schema Consolidation**

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

**Single source of truth:** `ScoreMatrixTable` stores anomaly weights; all non-listed fields default to `1` in `calc_batch_score_projects.ts`.

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

**Stored directly in `ProjectTable`** (scoring fields merged in):
```prisma
model ProjectTable {
  projectKey             String   @id @unique
  projectName            String   @unique
  // ... other project fields ...
  scoreRank              Int?     // PERCENT_RANK among all projects (0-100)
  scoreProject           Decimal? // (scorePointsScored / scorePointsAvailable)
  scorePointsAvailable   Int?     // Sum of points_available for all fields
  scorePointsScored      Int?     // Sum of points_awarded for all awarded fields
  scoreLastUpdated       DateTime?
  scoreHistoryLog        Json?    // Array of historical score snapshots
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
- `url`, `urlType`, `disclosureType`, `sourceDesc`, `sourceCredit`, `stakeholderType`

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
  - sourceDesc: ✗ (1 point available, 0 awarded)
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
  - sourceDesc: ✗ (1 point available, 0 awarded)
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
4. Look up the stored `ProjectTable.scoreProject` for each project
5. Aggregate → `scorePointsScored` (sum) and `scorePointsAvailable` (sum)

Field score = `scorePointsScored / scorePointsAvailable`. Stored directly in `OrganizationTable`.

### Tier 5 — Disclosure Ratio (the key differentiator)

The disclosure ratio measures how much of what an org *claims* they've plantedQty they have actually *documented* on the platform.

```
disclosureRatio = treesDisclosed / treesClaimed
```

- **`scoreSumClaimed`** — sum of `ClaimTable.claimQty` for this parent org. This is what the org publicly states they have planted.
- **`scoreSumPlantedQty`** — sum of `PlantingTable.plantedQty` across all projects associated with this org on the platform. This is what they have actually documented with verifiable data.

**Example:**
```
Org claims:     10,000,000 trees planted (scoreSumClaimed)
Org documented: 100,000 trees across 3 projects (scoreSumPlantedQty)
Disclosure ratio: 1%
Field score on those 3 projects: 80% (scoreOrgPreClaim)
Org score: 80% × 1% = 0.8% (scoreOrgFinal)
```

This is intentional and expected. The vast majority of orgs will have a very low disclosure ratio. The few that have documented a meaningful percentage of their claimed work will dominate the top percentiles. The system rewards transparency above all else.

The disclosure ratio is capped at 1.0 — you cannot score above 100% even if `scoreSumPlantedQty` somehow exceeds `scoreSumClaimed`.

**No claims = full disclosure.** If an org has no `ClaimTable` entries, disclosure ratio = 1.0. We can't penalise orgs for not making public claims — their project data stands on its own. Orgs with large claims are the ones measured against their marketing.

### Tier 6 — Org Score

```
scoreOrgFinal = scoreOrgPreClaim × (scoreSumPlantedQty / scoreSumClaimed)
```

This is the number that everything else is ranked against. Stored as `OrganizationTable.scoreOrgFinal`.

### Tier 7 — Org Percentile (Overall)

Where does this org rank among all orgs by `scoreOrgFinal`?

```sql
ROUND(PERCENT_RANK() OVER (ORDER BY scoreOrgFinal) * 100)::int AS scoreRankOverall
```

Stored as `OrganizationTable.scoreRankOverall`.

### Tier 8 — Primary Stakeholder Type and Percentile by Type

**Primary stakeholder type** = the `StakeholderType` that appears most often across all `StakeholderTable` rows for all locals under this parent:

```
developer × 8 projects
nursery   × 2 projects
→ primaryStakeholderType = developer
```

Alphabetical tiebreaker for determinism. One type per org. Stored on `OrganizationTable.primaryStakeholderType`.

**Percentile by type** = rank among orgs with the same primary stakeholder type:

```sql
ROUND(PERCENT_RANK() OVER (
    PARTITION BY primaryStakeholderType
    ORDER BY scoreOrgFinal
) * 100)::int AS scoreRankByType
```

An org in the 60th percentile overall might be in the 90th percentile within its category. The within-category percentile is the more actionable number for orgs comparing themselves to peers.

Stored as `OrganizationTable.scoreRankByType`.

---

## Schema: Current State (Post-Migration)

**MAJOR CHANGE (Mar 14, 2026):** Scoring tables have been merged into dimension tables for performance and simplicity.

### OrganizationTable (with scoring fields)

```prisma
model OrganizationTable {
  organizationKey        String   @id
  organizationName       String   @unique
  // ... identity/contact fields ...
  
  // Scoring fields (merged from OrgScoreTable)
  scoreRankOverall       Int?     // PERCENT_RANK among all orgs (0-100)
  scoreRankByType        Int?     // PERCENT_RANK within stakeholder type (0-100)
  primaryStakeholderType String?  // MODE of stakeholderType across projects
  scorePointsAvailable   Int?     // Sum of all project points available
  scorePointsScored      Int?     // Sum of all project points scored
  scoreOrgPreClaim       Decimal? // AVG(project_score) before penalty
  scoreSumClaimed        Int?     // Sum of ClaimTable.claimQty (trees claimed)
  scoreSumPlantedQty     Int?     // Sum of PlantingTable.plantedQty (trees documented)
  scoreSumUndisclosed    Int?     // scoreSumClaimed - scoreSumPlantedQty (disclosure gap)
  scoreOrgFinal          Decimal? // scoreOrgPreClaim × (scoreSumPlantedQty / scoreSumClaimed)
  scoreLastUpdated       DateTime?
  scoreHistoryLog        Json?    // Array of historical score snapshots
  
  @@index([primaryStakeholderType])
  @@index([scoreOrgFinal])
}
```

### ProjectTable (with scoring fields)

```prisma
model ProjectTable {
  projectKey         String   @id @unique
  projectName        String   @unique
  // ... project attribute fields ...
  
  // Scoring fields 
  scoreRank          Int?     // PERCENT_RANK among all projects (0-100)
  scoreProject       Decimal? // (scorePointsScored / scorePointsAvailable)
  scorePointsAvailable Int?   // Sum of points_available for all fields
  scorePointsScored  Int?     // Sum of points_awarded for all awarded fields
  scoreLastUpdated   DateTime?
  scoreHistoryLog    Json?    // Array of historical score snapshots
  
  @@index([scoreProject])
}
```

**Benefits:**
- No JOINs needed for org/project pages
- Faster queries (single table lookup)
- Simpler schema (2 fewer tables)
- Historical tracking via JSONB `scoreHistory` column

---

## The Batch: Full Data Flow

```
POST /api/score/batch?code=<HELPER_CODE>

PHASE 1 — PROJECT SCORING
  For each project:
    → score all 8 tables via getFieldPoints()
    → upsert ProjectTable scoring fields (scoreProject, scorePointsScored, scorePointsAvailable)
  Then: PERCENT_RANK() across all ProjectTable.scoreProject values → ProjectTable.scoreRank

PHASE 2 — ORG STAKEHOLDER TYPE RESOLUTION
  For each OrganizationTable:
    → collect all StakeholderTable.stakeholderType values across all associated locals
    → MODE = primaryStakeholderType (alphabetical tiebreaker)
    → upsert OrganizationTable.primaryStakeholderType

PHASE 3 — ORG SCORING
  For each OrganizationTable:
    → find all locals → find all stakeholder rows → find all projectKeys
    → sum ProjectTable.scorePointsScored → scorePointsScored
    → sum ProjectTable.scorePointsAvailable → scorePointsAvailable
    → sum ClaimTable.claimQty → scoreSumClaimed
    → sum PlantingTable.plantedQty across those projects → scoreSumPlantedQty
    → calculate scoreSumUndisclosed = scoreSumClaimed - scoreSumPlantedQty
    → scoreOrgPreClaim = AVG(ProjectTable.scoreProject)
    → scoreOrgFinal = scoreOrgPreClaim × MIN(scoreSumPlantedQty / scoreSumClaimed, 1.0)
    → upsert OrganizationTable scoring fields (with primaryStakeholderType from Phase 2)

  Then: PERCENT_RANK() across all OrganizationTable.scoreOrgFinal → OrganizationTable.scoreRankOverall
  Then: PERCENT_RANK() PARTITION BY primaryStakeholderType → OrganizationTable.scoreRankByType
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
# Clear existing scores (set scoring fields to NULL)
psql $DIRECT_URL -c 'UPDATE "ProjectTable" SET "scoreProject" = NULL, "scoreRank" = NULL, "scorePointsScored" = NULL, "scorePointsAvailable" = NULL'
psql $DIRECT_URL -c 'UPDATE "OrganizationTable" SET "scoreOrgFinal" = NULL, "scoreRankOverall" = NULL, "scoreRankByType" = NULL'
psql $DIRECT_URL -c 'DELETE FROM "ProjectScoreByFieldTable"'

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
- **Cached**: Project scores are already in `ProjectTable.scoreProject`

**Example:**
- Org has 3 projects with scores: 0.80, 0.60, 0.90
- org_score_pre_claim = (0.80 + 0.60 + 0.90) / 3 = 0.767
- sum_claimed = 10,000 trees, sum_plantedQty = 5,000 trees
- Disclosure ratio = 5,000 / 10,000 = 0.5 (50% disclosed)
- org_score_final = 0.767 × 0.5 = 0.383 (38.3% after penalty)

**Field Naming Convention (camelCase with 'score' prefix):**
- **Scores** (0.0-1.0 decimal): `scoreProject`, `scoreOrgPreClaim`, `scoreOrgFinal`
- **Ranks** (0-100 integer): `scoreRank`, `scoreRankOverall`, `scoreRankByType`
- **Aggregations**: `score*` prefix (e.g., `scoreSumClaimed`, `scoreSumPlantedQty`, `scorePointsScored`)
- **Flags**: `is*` (e.g., `isAwarded`)
- **IDs and metadata**: camelCase (e.g., `projectKey`, `scoreLastUpdated`)
- **All scoring fields**: Prefixed with `score` for easy filtering

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
- **ReTreever Score** (column 1, gold) = `scoreRankOverall` — rank among all orgs (0-100)
- **Data Completeness** (column 2, white) = `Math.round(scoreOrgFinal * 100)%` — field score × disclosure ratio

---

## Current Architecture

### Working
- **Dynamic project score** — `GET /api/score/report?projectKey=...` — always live. Includes stored `percentile`.
- **Batch (all 3 phases)** — `POST /api/score/batch?code=...` — project scoring, org stakeholder type resolution, org scoring + all percentiles.
- **Percentile display** — `/what` dashboard card shows real value when available, amber `—` until batch has run.
- **Org score display** — `/who/[orgId]` shows 2-column hero: orgPercentile (gold, with tier label) + data completeness (white). Collapsible tier legend below.
- **Orchestrator hook** — `calcScore()` in `Foundr/scripts/orchestrator.ts` calls the batch as the final step after every pipeline run.

### Shared code
- `calc_batch_score_projects.ts` — loads `ScoreMatrixTable` once per run and applies `default=1` for non-listed fields.

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
psql $DIRECT_URL -c "SELECT \"projectKey\", \"scoreProject\", \"scoreRank\" FROM \"ProjectTable\" WHERE \"scoreProject\" IS NOT NULL ORDER BY \"scoreProject\" DESC LIMIT 5"
```

Check:
- Scores should be 0.0-1.0 (decimals)
- Ranks should be 0-100 (percentiles)
- Higher scores should have higher ranks

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
psql $DIRECT_URL -c "SELECT \"organizationName\", \"scoreOrgPreClaim\", \"scoreOrgFinal\", \"scoreRankOverall\" FROM \"OrganizationTable\" WHERE \"scoreOrgFinal\" IS NOT NULL ORDER BY \"scoreOrgFinal\" DESC LIMIT 5"
```

Check:
- `scoreOrgPreClaim` = average of project scores (before penalty)
- `scoreOrgFinal` = scoreOrgPreClaim × (scoreSumPlantedQty / scoreSumClaimed) (after penalty)
- If 100% disclosed, scoreOrgPreClaim = scoreOrgFinal

### Full Data Verification (15 min)

**Check the data chain exists:**

```bash
# Projects exist?
psql $DIRECT_URL -c "SELECT COUNT(*) as projects FROM \"ProjectTable\" WHERE \"deletedAt\" IS NULL"

# Projects linked to orgs via stakeholders?
psql $DIRECT_URL -c "SELECT COUNT(DISTINCT \"projectKey\") as projects_with_org FROM \"StakeholderTable\" WHERE \"organizationKey\" IS NOT NULL"

# Granular scores exist?
psql $DIRECT_URL -c "SELECT COUNT(*) as granular_scores FROM \"ProjectScoreByFieldTable\""

# Aggregated scores exist?
psql $DIRECT_URL -c "SELECT COUNT(*) as projects_with_scores FROM \"ProjectTable\" WHERE \"scoreProject\" IS NOT NULL"
```

**Verify a specific project's math:**

```bash
# Get a project ID
psql $DIRECT_URL -c "SELECT \"projectKey\", \"projectName\" FROM \"ProjectTable\" LIMIT 1"

# Check its granular scores (replace PROJECT_ID)
psql $DIRECT_URL -c "SELECT \"field_name\", \"points_awarded\", \"is_awarded\" FROM \"ProjectScoreByFieldTable\" WHERE \"projectKey\" = 'PROJECT_ID' LIMIT 10"

# Check its aggregated score
psql $DIRECT_URL -c "SELECT \"scoreProject\", \"scorePointsScored\", \"scorePointsAvailable\" FROM \"ProjectTable\" WHERE \"projectKey\" = 'PROJECT_ID'"
```

Check: `scoreProject` should equal `scorePointsScored / scorePointsAvailable` (as decimal 0.0-1.0)

**Verify a specific org's math:**

```bash
# Get an org with scores
psql $DIRECT_URL -c "SELECT \"organizationKey\", \"organizationName\", \"scoreOrgPreClaim\", \"scoreOrgFinal\" FROM \"OrganizationTable\" WHERE \"scoreOrgFinal\" IS NOT NULL LIMIT 1"

# Get its local org IDs (replace ORG_ID)
psql $DIRECT_URL -c "SELECT \"organizationKey\" FROM \"OrganizationTable\" WHERE \"organizationKey\" = 'ORG_ID'"

# Get project IDs via stakeholders (replace LOCAL_IDS)
psql $DIRECT_URL -c "SELECT DISTINCT \"projectKey\" FROM \"StakeholderTable\" WHERE \"organizationKey\" IN ('LOCAL_ID_1', 'LOCAL_ID_2')"

# Get those projects' scores (replace PROJECT_IDS)
psql $DIRECT_URL -c "SELECT \"projectKey\", \"scoreProject\" FROM \"ProjectTable\" WHERE \"projectKey\" IN ('PROJ_1', 'PROJ_2')"
```

Check: `scoreOrgPreClaim` should be the AVERAGE of those project scores

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

**scoreOrgPreClaim ≠ scoreOrgFinal:**
- Claim disclosure penalty applied
- Check `scoreSumPlantedQty / scoreSumClaimed` ratio in `OrganizationTable`

---

## What Needs to Happen Next

1. **Retire legacy endpoints** — delete `src/routes/api/score/+server.ts`, drop `project_score_view` and `score_field_points()` from DB (safe to do any time)
2. **Tier display on `/who` list** — add tier color chip/badge to org list table
3. **Tier display on project cards** — project-level score also gets Opaque/Partial/Open/Transparent label
4. **Score info page** — `/about/scoring` static page with full methodology (currently only inline collapsible)
