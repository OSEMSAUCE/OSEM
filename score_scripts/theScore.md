# The Score
**Updated: 16 Mar 2026 - Merged audit guide + current schema cleanup**

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
Org Primary Stakeholder Category → what role does this org play most often?
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
| `stakeholderCategory` | 2 | Who's involved |
| `pricePerUnit`, `pricePerUnitUSD` | 2 each | Economic transparency |
| Everything else scoreable | 1 | General completeness |
| System fields (IDs, timestamps, `deleted`, `editedBy`, `platformId`, etc.) | 0 | Not transparency signals |

**Single source of truth: the `ScoreMatrixTable` database table.** It stores *anomaly* weights only — the deviations from the default. Any field not in the table is worth `1` point (`defaults.fieldPoints` in `scoreConfig.json`), and system fields are worth `0` via `isSystemField()` in `score_projects.ts`. So the table stays small: 12 rows, not one per column.

**To retune a weight, edit the database — not the code.** No code change, no deploy:

```sql
UPDATE "ScoreMatrixTable" SET "pointsAvailable" = 25 WHERE "fieldName" = 'geometry';
INSERT INTO "ScoreMatrixTable" ("fieldName", "pointsAvailable", "description")
VALUES ('hectares', 3, 'Site area');
```

The next scoring run picks it up. `scoreMatrix.ts` holds the same 12 values as a **bootstrap for an empty table only** — it never updates or deletes an existing row, so hand-tuned weights always survive.

### Seeding the matrix

The table self-heals. `loadScoreMatrix()` in `score_projects.ts` calls `seedScoreMatrixIfEmpty()` before every run: if the table has zero rows it bootstraps the 12 defaults from `scoreMatrix.ts`; if it has any rows it does nothing. A scoring run therefore can never silently use a flat matrix where `geometry` is worth the same as a text blurb.

To seed or inspect the live weights manually:

```bash
cd ReTreever
tsx OSEM/score_scripts/scoreMatrix.ts   # seeds if empty; otherwise just prints the live DB weights
```

**Weights are keyed on bare field names** (`geometry`, `latitude`), while `ProjectScoreByFieldTable.fieldName` stores `Table.field` (`LandTable.hectares`). The lookup uses the bare name, so a field name shared by two tables gets the same weight in both.

---

## Tier 2 — Project Score (Live, Per Page Load)

```
score % = (sum of points for populated fields) / (sum of all possible points) × 100
```

Computed by `score_projects.ts` and **stored** in `ProjectTable` — the `/what` page reads the stored values rather than recomputing per load. Field discovery is dynamic (`Object.entries(record)`), so new schema columns are scored automatically without a code change; only their *weight* needs a `ScoreMatrixTable` row, and without one they default to 1 point.

⚠️ There is **no** `GET /api/score/report` endpoint — it was removed. The routes that exist under `src/routes/api/score/` are `batch/`, `calculate/`, and `verify/`.

**Stored directly in `ProjectTable`** (scoring fields merged in):
```prisma
model ProjectTable {
  projectKey             String   @id @unique
  projectName            String   @unique
  // ... other project fields ...
  scoreProjectRank       Int?     // PERCENT_RANK among all projects (0-100)
  scoreProject           Decimal? // (scorePointsScored / scorePointsAvailable)
  scorePointsAvailable   Int?     // Sum of points_available for all fields
  scorePointsScored      Int?     // Sum of points_awarded for all awarded fields
  scoreLastUpdatedAt     DateTime?
  scoreHistoryLog        Json?    // Array of historical score snapshots
  scoreProjectFlag       Boolean? // Dirty flag — set true to queue for re-scoring
}
```

### Multi-record child tables (why `LandTable.hectares` can appear twice)

A project can have many `LandTable`, `CropTable`, `PlantingTable`, `StakeholderTable`, and `SourceTable` rows. The scorer walks **every record of every table** and emits one `ProjectScoreByFieldTable` row per field per record.

