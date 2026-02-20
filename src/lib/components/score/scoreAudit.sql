-- ============================================================================
-- AUDIT FILE: scoring field inventory + baseline breakdown
-- Two queries below. Run either in Supabase SQL editor.
--
-- DENOMINATOR RULES:
--   ProjectTable   — always 1 row, always in denominator
--   Child tables   — GREATEST(actual rows × weights, 1-row baseline)
--                    so every project scores out of at least the full ~93 pts
--                    even if a table has zero rows. More rows scale it up.
--   StakeholderTable / SourceTable — fixed 1-row baseline always in denominator;
--                    scored points sum all real rows (more rows = higher score, never lower)
-- ============================================================================


-- ============================================================================
-- QUERY 1: Full field inventory
-- Every field, its weight, and whether it counts toward the denominator.
-- ============================================================================
SELECT table_name, field_name, weight, in_denominator, note
FROM (VALUES

  -- ProjectTable: always exactly 1 row per project
  ('ProjectTable', 'url',                        1,  true,  'project website'),
  ('ProjectTable', 'platform',                   1,  true,  'source platform name'),
  ('ProjectTable', 'projectNotes',               1,  true,  'free text notes'),
  ('ProjectTable', 'carbonRegistryType',         1,  true,  'ARR / AD / IFM'),
  ('ProjectTable', 'carbonRegistry',             1,  true,  'Verra / Gold Standard etc'),
  ('ProjectTable', 'employmentClaim',            1,  true,  'jobs claimed'),
  ('ProjectTable', 'employmentClaimDescription', 1,  true,  'jobs description'),
  ('ProjectTable', 'projectDateEnd',             1,  true,  'end date'),
  ('ProjectTable', 'projectDateStart',           1,  true,  'start date'),
  ('ProjectTable', 'registryId',                 1,  true,  'carbon registry ID'),

  -- LandTable: 1-row baseline; scales with actual row count
  ('LandTable', 'landName',      1,  true,  'per land'),
  ('LandTable', 'hectares',      1,  true,  'per land'),
  ('LandTable', 'gpsLat',        5,  true,  'per land — high value'),
  ('LandTable', 'gpsLon',        5,  true,  'per land — high value'),
  ('LandTable', 'landNotes',     1,  true,  'per land'),
  ('LandTable', 'treatmentType', 1,  true,  'per land'),
  ('LandTable', 'preparation',   1,  true,  'per land'),

  -- CropTable: 1-row baseline; scales with actual row count
  ('CropTable', 'cropName',         5,  true,  'per crop — high value'),
  ('CropTable', 'speciesLocalName', 1,  true,  'per crop'),
  ('CropTable', 'speciesId',        5,  true,  'per crop — high value'),
  ('CropTable', 'seedInfo',         1,  true,  'per crop'),
  ('CropTable', 'cropStock',        1,  true,  'per crop'),
  ('CropTable', 'cropNotes',        1,  true,  'per crop'),

  -- PlantingTable: 1-row baseline; scales with actual row count
  ('PlantingTable', 'planted',         3,  true,  'per planting'),
  ('PlantingTable', 'allocated',       1,  true,  'per planting'),
  ('PlantingTable', 'plantingDate',    5,  true,  'per planting — high value'),
  ('PlantingTable', 'units',           1,  true,  'per planting'),
  ('PlantingTable', 'unitType',        1,  true,  'per planting'),
  ('PlantingTable', 'pricePerUnit',    2,  true,  'per planting'),
  ('PlantingTable', 'currency',        1,  true,  'per planting'),
  ('PlantingTable', 'pricePerUnitUSD', 2,  true,  'per planting'),

  -- PolygonTable: 1-row baseline; scales with actual row count
  ('PolygonTable', 'geometry',     20, true,  'per polygon — highest value'),
  ('PolygonTable', 'hectaresCalc', 1,  true,  'per polygon'),
  ('PolygonTable', 'centroid',     1,  true,  'per polygon'),
  ('PolygonTable', 'polygonNotes', 1,  true,  'per polygon'),
  ('PolygonTable', 'type',         1,  true,  'per polygon'),

  -- PolyTable: 1-row baseline; scales with actual row count
  ('PolyTable', 'survivalRate',    1,  true,  'per poly'),
  ('PolyTable', 'liabilityCause',  1,  true,  'per poly'),
  ('PolyTable', 'liabilityDate',   1,  true,  'per poly'),
  ('PolyTable', 'ratePerTree',     1,  true,  'per poly'),
  ('PolyTable', 'motivation',      1,  true,  'per poly'),
  ('PolyTable', 'restorationType', 1,  true,  'per poly'),
  ('PolyTable', 'reviews',         1,  true,  'per poly'),

  -- StakeholderTable: fixed 1-row baseline in denominator; scored sums all real rows
  ('StakeholderTable', 'stakeholderType', 2,  true, 'fixed 1-row baseline'),

  -- SourceTable: fixed 1-row baseline in denominator; scored sums all real rows
  ('SourceTable', 'url',               1,  true, 'fixed 1-row baseline'),
  ('SourceTable', 'urlType',           1,  true, 'fixed 1-row baseline'),
  ('SourceTable', 'disclosureType',    1,  true, 'fixed 1-row baseline'),
  ('SourceTable', 'sourceDescription', 1,  true, 'fixed 1-row baseline'),
  ('SourceTable', 'sourceCredit',      1,  true, 'fixed 1-row baseline')

) AS t(table_name, field_name, weight, in_denominator, note)
ORDER BY table_name, field_name;


