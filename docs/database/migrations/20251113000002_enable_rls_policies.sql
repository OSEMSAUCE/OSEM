-- Migration: Enable RLS and Create Access Policies
-- Created: 2025-11-13
-- Purpose: Enforce data access control to prevent scraping while allowing legitimate use

-- Enable RLS on all tables
ALTER TABLE "projectTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "landTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cropTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plantingTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "polygonTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "speciesTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "polyTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stakeholderTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sourceTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizationLocalTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizationMasterTable" ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view all projects (public metadata)
CREATE POLICY "Anyone can view projects"
  ON "projectTable" FOR SELECT
  USING ("deleted" = false);

-- Policy: Anyone can view all polygons (for map visualization)
CREATE POLICY "Anyone can view all polygons"
  ON "polygonTable" FOR SELECT
  USING (true);

-- Policy: Lands require projectId filter (prevents scraping)
CREATE POLICY "View lands for specific project only"
  ON "landTable" FOR SELECT
  USING (
    "deleted" = false
    AND "projectId" IS NOT NULL
  );

-- Policy: Crops require projectId filter
CREATE POLICY "View crops for specific project only"
  ON "cropTable" FOR SELECT
  USING (
    "deleted" = false
    AND "projectId" IS NOT NULL
  );

-- Policy: Plantings require projectId filter
CREATE POLICY "View plantings for specific project only"
  ON "plantingTable" FOR SELECT
  USING (
    "deleted" = false
    AND "projectId" IS NOT NULL
  );

-- Policy: Species table (public reference data)
CREATE POLICY "Anyone can view species"
  ON "speciesTable" FOR SELECT
  USING ("deleted" = false);

-- Policy: Poly requires projectId filter
CREATE POLICY "View poly for specific project only"
  ON "polyTable" FOR SELECT
  USING (
    "deleted" = false
    AND "projectId" IS NOT NULL
  );

-- Policy: Stakeholders require projectId filter
CREATE POLICY "View stakeholders for specific project only"
  ON "stakeholderTable" FOR SELECT
  USING ("projectId" IS NOT NULL);

-- Policy: Sources require projectId filter
CREATE POLICY "View sources for specific project only"
  ON "sourceTable" FOR SELECT
  USING ("projectId" IS NOT NULL);

-- Policy: Organizations (public reference data)
CREATE POLICY "Anyone can view organizations"
  ON "organizationLocalTable" FOR SELECT
  USING ("deleted" = false);

CREATE POLICY "Anyone can view organization masters"
  ON "organizationMasterTable" FOR SELECT
  USING (true);

-- Add helpful comments
COMMENT ON POLICY "Anyone can view projects" ON "projectTable" IS 'Public access to project list for selection';
COMMENT ON POLICY "Anyone can view all polygons" ON "polygonTable" IS 'Map visualization requires all polygons';
COMMENT ON POLICY "View lands for specific project only" ON "landTable" IS 'Prevents scraping - must specify projectId';
COMMENT ON POLICY "View crops for specific project only" ON "cropTable" IS 'Prevents scraping - must specify projectId';
COMMENT ON POLICY "View plantings for specific project only" ON "plantingTable" IS 'Prevents scraping - must specify projectId';