`fieldName` is built as `` `${tableName}.${fieldName}` `` — table and column, *without* the record's own key. So a project with two land sites produces **two rows both labelled `LandTable.hectares`**, with different `granularProjectScoreId` UUIDs and the same `lastUpdated`. There is no unique constraint on `(projectKey, fieldName)`; the primary key is a random UUID.

**This is expected, not a bug.** Two sites means two hectares values to disclose, and each is scored on its own merits.

Because `scoreProject` is a *ratio*, extra sites don't inflate the score — numerator and denominator both grow:

| Project | Points scored | Points available | Score |
|---|---|---|---|
| 1 land, fully documented | 6 | 6 | 100% |
| 2 lands, both fully documented | 12 | 12 | 100% |
| 2 lands, second half-empty | 9 | 12 | 75% |

The consequence worth understanding: **adding a poorly-documented site lowers the score.** That is deliberate — the score answers *"how completely have you documented what you claim?"*, not *"how much land have you shown?"*. Disclosing a vague extra site should cost you, in the same way the org-level disclosure ratio penalizes claimed-but-undocumented trees.

Rows are replaced wholesale per project: `deleteMany({ where: { projectKey } })` then `createMany(...)`. These are two separate statements, not wrapped in a transaction — so a concurrent second scoring of the same project (e.g. cron firing mid-orchestrator-run) can interleave and leave a doubled set. Rare, and self-correcting on the next run.

---

## Tier 3 — Project Percentile

After the batch scores every project, one SQL window function assigns percentiles:

```sql
ROUND(PERCENT_RANK() OVER (ORDER BY "scoreProject") * 100)::int AS "scoreProjectRank"
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
- **MiscTable**: Motivation/type data, should be complete

**Bonusable Tables** (first record = baseline, additional records = bonus):
- **CropTable**: Baseline required, additional species = bonus
- **SourceTable**: Baseline required, additional sources = bonus
- **StakeholderTable**: Baseline required, additional = bonus
- **PlantingTable**: Baseline required, additional = bonus

### Baseline Fields

**CropTable** (7 fields):
- `cropName`, `speciesLocalName`, `speciesId`, `seedInfo`, `cropStock`, `organizationName`, `cropDesc`

**SourceTable** (6 fields):
- `url`, `urlType`, `disclosureType`, `sourceDesc`, `sourceCredit`, `stakeholderCategory`

**StakeholderTable** (2 fields):
- `organizationKey`, `stakeholderCategory`

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
  - stakeholderCategory: ✗ (2 points available, 0 awarded)

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
  - stakeholderCategory: ✗ (2 points available, 0 awarded)
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
  - stakeholderCategory: ✓ (+2 bonus points)
  - ... other empty fields (ignored, no penalty)
  Subtotal: +4 bonus points

Total across all three records:
- 13 points available
- 8 points awarded
- final SourceTable score = 8 / 13 = 61.5%
```

---

## Tiers 4–8 — Organization Scoring

### The data model

```
OrganizationTable      ← all organizations (both parent and child orgs in one table)
      self-referential via organizationParentKey
      parent: true  = canonical parent org
      parent: false = child org (source/platform-specific)
      linked via ↓ organizationKey
StakeholderTable       ← org × project relationship, with stakeholderCategory per row
ClaimTable             ← trees claimed by organizations
```

The scoring system aggregates to parent organizations (`parent: true`). Child organizations (`parent: false`) roll up to their parent via `organizationParentKey`. All org data lives in a single flattened `OrganizationTable`.

### Tier 4 — Org Field Score

The average project score across all projects this parent org is associated with:

1. Find all child `OrganizationTable` rows where `organizationParentKey` matches the parent `organizationKey` (plus the parent itself)
2. Find all `StakeholderTable` rows for those org records
3. Get all `projectKey` values from those rows
4. Look up the stored `ProjectTable.scoreProject` for each project
5. Average those project scores

