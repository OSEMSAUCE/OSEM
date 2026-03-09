# Scoring System Documentation

Complete documentation for the project and organization scoring system.

---

## Table of Contents

1. [Overview](#overview)
2. [Scoring Hierarchy Flowchart](#scoring-hierarchy-flowchart)
3. [Bonusable Table Concept](#bonusable-table-concept)
4. [Field Point Values](#field-point-values)
5. [Scoring Examples](#scoring-examples)
6. [Running Score Calculations](#running-score-calculations)

---

## Overview

The project scoring system evaluates data completeness across all tables. Each field has a point value, and projects are scored based on which fields are populated.

**Key relationships:**
- Projects connect to Organizations **only via StakeholderTable**
- If an organization appears as a stakeholder on a project, that's the connection
- There is no direct ProjectTable → OrganizationLocalTable relationship

---

## Scoring Hierarchy Flowchart

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SCORING CALCULATION FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

LEVEL 1: PROJECT GRANULAR SCORES
┌──────────────────────────────────────┐
│  For each project:                   │
│  - Iterate through scored tables     │
│  - Award points for populated fields │
│  - Apply bonusable table logic       │
│  - Store in ProjectScore_granular    │
└──────────────┬───────────────────────┘
               │
               ▼
LEVEL 2: PROJECT AGGREGATED SCORES
┌──────────────────────────────────────┐
│  Aggregate granular → project score  │
│  - sum_points_scored / sum_points_available × 100    │
│  - Result: project_pct_score (0-100%)     │
│  - Store in ProjectScore_agg_helper  │
└──────────────┬───────────────────────┘
               │
               ▼
LEVEL 3: PROJECT PERCENTILES
┌──────────────────────────────────────┐
│  Calculate percentile for each project    │
│  - PERCENT_RANK() OVER (ORDER BY project_pct_score) × 100  │
│  - Result: project_rank (0-100 percentile) │
│  - NOTE: "rank" is percentile, not position (1st, 2nd, 3rd) │
└──────────────┬───────────────────────┘
               │
               ▼
LEVEL 4: ORG PRE-CLAIM SCORE
┌──────────────────────────────────────┐
│  For each master organization:       │
│  - Get all local orgs                │
│  - Get projects via StakeholderTable │
│  - Average project scores            │
│  - Result: org_pct_pre_claim (0-100%)    │
│                                      │
│  Also calculate reference data:      │
│  - sum_points_available (sum)          │
│  - sum_points_scored (sum)             │
└──────────────┬───────────────────────┘
               │
               ├─────────────────────────────────────────────┐
               │                                             │
               ▼                                             ▼
LEVEL 5a: CLAIM DATA                        LEVEL 5b: STAKEHOLDER TYPE
┌──────────────────────────────┐            ┌─────────────────────────────┐
│  Aggregate external claims:  │            │  Determine primary type:    │
│  - sum_claimed (ClaimTable) │            │  - Count stakeholder types  │
│  - sum_planted (PlantingTbl)│            │  - Across all local orgs    │
│  - sum_undisclosed (gap)      │            │  - Most frequent = primary  │
└──────────────┬───────────────┘            └──────────────┬──────────────┘
               │                                           │
               └───────────────┬───────────────────────────┘
                               │
                               ▼
LEVEL 6: FINAL ORG SCORE (org_pct_final)
┌──────────────────────────────────────────────────────────┐
│  Apply claim disclosure penalty:                         │
│  org_pct_final = org_pct_pre_claim × (sum_planted / sum_claimed)               │
│                                                           │
│  Example:                                                 │
│  - org_pct_pre_claim: 75% (good project quality)             │
│  - sum_claimed: 11M trees, sum_planted: 1M trees       │
│  - Disclosure ratio: 1M / 11M = 0.09 (9% disclosed)       │
│  - org_pct_final: 75% × 0.09 = 6.75% ⚠️                       │
│                                                           │
│  Store in OrgScore_helper                            │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
LEVEL 7: ORG PERCENTILES (final rankings)
┌──────────────────────────────────────────────────────────┐
│  Calculate percentiles by org_pct_final:                                  │
│                                                           │
│  A) Overall Percentile                                   │
│     PERCENT_RANK() OVER (ORDER BY org_pct_final) × 100              │
│     → org_rank_overall (0-100 percentile)                              │
│                                                           │
│  B) Percentile By Type                                   │
│     PERCENT_RANK() OVER (                                │
│       PARTITION BY primaryStakeholderType                │
│       ORDER BY org_pct_final                                  │
│     ) × 100                                                     │
│     → org_rank_by_type (0-100 percentile)                        │
│                                                           │
│  This ensures orgs compete fairly within their category  │
│  (nurseries vs nurseries, not nurseries vs developers)   │
│                                                           │
│  NOTE: "rank" fields are percentiles (0-100), not positions (1st, 2nd) │
└──────────────────────────────────────────────────────────┘

KEY INSIGHTS:
1. The "org_pct_pre_claim" is calculated BEFORE the claim penalty is applied.
   The claim penalty is the FINAL step that produces the actual score used for rankings.

   org_pct_pre_claim = average of project scores (before penalty)
   org_pct_final = org_pct_pre_claim × (sum_planted / sum_claimed)

2. "rank" fields are PERCENTILES (0-100), not positions:
   - project_rank = 95 means "better than 95% of projects"
   - org_rank_overall = 50 means "better than 50% of orgs"
   - This is calculated via PERCENT_RANK() × 100
```

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
- `cropName`, `speciesLocalName`, `speciesId`, `seedInfo`, `cropStock`, `organizationLocalName`, `cropNotes`

**SourceTable** (6 fields):
- `url`, `urlType`, `disclosureType`, `sourceDescription`, `sourceCredit`, `stakeholderType`

**StakeholderTable** (2 fields):
- `organizationLocalId`, `stakeholderType`

**PlantingTable** (8 fields):
- `planted`, `allocated`, `plantingDate`, `units`, `unitType`, `pricePerUnit`, `currency`, `pricePerUnitUSD`

---

## Field Point Values

### High-Value Fields

- **geometry**: 20 points (GeoJSON polygon data)
- **gpsLat, gpsLon**: 5 points each (GPS coordinates)
- **cropName, speciesId**: 5 points each (species identification)
- **plantingDate**: 5 points (temporal data)
- **plotCenter, radius**: 5 points each (circular plot geometry)

### Medium-Value Fields

- **planted**: 3 points (tree count)
- **stakeholderType**: 2 points (stakeholder classification)
- **pricePerUnitUSD, pricePerUnit**: 2 points each (economic data)

### Standard Fields

- All other data fields: 1 point

### System Fields (0 points)

IDs, timestamps, and internal fields are excluded from scoring:
- `projectId`, `landId`, `cropId`, etc.
- `createdAt`, `lastEditedAt`, `deletedAt`
- `errored`, `created`, `updated`, `duplicated`
- `parentTable`, `parentId`, `platformId`

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

## Running Score Calculations

### Commands

```bash
# Calculate project scores (with optional limit for testing)
./MASTER.sh calculate_project_scores        # All projects
./MASTER.sh calculate_project_scores 10     # Only 10 projects

# Calculate organization scores (run AFTER project scores)
./MASTER.sh calculate_org_scores

# Start Cube.js to explore scoring data
./MASTER.sh start_cube                       # Opens playground at http://localhost:4000
```

### Recalculating Scores

To regenerate all granular scores:

```bash
# Delete existing granular scores
psql $DIRECT_URL -c 'DELETE FROM "ProjectScore_granular_helper"'

# Regenerate from database
./MASTER.sh calculate_project_scores
```

### Scripts in this Directory

- **calculateProjectScores.ts** - Backfills granular scores, calculates aggregated scores and percentiles
- **calculateOrgScores.ts** - Calculates organization scores as average of project scores, applies claim penalty
- **testOrgScores.ts** - Test script to verify org score calculations

### Performance Note: Percentile Calculation is Fast

The percentile calculation (PERCENT_RANK window function) is extremely fast:
- 1,000 projects: <100ms
- 10,000 projects: <1 second
- 100,000 projects: ~5 seconds

This makes incremental scoring viable for the orchestrator:
1. Deep score only new batch (~10-50 projects)
2. Quick re-percentile ALL projects (just SQL window function)
3. Quick org recalc for affected orgs only
4. Quick re-percentile ALL orgs

Total time: ~5 seconds instead of minutes.

---

## Organization Scoring Strategy

**Organization score = average of all project scores for that organization**

This approach is:
- **Faster**: Reuses already-calculated project scores instead of re-aggregating thousands of granular scores
- **Fairer**: Each project counts equally, regardless of size
- **Simpler**: "This org's average project score is 75%" is easier to understand
- **Cached**: Project scores are already in `ProjectScore_agg_helper`

**Example:**
- Org has 3 projects with scores: 80%, 60%, 90%
- org_pct_pre_claim = (80 + 60 + 90) / 3 = 76.7%
- sum_claimed = 10,000 trees, sum_planted = 5,000 trees
- Disclosure ratio = 5,000 / 10,000 = 0.5 (50% disclosed)
- org_pct_final = 76.7% × 0.5 = 38.3%

**Field Naming Convention:**
- Calculated/aggregated fields: snake_case (e.g., `project_pct_score`, `org_rank_overall`)
- IDs and metadata: camelCase (e.g., `projectId`, `lastUpdated`)
- Prefixes indicate entity: `project_*`, `org_*`, `sum_*`, `is_*`
 


 