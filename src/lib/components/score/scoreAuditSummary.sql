-- -- ============================================================================
-- -- LIVE SCORING AUDIT REPORT
-- -- Shows actual scoring data from project_score_view (not hardcoded baselines)
-- -- ============================================================================

-- -- Overall scoring summary
-- SELECT 
--   'TOTAL PROJECTS' as metric,
--   COUNT(*)::text as value
-- FROM project_score_view

-- UNION ALL

-- SELECT 
--   'AVG SCORE %',
--   ROUND(AVG(score), 1)::text
-- FROM project_score_view

-- UNION ALL

-- SELECT 
--   'AVG POINTS SCORED',
--   ROUND(AVG(points_scored), 0)::text
-- FROM project_score_view

-- UNION ALL

-- SELECT 
--   'AVG POINTS AVAILABLE', 
--   ROUND(AVG(points_available), 0)::text
-- FROM project_score_view;

-- -- Top 3 scoring projects
-- SELECT 
--   "projectId",
--   points_scored,
--   points_available,
--   score
-- FROM project_score_view 
-- ORDER BY score DESC 
-- LIMIT 3;