Stored as `OrganizationTable.scoreOrgPreClaim`.

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

Current implementation uses the raw ratio `scoreSumPlantedQty / scoreSumClaimed` when claims exist. If documented planting ever exceeds claims, investigate the source data and linkage instead of assuming the ratio is capped in code.

**No claims = full disclosure.** If an org has no `ClaimTable` entries, disclosure ratio = 1.0.

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

### Tier 8 — Primary Stakeholder Category and Percentile by Type

**Primary stakeholder category** = the `StakeholderType` that appears most often across all `StakeholderTable` rows for all locals under this parent:

```
developer × 8 projects
nursery   × 2 projects
→ primaryStakeholderType = developer
```

Alphabetical tiebreaker for determinism. One type per org. Stored on `OrganizationTable.primaryStakeholderType`.

**Percentile by type** = rank among orgs with the same primary stakeholder category:

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
  scoreRankByType        Int?     // PERCENT_RANK within stakeholder category (0-100)
  primaryStakeholderType String?  // MODE of stakeholderCategory across projects
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
  projectKey           String   @id @unique
  projectName          String   @unique
  // ... project attribute fields ...
  
  // Scoring fields 
  scoreProjectRank     Int?     // PERCENT_RANK among all projects (0-100)
  scoreProject         Decimal? // (scorePointsScored / scorePointsAvailable)
  scorePointsAvailable Int?   // Sum of points_available for all fields
  scorePointsScored    Int?     // Sum of points_awarded for all awarded fields
  scoreLastUpdated     DateTime?
  scoreHistoryLog      Json?    // Array of historical score snapshots
  
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

Scoring runs as **local tsx scripts against `DATABASE_MIGRATIONS_DEV_URL`** — no HTTP call, no dev server, no `HELPER_CODE`. (The `/api/score/*` routes still exist but are not how scoring is driven.)

```
tsx OSEM/score_scripts/score_projects.ts   +   tsx OSEM/score_scripts/score_orgs.ts

PHASE 1 — PROJECT SCORING
  For each project:
    → score all 8 scored tables using ScoreMatrixTable overrides + default=1
    → write field-level rows to ProjectScoreByFieldTable
    → upsert ProjectTable scoring fields (scoreProject, scorePointsScored, scorePointsAvailable)
  Then: PERCENT_RANK() across all ProjectTable.scoreProject values → ProjectTable.scoreProjectRank

PHASE 2 — ORG SCORING
  For each OrganizationTable:
    → find all linked local orgs
    → find all stakeholder rows for those locals
    → collect distinct projectKeys
    → AVG(ProjectTable.scoreProject) → scoreOrgPreClaim
    → sum ClaimTable.claimQty → scoreSumClaimed
    → sum PlantingTable.plantedQty across those projects → scoreSumPlantedQty
    → calculate scoreSumUndisclosed = scoreSumClaimed - scoreSumPlantedQty
    → scoreOrgFinal = scoreOrgPreClaim × disclosure ratio
    → MODE(stakeholderCategory) → primaryStakeholderType
    → upsert OrganizationTable scoring fields

  Then: PERCENT_RANK() across all OrganizationTable.scoreOrgFinal → OrganizationTable.scoreRankOverall
  Then: PERCENT_RANK() PARTITION BY primaryStakeholderType → OrganizationTable.scoreRankByType
```

**Triggering — two paths:**

1. **Orchestrator** — as the last sub-step of step 5 (Upsert), `orchestrator.ts` dynamically imports `score_projects` + `rank_projects` and calls them with that batch's `dirtyProjectKeys`. Scores only the changed projects, then re-ranks all of them, so percentiles stay exact. Org scoring is **not** included — orgs refresh on the next `./CLI.sh score`.
   - Set **`SKIP_SCORING=true`** to suppress this (used by `scrapeRestor`, where `BATCH_OVERRIDE=1000` in a loop would add 2-7 min per iteration). Nothing is lost: `5UpsertBulk.ts` has already persisted `scoreProjectFlag = true`, so a later `./CLI.sh score` finds exactly the same work.
