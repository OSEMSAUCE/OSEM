import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const GeometrySchema = z.object({
  coordinates: z.union([
    z.array(z.array(z.array(z.number()))),
    z.array(z.array(z.array(z.array(z.number()))))
  ]),
  type: z.enum([
    'Polygon',
    'MultiPolygon',
    'LineString',
    'MultiLineString',
    'Point',
    'MultiPoint',
    'GeometryCollection',
    'Feature',
    'FeatureCollection'
  ])
});

// ============================================================================
// TABLE SCHEMAS (Recursive & Strict)
// ============================================================================

// We use z.lazy() to handle circular references (e.g. Source -> Source)
// and define the base shapes first.

export const PolygonSchema = z.object({
  // Required
  polygonId: z.string(),
  landId: z.string(),
  // Optional
  landName: z.string().nullable().optional(),
  geometry: z.string().nullable().optional(),
  coordinates: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  polygonNotes: z.string().nullable().optional(),
  lastEditedAt: z.date().nullable().optional(),
}).strict();

export const SpeciesSchema = z.object({
  // Required
  speciesName: z.string(),
  commonName: z.string(),
  // Optional
  scientificName: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  family: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  lastEditedAt: z.date().nullable().optional(),
  editedBy: z.string().nullable().optional(),
  deleted: z.boolean().nullable().optional(),
}).strict();

// Forward declarations for recursive types
export const SourceSchema: z.ZodType<any> = z.lazy(() => z.object({
  // Required
  sourceId: z.string(),
  url: z.string(),
  urlType: z.string(),
  parentId: z.string(),
  parentType: z.string(),
  // Optional
  disclosureType: z.string().nullable().optional(),
  sourceDescription: z.string().nullable().optional(),
  sourceCredit: z.string().nullable().optional(),
  lastEditedAt: z.date().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  // Nested
  plantingTable: z.array(PlantingSchema).optional(),
  polyTable: z.array(PolySchema).optional(),
  sourceTable: z.array(SourceSchema).optional(), // Recursive
  speciesTable: z.array(SpeciesSchema).optional(),
  stakeholderTable: z.array(StakeholderSchema).optional(),
}).strict());

export const StakeholderSchema = z.object({
  // Required
  stakeholderId: z.string(),
  organizationLocalId: z.string(),
  parentId: z.string(),
  parentType: z.string(),
  // Optional
  projectId: z.string().nullable().optional(),
  stakeholderType: z.string().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  lastEditedAt: z.date().nullable().optional(),
  // Nested
  sourceTable: z.array(SourceSchema).optional(),
}).strict();

export const PolySchema = z.object({
  // Required
  polyId: z.string(),
  parentId: z.string(),
  parentType: z.string(),
  projectId: z.string(),
  // Optional
  randomJson: z.string().nullable().optional(),
  survivalRate: z.number().nullable().optional(),
  liabilityCause: z.string().nullable().optional(),
  ratePerTree: z.number().nullable().optional(),
  motivation: z.string().nullable().optional(),
  restorationType: z.string().nullable().optional(),
  reviews: z.string().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  lastEditedAt: z.date().nullable().optional(),
  // Nested
  sourceTable: z.array(SourceSchema).optional(),
}).strict();

export const PlantingSchema = z.object({
  // Required
  plantingId: z.string(),
  projectId: z.string(),
  parentId: z.string(),
  parentType: z.string(),
  // Optional
  planted: z.number().nullable().optional(),
  allocated: z.number().nullable().optional(),
  plantingDate: z.date().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  lastEditedAt: z.date().nullable().optional(),
  deleted: z.boolean().nullable().optional(),
  units: z.number().nullable().optional(),
  unitType: z.string().nullable().optional(),
  pricePerUnit: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  // Nested
  sourceTable: z.array(SourceSchema).optional(),
}).strict();

