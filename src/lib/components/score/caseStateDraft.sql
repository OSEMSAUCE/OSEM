-- ============================================================================
-- SCORING SYSTEM - SINGLE SOURCE OF TRUTH
-- This file contains the complete scoring logic for live project scores.
-- Deploy with: psql "${DATABASE_URL}" -f caseStateDraft.sql
-- ============================================================================

-- Function: score_field_points(field_name)
-- Returns the point weight for a given field.
-- Default = 1 for any field not listed here.
CREATE OR REPLACE FUNCTION score_field_points(field_name text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE field_name
    -- Polygon / geometry (highest value — proves the site exists)
    WHEN 'geometry'                  THEN 20
    -- GPS coordinates
    WHEN 'gpsLat'                    THEN 5
    WHEN 'gpsLon'                    THEN 5
    -- Crop / species
    WHEN 'cropName'                  THEN 5
    WHEN 'speciesId'                 THEN 5
    -- Planting details
    WHEN 'plantingDate'              THEN 5
    WHEN 'planted'                   THEN 3
    -- Stakeholder linkage
    WHEN 'stakeholderType'           THEN 2
    WHEN 'organizationLocalId'       THEN 2
    -- Financial transparency
    WHEN 'pricePerUnitUSD'           THEN 2
    WHEN 'pricePerUnit'              THEN 2
    -- Survey data
    WHEN 'plotCenter'                THEN 5
    WHEN 'radius'                    THEN 5
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
stakeholder AS (
  SELECT
    "projectId",
    SUM(score_field_points('stakeholderType') * CASE WHEN "stakeholderType" IS NOT NULL THEN 1 ELSE 0 END) AS scored,
    SUM(score_field_points('stakeholderType')) AS available
  FROM "StakeholderTable"
  WHERE "projectId" IS NOT NULL
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
    ) AS scored,
    SUM(
      score_field_points('url') + score_field_points('urlType') + score_field_points('disclosureType') +
      score_field_points('sourceDescription') + score_field_points('sourceCredit')
    ) AS available
  FROM "SourceTable"
  WHERE "projectId" IS NOT NULL
  GROUP BY "projectId"
)
SELECT
  p."projectId",
  (
    COALESCE(proj.scored, 0) +
    COALESCE(stakeholder.scored, 0) +
    COALESCE(source.scored, 0)
  ) AS points_scored,
  (
    COALESCE(proj.available, 0) +
    GREATEST(COALESCE(stakeholder.available, 0), score_field_points('stakeholderType')) +
    GREATEST(COALESCE(source.available, 0), 
      score_field_points('url') + score_field_points('urlType') + score_field_points('disclosureType') +
      score_field_points('sourceDescription') + score_field_points('sourceCredit')) +
    76  -- Baseline for other child tables (LandTable=15 + CropTable=14 + PlantingTable=16 + PolygonTable=24 + PolyTable=7)
  ) AS points_available,
  ROUND(
    (
      COALESCE(proj.scored, 0) +
      COALESCE(stakeholder.scored, 0) +
      COALESCE(source.scored, 0)
    )::numeric /
    (
      COALESCE(proj.available, 0) +
      GREATEST(COALESCE(stakeholder.available, 0), score_field_points('stakeholderType')) +
      GREATEST(COALESCE(source.available, 0), 
        score_field_points('url') + score_field_points('urlType') + score_field_points('disclosureType') +
        score_field_points('sourceDescription') + score_field_points('sourceCredit')) +
      76
    )::numeric * 100,
    2
  ) AS score
FROM "ProjectTable" p
LEFT JOIN proj ON proj."projectId" = p."projectId"
LEFT JOIN stakeholder ON stakeholder."projectId" = p."projectId"
LEFT JOIN source ON source."projectId" = p."projectId"
WHERE COALESCE(p.deleted, false) = false;