2. **Manual** — `./CLI.sh score [projects|orgs|both] [batch]`. The full two-phase flow above.

Needs `DATABASE_MIGRATIONS_DEV_URL` in `ReTreever/.env`.

⚠️ `scoring.cron` / `./CLI.sh install_cron` exist but the cron is **not installed** (`crontab -l` is empty), and the cron line would fail if it were: it never loads `.env`, so `DATABASE_MIGRATIONS_DEV_URL` is unset and the script throws on line 18.

---

## Running Score Calculations

### Commands

```bash
# Single entrypoint (from gitEr/)
./CLI.sh score                  # dirty projects, then dirty orgs, ranking both
./CLI.sh score projects         # projects only
./CLI.sh score orgs             # orgs only
./CLI.sh score both 500         # custom batch size

# Direct scripts (from ReTreever/, needs DATABASE_MIGRATIONS_DEV_URL)
tsx OSEM/score_scripts/scoreMatrix.ts           # seed matrix if empty / print live weights
tsx OSEM/score_scripts/score_projects.ts [batch]
tsx OSEM/score_scripts/score_orgs.ts [batch] [orgId...]
```

There is **one** scoring command. `score_projects_1` / `score_orgs_2` were removed — use the scope argument instead. Ranking is not separate: `rank_projects()` / `rank_orgs()` run automatically at the end of each scoring script.

### Cost: score incrementally, rank globally

The two halves have completely different cost profiles, and that's what makes the cadence work:

| | Scope | Cost |
|---|---|---|
| **Scoring** | Only dirty (flagged) rows | ~4 DB round-trips **per project** — 25-60 min for a full 10k sweep |
| **Ranking** | Always the entire table | **One** `UPDATE … PERCENT_RANK()` statement — ~1s regardless of size |

Scoring is slow because it's sequential network latency, not CPU — the scorer does a null check per field and then waits. Ranking is nearly free because Postgres sorts the whole table internally in one statement.

**So there is no accuracy-vs-cost tradeoff.** Scoring 10 changed projects (~4s) and re-ranking all 10,000 (~1s) gives **exact** percentiles for ~5 seconds of work. You never need a scheduled full rescore just to keep ranks honest.

A full rescore is only needed on an *event*, not a calendar:
- A weight changed in `ScoreMatrixTable` (every score is now computed on different rules)
- A new scored field was added to the schema

To force one: `UPDATE "ProjectTable" SET "scoreProjectFlag" = true` then `./CLI.sh score`.

**Dirty-flag driven.** Both scripts select work by flag — `ProjectTable.scoreProjectFlag = true` / `OrganizationTable.scoreOrgFlag = true` — clearing it after each row. `5UpsertBulk.ts` sets the project flag during upsert. To force a full re-score, set the flags back to `true` (see below).

### Recalculating Scores

To regenerate all scores from scratch:

```bash
# Clear existing scores (set scoring fields to NULL)
psql $DATABASE_MIGRATIONS_DEV_URL -c 'UPDATE "ProjectTable" SET "scoreProject" = NULL, "scoreProjectRank" = NULL, "scorePointsScored" = NULL, "scorePointsAvailable" = NULL'
psql $DATABASE_MIGRATIONS_DEV_URL -c 'UPDATE "OrganizationTable" SET "scoreOrgFinal" = NULL, "scoreRankOverall" = NULL, "scoreRankByType" = NULL'
psql $DATABASE_MIGRATIONS_DEV_URL -c 'DELETE FROM "ProjectScoreByFieldTable"'

# REQUIRED: mark everything dirty, or the scripts will find no work to do
psql $DATABASE_MIGRATIONS_DEV_URL -c 'UPDATE "ProjectTable" SET "scoreProjectFlag" = true'
psql $DATABASE_MIGRATIONS_DEV_URL -c 'UPDATE "OrganizationTable" SET "scoreOrgFlag" = true'

# Regenerate everything (ranking runs automatically at the end of each)
./CLI.sh score
```

