-- Migration: Initial Schema
-- Created from: VigilanTree/staging/schema.sqlite.prisma
-- Date: 2025-11-13

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enums
CREATE TYPE "ParentType" AS ENUM (
  'projectTable',
  'landTable',
  'cropTable',
  'plantingTable',
  'organizationTable',
  'sourceTable',
  'stakeholderTable'
);

CREATE TYPE "GeometryType" AS ENUM (
  'Polygon',
  'MultiPolygon',
  'MultiLineString',
  'LineString',
  'Point',
  'Feature',
  'FeatureCollection',
  'GeometryCollection'
);

CREATE TYPE "UnitType" AS ENUM (
  'cCO2e',
  'hectare',
  'acre',
  'tree',
  'credits',
  'project',
  'land'
);

CREATE TYPE "TreatmentType" AS ENUM (
  'ARR',
  'improved_forest_management',
  'avoided_deforestation',
  'forest_conservation',
  'regenerative_agriculture',
  'improved_agricultural_practices',
  'cover_cropping',
  'restoration',
  'agroforestry'
);

CREATE TYPE "urlType" AS ENUM (
  'webpage',
  'api',
  'image',
  'video',
  'document',
  'review',
  'other'
);

CREATE TYPE "stakeholderType" AS ENUM (
  'developer',
  'nursery',
  'marketplace',
  'NGO',
  'research',
  'supplier',
  'producer'
);

CREATE TYPE "disclosureType" AS ENUM (
  'publicDB',
  'company',
  'NGO',
  'marketplace',
  'disclosure',
  'research'
);

CREATE TYPE "CarbonRegistryType" AS ENUM (
  'ARR',
  'AD',
  'IFM'
);

CREATE TYPE "CarbonRegistry" AS ENUM (
  'Verra',
  'Gold_Standard',
  'Climate_Action_Reserve',
  'American_Carbon_Registry',
  'Plan_Vivo',
  'Social_Carbon'
);

CREATE TYPE "RestorationType" AS ENUM (
  'manual_planting',
  'drone_seeding',
  'mechanical_planting',
  'aerial_seeding',
  'natural_regeneration',
  'conservation',
  'improved_forest_management',
  'avoided_deforestation',
  'magrove_regeneration',
  'agroforestry'
);

-- Create organizationMasterTable first (no dependencies)
CREATE TABLE "organizationMasterTable" (
  "organizationMasterId" TEXT PRIMARY KEY,
  "organizationMasterName" TEXT UNIQUE NOT NULL,
  "officialWebsite" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastEditedAt" TIMESTAMPTZ DEFAULT NOW(),
  "editedBy" TEXT
);

