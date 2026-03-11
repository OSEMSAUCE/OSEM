# Kimball Rename Matrix

This document proposes a **Kimball-informed rename pass** for the scoring and analytics parts of the schema while **keeping camelCase** for Prisma and TypeScript consistency.

## Recommendation

Use **camelCase + Kimball semantics**, not mixed casing.

That means:
- Keep Prisma-style `camelCase` for model fields.
- Use Kimball concepts for **which tables are fact-like, dimension-like, aggregate, rank, snapshot, and derived**.
- Rename only where the current name hides the table's analytical role or violates the naming guide.

---

## Implementation Plan

### Phase 1 - define for each table:
Select the business process. Declare the grain. Identify the dimensions. Identify the facts.

### Phase 2 — Freeze naming rules

Decide and document the naming policy before changing code:

- `...Key` = deterministic business key
- `...Id` = opaque/generated technical identifier
- `...Type` / `...Code` = controlled categorical value
- `...At` or `...Ts` = timestamp fields

Goal:

- stop mixing semantics
- make future schema changes consistent
- avoid renaming the same concept twice

### Phase 3 — Clean up the analytics layer first

Do the highest-value, lowest-risk renames first:

- rename analytical tables away from `helper`
- convert analytics fields from `snake_case` to `camelCase`
- standardize timestamp field naming

Goal:

- make the scoring layer read like a real analytics model
- improve clarity without disturbing the core operational tables first

### Phase 4 — Rename business keys consistently

If you commit to the `Key` vs `Id` distinction, do it as one coherent pass:

- rename business-key primary keys such as `projectId` to `projectKey`
- rename matching foreign keys at the same time
- rename polymorphic references like `parentId` to `parentKey` if they store row keys

Goal:

- make row identity terminology match reality
- avoid mixed patterns like `Project.projectKey` referenced by `Land.projectId`

### Phase 5 — Re-evaluate enums vs lookup tables

Review each enum based on governance needs:

- keep as enum if it is small, stable, and code-owned
- convert to lookup if it needs descriptions, sort order, grouping, aliases, or business-managed values

Goal:

- avoid creating unnecessary reference tables
- only promote categories that truly need their own governance layer

### Phase 6 — Consider surrogate IDs only if needed

This is a separate architectural choice and should not be mixed into the rename pass unless necessary.

Possible future state:

- `projectId` = opaque technical primary key
- `projectKey` = business key

Goal:

- preserve the option for a more warehouse-like surrogate-key model later
- avoid mixing two migrations into one giant refactor

---

## Table Role Classification

| Current Table                    | Layer               | Kimball Interpretation | Change? | Reason |
| ---                              | ---                 | ---                    | ---     | ---    |
| `OrganizationTable`              | Operational         | Dimension-like         | No      | Core entity table; already readable and stable. |
| `ProjectTable`                   | Operational         | Dimension-like         | No      | Core entity table; central business object. |
| `LandTable`                      | Operational         | Dimension-like         | No      | Entity/context table, not a scoring fact. |
| `CropTable`                      | Operational         | Dimension-like         | No      | Same reason. |
| `PlantingTable`                  | Operational / Event | Fact-like operational event table | No | Good domain name already. |
| `StakeholderTable`               | Operational / Relationship | Bridge-like relationship table | No | Good domain name; clearer than forcing Kimball jargon. |
| `ClaimTable`                     | Operational / Event | Fact-like operational event table | No | Good business/event name already. |
| `ProjectScore_granular_helper`   | Analytics           | Fact table             | Yes     | Current name hides that this is the core field-level scoring fact table. |
| `ProjectScore_agg_helper`        | Analytics           | Aggregate fact table   | Yes     | `agg_helper` is vague; this is a real analytical output table. |
| `OrgScore_helper`                | Analytics           | Aggregate fact table / snapshot | Yes | `helper` undersells it; this is a scored org analytical table. |
| `StakeholderType_granular_helper`| Analytics | Derived summary / bridge-like output | Yes | Current name is hard to parse and hides its derived nature. |
| `StakeholderTypeTable`           | Reference | Dimension / lookup table | Maybe | Only if you want stronger naming consistency for reference dimensions. |

