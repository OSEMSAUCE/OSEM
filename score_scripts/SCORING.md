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
│  - pointsScored / pointsAvailable    │
│  - Result: projectScore (0-100%)     │
│  - Store in ProjectScore_agg_helper  │
└──────────────┬───────────────────────┘
               │
               ▼
LEVEL 3: PROJECT PERCENTILES
┌──────────────────────────────────────┐
│  Rank projects against each other    │
│  - PERCENT_RANK() OVER projectScore  │
│  - Result: projectPercentile (0-100) │
└──────────────┬───────────────────────┘
               │
               ▼
LEVEL 4: ORG PRE-CLAIM SCORE
┌──────────────────────────────────────┐
│  For each master organization:       │
│  - Get all local orgs                │
│  - Get projects via StakeholderTable │
│  - Average project scores            │
│  - Result: preClaimScore (0-100%)    │
│                                      │
│  Also calculate reference data:      │
│  - orgPointsAvailable (sum)          │
│  - orgPointsScored (sum)             │
└──────────────┬───────────────────────┘
               │
               ├─────────────────────────────────────────────┐
               │                                             │
               ▼                                             ▼
LEVEL 5a: CLAIM DATA                        LEVEL 5b: STAKEHOLDER TYPE
┌──────────────────────────────┐            ┌─────────────────────────────┐
│  Aggregate external claims:  │            │  Determine primary type:    │
│  - totalClaimed (ClaimTable) │            │  - Count stakeholder types  │
│  - totalPlanted (PlantingTbl)│            │  - Across all local orgs    │
│  - claimVsPlanted ratio      │            │  - Most frequent = primary  │
└──────────────┬───────────────┘            └──────────────┬──────────────┘
               │                                           │
               └───────────────┬───────────────────────────┘
                               │
                               ▼
LEVEL 6: FINAL ORG SCORE (orgScore)
┌──────────────────────────────────────────────────────────┐
│  Apply claim disclosure penalty:                         │
│  orgScore = preClaimScore × claimVsPlanted               │
│                                                           │
│  Example:                                                 │
│  - preClaimScore: 75% (good project quality)             │
│  - claimVsPlanted: 0.09 (claimed 11M, verified 1M)       │
│  - orgScore: 75% × 0.09 = 6.75% ⚠️                       │
│                                                           │
│  Store in OrgScore_agg_helper                            │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
LEVEL 7: ORG PERCENTILES (final rankings)
┌──────────────────────────────────────────────────────────┐
│  Rank orgs by orgScore:                                  │
│                                                           │
│  A) Overall Percentile                                   │
│     PERCENT_RANK() OVER (ORDER BY orgScore)              │
│     → orgPercentile (0-100)                              │
│                                                           │
│  B) Percentile By Type                                   │
│     PERCENT_RANK() OVER (                                │
│       PARTITION BY primaryStakeholderType                │
│       ORDER BY orgScore                                  │
│     )                                                     │
│     → orgPercentileByType (0-100)                        │
│                                                           │
│  This ensures orgs compete fairly within their category  │
│  (nurseries vs nurseries, not nurseries vs developers)   │
└──────────────────────────────────────────────────────────┘

KEY INSIGHT:
The "preClaimScore" is calculated BEFORE the claim penalty is applied.
The claim penalty is the FINAL step that produces the actual score used for rankings.

  preClaimScore = average of project scores (before penalty)
  orgScore = preClaimScore × claimVsPlanted (final score after penalty)
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

---

## Organization Scoring Strategy

**Organization score = average of all project scores for that organization**

This approach is:
- **Faster**: Reuses already-calculated project scores instead of re-aggregating thousands of granular scores
- **Fairer**: Each project counts equally, regardless of size
- **Simpler**: "This org's average project score is 75%" is easier to understand
- **Cached**: Project scores are already in `ProjectScore_agg_helper`

**Example:**
- Org has 3 projects: 80%, 60%, 90%
- preClaimScore = (80 + 60 + 90) / 3 = 76.7%
- If claimVsPlanted = 0.5 (only disclosed 50% of claims)
- orgScore = 76.7% × 0.5 = 38.3%
 


 