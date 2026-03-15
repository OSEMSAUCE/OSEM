# Schema Migration Summary - March 14, 2026

## Overview
Major schema consolidation and naming convention standardization. This migration merges helper tables, renames fields to follow camelCase conventions, and converts enums to lookup tables for flexibility.

---

## Table Merges

### 1. OrgScoreTable → OrganizationTable ✅
**Rationale:** 1:1 relationship, eliminate JOIN for org pages, simpler schema

**Fields Added to OrganizationTable:**
- `scoreRankOverall` (Int?) - PERCENT_RANK among all orgs (0-100)
- `scoreRankByType` (Int?) - PERCENT_RANK within stakeholder type (0-100)
- `scorePointsAvailable` (Int?) - Sum of all project points available
- `scorePointsScored` (Int?) - Sum of all project points scored
- `scoreOrgPreClaim` (Decimal?) - AVG(project_score) before penalty
- `scoreSumClaimed` (Int?) - Total trees claimed
- `scoreSumPlantedQty` (Int?) - Total trees with planting data
- `scoreSumUndisclosed` (Int?) - scoreSumClaimed - scoreSumPlantedQty (disclosure gap)
- `scoreOrgFinal` (Decimal?) - scoreOrgPreClaim × (scoreSumPlantedQty / scoreSumClaimed)
- `scoreLastUpdated` (DateTime?) - When scoring was last calculated
- `scoreHistoryLog` (Json?) - Array of historical score snapshots

**Indexes Added:**
- `@@index([primaryStakeholderType])`
- `@@index([scoreOrgFinal])`

**Table Deleted:**
- `OrgScoreTable` (entire model removed)

---

### 2. ProjectScore_agg_helper → ProjectTable ✅
**Rationale:** 1:1 relationship, eliminate JOIN for project pages, simpler schema

**Fields Added to ProjectTable:**
- `scoreRank` (Int?) - PERCENT_RANK among all projects (0-100)
- `scoreProject` (Decimal?) - (scorePointsScored / scorePointsAvailable)
- `scorePointsAvailable` (Int?) - Sum of points_available for all fields
- `scorePointsScored` (Int?) - Sum of points_awarded for all awarded fields
- `scoreLastUpdated` (DateTime?) - When scoring was last calculated
- `scoreHistoryLog` (Json?) - Array of historical score snapshots

**Index Added:**
- `@@index([scoreProject])`

**Table Deleted:**
- `ProjectScore_agg_helper` (entire model removed)

---

## Enum → Lookup Table Conversions

### 3. RestorationType → RestorationTypeTable ✅
**Rationale:** User frequently regroups/changes restoration types, enum requires schema migration for each change

**New Table:**
```prisma
model RestorationTypeTable {
  restorationTypeId   String     @id
  restorationTypeName String     @unique
  category            String?    // e.g., "active", "passive", "conservation"
  description         String?
  sortOrder           Int?
  isActive            Boolean    @default(true)
  PolyTable           PolyTable[]
}
```

**Updated Reference:**
- `PolyTable.restorationType` (RestorationType?) → `PolyTable.restorationTypeId` (String?)

**Enum Values to Seed:**
1. reforestation
2. seeding_drone
3. urban_reforestation
4. planting_mechanical
5. seeding_aerial
6. natural_regeneration
7. conservation
8. improved_forest_management
9. avoided_deforestation
10. mangrove_regeneration (fixed typo from "magrove")
11. agroforestry

**Enum Deleted:**
- `enum RestorationType`

---

### 4. TreatmentType → TreatmentTypeTable ✅
**Rationale:** Same as RestorationType - flexible categorization without schema migrations

**New Table:**
```prisma
model TreatmentTypeTable {
  treatmentTypeId   String      @id
  treatmentTypeName String      @unique
  category          String?     // e.g., "carbon", "agriculture", "forestry"
  description       String?
  sortOrder         Int?
  isActive          Boolean     @default(true)
  LandTable         LandTable[]
}
```

**Updated Reference:**
- `LandTable.treatmentType` (TreatmentType?) → `LandTable.treatmentTypeId` (String?)

**Enum Values to Seed:**
1. ARR
2. improved_forest_management
3. avoided_deforestation
4. forest_conservation
5. regenerative_agriculture
6. improved_agricultural_practices
7. cover_cropping
8. restoration
9. agroforestry

**Enum Deleted:**
- `enum TreatmentType`

---

## Field Renames (Naming Convention Standardization)

### snake_case → camelCase (Prisma Schema Standard)

#### ClaimTable:
- `claimCount` → `claimQty`

#### PlantingTable:
- `plantedCount` → `plantedQty`
- `allocated` → `allocatedQty`