---

## Four Design Decisions by Table

This is the shortest useful Kimball framing for the main tables.

| Table | Business Process | Grain | Dimensions / Context | Facts / Measures |
| --- | --- | --- | --- | --- |
| `ProjectTable` | Track restoration projects | One row per project | platform, registry, dates, project identity | Mostly descriptive attributes, not additive facts |
| `LandTable` | Track land units or subzones inside projects | One row per land unit | project, location, treatment, land identity | `hectares` |
| `PlantingTable` | Track planting events or planting allocations | One row per planting record for a parent and date/year | project, parent entity, unit type, currency, date | `planted`, `allocated`, `units`, `pricePerUnit`, `pricePerUnitUSD` |
| `ClaimTable` | Track planting or impact claims | One row per claim | organization, source | `claimCount` |
| `SourceTable` | Track source provenance | One row per source URL tied to a parent | url type, disclosure type, stakeholder type, parent entity | Mostly descriptive; `displayRank` is weakly factual |
| `OrganizationTable` | Track master organizations | One row per organization | org identity, contact, site, location | Mostly descriptive attributes |
| `OrganizationLocalTable` | Track platform-local organizations | One row per local organization record | source platform, linked master org, slug, contact | Mostly descriptive attributes |
| `StakeholderTable` | Track org participation in parent entities | One row per organization-parent relationship | org, parent entity, stakeholder type | Relationship table; not a classic additive fact table |
| `CropTable` | Track crop/species records by project | One row per crop within a project | project, species, local org context | Mostly descriptive attributes |
| `PolygonTable` | Track geometry records for land | One row per polygon | land, geometry type | `hectaresCalc` |
| `PolyTable` | Track additional parent-level metadata | One row per parent metadata record | parent entity, restoration type | `survivalRate`, `ratePerTree` plus mixed descriptive attributes |
| `SurveyTable` | Track survey plots | One row per survey plot | project, land, platform | `qualityPercent`, `radius` |
| `ProjectScore_granular_helper` | Score field completeness | One row per project per field | project, field name | `points_available`, `is_awarded`, `points_awarded` |
| `ProjectScore_agg_helper` | Aggregate project scoring | One row per project | project | `project_score`, `project_rank`, `sum_points_available`, `sum_points_scored` |
| `OrgScore_helper` | Aggregate organization scoring | One row per organization | organization, stakeholder type | `org_score_pre_claim`, `sum_claimed`, `sum_planted`, `sum_undisclosed`, `org_score_final` |
| `StakeholderType_granular_helper` | Derive org stakeholder typing | One row per stakeholder typing output | organization, local org, stakeholder, stakeholder type | Mostly derived classification output, not additive measures |

---

## Proposed Table Renames

Only tables worth changing are listed below.

| Current Name | Proposed Name | Reason |
| --- | --- | --- |
| `ProjectScore_granular_helper` | `ProjectScoreFact` | Best Kimball-style camelCase compromise. This is the field-level fact table for project scoring. |
| `ProjectScore_agg_helper` | `ProjectScoreSummary` | Clearer than `agg_helper`. This is not just a helper; it is the project-level summary used for ranking and analytics. |
| `OrgScore_helper` | `OrgScoreSummary` | Same logic. It is a true org-level analytical summary table. |
| `StakeholderType_granular_helper` | `OrgStakeholderTypeSummary` | Makes the purpose explicit: a derived summary about org stakeholder typing. |
| `StakeholderTypeTable` | `StakeholderTypeDim` | Optional. Only if you want to signal that this is a reference/dimension-style lookup table. |

## Table Rename Notes