Clearing the scores alone is not enough — both scripts select rows by dirty flag, so a recalc that skips the flag updates will silently no-op.

### Scripts in this Directory

- **scoreMatrix.ts** — `SCORE_MATRIX` bootstrap constant + `seedScoreMatrixIfEmpty()`. Seeds an empty `ScoreMatrixTable`; never overwrites a populated one. Runnable standalone to inspect live weights.
- **score_projects.ts** — the project scorer. Exports `score_projects(projectKeys)` and `rank_projects()`; the orchestrator calls both. Run standalone it loops dirty projects in batches then ranks.
- **score_orgs.ts** — the org scorer. Exports `score_orgs(...)` and `rank_orgs()`; accepts specific org IDs as trailing args.
- **scoreConfig.json** — `pool.maxConnections` (5), `batch.*.defaultSize` (100), and `defaults.fieldPoints` (1 — the weight for any field not in `ScoreMatrixTable`).
- **install_cron.sh** / **scoring.cron** — installs the 12-hourly scoring job.

### Performance: Dirty-Flag Scoring

There is no longer a batch/global split — there is **one** mechanism, the dirty flag, and scope is just "how many rows are flagged".

| Operation | Scope | Output | Performance | Trigger |
|-----------|-------|--------|-------------|---------|
| `score_projects(keys)` | Specific projects | Scores (0.0-1.0) | ~2-5 sec for 50 | Orchestrator, after upsert |
| `score_projects.ts` standalone | All flagged projects, batched | Scores (0.0-1.0) | ~5-10 min for 10K | `./CLI.sh score_projects_1`, cron |
| `rank_projects()` | ALL projects | Ranks (0-100) | <1 sec for 10K | End of every standalone run |
| `score_orgs(...)` | Specific/all flagged orgs | Scores (0.0-1.0) | ~2-3 sec for all | `./CLI.sh score_orgs_2`, cron |
| `rank_orgs()` | ALL orgs | Ranks (0-100) | <1 sec for all | End of every standalone run |

**Orchestrator workflow** (final sub-step of step 5, Upsert): calls `score_projects(dirtyProjectKeys)` directly, for that batch's keys only. It does **not** rank, and it does **not** score orgs — those happen on the next `./CLI.sh score` or cron run.

**Full recalculation:** clear the scores, set both dirty flags to `true`, then `./CLI.sh score` (~5-10 min for 10K projects). Ranking is always global and always fast, so it re-runs after every scoring pass.

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
- **Batch** — `POST /api/score/batch?code=...` — project scoring, org scoring, and both percentile passes.
- **Percentile display** — `/what` dashboard card shows real value when available, amber `—` until batch has run.
- **Org score display** — `/who/[orgId]` shows 2-column hero: orgPercentile (gold, with tier label) + data completeness (white). Collapsible tier legend below.
- **Orchestrator hook** — `calcScore()` in `Foundr/scripts/orchestrator.ts` calls the batch as the final step after every pipeline run.

### Shared code
- `score_projects.ts` — `loadScoreMatrix()` seeds the matrix if empty, loads `ScoreMatrixTable` once per run, and applies `default=1` (from `scoreConfig.json`) for non-listed fields.
- `scoreMatrix.ts` — `seedScoreMatrixIfEmpty()`, the non-destructive bootstrap.

### Legacy / to retire
- `GET/POST /api/score?code=...` — reads/refreshes `project_score_view` materialized view. Superseded. Safe to delete.
- `project_score_view` and `score_field_points()` SQL — still in DB. Safe to drop.

---