-- Create organizationLocalTable (depends on organizationMasterTable)
CREATE TABLE "organizationLocalTable" (
  "organizationLocalId" TEXT PRIMARY KEY,
  "organizationLocalName" TEXT UNIQUE NOT NULL,
  "organizationMasterId" TEXT,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "address" TEXT,
  "polyId" TEXT,
  "website" TEXT,
  "capacityPerYear" INTEGER,
  "organizationNotes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastEditedAt" TIMESTAMPTZ DEFAULT NOW(),
  "editedBy" TEXT,
  "deleted" BOOLEAN DEFAULT FALSE,
  "gpsLat" DOUBLE PRECISION,
  "gpsLon" DOUBLE PRECISION,
  CONSTRAINT "fk_organizationMasterId" FOREIGN KEY ("organizationMasterId")
    REFERENCES "organizationMasterTable"("organizationMasterId")
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create projectTable (depends on organizationLocalTable)
CREATE TABLE "projectTable" (
  "projectId" TEXT PRIMARY KEY,
  "projectName" TEXT NOT NULL,
  "url" TEXT,
  "platformId" TEXT,
  "platform" TEXT,
  "projectNotes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastEditedAt" TIMESTAMPTZ DEFAULT NOW(),
  "deleted" BOOLEAN DEFAULT FALSE,
  "carbonRegistryType" "CarbonRegistryType",
  "carbonRegistry" "CarbonRegistry",
  "employmentClaim" INTEGER,
  "employmentClaimDescription" TEXT,
  "projectDateEnd" TIMESTAMPTZ,
  "projectDateStart" TIMESTAMPTZ,
  "registryId" TEXT,
  CONSTRAINT "fk_platform" FOREIGN KEY ("platform")
    REFERENCES "organizationLocalTable"("organizationLocalName")
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create landTable (depends on projectTable)
CREATE TABLE "landTable" (
  "landId" TEXT PRIMARY KEY,
  "landName" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "hectares" DECIMAL,
  "gpsLat" DECIMAL,
  "gpsLon" DECIMAL,
  "landNotes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastEditedAt" TIMESTAMPTZ DEFAULT NOW(),
  "treatmentType" "TreatmentType",
  "editedBy" TEXT,
  "deleted" BOOLEAN DEFAULT FALSE,
  "preparation" TEXT,
  CONSTRAINT "fk_projectId_land" FOREIGN KEY ("projectId")
    REFERENCES "projectTable"("projectId")
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create speciesTable (no dependencies)
CREATE TABLE "speciesTable" (
  "speciesName" TEXT PRIMARY KEY,
  "commonName" TEXT NOT NULL,
  "scientificName" TEXT,
  "type" TEXT,
  "family" TEXT,
  "reference" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastEditedAt" TIMESTAMPTZ DEFAULT NOW(),
  "editedBy" TEXT,
  "deleted" BOOLEAN DEFAULT FALSE
);

-- Create cropTable (depends on projectTable)
CREATE TABLE "cropTable" (
  "cropId" TEXT PRIMARY KEY,
  "cropName" TEXT NOT NULL,
  "projectId" TEXT,
  "speciesLocalName" TEXT,
  "speciesId" TEXT,
  "seedInfo" TEXT,
  "cropStock" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastEditedAt" TIMESTAMPTZ DEFAULT NOW(),
  "editedBy" TEXT,
  "deleted" BOOLEAN DEFAULT FALSE,
  "organizationLocalName" TEXT,
  "cropNotes" TEXT,
  CONSTRAINT "fk_projectId_crop" FOREIGN KEY ("projectId")
    REFERENCES "projectTable"("projectId")
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "unique_project_crop" UNIQUE ("projectId", "cropName")
);

-- Create plantingTable (depends on projectTable)
CREATE TABLE "plantingTable" (
  "plantingId" TEXT PRIMARY KEY,
  "planted" INTEGER,
  "projectId" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "parentType" "ParentType" NOT NULL,
  "allocated" INTEGER,
  "plantingDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastEditedAt" TIMESTAMPTZ DEFAULT NOW(),
  "deleted" BOOLEAN DEFAULT FALSE,
  "units" DECIMAL,
  "unitType" "UnitType",
  "pricePerUnit" DECIMAL,
  "currency" TEXT,
  CONSTRAINT "fk_projectId_planting" FOREIGN KEY ("projectId")
    REFERENCES "projectTable"("projectId")
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create polygonTable (depends on landTable)
CREATE TABLE "polygonTable" (
  "polygonId" TEXT PRIMARY KEY,
  "landId" TEXT NOT NULL,
  "landName" TEXT,
  "geometry" TEXT,
  "coordinates" TEXT,
  "type" TEXT,
  "polygonNotes" TEXT,
  "lastEditedAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT "fk_landId_polygon" FOREIGN KEY ("landId")
    REFERENCES "landTable"("landId")
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create polyTable (depends on projectTable)
CREATE TABLE "polyTable" (
  "polyId" TEXT PRIMARY KEY,
  "parentId" TEXT NOT NULL,
  "parentType" "ParentType" NOT NULL,
  "projectId" TEXT NOT NULL,
  "randomJson" TEXT,
  "survivalRate" DOUBLE PRECISION,
  "liabilityCause" TEXT,
  "ratePerTree" DOUBLE PRECISION,
  "motivation" TEXT,
  "restorationType" "RestorationType",
  "reviews" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastEditedAt" TIMESTAMPTZ DEFAULT NOW(),
  "editedBy" TEXT,
  "deleted" BOOLEAN DEFAULT FALSE,
  "projectTableProjectId" TEXT,
  CONSTRAINT "fk_projectId_poly" FOREIGN KEY ("projectId")
    REFERENCES "projectTable"("projectId")
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create stakeholderTable (depends on projectTable and organizationLocalTable)
CREATE TABLE "stakeholderTable" (
  "stakeholderId" TEXT PRIMARY KEY,
  "organizationLocalId" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "parentType" "ParentType" NOT NULL,
  "projectId" TEXT,
  "stakeholderType" "stakeholderType",
  "lastEditedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT "fk_projectId_stakeholder" FOREIGN KEY ("projectId")
    REFERENCES "projectTable"("projectId")
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "fk_organizationLocalId" FOREIGN KEY ("organizationLocalId")
    REFERENCES "organizationLocalTable"("organizationLocalId")
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create sourceTable (many-to-many relationships)
CREATE TABLE "sourceTable" (
  "sourceId" TEXT PRIMARY KEY,
  "url" TEXT NOT NULL,
  "urlType" "urlType",
  "parentId" TEXT,
  "parentType" "ParentType",
  "projectId" TEXT,
  "disclosureType" "disclosureType",
  "sourceDescription" TEXT,
  "sourceCredit" TEXT,
  "lastEditedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create junction tables for many-to-many relationships
-- Note: Prisma implicit many-to-many requires explicit junction tables in PostgreSQL

CREATE TABLE "_projectToSource" (
  "A" TEXT NOT NULL REFERENCES "sourceTable"("sourceId") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "projectTable"("projectId") ON DELETE CASCADE,
  PRIMARY KEY ("A", "B")
);

CREATE TABLE "_landToSource" (
  "A" TEXT NOT NULL REFERENCES "sourceTable"("sourceId") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "landTable"("landId") ON DELETE CASCADE,
  PRIMARY KEY ("A", "B")
);

CREATE TABLE "_cropToSource" (
  "A" TEXT NOT NULL REFERENCES "sourceTable"("sourceId") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "cropTable"("cropId") ON DELETE CASCADE,
  PRIMARY KEY ("A", "B")
);

CREATE TABLE "_organizationLocalToSource" (
  "A" TEXT NOT NULL REFERENCES "sourceTable"("sourceId") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "organizationLocalTable"("organizationLocalId") ON DELETE CASCADE,
  PRIMARY KEY ("A", "B")
);

CREATE TABLE "_plantingToSource" (
  "A" TEXT NOT NULL REFERENCES "sourceTable"("sourceId") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "plantingTable"("plantingId") ON DELETE CASCADE,
  PRIMARY KEY ("A", "B")
);

CREATE TABLE "_cropToSpecies" (
  "A" TEXT NOT NULL REFERENCES "cropTable"("cropId") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "speciesTable"("speciesName") ON DELETE CASCADE,
  PRIMARY KEY ("A", "B")
);

-- Create indexes
CREATE INDEX "idx_projectTable_platformId" ON "projectTable"("platformId");
CREATE INDEX "idx_landTable_projectId" ON "landTable"("projectId");
CREATE INDEX "idx_landTable_landName" ON "landTable"("landName");
CREATE INDEX "idx_cropTable_organizationLocalName" ON "cropTable"("organizationLocalName");
CREATE INDEX "idx_cropTable_projectId" ON "cropTable"("projectId");
CREATE INDEX "idx_plantingTable_projectId" ON "plantingTable"("projectId");
CREATE INDEX "idx_plantingTable_parentId" ON "plantingTable"("parentId");
CREATE INDEX "idx_plantingTable_parentType" ON "plantingTable"("parentType");
CREATE INDEX "idx_plantingTable_parentId_parentType" ON "plantingTable"("parentId", "parentType");
CREATE INDEX "idx_polygonTable_landId" ON "polygonTable"("landId");
CREATE INDEX "idx_polyTable_projectId" ON "polyTable"("projectId");
CREATE INDEX "idx_polyTable_parentId" ON "polyTable"("parentId");
CREATE INDEX "idx_polyTable_parentType" ON "polyTable"("parentType");
CREATE INDEX "idx_polyTable_parentId_parentType" ON "polyTable"("parentId", "parentType");
CREATE INDEX "idx_stakeholderTable_organizationLocalId" ON "stakeholderTable"("organizationLocalId");
CREATE INDEX "idx_sourceTable_parentId" ON "sourceTable"("parentId");
CREATE INDEX "idx_sourceTable_parentType" ON "sourceTable"("parentType");
CREATE INDEX "idx_sourceTable_parentId_parentType" ON "sourceTable"("parentId", "parentType");
CREATE INDEX "idx_organizationLocalTable_organizationLocalId" ON "organizationLocalTable"("organizationLocalId");

-- Create updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."lastEditedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_projectTable
BEFORE UPDATE ON "projectTable"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_landTable
BEFORE UPDATE ON "landTable"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_cropTable
BEFORE UPDATE ON "cropTable"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_plantingTable
BEFORE UPDATE ON "plantingTable"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_speciesTable
BEFORE UPDATE ON "speciesTable"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_polygonTable
BEFORE UPDATE ON "polygonTable"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_polyTable
BEFORE UPDATE ON "polyTable"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_stakeholderTable
BEFORE UPDATE ON "stakeholderTable"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_sourceTable
BEFORE UPDATE ON "sourceTable"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_organizationLocalTable
BEFORE UPDATE ON "organizationLocalTable"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_organizationMasterTable
BEFORE UPDATE ON "organizationMasterTable"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Row Level Security (RLS) on all tables
-- Note: You'll need to define specific policies based on your auth requirements
ALTER TABLE "projectTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "landTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cropTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plantingTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "speciesTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "polygonTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "polyTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stakeholderTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sourceTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizationLocalTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizationMasterTable" ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (customize based on your needs)
-- Allow public read access (modify as needed)
CREATE POLICY "Allow public read access" ON "projectTable"
  FOR SELECT USING (true);

-- Add more specific policies for INSERT, UPDATE, DELETE based on your auth requirements