-- ============================================================================
-- QUERY 2: Minimum denominator breakdown (the "full test" baseline)
-- Shows how many points each table contributes to the minimum denominator.
-- Run this to verify the total minimum is what you expect (~93).
-- ============================================================================
SELECT table_name, baseline_pts
FROM (VALUES
  ('ProjectTable',              score_field_points('url') + score_field_points('platform') + score_field_points('projectNotes') +
                                score_field_points('carbonRegistryType') + score_field_points('carbonRegistry') +
                                score_field_points('employmentClaim') + score_field_points('employmentClaimDescription') +
                                score_field_points('projectDateEnd') + score_field_points('projectDateStart') +
                                score_field_points('registryId')),
  ('LandTable (1-row min)',     score_field_points('landName') + score_field_points('hectares') + score_field_points('gpsLat') +
                                score_field_points('gpsLon') + score_field_points('landNotes') + score_field_points('treatmentType') +
                                score_field_points('preparation')),
  ('CropTable (1-row min)',     score_field_points('cropName') + score_field_points('speciesLocalName') + score_field_points('speciesId') +
                                score_field_points('seedInfo') + score_field_points('cropStock') + score_field_points('cropNotes')),
  ('PlantingTable (1-row min)', score_field_points('planted') + score_field_points('allocated') + score_field_points('plantingDate') +
                                score_field_points('units') + score_field_points('unitType') + score_field_points('pricePerUnit') +
                                score_field_points('currency') + score_field_points('pricePerUnitUSD')),
  ('PolygonTable (1-row min)',  score_field_points('geometry') + score_field_points('hectaresCalc') + score_field_points('centroid') +
                                score_field_points('polygonNotes') + score_field_points('type')),
  ('PolyTable (1-row min)',     score_field_points('survivalRate') + score_field_points('liabilityCause') + score_field_points('liabilityDate') +
                                score_field_points('ratePerTree') + score_field_points('motivation') + score_field_points('restorationType') +
                                score_field_points('reviews')),
  ('StakeholderTable (baseline)', score_field_points('stakeholderType')),
  ('SourceTable (baseline)',    score_field_points('url') + score_field_points('urlType') + score_field_points('disclosureType') +
                                score_field_points('sourceDescription') + score_field_points('sourceCredit')),
  ('TOTAL MINIMUM',             score_field_points('url') + score_field_points('platform') + score_field_points('projectNotes') +
                                score_field_points('carbonRegistryType') + score_field_points('carbonRegistry') +
                                score_field_points('employmentClaim') + score_field_points('employmentClaimDescription') +
                                score_field_points('projectDateEnd') + score_field_points('projectDateStart') +
                                score_field_points('registryId') +
                                score_field_points('landName') + score_field_points('hectares') + score_field_points('gpsLat') +
                                score_field_points('gpsLon') + score_field_points('landNotes') + score_field_points('treatmentType') +
                                score_field_points('preparation') +
                                score_field_points('cropName') + score_field_points('speciesLocalName') + score_field_points('speciesId') +
                                score_field_points('seedInfo') + score_field_points('cropStock') + score_field_points('cropNotes') +
                                score_field_points('planted') + score_field_points('allocated') + score_field_points('plantingDate') +
                                score_field_points('units') + score_field_points('unitType') + score_field_points('pricePerUnit') +
                                score_field_points('currency') + score_field_points('pricePerUnitUSD') +
                                score_field_points('geometry') + score_field_points('hectaresCalc') + score_field_points('centroid') +
                                score_field_points('polygonNotes') + score_field_points('type') +
                                score_field_points('survivalRate') + score_field_points('liabilityCause') + score_field_points('liabilityDate') +
                                score_field_points('ratePerTree') + score_field_points('motivation') + score_field_points('restorationType') +
                                score_field_points('reviews') +
                                score_field_points('stakeholderType') +
                                score_field_points('url') + score_field_points('urlType') + score_field_points('disclosureType') +
                                score_field_points('sourceDescription') + score_field_points('sourceCredit'))
) AS t(table_name, baseline_pts);