-- ============================================================================
-- CONDENSED SCORING AUDIT REPORT
-- Shows just the baseline summary and top scores for regular use
-- ============================================================================

-- Baseline summary only
SELECT 
  table_name,
  baseline_pts
FROM (
  VALUES 
    ('ProjectTable', 10),
    ('LandTable (1-row min)', 15),
    ('CropTable (1-row min)', 14),
    ('PlantingTable (1-row min)', 16),
    ('PolygonTable (1-row min)', 24),
    ('PolyTable (1-row min)', 7),
    ('StakeholderTable (baseline)', 2),
    ('SourceTable (baseline)', 5),
    ('TOTAL MINIMUM', 93)
) AS baseline_summary(table_name, baseline_pts);

-- Top 3 scoring projects
SELECT 
  "projectId",
  points_scored,
  points_available,
  score
FROM project_score_view 
ORDER BY score DESC 
LIMIT 3;
