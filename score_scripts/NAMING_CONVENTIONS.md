# Naming Conventions for Scoring System
 
**Reference Guide for Attribute Naming in Dimensional/Analytical Models**

This document defines the naming patterns used in our scoring system, following Kimball dimensional modeling and dbt style guide conventions.

---

## Database Attribute Suffixes

| Suffix  | What it means                  | Example Attribute                    |
|---------|--------------------------------|--------------------------------------|
| `At`    | Timestamp (date + time)        | `createdAt`, `lastEditedAt`          |
| `Desc`  | Long text description          | `projectDesc`, `organizationDesc`    |
| `Dt`    | Calendar date (no time)        | `plantingDt`, `projectStartDt`       |
| `Id`    | External/foreign identifier    | `platformId`, `speciesId`            |
| `Key`   | Primary identifier (our PKs)   | `projectKey`, `organizationKey`      |
| `Name`  | Short text name                | `projectName`, `organizationName`    |
| `Pct`   | Percentage (0-100 or 0.0-1.0)  | `survivalRatePct`, `qualityPct`      |
| `Qty`   | Numeric quantity / tally       | `plantedQty`, `claimQty`             |
| `Rank`  | Percentile or ordinal rank     | `scoreProjectRank`, `scoreRankOverall` |
| `Ratio` | Ratio between two values       | `claimRatio`, `conversionRatio`      |
| `Rate`  | Rate of change or occurrence   | `growthRate`, `errorRate`            |
| `Score` | Calculated score/grade         | `scoreProject`, `scoreOrgFinal`      |
| `Slug`  | URL-friendly identifier        | `projectSlug`, `organizationSlug`    |
| `Type`  | Category/classification        | `stakeholderType`, `unitType`        |
| `Value` | Lookup/reference value         | `fieldPointValue`, `unitValue`       |

## Boolean Prefixes

**All boolean fields MUST use `is` or `has` prefix.**

| Prefix | What it means        | Example Attribute                    |
|--------|----------------------|--------------------------------------|
| `is`   | State/condition flag | `isPublic`, `isAwarded`, `isActive`  |
| `has`  | Possession flag      | `hasGeometry`, `hasPlantings`        |

---

## Aggregate Prefixes

Use these prefixes for aggregated/calculated measures:

| Prefix   | What it means | Example |
|----------|---------------|---------|
| `total_` | Sum across all records | `total_revenue`, `total_points_scored` |
| `sum_`   | Explicit sum (same as total_) | `sum_points_available`, `sum_claimed` |
| `avg_`   | Average/mean value | `avg_order_value`, `avg_score` |
| `max_`   | Maximum value | `max_temperature`, `max_points` |
| `min_`   | Minimum value | `min_price`, `min_score` |
| `count_` | Count of records | `count_projects`, `count_errors` |

**Important:** Only use these prefixes for actual aggregated values, not for lookup/reference values.

---

## Our Scoring System Examples

### Granular Level (Field Measurements)
```
field_name              String   // Dimension: which field (geometry, latitude, etc.)
field_point_value       Int      // Lookup: points this field is worth (from config)
points_scored           Int      // Measure: actual points earned (0 or field_point_value)
is_awarded              Boolean  // Flag: whether field has data
```

### Aggregate Level (ProjectTable - scoring fields merged in)
```
projectKey                  String   // Dimension: unique project identifier
scorePointsAvailable        Int?     // Measure: sum of all field points_available
scorePointsScored           Int?     // Measure: sum of all points_awarded where is_awarded
scoreProject                Decimal? // Ratio: scorePointsScored / scorePointsAvailable (0.0-1.0)
scoreRank                   Int?     // Rank: percentile rank among all projects (0-100)
scoreHistoryLog             Json?    // Array: historical score snapshots
```

### Organization Level (OrganizationTable - scoring fields merged in)
```
organizationKey             String   // Dimension: unique org identifier
scoreOrgPreClaim            Decimal? // Measure: avg project score before penalty
scoreSumClaimed             Int?     // Measure: total trees claimed
scoreSumPlantedQty          Int?     // Measure: total trees with proof
scoreSumUndisclosed         Int?     // Measure: scoreSumClaimed - scoreSumPlantedQty (disclosure gap)
scoreOrgFinal               Decimal? // Measure: scoreOrgPreClaim × (scoreSumPlantedQty / scoreSumClaimed)
scoreRankOverall            Int?     // Rank: among all orgs (0-100)
scoreRankByType             Int?     // Rank: within stakeholder category (0-100)
scorePointsAvailable        Int?     // Reference: sum of all project points available
scorePointsScored           Int?     // Reference: sum of all project points scored
scoreHistoryLog             Json?    // Array: historical score snapshots
```

---

## Anti-Patterns (What NOT to Do)

