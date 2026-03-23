# Claim Normalization Methodology

**How we convert hectares, sites, and trees into a single comparable metric**

---

## The Problem

Organizations make claims in different units:
- "We planted 10 million trees"
- "We restored 50,000 hectares"  
- "We have 200 project sites"

To compare disclosure ratios fairly, we normalize everything to **tree-equivalents**.

---

## The Solution: Unit Conversion

All claims are converted to a canonical unit: **trees**.

| Claim Type | Conversion | Source |
|------------|------------|--------|
| Trees | 1:1 (no conversion) | Direct claim |
| Hectares | × `TREES_PER_HECTARE` | External benchmark |
| Sites | × `TREES_PER_SITE` | External benchmark |

### Why External Benchmarks?

We do NOT derive conversion factors from reported data because:
1. **Hectare inflation is endemic** — orgs claim vast areas to obscure traceability
2. **Self-reported trees/hectare is unreliable** — even good platforms don't enforce accurate boundaries
3. **The data is skewed** — actual reforestation density is much higher than what platforms report

Instead, we use **external scientific benchmarks** (FAO, peer-reviewed literature) for conversion factors.

---

## Current Conversion Factors

```
TREES_PER_HECTARE = 1,100  (FAO reforestation standard: 1,000-1,200 stems/ha)
TREES_PER_SITE    = 25,000 (derived from complete-case orgs, updated quarterly)
```

### Where These Numbers Come From

**TREES_PER_HECTARE (1,100):**
- FAO Technical Paper: "Global Forest Resources Assessment" recommends 1,000-1,200 stems/ha for reforestation
- We use the midpoint (1,100) as a conservative estimate
- This is MUCH higher than platform-reported averages (~200-400) because platforms allow inflated hectare claims

**TREES_PER_SITE (25,000):**
- Calculated from organizations that report BOTH trees AND sites
- Median value from complete-case subset (orgs with all three dimensions)
- Updated quarterly as more data becomes available

---

## The Math (Dimensional Analysis)

This is standard **dimensional analysis** — the same technique used in physics and engineering to convert units.

```
trees = hectares × (trees/hectare)
trees = sites × (trees/site)
```

When an org reports multiple claim types, we:
1. Convert each to tree-equivalents
2. Take the **average** (not worst-case, not best-case)
3. Use that average as their total claim

### Example

```
Org claims: 1,000 hectares + 50 sites (no direct tree count)

Hectare conversion: 1,000 × 1,100 = 1,100,000 trees
Site conversion:    50 × 25,000   = 1,250,000 trees

Average: (1,100,000 + 1,250,000) / 2 = 1,175,000 trees

This org's normalized claim = 1,175,000 trees
```

---

## For the Technically Curious

The underlying framework is **Bayesian imputation with informative priors**:

1. **Prior distribution**: External benchmarks (FAO data, scientific literature)
2. **Likelihood**: What we observe in complete-case organizations
3. **Posterior**: The conversion factors we actually use

We chose external priors over data-derived priors because the reported data is systematically biased (hectare inflation). Using their own data to impute missing values would propagate the bias.

This is the **burden-of-proof** model: organizations accept the published default unless they provide their actual data.

---

## Claim Analysis Status

Not all organizations can be analyzed equally. We track this with `claimAnalysisStatus`:

| Status | Meaning | Scoring Impact |
|--------|---------|----------------|
| `verified` | All claims are reforestation, can be fully analyzed | Full disclosure ratio applied |
| `mixed` | Contains conservation/other claims we can't isolate | Only reforestation claims scored |
| `unverifiable` | Cannot isolate reforestation from other activities | Disclosure ratio = 1.0 (no penalty, no bonus) |
| `pending` | Not yet reviewed | Treated as `unverifiable` until reviewed |

### Why This Matters

Conservation projects legitimately claim huge areas (protecting 100,000 hectares of rainforest). These are NOT comparable to reforestation claims (planting 100,000 hectares of new trees).

If we can't isolate reforestation claims from conservation claims, we cannot fairly apply the disclosure ratio. These orgs go to `unverifiable` status and are scored only on field completeness.

---

## The One-Sentence Summary

> Claims are normalized to tree-equivalents using published external benchmarks. Organizations may override defaults by providing verified data.

---

## Updating Conversion Factors

Conversion factors are stored in `GlobalDefaultsTable` and updated quarterly:

1. Pull latest FAO/scientific benchmarks for `TREES_PER_HECTARE`
2. Recalculate `TREES_PER_SITE` from complete-case organizations
3. Re-run scoring batch to apply new factors
4. Document changes in `scoreHistoryLog`

---

## References

- FAO (2020). Global Forest Resources Assessment. Technical Report.
- Stanturf, J.A. et al. (2014). "Forest Landscape Restoration: State of Play." Unasylva 245.
- IPCC (2019). Climate Change and Land. Chapter 4: Land Degradation.
