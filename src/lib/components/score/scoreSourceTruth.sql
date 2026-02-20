-- ============================================================================
-- SCORING SYSTEM - SINGLE SOURCE OF TRUTH
-- This file contains the complete scoring logic for live project scores.
-- Deploy with: psql "${DATABASE_URL}" -f scoreSourceTruth.sql
-- ============================================================================

-- Function: score_field_points(field_name)
-- Returns the point weight for a given field.
-- Default = 1 for any field not listed here.
CREATE OR REPLACE FUNCTION score_field_points(field_name text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE field_name
    -- IGNORED FIELDS (system/metadata - don't represent data quality)
    WHEN 'id' THEN 0
    WHEN 'projectId' THEN 0
    WHEN 'landId' THEN 0
    WHEN 'cropId' THEN 0
    WHEN 'plantingId' THEN 0
    WHEN 'polygonId' THEN 0
    WHEN 'polyId' THEN 0
    WHEN 'stakeholderId' THEN 0
    WHEN 'sourceId' THEN 0
    WHEN 'organizationLocalId' THEN 0
    WHEN 'organizationMasterId' THEN 0
    WHEN 'lastEditedAt' THEN 0
    WHEN 'editedBy' THEN 0
    WHEN 'deleted' THEN 0
    WHEN 'createdAt' THEN 0
    WHEN 'parentTable' THEN 0
    WHEN 'parentId' THEN 0
    -- HIGH VALUE FIELDS (proves site exists, high transparency)
    WHEN 'geometry' THEN 20
    WHEN 'gpsLat' THEN 5
    WHEN 'gpsLon' THEN 5
    WHEN 'cropName' THEN 5
    WHEN 'speciesId' THEN 5
    WHEN 'plantingDate' THEN 5
    WHEN 'planted' THEN 3
    WHEN 'stakeholderType' THEN 2
    WHEN 'pricePerUnitUSD' THEN 2
    WHEN 'pricePerUnit' THEN 2
    WHEN 'plotCenter' THEN 5
    WHEN 'radius' THEN 5
    -- Everything else = 1 point if populated
    ELSE 1
  END
$$;

-- ============================================================================
-- MATERIALIZED VIEW: project_score_view
-- Live per-project score calculation with proper scaling.
-- All tables count toward both scored and available points.
-- Score is always 0–100%. More data rows = higher denominator (fair scaling).
-- ============================================================================
DROP VIEW IF EXISTS project_score_view;
DROP MATERIALIZED VIEW IF EXISTS project_score_view;

CREATE MATERIALIZED VIEW project_score_view AS
WITH proj AS (
  SELECT
    "projectId",
    (
      score_field_points('url') * CASE WHEN "url" IS NOT NULL AND "url" <> '' THEN 1 ELSE 0 END +
      score_field_points('platform') * CASE WHEN "platform" IS NOT NULL AND "platform" <> '' THEN 1 ELSE 0 END +
      score_field_points('projectNotes') * CASE WHEN "projectNotes" IS NOT NULL AND "projectNotes" <> '' THEN 1 ELSE 0 END +
      score_field_points('carbonRegistryType') * CASE WHEN "carbonRegistryType" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('carbonRegistry') * CASE WHEN "carbonRegistry" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('employmentClaim') * CASE WHEN "employmentClaim" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('employmentClaimDescription') * CASE WHEN "employmentClaimDescription" IS NOT NULL AND "employmentClaimDescription" <> '' THEN 1 ELSE 0 END +
      score_field_points('projectDateEnd') * CASE WHEN "projectDateEnd" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('projectDateStart') * CASE WHEN "projectDateStart" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('registryId') * CASE WHEN "registryId" IS NOT NULL AND "registryId" <> '' THEN 1 ELSE 0 END
    ) AS scored,
    (
      score_field_points('url') + score_field_points('platform') + score_field_points('projectNotes') +
      score_field_points('carbonRegistryType') + score_field_points('carbonRegistry') +
      score_field_points('employmentClaim') + score_field_points('employmentClaimDescription') +
      score_field_points('projectDateEnd') + score_field_points('projectDateStart') +
      score_field_points('registryId')
    ) AS available
  FROM "ProjectTable"
  WHERE COALESCE(deleted, false) = false
),
land AS (
  SELECT
    "projectId",
    SUM(
      score_field_points('landName') * CASE WHEN "landName" IS NOT NULL AND "landName" <> '' THEN 1 ELSE 0 END +
      score_field_points('hectares') * CASE WHEN "hectares" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('gpsLat') * CASE WHEN "gpsLat" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('gpsLon') * CASE WHEN "gpsLon" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('landNotes') * CASE WHEN "landNotes" IS NOT NULL AND "landNotes" <> '' THEN 1 ELSE 0 END +
      score_field_points('treatmentType') * CASE WHEN "treatmentType" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('preparation') * CASE WHEN "preparation" IS NOT NULL THEN 1 ELSE 0 END
    ) AS scored,
    SUM(
      score_field_points('landName') + score_field_points('hectares') + score_field_points('gpsLat') +
      score_field_points('gpsLon') + score_field_points('landNotes') + score_field_points('treatmentType') +
      score_field_points('preparation')
    ) AS available
  FROM "LandTable"
  WHERE COALESCE(deleted, false) = false
  GROUP BY "projectId"
),
crop AS (
  SELECT
    "projectId",
    SUM(
      score_field_points('cropName') * CASE WHEN "cropName" IS NOT NULL AND "cropName" <> '' THEN 1 ELSE 0 END +
      score_field_points('speciesLocalName') * CASE WHEN "speciesLocalName" IS NOT NULL AND "speciesLocalName" <> '' THEN 1 ELSE 0 END +
      score_field_points('speciesId') * CASE WHEN "speciesId" IS NOT NULL AND "speciesId" <> '' THEN 1 ELSE 0 END +
      score_field_points('seedInfo') * CASE WHEN "seedInfo" IS NOT NULL AND "seedInfo" <> '' THEN 1 ELSE 0 END +
      score_field_points('cropStock') * CASE WHEN "cropStock" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('cropNotes') * CASE WHEN "cropNotes" IS NOT NULL AND "cropNotes" <> '' THEN 1 ELSE 0 END
    ) AS scored,
    SUM(
      score_field_points('cropName') + score_field_points('speciesLocalName') + score_field_points('speciesId') +
      score_field_points('seedInfo') + score_field_points('cropStock') + score_field_points('cropNotes')
    ) AS available
  FROM "CropTable"
  WHERE COALESCE(deleted, false) = false
  GROUP BY "projectId"
),
planting AS (
  SELECT
    "projectId",
    SUM(
      score_field_points('planted') * CASE WHEN "planted" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('allocated') * CASE WHEN "allocated" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('plantingDate') * CASE WHEN "plantingDate" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('units') * CASE WHEN "units" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('unitType') * CASE WHEN "unitType" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('pricePerUnit') * CASE WHEN "pricePerUnit" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('currency') * CASE WHEN "currency" IS NOT NULL AND "currency" <> '' THEN 1 ELSE 0 END +
      score_field_points('pricePerUnitUSD') * CASE WHEN "pricePerUnitUSD" IS NOT NULL THEN 1 ELSE 0 END
    ) AS scored,
    SUM(
      score_field_points('planted') + score_field_points('allocated') + score_field_points('plantingDate') +
      score_field_points('units') + score_field_points('unitType') + score_field_points('pricePerUnit') +
      score_field_points('currency') + score_field_points('pricePerUnitUSD')
    ) AS available
  FROM "PlantingTable"
  WHERE COALESCE(deleted, false) = false
  GROUP BY "projectId"
),
polygon AS (
  SELECT
    l."projectId",
    SUM(
      score_field_points('geometry') * CASE WHEN pg."geometry" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('hectaresCalc') * CASE WHEN pg."hectaresCalc" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('centroid') * CASE WHEN pg."centroid" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('polygonNotes') * CASE WHEN pg."polygonNotes" IS NOT NULL AND pg."polygonNotes" <> '' THEN 1 ELSE 0 END +
      score_field_points('type') * CASE WHEN pg."type" IS NOT NULL THEN 1 ELSE 0 END
    ) AS scored,
    SUM(
      score_field_points('geometry') + score_field_points('hectaresCalc') + score_field_points('centroid') +
      score_field_points('polygonNotes') + score_field_points('type')
    ) AS available
  FROM "PolygonTable" pg
  JOIN "LandTable" l ON l."landId" = pg."landId"
  WHERE COALESCE(l.deleted, false) = false
  GROUP BY l."projectId"
),
poly AS (
  SELECT
    "projectId",
    SUM(
      score_field_points('survivalRate') * CASE WHEN "survivalRate" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('liabilityCause') * CASE WHEN "liabilityCause" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('liabilityDate') * CASE WHEN "liabilityDate" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('ratePerTree') * CASE WHEN "ratePerTree" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('motivation') * CASE WHEN "motivation" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('restorationType') * CASE WHEN "restorationType" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('reviews') * CASE WHEN "reviews" IS NOT NULL THEN 1 ELSE 0 END
    ) AS scored,
    SUM(
      score_field_points('survivalRate') + score_field_points('liabilityCause') + score_field_points('liabilityDate') +
      score_field_points('ratePerTree') + score_field_points('motivation') + score_field_points('restorationType') +
      score_field_points('reviews')
    ) AS available
  FROM "PolyTable"
  WHERE COALESCE(deleted, false) = false
  GROUP BY "projectId"
),
stakeholder AS (
  SELECT
    "projectId",
    SUM(score_field_points('stakeholderType') * CASE WHEN "stakeholderType" IS NOT NULL THEN 1 ELSE 0 END) AS scored
  FROM "StakeholderTable"
  GROUP BY "projectId"
),
source AS (
  SELECT
    "projectId",
    SUM(
      score_field_points('url') * CASE WHEN "url" IS NOT NULL AND "url" <> '' THEN 1 ELSE 0 END +
      score_field_points('urlType') * CASE WHEN "urlType" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('disclosureType') * CASE WHEN "disclosureType" IS NOT NULL THEN 1 ELSE 0 END +
      score_field_points('sourceDescription') * CASE WHEN "sourceDescription" IS NOT NULL AND "sourceDescription" <> '' THEN 1 ELSE 0 END +
      score_field_points('sourceCredit') * CASE WHEN "sourceCredit" IS NOT NULL AND "sourceCredit" <> '' THEN 1 ELSE 0 END
    ) AS scored
  FROM "SourceTable"
  GROUP BY "projectId"
)
SELECT
  p."projectId",
  (
    COALESCE(proj.scored, 0) +
    COALESCE(land.scored, 0) +
    COALESCE(crop.scored, 0) +
    COALESCE(planting.scored, 0) +
    COALESCE(polygon.scored, 0) +
    COALESCE(poly.scored, 0) +
    COALESCE(stakeholder.scored, 0) +
    COALESCE(source.scored, 0)
  ) AS points_scored,
  (
    COALESCE(proj.available, 0) +
    GREATEST(COALESCE(land.available, 0),
      score_field_points('landName') + score_field_points('hectares') + score_field_points('gpsLat') +
      score_field_points('gpsLon') + score_field_points('landNotes') + score_field_points('treatmentType') +
      score_field_points('preparation')) +
    GREATEST(COALESCE(crop.available, 0),
      score_field_points('cropName') + score_field_points('speciesLocalName') + score_field_points('speciesId') +
      score_field_points('seedInfo') + score_field_points('cropStock') + score_field_points('cropNotes')) +
    GREATEST(COALESCE(planting.available, 0),
      score_field_points('planted') + score_field_points('allocated') + score_field_points('plantingDate') +
      score_field_points('units') + score_field_points('unitType') + score_field_points('pricePerUnit') +
      score_field_points('currency') + score_field_points('pricePerUnitUSD')) +
    GREATEST(COALESCE(polygon.available, 0),
      score_field_points('geometry') + score_field_points('hectaresCalc') + score_field_points('centroid') +
      score_field_points('polygonNotes') + score_field_points('type')) +
    GREATEST(COALESCE(poly.available, 0),
      score_field_points('survivalRate') + score_field_points('liabilityCause') + score_field_points('liabilityDate') +
      score_field_points('ratePerTree') + score_field_points('motivation') + score_field_points('restorationType') +
      score_field_points('reviews')) +
    score_field_points('stakeholderType') +
    score_field_points('url') + score_field_points('urlType') + score_field_points('disclosureType') +
    score_field_points('sourceDescription') + score_field_points('sourceCredit')
  ) AS points_available,
  ROUND(
    (
      COALESCE(proj.scored, 0) +
      COALESCE(land.scored, 0) +
      COALESCE(crop.scored, 0) +
      COALESCE(planting.scored, 0) +
      COALESCE(polygon.scored, 0) +
      COALESCE(poly.scored, 0) +
      COALESCE(stakeholder.scored, 0) +
      COALESCE(source.scored, 0)
    )::numeric /
    (
      COALESCE(proj.available, 0) +
      GREATEST(COALESCE(land.available, 0),
        score_field_points('landName') + score_field_points('hectares') + score_field_points('gpsLat') +
        score_field_points('gpsLon') + score_field_points('landNotes') + score_field_points('treatmentType') +
        score_field_points('preparation')) +
      GREATEST(COALESCE(crop.available, 0),
        score_field_points('cropName') + score_field_points('speciesLocalName') + score_field_points('speciesId') +
        score_field_points('seedInfo') + score_field_points('cropStock') + score_field_points('cropNotes')) +
      GREATEST(COALESCE(planting.available, 0),
        score_field_points('planted') + score_field_points('allocated') + score_field_points('plantingDate') +
        score_field_points('units') + score_field_points('unitType') + score_field_points('pricePerUnit') +
        score_field_points('currency') + score_field_points('pricePerUnitUSD')) +
      GREATEST(COALESCE(polygon.available, 0),
        score_field_points('geometry') + score_field_points('hectaresCalc') + score_field_points('centroid') +
        score_field_points('polygonNotes') + score_field_points('type')) +
      GREATEST(COALESCE(poly.available, 0),
        score_field_points('survivalRate') + score_field_points('liabilityCause') + score_field_points('liabilityDate') +
        score_field_points('ratePerTree') + score_field_points('motivation') + score_field_points('restorationType') +
        score_field_points('reviews')) +
      score_field_points('stakeholderType') +
      score_field_points('url') + score_field_points('urlType') + score_field_points('disclosureType') +
      score_field_points('sourceDescription') + score_field_points('sourceCredit')
    )::numeric * 100,
    2
  ) AS score
FROM "ProjectTable" p
LEFT JOIN proj ON proj."projectId" = p."projectId"
LEFT JOIN land ON land."projectId" = p."projectId"
LEFT JOIN crop ON crop."projectId" = p."projectId"
LEFT JOIN planting ON planting."projectId" = p."projectId"
LEFT JOIN polygon ON polygon."projectId" = p."projectId"
LEFT JOIN poly ON poly."projectId" = p."projectId"
LEFT JOIN stakeholder ON stakeholder."projectId" = p."projectId"
LEFT JOIN source ON source."projectId" = p."projectId"
WHERE COALESCE(p.deleted, false) = false;