#### ProjectTable:
- `employmentClaim` → `employmentClaimQty`
- `projectNotes` → `projectDesc`

#### OrganizationTable:
- `organizationNotes` → `organizationDesc`
- `maxTreesPerYear` → `treeCapAnnualQty`
- `gpsLat` → `latitude`
- `gpsLon` → `longitude`

#### LandTable:
- `landNotes` → `landDesc`
- `gpsLat` → `latitude`
- `gpsLon` → `longitude`

#### CropTable:
- `cropNotes` → `cropDesc`

#### PolyTable:
- `polygonNotes` → `polygonDesc` (if exists)
- `survivalRate` → `survivalRatePct`

#### SurveyTable:
- `qualityPercent` → `qualityPct`

---

## ProjectScoreByFieldTable - Pending Renames

**Current (snake_case):**
- `field_name`
- `points_available`
- `is_awarded`
- `points_awarded`

**Should Rename To (camelCase):**
- `fieldName`
- `pointsAvailable`
- `isAwarded`
- `pointsAwarded`

**Consider Dropping:**
- `lastUpdatedHuman` (if unused - can format `lastUpdated` in UI)

---

## Migration Impact Analysis

### Breaking Changes:
1. **TypeScript Code:** All references to merged tables must be updated
   - `OrgScoreTable` → `OrganizationTable` (with new field names)
   - `ProjectScore_agg_helper` → `ProjectTable` (with new field names)

2. **Queries:** Any JOINs to deleted tables must be removed
   - Org scoring queries now single-table lookups
   - Project scoring queries now single-table lookups

3. **Enum References:** Update to use lookup table IDs
   - `RestorationType` → `restorationTypeId` (String)
   - `TreatmentType` → `treatmentTypeId` (String)

4. **Field Name Updates:** Update all references to renamed fields
   - See "Field Renames" section above
   - Affects: 4Merge.ts, 5UpsertBulk.ts, scoring scripts, UI components

### Data Migration Required:
1. **Seed RestorationTypeTable** with 11 restoration types
2. **Seed TreatmentTypeTable** with 9 treatment types
3. **Migrate existing enum values** to lookup table IDs in PolyTable and LandTable

### Performance Improvements:
- ✅ Org pages: No JOIN needed (was 2 tables, now 1)
- ✅ Project pages: No JOIN needed (was 2 tables, now 1)
- ✅ Leaderboards: Single table scan with indexes
- ✅ Scoring queries: Simpler, faster execution plans

### Schema Simplification:
- **Before:** 2 helper tables, 2 enums
- **After:** 0 helper tables, 2 lookup tables (more flexible)
- **Net:** -2 tables, +2 lookup tables (same count, better design)

---

## Post-Migration Tasks

### 1. Update TypeScript Code
- [ ] Update imports from deleted models
- [ ] Update field references to new camelCase names
- [ ] Update scoring calculation scripts
- [ ] Update UI components displaying scores

### 2. Update Queries
- [ ] Remove JOINs to OrgScoreTable
- [ ] Remove JOINs to ProjectScore_agg_helper
- [ ] Update field names in WHERE/ORDER BY clauses
- [ ] Update aggregation queries

### 3. Seed Lookup Tables
- [ ] Create seed script for RestorationTypeTable
- [ ] Create seed script for TreatmentTypeTable
- [ ] Verify all existing data migrated correctly

### 4. Update Documentation
- [x] NAMING_CONVENTIONS.md
- [x] MIGRATION-2026-03-14.md (this file)
- [ ] theScore.md
- [ ] KIMBALL_RENAME_MATRIX.md
- [ ] README files

### 5. Testing
- [ ] Test org page loads (no JOIN errors)
- [ ] Test project page loads (no JOIN errors)
- [ ] Test scoring calculations
- [ ] Test leaderboards
- [ ] Test enum → lookup table references

---

## Rollback Plan

If migration fails:
1. Revert schema.prisma to previous version
2. Run `npx prisma migrate resolve --rolled-back <migration_name>`
3. Delete failed migration file from `prisma/migrations/`
4. Fix issues and retry

**Backup recommended before migration:**
```bash
pg_dump -U postgres -d retriever > backup_pre_migration_2026-03-14.sql
```

---

## Migration Command

```bash
cd ReTreever
npx prisma migrate dev --name schema_consolidation_and_naming_conventions
```

---

## References
- Original discussion: Cascade conversation 2026-03-14
- Naming conventions: `/ReTreever/OSEM/score_scripts/NAMING_CONVENTIONS.md`
- Kimball matrix: `/ReTreever/OSEM/score_scripts/KIMBALL_RENAME_MATRIX.md`
- Scoring logic: `/ReTreever/OSEM/score_scripts/theScore.md`