### Keep as-is
Do **not** rename core entity tables like:
- `OrganizationTable`
- `ProjectTable`
- `LandTable`
- `CropTable`
- `ClaimTable`
- `StakeholderTable`

These are already clean business names. Forcing `dim` prefixes into the operational layer would make the app model worse, not better.

### Why remove `helper`
`helper` sounds temporary, weak, or implementation-specific.

In your case, these tables are not incidental helpers. They are:
- persisted analytical artifacts
- reused by ranking logic
- exposed to Cube
- part of your scoring model

So `helper` is underselling real analytical tables.

---

## Proposed Attribute Renames

Only attributes worth changing are listed below.

| Current Name | Proposed Name | Reason |
| --- | --- | --- |
| `lastUpdated` | `lastUpdatedTs` or `lastUpdatedAt` | Matches the naming guide for timestamps. Pick one style and use it consistently. |
| `lastUpdatedHuman` | `lastUpdatedHumanText` or `lastUpdatedLocalText` | Current name is understandable but vague. If kept, document that it is display-oriented text, not a machine timestamp. |
| `org_rank_overall` | `orgOverallRank` | If you do a full camelCase cleanup of analytics fields, this aligns with Prisma style. |
| `org_rank_by_type` | `orgRankByType` | Same. Avoid mixed snake_case inside a camelCase schema. |
| `org_score_pre_claim` | `orgScorePreClaim` | Same reason. |
| `org_score_final` | `orgScoreFinal` | Same reason. |
| `project_rank` | `projectRank` | Same reason. |
| `project_score` | `projectScore` | Same reason. |
| `sum_points_available` | `sumPointsAvailable` | Same reason. |
| `sum_points_scored` | `sumPointsScored` | Same reason. |
| `field_name` | `fieldName` | Same reason. |
| `is_awarded` | `isAwarded` | Same reason. |
| `points_available` | `pointsAvailable` | Same reason. |
| `points_awarded` | `pointsAwarded` | Same reason. |
| `sum_claimed` | `sumClaimed` | Same reason. |
| `sum_planted` | `sumPlanted` | Same reason. |
| `sum_undisclosed` | `sumUndisclosed` | Same reason. |
| `stakeholder_type_desc` | `stakeholderTypeDesc` | Current field mixes snake_case into a camelCase schema. |

---

## Important Observation

Your schema currently mixes **two naming systems at once**:
- model/most fields in `camelCase`
- several scoring/reference fields in `snake_case`

That is the strongest naming problem in the schema right now.

If you do one large cleanup, the most defensible cleanup is:
- **keep all models in camelCase**
- **convert snake_case analytics fields to camelCase**
- **rename `helper` tables to fact/summary-style names**

That gives you a professional and internally consistent result.

---

## Suggested Direction

### Direction A — Recommended
**CamelCase everywhere + Kimball semantics**

Do this if you want the best fit for your current stack.

Changes:
- Keep core operational tables as they are.
- Rename analytical tables away from `helper`.
- Convert analytics fields from snake_case to camelCase.
- Keep the Kimball ideas in documentation and table roles.

### Direction B — Not recommended unless doing a full platform reset
**Full snake_case across schema and SQL-facing layer**

Do this only if you are willing to also rework the surrounding stack and accept a major migration.

Changes:
- Rename almost every model and field.
- Revisit Prisma conventions.
- Rewrite raw SQL, Cube YAML, and all TypeScript accesses.

This is more invasive than the value it buys right now.

---

## Enum vs Lookup Table Guidance

Do **not** convert every enum into a lookup table right now.

Use this rule:

- keep it as an enum if it is small, stable, and code-owned
- convert it to a lookup table if it needs metadata, descriptions, aliases, ordering, grouping, active/inactive flags, or business-managed changes