## Cube.js Semantic Layer
Cube is useful as an audit/exploration layer, but it is **not currently the source of truth** for scoring. The real source of truth is:

- `ReTreever/prisma/schema.prisma`
- `ScoreMatrixTable` in the database (the field weights)
- `OSEM/score_scripts/score_projects.ts`
- `OSEM/score_scripts/score_orgs.ts`

Important: parts of the Cube model still reference older helper-table names and older field names. Treat Cube queries as convenience checks only until the Cube schema is brought fully in sync with the current Prisma schema.

To start Cube:

```bash
./CLI.sh start_cube
```

---

## Testing & Verification
### Quick sanity pass

```bash
./CLI.sh score 10 10
```

Then verify:

```bash
psql $DATABASE_MIGRATIONS_DEV_URL -c "SELECT \"projectKey\", \"scoreProject\", \"scoreProjectRank\", \"scorePointsScored\", \"scorePointsAvailable\" FROM \"ProjectTable\" WHERE \"scoreProject\" IS NOT NULL ORDER BY \"scoreProject\" DESC LIMIT 10"

psql $DATABASE_MIGRATIONS_DEV_URL -c "SELECT \"organizationKey\", \"organizationName\", \"scoreOrgPreClaim\", \"scoreOrgFinal\", \"scoreRankOverall\", \"scoreRankByType\", \"primaryStakeholderType\" FROM \"OrganizationTable\" WHERE \"scoreOrgFinal\" IS NOT NULL ORDER BY \"scoreOrgFinal\" DESC LIMIT 10"
```

Check:

- `scoreProject = scorePointsScored / scorePointsAvailable`
- higher `scoreProject` should generally mean higher `scoreProjectRank`
- `scoreOrgFinal` should reflect `scoreOrgPreClaim` adjusted by the disclosure ratio

### Data chain audit

```bash
psql $DATABASE_MIGRATIONS_DEV_URL -c "SELECT COUNT(*) AS projects FROM \"ProjectTable\" WHERE \"deletedAt\" IS NULL"
psql $DATABASE_MIGRATIONS_DEV_URL -c "SELECT COUNT(*) AS scored_projects FROM \"ProjectTable\" WHERE \"scoreProject\" IS NOT NULL"
psql $DATABASE_MIGRATIONS_DEV_URL -c "SELECT COUNT(*) AS field_rows FROM \"ProjectScoreByFieldTable\""
psql $DATABASE_MIGRATIONS_DEV_URL -c "SELECT COUNT(DISTINCT \"projectKey\") AS stakeholder_projects FROM \"StakeholderTable\" WHERE \"organizationKey\" IS NOT NULL"
```

### Verify one project's math

```bash
psql $DATABASE_MIGRATIONS_DEV_URL -c "SELECT \"projectKey\", \"projectName\" FROM \"ProjectTable\" WHERE \"scoreProject\" IS NOT NULL LIMIT 1"

psql $DATABASE_MIGRATIONS_DEV_URL -c "SELECT \"fieldName\", \"pointsAvailable\", \"pointsAwarded\", \"isAwarded\" FROM \"ProjectScoreByFieldTable\" WHERE \"projectKey\" = 'PROJECT_KEY' ORDER BY \"fieldName\" LIMIT 50"

psql $DATABASE_MIGRATIONS_DEV_URL -c "SELECT \"scoreProject\", \"scorePointsScored\", \"scorePointsAvailable\" FROM \"ProjectTable\" WHERE \"projectKey\" = 'PROJECT_KEY'"
```

Expected:

- `scorePointsScored` = sum of `pointsAwarded`
- `scorePointsAvailable` = sum of `pointsAvailable`
- `scoreProject` = `scorePointsScored / scorePointsAvailable`

### Verify one org's math