export const OrganizationLocalSchema = z.object({
  // Required
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  // Optional
  organizationMasterId: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  polyId: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  capacityPerYear: z.number().nullable().optional(),
  organizationNotes: z.string().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  lastEditedAt: z.date().nullable().optional(),
  deleted: z.boolean().nullable().optional(),
  gpsLat: z.number().nullable().optional(),
  gpsLon: z.number().nullable().optional(),
  // Nested
  sourceTable: z.array(SourceSchema).optional(),
  stakeholderTable: z.array(StakeholderSchema).optional(),
}).strict();

export const CropSchema = z.object({
  // Required
  cropId: z.string(),
  cropName: z.string(),
  // Optional
  projectId: z.string().nullable().optional(),
  speciesLocalName: z.string().nullable().optional(),
  speciesId: z.string().nullable().optional(),
  seedInfo: z.string().nullable().optional(),
  cropStock: z.string().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  lastEditedAt: z.date().nullable().optional(),
  editedBy: z.string().nullable().optional(),
  deleted: z.boolean().nullable().optional(),
  organizationLocalName: z.string().nullable().optional(),
  cropNotes: z.string().nullable().optional(),
  // Nested
  polyTable: z.array(PolySchema).optional(),
  sourceTable: z.array(SourceSchema).optional(),
  speciesTable: z.array(SpeciesSchema).optional(),
  stakeholderTable: z.array(StakeholderSchema).optional(),
}).strict();

export const LandSchema = z.object({
  // Required
  landId: z.string(),
  landName: z.string(),
  projectId: z.string(),
  // Optional
  hectares: z.number().nullable().optional(),
  gpsLat: z.number().nullable().optional(),
  gpsLon: z.number().nullable().optional(),
  landNotes: z.string().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  lastEditedAt: z.date().nullable().optional(),
  treatmentType: z.string().nullable().optional(),
  editedBy: z.string().nullable().optional(),
  deleted: z.boolean().nullable().optional(),
  preparation: z.string().nullable().optional(),
  // Nested
  polygonTable: z.array(PolygonSchema), // Required in 3Types.ts
  polyTable: z.array(PolySchema).optional(),
  sourceTable: z.array(SourceSchema).optional(),
  stakeholderTable: z.array(StakeholderSchema).optional(),
}).strict();

export const ProjectSchema = z.object({
  // Required
  projectId: z.string(),
  projectName: z.string(),
  // Optional
  url: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
  projectNotes: z.string().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  lastEditedAt: z.date().nullable().optional(),
  deleted: z.boolean().nullable().optional(),
  carbonRegistryType: z.string().nullable().optional(),
  carbonRegistry: z.string().nullable().optional(),
  projectDateEnd: z.date().nullable().optional(),
  projectDateStart: z.date().nullable().optional(),
  registryId: z.string().nullable().optional(),
  // Nested
  cropTable: z.array(CropSchema).optional(),
  landTable: z.array(LandSchema).optional(),
  organizationLocalTable: z.array(OrganizationLocalSchema).optional(),
  plantingTable: z.array(PlantingSchema).optional(),
  polyTable: z.array(PolySchema).optional(),
  sourceTable: z.array(SourceSchema).optional(),
  stakeholderTable: z.array(StakeholderSchema).optional(),
}).strict();

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type Geometry = z.infer<typeof GeometrySchema>;
export type ProjectWithTables = z.infer<typeof ProjectSchema>;
export type LandWithTables = z.infer<typeof LandSchema>;
export type CropWithTables = z.infer<typeof CropSchema>;
export type SourceWithTables = z.infer<typeof SourceSchema>;
export type PlantingWithTables = z.infer<typeof PlantingSchema>;
export type PolygonWithTables = z.infer<typeof PolygonSchema>;
export type PolyWithTables = z.infer<typeof PolySchema>;
export type StakeholderWithTables = z.infer<typeof StakeholderSchema>;
export type SpeciesWithTables = z.infer<typeof SpeciesSchema>;
export type OrganizationLocalWithTables = z.infer<typeof OrganizationLocalSchema>;