| Enum / Category | Recommendation | Reason |
| --- | --- | --- |
| `ParentTableEnum` | Keep enum | Internal polymorphic wiring; code-owned and stable |
| `GeometryType` | Keep enum | Standard geospatial vocabulary; very stable |
| `UrlType` | Keep enum for now | Small controlled set; only promote if you need metadata |
| `CarbonRegistryType` | Keep enum for now | Small and stable |
| `CarbonRegistry` | Keep enum for now | Stable enough unless you want descriptions or status flags |
| `UnitType` | Borderline | Business-facing and may eventually need aliases or governance |
| `DisclosureType` | Borderline | May evolve and may benefit from descriptions / governance |
| `TreatmentType` | Borderline | Domain taxonomy may grow or split |
| `RestorationType` | Borderline | Domain taxonomy may grow or split |
| `StakeholderType` | Use lookup table | Strongest case for a governed reference dimension |

Recommended conversion order if you decide to promote enums later:

1. `StakeholderType`
2. `DisclosureType`
3. `UnitType`
4. `TreatmentType` / `RestorationType`

---

## Claim and Disclosure Unit Grain

For claim scoring, the hardest modeling question is not naming. It is **unit grain**.

You need to decide what one comparable claimed/disclosed quantity means:

- trees
- hectares
- or a multi-unit model that supports both without converting them into each other

### Recommended now

Use **trees as the only scored claim unit for now**.

Reason:

- `ClaimTable.claimCount` already behaves like a tree-count claim
- `PlantingTable.planted` is your clearest matching disclosed quantity
- this gives you one clean comparison grain for the org disclosure penalty
- it avoids inventing fake conversions between trees and hectares

This keeps the current org scoring logic defensible:

- `sumClaimed` = total trees claimed
- `sumPlanted` = total trees evidenced in planting records
- `sumUndisclosed` = claimed trees not yet evidenced
- `orgScoreFinal` = score after disclosure penalty on the tree-count basis

### What to avoid now

Do **not** combine hectares and trees into one scored denominator unless you have a trustworthy conversion rule.

Why:

- a hectare is area
- a tree count is quantity
- the relationship varies by species, density, geography, and project design
- any forced conversion would make the score look more precise than it really is

### Future-safe path

If you later want to score both trees and hectares, do it by adding **unit-aware facts**, not by silently converting units.

Preferred future pattern:

- store the claimed/disclosed unit explicitly
- score trees against trees
- score hectares against hectares
- only compare like-with-like

Possible future fields or tables:

- `claimUnitType`
- `plantedUnitType`
- `sumClaimedTrees`
- `sumPlantedTrees`
- `sumClaimedHectares`
- `sumPlantedHectares`

Possible future analytical output:

- `OrgDisclosureGapFact`
- grain: one row per organization per scoring run per unit type

That would let you say:

- tree disclosure score
- hectare disclosure score
- mixed or unknown units = unresolved / not comparable

### Recommendation in one sentence

For this app's current scope, **cut losses and score claims in trees only** until you have a real, governed multi-unit model.

---

## Minimal Rename Set Worth Doing

If you want the highest-value changes with the least churn, do only these:

| Current Name | Proposed Name | Reason |
| --- | --- | --- |
| `ProjectScore_granular_helper` | `ProjectScoreFact` | Makes the table's analytical role obvious. |
| `ProjectScore_agg_helper` | `ProjectScoreSummary` | Removes vague `agg_helper` wording. |
| `OrgScore_helper` | `OrgScoreSummary` | Removes vague `helper` wording. |
| `lastUpdated` | `lastUpdatedAt` | Standardizes timestamp naming. |
| `lastUpdatedHuman` | `lastUpdatedHumanText` | Makes this display field less ambiguous. |

---

## Final Advice

If you want the schema to read as **professional analytics engineering** rather than ad hoc helper-table sprawl, the main fix is not Python vs TypeScript and not snake_case vs camelCase.

The main fix is:
- correct grain
- clear fact vs dimension roles
- consistent naming
- analytical tables named as analytical tables, not as `helper`

That is the strongest move you can make from where the schema is now.