```bash
psql $DATABASE_MIGRATIONS_DEV_URL -c "SELECT \"organizationKey\", \"organizationName\", \"scoreOrgPreClaim\", \"scoreSumClaimed\", \"scoreSumPlantedQty\", \"scoreSumUndisclosed\", \"scoreOrgFinal\" FROM \"OrganizationTable\" WHERE \"scoreOrgFinal\" IS NOT NULL LIMIT 1"

psql $DATABASE_MIGRATIONS_DEV_URL -c "SELECT DISTINCT st.\"projectKey\", pt.\"scoreProject\" FROM \"StakeholderTable\" st JOIN \"ProjectTable\" pt ON pt.\"projectKey\" = st.\"projectKey\" WHERE st.\"organizationKey\" = 'ORG_KEY' AND pt.\"scoreProject\" IS NOT NULL"
```

Expected:

- `scoreOrgPreClaim` = average of the linked projects' `scoreProject`
- `scoreSumUndisclosed = scoreSumClaimed - scoreSumPlantedQty`
- `scoreOrgFinal = scoreOrgPreClaim × disclosure ratio`

### Cube playground audit

If you use Cube, treat it as a convenience layer, not ground truth. The safest checks are the SQL queries above.

If Cube has been refreshed to match the current schema, the most useful manual audit questions are:

- **Project formula** — does project score equal scored ÷ available?
- **Project ranking** — do higher scores have higher ranks?
- **Org penalty** — does `scoreOrgFinal` drop when claimed exceeds documented?
- **By-type ranking** — does `scoreRankByType` make sense within each `primaryStakeholderType`?
- **Field gaps** — which `ProjectScoreByFieldTable.fieldName` values are most often unawarded?

### Common issues

- **No scored projects**
  - Run `./CLI.sh score_projects`

- **No scored orgs**
  - Project scores may not exist yet, or projects may not link to orgs through `StakeholderTable`

- **Project score exists but org score is missing**
  - Check stakeholder links and claims/project data availability

- **Percentiles all the same**
  - Usually means too few scored rows to produce a meaningful distribution

---

## Claim Normalization (The Three-Body Problem)

Organizations claim impact in different units: trees, hectares, or sites. To calculate disclosure ratios fairly, all claims are normalized to **tree-equivalents**.

**Full methodology:** See `CLAIM_METHODOLOGY.md` in this directory.

### Quick Summary

| Claim Type | Conversion | Source |
|------------|------------|--------|
| Trees | 1:1 | Direct |
| Hectares | × 1,100 trees/ha | FAO reforestation standard |
| Sites | × 25,000 trees/site | Complete-case orgs (quarterly) |

**Why external benchmarks?** Platform-reported trees/hectare is corrupted by hectare inflation. We use FAO standards instead.

**Multiple claim types?** Average them (not worst-case).

### Claim Analysis Status

Not all orgs can be analyzed:

| Status | Meaning | Scoring |
|--------|---------|---------|
| `verified` | Pure reforestation | Full disclosure ratio |
| `mixed` | Contains conservation | Only reforestation claims scored |
| `unverifiable` | Can't isolate | Disclosure ratio = 1.0 |
| `pending` | Not reviewed | Treated as unverifiable |

Stored in `OrganizationTable.claimAnalysisStatus`.

---

## What Needs to Happen Next

1. **Retire legacy endpoints** — delete `src/routes/api/score/+server.ts`, drop `project_score_view` and `score_field_points()` from DB (safe to do any time)
2. **Tier display on `/who` list** — add tier color chip/badge to org list table
3. **Tier display on project cards** — project-level score also gets Opaque/Partial/Open/Transparent label
4. **Score info page** — `/about/scoring` static page with full methodology (currently only inline collapsible)
5. **Implement claim normalization** — update `score_orgs.ts` to use `GlobalDefaultsTable` and `normalizeClaimToTrees()`
6. **Seed GlobalDefaultsTable** — run migration with FAO-based conversion factors
7. **Build claim review workflow** — UI for setting `claimAnalysisStatus` per org
