# Naming Conventions for Scoring System
 
**Reference Guide for Attribute Naming in Dimensional/Analytical Models**

This document defines the naming patterns used in our scoring system, following Kimball dimensional modeling and dbt style guide conventions.

---

## Attribute Class Suffixes

| Class(Suffix) | What it means                 | Example Attribute                |
|---------------|-------------------------------|----------------------------------|
| `Amt`        | Monetary value (Currency)     | `net_sales_amt`, `discount_amt`  |
| `Count`      | Count of items                | `project_count`, `error_count`   |
| `Desc`       | Long text description         | `project_desc`, `item_desc`      |
| `Dt`         | Calendar Date (no time)       | `ship_date`, `planting_date`     |
| `Id`         | Unique Identifier (Natural Key) | `project_id`, `organization_id`|
| `Is`         | Boolean (Yes/No flag)         | `is_awarded`                     |
| `Name`       | Short text name               | `field_name`, `organization_name`|
| `Pct`        | Percentage (0-100 or 0.0-1.0) | `discount_pct`, `completion_pct` |
| `Qty`        | Numeric quantity / Tally      | `order_qty`, `tree_qty`          |
| `Ratio`      | Ratio between two values      | `claim_ratio`, `conversion_ratio`|
| `Rate`       | Rate of change or occurrence  | `growth_rate`, `error_rate`      |
| `Rank`       | Percentile or ordinal rank    | `project_rank`, `percentile_rank`|
| `Score`      | Calculated score/grade        | `project_score`, `quality_score` |
| `Slug`       | URL-friendly identifier       | `project_slug`, `organization_slug`|
| `Ts`         | Precise Timestamp (with time) | `created_at`, `last_updated_at`  |
| `Type`       | stakeholderType               | `stakeholder_type`               |
| `Value`      | Lookup/reference value        | `field_point_value`, `unit_value`|

---

## Aggregate Prefixes

Use these prefixes for aggregated/calculated measures:

| Prefix | What it means | Example |
|--------|---------------|---------|
| `total_` | Sum across all records | `total_revenue`, `total_points_scored` |
| `sum_` | Explicit sum (same as total_) | `sum_points_available`, `sum_claimed` |
| `avg_` | Average/mean value | `avg_order_value`, `avg_score` |
| `max_` | Maximum value | `max_temperature`, `max_points` |
| `min_` | Minimum value | `min_price`, `min_score` |
| `count_` | Count of records | `count_projects`, `count_errors` |

**Important:** Only use these prefixes for actual aggregated values, not for lookup/reference values.

---

## Our Scoring System Examples

### Granular Level (Field Measurements)
```
field_name              String   // Dimension: which field (geometry, gpsLat, etc.)
field_point_value       Int      // Lookup: points this field is worth (from config)
points_scored           Int      // Measure: actual points earned (0 or field_point_value)
is_awarded              Boolean  // Flag: whether field has data
```

### Aggregate Level (Project Totals)
```
project_id                  String   // Dimension: unique project identifier
total_points_available      Int      // Measure: sum of all field_point_value
total_points_scored         Int      // Measure: sum of all points_scored where is_awarded
completion_score            Decimal  // Ratio: total_points_scored / total_points_available
percentile_rank             Int      // Rank: where project ranks (0-100)
```

### Organization Level
```
organization_id             String   // Dimension: unique org identifier
org_score_pre_claim         Decimal  // Measure: avg project score before penalty
sum_claimed                 Int      // Measure: total trees claimed
sum_planted                 Int      // Measure: total trees with proof
claim_ratio                 Decimal  // Ratio: sum_planted / sum_claimed
org_score_final             Decimal  // Measure: pre_claim × claim_ratio
org_rank_overall            Int      // Rank: among all orgs
org_rank_by_type            Int      // Rank: within stakeholder type
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
projectID              // camelCase
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
ProjectScore_granular_helper  → Fact table (measurements per field)
ProjectScore_agg_helper       → Fact table (aggregated measurements per project)
ProjectTable                  → Dimension table (project attributes)
OrganizationTable             → Dimension table (org attributes)
```

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
