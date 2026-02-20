
-- Example queries for testing database connection

-- Count columns in ProjectTable
SELECT COUNT(*) AS Column_Count
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ProjectTable';

-- Count total projects
SELECT COUNT(*) as total_projects FROM "ProjectTable";

-- Show first few projects
SELECT "projectId", "projectName", "platform" 
FROM "ProjectTable" 
LIMIT 5;