❌ **Don't use aggregate prefixes for non-aggregates:**
```
sum_points_per_field   // BAD - not a sum, just a lookup value
```

✅ **Use descriptive names instead:**
```
field_point_value      // GOOD - clearly a reference value
```

❌ **Don't use vague names:**
```
value                  // BAD - value of what?
score                  // BAD - which score?
```

✅ **Be specific:**
```
field_point_value      // GOOD - the point value for a field
project_score          // GOOD - the score for a project
```

❌ **Don't mix naming styles:**
```
projectKey              // camelCase
project_name           // snake_case (inconsistent)
```

✅ **Pick one style and stick with it:**
```
project_id             // snake_case (our standard)
project_name           // snake_case
organization_id        // snake_case
```

---

## Fact vs Dimension Naming

### Fact Tables (Measurements/Events)
- Contain numeric measures
- Usually plural or descriptive: `fct_orders`, `project_scores_granular`
- Columns are mostly numeric with some foreign keys

### Dimension Tables (Attributes/Context)
- Contain descriptive attributes
- Usually singular: `dim_customer`, `ProjectTable`
- Columns are mostly text/dates with an ID

### Our Tables
```
ProjectScoreByFieldTable      → Fact table (measurements per field)
ProjectTable                  → Dimension table (project attributes + scoring metrics)
OrganizationTable             → Dimension table (org attributes + scoring metrics)
RestorationTypeTable          → Lookup table (restoration type categories)
TreatmentTypeTable            → Lookup table (treatment type categories)
```

**Note:** Scoring metrics are now embedded directly in dimension tables (denormalized for performance). Historical scores tracked via `scoreHistory` JSONB column.

---

## CSS Class Naming Conventions

**All CSS goes in centralized files, not in component `<style>` blocks.**

### CSS Files

| File | Purpose |
|------|---------|
| `lib/styles/base.css` | Shared structural CSS (both OSEM & ReTreever) |
| `lib/styles/app.css` | Project-specific theme (colors, imports) |
| `lib/styles/map.css` | Mapbox-specific styles |

### Class Naming Pattern

Use **verbose, component-prefixed names** for indexing and searchability:

```
{component}-{element}-{modifier}
```

| Pattern | Example | Description |
|---------|---------|-------------|
| `{component}-container` | `stage-who-what-select-container` | Root wrapper |
| `{component}-input` | `stage-who-what-select-input` | Input element |
| `{component}-dropdown` | `stage-who-what-select-dropdown` | Dropdown panel |
| `{component}-item` | `stage-who-what-select-item` | List item |
| `{component}-item--highlighted` | `stage-who-what-select-item--highlighted` | Modifier state |
| `{component}-item--loading` | `stage-who-what-select-item--loading` | Loading state |

### Animation Naming

```
{component}-{animation-type}
```

| Pattern | Example |
|---------|---------|
| `{component}-glow` | `stage-who-what-select-glow` |
| `{component}-pulse` | `stage-who-what-select-pulse` |
| `{component}-blink` | `stage-who-what-select-caret-blink` |

### Component CSS Block Headers

Use comment headers in `base.css` to index component sections:

```css
/* =============================================================================
   STAGE WHO WHAT SELECT COMPONENT
   See: NAMING_CONVENTIONS.md > CSS Class Naming Conventions
   ============================================================================= */
```

### Why Verbose Names?

1. **Indexing** — Easy to grep/search across codebase
2. **No collisions** — Component prefix prevents conflicts
3. **Self-documenting** — Class name tells you exactly what it styles
4. **Centralized** — All CSS in `base.css`/`app.css`, no `:global()` hacks

---

## References

- **dbt Style Guide**: https://github.com/dbt-labs/corp/blob/main/dbt_style_guide.md
- **Kimball Dimensional Modeling**: "The Data Warehouse Toolkit" by Ralph Kimball
- **PostgreSQL Naming**: https://www.sqlstyle.guide/
- **Our Scoring Documentation**: `theScore.md`

---

## Quick Decision Tree

**Naming a new attribute? Ask yourself:**

1. **Is it an identifier?** → Use `_id` suffix
2. **Is it a boolean?** → Use `is_` or `has_` prefix
3. **Is it a date/time?** → Use `_date` or `_at` suffix
4. **Is it an aggregated value?** → Use `total_`, `sum_`, `avg_` prefix
5. **Is it a ratio/percentage?** → Use `_ratio`, `_pct`, `_rate` suffix
6. **Is it a lookup/reference value?** → Use descriptive name with `_value` suffix
7. **Is it a calculated score?** → Use `_score` suffix
8. **Is it a rank?** → Use `_rank` suffix

When in doubt, **be explicit and descriptive**. Better to have a long, clear name than a short, confusing one.
