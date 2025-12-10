import { z } from 'zod';
import { JsonValue, InputJsonValue, objectEnumValues, Decimal as PrismaDecimal, DecimalJsLike } from '@prisma/client/runtime/library';
import type { Prisma } from '../lib/generated/prisma-postgres';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = JsonValue | null | 'JsonNull' | 'DbNull' | typeof objectEnumValues.instances.DbNull | typeof objectEnumValues.instances.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return typeof objectEnumValues.instances.DbNull;
  if (v === 'JsonNull') return typeof objectEnumValues.instances.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.string(), z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.any() }),
    z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;

// DECIMAL
//------------------------------------------------------

export const DecimalJsLikeSchema: z.ZodType<DecimalJsLike> = z.object({
  d: z.array(z.number()),
  e: z.number(),
  s: z.number(),
  toFixed: z.any(),
})

export const DECIMAL_STRING_REGEX = /^(?:-?Infinity|NaN|-?(?:0[bB][01]+(?:\.[01]+)?(?:[pP][-+]?\d+)?|0[oO][0-7]+(?:\.[0-7]+)?(?:[pP][-+]?\d+)?|0[xX][\da-fA-F]+(?:\.[\da-fA-F]+)?(?:[pP][-+]?\d+)?|(?:\d+|\d*\.\d+)(?:[eE][-+]?\d+)?))$/;

export const isValidDecimalInput =
  (v?: null | string | number | DecimalJsLike): v is string | number | DecimalJsLike => {
    if (v === undefined || v === null) return false;
    return (
      (typeof v === 'object' && 'd' in v && 'e' in v && 's' in v && 'toFixed' in v) ||
      (typeof v === 'string' && DECIMAL_STRING_REGEX.test(v)) ||
      typeof v === 'number'
    )
  };

/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const ProjectTableScalarFieldEnumSchema = z.enum(['projectId','projectName','url','platformId','platform','projectNotes','createdAt','lastEditedAt','deleted','carbonRegistryType','carbonRegistry','employmentClaim','employmentClaimDescription','projectDateEnd','projectDateStart','registryId','isPublic']);

export const LandTableScalarFieldEnumSchema = z.enum(['landId','landName','projectId','hectares','gpsLat','gpsLon','landNotes','createdAt','lastEditedAt','treatmentType','editedBy','deleted','preparation']);

export const CropTableScalarFieldEnumSchema = z.enum(['cropId','cropName','projectId','speciesLocalName','speciesId','seedInfo','cropStock','createdAt','lastEditedAt','editedBy','deleted','organizationLocalName','cropNotes']);

export const PlantingTableScalarFieldEnumSchema = z.enum(['plantingId','planted','projectId','parentId','parentTable','allocated','plantingDate','createdAt','lastEditedAt','deleted','units','unitType','pricePerUnit','currency']);

export const SpeciesTableScalarFieldEnumSchema = z.enum(['speciesName','commonName','scientificName','type','family','reference','createdAt','lastEditedAt','editedBy','deleted']);

export const PolygonTableScalarFieldEnumSchema = z.enum(['polygonId','landId','landName','geometry','polygonNotes','lastEditedAt']);

export const PolyTableScalarFieldEnumSchema = z.enum(['polyId','parentId','parentTable','projectId','randomJson','survivalRate','liabilityCause','ratePerTree','motivation','restorationType','reviews','createdAt','lastEditedAt','editedBy','deleted']);

export const StakeholderTableScalarFieldEnumSchema = z.enum(['stakeholderId','organizationLocalId','parentId','parentTable','projectId','stakeholderType','lastEditedAt','createdAt']);

export const SourceTableScalarFieldEnumSchema = z.enum(['sourceId','url','urlType','parentId','parentTable','projectId','disclosureType','sourceDescription','sourceCredit','lastEditedAt','createdAt']);

export const ClaimTableScalarFieldEnumSchema = z.enum(['claimId','claimCount','organizationLocalId','sourceId','lastEditedAt','createdAt','deleted','editedBy']);

export const OrganizationLocalTableScalarFieldEnumSchema = z.enum(['organizationLocalName','organizationLocalId','organizationMasterId','contactName','contactEmail','contactPhone','address','polyId','website','capacityPerYear','organizationNotes','createdAt','lastEditedAt','editedBy','deleted','gpsLat','gpsLon']);

export const OrganizationMasterTableScalarFieldEnumSchema = z.enum(['organizationMasterId','organizationMasterName','contactName','contactEmail','contactPhone','address','website','capacityPerYear','organizationNotes','createdAt','lastEditedAt','editedBy','deleted','gpsLat','gpsLon']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? NullTypes.JsonNull : value === 'DbNull' ? NullTypes.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? NullTypes.JsonNull : value === 'DbNull' ? NullTypes.DbNull : value === 'AnyNull' ? NullTypes.AnyNull : value);

export const ParentTableSchema = z.enum(['ProjectTable','LandTable','CropTable','PlantingTable','organizationTable','SourceTable','StakeholderTable']);

export type ParentTableType = `${z.infer<typeof ParentTableSchema>}`

export const GeometryTypeSchema = z.enum(['Polygon','MultiPolygon','MultiLineString','LineString','Point','Feature','FeatureCollection','GeometryCollection']);

export type GeometryTypeType = `${z.infer<typeof GeometryTypeSchema>}`

export const UnitTypeSchema = z.enum(['cCO2e','hectare','acre','tree','credits','project','land']);

export type UnitTypeType = `${z.infer<typeof UnitTypeSchema>}`

export const TreatmentTypeSchema = z.enum(['ARR','improved_forest_management','avoided_deforestation','forest_conservation','regenerative_agriculture','improved_agricultural_practices','cover_cropping','restoration','agroforestry']);

export type TreatmentTypeType = `${z.infer<typeof TreatmentTypeSchema>}`

export const UrlTypeSchema = z.enum(['webpage','api','image','video','document','review','other']);

export type UrlTypeType = `${z.infer<typeof UrlTypeSchema>}`

export const StakeholderTypeSchema = z.enum(['developer','nursery','marketplace','NGO','research','supplier','producer']);

export type StakeholderTypeType = `${z.infer<typeof StakeholderTypeSchema>}`

export const DisclosureTypeSchema = z.enum(['publicDB','company','NGO','marketplace','disclosure','research']);

export type DisclosureTypeType = `${z.infer<typeof DisclosureTypeSchema>}`

export const CarbonRegistryTypeSchema = z.enum(['ARR','AD','IFM']);

export type CarbonRegistryTypeType = `${z.infer<typeof CarbonRegistryTypeSchema>}`

export const CarbonRegistrySchema = z.enum(['Verra','Gold_Standard','Climate_Action_Reserve','American_Carbon_Registry','Plan_Vivo','Social_Carbon']);

export type CarbonRegistryType = `${z.infer<typeof CarbonRegistrySchema>}`

export const RestorationTypeSchema = z.enum(['manual_planting','drone_seeding','mechanical_planting','aerial_seeding','natural_regeneration','conservation','improved_forest_management','avoided_deforestation','magrove_regeneration','agroforestry']);

export type RestorationTypeType = `${z.infer<typeof RestorationTypeSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// PROJECT TABLE SCHEMA
/////////////////////////////////////////

export const ProjectTableSchema = z.object({
  carbonRegistryType: CarbonRegistryTypeSchema.nullable(),
  carbonRegistry: CarbonRegistrySchema.nullable(),
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().nullable(),
  platformId: z.string().nullable(),
  platform: z.string().nullable(),
  projectNotes: z.string().nullable(),
  createdAt: z.coerce.date(),
  lastEditedAt: z.coerce.date(),
  deleted: z.boolean(),
  employmentClaim: z.number().int().nullable(),
  employmentClaimDescription: z.string().nullable(),
  projectDateEnd: z.coerce.date().nullable(),
  projectDateStart: z.coerce.date().nullable(),
  registryId: z.string().nullable(),
  isPublic: z.boolean(),
})

export type ProjectTable = z.infer<typeof ProjectTableSchema>

/////////////////////////////////////////
// PROJECT TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const ProjectTablePartialSchema = ProjectTableSchema.partial()

export type ProjectTablePartial = z.infer<typeof ProjectTablePartialSchema>

// PROJECT TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const ProjectTableOptionalDefaultsSchema = ProjectTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
  isPublic: z.boolean().optional(),
}))

export type ProjectTableOptionalDefaults = z.infer<typeof ProjectTableOptionalDefaultsSchema>

// PROJECT TABLE RELATION SCHEMA
//------------------------------------------------------

export type ProjectTableRelations = {
  CropTable: CropTableWithRelations[];
  LandTable: LandTableWithRelations[];
  PlantingTable: PlantingTableWithRelations[];
  PolyTable: PolyTableWithRelations[];
  OrganizationLocalTable?: OrganizationLocalTableWithRelations | null;
  StakeholderTable: StakeholderTableWithRelations[];
  SourceTable: SourceTableWithRelations[];
};

export type ProjectTableWithRelations = z.infer<typeof ProjectTableSchema> & ProjectTableRelations

export const ProjectTableWithRelationsSchema: z.ZodType<ProjectTableWithRelations> = ProjectTableSchema.merge(z.object({
  CropTable: z.lazy(() => CropTableWithRelationsSchema).array(),
  LandTable: z.lazy(() => LandTableWithRelationsSchema).array(),
  PlantingTable: z.lazy(() => PlantingTableWithRelationsSchema).array(),
  PolyTable: z.lazy(() => PolyTableWithRelationsSchema).array(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableWithRelationsSchema).nullable(),
  StakeholderTable: z.lazy(() => StakeholderTableWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTableWithRelationsSchema).array(),
}))

// PROJECT TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type ProjectTableOptionalDefaultsRelations = {
  CropTable: CropTableOptionalDefaultsWithRelations[];
  LandTable: LandTableOptionalDefaultsWithRelations[];
  PlantingTable: PlantingTableOptionalDefaultsWithRelations[];
  PolyTable: PolyTableOptionalDefaultsWithRelations[];
  OrganizationLocalTable?: OrganizationLocalTableOptionalDefaultsWithRelations | null;
  StakeholderTable: StakeholderTableOptionalDefaultsWithRelations[];
  SourceTable: SourceTableOptionalDefaultsWithRelations[];
};

export type ProjectTableOptionalDefaultsWithRelations = z.infer<typeof ProjectTableOptionalDefaultsSchema> & ProjectTableOptionalDefaultsRelations

export const ProjectTableOptionalDefaultsWithRelationsSchema: z.ZodType<ProjectTableOptionalDefaultsWithRelations> = ProjectTableOptionalDefaultsSchema.merge(z.object({
  CropTable: z.lazy(() => CropTableOptionalDefaultsWithRelationsSchema).array(),
  LandTable: z.lazy(() => LandTableOptionalDefaultsWithRelationsSchema).array(),
  PlantingTable: z.lazy(() => PlantingTableOptionalDefaultsWithRelationsSchema).array(),
  PolyTable: z.lazy(() => PolyTableOptionalDefaultsWithRelationsSchema).array(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableOptionalDefaultsWithRelationsSchema).nullable(),
  StakeholderTable: z.lazy(() => StakeholderTableOptionalDefaultsWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTableOptionalDefaultsWithRelationsSchema).array(),
}))

// PROJECT TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type ProjectTablePartialRelations = {
  CropTable?: CropTablePartialWithRelations[];
  LandTable?: LandTablePartialWithRelations[];
  PlantingTable?: PlantingTablePartialWithRelations[];
  PolyTable?: PolyTablePartialWithRelations[];
  OrganizationLocalTable?: OrganizationLocalTablePartialWithRelations | null;
  StakeholderTable?: StakeholderTablePartialWithRelations[];
  SourceTable?: SourceTablePartialWithRelations[];
};

export type ProjectTablePartialWithRelations = z.infer<typeof ProjectTablePartialSchema> & ProjectTablePartialRelations

export const ProjectTablePartialWithRelationsSchema: z.ZodType<ProjectTablePartialWithRelations> = ProjectTablePartialSchema.merge(z.object({
  CropTable: z.lazy(() => CropTablePartialWithRelationsSchema).array(),
  LandTable: z.lazy(() => LandTablePartialWithRelationsSchema).array(),
  PlantingTable: z.lazy(() => PlantingTablePartialWithRelationsSchema).array(),
  PolyTable: z.lazy(() => PolyTablePartialWithRelationsSchema).array(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema).nullable(),
  StakeholderTable: z.lazy(() => StakeholderTablePartialWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
})).partial()

export type ProjectTableOptionalDefaultsWithPartialRelations = z.infer<typeof ProjectTableOptionalDefaultsSchema> & ProjectTablePartialRelations

export const ProjectTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<ProjectTableOptionalDefaultsWithPartialRelations> = ProjectTableOptionalDefaultsSchema.merge(z.object({
  CropTable: z.lazy(() => CropTablePartialWithRelationsSchema).array(),
  LandTable: z.lazy(() => LandTablePartialWithRelationsSchema).array(),
  PlantingTable: z.lazy(() => PlantingTablePartialWithRelationsSchema).array(),
  PolyTable: z.lazy(() => PolyTablePartialWithRelationsSchema).array(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema).nullable(),
  StakeholderTable: z.lazy(() => StakeholderTablePartialWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
}).partial())

export type ProjectTableWithPartialRelations = z.infer<typeof ProjectTableSchema> & ProjectTablePartialRelations

export const ProjectTableWithPartialRelationsSchema: z.ZodType<ProjectTableWithPartialRelations> = ProjectTableSchema.merge(z.object({
  CropTable: z.lazy(() => CropTablePartialWithRelationsSchema).array(),
  LandTable: z.lazy(() => LandTablePartialWithRelationsSchema).array(),
  PlantingTable: z.lazy(() => PlantingTablePartialWithRelationsSchema).array(),
  PolyTable: z.lazy(() => PolyTablePartialWithRelationsSchema).array(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema).nullable(),
  StakeholderTable: z.lazy(() => StakeholderTablePartialWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// LAND TABLE SCHEMA
/////////////////////////////////////////

export const LandTableSchema = z.object({
  treatmentType: TreatmentTypeSchema.nullable(),
  landId: z.string(),
  landName: z.string(),
  projectId: z.string(),
  hectares: z.instanceof(PrismaDecimal, { message: "Field 'hectares' must be a Decimal. Location: ['Models', 'LandTable']"}).nullable(),
  gpsLat: z.instanceof(PrismaDecimal, { message: "Field 'gpsLat' must be a Decimal. Location: ['Models', 'LandTable']"}).nullable(),
  gpsLon: z.instanceof(PrismaDecimal, { message: "Field 'gpsLon' must be a Decimal. Location: ['Models', 'LandTable']"}).nullable(),
  landNotes: z.string().nullable(),
  createdAt: z.coerce.date(),
  lastEditedAt: z.coerce.date(),
  editedBy: z.string().nullable(),
  deleted: z.boolean(),
  preparation: z.string().nullable(),
})

export type LandTable = z.infer<typeof LandTableSchema>

/////////////////////////////////////////
// LAND TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const LandTablePartialSchema = LandTableSchema.partial()

export type LandTablePartial = z.infer<typeof LandTablePartialSchema>

// LAND TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const LandTableOptionalDefaultsSchema = LandTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type LandTableOptionalDefaults = z.infer<typeof LandTableOptionalDefaultsSchema>

// LAND TABLE RELATION SCHEMA
//------------------------------------------------------

export type LandTableRelations = {
  ProjectTable: ProjectTableWithRelations;
  PolygonTable: PolygonTableWithRelations[];
  SourceTable: SourceTableWithRelations[];
};

export type LandTableWithRelations = z.infer<typeof LandTableSchema> & LandTableRelations

export const LandTableWithRelationsSchema: z.ZodType<LandTableWithRelations> = LandTableSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTableWithRelationsSchema),
  PolygonTable: z.lazy(() => PolygonTableWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTableWithRelationsSchema).array(),
}))

// LAND TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type LandTableOptionalDefaultsRelations = {
  ProjectTable: ProjectTableOptionalDefaultsWithRelations;
  PolygonTable: PolygonTableOptionalDefaultsWithRelations[];
  SourceTable: SourceTableOptionalDefaultsWithRelations[];
};

export type LandTableOptionalDefaultsWithRelations = z.infer<typeof LandTableOptionalDefaultsSchema> & LandTableOptionalDefaultsRelations

export const LandTableOptionalDefaultsWithRelationsSchema: z.ZodType<LandTableOptionalDefaultsWithRelations> = LandTableOptionalDefaultsSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTableOptionalDefaultsWithRelationsSchema),
  PolygonTable: z.lazy(() => PolygonTableOptionalDefaultsWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTableOptionalDefaultsWithRelationsSchema).array(),
}))

// LAND TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type LandTablePartialRelations = {
  ProjectTable?: ProjectTablePartialWithRelations;
  PolygonTable?: PolygonTablePartialWithRelations[];
  SourceTable?: SourceTablePartialWithRelations[];
};

export type LandTablePartialWithRelations = z.infer<typeof LandTablePartialSchema> & LandTablePartialRelations

export const LandTablePartialWithRelationsSchema: z.ZodType<LandTablePartialWithRelations> = LandTablePartialSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema),
  PolygonTable: z.lazy(() => PolygonTablePartialWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
})).partial()

export type LandTableOptionalDefaultsWithPartialRelations = z.infer<typeof LandTableOptionalDefaultsSchema> & LandTablePartialRelations

export const LandTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<LandTableOptionalDefaultsWithPartialRelations> = LandTableOptionalDefaultsSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema),
  PolygonTable: z.lazy(() => PolygonTablePartialWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
}).partial())

export type LandTableWithPartialRelations = z.infer<typeof LandTableSchema> & LandTablePartialRelations

export const LandTableWithPartialRelationsSchema: z.ZodType<LandTableWithPartialRelations> = LandTableSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema),
  PolygonTable: z.lazy(() => PolygonTablePartialWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// CROP TABLE SCHEMA
/////////////////////////////////////////

export const CropTableSchema = z.object({
  cropId: z.string(),
  cropName: z.string(),
  projectId: z.string().nullable(),
  speciesLocalName: z.string().nullable(),
  speciesId: z.string().nullable(),
  seedInfo: z.string().nullable(),
  cropStock: z.string().nullable(),
  createdAt: z.coerce.date(),
  lastEditedAt: z.coerce.date(),
  editedBy: z.string().nullable(),
  deleted: z.boolean(),
  organizationLocalName: z.string().nullable(),
  cropNotes: z.string().nullable(),
})

export type CropTable = z.infer<typeof CropTableSchema>

/////////////////////////////////////////
// CROP TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const CropTablePartialSchema = CropTableSchema.partial()

export type CropTablePartial = z.infer<typeof CropTablePartialSchema>

// CROP TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const CropTableOptionalDefaultsSchema = CropTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type CropTableOptionalDefaults = z.infer<typeof CropTableOptionalDefaultsSchema>

// CROP TABLE RELATION SCHEMA
//------------------------------------------------------

export type CropTableRelations = {
  ProjectTable?: ProjectTableWithRelations | null;
  SourceTable: SourceTableWithRelations[];
  SpeciesTable: SpeciesTableWithRelations[];
};

export type CropTableWithRelations = z.infer<typeof CropTableSchema> & CropTableRelations

export const CropTableWithRelationsSchema: z.ZodType<CropTableWithRelations> = CropTableSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTableWithRelationsSchema).nullable(),
  SourceTable: z.lazy(() => SourceTableWithRelationsSchema).array(),
  SpeciesTable: z.lazy(() => SpeciesTableWithRelationsSchema).array(),
}))

// CROP TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type CropTableOptionalDefaultsRelations = {
  ProjectTable?: ProjectTableOptionalDefaultsWithRelations | null;
  SourceTable: SourceTableOptionalDefaultsWithRelations[];
  SpeciesTable: SpeciesTableOptionalDefaultsWithRelations[];
};

export type CropTableOptionalDefaultsWithRelations = z.infer<typeof CropTableOptionalDefaultsSchema> & CropTableOptionalDefaultsRelations

export const CropTableOptionalDefaultsWithRelationsSchema: z.ZodType<CropTableOptionalDefaultsWithRelations> = CropTableOptionalDefaultsSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTableOptionalDefaultsWithRelationsSchema).nullable(),
  SourceTable: z.lazy(() => SourceTableOptionalDefaultsWithRelationsSchema).array(),
  SpeciesTable: z.lazy(() => SpeciesTableOptionalDefaultsWithRelationsSchema).array(),
}))

// CROP TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type CropTablePartialRelations = {
  ProjectTable?: ProjectTablePartialWithRelations | null;
  SourceTable?: SourceTablePartialWithRelations[];
  SpeciesTable?: SpeciesTablePartialWithRelations[];
};

export type CropTablePartialWithRelations = z.infer<typeof CropTablePartialSchema> & CropTablePartialRelations

export const CropTablePartialWithRelationsSchema: z.ZodType<CropTablePartialWithRelations> = CropTablePartialSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema).nullable(),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
  SpeciesTable: z.lazy(() => SpeciesTablePartialWithRelationsSchema).array(),
})).partial()

export type CropTableOptionalDefaultsWithPartialRelations = z.infer<typeof CropTableOptionalDefaultsSchema> & CropTablePartialRelations

export const CropTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<CropTableOptionalDefaultsWithPartialRelations> = CropTableOptionalDefaultsSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema).nullable(),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
  SpeciesTable: z.lazy(() => SpeciesTablePartialWithRelationsSchema).array(),
}).partial())

export type CropTableWithPartialRelations = z.infer<typeof CropTableSchema> & CropTablePartialRelations

export const CropTableWithPartialRelationsSchema: z.ZodType<CropTableWithPartialRelations> = CropTableSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema).nullable(),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
  SpeciesTable: z.lazy(() => SpeciesTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// PLANTING TABLE SCHEMA
/////////////////////////////////////////

export const PlantingTableSchema = z.object({
  parentTable: ParentTableSchema,
  unitType: UnitTypeSchema.nullable(),
  plantingId: z.string(),
  planted: z.number().int().nullable(),
  projectId: z.string(),
  parentId: z.string(),
  allocated: z.number().int().nullable(),
  plantingDate: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  lastEditedAt: z.coerce.date(),
  deleted: z.boolean(),
  units: z.instanceof(PrismaDecimal, { message: "Field 'units' must be a Decimal. Location: ['Models', 'PlantingTable']"}).nullable(),
  pricePerUnit: z.instanceof(PrismaDecimal, { message: "Field 'pricePerUnit' must be a Decimal. Location: ['Models', 'PlantingTable']"}).nullable(),
  currency: z.string().nullable(),
})

export type PlantingTable = z.infer<typeof PlantingTableSchema>

/////////////////////////////////////////
// PLANTING TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const PlantingTablePartialSchema = PlantingTableSchema.partial()

export type PlantingTablePartial = z.infer<typeof PlantingTablePartialSchema>

// PLANTING TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PlantingTableOptionalDefaultsSchema = PlantingTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type PlantingTableOptionalDefaults = z.infer<typeof PlantingTableOptionalDefaultsSchema>

// PLANTING TABLE RELATION SCHEMA
//------------------------------------------------------

export type PlantingTableRelations = {
  ProjectTable: ProjectTableWithRelations;
  SourceTable: SourceTableWithRelations[];
};

export type PlantingTableWithRelations = z.infer<typeof PlantingTableSchema> & PlantingTableRelations

export const PlantingTableWithRelationsSchema: z.ZodType<PlantingTableWithRelations> = PlantingTableSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTableWithRelationsSchema),
  SourceTable: z.lazy(() => SourceTableWithRelationsSchema).array(),
}))

// PLANTING TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type PlantingTableOptionalDefaultsRelations = {
  ProjectTable: ProjectTableOptionalDefaultsWithRelations;
  SourceTable: SourceTableOptionalDefaultsWithRelations[];
};

export type PlantingTableOptionalDefaultsWithRelations = z.infer<typeof PlantingTableOptionalDefaultsSchema> & PlantingTableOptionalDefaultsRelations

export const PlantingTableOptionalDefaultsWithRelationsSchema: z.ZodType<PlantingTableOptionalDefaultsWithRelations> = PlantingTableOptionalDefaultsSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTableOptionalDefaultsWithRelationsSchema),
  SourceTable: z.lazy(() => SourceTableOptionalDefaultsWithRelationsSchema).array(),
}))

// PLANTING TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type PlantingTablePartialRelations = {
  ProjectTable?: ProjectTablePartialWithRelations;
  SourceTable?: SourceTablePartialWithRelations[];
};

export type PlantingTablePartialWithRelations = z.infer<typeof PlantingTablePartialSchema> & PlantingTablePartialRelations

export const PlantingTablePartialWithRelationsSchema: z.ZodType<PlantingTablePartialWithRelations> = PlantingTablePartialSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
})).partial()

export type PlantingTableOptionalDefaultsWithPartialRelations = z.infer<typeof PlantingTableOptionalDefaultsSchema> & PlantingTablePartialRelations

export const PlantingTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<PlantingTableOptionalDefaultsWithPartialRelations> = PlantingTableOptionalDefaultsSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
}).partial())

export type PlantingTableWithPartialRelations = z.infer<typeof PlantingTableSchema> & PlantingTablePartialRelations

export const PlantingTableWithPartialRelationsSchema: z.ZodType<PlantingTableWithPartialRelations> = PlantingTableSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// SPECIES TABLE SCHEMA
/////////////////////////////////////////

export const SpeciesTableSchema = z.object({
  speciesName: z.string(),
  commonName: z.string(),
  scientificName: z.string().nullable(),
  type: z.string().nullable(),
  family: z.string().nullable(),
  reference: z.string().nullable(),
  createdAt: z.coerce.date(),
  lastEditedAt: z.coerce.date(),
  editedBy: z.string().nullable(),
  deleted: z.boolean(),
})

export type SpeciesTable = z.infer<typeof SpeciesTableSchema>

/////////////////////////////////////////
// SPECIES TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const SpeciesTablePartialSchema = SpeciesTableSchema.partial()

export type SpeciesTablePartial = z.infer<typeof SpeciesTablePartialSchema>

// SPECIES TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const SpeciesTableOptionalDefaultsSchema = SpeciesTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type SpeciesTableOptionalDefaults = z.infer<typeof SpeciesTableOptionalDefaultsSchema>

// SPECIES TABLE RELATION SCHEMA
//------------------------------------------------------

export type SpeciesTableRelations = {
  CropTable: CropTableWithRelations[];
};

export type SpeciesTableWithRelations = z.infer<typeof SpeciesTableSchema> & SpeciesTableRelations

export const SpeciesTableWithRelationsSchema: z.ZodType<SpeciesTableWithRelations> = SpeciesTableSchema.merge(z.object({
  CropTable: z.lazy(() => CropTableWithRelationsSchema).array(),
}))

// SPECIES TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type SpeciesTableOptionalDefaultsRelations = {
  CropTable: CropTableOptionalDefaultsWithRelations[];
};

export type SpeciesTableOptionalDefaultsWithRelations = z.infer<typeof SpeciesTableOptionalDefaultsSchema> & SpeciesTableOptionalDefaultsRelations

export const SpeciesTableOptionalDefaultsWithRelationsSchema: z.ZodType<SpeciesTableOptionalDefaultsWithRelations> = SpeciesTableOptionalDefaultsSchema.merge(z.object({
  CropTable: z.lazy(() => CropTableOptionalDefaultsWithRelationsSchema).array(),
}))

// SPECIES TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type SpeciesTablePartialRelations = {
  CropTable?: CropTablePartialWithRelations[];
};

export type SpeciesTablePartialWithRelations = z.infer<typeof SpeciesTablePartialSchema> & SpeciesTablePartialRelations

export const SpeciesTablePartialWithRelationsSchema: z.ZodType<SpeciesTablePartialWithRelations> = SpeciesTablePartialSchema.merge(z.object({
  CropTable: z.lazy(() => CropTablePartialWithRelationsSchema).array(),
})).partial()

export type SpeciesTableOptionalDefaultsWithPartialRelations = z.infer<typeof SpeciesTableOptionalDefaultsSchema> & SpeciesTablePartialRelations

export const SpeciesTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<SpeciesTableOptionalDefaultsWithPartialRelations> = SpeciesTableOptionalDefaultsSchema.merge(z.object({
  CropTable: z.lazy(() => CropTablePartialWithRelationsSchema).array(),
}).partial())

export type SpeciesTableWithPartialRelations = z.infer<typeof SpeciesTableSchema> & SpeciesTablePartialRelations

export const SpeciesTableWithPartialRelationsSchema: z.ZodType<SpeciesTableWithPartialRelations> = SpeciesTableSchema.merge(z.object({
  CropTable: z.lazy(() => CropTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// POLYGON TABLE SCHEMA
/////////////////////////////////////////

export const PolygonTableSchema = z.object({
  polygonId: z.string(),
  landId: z.string(),
  landName: z.string().nullable(),
  geometry: JsonValueSchema.nullable(),
  polygonNotes: z.string().nullable(),
  lastEditedAt: z.coerce.date(),
})

export type PolygonTable = z.infer<typeof PolygonTableSchema>

/////////////////////////////////////////
// POLYGON TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const PolygonTablePartialSchema = PolygonTableSchema.partial()

export type PolygonTablePartial = z.infer<typeof PolygonTablePartialSchema>

// POLYGON TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PolygonTableOptionalDefaultsSchema = PolygonTableSchema.merge(z.object({
  lastEditedAt: z.coerce.date().optional(),
}))

export type PolygonTableOptionalDefaults = z.infer<typeof PolygonTableOptionalDefaultsSchema>

// POLYGON TABLE RELATION SCHEMA
//------------------------------------------------------

export type PolygonTableRelations = {
  LandTable: LandTableWithRelations;
};

export type PolygonTableWithRelations = Omit<z.infer<typeof PolygonTableSchema>, "geometry"> & {
  geometry?: JsonValueType | null;
} & PolygonTableRelations

export const PolygonTableWithRelationsSchema: z.ZodType<PolygonTableWithRelations> = PolygonTableSchema.merge(z.object({
  LandTable: z.lazy(() => LandTableWithRelationsSchema),
}))

// POLYGON TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type PolygonTableOptionalDefaultsRelations = {
  LandTable: LandTableOptionalDefaultsWithRelations;
};

export type PolygonTableOptionalDefaultsWithRelations = Omit<z.infer<typeof PolygonTableOptionalDefaultsSchema>, "geometry"> & {
  geometry?: JsonValueType | null;
} & PolygonTableOptionalDefaultsRelations

export const PolygonTableOptionalDefaultsWithRelationsSchema: z.ZodType<PolygonTableOptionalDefaultsWithRelations> = PolygonTableOptionalDefaultsSchema.merge(z.object({
  LandTable: z.lazy(() => LandTableOptionalDefaultsWithRelationsSchema),
}))

// POLYGON TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type PolygonTablePartialRelations = {
  LandTable?: LandTablePartialWithRelations;
};

export type PolygonTablePartialWithRelations = Omit<z.infer<typeof PolygonTablePartialSchema>, "geometry"> & {
  geometry?: JsonValueType | null;
} & PolygonTablePartialRelations

export const PolygonTablePartialWithRelationsSchema: z.ZodType<PolygonTablePartialWithRelations> = PolygonTablePartialSchema.merge(z.object({
  LandTable: z.lazy(() => LandTablePartialWithRelationsSchema),
})).partial()

export type PolygonTableOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof PolygonTableOptionalDefaultsSchema>, "geometry"> & {
  geometry?: JsonValueType | null;
} & PolygonTablePartialRelations

export const PolygonTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<PolygonTableOptionalDefaultsWithPartialRelations> = PolygonTableOptionalDefaultsSchema.merge(z.object({
  LandTable: z.lazy(() => LandTablePartialWithRelationsSchema),
}).partial())

export type PolygonTableWithPartialRelations = Omit<z.infer<typeof PolygonTableSchema>, "geometry"> & {
  geometry?: JsonValueType | null;
} & PolygonTablePartialRelations

export const PolygonTableWithPartialRelationsSchema: z.ZodType<PolygonTableWithPartialRelations> = PolygonTableSchema.merge(z.object({
  LandTable: z.lazy(() => LandTablePartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// POLY TABLE SCHEMA
/////////////////////////////////////////

export const PolyTableSchema = z.object({
  parentTable: ParentTableSchema,
  restorationType: RestorationTypeSchema.nullable(),
  polyId: z.string(),
  parentId: z.string(),
  projectId: z.string(),
  randomJson: z.string().nullable(),
  survivalRate: z.number().nullable(),
  liabilityCause: z.string().nullable(),
  ratePerTree: z.number().nullable(),
  motivation: z.string().nullable(),
  reviews: z.string().nullable(),
  createdAt: z.coerce.date(),
  lastEditedAt: z.coerce.date(),
  editedBy: z.string().nullable(),
  deleted: z.boolean(),
})

export type PolyTable = z.infer<typeof PolyTableSchema>

/////////////////////////////////////////
// POLY TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const PolyTablePartialSchema = PolyTableSchema.partial()

export type PolyTablePartial = z.infer<typeof PolyTablePartialSchema>

// POLY TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PolyTableOptionalDefaultsSchema = PolyTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type PolyTableOptionalDefaults = z.infer<typeof PolyTableOptionalDefaultsSchema>

// POLY TABLE RELATION SCHEMA
//------------------------------------------------------

export type PolyTableRelations = {
  ProjectTable: ProjectTableWithRelations;
};

export type PolyTableWithRelations = z.infer<typeof PolyTableSchema> & PolyTableRelations

export const PolyTableWithRelationsSchema: z.ZodType<PolyTableWithRelations> = PolyTableSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTableWithRelationsSchema),
}))

// POLY TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type PolyTableOptionalDefaultsRelations = {
  ProjectTable: ProjectTableOptionalDefaultsWithRelations;
};

export type PolyTableOptionalDefaultsWithRelations = z.infer<typeof PolyTableOptionalDefaultsSchema> & PolyTableOptionalDefaultsRelations

export const PolyTableOptionalDefaultsWithRelationsSchema: z.ZodType<PolyTableOptionalDefaultsWithRelations> = PolyTableOptionalDefaultsSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTableOptionalDefaultsWithRelationsSchema),
}))

// POLY TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type PolyTablePartialRelations = {
  ProjectTable?: ProjectTablePartialWithRelations;
};

export type PolyTablePartialWithRelations = z.infer<typeof PolyTablePartialSchema> & PolyTablePartialRelations

export const PolyTablePartialWithRelationsSchema: z.ZodType<PolyTablePartialWithRelations> = PolyTablePartialSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema),
})).partial()

export type PolyTableOptionalDefaultsWithPartialRelations = z.infer<typeof PolyTableOptionalDefaultsSchema> & PolyTablePartialRelations

export const PolyTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<PolyTableOptionalDefaultsWithPartialRelations> = PolyTableOptionalDefaultsSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema),
}).partial())

export type PolyTableWithPartialRelations = z.infer<typeof PolyTableSchema> & PolyTablePartialRelations

export const PolyTableWithPartialRelationsSchema: z.ZodType<PolyTableWithPartialRelations> = PolyTableSchema.merge(z.object({
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// STAKEHOLDER TABLE SCHEMA
/////////////////////////////////////////

export const StakeholderTableSchema = z.object({
  parentTable: ParentTableSchema,
  stakeholderType: StakeholderTypeSchema.nullable(),
  stakeholderId: z.string(),
  organizationLocalId: z.string(),
  parentId: z.string(),
  projectId: z.string().nullable(),
  lastEditedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export type StakeholderTable = z.infer<typeof StakeholderTableSchema>

/////////////////////////////////////////
// STAKEHOLDER TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const StakeholderTablePartialSchema = StakeholderTableSchema.partial()

export type StakeholderTablePartial = z.infer<typeof StakeholderTablePartialSchema>

// STAKEHOLDER TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const StakeholderTableOptionalDefaultsSchema = StakeholderTableSchema.merge(z.object({
  lastEditedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type StakeholderTableOptionalDefaults = z.infer<typeof StakeholderTableOptionalDefaultsSchema>

// STAKEHOLDER TABLE RELATION SCHEMA
//------------------------------------------------------

export type StakeholderTableRelations = {
  OrganizationLocalTable: OrganizationLocalTableWithRelations;
  ProjectTable?: ProjectTableWithRelations | null;
};

export type StakeholderTableWithRelations = z.infer<typeof StakeholderTableSchema> & StakeholderTableRelations

export const StakeholderTableWithRelationsSchema: z.ZodType<StakeholderTableWithRelations> = StakeholderTableSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableWithRelationsSchema),
  ProjectTable: z.lazy(() => ProjectTableWithRelationsSchema).nullable(),
}))

// STAKEHOLDER TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type StakeholderTableOptionalDefaultsRelations = {
  OrganizationLocalTable: OrganizationLocalTableOptionalDefaultsWithRelations;
  ProjectTable?: ProjectTableOptionalDefaultsWithRelations | null;
};

export type StakeholderTableOptionalDefaultsWithRelations = z.infer<typeof StakeholderTableOptionalDefaultsSchema> & StakeholderTableOptionalDefaultsRelations

export const StakeholderTableOptionalDefaultsWithRelationsSchema: z.ZodType<StakeholderTableOptionalDefaultsWithRelations> = StakeholderTableOptionalDefaultsSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableOptionalDefaultsWithRelationsSchema),
  ProjectTable: z.lazy(() => ProjectTableOptionalDefaultsWithRelationsSchema).nullable(),
}))

// STAKEHOLDER TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type StakeholderTablePartialRelations = {
  OrganizationLocalTable?: OrganizationLocalTablePartialWithRelations;
  ProjectTable?: ProjectTablePartialWithRelations | null;
};

export type StakeholderTablePartialWithRelations = z.infer<typeof StakeholderTablePartialSchema> & StakeholderTablePartialRelations

export const StakeholderTablePartialWithRelationsSchema: z.ZodType<StakeholderTablePartialWithRelations> = StakeholderTablePartialSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema),
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema).nullable(),
})).partial()

export type StakeholderTableOptionalDefaultsWithPartialRelations = z.infer<typeof StakeholderTableOptionalDefaultsSchema> & StakeholderTablePartialRelations

export const StakeholderTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<StakeholderTableOptionalDefaultsWithPartialRelations> = StakeholderTableOptionalDefaultsSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema),
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema).nullable(),
}).partial())

export type StakeholderTableWithPartialRelations = z.infer<typeof StakeholderTableSchema> & StakeholderTablePartialRelations

export const StakeholderTableWithPartialRelationsSchema: z.ZodType<StakeholderTableWithPartialRelations> = StakeholderTableSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema),
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema).nullable(),
}).partial())

/////////////////////////////////////////
// SOURCE TABLE SCHEMA
/////////////////////////////////////////

export const SourceTableSchema = z.object({
  urlType: UrlTypeSchema.nullable(),
  parentTable: ParentTableSchema.nullable(),
  disclosureType: DisclosureTypeSchema.nullable(),
  sourceId: z.string(),
  url: z.string(),
  parentId: z.string().nullable(),
  projectId: z.string().nullable(),
  sourceDescription: z.string().nullable(),
  sourceCredit: z.string().nullable(),
  lastEditedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export type SourceTable = z.infer<typeof SourceTableSchema>

/////////////////////////////////////////
// SOURCE TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const SourceTablePartialSchema = SourceTableSchema.partial()

export type SourceTablePartial = z.infer<typeof SourceTablePartialSchema>

// SOURCE TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const SourceTableOptionalDefaultsSchema = SourceTableSchema.merge(z.object({
  lastEditedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type SourceTableOptionalDefaults = z.infer<typeof SourceTableOptionalDefaultsSchema>

// SOURCE TABLE RELATION SCHEMA
//------------------------------------------------------

export type SourceTableRelations = {
  ClaimTable: ClaimTableWithRelations[];
  CropTable: CropTableWithRelations[];
  LandTable: LandTableWithRelations[];
  OrganizationLocalTable: OrganizationLocalTableWithRelations[];
  PlantingTable: PlantingTableWithRelations[];
  ProjectTable: ProjectTableWithRelations[];
};

export type SourceTableWithRelations = z.infer<typeof SourceTableSchema> & SourceTableRelations

export const SourceTableWithRelationsSchema: z.ZodType<SourceTableWithRelations> = SourceTableSchema.merge(z.object({
  ClaimTable: z.lazy(() => ClaimTableWithRelationsSchema).array(),
  CropTable: z.lazy(() => CropTableWithRelationsSchema).array(),
  LandTable: z.lazy(() => LandTableWithRelationsSchema).array(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableWithRelationsSchema).array(),
  PlantingTable: z.lazy(() => PlantingTableWithRelationsSchema).array(),
  ProjectTable: z.lazy(() => ProjectTableWithRelationsSchema).array(),
}))

// SOURCE TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type SourceTableOptionalDefaultsRelations = {
  ClaimTable: ClaimTableOptionalDefaultsWithRelations[];
  CropTable: CropTableOptionalDefaultsWithRelations[];
  LandTable: LandTableOptionalDefaultsWithRelations[];
  OrganizationLocalTable: OrganizationLocalTableOptionalDefaultsWithRelations[];
  PlantingTable: PlantingTableOptionalDefaultsWithRelations[];
  ProjectTable: ProjectTableOptionalDefaultsWithRelations[];
};

export type SourceTableOptionalDefaultsWithRelations = z.infer<typeof SourceTableOptionalDefaultsSchema> & SourceTableOptionalDefaultsRelations

export const SourceTableOptionalDefaultsWithRelationsSchema: z.ZodType<SourceTableOptionalDefaultsWithRelations> = SourceTableOptionalDefaultsSchema.merge(z.object({
  ClaimTable: z.lazy(() => ClaimTableOptionalDefaultsWithRelationsSchema).array(),
  CropTable: z.lazy(() => CropTableOptionalDefaultsWithRelationsSchema).array(),
  LandTable: z.lazy(() => LandTableOptionalDefaultsWithRelationsSchema).array(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableOptionalDefaultsWithRelationsSchema).array(),
  PlantingTable: z.lazy(() => PlantingTableOptionalDefaultsWithRelationsSchema).array(),
  ProjectTable: z.lazy(() => ProjectTableOptionalDefaultsWithRelationsSchema).array(),
}))

// SOURCE TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type SourceTablePartialRelations = {
  ClaimTable?: ClaimTablePartialWithRelations[];
  CropTable?: CropTablePartialWithRelations[];
  LandTable?: LandTablePartialWithRelations[];
  OrganizationLocalTable?: OrganizationLocalTablePartialWithRelations[];
  PlantingTable?: PlantingTablePartialWithRelations[];
  ProjectTable?: ProjectTablePartialWithRelations[];
};

export type SourceTablePartialWithRelations = z.infer<typeof SourceTablePartialSchema> & SourceTablePartialRelations

export const SourceTablePartialWithRelationsSchema: z.ZodType<SourceTablePartialWithRelations> = SourceTablePartialSchema.merge(z.object({
  ClaimTable: z.lazy(() => ClaimTablePartialWithRelationsSchema).array(),
  CropTable: z.lazy(() => CropTablePartialWithRelationsSchema).array(),
  LandTable: z.lazy(() => LandTablePartialWithRelationsSchema).array(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema).array(),
  PlantingTable: z.lazy(() => PlantingTablePartialWithRelationsSchema).array(),
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema).array(),
})).partial()

export type SourceTableOptionalDefaultsWithPartialRelations = z.infer<typeof SourceTableOptionalDefaultsSchema> & SourceTablePartialRelations

export const SourceTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<SourceTableOptionalDefaultsWithPartialRelations> = SourceTableOptionalDefaultsSchema.merge(z.object({
  ClaimTable: z.lazy(() => ClaimTablePartialWithRelationsSchema).array(),
  CropTable: z.lazy(() => CropTablePartialWithRelationsSchema).array(),
  LandTable: z.lazy(() => LandTablePartialWithRelationsSchema).array(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema).array(),
  PlantingTable: z.lazy(() => PlantingTablePartialWithRelationsSchema).array(),
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema).array(),
}).partial())

export type SourceTableWithPartialRelations = z.infer<typeof SourceTableSchema> & SourceTablePartialRelations

export const SourceTableWithPartialRelationsSchema: z.ZodType<SourceTableWithPartialRelations> = SourceTableSchema.merge(z.object({
  ClaimTable: z.lazy(() => ClaimTablePartialWithRelationsSchema).array(),
  CropTable: z.lazy(() => CropTablePartialWithRelationsSchema).array(),
  LandTable: z.lazy(() => LandTablePartialWithRelationsSchema).array(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema).array(),
  PlantingTable: z.lazy(() => PlantingTablePartialWithRelationsSchema).array(),
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// CLAIM TABLE SCHEMA
/////////////////////////////////////////

export const ClaimTableSchema = z.object({
  claimId: z.string(),
  claimCount: z.number().int(),
  organizationLocalId: z.string(),
  sourceId: z.string(),
  lastEditedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  deleted: z.boolean(),
  editedBy: z.string().nullable(),
})

export type ClaimTable = z.infer<typeof ClaimTableSchema>

/////////////////////////////////////////
// CLAIM TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const ClaimTablePartialSchema = ClaimTableSchema.partial()

export type ClaimTablePartial = z.infer<typeof ClaimTablePartialSchema>

// CLAIM TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const ClaimTableOptionalDefaultsSchema = ClaimTableSchema.merge(z.object({
  lastEditedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type ClaimTableOptionalDefaults = z.infer<typeof ClaimTableOptionalDefaultsSchema>

// CLAIM TABLE RELATION SCHEMA
//------------------------------------------------------

export type ClaimTableRelations = {
  OrganizationLocalTable: OrganizationLocalTableWithRelations;
  SourceTable: SourceTableWithRelations;
};

export type ClaimTableWithRelations = z.infer<typeof ClaimTableSchema> & ClaimTableRelations

export const ClaimTableWithRelationsSchema: z.ZodType<ClaimTableWithRelations> = ClaimTableSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableWithRelationsSchema),
  SourceTable: z.lazy(() => SourceTableWithRelationsSchema),
}))

// CLAIM TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type ClaimTableOptionalDefaultsRelations = {
  OrganizationLocalTable: OrganizationLocalTableOptionalDefaultsWithRelations;
  SourceTable: SourceTableOptionalDefaultsWithRelations;
};

export type ClaimTableOptionalDefaultsWithRelations = z.infer<typeof ClaimTableOptionalDefaultsSchema> & ClaimTableOptionalDefaultsRelations

export const ClaimTableOptionalDefaultsWithRelationsSchema: z.ZodType<ClaimTableOptionalDefaultsWithRelations> = ClaimTableOptionalDefaultsSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableOptionalDefaultsWithRelationsSchema),
  SourceTable: z.lazy(() => SourceTableOptionalDefaultsWithRelationsSchema),
}))

// CLAIM TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type ClaimTablePartialRelations = {
  OrganizationLocalTable?: OrganizationLocalTablePartialWithRelations;
  SourceTable?: SourceTablePartialWithRelations;
};

export type ClaimTablePartialWithRelations = z.infer<typeof ClaimTablePartialSchema> & ClaimTablePartialRelations

export const ClaimTablePartialWithRelationsSchema: z.ZodType<ClaimTablePartialWithRelations> = ClaimTablePartialSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema),
})).partial()

export type ClaimTableOptionalDefaultsWithPartialRelations = z.infer<typeof ClaimTableOptionalDefaultsSchema> & ClaimTablePartialRelations

export const ClaimTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<ClaimTableOptionalDefaultsWithPartialRelations> = ClaimTableOptionalDefaultsSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema),
}).partial())

export type ClaimTableWithPartialRelations = z.infer<typeof ClaimTableSchema> & ClaimTablePartialRelations

export const ClaimTableWithPartialRelationsSchema: z.ZodType<ClaimTableWithPartialRelations> = ClaimTableSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// ORGANIZATION LOCAL TABLE SCHEMA
/////////////////////////////////////////

export const OrganizationLocalTableSchema = z.object({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  organizationMasterId: z.string().nullable(),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  address: z.string().nullable(),
  polyId: z.string().nullable(),
  website: z.string().nullable(),
  capacityPerYear: z.number().int().nullable(),
  organizationNotes: z.string().nullable(),
  createdAt: z.coerce.date(),
  lastEditedAt: z.coerce.date(),
  editedBy: z.string().nullable(),
  deleted: z.boolean(),
  gpsLat: z.number().nullable(),
  gpsLon: z.number().nullable(),
})

export type OrganizationLocalTable = z.infer<typeof OrganizationLocalTableSchema>

/////////////////////////////////////////
// ORGANIZATION LOCAL TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const OrganizationLocalTablePartialSchema = OrganizationLocalTableSchema.partial()

export type OrganizationLocalTablePartial = z.infer<typeof OrganizationLocalTablePartialSchema>

// ORGANIZATION LOCAL TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const OrganizationLocalTableOptionalDefaultsSchema = OrganizationLocalTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type OrganizationLocalTableOptionalDefaults = z.infer<typeof OrganizationLocalTableOptionalDefaultsSchema>

// ORGANIZATION LOCAL TABLE RELATION SCHEMA
//------------------------------------------------------

export type OrganizationLocalTableRelations = {
  ClaimTable: ClaimTableWithRelations[];
  OrganizationMasterTable?: OrganizationMasterTableWithRelations | null;
  ProjectTable: ProjectTableWithRelations[];
  StakeholderTable: StakeholderTableWithRelations[];
  SourceTable: SourceTableWithRelations[];
};

export type OrganizationLocalTableWithRelations = z.infer<typeof OrganizationLocalTableSchema> & OrganizationLocalTableRelations

export const OrganizationLocalTableWithRelationsSchema: z.ZodType<OrganizationLocalTableWithRelations> = OrganizationLocalTableSchema.merge(z.object({
  ClaimTable: z.lazy(() => ClaimTableWithRelationsSchema).array(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableWithRelationsSchema).nullable(),
  ProjectTable: z.lazy(() => ProjectTableWithRelationsSchema).array(),
  StakeholderTable: z.lazy(() => StakeholderTableWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTableWithRelationsSchema).array(),
}))

// ORGANIZATION LOCAL TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type OrganizationLocalTableOptionalDefaultsRelations = {
  ClaimTable: ClaimTableOptionalDefaultsWithRelations[];
  OrganizationMasterTable?: OrganizationMasterTableOptionalDefaultsWithRelations | null;
  ProjectTable: ProjectTableOptionalDefaultsWithRelations[];
  StakeholderTable: StakeholderTableOptionalDefaultsWithRelations[];
  SourceTable: SourceTableOptionalDefaultsWithRelations[];
};

export type OrganizationLocalTableOptionalDefaultsWithRelations = z.infer<typeof OrganizationLocalTableOptionalDefaultsSchema> & OrganizationLocalTableOptionalDefaultsRelations

export const OrganizationLocalTableOptionalDefaultsWithRelationsSchema: z.ZodType<OrganizationLocalTableOptionalDefaultsWithRelations> = OrganizationLocalTableOptionalDefaultsSchema.merge(z.object({
  ClaimTable: z.lazy(() => ClaimTableOptionalDefaultsWithRelationsSchema).array(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableOptionalDefaultsWithRelationsSchema).nullable(),
  ProjectTable: z.lazy(() => ProjectTableOptionalDefaultsWithRelationsSchema).array(),
  StakeholderTable: z.lazy(() => StakeholderTableOptionalDefaultsWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTableOptionalDefaultsWithRelationsSchema).array(),
}))

// ORGANIZATION LOCAL TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type OrganizationLocalTablePartialRelations = {
  ClaimTable?: ClaimTablePartialWithRelations[];
  OrganizationMasterTable?: OrganizationMasterTablePartialWithRelations | null;
  ProjectTable?: ProjectTablePartialWithRelations[];
  StakeholderTable?: StakeholderTablePartialWithRelations[];
  SourceTable?: SourceTablePartialWithRelations[];
};

export type OrganizationLocalTablePartialWithRelations = z.infer<typeof OrganizationLocalTablePartialSchema> & OrganizationLocalTablePartialRelations

export const OrganizationLocalTablePartialWithRelationsSchema: z.ZodType<OrganizationLocalTablePartialWithRelations> = OrganizationLocalTablePartialSchema.merge(z.object({
  ClaimTable: z.lazy(() => ClaimTablePartialWithRelationsSchema).array(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTablePartialWithRelationsSchema).nullable(),
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema).array(),
  StakeholderTable: z.lazy(() => StakeholderTablePartialWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
})).partial()

export type OrganizationLocalTableOptionalDefaultsWithPartialRelations = z.infer<typeof OrganizationLocalTableOptionalDefaultsSchema> & OrganizationLocalTablePartialRelations

export const OrganizationLocalTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<OrganizationLocalTableOptionalDefaultsWithPartialRelations> = OrganizationLocalTableOptionalDefaultsSchema.merge(z.object({
  ClaimTable: z.lazy(() => ClaimTablePartialWithRelationsSchema).array(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTablePartialWithRelationsSchema).nullable(),
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema).array(),
  StakeholderTable: z.lazy(() => StakeholderTablePartialWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
}).partial())

export type OrganizationLocalTableWithPartialRelations = z.infer<typeof OrganizationLocalTableSchema> & OrganizationLocalTablePartialRelations

export const OrganizationLocalTableWithPartialRelationsSchema: z.ZodType<OrganizationLocalTableWithPartialRelations> = OrganizationLocalTableSchema.merge(z.object({
  ClaimTable: z.lazy(() => ClaimTablePartialWithRelationsSchema).array(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTablePartialWithRelationsSchema).nullable(),
  ProjectTable: z.lazy(() => ProjectTablePartialWithRelationsSchema).array(),
  StakeholderTable: z.lazy(() => StakeholderTablePartialWithRelationsSchema).array(),
  SourceTable: z.lazy(() => SourceTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// ORGANIZATION MASTER TABLE SCHEMA
/////////////////////////////////////////

export const OrganizationMasterTableSchema = z.object({
  organizationMasterId: z.string(),
  organizationMasterName: z.string(),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  address: z.string().nullable(),
  website: z.string().nullable(),
  capacityPerYear: z.number().int().nullable(),
  organizationNotes: z.string().nullable(),
  createdAt: z.coerce.date(),
  lastEditedAt: z.coerce.date(),
  editedBy: z.string().nullable(),
  deleted: z.boolean(),
  gpsLat: z.number().nullable(),
  gpsLon: z.number().nullable(),
})

export type OrganizationMasterTable = z.infer<typeof OrganizationMasterTableSchema>

/////////////////////////////////////////
// ORGANIZATION MASTER TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const OrganizationMasterTablePartialSchema = OrganizationMasterTableSchema.partial()

export type OrganizationMasterTablePartial = z.infer<typeof OrganizationMasterTablePartialSchema>

// ORGANIZATION MASTER TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const OrganizationMasterTableOptionalDefaultsSchema = OrganizationMasterTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type OrganizationMasterTableOptionalDefaults = z.infer<typeof OrganizationMasterTableOptionalDefaultsSchema>

// ORGANIZATION MASTER TABLE RELATION SCHEMA
//------------------------------------------------------

export type OrganizationMasterTableRelations = {
  OrganizationLocalTable: OrganizationLocalTableWithRelations[];
};

export type OrganizationMasterTableWithRelations = z.infer<typeof OrganizationMasterTableSchema> & OrganizationMasterTableRelations

export const OrganizationMasterTableWithRelationsSchema: z.ZodType<OrganizationMasterTableWithRelations> = OrganizationMasterTableSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableWithRelationsSchema).array(),
}))

// ORGANIZATION MASTER TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type OrganizationMasterTableOptionalDefaultsRelations = {
  OrganizationLocalTable: OrganizationLocalTableOptionalDefaultsWithRelations[];
};

export type OrganizationMasterTableOptionalDefaultsWithRelations = z.infer<typeof OrganizationMasterTableOptionalDefaultsSchema> & OrganizationMasterTableOptionalDefaultsRelations

export const OrganizationMasterTableOptionalDefaultsWithRelationsSchema: z.ZodType<OrganizationMasterTableOptionalDefaultsWithRelations> = OrganizationMasterTableOptionalDefaultsSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableOptionalDefaultsWithRelationsSchema).array(),
}))

// ORGANIZATION MASTER TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type OrganizationMasterTablePartialRelations = {
  OrganizationLocalTable?: OrganizationLocalTablePartialWithRelations[];
};

export type OrganizationMasterTablePartialWithRelations = z.infer<typeof OrganizationMasterTablePartialSchema> & OrganizationMasterTablePartialRelations

export const OrganizationMasterTablePartialWithRelationsSchema: z.ZodType<OrganizationMasterTablePartialWithRelations> = OrganizationMasterTablePartialSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema).array(),
})).partial()

export type OrganizationMasterTableOptionalDefaultsWithPartialRelations = z.infer<typeof OrganizationMasterTableOptionalDefaultsSchema> & OrganizationMasterTablePartialRelations

export const OrganizationMasterTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<OrganizationMasterTableOptionalDefaultsWithPartialRelations> = OrganizationMasterTableOptionalDefaultsSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema).array(),
}).partial())

export type OrganizationMasterTableWithPartialRelations = z.infer<typeof OrganizationMasterTableSchema> & OrganizationMasterTablePartialRelations

export const OrganizationMasterTableWithPartialRelationsSchema: z.ZodType<OrganizationMasterTableWithPartialRelations> = OrganizationMasterTableSchema.merge(z.object({
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// PROJECT TABLE
//------------------------------------------------------

export const ProjectTableIncludeSchema: z.ZodType<Prisma.ProjectTableInclude> = z.object({
  CropTable: z.union([z.boolean(),z.lazy(() => CropTableFindManyArgsSchema)]).optional(),
  LandTable: z.union([z.boolean(),z.lazy(() => LandTableFindManyArgsSchema)]).optional(),
  PlantingTable: z.union([z.boolean(),z.lazy(() => PlantingTableFindManyArgsSchema)]).optional(),
  PolyTable: z.union([z.boolean(),z.lazy(() => PolyTableFindManyArgsSchema)]).optional(),
  OrganizationLocalTable: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableArgsSchema)]).optional(),
  StakeholderTable: z.union([z.boolean(),z.lazy(() => StakeholderTableFindManyArgsSchema)]).optional(),
  SourceTable: z.union([z.boolean(),z.lazy(() => SourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProjectTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const ProjectTableArgsSchema: z.ZodType<Prisma.ProjectTableDefaultArgs> = z.object({
  select: z.lazy(() => ProjectTableSelectSchema).optional(),
  include: z.lazy(() => ProjectTableIncludeSchema).optional(),
}).strict();

export const ProjectTableCountOutputTypeArgsSchema: z.ZodType<Prisma.ProjectTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => ProjectTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const ProjectTableCountOutputTypeSelectSchema: z.ZodType<Prisma.ProjectTableCountOutputTypeSelect> = z.object({
  CropTable: z.boolean().optional(),
  LandTable: z.boolean().optional(),
  PlantingTable: z.boolean().optional(),
  PolyTable: z.boolean().optional(),
  StakeholderTable: z.boolean().optional(),
  SourceTable: z.boolean().optional(),
}).strict();

export const ProjectTableSelectSchema: z.ZodType<Prisma.ProjectTableSelect> = z.object({
  projectId: z.boolean().optional(),
  projectName: z.boolean().optional(),
  url: z.boolean().optional(),
  platformId: z.boolean().optional(),
  platform: z.boolean().optional(),
  projectNotes: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  deleted: z.boolean().optional(),
  carbonRegistryType: z.boolean().optional(),
  carbonRegistry: z.boolean().optional(),
  employmentClaim: z.boolean().optional(),
  employmentClaimDescription: z.boolean().optional(),
  projectDateEnd: z.boolean().optional(),
  projectDateStart: z.boolean().optional(),
  registryId: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  CropTable: z.union([z.boolean(),z.lazy(() => CropTableFindManyArgsSchema)]).optional(),
  LandTable: z.union([z.boolean(),z.lazy(() => LandTableFindManyArgsSchema)]).optional(),
  PlantingTable: z.union([z.boolean(),z.lazy(() => PlantingTableFindManyArgsSchema)]).optional(),
  PolyTable: z.union([z.boolean(),z.lazy(() => PolyTableFindManyArgsSchema)]).optional(),
  OrganizationLocalTable: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableArgsSchema)]).optional(),
  StakeholderTable: z.union([z.boolean(),z.lazy(() => StakeholderTableFindManyArgsSchema)]).optional(),
  SourceTable: z.union([z.boolean(),z.lazy(() => SourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProjectTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// LAND TABLE
//------------------------------------------------------

export const LandTableIncludeSchema: z.ZodType<Prisma.LandTableInclude> = z.object({
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableArgsSchema)]).optional(),
  PolygonTable: z.union([z.boolean(),z.lazy(() => PolygonTableFindManyArgsSchema)]).optional(),
  SourceTable: z.union([z.boolean(),z.lazy(() => SourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => LandTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const LandTableArgsSchema: z.ZodType<Prisma.LandTableDefaultArgs> = z.object({
  select: z.lazy(() => LandTableSelectSchema).optional(),
  include: z.lazy(() => LandTableIncludeSchema).optional(),
}).strict();

export const LandTableCountOutputTypeArgsSchema: z.ZodType<Prisma.LandTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => LandTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const LandTableCountOutputTypeSelectSchema: z.ZodType<Prisma.LandTableCountOutputTypeSelect> = z.object({
  PolygonTable: z.boolean().optional(),
  SourceTable: z.boolean().optional(),
}).strict();

export const LandTableSelectSchema: z.ZodType<Prisma.LandTableSelect> = z.object({
  landId: z.boolean().optional(),
  landName: z.boolean().optional(),
  projectId: z.boolean().optional(),
  hectares: z.boolean().optional(),
  gpsLat: z.boolean().optional(),
  gpsLon: z.boolean().optional(),
  landNotes: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  treatmentType: z.boolean().optional(),
  editedBy: z.boolean().optional(),
  deleted: z.boolean().optional(),
  preparation: z.boolean().optional(),
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableArgsSchema)]).optional(),
  PolygonTable: z.union([z.boolean(),z.lazy(() => PolygonTableFindManyArgsSchema)]).optional(),
  SourceTable: z.union([z.boolean(),z.lazy(() => SourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => LandTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// CROP TABLE
//------------------------------------------------------

export const CropTableIncludeSchema: z.ZodType<Prisma.CropTableInclude> = z.object({
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableArgsSchema)]).optional(),
  SourceTable: z.union([z.boolean(),z.lazy(() => SourceTableFindManyArgsSchema)]).optional(),
  SpeciesTable: z.union([z.boolean(),z.lazy(() => SpeciesTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CropTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const CropTableArgsSchema: z.ZodType<Prisma.CropTableDefaultArgs> = z.object({
  select: z.lazy(() => CropTableSelectSchema).optional(),
  include: z.lazy(() => CropTableIncludeSchema).optional(),
}).strict();

export const CropTableCountOutputTypeArgsSchema: z.ZodType<Prisma.CropTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => CropTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const CropTableCountOutputTypeSelectSchema: z.ZodType<Prisma.CropTableCountOutputTypeSelect> = z.object({
  SourceTable: z.boolean().optional(),
  SpeciesTable: z.boolean().optional(),
}).strict();

export const CropTableSelectSchema: z.ZodType<Prisma.CropTableSelect> = z.object({
  cropId: z.boolean().optional(),
  cropName: z.boolean().optional(),
  projectId: z.boolean().optional(),
  speciesLocalName: z.boolean().optional(),
  speciesId: z.boolean().optional(),
  seedInfo: z.boolean().optional(),
  cropStock: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  editedBy: z.boolean().optional(),
  deleted: z.boolean().optional(),
  organizationLocalName: z.boolean().optional(),
  cropNotes: z.boolean().optional(),
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableArgsSchema)]).optional(),
  SourceTable: z.union([z.boolean(),z.lazy(() => SourceTableFindManyArgsSchema)]).optional(),
  SpeciesTable: z.union([z.boolean(),z.lazy(() => SpeciesTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CropTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// PLANTING TABLE
//------------------------------------------------------

export const PlantingTableIncludeSchema: z.ZodType<Prisma.PlantingTableInclude> = z.object({
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableArgsSchema)]).optional(),
  SourceTable: z.union([z.boolean(),z.lazy(() => SourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PlantingTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const PlantingTableArgsSchema: z.ZodType<Prisma.PlantingTableDefaultArgs> = z.object({
  select: z.lazy(() => PlantingTableSelectSchema).optional(),
  include: z.lazy(() => PlantingTableIncludeSchema).optional(),
}).strict();

export const PlantingTableCountOutputTypeArgsSchema: z.ZodType<Prisma.PlantingTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => PlantingTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const PlantingTableCountOutputTypeSelectSchema: z.ZodType<Prisma.PlantingTableCountOutputTypeSelect> = z.object({
  SourceTable: z.boolean().optional(),
}).strict();

export const PlantingTableSelectSchema: z.ZodType<Prisma.PlantingTableSelect> = z.object({
  plantingId: z.boolean().optional(),
  planted: z.boolean().optional(),
  projectId: z.boolean().optional(),
  parentId: z.boolean().optional(),
  parentTable: z.boolean().optional(),
  allocated: z.boolean().optional(),
  plantingDate: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  deleted: z.boolean().optional(),
  units: z.boolean().optional(),
  unitType: z.boolean().optional(),
  pricePerUnit: z.boolean().optional(),
  currency: z.boolean().optional(),
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableArgsSchema)]).optional(),
  SourceTable: z.union([z.boolean(),z.lazy(() => SourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PlantingTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// SPECIES TABLE
//------------------------------------------------------

export const SpeciesTableIncludeSchema: z.ZodType<Prisma.SpeciesTableInclude> = z.object({
  CropTable: z.union([z.boolean(),z.lazy(() => CropTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SpeciesTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const SpeciesTableArgsSchema: z.ZodType<Prisma.SpeciesTableDefaultArgs> = z.object({
  select: z.lazy(() => SpeciesTableSelectSchema).optional(),
  include: z.lazy(() => SpeciesTableIncludeSchema).optional(),
}).strict();

export const SpeciesTableCountOutputTypeArgsSchema: z.ZodType<Prisma.SpeciesTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => SpeciesTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const SpeciesTableCountOutputTypeSelectSchema: z.ZodType<Prisma.SpeciesTableCountOutputTypeSelect> = z.object({
  CropTable: z.boolean().optional(),
}).strict();

export const SpeciesTableSelectSchema: z.ZodType<Prisma.SpeciesTableSelect> = z.object({
  speciesName: z.boolean().optional(),
  commonName: z.boolean().optional(),
  scientificName: z.boolean().optional(),
  type: z.boolean().optional(),
  family: z.boolean().optional(),
  reference: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  editedBy: z.boolean().optional(),
  deleted: z.boolean().optional(),
  CropTable: z.union([z.boolean(),z.lazy(() => CropTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SpeciesTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// POLYGON TABLE
//------------------------------------------------------

export const PolygonTableIncludeSchema: z.ZodType<Prisma.PolygonTableInclude> = z.object({
  LandTable: z.union([z.boolean(),z.lazy(() => LandTableArgsSchema)]).optional(),
}).strict();

export const PolygonTableArgsSchema: z.ZodType<Prisma.PolygonTableDefaultArgs> = z.object({
  select: z.lazy(() => PolygonTableSelectSchema).optional(),
  include: z.lazy(() => PolygonTableIncludeSchema).optional(),
}).strict();

export const PolygonTableSelectSchema: z.ZodType<Prisma.PolygonTableSelect> = z.object({
  polygonId: z.boolean().optional(),
  landId: z.boolean().optional(),
  landName: z.boolean().optional(),
  geometry: z.boolean().optional(),
  polygonNotes: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  LandTable: z.union([z.boolean(),z.lazy(() => LandTableArgsSchema)]).optional(),
}).strict()

// POLY TABLE
//------------------------------------------------------

export const PolyTableIncludeSchema: z.ZodType<Prisma.PolyTableInclude> = z.object({
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableArgsSchema)]).optional(),
}).strict();

export const PolyTableArgsSchema: z.ZodType<Prisma.PolyTableDefaultArgs> = z.object({
  select: z.lazy(() => PolyTableSelectSchema).optional(),
  include: z.lazy(() => PolyTableIncludeSchema).optional(),
}).strict();

export const PolyTableSelectSchema: z.ZodType<Prisma.PolyTableSelect> = z.object({
  polyId: z.boolean().optional(),
  parentId: z.boolean().optional(),
  parentTable: z.boolean().optional(),
  projectId: z.boolean().optional(),
  randomJson: z.boolean().optional(),
  survivalRate: z.boolean().optional(),
  liabilityCause: z.boolean().optional(),
  ratePerTree: z.boolean().optional(),
  motivation: z.boolean().optional(),
  restorationType: z.boolean().optional(),
  reviews: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  editedBy: z.boolean().optional(),
  deleted: z.boolean().optional(),
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableArgsSchema)]).optional(),
}).strict()

// STAKEHOLDER TABLE
//------------------------------------------------------

export const StakeholderTableIncludeSchema: z.ZodType<Prisma.StakeholderTableInclude> = z.object({
  OrganizationLocalTable: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableArgsSchema)]).optional(),
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableArgsSchema)]).optional(),
}).strict();

export const StakeholderTableArgsSchema: z.ZodType<Prisma.StakeholderTableDefaultArgs> = z.object({
  select: z.lazy(() => StakeholderTableSelectSchema).optional(),
  include: z.lazy(() => StakeholderTableIncludeSchema).optional(),
}).strict();

export const StakeholderTableSelectSchema: z.ZodType<Prisma.StakeholderTableSelect> = z.object({
  stakeholderId: z.boolean().optional(),
  organizationLocalId: z.boolean().optional(),
  parentId: z.boolean().optional(),
  parentTable: z.boolean().optional(),
  projectId: z.boolean().optional(),
  stakeholderType: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  OrganizationLocalTable: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableArgsSchema)]).optional(),
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableArgsSchema)]).optional(),
}).strict()

// SOURCE TABLE
//------------------------------------------------------

export const SourceTableIncludeSchema: z.ZodType<Prisma.SourceTableInclude> = z.object({
  ClaimTable: z.union([z.boolean(),z.lazy(() => ClaimTableFindManyArgsSchema)]).optional(),
  CropTable: z.union([z.boolean(),z.lazy(() => CropTableFindManyArgsSchema)]).optional(),
  LandTable: z.union([z.boolean(),z.lazy(() => LandTableFindManyArgsSchema)]).optional(),
  OrganizationLocalTable: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableFindManyArgsSchema)]).optional(),
  PlantingTable: z.union([z.boolean(),z.lazy(() => PlantingTableFindManyArgsSchema)]).optional(),
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SourceTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const SourceTableArgsSchema: z.ZodType<Prisma.SourceTableDefaultArgs> = z.object({
  select: z.lazy(() => SourceTableSelectSchema).optional(),
  include: z.lazy(() => SourceTableIncludeSchema).optional(),
}).strict();

export const SourceTableCountOutputTypeArgsSchema: z.ZodType<Prisma.SourceTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => SourceTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const SourceTableCountOutputTypeSelectSchema: z.ZodType<Prisma.SourceTableCountOutputTypeSelect> = z.object({
  ClaimTable: z.boolean().optional(),
  CropTable: z.boolean().optional(),
  LandTable: z.boolean().optional(),
  OrganizationLocalTable: z.boolean().optional(),
  PlantingTable: z.boolean().optional(),
  ProjectTable: z.boolean().optional(),
}).strict();

export const SourceTableSelectSchema: z.ZodType<Prisma.SourceTableSelect> = z.object({
  sourceId: z.boolean().optional(),
  url: z.boolean().optional(),
  urlType: z.boolean().optional(),
  parentId: z.boolean().optional(),
  parentTable: z.boolean().optional(),
  projectId: z.boolean().optional(),
  disclosureType: z.boolean().optional(),
  sourceDescription: z.boolean().optional(),
  sourceCredit: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  ClaimTable: z.union([z.boolean(),z.lazy(() => ClaimTableFindManyArgsSchema)]).optional(),
  CropTable: z.union([z.boolean(),z.lazy(() => CropTableFindManyArgsSchema)]).optional(),
  LandTable: z.union([z.boolean(),z.lazy(() => LandTableFindManyArgsSchema)]).optional(),
  OrganizationLocalTable: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableFindManyArgsSchema)]).optional(),
  PlantingTable: z.union([z.boolean(),z.lazy(() => PlantingTableFindManyArgsSchema)]).optional(),
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SourceTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// CLAIM TABLE
//------------------------------------------------------

export const ClaimTableIncludeSchema: z.ZodType<Prisma.ClaimTableInclude> = z.object({
  OrganizationLocalTable: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableArgsSchema)]).optional(),
  SourceTable: z.union([z.boolean(),z.lazy(() => SourceTableArgsSchema)]).optional(),
}).strict();

export const ClaimTableArgsSchema: z.ZodType<Prisma.ClaimTableDefaultArgs> = z.object({
  select: z.lazy(() => ClaimTableSelectSchema).optional(),
  include: z.lazy(() => ClaimTableIncludeSchema).optional(),
}).strict();

export const ClaimTableSelectSchema: z.ZodType<Prisma.ClaimTableSelect> = z.object({
  claimId: z.boolean().optional(),
  claimCount: z.boolean().optional(),
  organizationLocalId: z.boolean().optional(),
  sourceId: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  deleted: z.boolean().optional(),
  editedBy: z.boolean().optional(),
  OrganizationLocalTable: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableArgsSchema)]).optional(),
  SourceTable: z.union([z.boolean(),z.lazy(() => SourceTableArgsSchema)]).optional(),
}).strict()

// ORGANIZATION LOCAL TABLE
//------------------------------------------------------

export const OrganizationLocalTableIncludeSchema: z.ZodType<Prisma.OrganizationLocalTableInclude> = z.object({
  ClaimTable: z.union([z.boolean(),z.lazy(() => ClaimTableFindManyArgsSchema)]).optional(),
  OrganizationMasterTable: z.union([z.boolean(),z.lazy(() => OrganizationMasterTableArgsSchema)]).optional(),
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableFindManyArgsSchema)]).optional(),
  StakeholderTable: z.union([z.boolean(),z.lazy(() => StakeholderTableFindManyArgsSchema)]).optional(),
  SourceTable: z.union([z.boolean(),z.lazy(() => SourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const OrganizationLocalTableArgsSchema: z.ZodType<Prisma.OrganizationLocalTableDefaultArgs> = z.object({
  select: z.lazy(() => OrganizationLocalTableSelectSchema).optional(),
  include: z.lazy(() => OrganizationLocalTableIncludeSchema).optional(),
}).strict();

export const OrganizationLocalTableCountOutputTypeArgsSchema: z.ZodType<Prisma.OrganizationLocalTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => OrganizationLocalTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const OrganizationLocalTableCountOutputTypeSelectSchema: z.ZodType<Prisma.OrganizationLocalTableCountOutputTypeSelect> = z.object({
  ClaimTable: z.boolean().optional(),
  ProjectTable: z.boolean().optional(),
  StakeholderTable: z.boolean().optional(),
  SourceTable: z.boolean().optional(),
}).strict();

export const OrganizationLocalTableSelectSchema: z.ZodType<Prisma.OrganizationLocalTableSelect> = z.object({
  organizationLocalName: z.boolean().optional(),
  organizationLocalId: z.boolean().optional(),
  organizationMasterId: z.boolean().optional(),
  contactName: z.boolean().optional(),
  contactEmail: z.boolean().optional(),
  contactPhone: z.boolean().optional(),
  address: z.boolean().optional(),
  polyId: z.boolean().optional(),
  website: z.boolean().optional(),
  capacityPerYear: z.boolean().optional(),
  organizationNotes: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  editedBy: z.boolean().optional(),
  deleted: z.boolean().optional(),
  gpsLat: z.boolean().optional(),
  gpsLon: z.boolean().optional(),
  ClaimTable: z.union([z.boolean(),z.lazy(() => ClaimTableFindManyArgsSchema)]).optional(),
  OrganizationMasterTable: z.union([z.boolean(),z.lazy(() => OrganizationMasterTableArgsSchema)]).optional(),
  ProjectTable: z.union([z.boolean(),z.lazy(() => ProjectTableFindManyArgsSchema)]).optional(),
  StakeholderTable: z.union([z.boolean(),z.lazy(() => StakeholderTableFindManyArgsSchema)]).optional(),
  SourceTable: z.union([z.boolean(),z.lazy(() => SourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// ORGANIZATION MASTER TABLE
//------------------------------------------------------

export const OrganizationMasterTableIncludeSchema: z.ZodType<Prisma.OrganizationMasterTableInclude> = z.object({
  OrganizationLocalTable: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrganizationMasterTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const OrganizationMasterTableArgsSchema: z.ZodType<Prisma.OrganizationMasterTableDefaultArgs> = z.object({
  select: z.lazy(() => OrganizationMasterTableSelectSchema).optional(),
  include: z.lazy(() => OrganizationMasterTableIncludeSchema).optional(),
}).strict();

export const OrganizationMasterTableCountOutputTypeArgsSchema: z.ZodType<Prisma.OrganizationMasterTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => OrganizationMasterTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const OrganizationMasterTableCountOutputTypeSelectSchema: z.ZodType<Prisma.OrganizationMasterTableCountOutputTypeSelect> = z.object({
  OrganizationLocalTable: z.boolean().optional(),
}).strict();

export const OrganizationMasterTableSelectSchema: z.ZodType<Prisma.OrganizationMasterTableSelect> = z.object({
  organizationMasterId: z.boolean().optional(),
  organizationMasterName: z.boolean().optional(),
  contactName: z.boolean().optional(),
  contactEmail: z.boolean().optional(),
  contactPhone: z.boolean().optional(),
  address: z.boolean().optional(),
  website: z.boolean().optional(),
  capacityPerYear: z.boolean().optional(),
  organizationNotes: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  editedBy: z.boolean().optional(),
  deleted: z.boolean().optional(),
  gpsLat: z.boolean().optional(),
  gpsLon: z.boolean().optional(),
  OrganizationLocalTable: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrganizationMasterTableCountOutputTypeArgsSchema)]).optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const ProjectTableWhereInputSchema: z.ZodType<Prisma.ProjectTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ProjectTableWhereInputSchema), z.lazy(() => ProjectTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProjectTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProjectTableWhereInputSchema), z.lazy(() => ProjectTableWhereInputSchema).array() ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  platformId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  platform: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => EnumCarbonRegistryTypeNullableFilterSchema), z.lazy(() => CarbonRegistryTypeSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => EnumCarbonRegistryNullableFilterSchema), z.lazy(() => CarbonRegistrySchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectDateEnd: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  projectDateStart: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  registryId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  isPublic: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  CropTable: z.lazy(() => CropTableListRelationFilterSchema).optional(),
  LandTable: z.lazy(() => LandTableListRelationFilterSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableListRelationFilterSchema).optional(),
  PolyTable: z.lazy(() => PolyTableListRelationFilterSchema).optional(),
  OrganizationLocalTable: z.union([ z.lazy(() => OrganizationLocalTableNullableScalarRelationFilterSchema), z.lazy(() => OrganizationLocalTableWhereInputSchema) ]).optional().nullable(),
  StakeholderTable: z.lazy(() => StakeholderTableListRelationFilterSchema).optional(),
  SourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
});

export const ProjectTableOrderByWithRelationInputSchema: z.ZodType<Prisma.ProjectTableOrderByWithRelationInput> = z.strictObject({
  projectId: z.lazy(() => SortOrderSchema).optional(),
  projectName: z.lazy(() => SortOrderSchema).optional(),
  url: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  platformId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  platform: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  carbonRegistry: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  employmentClaim: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  employmentClaimDescription: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectDateEnd: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectDateStart: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  registryId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  isPublic: z.lazy(() => SortOrderSchema).optional(),
  CropTable: z.lazy(() => CropTableOrderByRelationAggregateInputSchema).optional(),
  LandTable: z.lazy(() => LandTableOrderByRelationAggregateInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableOrderByRelationAggregateInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableOrderByRelationAggregateInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableOrderByWithRelationInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableOrderByRelationAggregateInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableOrderByRelationAggregateInputSchema).optional(),
});

export const ProjectTableWhereUniqueInputSchema: z.ZodType<Prisma.ProjectTableWhereUniqueInput> = z.object({
  projectId: z.string(),
})
.and(z.strictObject({
  projectId: z.string().optional(),
  AND: z.union([ z.lazy(() => ProjectTableWhereInputSchema), z.lazy(() => ProjectTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProjectTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProjectTableWhereInputSchema), z.lazy(() => ProjectTableWhereInputSchema).array() ]).optional(),
  projectName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  platformId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  platform: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => EnumCarbonRegistryTypeNullableFilterSchema), z.lazy(() => CarbonRegistryTypeSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => EnumCarbonRegistryNullableFilterSchema), z.lazy(() => CarbonRegistrySchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectDateEnd: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  projectDateStart: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  registryId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  isPublic: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  CropTable: z.lazy(() => CropTableListRelationFilterSchema).optional(),
  LandTable: z.lazy(() => LandTableListRelationFilterSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableListRelationFilterSchema).optional(),
  PolyTable: z.lazy(() => PolyTableListRelationFilterSchema).optional(),
  OrganizationLocalTable: z.union([ z.lazy(() => OrganizationLocalTableNullableScalarRelationFilterSchema), z.lazy(() => OrganizationLocalTableWhereInputSchema) ]).optional().nullable(),
  StakeholderTable: z.lazy(() => StakeholderTableListRelationFilterSchema).optional(),
  SourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
}));

export const ProjectTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.ProjectTableOrderByWithAggregationInput> = z.strictObject({
  projectId: z.lazy(() => SortOrderSchema).optional(),
  projectName: z.lazy(() => SortOrderSchema).optional(),
  url: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  platformId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  platform: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  carbonRegistry: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  employmentClaim: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  employmentClaimDescription: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectDateEnd: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectDateStart: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  registryId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  isPublic: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ProjectTableCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => ProjectTableAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ProjectTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ProjectTableMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => ProjectTableSumOrderByAggregateInputSchema).optional(),
});

export const ProjectTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ProjectTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ProjectTableScalarWhereWithAggregatesInputSchema), z.lazy(() => ProjectTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProjectTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProjectTableScalarWhereWithAggregatesInputSchema), z.lazy(() => ProjectTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  projectId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  projectName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  platformId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  platform: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  projectNotes: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableWithAggregatesFilterSchema), z.boolean() ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => EnumCarbonRegistryTypeNullableWithAggregatesFilterSchema), z.lazy(() => CarbonRegistryTypeSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => EnumCarbonRegistryNullableWithAggregatesFilterSchema), z.lazy(() => CarbonRegistrySchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  projectDateEnd: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  projectDateStart: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  registryId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  isPublic: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
});

export const LandTableWhereInputSchema: z.ZodType<Prisma.LandTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => LandTableWhereInputSchema), z.lazy(() => LandTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => LandTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LandTableWhereInputSchema), z.lazy(() => LandTableWhereInputSchema).array() ]).optional(),
  landId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  hectares: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  landNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => EnumTreatmentTypeNullableFilterSchema), z.lazy(() => TreatmentTypeSchema) ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  preparation: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  ProjectTable: z.union([ z.lazy(() => ProjectTableScalarRelationFilterSchema), z.lazy(() => ProjectTableWhereInputSchema) ]).optional(),
  PolygonTable: z.lazy(() => PolygonTableListRelationFilterSchema).optional(),
  SourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
});

export const LandTableOrderByWithRelationInputSchema: z.ZodType<Prisma.LandTableOrderByWithRelationInput> = z.strictObject({
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  hectares: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  gpsLat: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  gpsLon: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  landNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  treatmentType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  preparation: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  ProjectTable: z.lazy(() => ProjectTableOrderByWithRelationInputSchema).optional(),
  PolygonTable: z.lazy(() => PolygonTableOrderByRelationAggregateInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableOrderByRelationAggregateInputSchema).optional(),
});

export const LandTableWhereUniqueInputSchema: z.ZodType<Prisma.LandTableWhereUniqueInput> = z.object({
  landId: z.string(),
})
.and(z.strictObject({
  landId: z.string().optional(),
  AND: z.union([ z.lazy(() => LandTableWhereInputSchema), z.lazy(() => LandTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => LandTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LandTableWhereInputSchema), z.lazy(() => LandTableWhereInputSchema).array() ]).optional(),
  landName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  hectares: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  landNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => EnumTreatmentTypeNullableFilterSchema), z.lazy(() => TreatmentTypeSchema) ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  preparation: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  ProjectTable: z.union([ z.lazy(() => ProjectTableScalarRelationFilterSchema), z.lazy(() => ProjectTableWhereInputSchema) ]).optional(),
  PolygonTable: z.lazy(() => PolygonTableListRelationFilterSchema).optional(),
  SourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
}));

export const LandTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.LandTableOrderByWithAggregationInput> = z.strictObject({
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  hectares: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  gpsLat: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  gpsLon: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  landNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  treatmentType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  preparation: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => LandTableCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => LandTableAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => LandTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => LandTableMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => LandTableSumOrderByAggregateInputSchema).optional(),
});

export const LandTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.LandTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => LandTableScalarWhereWithAggregatesInputSchema), z.lazy(() => LandTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => LandTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LandTableScalarWhereWithAggregatesInputSchema), z.lazy(() => LandTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  landId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  projectId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  hectares: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  landNotes: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => EnumTreatmentTypeNullableWithAggregatesFilterSchema), z.lazy(() => TreatmentTypeSchema) ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableWithAggregatesFilterSchema), z.boolean() ]).optional().nullable(),
  preparation: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const CropTableWhereInputSchema: z.ZodType<Prisma.CropTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CropTableWhereInputSchema), z.lazy(() => CropTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CropTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CropTableWhereInputSchema), z.lazy(() => CropTableWhereInputSchema).array() ]).optional(),
  cropId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  cropName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  speciesLocalName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  speciesId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  seedInfo: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  cropStock: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  organizationLocalName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  cropNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  ProjectTable: z.union([ z.lazy(() => ProjectTableNullableScalarRelationFilterSchema), z.lazy(() => ProjectTableWhereInputSchema) ]).optional().nullable(),
  SourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableListRelationFilterSchema).optional(),
});

export const CropTableOrderByWithRelationInputSchema: z.ZodType<Prisma.CropTableOrderByWithRelationInput> = z.strictObject({
  cropId: z.lazy(() => SortOrderSchema).optional(),
  cropName: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  speciesLocalName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  speciesId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  seedInfo: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  cropStock: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  organizationLocalName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  cropNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  ProjectTable: z.lazy(() => ProjectTableOrderByWithRelationInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableOrderByRelationAggregateInputSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableOrderByRelationAggregateInputSchema).optional(),
});

export const CropTableWhereUniqueInputSchema: z.ZodType<Prisma.CropTableWhereUniqueInput> = z.union([
  z.object({
    cropId: z.string(),
    projectId_cropName: z.lazy(() => CropTableProjectIdCropNameCompoundUniqueInputSchema),
  }),
  z.object({
    cropId: z.string(),
  }),
  z.object({
    projectId_cropName: z.lazy(() => CropTableProjectIdCropNameCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  cropId: z.string().optional(),
  projectId_cropName: z.lazy(() => CropTableProjectIdCropNameCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => CropTableWhereInputSchema), z.lazy(() => CropTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CropTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CropTableWhereInputSchema), z.lazy(() => CropTableWhereInputSchema).array() ]).optional(),
  cropName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  speciesLocalName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  speciesId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  seedInfo: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  cropStock: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  organizationLocalName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  cropNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  ProjectTable: z.union([ z.lazy(() => ProjectTableNullableScalarRelationFilterSchema), z.lazy(() => ProjectTableWhereInputSchema) ]).optional().nullable(),
  SourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableListRelationFilterSchema).optional(),
}));

export const CropTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.CropTableOrderByWithAggregationInput> = z.strictObject({
  cropId: z.lazy(() => SortOrderSchema).optional(),
  cropName: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  speciesLocalName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  speciesId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  seedInfo: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  cropStock: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  organizationLocalName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  cropNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => CropTableCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => CropTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => CropTableMinOrderByAggregateInputSchema).optional(),
});

export const CropTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CropTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CropTableScalarWhereWithAggregatesInputSchema), z.lazy(() => CropTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => CropTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CropTableScalarWhereWithAggregatesInputSchema), z.lazy(() => CropTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  cropId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  cropName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  projectId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  speciesLocalName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  speciesId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  seedInfo: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  cropStock: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableWithAggregatesFilterSchema), z.boolean() ]).optional().nullable(),
  organizationLocalName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  cropNotes: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const PlantingTableWhereInputSchema: z.ZodType<Prisma.PlantingTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PlantingTableWhereInputSchema), z.lazy(() => PlantingTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PlantingTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PlantingTableWhereInputSchema), z.lazy(() => PlantingTableWhereInputSchema).array() ]).optional(),
  plantingId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  planted: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  allocated: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  plantingDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  units: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => EnumUnitTypeNullableFilterSchema), z.lazy(() => UnitTypeSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  currency: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  ProjectTable: z.union([ z.lazy(() => ProjectTableScalarRelationFilterSchema), z.lazy(() => ProjectTableWhereInputSchema) ]).optional(),
  SourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
});

export const PlantingTableOrderByWithRelationInputSchema: z.ZodType<Prisma.PlantingTableOrderByWithRelationInput> = z.strictObject({
  plantingId: z.lazy(() => SortOrderSchema).optional(),
  planted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  allocated: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  plantingDate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  units: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  unitType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  pricePerUnit: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  currency: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  ProjectTable: z.lazy(() => ProjectTableOrderByWithRelationInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableOrderByRelationAggregateInputSchema).optional(),
});

export const PlantingTableWhereUniqueInputSchema: z.ZodType<Prisma.PlantingTableWhereUniqueInput> = z.object({
  plantingId: z.string(),
})
.and(z.strictObject({
  plantingId: z.string().optional(),
  AND: z.union([ z.lazy(() => PlantingTableWhereInputSchema), z.lazy(() => PlantingTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PlantingTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PlantingTableWhereInputSchema), z.lazy(() => PlantingTableWhereInputSchema).array() ]).optional(),
  planted: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  allocated: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  plantingDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  units: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => EnumUnitTypeNullableFilterSchema), z.lazy(() => UnitTypeSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  currency: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  ProjectTable: z.union([ z.lazy(() => ProjectTableScalarRelationFilterSchema), z.lazy(() => ProjectTableWhereInputSchema) ]).optional(),
  SourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
}));

export const PlantingTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.PlantingTableOrderByWithAggregationInput> = z.strictObject({
  plantingId: z.lazy(() => SortOrderSchema).optional(),
  planted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  allocated: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  plantingDate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  units: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  unitType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  pricePerUnit: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  currency: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => PlantingTableCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => PlantingTableAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PlantingTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PlantingTableMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => PlantingTableSumOrderByAggregateInputSchema).optional(),
});

export const PlantingTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PlantingTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PlantingTableScalarWhereWithAggregatesInputSchema), z.lazy(() => PlantingTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PlantingTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PlantingTableScalarWhereWithAggregatesInputSchema), z.lazy(() => PlantingTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  plantingId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  planted: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  projectId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableWithAggregatesFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  allocated: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  plantingDate: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableWithAggregatesFilterSchema), z.boolean() ]).optional().nullable(),
  units: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => EnumUnitTypeNullableWithAggregatesFilterSchema), z.lazy(() => UnitTypeSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  currency: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const SpeciesTableWhereInputSchema: z.ZodType<Prisma.SpeciesTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SpeciesTableWhereInputSchema), z.lazy(() => SpeciesTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SpeciesTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SpeciesTableWhereInputSchema), z.lazy(() => SpeciesTableWhereInputSchema).array() ]).optional(),
  speciesName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  commonName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  scientificName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  family: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  reference: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  CropTable: z.lazy(() => CropTableListRelationFilterSchema).optional(),
});

export const SpeciesTableOrderByWithRelationInputSchema: z.ZodType<Prisma.SpeciesTableOrderByWithRelationInput> = z.strictObject({
  speciesName: z.lazy(() => SortOrderSchema).optional(),
  commonName: z.lazy(() => SortOrderSchema).optional(),
  scientificName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  family: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  reference: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableOrderByRelationAggregateInputSchema).optional(),
});

export const SpeciesTableWhereUniqueInputSchema: z.ZodType<Prisma.SpeciesTableWhereUniqueInput> = z.object({
  speciesName: z.string(),
})
.and(z.strictObject({
  speciesName: z.string().optional(),
  AND: z.union([ z.lazy(() => SpeciesTableWhereInputSchema), z.lazy(() => SpeciesTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SpeciesTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SpeciesTableWhereInputSchema), z.lazy(() => SpeciesTableWhereInputSchema).array() ]).optional(),
  commonName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  scientificName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  family: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  reference: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  CropTable: z.lazy(() => CropTableListRelationFilterSchema).optional(),
}));

export const SpeciesTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.SpeciesTableOrderByWithAggregationInput> = z.strictObject({
  speciesName: z.lazy(() => SortOrderSchema).optional(),
  commonName: z.lazy(() => SortOrderSchema).optional(),
  scientificName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  family: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  reference: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => SpeciesTableCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SpeciesTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SpeciesTableMinOrderByAggregateInputSchema).optional(),
});

export const SpeciesTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SpeciesTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SpeciesTableScalarWhereWithAggregatesInputSchema), z.lazy(() => SpeciesTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SpeciesTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SpeciesTableScalarWhereWithAggregatesInputSchema), z.lazy(() => SpeciesTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  speciesName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  commonName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  scientificName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  family: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  reference: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableWithAggregatesFilterSchema), z.boolean() ]).optional().nullable(),
});

export const PolygonTableWhereInputSchema: z.ZodType<Prisma.PolygonTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PolygonTableWhereInputSchema), z.lazy(() => PolygonTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PolygonTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PolygonTableWhereInputSchema), z.lazy(() => PolygonTableWhereInputSchema).array() ]).optional(),
  polygonId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  geometry: z.lazy(() => JsonNullableFilterSchema).optional(),
  polygonNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  LandTable: z.union([ z.lazy(() => LandTableScalarRelationFilterSchema), z.lazy(() => LandTableWhereInputSchema) ]).optional(),
});

export const PolygonTableOrderByWithRelationInputSchema: z.ZodType<Prisma.PolygonTableOrderByWithRelationInput> = z.strictObject({
  polygonId: z.lazy(() => SortOrderSchema).optional(),
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  geometry: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  polygonNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  LandTable: z.lazy(() => LandTableOrderByWithRelationInputSchema).optional(),
});

export const PolygonTableWhereUniqueInputSchema: z.ZodType<Prisma.PolygonTableWhereUniqueInput> = z.object({
  polygonId: z.string(),
})
.and(z.strictObject({
  polygonId: z.string().optional(),
  AND: z.union([ z.lazy(() => PolygonTableWhereInputSchema), z.lazy(() => PolygonTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PolygonTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PolygonTableWhereInputSchema), z.lazy(() => PolygonTableWhereInputSchema).array() ]).optional(),
  landId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  geometry: z.lazy(() => JsonNullableFilterSchema).optional(),
  polygonNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  LandTable: z.union([ z.lazy(() => LandTableScalarRelationFilterSchema), z.lazy(() => LandTableWhereInputSchema) ]).optional(),
}));

export const PolygonTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.PolygonTableOrderByWithAggregationInput> = z.strictObject({
  polygonId: z.lazy(() => SortOrderSchema).optional(),
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  geometry: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  polygonNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => PolygonTableCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PolygonTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PolygonTableMinOrderByAggregateInputSchema).optional(),
});

export const PolygonTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PolygonTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PolygonTableScalarWhereWithAggregatesInputSchema), z.lazy(() => PolygonTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PolygonTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PolygonTableScalarWhereWithAggregatesInputSchema), z.lazy(() => PolygonTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  polygonId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  landId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  geometry: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  polygonNotes: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const PolyTableWhereInputSchema: z.ZodType<Prisma.PolyTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PolyTableWhereInputSchema), z.lazy(() => PolyTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PolyTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PolyTableWhereInputSchema), z.lazy(() => PolyTableWhereInputSchema).array() ]).optional(),
  polyId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  randomJson: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  survivalRate: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  liabilityCause: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  ratePerTree: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  motivation: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  restorationType: z.union([ z.lazy(() => EnumRestorationTypeNullableFilterSchema), z.lazy(() => RestorationTypeSchema) ]).optional().nullable(),
  reviews: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  ProjectTable: z.union([ z.lazy(() => ProjectTableScalarRelationFilterSchema), z.lazy(() => ProjectTableWhereInputSchema) ]).optional(),
});

export const PolyTableOrderByWithRelationInputSchema: z.ZodType<Prisma.PolyTableOrderByWithRelationInput> = z.strictObject({
  polyId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  randomJson: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  survivalRate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  liabilityCause: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  ratePerTree: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  motivation: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  restorationType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  reviews: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  ProjectTable: z.lazy(() => ProjectTableOrderByWithRelationInputSchema).optional(),
});

export const PolyTableWhereUniqueInputSchema: z.ZodType<Prisma.PolyTableWhereUniqueInput> = z.object({
  polyId: z.string(),
})
.and(z.strictObject({
  polyId: z.string().optional(),
  AND: z.union([ z.lazy(() => PolyTableWhereInputSchema), z.lazy(() => PolyTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PolyTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PolyTableWhereInputSchema), z.lazy(() => PolyTableWhereInputSchema).array() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  randomJson: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  survivalRate: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  liabilityCause: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  ratePerTree: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  motivation: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  restorationType: z.union([ z.lazy(() => EnumRestorationTypeNullableFilterSchema), z.lazy(() => RestorationTypeSchema) ]).optional().nullable(),
  reviews: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  ProjectTable: z.union([ z.lazy(() => ProjectTableScalarRelationFilterSchema), z.lazy(() => ProjectTableWhereInputSchema) ]).optional(),
}));

export const PolyTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.PolyTableOrderByWithAggregationInput> = z.strictObject({
  polyId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  randomJson: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  survivalRate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  liabilityCause: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  ratePerTree: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  motivation: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  restorationType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  reviews: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => PolyTableCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => PolyTableAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PolyTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PolyTableMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => PolyTableSumOrderByAggregateInputSchema).optional(),
});

export const PolyTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PolyTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PolyTableScalarWhereWithAggregatesInputSchema), z.lazy(() => PolyTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PolyTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PolyTableScalarWhereWithAggregatesInputSchema), z.lazy(() => PolyTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  polyId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableWithAggregatesFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  randomJson: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  survivalRate: z.union([ z.lazy(() => FloatNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  liabilityCause: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  ratePerTree: z.union([ z.lazy(() => FloatNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  motivation: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  restorationType: z.union([ z.lazy(() => EnumRestorationTypeNullableWithAggregatesFilterSchema), z.lazy(() => RestorationTypeSchema) ]).optional().nullable(),
  reviews: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableWithAggregatesFilterSchema), z.boolean() ]).optional().nullable(),
});

export const StakeholderTableWhereInputSchema: z.ZodType<Prisma.StakeholderTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => StakeholderTableWhereInputSchema), z.lazy(() => StakeholderTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => StakeholderTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StakeholderTableWhereInputSchema), z.lazy(() => StakeholderTableWhereInputSchema).array() ]).optional(),
  stakeholderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => EnumStakeholderTypeNullableFilterSchema), z.lazy(() => StakeholderTypeSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  OrganizationLocalTable: z.union([ z.lazy(() => OrganizationLocalTableScalarRelationFilterSchema), z.lazy(() => OrganizationLocalTableWhereInputSchema) ]).optional(),
  ProjectTable: z.union([ z.lazy(() => ProjectTableNullableScalarRelationFilterSchema), z.lazy(() => ProjectTableWhereInputSchema) ]).optional().nullable(),
});

export const StakeholderTableOrderByWithRelationInputSchema: z.ZodType<Prisma.StakeholderTableOrderByWithRelationInput> = z.strictObject({
  stakeholderId: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableOrderByWithRelationInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableOrderByWithRelationInputSchema).optional(),
});

export const StakeholderTableWhereUniqueInputSchema: z.ZodType<Prisma.StakeholderTableWhereUniqueInput> = z.object({
  stakeholderId: z.string(),
})
.and(z.strictObject({
  stakeholderId: z.string().optional(),
  AND: z.union([ z.lazy(() => StakeholderTableWhereInputSchema), z.lazy(() => StakeholderTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => StakeholderTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StakeholderTableWhereInputSchema), z.lazy(() => StakeholderTableWhereInputSchema).array() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => EnumStakeholderTypeNullableFilterSchema), z.lazy(() => StakeholderTypeSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  OrganizationLocalTable: z.union([ z.lazy(() => OrganizationLocalTableScalarRelationFilterSchema), z.lazy(() => OrganizationLocalTableWhereInputSchema) ]).optional(),
  ProjectTable: z.union([ z.lazy(() => ProjectTableNullableScalarRelationFilterSchema), z.lazy(() => ProjectTableWhereInputSchema) ]).optional().nullable(),
}));

export const StakeholderTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.StakeholderTableOrderByWithAggregationInput> = z.strictObject({
  stakeholderId: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => StakeholderTableCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => StakeholderTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => StakeholderTableMinOrderByAggregateInputSchema).optional(),
});

export const StakeholderTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.StakeholderTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => StakeholderTableScalarWhereWithAggregatesInputSchema), z.lazy(() => StakeholderTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => StakeholderTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StakeholderTableScalarWhereWithAggregatesInputSchema), z.lazy(() => StakeholderTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  stakeholderId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableWithAggregatesFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => EnumStakeholderTypeNullableWithAggregatesFilterSchema), z.lazy(() => StakeholderTypeSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const SourceTableWhereInputSchema: z.ZodType<Prisma.SourceTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SourceTableWhereInputSchema), z.lazy(() => SourceTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SourceTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SourceTableWhereInputSchema), z.lazy(() => SourceTableWhereInputSchema).array() ]).optional(),
  sourceId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  urlType: z.union([ z.lazy(() => EnumUrlTypeNullableFilterSchema), z.lazy(() => UrlTypeSchema) ]).optional().nullable(),
  parentId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => EnumParentTableNullableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional().nullable(),
  projectId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => EnumDisclosureTypeNullableFilterSchema), z.lazy(() => DisclosureTypeSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  sourceCredit: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableListRelationFilterSchema).optional(),
  CropTable: z.lazy(() => CropTableListRelationFilterSchema).optional(),
  LandTable: z.lazy(() => LandTableListRelationFilterSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableListRelationFilterSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableListRelationFilterSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableListRelationFilterSchema).optional(),
});

export const SourceTableOrderByWithRelationInputSchema: z.ZodType<Prisma.SourceTableOrderByWithRelationInput> = z.strictObject({
  sourceId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  urlType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  parentId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  disclosureType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sourceDescription: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sourceCredit: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  ClaimTable: z.lazy(() => ClaimTableOrderByRelationAggregateInputSchema).optional(),
  CropTable: z.lazy(() => CropTableOrderByRelationAggregateInputSchema).optional(),
  LandTable: z.lazy(() => LandTableOrderByRelationAggregateInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableOrderByRelationAggregateInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableOrderByRelationAggregateInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableOrderByRelationAggregateInputSchema).optional(),
});

export const SourceTableWhereUniqueInputSchema: z.ZodType<Prisma.SourceTableWhereUniqueInput> = z.object({
  sourceId: z.string(),
})
.and(z.strictObject({
  sourceId: z.string().optional(),
  AND: z.union([ z.lazy(() => SourceTableWhereInputSchema), z.lazy(() => SourceTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SourceTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SourceTableWhereInputSchema), z.lazy(() => SourceTableWhereInputSchema).array() ]).optional(),
  url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  urlType: z.union([ z.lazy(() => EnumUrlTypeNullableFilterSchema), z.lazy(() => UrlTypeSchema) ]).optional().nullable(),
  parentId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => EnumParentTableNullableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional().nullable(),
  projectId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => EnumDisclosureTypeNullableFilterSchema), z.lazy(() => DisclosureTypeSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  sourceCredit: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableListRelationFilterSchema).optional(),
  CropTable: z.lazy(() => CropTableListRelationFilterSchema).optional(),
  LandTable: z.lazy(() => LandTableListRelationFilterSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableListRelationFilterSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableListRelationFilterSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableListRelationFilterSchema).optional(),
}));

export const SourceTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.SourceTableOrderByWithAggregationInput> = z.strictObject({
  sourceId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  urlType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  parentId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  disclosureType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sourceDescription: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sourceCredit: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => SourceTableCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SourceTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SourceTableMinOrderByAggregateInputSchema).optional(),
});

export const SourceTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SourceTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SourceTableScalarWhereWithAggregatesInputSchema), z.lazy(() => SourceTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SourceTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SourceTableScalarWhereWithAggregatesInputSchema), z.lazy(() => SourceTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  sourceId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  urlType: z.union([ z.lazy(() => EnumUrlTypeNullableWithAggregatesFilterSchema), z.lazy(() => UrlTypeSchema) ]).optional().nullable(),
  parentId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => EnumParentTableNullableWithAggregatesFilterSchema), z.lazy(() => ParentTableSchema) ]).optional().nullable(),
  projectId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => EnumDisclosureTypeNullableWithAggregatesFilterSchema), z.lazy(() => DisclosureTypeSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  sourceCredit: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const ClaimTableWhereInputSchema: z.ZodType<Prisma.ClaimTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ClaimTableWhereInputSchema), z.lazy(() => ClaimTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ClaimTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ClaimTableWhereInputSchema), z.lazy(() => ClaimTableWhereInputSchema).array() ]).optional(),
  claimId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  claimCount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sourceId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  OrganizationLocalTable: z.union([ z.lazy(() => OrganizationLocalTableScalarRelationFilterSchema), z.lazy(() => OrganizationLocalTableWhereInputSchema) ]).optional(),
  SourceTable: z.union([ z.lazy(() => SourceTableScalarRelationFilterSchema), z.lazy(() => SourceTableWhereInputSchema) ]).optional(),
});

export const ClaimTableOrderByWithRelationInputSchema: z.ZodType<Prisma.ClaimTableOrderByWithRelationInput> = z.strictObject({
  claimId: z.lazy(() => SortOrderSchema).optional(),
  claimCount: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  sourceId: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableOrderByWithRelationInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableOrderByWithRelationInputSchema).optional(),
});

export const ClaimTableWhereUniqueInputSchema: z.ZodType<Prisma.ClaimTableWhereUniqueInput> = z.object({
  claimId: z.string(),
})
.and(z.strictObject({
  claimId: z.string().optional(),
  AND: z.union([ z.lazy(() => ClaimTableWhereInputSchema), z.lazy(() => ClaimTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ClaimTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ClaimTableWhereInputSchema), z.lazy(() => ClaimTableWhereInputSchema).array() ]).optional(),
  claimCount: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sourceId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  OrganizationLocalTable: z.union([ z.lazy(() => OrganizationLocalTableScalarRelationFilterSchema), z.lazy(() => OrganizationLocalTableWhereInputSchema) ]).optional(),
  SourceTable: z.union([ z.lazy(() => SourceTableScalarRelationFilterSchema), z.lazy(() => SourceTableWhereInputSchema) ]).optional(),
}));

export const ClaimTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.ClaimTableOrderByWithAggregationInput> = z.strictObject({
  claimId: z.lazy(() => SortOrderSchema).optional(),
  claimCount: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  sourceId: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => ClaimTableCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => ClaimTableAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ClaimTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ClaimTableMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => ClaimTableSumOrderByAggregateInputSchema).optional(),
});

export const ClaimTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ClaimTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ClaimTableScalarWhereWithAggregatesInputSchema), z.lazy(() => ClaimTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ClaimTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ClaimTableScalarWhereWithAggregatesInputSchema), z.lazy(() => ClaimTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  claimId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  claimCount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  sourceId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableWithAggregatesFilterSchema), z.boolean() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const OrganizationLocalTableWhereInputSchema: z.ZodType<Prisma.OrganizationLocalTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OrganizationLocalTableWhereInputSchema), z.lazy(() => OrganizationLocalTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationLocalTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationLocalTableWhereInputSchema), z.lazy(() => OrganizationLocalTableWhereInputSchema).array() ]).optional(),
  organizationLocalName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  organizationMasterId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactEmail: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactPhone: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  address: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  polyId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  website: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  capacityPerYear: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  organizationNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableListRelationFilterSchema).optional(),
  OrganizationMasterTable: z.union([ z.lazy(() => OrganizationMasterTableNullableScalarRelationFilterSchema), z.lazy(() => OrganizationMasterTableWhereInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableListRelationFilterSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableListRelationFilterSchema).optional(),
  SourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
});

export const OrganizationLocalTableOrderByWithRelationInputSchema: z.ZodType<Prisma.OrganizationLocalTableOrderByWithRelationInput> = z.strictObject({
  organizationLocalName: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  contactName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  contactEmail: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  contactPhone: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  address: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  polyId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  website: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  capacityPerYear: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  organizationNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  gpsLat: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  gpsLon: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  ClaimTable: z.lazy(() => ClaimTableOrderByRelationAggregateInputSchema).optional(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableOrderByWithRelationInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableOrderByRelationAggregateInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableOrderByRelationAggregateInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableOrderByRelationAggregateInputSchema).optional(),
});

export const OrganizationLocalTableWhereUniqueInputSchema: z.ZodType<Prisma.OrganizationLocalTableWhereUniqueInput> = z.union([
  z.object({
    organizationLocalId: z.string(),
    organizationLocalName: z.string(),
  }),
  z.object({
    organizationLocalId: z.string(),
  }),
  z.object({
    organizationLocalName: z.string(),
  }),
])
.and(z.strictObject({
  organizationLocalName: z.string().optional(),
  organizationLocalId: z.string().optional(),
  AND: z.union([ z.lazy(() => OrganizationLocalTableWhereInputSchema), z.lazy(() => OrganizationLocalTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationLocalTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationLocalTableWhereInputSchema), z.lazy(() => OrganizationLocalTableWhereInputSchema).array() ]).optional(),
  organizationMasterId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactEmail: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactPhone: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  address: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  polyId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  website: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  capacityPerYear: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  organizationNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableListRelationFilterSchema).optional(),
  OrganizationMasterTable: z.union([ z.lazy(() => OrganizationMasterTableNullableScalarRelationFilterSchema), z.lazy(() => OrganizationMasterTableWhereInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableListRelationFilterSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableListRelationFilterSchema).optional(),
  SourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
}));

export const OrganizationLocalTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.OrganizationLocalTableOrderByWithAggregationInput> = z.strictObject({
  organizationLocalName: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  contactName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  contactEmail: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  contactPhone: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  address: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  polyId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  website: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  capacityPerYear: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  organizationNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  gpsLat: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  gpsLon: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => OrganizationLocalTableCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => OrganizationLocalTableAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => OrganizationLocalTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => OrganizationLocalTableMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => OrganizationLocalTableSumOrderByAggregateInputSchema).optional(),
});

export const OrganizationLocalTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.OrganizationLocalTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OrganizationLocalTableScalarWhereWithAggregatesInputSchema), z.lazy(() => OrganizationLocalTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationLocalTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationLocalTableScalarWhereWithAggregatesInputSchema), z.lazy(() => OrganizationLocalTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  organizationLocalName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  organizationMasterId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  contactName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  contactEmail: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  contactPhone: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  address: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  polyId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  website: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  capacityPerYear: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  organizationNotes: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableWithAggregatesFilterSchema), z.boolean() ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => FloatNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => FloatNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
});

export const OrganizationMasterTableWhereInputSchema: z.ZodType<Prisma.OrganizationMasterTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OrganizationMasterTableWhereInputSchema), z.lazy(() => OrganizationMasterTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationMasterTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationMasterTableWhereInputSchema), z.lazy(() => OrganizationMasterTableWhereInputSchema).array() ]).optional(),
  organizationMasterId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  organizationMasterName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  contactName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactEmail: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactPhone: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  address: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  website: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  capacityPerYear: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  organizationNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableListRelationFilterSchema).optional(),
});

export const OrganizationMasterTableOrderByWithRelationInputSchema: z.ZodType<Prisma.OrganizationMasterTableOrderByWithRelationInput> = z.strictObject({
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterName: z.lazy(() => SortOrderSchema).optional(),
  contactName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  contactEmail: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  contactPhone: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  address: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  website: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  capacityPerYear: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  organizationNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  gpsLat: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  gpsLon: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableOrderByRelationAggregateInputSchema).optional(),
});

export const OrganizationMasterTableWhereUniqueInputSchema: z.ZodType<Prisma.OrganizationMasterTableWhereUniqueInput> = z.union([
  z.object({
    organizationMasterId: z.string(),
    organizationMasterName: z.string(),
  }),
  z.object({
    organizationMasterId: z.string(),
  }),
  z.object({
    organizationMasterName: z.string(),
  }),
])
.and(z.strictObject({
  organizationMasterId: z.string().optional(),
  organizationMasterName: z.string().optional(),
  AND: z.union([ z.lazy(() => OrganizationMasterTableWhereInputSchema), z.lazy(() => OrganizationMasterTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationMasterTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationMasterTableWhereInputSchema), z.lazy(() => OrganizationMasterTableWhereInputSchema).array() ]).optional(),
  contactName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactEmail: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactPhone: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  address: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  website: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  capacityPerYear: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  organizationNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableListRelationFilterSchema).optional(),
}));

export const OrganizationMasterTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.OrganizationMasterTableOrderByWithAggregationInput> = z.strictObject({
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterName: z.lazy(() => SortOrderSchema).optional(),
  contactName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  contactEmail: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  contactPhone: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  address: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  website: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  capacityPerYear: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  organizationNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  gpsLat: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  gpsLon: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => OrganizationMasterTableCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => OrganizationMasterTableAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => OrganizationMasterTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => OrganizationMasterTableMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => OrganizationMasterTableSumOrderByAggregateInputSchema).optional(),
});

export const OrganizationMasterTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.OrganizationMasterTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OrganizationMasterTableScalarWhereWithAggregatesInputSchema), z.lazy(() => OrganizationMasterTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationMasterTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationMasterTableScalarWhereWithAggregatesInputSchema), z.lazy(() => OrganizationMasterTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  organizationMasterId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  organizationMasterName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  contactName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  contactEmail: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  contactPhone: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  address: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  website: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  capacityPerYear: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  organizationNotes: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableWithAggregatesFilterSchema), z.boolean() ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => FloatNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => FloatNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
});

export const ProjectTableCreateInputSchema: z.ZodType<Prisma.ProjectTableCreateInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableUncheckedCreateInputSchema: z.ZodType<Prisma.ProjectTableUncheckedCreateInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableUpdateInputSchema: z.ZodType<Prisma.ProjectTableUpdateInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const ProjectTableUncheckedUpdateInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const ProjectTableCreateManyInputSchema: z.ZodType<Prisma.ProjectTableCreateManyInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
});

export const ProjectTableUpdateManyMutationInputSchema: z.ZodType<Prisma.ProjectTableUpdateManyMutationInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ProjectTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateManyInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
});

export const LandTableCreateInputSchema: z.ZodType<Prisma.LandTableCreateInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedOneWithoutLandTableInputSchema),
  PolygonTable: z.lazy(() => PolygonTableCreateNestedManyWithoutLandTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const LandTableUncheckedCreateInputSchema: z.ZodType<Prisma.LandTableUncheckedCreateInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  projectId: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  PolygonTable: z.lazy(() => PolygonTableUncheckedCreateNestedManyWithoutLandTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const LandTableUpdateInputSchema: z.ZodType<Prisma.LandTableUpdateInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableUpdateOneRequiredWithoutLandTableNestedInputSchema).optional(),
  PolygonTable: z.lazy(() => PolygonTableUpdateManyWithoutLandTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const LandTableUncheckedUpdateInputSchema: z.ZodType<Prisma.LandTableUncheckedUpdateInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  PolygonTable: z.lazy(() => PolygonTableUncheckedUpdateManyWithoutLandTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const LandTableCreateManyInputSchema: z.ZodType<Prisma.LandTableCreateManyInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  projectId: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
});

export const LandTableUpdateManyMutationInputSchema: z.ZodType<Prisma.LandTableUpdateManyMutationInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const LandTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.LandTableUncheckedUpdateManyInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CropTableCreateInputSchema: z.ZodType<Prisma.CropTableCreateInput> = z.strictObject({
  cropId: z.string(),
  cropName: z.string(),
  speciesLocalName: z.string().optional().nullable(),
  speciesId: z.string().optional().nullable(),
  seedInfo: z.string().optional().nullable(),
  cropStock: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  organizationLocalName: z.string().optional().nullable(),
  cropNotes: z.string().optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedOneWithoutCropTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutCropTableInputSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const CropTableUncheckedCreateInputSchema: z.ZodType<Prisma.CropTableUncheckedCreateInput> = z.strictObject({
  cropId: z.string(),
  cropName: z.string(),
  projectId: z.string().optional().nullable(),
  speciesLocalName: z.string().optional().nullable(),
  speciesId: z.string().optional().nullable(),
  seedInfo: z.string().optional().nullable(),
  cropStock: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  organizationLocalName: z.string().optional().nullable(),
  cropNotes: z.string().optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutCropTableInputSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableUncheckedCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const CropTableUpdateInputSchema: z.ZodType<Prisma.CropTableUpdateInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableUpdateOneWithoutCropTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutCropTableNestedInputSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const CropTableUncheckedUpdateInputSchema: z.ZodType<Prisma.CropTableUncheckedUpdateInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutCropTableNestedInputSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableUncheckedUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const CropTableCreateManyInputSchema: z.ZodType<Prisma.CropTableCreateManyInput> = z.strictObject({
  cropId: z.string(),
  cropName: z.string(),
  projectId: z.string().optional().nullable(),
  speciesLocalName: z.string().optional().nullable(),
  speciesId: z.string().optional().nullable(),
  seedInfo: z.string().optional().nullable(),
  cropStock: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  organizationLocalName: z.string().optional().nullable(),
  cropNotes: z.string().optional().nullable(),
});

export const CropTableUpdateManyMutationInputSchema: z.ZodType<Prisma.CropTableUpdateManyMutationInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CropTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.CropTableUncheckedUpdateManyInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PlantingTableCreateInputSchema: z.ZodType<Prisma.PlantingTableCreateInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedOneWithoutPlantingTableInputSchema),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutPlantingTableInputSchema).optional(),
});

export const PlantingTableUncheckedCreateInputSchema: z.ZodType<Prisma.PlantingTableUncheckedCreateInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  projectId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutPlantingTableInputSchema).optional(),
});

export const PlantingTableUpdateInputSchema: z.ZodType<Prisma.PlantingTableUpdateInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableUpdateOneRequiredWithoutPlantingTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutPlantingTableNestedInputSchema).optional(),
});

export const PlantingTableUncheckedUpdateInputSchema: z.ZodType<Prisma.PlantingTableUncheckedUpdateInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutPlantingTableNestedInputSchema).optional(),
});

export const PlantingTableCreateManyInputSchema: z.ZodType<Prisma.PlantingTableCreateManyInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  projectId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
});

export const PlantingTableUpdateManyMutationInputSchema: z.ZodType<Prisma.PlantingTableUpdateManyMutationInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PlantingTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PlantingTableUncheckedUpdateManyInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SpeciesTableCreateInputSchema: z.ZodType<Prisma.SpeciesTableCreateInput> = z.strictObject({
  speciesName: z.string(),
  commonName: z.string(),
  scientificName: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  family: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutSpeciesTableInputSchema).optional(),
});

export const SpeciesTableUncheckedCreateInputSchema: z.ZodType<Prisma.SpeciesTableUncheckedCreateInput> = z.strictObject({
  speciesName: z.string(),
  commonName: z.string(),
  scientificName: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  family: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutSpeciesTableInputSchema).optional(),
});

export const SpeciesTableUpdateInputSchema: z.ZodType<Prisma.SpeciesTableUpdateInput> = z.strictObject({
  speciesName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  commonName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  scientificName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  family: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reference: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutSpeciesTableNestedInputSchema).optional(),
});

export const SpeciesTableUncheckedUpdateInputSchema: z.ZodType<Prisma.SpeciesTableUncheckedUpdateInput> = z.strictObject({
  speciesName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  commonName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  scientificName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  family: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reference: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutSpeciesTableNestedInputSchema).optional(),
});

export const SpeciesTableCreateManyInputSchema: z.ZodType<Prisma.SpeciesTableCreateManyInput> = z.strictObject({
  speciesName: z.string(),
  commonName: z.string(),
  scientificName: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  family: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
});

export const SpeciesTableUpdateManyMutationInputSchema: z.ZodType<Prisma.SpeciesTableUpdateManyMutationInput> = z.strictObject({
  speciesName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  commonName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  scientificName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  family: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reference: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SpeciesTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SpeciesTableUncheckedUpdateManyInput> = z.strictObject({
  speciesName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  commonName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  scientificName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  family: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reference: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PolygonTableCreateInputSchema: z.ZodType<Prisma.PolygonTableCreateInput> = z.strictObject({
  polygonId: z.string(),
  landName: z.string().optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  LandTable: z.lazy(() => LandTableCreateNestedOneWithoutPolygonTableInputSchema),
});

export const PolygonTableUncheckedCreateInputSchema: z.ZodType<Prisma.PolygonTableUncheckedCreateInput> = z.strictObject({
  polygonId: z.string(),
  landId: z.string(),
  landName: z.string().optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
});

export const PolygonTableUpdateInputSchema: z.ZodType<Prisma.PolygonTableUpdateInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  LandTable: z.lazy(() => LandTableUpdateOneRequiredWithoutPolygonTableNestedInputSchema).optional(),
});

export const PolygonTableUncheckedUpdateInputSchema: z.ZodType<Prisma.PolygonTableUncheckedUpdateInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PolygonTableCreateManyInputSchema: z.ZodType<Prisma.PolygonTableCreateManyInput> = z.strictObject({
  polygonId: z.string(),
  landId: z.string(),
  landName: z.string().optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
});

export const PolygonTableUpdateManyMutationInputSchema: z.ZodType<Prisma.PolygonTableUpdateManyMutationInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PolygonTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PolygonTableUncheckedUpdateManyInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PolyTableCreateInputSchema: z.ZodType<Prisma.PolyTableCreateInput> = z.strictObject({
  polyId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  randomJson: z.string().optional().nullable(),
  survivalRate: z.number().optional().nullable(),
  liabilityCause: z.string().optional().nullable(),
  ratePerTree: z.number().optional().nullable(),
  motivation: z.string().optional().nullable(),
  restorationType: z.lazy(() => RestorationTypeSchema).optional().nullable(),
  reviews: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedOneWithoutPolyTableInputSchema),
});

export const PolyTableUncheckedCreateInputSchema: z.ZodType<Prisma.PolyTableUncheckedCreateInput> = z.strictObject({
  polyId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  projectId: z.string(),
  randomJson: z.string().optional().nullable(),
  survivalRate: z.number().optional().nullable(),
  liabilityCause: z.string().optional().nullable(),
  ratePerTree: z.number().optional().nullable(),
  motivation: z.string().optional().nullable(),
  restorationType: z.lazy(() => RestorationTypeSchema).optional().nullable(),
  reviews: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
});

export const PolyTableUpdateInputSchema: z.ZodType<Prisma.PolyTableUpdateInput> = z.strictObject({
  polyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  randomJson: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  survivalRate: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  liabilityCause: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ratePerTree: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  motivation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  restorationType: z.union([ z.lazy(() => RestorationTypeSchema), z.lazy(() => NullableEnumRestorationTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviews: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableUpdateOneRequiredWithoutPolyTableNestedInputSchema).optional(),
});

export const PolyTableUncheckedUpdateInputSchema: z.ZodType<Prisma.PolyTableUncheckedUpdateInput> = z.strictObject({
  polyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  randomJson: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  survivalRate: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  liabilityCause: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ratePerTree: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  motivation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  restorationType: z.union([ z.lazy(() => RestorationTypeSchema), z.lazy(() => NullableEnumRestorationTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviews: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PolyTableCreateManyInputSchema: z.ZodType<Prisma.PolyTableCreateManyInput> = z.strictObject({
  polyId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  projectId: z.string(),
  randomJson: z.string().optional().nullable(),
  survivalRate: z.number().optional().nullable(),
  liabilityCause: z.string().optional().nullable(),
  ratePerTree: z.number().optional().nullable(),
  motivation: z.string().optional().nullable(),
  restorationType: z.lazy(() => RestorationTypeSchema).optional().nullable(),
  reviews: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
});

export const PolyTableUpdateManyMutationInputSchema: z.ZodType<Prisma.PolyTableUpdateManyMutationInput> = z.strictObject({
  polyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  randomJson: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  survivalRate: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  liabilityCause: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ratePerTree: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  motivation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  restorationType: z.union([ z.lazy(() => RestorationTypeSchema), z.lazy(() => NullableEnumRestorationTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviews: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PolyTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PolyTableUncheckedUpdateManyInput> = z.strictObject({
  polyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  randomJson: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  survivalRate: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  liabilityCause: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ratePerTree: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  motivation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  restorationType: z.union([ z.lazy(() => RestorationTypeSchema), z.lazy(() => NullableEnumRestorationTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviews: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const StakeholderTableCreateInputSchema: z.ZodType<Prisma.StakeholderTableCreateInput> = z.strictObject({
  stakeholderId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedOneWithoutStakeholderTableInputSchema),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedOneWithoutStakeholderTableInputSchema).optional(),
});

export const StakeholderTableUncheckedCreateInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedCreateInput> = z.strictObject({
  stakeholderId: z.string(),
  organizationLocalId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  projectId: z.string().optional().nullable(),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const StakeholderTableUpdateInputSchema: z.ZodType<Prisma.StakeholderTableUpdateInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateOneRequiredWithoutStakeholderTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUpdateOneWithoutStakeholderTableNestedInputSchema).optional(),
});

export const StakeholderTableUncheckedUpdateInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedUpdateInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const StakeholderTableCreateManyInputSchema: z.ZodType<Prisma.StakeholderTableCreateManyInput> = z.strictObject({
  stakeholderId: z.string(),
  organizationLocalId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  projectId: z.string().optional().nullable(),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const StakeholderTableUpdateManyMutationInputSchema: z.ZodType<Prisma.StakeholderTableUpdateManyMutationInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const StakeholderTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedUpdateManyInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SourceTableCreateInputSchema: z.ZodType<Prisma.SourceTableCreateInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableUncheckedCreateInputSchema: z.ZodType<Prisma.SourceTableUncheckedCreateInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableUpdateInputSchema: z.ZodType<Prisma.SourceTableUpdateInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableUncheckedUpdateInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableCreateManyInputSchema: z.ZodType<Prisma.SourceTableCreateManyInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const SourceTableUpdateManyMutationInputSchema: z.ZodType<Prisma.SourceTableUpdateManyMutationInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SourceTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateManyInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ClaimTableCreateInputSchema: z.ZodType<Prisma.ClaimTableCreateInput> = z.strictObject({
  claimId: z.string(),
  claimCount: z.number().int(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedOneWithoutClaimTableInputSchema),
  SourceTable: z.lazy(() => SourceTableCreateNestedOneWithoutClaimTableInputSchema),
});

export const ClaimTableUncheckedCreateInputSchema: z.ZodType<Prisma.ClaimTableUncheckedCreateInput> = z.strictObject({
  claimId: z.string(),
  claimCount: z.number().int(),
  organizationLocalId: z.string(),
  sourceId: z.string(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  editedBy: z.string().optional().nullable(),
});

export const ClaimTableUpdateInputSchema: z.ZodType<Prisma.ClaimTableUpdateInput> = z.strictObject({
  claimId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  claimCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateOneRequiredWithoutClaimTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateOneRequiredWithoutClaimTableNestedInputSchema).optional(),
});

export const ClaimTableUncheckedUpdateInputSchema: z.ZodType<Prisma.ClaimTableUncheckedUpdateInput> = z.strictObject({
  claimId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  claimCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ClaimTableCreateManyInputSchema: z.ZodType<Prisma.ClaimTableCreateManyInput> = z.strictObject({
  claimId: z.string(),
  claimCount: z.number().int(),
  organizationLocalId: z.string(),
  sourceId: z.string(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  editedBy: z.string().optional().nullable(),
});

export const ClaimTableUpdateManyMutationInputSchema: z.ZodType<Prisma.ClaimTableUpdateManyMutationInput> = z.strictObject({
  claimId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  claimCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ClaimTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ClaimTableUncheckedUpdateManyInput> = z.strictObject({
  claimId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  claimCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const OrganizationLocalTableCreateInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedCreateInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedCreateInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  organizationMasterId: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const OrganizationLocalTableUpdateInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedUpdateInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedUpdateInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const OrganizationLocalTableCreateManyInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateManyInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  organizationMasterId: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
});

export const OrganizationLocalTableUpdateManyMutationInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateManyMutationInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const OrganizationLocalTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedUpdateManyInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const OrganizationMasterTableCreateInputSchema: z.ZodType<Prisma.OrganizationMasterTableCreateInput> = z.strictObject({
  organizationMasterId: z.string(),
  organizationMasterName: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedManyWithoutOrganizationMasterTableInputSchema).optional(),
});

export const OrganizationMasterTableUncheckedCreateInputSchema: z.ZodType<Prisma.OrganizationMasterTableUncheckedCreateInput> = z.strictObject({
  organizationMasterId: z.string(),
  organizationMasterName: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedCreateNestedManyWithoutOrganizationMasterTableInputSchema).optional(),
});

export const OrganizationMasterTableUpdateInputSchema: z.ZodType<Prisma.OrganizationMasterTableUpdateInput> = z.strictObject({
  organizationMasterId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateManyWithoutOrganizationMasterTableNestedInputSchema).optional(),
});

export const OrganizationMasterTableUncheckedUpdateInputSchema: z.ZodType<Prisma.OrganizationMasterTableUncheckedUpdateInput> = z.strictObject({
  organizationMasterId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedUpdateManyWithoutOrganizationMasterTableNestedInputSchema).optional(),
});

export const OrganizationMasterTableCreateManyInputSchema: z.ZodType<Prisma.OrganizationMasterTableCreateManyInput> = z.strictObject({
  organizationMasterId: z.string(),
  organizationMasterName: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
});

export const OrganizationMasterTableUpdateManyMutationInputSchema: z.ZodType<Prisma.OrganizationMasterTableUpdateManyMutationInput> = z.strictObject({
  organizationMasterId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const OrganizationMasterTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.OrganizationMasterTableUncheckedUpdateManyInput> = z.strictObject({
  organizationMasterId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const BoolNullableFilterSchema: z.ZodType<Prisma.BoolNullableFilter> = z.strictObject({
  equals: z.boolean().optional().nullable(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolNullableFilterSchema) ]).optional().nullable(),
});

export const EnumCarbonRegistryTypeNullableFilterSchema: z.ZodType<Prisma.EnumCarbonRegistryTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  in: z.lazy(() => CarbonRegistryTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => CarbonRegistryTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NestedEnumCarbonRegistryTypeNullableFilterSchema) ]).optional().nullable(),
});

export const EnumCarbonRegistryNullableFilterSchema: z.ZodType<Prisma.EnumCarbonRegistryNullableFilter> = z.strictObject({
  equals: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  in: z.lazy(() => CarbonRegistrySchema).array().optional().nullable(),
  notIn: z.lazy(() => CarbonRegistrySchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NestedEnumCarbonRegistryNullableFilterSchema) ]).optional().nullable(),
});

export const IntNullableFilterSchema: z.ZodType<Prisma.IntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const CropTableListRelationFilterSchema: z.ZodType<Prisma.CropTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => CropTableWhereInputSchema).optional(),
  some: z.lazy(() => CropTableWhereInputSchema).optional(),
  none: z.lazy(() => CropTableWhereInputSchema).optional(),
});

export const LandTableListRelationFilterSchema: z.ZodType<Prisma.LandTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => LandTableWhereInputSchema).optional(),
  some: z.lazy(() => LandTableWhereInputSchema).optional(),
  none: z.lazy(() => LandTableWhereInputSchema).optional(),
});

export const PlantingTableListRelationFilterSchema: z.ZodType<Prisma.PlantingTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => PlantingTableWhereInputSchema).optional(),
  some: z.lazy(() => PlantingTableWhereInputSchema).optional(),
  none: z.lazy(() => PlantingTableWhereInputSchema).optional(),
});

export const PolyTableListRelationFilterSchema: z.ZodType<Prisma.PolyTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => PolyTableWhereInputSchema).optional(),
  some: z.lazy(() => PolyTableWhereInputSchema).optional(),
  none: z.lazy(() => PolyTableWhereInputSchema).optional(),
});

export const OrganizationLocalTableNullableScalarRelationFilterSchema: z.ZodType<Prisma.OrganizationLocalTableNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional().nullable(),
});

export const StakeholderTableListRelationFilterSchema: z.ZodType<Prisma.StakeholderTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => StakeholderTableWhereInputSchema).optional(),
  some: z.lazy(() => StakeholderTableWhereInputSchema).optional(),
  none: z.lazy(() => StakeholderTableWhereInputSchema).optional(),
});

export const SourceTableListRelationFilterSchema: z.ZodType<Prisma.SourceTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => SourceTableWhereInputSchema).optional(),
  some: z.lazy(() => SourceTableWhereInputSchema).optional(),
  none: z.lazy(() => SourceTableWhereInputSchema).optional(),
});

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.strictObject({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional(),
});

export const CropTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.CropTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const LandTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.LandTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const PlantingTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PlantingTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const PolyTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PolyTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const StakeholderTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.StakeholderTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const SourceTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.SourceTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const ProjectTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.ProjectTableCountOrderByAggregateInput> = z.strictObject({
  projectId: z.lazy(() => SortOrderSchema).optional(),
  projectName: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  platformId: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  projectNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistryType: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistry: z.lazy(() => SortOrderSchema).optional(),
  employmentClaim: z.lazy(() => SortOrderSchema).optional(),
  employmentClaimDescription: z.lazy(() => SortOrderSchema).optional(),
  projectDateEnd: z.lazy(() => SortOrderSchema).optional(),
  projectDateStart: z.lazy(() => SortOrderSchema).optional(),
  registryId: z.lazy(() => SortOrderSchema).optional(),
  isPublic: z.lazy(() => SortOrderSchema).optional(),
});

export const ProjectTableAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ProjectTableAvgOrderByAggregateInput> = z.strictObject({
  employmentClaim: z.lazy(() => SortOrderSchema).optional(),
});

export const ProjectTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ProjectTableMaxOrderByAggregateInput> = z.strictObject({
  projectId: z.lazy(() => SortOrderSchema).optional(),
  projectName: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  platformId: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  projectNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistryType: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistry: z.lazy(() => SortOrderSchema).optional(),
  employmentClaim: z.lazy(() => SortOrderSchema).optional(),
  employmentClaimDescription: z.lazy(() => SortOrderSchema).optional(),
  projectDateEnd: z.lazy(() => SortOrderSchema).optional(),
  projectDateStart: z.lazy(() => SortOrderSchema).optional(),
  registryId: z.lazy(() => SortOrderSchema).optional(),
  isPublic: z.lazy(() => SortOrderSchema).optional(),
});

export const ProjectTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.ProjectTableMinOrderByAggregateInput> = z.strictObject({
  projectId: z.lazy(() => SortOrderSchema).optional(),
  projectName: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  platformId: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  projectNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistryType: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistry: z.lazy(() => SortOrderSchema).optional(),
  employmentClaim: z.lazy(() => SortOrderSchema).optional(),
  employmentClaimDescription: z.lazy(() => SortOrderSchema).optional(),
  projectDateEnd: z.lazy(() => SortOrderSchema).optional(),
  projectDateStart: z.lazy(() => SortOrderSchema).optional(),
  registryId: z.lazy(() => SortOrderSchema).optional(),
  isPublic: z.lazy(() => SortOrderSchema).optional(),
});

export const ProjectTableSumOrderByAggregateInputSchema: z.ZodType<Prisma.ProjectTableSumOrderByAggregateInput> = z.strictObject({
  employmentClaim: z.lazy(() => SortOrderSchema).optional(),
});

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const BoolNullableWithAggregatesFilterSchema: z.ZodType<Prisma.BoolNullableWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional().nullable(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolNullableFilterSchema).optional(),
});

export const EnumCarbonRegistryTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumCarbonRegistryTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  in: z.lazy(() => CarbonRegistryTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => CarbonRegistryTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NestedEnumCarbonRegistryTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCarbonRegistryTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCarbonRegistryTypeNullableFilterSchema).optional(),
});

export const EnumCarbonRegistryNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumCarbonRegistryNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  in: z.lazy(() => CarbonRegistrySchema).array().optional().nullable(),
  notIn: z.lazy(() => CarbonRegistrySchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NestedEnumCarbonRegistryNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCarbonRegistryNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCarbonRegistryNullableFilterSchema).optional(),
});

export const IntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.IntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const DecimalNullableFilterSchema: z.ZodType<Prisma.DecimalNullableFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(PrismaDecimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(PrismaDecimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableFilterSchema) ]).optional().nullable(),
});

export const EnumTreatmentTypeNullableFilterSchema: z.ZodType<Prisma.EnumTreatmentTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  in: z.lazy(() => TreatmentTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => TreatmentTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NestedEnumTreatmentTypeNullableFilterSchema) ]).optional().nullable(),
});

export const ProjectTableScalarRelationFilterSchema: z.ZodType<Prisma.ProjectTableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => ProjectTableWhereInputSchema).optional(),
  isNot: z.lazy(() => ProjectTableWhereInputSchema).optional(),
});

export const PolygonTableListRelationFilterSchema: z.ZodType<Prisma.PolygonTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => PolygonTableWhereInputSchema).optional(),
  some: z.lazy(() => PolygonTableWhereInputSchema).optional(),
  none: z.lazy(() => PolygonTableWhereInputSchema).optional(),
});

export const PolygonTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PolygonTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const LandTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.LandTableCountOrderByAggregateInput> = z.strictObject({
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  hectares: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
  landNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  treatmentType: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  preparation: z.lazy(() => SortOrderSchema).optional(),
});

export const LandTableAvgOrderByAggregateInputSchema: z.ZodType<Prisma.LandTableAvgOrderByAggregateInput> = z.strictObject({
  hectares: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const LandTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.LandTableMaxOrderByAggregateInput> = z.strictObject({
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  hectares: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
  landNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  treatmentType: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  preparation: z.lazy(() => SortOrderSchema).optional(),
});

export const LandTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.LandTableMinOrderByAggregateInput> = z.strictObject({
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  hectares: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
  landNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  treatmentType: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  preparation: z.lazy(() => SortOrderSchema).optional(),
});

export const LandTableSumOrderByAggregateInputSchema: z.ZodType<Prisma.LandTableSumOrderByAggregateInput> = z.strictObject({
  hectares: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const DecimalNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DecimalNullableWithAggregatesFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(PrismaDecimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(PrismaDecimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
});

export const EnumTreatmentTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumTreatmentTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  in: z.lazy(() => TreatmentTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => TreatmentTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NestedEnumTreatmentTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTreatmentTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTreatmentTypeNullableFilterSchema).optional(),
});

export const ProjectTableNullableScalarRelationFilterSchema: z.ZodType<Prisma.ProjectTableNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => ProjectTableWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => ProjectTableWhereInputSchema).optional().nullable(),
});

export const SpeciesTableListRelationFilterSchema: z.ZodType<Prisma.SpeciesTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => SpeciesTableWhereInputSchema).optional(),
  some: z.lazy(() => SpeciesTableWhereInputSchema).optional(),
  none: z.lazy(() => SpeciesTableWhereInputSchema).optional(),
});

export const SpeciesTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.SpeciesTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const CropTableProjectIdCropNameCompoundUniqueInputSchema: z.ZodType<Prisma.CropTableProjectIdCropNameCompoundUniqueInput> = z.strictObject({
  projectId: z.string(),
  cropName: z.string(),
});

export const CropTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.CropTableCountOrderByAggregateInput> = z.strictObject({
  cropId: z.lazy(() => SortOrderSchema).optional(),
  cropName: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  speciesLocalName: z.lazy(() => SortOrderSchema).optional(),
  speciesId: z.lazy(() => SortOrderSchema).optional(),
  seedInfo: z.lazy(() => SortOrderSchema).optional(),
  cropStock: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalName: z.lazy(() => SortOrderSchema).optional(),
  cropNotes: z.lazy(() => SortOrderSchema).optional(),
});

export const CropTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CropTableMaxOrderByAggregateInput> = z.strictObject({
  cropId: z.lazy(() => SortOrderSchema).optional(),
  cropName: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  speciesLocalName: z.lazy(() => SortOrderSchema).optional(),
  speciesId: z.lazy(() => SortOrderSchema).optional(),
  seedInfo: z.lazy(() => SortOrderSchema).optional(),
  cropStock: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalName: z.lazy(() => SortOrderSchema).optional(),
  cropNotes: z.lazy(() => SortOrderSchema).optional(),
});

export const CropTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.CropTableMinOrderByAggregateInput> = z.strictObject({
  cropId: z.lazy(() => SortOrderSchema).optional(),
  cropName: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  speciesLocalName: z.lazy(() => SortOrderSchema).optional(),
  speciesId: z.lazy(() => SortOrderSchema).optional(),
  seedInfo: z.lazy(() => SortOrderSchema).optional(),
  cropStock: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalName: z.lazy(() => SortOrderSchema).optional(),
  cropNotes: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumParentTableFilterSchema: z.ZodType<Prisma.EnumParentTableFilter> = z.strictObject({
  equals: z.lazy(() => ParentTableSchema).optional(),
  in: z.lazy(() => ParentTableSchema).array().optional(),
  notIn: z.lazy(() => ParentTableSchema).array().optional(),
  not: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NestedEnumParentTableFilterSchema) ]).optional(),
});

export const EnumUnitTypeNullableFilterSchema: z.ZodType<Prisma.EnumUnitTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => UnitTypeSchema).optional().nullable(),
  in: z.lazy(() => UnitTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => UnitTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NestedEnumUnitTypeNullableFilterSchema) ]).optional().nullable(),
});

export const PlantingTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.PlantingTableCountOrderByAggregateInput> = z.strictObject({
  plantingId: z.lazy(() => SortOrderSchema).optional(),
  planted: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  allocated: z.lazy(() => SortOrderSchema).optional(),
  plantingDate: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  units: z.lazy(() => SortOrderSchema).optional(),
  unitType: z.lazy(() => SortOrderSchema).optional(),
  pricePerUnit: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
});

export const PlantingTableAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PlantingTableAvgOrderByAggregateInput> = z.strictObject({
  planted: z.lazy(() => SortOrderSchema).optional(),
  allocated: z.lazy(() => SortOrderSchema).optional(),
  units: z.lazy(() => SortOrderSchema).optional(),
  pricePerUnit: z.lazy(() => SortOrderSchema).optional(),
});

export const PlantingTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PlantingTableMaxOrderByAggregateInput> = z.strictObject({
  plantingId: z.lazy(() => SortOrderSchema).optional(),
  planted: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  allocated: z.lazy(() => SortOrderSchema).optional(),
  plantingDate: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  units: z.lazy(() => SortOrderSchema).optional(),
  unitType: z.lazy(() => SortOrderSchema).optional(),
  pricePerUnit: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
});

export const PlantingTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.PlantingTableMinOrderByAggregateInput> = z.strictObject({
  plantingId: z.lazy(() => SortOrderSchema).optional(),
  planted: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  allocated: z.lazy(() => SortOrderSchema).optional(),
  plantingDate: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  units: z.lazy(() => SortOrderSchema).optional(),
  unitType: z.lazy(() => SortOrderSchema).optional(),
  pricePerUnit: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
});

export const PlantingTableSumOrderByAggregateInputSchema: z.ZodType<Prisma.PlantingTableSumOrderByAggregateInput> = z.strictObject({
  planted: z.lazy(() => SortOrderSchema).optional(),
  allocated: z.lazy(() => SortOrderSchema).optional(),
  units: z.lazy(() => SortOrderSchema).optional(),
  pricePerUnit: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumParentTableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumParentTableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => ParentTableSchema).optional(),
  in: z.lazy(() => ParentTableSchema).array().optional(),
  notIn: z.lazy(() => ParentTableSchema).array().optional(),
  not: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NestedEnumParentTableWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumParentTableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumParentTableFilterSchema).optional(),
});

export const EnumUnitTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumUnitTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => UnitTypeSchema).optional().nullable(),
  in: z.lazy(() => UnitTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => UnitTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NestedEnumUnitTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumUnitTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumUnitTypeNullableFilterSchema).optional(),
});

export const SpeciesTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.SpeciesTableCountOrderByAggregateInput> = z.strictObject({
  speciesName: z.lazy(() => SortOrderSchema).optional(),
  commonName: z.lazy(() => SortOrderSchema).optional(),
  scientificName: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  family: z.lazy(() => SortOrderSchema).optional(),
  reference: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
});

export const SpeciesTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SpeciesTableMaxOrderByAggregateInput> = z.strictObject({
  speciesName: z.lazy(() => SortOrderSchema).optional(),
  commonName: z.lazy(() => SortOrderSchema).optional(),
  scientificName: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  family: z.lazy(() => SortOrderSchema).optional(),
  reference: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
});

export const SpeciesTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.SpeciesTableMinOrderByAggregateInput> = z.strictObject({
  speciesName: z.lazy(() => SortOrderSchema).optional(),
  commonName: z.lazy(() => SortOrderSchema).optional(),
  scientificName: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  family: z.lazy(() => SortOrderSchema).optional(),
  reference: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
});

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const LandTableScalarRelationFilterSchema: z.ZodType<Prisma.LandTableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => LandTableWhereInputSchema).optional(),
  isNot: z.lazy(() => LandTableWhereInputSchema).optional(),
});

export const PolygonTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.PolygonTableCountOrderByAggregateInput> = z.strictObject({
  polygonId: z.lazy(() => SortOrderSchema).optional(),
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.lazy(() => SortOrderSchema).optional(),
  geometry: z.lazy(() => SortOrderSchema).optional(),
  polygonNotes: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PolygonTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PolygonTableMaxOrderByAggregateInput> = z.strictObject({
  polygonId: z.lazy(() => SortOrderSchema).optional(),
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.lazy(() => SortOrderSchema).optional(),
  polygonNotes: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PolygonTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.PolygonTableMinOrderByAggregateInput> = z.strictObject({
  polygonId: z.lazy(() => SortOrderSchema).optional(),
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.lazy(() => SortOrderSchema).optional(),
  polygonNotes: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
});

export const FloatNullableFilterSchema: z.ZodType<Prisma.FloatNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
});

export const EnumRestorationTypeNullableFilterSchema: z.ZodType<Prisma.EnumRestorationTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => RestorationTypeSchema).optional().nullable(),
  in: z.lazy(() => RestorationTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => RestorationTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => RestorationTypeSchema), z.lazy(() => NestedEnumRestorationTypeNullableFilterSchema) ]).optional().nullable(),
});

export const PolyTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.PolyTableCountOrderByAggregateInput> = z.strictObject({
  polyId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  randomJson: z.lazy(() => SortOrderSchema).optional(),
  survivalRate: z.lazy(() => SortOrderSchema).optional(),
  liabilityCause: z.lazy(() => SortOrderSchema).optional(),
  ratePerTree: z.lazy(() => SortOrderSchema).optional(),
  motivation: z.lazy(() => SortOrderSchema).optional(),
  restorationType: z.lazy(() => SortOrderSchema).optional(),
  reviews: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
});

export const PolyTableAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PolyTableAvgOrderByAggregateInput> = z.strictObject({
  survivalRate: z.lazy(() => SortOrderSchema).optional(),
  ratePerTree: z.lazy(() => SortOrderSchema).optional(),
});

export const PolyTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PolyTableMaxOrderByAggregateInput> = z.strictObject({
  polyId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  randomJson: z.lazy(() => SortOrderSchema).optional(),
  survivalRate: z.lazy(() => SortOrderSchema).optional(),
  liabilityCause: z.lazy(() => SortOrderSchema).optional(),
  ratePerTree: z.lazy(() => SortOrderSchema).optional(),
  motivation: z.lazy(() => SortOrderSchema).optional(),
  restorationType: z.lazy(() => SortOrderSchema).optional(),
  reviews: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
});

export const PolyTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.PolyTableMinOrderByAggregateInput> = z.strictObject({
  polyId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  randomJson: z.lazy(() => SortOrderSchema).optional(),
  survivalRate: z.lazy(() => SortOrderSchema).optional(),
  liabilityCause: z.lazy(() => SortOrderSchema).optional(),
  ratePerTree: z.lazy(() => SortOrderSchema).optional(),
  motivation: z.lazy(() => SortOrderSchema).optional(),
  restorationType: z.lazy(() => SortOrderSchema).optional(),
  reviews: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
});

export const PolyTableSumOrderByAggregateInputSchema: z.ZodType<Prisma.PolyTableSumOrderByAggregateInput> = z.strictObject({
  survivalRate: z.lazy(() => SortOrderSchema).optional(),
  ratePerTree: z.lazy(() => SortOrderSchema).optional(),
});

export const FloatNullableWithAggregatesFilterSchema: z.ZodType<Prisma.FloatNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
});

export const EnumRestorationTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumRestorationTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => RestorationTypeSchema).optional().nullable(),
  in: z.lazy(() => RestorationTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => RestorationTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => RestorationTypeSchema), z.lazy(() => NestedEnumRestorationTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumRestorationTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumRestorationTypeNullableFilterSchema).optional(),
});

export const EnumStakeholderTypeNullableFilterSchema: z.ZodType<Prisma.EnumStakeholderTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  in: z.lazy(() => StakeholderTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => StakeholderTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NestedEnumStakeholderTypeNullableFilterSchema) ]).optional().nullable(),
});

export const OrganizationLocalTableScalarRelationFilterSchema: z.ZodType<Prisma.OrganizationLocalTableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional(),
  isNot: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional(),
});

export const StakeholderTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.StakeholderTableCountOrderByAggregateInput> = z.strictObject({
  stakeholderId: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  stakeholderType: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const StakeholderTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.StakeholderTableMaxOrderByAggregateInput> = z.strictObject({
  stakeholderId: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  stakeholderType: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const StakeholderTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.StakeholderTableMinOrderByAggregateInput> = z.strictObject({
  stakeholderId: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  stakeholderType: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumStakeholderTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumStakeholderTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  in: z.lazy(() => StakeholderTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => StakeholderTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NestedEnumStakeholderTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumStakeholderTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumStakeholderTypeNullableFilterSchema).optional(),
});

export const EnumUrlTypeNullableFilterSchema: z.ZodType<Prisma.EnumUrlTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => UrlTypeSchema).optional().nullable(),
  in: z.lazy(() => UrlTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => UrlTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NestedEnumUrlTypeNullableFilterSchema) ]).optional().nullable(),
});

export const EnumParentTableNullableFilterSchema: z.ZodType<Prisma.EnumParentTableNullableFilter> = z.strictObject({
  equals: z.lazy(() => ParentTableSchema).optional().nullable(),
  in: z.lazy(() => ParentTableSchema).array().optional().nullable(),
  notIn: z.lazy(() => ParentTableSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NestedEnumParentTableNullableFilterSchema) ]).optional().nullable(),
});

export const EnumDisclosureTypeNullableFilterSchema: z.ZodType<Prisma.EnumDisclosureTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  in: z.lazy(() => DisclosureTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => DisclosureTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NestedEnumDisclosureTypeNullableFilterSchema) ]).optional().nullable(),
});

export const ClaimTableListRelationFilterSchema: z.ZodType<Prisma.ClaimTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => ClaimTableWhereInputSchema).optional(),
  some: z.lazy(() => ClaimTableWhereInputSchema).optional(),
  none: z.lazy(() => ClaimTableWhereInputSchema).optional(),
});

export const OrganizationLocalTableListRelationFilterSchema: z.ZodType<Prisma.OrganizationLocalTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional(),
  some: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional(),
  none: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional(),
});

export const ProjectTableListRelationFilterSchema: z.ZodType<Prisma.ProjectTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => ProjectTableWhereInputSchema).optional(),
  some: z.lazy(() => ProjectTableWhereInputSchema).optional(),
  none: z.lazy(() => ProjectTableWhereInputSchema).optional(),
});

export const ClaimTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ClaimTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const OrganizationLocalTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.OrganizationLocalTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const ProjectTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ProjectTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const SourceTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.SourceTableCountOrderByAggregateInput> = z.strictObject({
  sourceId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  urlType: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  disclosureType: z.lazy(() => SortOrderSchema).optional(),
  sourceDescription: z.lazy(() => SortOrderSchema).optional(),
  sourceCredit: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SourceTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SourceTableMaxOrderByAggregateInput> = z.strictObject({
  sourceId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  urlType: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  disclosureType: z.lazy(() => SortOrderSchema).optional(),
  sourceDescription: z.lazy(() => SortOrderSchema).optional(),
  sourceCredit: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SourceTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.SourceTableMinOrderByAggregateInput> = z.strictObject({
  sourceId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  urlType: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  disclosureType: z.lazy(() => SortOrderSchema).optional(),
  sourceDescription: z.lazy(() => SortOrderSchema).optional(),
  sourceCredit: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumUrlTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumUrlTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => UrlTypeSchema).optional().nullable(),
  in: z.lazy(() => UrlTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => UrlTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NestedEnumUrlTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumUrlTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumUrlTypeNullableFilterSchema).optional(),
});

export const EnumParentTableNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumParentTableNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => ParentTableSchema).optional().nullable(),
  in: z.lazy(() => ParentTableSchema).array().optional().nullable(),
  notIn: z.lazy(() => ParentTableSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NestedEnumParentTableNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumParentTableNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumParentTableNullableFilterSchema).optional(),
});

export const EnumDisclosureTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumDisclosureTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  in: z.lazy(() => DisclosureTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => DisclosureTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NestedEnumDisclosureTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumDisclosureTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumDisclosureTypeNullableFilterSchema).optional(),
});

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const SourceTableScalarRelationFilterSchema: z.ZodType<Prisma.SourceTableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => SourceTableWhereInputSchema).optional(),
  isNot: z.lazy(() => SourceTableWhereInputSchema).optional(),
});

export const ClaimTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.ClaimTableCountOrderByAggregateInput> = z.strictObject({
  claimId: z.lazy(() => SortOrderSchema).optional(),
  claimCount: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  sourceId: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
});

export const ClaimTableAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ClaimTableAvgOrderByAggregateInput> = z.strictObject({
  claimCount: z.lazy(() => SortOrderSchema).optional(),
});

export const ClaimTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ClaimTableMaxOrderByAggregateInput> = z.strictObject({
  claimId: z.lazy(() => SortOrderSchema).optional(),
  claimCount: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  sourceId: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
});

export const ClaimTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.ClaimTableMinOrderByAggregateInput> = z.strictObject({
  claimId: z.lazy(() => SortOrderSchema).optional(),
  claimCount: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  sourceId: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
});

export const ClaimTableSumOrderByAggregateInputSchema: z.ZodType<Prisma.ClaimTableSumOrderByAggregateInput> = z.strictObject({
  claimCount: z.lazy(() => SortOrderSchema).optional(),
});

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const OrganizationMasterTableNullableScalarRelationFilterSchema: z.ZodType<Prisma.OrganizationMasterTableNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => OrganizationMasterTableWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => OrganizationMasterTableWhereInputSchema).optional().nullable(),
});

export const OrganizationLocalTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationLocalTableCountOrderByAggregateInput> = z.strictObject({
  organizationLocalName: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  contactName: z.lazy(() => SortOrderSchema).optional(),
  contactEmail: z.lazy(() => SortOrderSchema).optional(),
  contactPhone: z.lazy(() => SortOrderSchema).optional(),
  address: z.lazy(() => SortOrderSchema).optional(),
  polyId: z.lazy(() => SortOrderSchema).optional(),
  website: z.lazy(() => SortOrderSchema).optional(),
  capacityPerYear: z.lazy(() => SortOrderSchema).optional(),
  organizationNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const OrganizationLocalTableAvgOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationLocalTableAvgOrderByAggregateInput> = z.strictObject({
  capacityPerYear: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const OrganizationLocalTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationLocalTableMaxOrderByAggregateInput> = z.strictObject({
  organizationLocalName: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  contactName: z.lazy(() => SortOrderSchema).optional(),
  contactEmail: z.lazy(() => SortOrderSchema).optional(),
  contactPhone: z.lazy(() => SortOrderSchema).optional(),
  address: z.lazy(() => SortOrderSchema).optional(),
  polyId: z.lazy(() => SortOrderSchema).optional(),
  website: z.lazy(() => SortOrderSchema).optional(),
  capacityPerYear: z.lazy(() => SortOrderSchema).optional(),
  organizationNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const OrganizationLocalTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationLocalTableMinOrderByAggregateInput> = z.strictObject({
  organizationLocalName: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  contactName: z.lazy(() => SortOrderSchema).optional(),
  contactEmail: z.lazy(() => SortOrderSchema).optional(),
  contactPhone: z.lazy(() => SortOrderSchema).optional(),
  address: z.lazy(() => SortOrderSchema).optional(),
  polyId: z.lazy(() => SortOrderSchema).optional(),
  website: z.lazy(() => SortOrderSchema).optional(),
  capacityPerYear: z.lazy(() => SortOrderSchema).optional(),
  organizationNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const OrganizationLocalTableSumOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationLocalTableSumOrderByAggregateInput> = z.strictObject({
  capacityPerYear: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const OrganizationMasterTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationMasterTableCountOrderByAggregateInput> = z.strictObject({
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterName: z.lazy(() => SortOrderSchema).optional(),
  contactName: z.lazy(() => SortOrderSchema).optional(),
  contactEmail: z.lazy(() => SortOrderSchema).optional(),
  contactPhone: z.lazy(() => SortOrderSchema).optional(),
  address: z.lazy(() => SortOrderSchema).optional(),
  website: z.lazy(() => SortOrderSchema).optional(),
  capacityPerYear: z.lazy(() => SortOrderSchema).optional(),
  organizationNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const OrganizationMasterTableAvgOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationMasterTableAvgOrderByAggregateInput> = z.strictObject({
  capacityPerYear: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const OrganizationMasterTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationMasterTableMaxOrderByAggregateInput> = z.strictObject({
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterName: z.lazy(() => SortOrderSchema).optional(),
  contactName: z.lazy(() => SortOrderSchema).optional(),
  contactEmail: z.lazy(() => SortOrderSchema).optional(),
  contactPhone: z.lazy(() => SortOrderSchema).optional(),
  address: z.lazy(() => SortOrderSchema).optional(),
  website: z.lazy(() => SortOrderSchema).optional(),
  capacityPerYear: z.lazy(() => SortOrderSchema).optional(),
  organizationNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const OrganizationMasterTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationMasterTableMinOrderByAggregateInput> = z.strictObject({
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterName: z.lazy(() => SortOrderSchema).optional(),
  contactName: z.lazy(() => SortOrderSchema).optional(),
  contactEmail: z.lazy(() => SortOrderSchema).optional(),
  contactPhone: z.lazy(() => SortOrderSchema).optional(),
  address: z.lazy(() => SortOrderSchema).optional(),
  website: z.lazy(() => SortOrderSchema).optional(),
  capacityPerYear: z.lazy(() => SortOrderSchema).optional(),
  organizationNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const OrganizationMasterTableSumOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationMasterTableSumOrderByAggregateInput> = z.strictObject({
  capacityPerYear: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const CropTableCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.CropTableCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => CropTableCreateWithoutProjectTableInputSchema), z.lazy(() => CropTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => CropTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CropTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => CropTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CropTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
});

export const LandTableCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.LandTableCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => LandTableCreateWithoutProjectTableInputSchema), z.lazy(() => LandTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => LandTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => LandTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => LandTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => LandTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
});

export const PlantingTableCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.PlantingTableCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => PlantingTableCreateWithoutProjectTableInputSchema), z.lazy(() => PlantingTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => PlantingTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlantingTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => PlantingTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PlantingTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
});

export const PolyTableCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.PolyTableCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => PolyTableCreateWithoutProjectTableInputSchema), z.lazy(() => PolyTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => PolyTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => PolyTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PolyTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => PolyTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PolyTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PolyTableWhereUniqueInputSchema), z.lazy(() => PolyTableWhereUniqueInputSchema).array() ]).optional(),
});

export const OrganizationLocalTableCreateNestedOneWithoutProjectTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateNestedOneWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutProjectTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutProjectTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutProjectTableInputSchema).optional(),
  connect: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).optional(),
});

export const StakeholderTableCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.StakeholderTableCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => StakeholderTableCreateWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => StakeholderTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => StakeholderTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => StakeholderTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
});

export const SourceTableCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.SourceTableCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutProjectTableInputSchema), z.lazy(() => SourceTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const CropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.CropTableUncheckedCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => CropTableCreateWithoutProjectTableInputSchema), z.lazy(() => CropTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => CropTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CropTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => CropTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CropTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
});

export const LandTableUncheckedCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.LandTableUncheckedCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => LandTableCreateWithoutProjectTableInputSchema), z.lazy(() => LandTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => LandTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => LandTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => LandTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => LandTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
});

export const PlantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.PlantingTableUncheckedCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => PlantingTableCreateWithoutProjectTableInputSchema), z.lazy(() => PlantingTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => PlantingTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlantingTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => PlantingTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PlantingTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
});

export const PolyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.PolyTableUncheckedCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => PolyTableCreateWithoutProjectTableInputSchema), z.lazy(() => PolyTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => PolyTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => PolyTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PolyTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => PolyTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PolyTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PolyTableWhereUniqueInputSchema), z.lazy(() => PolyTableWhereUniqueInputSchema).array() ]).optional(),
});

export const StakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => StakeholderTableCreateWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => StakeholderTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => StakeholderTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => StakeholderTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
});

export const SourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutProjectTableInputSchema), z.lazy(() => SourceTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional(),
});

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional().nullable(),
});

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional().nullable(),
});

export const NullableBoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableBoolFieldUpdateOperationsInput> = z.strictObject({
  set: z.boolean().optional().nullable(),
});

export const NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumCarbonRegistryTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
});

export const NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumCarbonRegistryFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
});

export const NullableIntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableIntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional().nullable(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.strictObject({
  set: z.boolean().optional(),
});

export const CropTableUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.CropTableUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CropTableCreateWithoutProjectTableInputSchema), z.lazy(() => CropTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => CropTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CropTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => CropTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CropTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => CropTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CropTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CropTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => CropTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CropTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => CropTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CropTableScalarWhereInputSchema), z.lazy(() => CropTableScalarWhereInputSchema).array() ]).optional(),
});

export const LandTableUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.LandTableUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => LandTableCreateWithoutProjectTableInputSchema), z.lazy(() => LandTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => LandTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => LandTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => LandTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => LandTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => LandTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => LandTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => LandTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => LandTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => LandTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => LandTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => LandTableScalarWhereInputSchema), z.lazy(() => LandTableScalarWhereInputSchema).array() ]).optional(),
});

export const PlantingTableUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.PlantingTableUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PlantingTableCreateWithoutProjectTableInputSchema), z.lazy(() => PlantingTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => PlantingTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlantingTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => PlantingTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PlantingTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PlantingTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PlantingTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PlantingTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PlantingTableScalarWhereInputSchema), z.lazy(() => PlantingTableScalarWhereInputSchema).array() ]).optional(),
});

export const PolyTableUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.PolyTableUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PolyTableCreateWithoutProjectTableInputSchema), z.lazy(() => PolyTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => PolyTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => PolyTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PolyTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => PolyTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PolyTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => PolyTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PolyTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PolyTableWhereUniqueInputSchema), z.lazy(() => PolyTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PolyTableWhereUniqueInputSchema), z.lazy(() => PolyTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PolyTableWhereUniqueInputSchema), z.lazy(() => PolyTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PolyTableWhereUniqueInputSchema), z.lazy(() => PolyTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PolyTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => PolyTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PolyTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => PolyTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PolyTableScalarWhereInputSchema), z.lazy(() => PolyTableScalarWhereInputSchema).array() ]).optional(),
});

export const OrganizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateOneWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutProjectTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutProjectTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutProjectTableInputSchema).optional(),
  upsert: z.lazy(() => OrganizationLocalTableUpsertWithoutProjectTableInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => OrganizationLocalTableWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => OrganizationLocalTableWhereInputSchema) ]).optional(),
  connect: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => OrganizationLocalTableUpdateToOneWithWhereWithoutProjectTableInputSchema), z.lazy(() => OrganizationLocalTableUpdateWithoutProjectTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutProjectTableInputSchema) ]).optional(),
});

export const StakeholderTableUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.StakeholderTableUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => StakeholderTableCreateWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => StakeholderTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => StakeholderTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => StakeholderTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => StakeholderTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => StakeholderTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => StakeholderTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => StakeholderTableScalarWhereInputSchema), z.lazy(() => StakeholderTableScalarWhereInputSchema).array() ]).optional(),
});

export const SourceTableUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.SourceTableUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutProjectTableInputSchema), z.lazy(() => SourceTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SourceTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => SourceTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SourceTableScalarWhereInputSchema), z.lazy(() => SourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const CropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.CropTableUncheckedUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CropTableCreateWithoutProjectTableInputSchema), z.lazy(() => CropTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => CropTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CropTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => CropTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CropTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => CropTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CropTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CropTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => CropTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CropTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => CropTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CropTableScalarWhereInputSchema), z.lazy(() => CropTableScalarWhereInputSchema).array() ]).optional(),
});

export const LandTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.LandTableUncheckedUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => LandTableCreateWithoutProjectTableInputSchema), z.lazy(() => LandTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => LandTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => LandTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => LandTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => LandTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => LandTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => LandTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => LandTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => LandTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => LandTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => LandTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => LandTableScalarWhereInputSchema), z.lazy(() => LandTableScalarWhereInputSchema).array() ]).optional(),
});

export const PlantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.PlantingTableUncheckedUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PlantingTableCreateWithoutProjectTableInputSchema), z.lazy(() => PlantingTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => PlantingTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlantingTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => PlantingTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PlantingTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PlantingTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PlantingTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PlantingTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PlantingTableScalarWhereInputSchema), z.lazy(() => PlantingTableScalarWhereInputSchema).array() ]).optional(),
});

export const PolyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.PolyTableUncheckedUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PolyTableCreateWithoutProjectTableInputSchema), z.lazy(() => PolyTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => PolyTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => PolyTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PolyTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => PolyTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PolyTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => PolyTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PolyTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PolyTableWhereUniqueInputSchema), z.lazy(() => PolyTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PolyTableWhereUniqueInputSchema), z.lazy(() => PolyTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PolyTableWhereUniqueInputSchema), z.lazy(() => PolyTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PolyTableWhereUniqueInputSchema), z.lazy(() => PolyTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PolyTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => PolyTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PolyTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => PolyTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PolyTableScalarWhereInputSchema), z.lazy(() => PolyTableScalarWhereInputSchema).array() ]).optional(),
});

export const StakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => StakeholderTableCreateWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => StakeholderTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => StakeholderTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => StakeholderTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => StakeholderTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => StakeholderTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => StakeholderTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => StakeholderTableScalarWhereInputSchema), z.lazy(() => StakeholderTableScalarWhereInputSchema).array() ]).optional(),
});

export const SourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutProjectTableInputSchema), z.lazy(() => SourceTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SourceTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => SourceTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SourceTableScalarWhereInputSchema), z.lazy(() => SourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const ProjectTableCreateNestedOneWithoutLandTableInputSchema: z.ZodType<Prisma.ProjectTableCreateNestedOneWithoutLandTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutLandTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutLandTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProjectTableCreateOrConnectWithoutLandTableInputSchema).optional(),
  connect: z.lazy(() => ProjectTableWhereUniqueInputSchema).optional(),
});

export const PolygonTableCreateNestedManyWithoutLandTableInputSchema: z.ZodType<Prisma.PolygonTableCreateNestedManyWithoutLandTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => PolygonTableCreateWithoutLandTableInputSchema), z.lazy(() => PolygonTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => PolygonTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => PolygonTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PolygonTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => PolygonTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PolygonTableCreateManyLandTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PolygonTableWhereUniqueInputSchema), z.lazy(() => PolygonTableWhereUniqueInputSchema).array() ]).optional(),
});

export const SourceTableCreateNestedManyWithoutLandTableInputSchema: z.ZodType<Prisma.SourceTableCreateNestedManyWithoutLandTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutLandTableInputSchema), z.lazy(() => SourceTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const PolygonTableUncheckedCreateNestedManyWithoutLandTableInputSchema: z.ZodType<Prisma.PolygonTableUncheckedCreateNestedManyWithoutLandTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => PolygonTableCreateWithoutLandTableInputSchema), z.lazy(() => PolygonTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => PolygonTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => PolygonTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PolygonTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => PolygonTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PolygonTableCreateManyLandTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PolygonTableWhereUniqueInputSchema), z.lazy(() => PolygonTableWhereUniqueInputSchema).array() ]).optional(),
});

export const SourceTableUncheckedCreateNestedManyWithoutLandTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedCreateNestedManyWithoutLandTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutLandTableInputSchema), z.lazy(() => SourceTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const NullableDecimalFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDecimalFieldUpdateOperationsInput> = z.strictObject({
  set: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  increment: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  decrement: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  multiply: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  divide: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
});

export const NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumTreatmentTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
});

export const ProjectTableUpdateOneRequiredWithoutLandTableNestedInputSchema: z.ZodType<Prisma.ProjectTableUpdateOneRequiredWithoutLandTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutLandTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutLandTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProjectTableCreateOrConnectWithoutLandTableInputSchema).optional(),
  upsert: z.lazy(() => ProjectTableUpsertWithoutLandTableInputSchema).optional(),
  connect: z.lazy(() => ProjectTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProjectTableUpdateToOneWithWhereWithoutLandTableInputSchema), z.lazy(() => ProjectTableUpdateWithoutLandTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutLandTableInputSchema) ]).optional(),
});

export const PolygonTableUpdateManyWithoutLandTableNestedInputSchema: z.ZodType<Prisma.PolygonTableUpdateManyWithoutLandTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PolygonTableCreateWithoutLandTableInputSchema), z.lazy(() => PolygonTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => PolygonTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => PolygonTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PolygonTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => PolygonTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PolygonTableUpsertWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => PolygonTableUpsertWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PolygonTableCreateManyLandTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PolygonTableWhereUniqueInputSchema), z.lazy(() => PolygonTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PolygonTableWhereUniqueInputSchema), z.lazy(() => PolygonTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PolygonTableWhereUniqueInputSchema), z.lazy(() => PolygonTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PolygonTableWhereUniqueInputSchema), z.lazy(() => PolygonTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PolygonTableUpdateWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => PolygonTableUpdateWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PolygonTableUpdateManyWithWhereWithoutLandTableInputSchema), z.lazy(() => PolygonTableUpdateManyWithWhereWithoutLandTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PolygonTableScalarWhereInputSchema), z.lazy(() => PolygonTableScalarWhereInputSchema).array() ]).optional(),
});

export const SourceTableUpdateManyWithoutLandTableNestedInputSchema: z.ZodType<Prisma.SourceTableUpdateManyWithoutLandTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutLandTableInputSchema), z.lazy(() => SourceTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SourceTableUpdateManyWithWhereWithoutLandTableInputSchema), z.lazy(() => SourceTableUpdateManyWithWhereWithoutLandTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SourceTableScalarWhereInputSchema), z.lazy(() => SourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const PolygonTableUncheckedUpdateManyWithoutLandTableNestedInputSchema: z.ZodType<Prisma.PolygonTableUncheckedUpdateManyWithoutLandTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PolygonTableCreateWithoutLandTableInputSchema), z.lazy(() => PolygonTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => PolygonTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => PolygonTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PolygonTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => PolygonTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PolygonTableUpsertWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => PolygonTableUpsertWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PolygonTableCreateManyLandTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PolygonTableWhereUniqueInputSchema), z.lazy(() => PolygonTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PolygonTableWhereUniqueInputSchema), z.lazy(() => PolygonTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PolygonTableWhereUniqueInputSchema), z.lazy(() => PolygonTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PolygonTableWhereUniqueInputSchema), z.lazy(() => PolygonTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PolygonTableUpdateWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => PolygonTableUpdateWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PolygonTableUpdateManyWithWhereWithoutLandTableInputSchema), z.lazy(() => PolygonTableUpdateManyWithWhereWithoutLandTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PolygonTableScalarWhereInputSchema), z.lazy(() => PolygonTableScalarWhereInputSchema).array() ]).optional(),
});

export const SourceTableUncheckedUpdateManyWithoutLandTableNestedInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateManyWithoutLandTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutLandTableInputSchema), z.lazy(() => SourceTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SourceTableUpdateManyWithWhereWithoutLandTableInputSchema), z.lazy(() => SourceTableUpdateManyWithWhereWithoutLandTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SourceTableScalarWhereInputSchema), z.lazy(() => SourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const ProjectTableCreateNestedOneWithoutCropTableInputSchema: z.ZodType<Prisma.ProjectTableCreateNestedOneWithoutCropTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutCropTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutCropTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProjectTableCreateOrConnectWithoutCropTableInputSchema).optional(),
  connect: z.lazy(() => ProjectTableWhereUniqueInputSchema).optional(),
});

export const SourceTableCreateNestedManyWithoutCropTableInputSchema: z.ZodType<Prisma.SourceTableCreateNestedManyWithoutCropTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutCropTableInputSchema), z.lazy(() => SourceTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const SpeciesTableCreateNestedManyWithoutCropTableInputSchema: z.ZodType<Prisma.SpeciesTableCreateNestedManyWithoutCropTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SpeciesTableCreateWithoutCropTableInputSchema), z.lazy(() => SpeciesTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => SpeciesTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SpeciesTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => SpeciesTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SpeciesTableWhereUniqueInputSchema), z.lazy(() => SpeciesTableWhereUniqueInputSchema).array() ]).optional(),
});

export const SourceTableUncheckedCreateNestedManyWithoutCropTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedCreateNestedManyWithoutCropTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutCropTableInputSchema), z.lazy(() => SourceTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const SpeciesTableUncheckedCreateNestedManyWithoutCropTableInputSchema: z.ZodType<Prisma.SpeciesTableUncheckedCreateNestedManyWithoutCropTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SpeciesTableCreateWithoutCropTableInputSchema), z.lazy(() => SpeciesTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => SpeciesTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SpeciesTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => SpeciesTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SpeciesTableWhereUniqueInputSchema), z.lazy(() => SpeciesTableWhereUniqueInputSchema).array() ]).optional(),
});

export const ProjectTableUpdateOneWithoutCropTableNestedInputSchema: z.ZodType<Prisma.ProjectTableUpdateOneWithoutCropTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutCropTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutCropTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProjectTableCreateOrConnectWithoutCropTableInputSchema).optional(),
  upsert: z.lazy(() => ProjectTableUpsertWithoutCropTableInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => ProjectTableWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => ProjectTableWhereInputSchema) ]).optional(),
  connect: z.lazy(() => ProjectTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProjectTableUpdateToOneWithWhereWithoutCropTableInputSchema), z.lazy(() => ProjectTableUpdateWithoutCropTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutCropTableInputSchema) ]).optional(),
});

export const SourceTableUpdateManyWithoutCropTableNestedInputSchema: z.ZodType<Prisma.SourceTableUpdateManyWithoutCropTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutCropTableInputSchema), z.lazy(() => SourceTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SourceTableUpdateManyWithWhereWithoutCropTableInputSchema), z.lazy(() => SourceTableUpdateManyWithWhereWithoutCropTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SourceTableScalarWhereInputSchema), z.lazy(() => SourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const SpeciesTableUpdateManyWithoutCropTableNestedInputSchema: z.ZodType<Prisma.SpeciesTableUpdateManyWithoutCropTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SpeciesTableCreateWithoutCropTableInputSchema), z.lazy(() => SpeciesTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => SpeciesTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SpeciesTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => SpeciesTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SpeciesTableUpsertWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUpsertWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SpeciesTableWhereUniqueInputSchema), z.lazy(() => SpeciesTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SpeciesTableWhereUniqueInputSchema), z.lazy(() => SpeciesTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SpeciesTableWhereUniqueInputSchema), z.lazy(() => SpeciesTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SpeciesTableWhereUniqueInputSchema), z.lazy(() => SpeciesTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SpeciesTableUpdateWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUpdateWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SpeciesTableUpdateManyWithWhereWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUpdateManyWithWhereWithoutCropTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SpeciesTableScalarWhereInputSchema), z.lazy(() => SpeciesTableScalarWhereInputSchema).array() ]).optional(),
});

export const SourceTableUncheckedUpdateManyWithoutCropTableNestedInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateManyWithoutCropTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutCropTableInputSchema), z.lazy(() => SourceTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SourceTableUpdateManyWithWhereWithoutCropTableInputSchema), z.lazy(() => SourceTableUpdateManyWithWhereWithoutCropTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SourceTableScalarWhereInputSchema), z.lazy(() => SourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const SpeciesTableUncheckedUpdateManyWithoutCropTableNestedInputSchema: z.ZodType<Prisma.SpeciesTableUncheckedUpdateManyWithoutCropTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SpeciesTableCreateWithoutCropTableInputSchema), z.lazy(() => SpeciesTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => SpeciesTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SpeciesTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => SpeciesTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SpeciesTableUpsertWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUpsertWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SpeciesTableWhereUniqueInputSchema), z.lazy(() => SpeciesTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SpeciesTableWhereUniqueInputSchema), z.lazy(() => SpeciesTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SpeciesTableWhereUniqueInputSchema), z.lazy(() => SpeciesTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SpeciesTableWhereUniqueInputSchema), z.lazy(() => SpeciesTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SpeciesTableUpdateWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUpdateWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SpeciesTableUpdateManyWithWhereWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUpdateManyWithWhereWithoutCropTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SpeciesTableScalarWhereInputSchema), z.lazy(() => SpeciesTableScalarWhereInputSchema).array() ]).optional(),
});

export const ProjectTableCreateNestedOneWithoutPlantingTableInputSchema: z.ZodType<Prisma.ProjectTableCreateNestedOneWithoutPlantingTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutPlantingTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutPlantingTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProjectTableCreateOrConnectWithoutPlantingTableInputSchema).optional(),
  connect: z.lazy(() => ProjectTableWhereUniqueInputSchema).optional(),
});

export const SourceTableCreateNestedManyWithoutPlantingTableInputSchema: z.ZodType<Prisma.SourceTableCreateNestedManyWithoutPlantingTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutPlantingTableInputSchema), z.lazy(() => SourceTableCreateWithoutPlantingTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutPlantingTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutPlantingTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutPlantingTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const SourceTableUncheckedCreateNestedManyWithoutPlantingTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedCreateNestedManyWithoutPlantingTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutPlantingTableInputSchema), z.lazy(() => SourceTableCreateWithoutPlantingTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutPlantingTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutPlantingTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutPlantingTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumParentTableFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumParentTableFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => ParentTableSchema).optional(),
});

export const NullableEnumUnitTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumUnitTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => UnitTypeSchema).optional().nullable(),
});

export const ProjectTableUpdateOneRequiredWithoutPlantingTableNestedInputSchema: z.ZodType<Prisma.ProjectTableUpdateOneRequiredWithoutPlantingTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutPlantingTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutPlantingTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProjectTableCreateOrConnectWithoutPlantingTableInputSchema).optional(),
  upsert: z.lazy(() => ProjectTableUpsertWithoutPlantingTableInputSchema).optional(),
  connect: z.lazy(() => ProjectTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProjectTableUpdateToOneWithWhereWithoutPlantingTableInputSchema), z.lazy(() => ProjectTableUpdateWithoutPlantingTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutPlantingTableInputSchema) ]).optional(),
});

export const SourceTableUpdateManyWithoutPlantingTableNestedInputSchema: z.ZodType<Prisma.SourceTableUpdateManyWithoutPlantingTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutPlantingTableInputSchema), z.lazy(() => SourceTableCreateWithoutPlantingTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutPlantingTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutPlantingTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutPlantingTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutPlantingTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutPlantingTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SourceTableUpdateManyWithWhereWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUpdateManyWithWhereWithoutPlantingTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SourceTableScalarWhereInputSchema), z.lazy(() => SourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const SourceTableUncheckedUpdateManyWithoutPlantingTableNestedInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateManyWithoutPlantingTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutPlantingTableInputSchema), z.lazy(() => SourceTableCreateWithoutPlantingTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutPlantingTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutPlantingTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutPlantingTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutPlantingTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutPlantingTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SourceTableUpdateManyWithWhereWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUpdateManyWithWhereWithoutPlantingTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SourceTableScalarWhereInputSchema), z.lazy(() => SourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const CropTableCreateNestedManyWithoutSpeciesTableInputSchema: z.ZodType<Prisma.CropTableCreateNestedManyWithoutSpeciesTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => CropTableCreateWithoutSpeciesTableInputSchema), z.lazy(() => CropTableCreateWithoutSpeciesTableInputSchema).array(), z.lazy(() => CropTableUncheckedCreateWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutSpeciesTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CropTableCreateOrConnectWithoutSpeciesTableInputSchema), z.lazy(() => CropTableCreateOrConnectWithoutSpeciesTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
});

export const CropTableUncheckedCreateNestedManyWithoutSpeciesTableInputSchema: z.ZodType<Prisma.CropTableUncheckedCreateNestedManyWithoutSpeciesTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => CropTableCreateWithoutSpeciesTableInputSchema), z.lazy(() => CropTableCreateWithoutSpeciesTableInputSchema).array(), z.lazy(() => CropTableUncheckedCreateWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutSpeciesTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CropTableCreateOrConnectWithoutSpeciesTableInputSchema), z.lazy(() => CropTableCreateOrConnectWithoutSpeciesTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
});

export const CropTableUpdateManyWithoutSpeciesTableNestedInputSchema: z.ZodType<Prisma.CropTableUpdateManyWithoutSpeciesTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CropTableCreateWithoutSpeciesTableInputSchema), z.lazy(() => CropTableCreateWithoutSpeciesTableInputSchema).array(), z.lazy(() => CropTableUncheckedCreateWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutSpeciesTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CropTableCreateOrConnectWithoutSpeciesTableInputSchema), z.lazy(() => CropTableCreateOrConnectWithoutSpeciesTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CropTableUpsertWithWhereUniqueWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUpsertWithWhereUniqueWithoutSpeciesTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CropTableUpdateWithWhereUniqueWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUpdateWithWhereUniqueWithoutSpeciesTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CropTableUpdateManyWithWhereWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUpdateManyWithWhereWithoutSpeciesTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CropTableScalarWhereInputSchema), z.lazy(() => CropTableScalarWhereInputSchema).array() ]).optional(),
});

export const CropTableUncheckedUpdateManyWithoutSpeciesTableNestedInputSchema: z.ZodType<Prisma.CropTableUncheckedUpdateManyWithoutSpeciesTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CropTableCreateWithoutSpeciesTableInputSchema), z.lazy(() => CropTableCreateWithoutSpeciesTableInputSchema).array(), z.lazy(() => CropTableUncheckedCreateWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutSpeciesTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CropTableCreateOrConnectWithoutSpeciesTableInputSchema), z.lazy(() => CropTableCreateOrConnectWithoutSpeciesTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CropTableUpsertWithWhereUniqueWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUpsertWithWhereUniqueWithoutSpeciesTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CropTableUpdateWithWhereUniqueWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUpdateWithWhereUniqueWithoutSpeciesTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CropTableUpdateManyWithWhereWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUpdateManyWithWhereWithoutSpeciesTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CropTableScalarWhereInputSchema), z.lazy(() => CropTableScalarWhereInputSchema).array() ]).optional(),
});

export const LandTableCreateNestedOneWithoutPolygonTableInputSchema: z.ZodType<Prisma.LandTableCreateNestedOneWithoutPolygonTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => LandTableCreateWithoutPolygonTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutPolygonTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => LandTableCreateOrConnectWithoutPolygonTableInputSchema).optional(),
  connect: z.lazy(() => LandTableWhereUniqueInputSchema).optional(),
});

export const LandTableUpdateOneRequiredWithoutPolygonTableNestedInputSchema: z.ZodType<Prisma.LandTableUpdateOneRequiredWithoutPolygonTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => LandTableCreateWithoutPolygonTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutPolygonTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => LandTableCreateOrConnectWithoutPolygonTableInputSchema).optional(),
  upsert: z.lazy(() => LandTableUpsertWithoutPolygonTableInputSchema).optional(),
  connect: z.lazy(() => LandTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => LandTableUpdateToOneWithWhereWithoutPolygonTableInputSchema), z.lazy(() => LandTableUpdateWithoutPolygonTableInputSchema), z.lazy(() => LandTableUncheckedUpdateWithoutPolygonTableInputSchema) ]).optional(),
});

export const ProjectTableCreateNestedOneWithoutPolyTableInputSchema: z.ZodType<Prisma.ProjectTableCreateNestedOneWithoutPolyTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutPolyTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutPolyTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProjectTableCreateOrConnectWithoutPolyTableInputSchema).optional(),
  connect: z.lazy(() => ProjectTableWhereUniqueInputSchema).optional(),
});

export const NullableFloatFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableFloatFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional().nullable(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const NullableEnumRestorationTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumRestorationTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => RestorationTypeSchema).optional().nullable(),
});

export const ProjectTableUpdateOneRequiredWithoutPolyTableNestedInputSchema: z.ZodType<Prisma.ProjectTableUpdateOneRequiredWithoutPolyTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutPolyTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutPolyTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProjectTableCreateOrConnectWithoutPolyTableInputSchema).optional(),
  upsert: z.lazy(() => ProjectTableUpsertWithoutPolyTableInputSchema).optional(),
  connect: z.lazy(() => ProjectTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProjectTableUpdateToOneWithWhereWithoutPolyTableInputSchema), z.lazy(() => ProjectTableUpdateWithoutPolyTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutPolyTableInputSchema) ]).optional(),
});

export const OrganizationLocalTableCreateNestedOneWithoutStakeholderTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateNestedOneWithoutStakeholderTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutStakeholderTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutStakeholderTableInputSchema).optional(),
  connect: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).optional(),
});

export const ProjectTableCreateNestedOneWithoutStakeholderTableInputSchema: z.ZodType<Prisma.ProjectTableCreateNestedOneWithoutStakeholderTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutStakeholderTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProjectTableCreateOrConnectWithoutStakeholderTableInputSchema).optional(),
  connect: z.lazy(() => ProjectTableWhereUniqueInputSchema).optional(),
});

export const NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumStakeholderTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
});

export const OrganizationLocalTableUpdateOneRequiredWithoutStakeholderTableNestedInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateOneRequiredWithoutStakeholderTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutStakeholderTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutStakeholderTableInputSchema).optional(),
  upsert: z.lazy(() => OrganizationLocalTableUpsertWithoutStakeholderTableInputSchema).optional(),
  connect: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => OrganizationLocalTableUpdateToOneWithWhereWithoutStakeholderTableInputSchema), z.lazy(() => OrganizationLocalTableUpdateWithoutStakeholderTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutStakeholderTableInputSchema) ]).optional(),
});

export const ProjectTableUpdateOneWithoutStakeholderTableNestedInputSchema: z.ZodType<Prisma.ProjectTableUpdateOneWithoutStakeholderTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutStakeholderTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProjectTableCreateOrConnectWithoutStakeholderTableInputSchema).optional(),
  upsert: z.lazy(() => ProjectTableUpsertWithoutStakeholderTableInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => ProjectTableWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => ProjectTableWhereInputSchema) ]).optional(),
  connect: z.lazy(() => ProjectTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProjectTableUpdateToOneWithWhereWithoutStakeholderTableInputSchema), z.lazy(() => ProjectTableUpdateWithoutStakeholderTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutStakeholderTableInputSchema) ]).optional(),
});

export const ClaimTableCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.ClaimTableCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ClaimTableCreateWithoutSourceTableInputSchema), z.lazy(() => ClaimTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => ClaimTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ClaimTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => ClaimTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ClaimTableCreateManySourceTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
});

export const CropTableCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.CropTableCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => CropTableCreateWithoutSourceTableInputSchema), z.lazy(() => CropTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => CropTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CropTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => CropTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
});

export const LandTableCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.LandTableCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => LandTableCreateWithoutSourceTableInputSchema), z.lazy(() => LandTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => LandTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => LandTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => LandTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
});

export const OrganizationLocalTableCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
});

export const PlantingTableCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.PlantingTableCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => PlantingTableCreateWithoutSourceTableInputSchema), z.lazy(() => PlantingTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => PlantingTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlantingTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => PlantingTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
});

export const ProjectTableCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.ProjectTableCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutSourceTableInputSchema), z.lazy(() => ProjectTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => ProjectTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProjectTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => ProjectTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
});

export const ClaimTableUncheckedCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.ClaimTableUncheckedCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ClaimTableCreateWithoutSourceTableInputSchema), z.lazy(() => ClaimTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => ClaimTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ClaimTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => ClaimTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ClaimTableCreateManySourceTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
});

export const CropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.CropTableUncheckedCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => CropTableCreateWithoutSourceTableInputSchema), z.lazy(() => CropTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => CropTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CropTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => CropTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
});

export const LandTableUncheckedCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.LandTableUncheckedCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => LandTableCreateWithoutSourceTableInputSchema), z.lazy(() => LandTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => LandTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => LandTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => LandTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
});

export const OrganizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
});

export const PlantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.PlantingTableUncheckedCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => PlantingTableCreateWithoutSourceTableInputSchema), z.lazy(() => PlantingTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => PlantingTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlantingTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => PlantingTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
});

export const ProjectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutSourceTableInputSchema), z.lazy(() => ProjectTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => ProjectTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProjectTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => ProjectTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
});

export const NullableEnumUrlTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumUrlTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => UrlTypeSchema).optional().nullable(),
});

export const NullableEnumParentTableFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumParentTableFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => ParentTableSchema).optional().nullable(),
});

export const NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumDisclosureTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
});

export const ClaimTableUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.ClaimTableUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ClaimTableCreateWithoutSourceTableInputSchema), z.lazy(() => ClaimTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => ClaimTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ClaimTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => ClaimTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ClaimTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ClaimTableCreateManySourceTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ClaimTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ClaimTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ClaimTableScalarWhereInputSchema), z.lazy(() => ClaimTableScalarWhereInputSchema).array() ]).optional(),
});

export const CropTableUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.CropTableUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CropTableCreateWithoutSourceTableInputSchema), z.lazy(() => CropTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => CropTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CropTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => CropTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CropTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => CropTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CropTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => CropTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CropTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => CropTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CropTableScalarWhereInputSchema), z.lazy(() => CropTableScalarWhereInputSchema).array() ]).optional(),
});

export const LandTableUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.LandTableUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => LandTableCreateWithoutSourceTableInputSchema), z.lazy(() => LandTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => LandTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => LandTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => LandTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => LandTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => LandTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => LandTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => LandTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => LandTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => LandTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => LandTableScalarWhereInputSchema), z.lazy(() => LandTableScalarWhereInputSchema).array() ]).optional(),
});

export const OrganizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrganizationLocalTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrganizationLocalTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrganizationLocalTableScalarWhereInputSchema), z.lazy(() => OrganizationLocalTableScalarWhereInputSchema).array() ]).optional(),
});

export const PlantingTableUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.PlantingTableUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PlantingTableCreateWithoutSourceTableInputSchema), z.lazy(() => PlantingTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => PlantingTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlantingTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => PlantingTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PlantingTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PlantingTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PlantingTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PlantingTableScalarWhereInputSchema), z.lazy(() => PlantingTableScalarWhereInputSchema).array() ]).optional(),
});

export const ProjectTableUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.ProjectTableUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutSourceTableInputSchema), z.lazy(() => ProjectTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => ProjectTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProjectTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => ProjectTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ProjectTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ProjectTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ProjectTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ProjectTableScalarWhereInputSchema), z.lazy(() => ProjectTableScalarWhereInputSchema).array() ]).optional(),
});

export const ClaimTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.ClaimTableUncheckedUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ClaimTableCreateWithoutSourceTableInputSchema), z.lazy(() => ClaimTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => ClaimTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ClaimTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => ClaimTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ClaimTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ClaimTableCreateManySourceTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ClaimTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ClaimTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ClaimTableScalarWhereInputSchema), z.lazy(() => ClaimTableScalarWhereInputSchema).array() ]).optional(),
});

export const CropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.CropTableUncheckedUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CropTableCreateWithoutSourceTableInputSchema), z.lazy(() => CropTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => CropTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CropTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => CropTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CropTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => CropTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CropTableWhereUniqueInputSchema), z.lazy(() => CropTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CropTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => CropTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CropTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => CropTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CropTableScalarWhereInputSchema), z.lazy(() => CropTableScalarWhereInputSchema).array() ]).optional(),
});

export const LandTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.LandTableUncheckedUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => LandTableCreateWithoutSourceTableInputSchema), z.lazy(() => LandTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => LandTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => LandTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => LandTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => LandTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => LandTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => LandTableWhereUniqueInputSchema), z.lazy(() => LandTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => LandTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => LandTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => LandTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => LandTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => LandTableScalarWhereInputSchema), z.lazy(() => LandTableScalarWhereInputSchema).array() ]).optional(),
});

export const OrganizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrganizationLocalTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrganizationLocalTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrganizationLocalTableScalarWhereInputSchema), z.lazy(() => OrganizationLocalTableScalarWhereInputSchema).array() ]).optional(),
});

export const PlantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.PlantingTableUncheckedUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PlantingTableCreateWithoutSourceTableInputSchema), z.lazy(() => PlantingTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => PlantingTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlantingTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => PlantingTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PlantingTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PlantingTableWhereUniqueInputSchema), z.lazy(() => PlantingTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PlantingTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PlantingTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PlantingTableScalarWhereInputSchema), z.lazy(() => PlantingTableScalarWhereInputSchema).array() ]).optional(),
});

export const ProjectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutSourceTableInputSchema), z.lazy(() => ProjectTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => ProjectTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProjectTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => ProjectTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ProjectTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ProjectTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ProjectTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ProjectTableScalarWhereInputSchema), z.lazy(() => ProjectTableScalarWhereInputSchema).array() ]).optional(),
});

export const OrganizationLocalTableCreateNestedOneWithoutClaimTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateNestedOneWithoutClaimTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutClaimTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutClaimTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutClaimTableInputSchema).optional(),
  connect: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).optional(),
});

export const SourceTableCreateNestedOneWithoutClaimTableInputSchema: z.ZodType<Prisma.SourceTableCreateNestedOneWithoutClaimTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutClaimTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutClaimTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SourceTableCreateOrConnectWithoutClaimTableInputSchema).optional(),
  connect: z.lazy(() => SourceTableWhereUniqueInputSchema).optional(),
});

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const OrganizationLocalTableUpdateOneRequiredWithoutClaimTableNestedInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateOneRequiredWithoutClaimTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutClaimTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutClaimTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutClaimTableInputSchema).optional(),
  upsert: z.lazy(() => OrganizationLocalTableUpsertWithoutClaimTableInputSchema).optional(),
  connect: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => OrganizationLocalTableUpdateToOneWithWhereWithoutClaimTableInputSchema), z.lazy(() => OrganizationLocalTableUpdateWithoutClaimTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutClaimTableInputSchema) ]).optional(),
});

export const SourceTableUpdateOneRequiredWithoutClaimTableNestedInputSchema: z.ZodType<Prisma.SourceTableUpdateOneRequiredWithoutClaimTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutClaimTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutClaimTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SourceTableCreateOrConnectWithoutClaimTableInputSchema).optional(),
  upsert: z.lazy(() => SourceTableUpsertWithoutClaimTableInputSchema).optional(),
  connect: z.lazy(() => SourceTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => SourceTableUpdateToOneWithWhereWithoutClaimTableInputSchema), z.lazy(() => SourceTableUpdateWithoutClaimTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutClaimTableInputSchema) ]).optional(),
});

export const ClaimTableCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ClaimTableCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ClaimTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => ClaimTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ClaimTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ClaimTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
});

export const OrganizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.OrganizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationMasterTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => OrganizationMasterTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationMasterTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).optional(),
  connect: z.lazy(() => OrganizationMasterTableWhereUniqueInputSchema).optional(),
});

export const ProjectTableCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ProjectTableCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => ProjectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProjectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProjectTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
});

export const StakeholderTableCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.StakeholderTableCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => StakeholderTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => StakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => StakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => StakeholderTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
});

export const SourceTableCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.SourceTableCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const ClaimTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ClaimTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ClaimTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => ClaimTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ClaimTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ClaimTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
});

export const ProjectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => ProjectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProjectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProjectTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
});

export const StakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => StakeholderTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => StakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => StakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => StakeholderTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
});

export const SourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const ClaimTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.ClaimTableUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ClaimTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => ClaimTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ClaimTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ClaimTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ClaimTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ClaimTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ClaimTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ClaimTableScalarWhereInputSchema), z.lazy(() => ClaimTableScalarWhereInputSchema).array() ]).optional(),
});

export const OrganizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.OrganizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationMasterTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => OrganizationMasterTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationMasterTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).optional(),
  upsert: z.lazy(() => OrganizationMasterTableUpsertWithoutOrganizationLocalTableInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => OrganizationMasterTableWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => OrganizationMasterTableWhereInputSchema) ]).optional(),
  connect: z.lazy(() => OrganizationMasterTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => OrganizationMasterTableUpdateToOneWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => OrganizationMasterTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => OrganizationMasterTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]).optional(),
});

export const ProjectTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.ProjectTableUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => ProjectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProjectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ProjectTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProjectTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ProjectTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ProjectTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ProjectTableScalarWhereInputSchema), z.lazy(() => ProjectTableScalarWhereInputSchema).array() ]).optional(),
});

export const StakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.StakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => StakeholderTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => StakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => StakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => StakeholderTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => StakeholderTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => StakeholderTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => StakeholderTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => StakeholderTableScalarWhereInputSchema), z.lazy(() => StakeholderTableScalarWhereInputSchema).array() ]).optional(),
});

export const SourceTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.SourceTableUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SourceTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SourceTableScalarWhereInputSchema), z.lazy(() => SourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const ClaimTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.ClaimTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ClaimTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => ClaimTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ClaimTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ClaimTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ClaimTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ClaimTableWhereUniqueInputSchema), z.lazy(() => ClaimTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ClaimTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ClaimTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ClaimTableScalarWhereInputSchema), z.lazy(() => ClaimTableScalarWhereInputSchema).array() ]).optional(),
});

export const ProjectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => ProjectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProjectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ProjectTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProjectTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ProjectTableWhereUniqueInputSchema), z.lazy(() => ProjectTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ProjectTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ProjectTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ProjectTableScalarWhereInputSchema), z.lazy(() => ProjectTableScalarWhereInputSchema).array() ]).optional(),
});

export const StakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => StakeholderTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => StakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => StakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => StakeholderTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => StakeholderTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => StakeholderTableWhereUniqueInputSchema), z.lazy(() => StakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => StakeholderTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => StakeholderTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => StakeholderTableScalarWhereInputSchema), z.lazy(() => StakeholderTableScalarWhereInputSchema).array() ]).optional(),
});

export const SourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SourceTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => SourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SourceTableWhereUniqueInputSchema), z.lazy(() => SourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SourceTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SourceTableScalarWhereInputSchema), z.lazy(() => SourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const OrganizationLocalTableCreateNestedManyWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateNestedManyWithoutOrganizationMasterTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableCreateWithoutOrganizationMasterTableInputSchema).array(), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationLocalTableCreateManyOrganizationMasterTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
});

export const OrganizationLocalTableUncheckedCreateNestedManyWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedCreateNestedManyWithoutOrganizationMasterTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableCreateWithoutOrganizationMasterTableInputSchema).array(), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationLocalTableCreateManyOrganizationMasterTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
});

export const OrganizationLocalTableUpdateManyWithoutOrganizationMasterTableNestedInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateManyWithoutOrganizationMasterTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableCreateWithoutOrganizationMasterTableInputSchema).array(), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrganizationLocalTableUpsertWithWhereUniqueWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUpsertWithWhereUniqueWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationLocalTableCreateManyOrganizationMasterTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithWhereUniqueWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUpdateWithWhereUniqueWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrganizationLocalTableUpdateManyWithWhereWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUpdateManyWithWhereWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrganizationLocalTableScalarWhereInputSchema), z.lazy(() => OrganizationLocalTableScalarWhereInputSchema).array() ]).optional(),
});

export const OrganizationLocalTableUncheckedUpdateManyWithoutOrganizationMasterTableNestedInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedUpdateManyWithoutOrganizationMasterTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableCreateWithoutOrganizationMasterTableInputSchema).array(), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrganizationLocalTableUpsertWithWhereUniqueWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUpsertWithWhereUniqueWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationLocalTableCreateManyOrganizationMasterTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema), z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithWhereUniqueWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUpdateWithWhereUniqueWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrganizationLocalTableUpdateManyWithWhereWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUpdateManyWithWhereWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrganizationLocalTableScalarWhereInputSchema), z.lazy(() => OrganizationLocalTableScalarWhereInputSchema).array() ]).optional(),
});

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedBoolNullableFilterSchema: z.ZodType<Prisma.NestedBoolNullableFilter> = z.strictObject({
  equals: z.boolean().optional().nullable(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumCarbonRegistryTypeNullableFilterSchema: z.ZodType<Prisma.NestedEnumCarbonRegistryTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  in: z.lazy(() => CarbonRegistryTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => CarbonRegistryTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NestedEnumCarbonRegistryTypeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumCarbonRegistryNullableFilterSchema: z.ZodType<Prisma.NestedEnumCarbonRegistryNullableFilter> = z.strictObject({
  equals: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  in: z.lazy(() => CarbonRegistrySchema).array().optional().nullable(),
  notIn: z.lazy(() => CarbonRegistrySchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NestedEnumCarbonRegistryNullableFilterSchema) ]).optional().nullable(),
});

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const NestedBoolNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolNullableWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional().nullable(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolNullableFilterSchema).optional(),
});

export const NestedEnumCarbonRegistryTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumCarbonRegistryTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  in: z.lazy(() => CarbonRegistryTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => CarbonRegistryTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NestedEnumCarbonRegistryTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCarbonRegistryTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCarbonRegistryTypeNullableFilterSchema).optional(),
});

export const NestedEnumCarbonRegistryNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumCarbonRegistryNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  in: z.lazy(() => CarbonRegistrySchema).array().optional().nullable(),
  notIn: z.lazy(() => CarbonRegistrySchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NestedEnumCarbonRegistryNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCarbonRegistryNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCarbonRegistryNullableFilterSchema).optional(),
});

export const NestedIntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const NestedFloatNullableFilterSchema: z.ZodType<Prisma.NestedFloatNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
});

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const NestedDecimalNullableFilterSchema: z.ZodType<Prisma.NestedDecimalNullableFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(PrismaDecimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(PrismaDecimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumTreatmentTypeNullableFilterSchema: z.ZodType<Prisma.NestedEnumTreatmentTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  in: z.lazy(() => TreatmentTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => TreatmentTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NestedEnumTreatmentTypeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDecimalNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDecimalNullableWithAggregatesFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(PrismaDecimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(PrismaDecimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
});

export const NestedEnumTreatmentTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumTreatmentTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  in: z.lazy(() => TreatmentTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => TreatmentTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NestedEnumTreatmentTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTreatmentTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTreatmentTypeNullableFilterSchema).optional(),
});

export const NestedEnumParentTableFilterSchema: z.ZodType<Prisma.NestedEnumParentTableFilter> = z.strictObject({
  equals: z.lazy(() => ParentTableSchema).optional(),
  in: z.lazy(() => ParentTableSchema).array().optional(),
  notIn: z.lazy(() => ParentTableSchema).array().optional(),
  not: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NestedEnumParentTableFilterSchema) ]).optional(),
});

export const NestedEnumUnitTypeNullableFilterSchema: z.ZodType<Prisma.NestedEnumUnitTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => UnitTypeSchema).optional().nullable(),
  in: z.lazy(() => UnitTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => UnitTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NestedEnumUnitTypeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumParentTableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumParentTableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => ParentTableSchema).optional(),
  in: z.lazy(() => ParentTableSchema).array().optional(),
  notIn: z.lazy(() => ParentTableSchema).array().optional(),
  not: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NestedEnumParentTableWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumParentTableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumParentTableFilterSchema).optional(),
});

export const NestedEnumUnitTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumUnitTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => UnitTypeSchema).optional().nullable(),
  in: z.lazy(() => UnitTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => UnitTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NestedEnumUnitTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumUnitTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumUnitTypeNullableFilterSchema).optional(),
});

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const NestedEnumRestorationTypeNullableFilterSchema: z.ZodType<Prisma.NestedEnumRestorationTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => RestorationTypeSchema).optional().nullable(),
  in: z.lazy(() => RestorationTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => RestorationTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => RestorationTypeSchema), z.lazy(() => NestedEnumRestorationTypeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedFloatNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedFloatNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
});

export const NestedEnumRestorationTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumRestorationTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => RestorationTypeSchema).optional().nullable(),
  in: z.lazy(() => RestorationTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => RestorationTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => RestorationTypeSchema), z.lazy(() => NestedEnumRestorationTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumRestorationTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumRestorationTypeNullableFilterSchema).optional(),
});

export const NestedEnumStakeholderTypeNullableFilterSchema: z.ZodType<Prisma.NestedEnumStakeholderTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  in: z.lazy(() => StakeholderTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => StakeholderTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NestedEnumStakeholderTypeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumStakeholderTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumStakeholderTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  in: z.lazy(() => StakeholderTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => StakeholderTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NestedEnumStakeholderTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumStakeholderTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumStakeholderTypeNullableFilterSchema).optional(),
});

export const NestedEnumUrlTypeNullableFilterSchema: z.ZodType<Prisma.NestedEnumUrlTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => UrlTypeSchema).optional().nullable(),
  in: z.lazy(() => UrlTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => UrlTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NestedEnumUrlTypeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumParentTableNullableFilterSchema: z.ZodType<Prisma.NestedEnumParentTableNullableFilter> = z.strictObject({
  equals: z.lazy(() => ParentTableSchema).optional().nullable(),
  in: z.lazy(() => ParentTableSchema).array().optional().nullable(),
  notIn: z.lazy(() => ParentTableSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NestedEnumParentTableNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumDisclosureTypeNullableFilterSchema: z.ZodType<Prisma.NestedEnumDisclosureTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  in: z.lazy(() => DisclosureTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => DisclosureTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NestedEnumDisclosureTypeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumUrlTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumUrlTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => UrlTypeSchema).optional().nullable(),
  in: z.lazy(() => UrlTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => UrlTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NestedEnumUrlTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumUrlTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumUrlTypeNullableFilterSchema).optional(),
});

export const NestedEnumParentTableNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumParentTableNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => ParentTableSchema).optional().nullable(),
  in: z.lazy(() => ParentTableSchema).array().optional().nullable(),
  notIn: z.lazy(() => ParentTableSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NestedEnumParentTableNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumParentTableNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumParentTableNullableFilterSchema).optional(),
});

export const NestedEnumDisclosureTypeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumDisclosureTypeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  in: z.lazy(() => DisclosureTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => DisclosureTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NestedEnumDisclosureTypeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumDisclosureTypeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumDisclosureTypeNullableFilterSchema).optional(),
});

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
});

export const CropTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.CropTableCreateWithoutProjectTableInput> = z.strictObject({
  cropId: z.string(),
  cropName: z.string(),
  speciesLocalName: z.string().optional().nullable(),
  speciesId: z.string().optional().nullable(),
  seedInfo: z.string().optional().nullable(),
  cropStock: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  organizationLocalName: z.string().optional().nullable(),
  cropNotes: z.string().optional().nullable(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutCropTableInputSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const CropTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.CropTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
  cropId: z.string(),
  cropName: z.string(),
  speciesLocalName: z.string().optional().nullable(),
  speciesId: z.string().optional().nullable(),
  seedInfo: z.string().optional().nullable(),
  cropStock: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  organizationLocalName: z.string().optional().nullable(),
  cropNotes: z.string().optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutCropTableInputSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableUncheckedCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const CropTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.CropTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => CropTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CropTableCreateWithoutProjectTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const CropTableCreateManyProjectTableInputEnvelopeSchema: z.ZodType<Prisma.CropTableCreateManyProjectTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => CropTableCreateManyProjectTableInputSchema), z.lazy(() => CropTableCreateManyProjectTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const LandTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.LandTableCreateWithoutProjectTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  PolygonTable: z.lazy(() => PolygonTableCreateNestedManyWithoutLandTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const LandTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.LandTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  PolygonTable: z.lazy(() => PolygonTableUncheckedCreateNestedManyWithoutLandTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const LandTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.LandTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => LandTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => LandTableCreateWithoutProjectTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const LandTableCreateManyProjectTableInputEnvelopeSchema: z.ZodType<Prisma.LandTableCreateManyProjectTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => LandTableCreateManyProjectTableInputSchema), z.lazy(() => LandTableCreateManyProjectTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PlantingTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.PlantingTableCreateWithoutProjectTableInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutPlantingTableInputSchema).optional(),
});

export const PlantingTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.PlantingTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutPlantingTableInputSchema).optional(),
});

export const PlantingTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.PlantingTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => PlantingTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PlantingTableCreateWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const PlantingTableCreateManyProjectTableInputEnvelopeSchema: z.ZodType<Prisma.PlantingTableCreateManyProjectTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => PlantingTableCreateManyProjectTableInputSchema), z.lazy(() => PlantingTableCreateManyProjectTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PolyTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.PolyTableCreateWithoutProjectTableInput> = z.strictObject({
  polyId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  randomJson: z.string().optional().nullable(),
  survivalRate: z.number().optional().nullable(),
  liabilityCause: z.string().optional().nullable(),
  ratePerTree: z.number().optional().nullable(),
  motivation: z.string().optional().nullable(),
  restorationType: z.lazy(() => RestorationTypeSchema).optional().nullable(),
  reviews: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
});

export const PolyTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.PolyTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
  polyId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  randomJson: z.string().optional().nullable(),
  survivalRate: z.number().optional().nullable(),
  liabilityCause: z.string().optional().nullable(),
  ratePerTree: z.number().optional().nullable(),
  motivation: z.string().optional().nullable(),
  restorationType: z.lazy(() => RestorationTypeSchema).optional().nullable(),
  reviews: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
});

export const PolyTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.PolyTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => PolyTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PolyTableCreateWithoutProjectTableInputSchema), z.lazy(() => PolyTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const PolyTableCreateManyProjectTableInputEnvelopeSchema: z.ZodType<Prisma.PolyTableCreateManyProjectTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => PolyTableCreateManyProjectTableInputSchema), z.lazy(() => PolyTableCreateManyProjectTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const OrganizationLocalTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateWithoutProjectTableInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  organizationMasterId: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const OrganizationLocalTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutProjectTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const StakeholderTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.StakeholderTableCreateWithoutProjectTableInput> = z.strictObject({
  stakeholderId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedOneWithoutStakeholderTableInputSchema),
});

export const StakeholderTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
  stakeholderId: z.string(),
  organizationLocalId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const StakeholderTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.StakeholderTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => StakeholderTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => StakeholderTableCreateWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const StakeholderTableCreateManyProjectTableInputEnvelopeSchema: z.ZodType<Prisma.StakeholderTableCreateManyProjectTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => StakeholderTableCreateManyProjectTableInputSchema), z.lazy(() => StakeholderTableCreateManyProjectTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const SourceTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.SourceTableCreateWithoutProjectTableInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.SourceTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SourceTableCreateWithoutProjectTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const CropTableUpsertWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.CropTableUpsertWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => CropTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CropTableUpdateWithoutProjectTableInputSchema), z.lazy(() => CropTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => CropTableCreateWithoutProjectTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const CropTableUpdateWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.CropTableUpdateWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => CropTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CropTableUpdateWithoutProjectTableInputSchema), z.lazy(() => CropTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const CropTableUpdateManyWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.CropTableUpdateManyWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => CropTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CropTableUpdateManyMutationInputSchema), z.lazy(() => CropTableUncheckedUpdateManyWithoutProjectTableInputSchema) ]),
});

export const CropTableScalarWhereInputSchema: z.ZodType<Prisma.CropTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CropTableScalarWhereInputSchema), z.lazy(() => CropTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CropTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CropTableScalarWhereInputSchema), z.lazy(() => CropTableScalarWhereInputSchema).array() ]).optional(),
  cropId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  cropName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  speciesLocalName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  speciesId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  seedInfo: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  cropStock: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  organizationLocalName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  cropNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
});

export const LandTableUpsertWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.LandTableUpsertWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => LandTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => LandTableUpdateWithoutProjectTableInputSchema), z.lazy(() => LandTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => LandTableCreateWithoutProjectTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const LandTableUpdateWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.LandTableUpdateWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => LandTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => LandTableUpdateWithoutProjectTableInputSchema), z.lazy(() => LandTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const LandTableUpdateManyWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.LandTableUpdateManyWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => LandTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => LandTableUpdateManyMutationInputSchema), z.lazy(() => LandTableUncheckedUpdateManyWithoutProjectTableInputSchema) ]),
});

export const LandTableScalarWhereInputSchema: z.ZodType<Prisma.LandTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => LandTableScalarWhereInputSchema), z.lazy(() => LandTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => LandTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LandTableScalarWhereInputSchema), z.lazy(() => LandTableScalarWhereInputSchema).array() ]).optional(),
  landId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  hectares: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  landNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => EnumTreatmentTypeNullableFilterSchema), z.lazy(() => TreatmentTypeSchema) ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  preparation: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
});

export const PlantingTableUpsertWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.PlantingTableUpsertWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => PlantingTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PlantingTableUpdateWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => PlantingTableCreateWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const PlantingTableUpdateWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.PlantingTableUpdateWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => PlantingTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PlantingTableUpdateWithoutProjectTableInputSchema), z.lazy(() => PlantingTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const PlantingTableUpdateManyWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.PlantingTableUpdateManyWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => PlantingTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PlantingTableUpdateManyMutationInputSchema), z.lazy(() => PlantingTableUncheckedUpdateManyWithoutProjectTableInputSchema) ]),
});

export const PlantingTableScalarWhereInputSchema: z.ZodType<Prisma.PlantingTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PlantingTableScalarWhereInputSchema), z.lazy(() => PlantingTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PlantingTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PlantingTableScalarWhereInputSchema), z.lazy(() => PlantingTableScalarWhereInputSchema).array() ]).optional(),
  plantingId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  planted: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  allocated: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  plantingDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  units: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => EnumUnitTypeNullableFilterSchema), z.lazy(() => UnitTypeSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  currency: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
});

export const PolyTableUpsertWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.PolyTableUpsertWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => PolyTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PolyTableUpdateWithoutProjectTableInputSchema), z.lazy(() => PolyTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => PolyTableCreateWithoutProjectTableInputSchema), z.lazy(() => PolyTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const PolyTableUpdateWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.PolyTableUpdateWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => PolyTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PolyTableUpdateWithoutProjectTableInputSchema), z.lazy(() => PolyTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const PolyTableUpdateManyWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.PolyTableUpdateManyWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => PolyTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PolyTableUpdateManyMutationInputSchema), z.lazy(() => PolyTableUncheckedUpdateManyWithoutProjectTableInputSchema) ]),
});

export const PolyTableScalarWhereInputSchema: z.ZodType<Prisma.PolyTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PolyTableScalarWhereInputSchema), z.lazy(() => PolyTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PolyTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PolyTableScalarWhereInputSchema), z.lazy(() => PolyTableScalarWhereInputSchema).array() ]).optional(),
  polyId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  randomJson: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  survivalRate: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  liabilityCause: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  ratePerTree: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  motivation: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  restorationType: z.union([ z.lazy(() => EnumRestorationTypeNullableFilterSchema), z.lazy(() => RestorationTypeSchema) ]).optional().nullable(),
  reviews: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
});

export const OrganizationLocalTableUpsertWithoutProjectTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpsertWithoutProjectTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithoutProjectTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutProjectTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutProjectTableInputSchema) ]),
  where: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional(),
});

export const OrganizationLocalTableUpdateToOneWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateToOneWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithoutProjectTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const OrganizationLocalTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateWithoutProjectTableInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const StakeholderTableUpsertWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.StakeholderTableUpsertWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => StakeholderTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => StakeholderTableUpdateWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => StakeholderTableCreateWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const StakeholderTableUpdateWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.StakeholderTableUpdateWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => StakeholderTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => StakeholderTableUpdateWithoutProjectTableInputSchema), z.lazy(() => StakeholderTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const StakeholderTableUpdateManyWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.StakeholderTableUpdateManyWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => StakeholderTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => StakeholderTableUpdateManyMutationInputSchema), z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutProjectTableInputSchema) ]),
});

export const StakeholderTableScalarWhereInputSchema: z.ZodType<Prisma.StakeholderTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => StakeholderTableScalarWhereInputSchema), z.lazy(() => StakeholderTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => StakeholderTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StakeholderTableScalarWhereInputSchema), z.lazy(() => StakeholderTableScalarWhereInputSchema).array() ]).optional(),
  stakeholderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => EnumStakeholderTypeNullableFilterSchema), z.lazy(() => StakeholderTypeSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const SourceTableUpsertWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.SourceTableUpsertWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SourceTableUpdateWithoutProjectTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => SourceTableCreateWithoutProjectTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const SourceTableUpdateWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.SourceTableUpdateWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SourceTableUpdateWithoutProjectTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const SourceTableUpdateManyWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.SourceTableUpdateManyWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SourceTableUpdateManyMutationInputSchema), z.lazy(() => SourceTableUncheckedUpdateManyWithoutProjectTableInputSchema) ]),
});

export const SourceTableScalarWhereInputSchema: z.ZodType<Prisma.SourceTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SourceTableScalarWhereInputSchema), z.lazy(() => SourceTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SourceTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SourceTableScalarWhereInputSchema), z.lazy(() => SourceTableScalarWhereInputSchema).array() ]).optional(),
  sourceId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  urlType: z.union([ z.lazy(() => EnumUrlTypeNullableFilterSchema), z.lazy(() => UrlTypeSchema) ]).optional().nullable(),
  parentId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => EnumParentTableNullableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional().nullable(),
  projectId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => EnumDisclosureTypeNullableFilterSchema), z.lazy(() => DisclosureTypeSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  sourceCredit: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const ProjectTableCreateWithoutLandTableInputSchema: z.ZodType<Prisma.ProjectTableCreateWithoutLandTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableUncheckedCreateWithoutLandTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedCreateWithoutLandTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableCreateOrConnectWithoutLandTableInputSchema: z.ZodType<Prisma.ProjectTableCreateOrConnectWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutLandTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutLandTableInputSchema) ]),
});

export const PolygonTableCreateWithoutLandTableInputSchema: z.ZodType<Prisma.PolygonTableCreateWithoutLandTableInput> = z.strictObject({
  polygonId: z.string(),
  landName: z.string().optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
});

export const PolygonTableUncheckedCreateWithoutLandTableInputSchema: z.ZodType<Prisma.PolygonTableUncheckedCreateWithoutLandTableInput> = z.strictObject({
  polygonId: z.string(),
  landName: z.string().optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
});

export const PolygonTableCreateOrConnectWithoutLandTableInputSchema: z.ZodType<Prisma.PolygonTableCreateOrConnectWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => PolygonTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PolygonTableCreateWithoutLandTableInputSchema), z.lazy(() => PolygonTableUncheckedCreateWithoutLandTableInputSchema) ]),
});

export const PolygonTableCreateManyLandTableInputEnvelopeSchema: z.ZodType<Prisma.PolygonTableCreateManyLandTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => PolygonTableCreateManyLandTableInputSchema), z.lazy(() => PolygonTableCreateManyLandTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const SourceTableCreateWithoutLandTableInputSchema: z.ZodType<Prisma.SourceTableCreateWithoutLandTableInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableUncheckedCreateWithoutLandTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedCreateWithoutLandTableInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableCreateOrConnectWithoutLandTableInputSchema: z.ZodType<Prisma.SourceTableCreateOrConnectWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SourceTableCreateWithoutLandTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutLandTableInputSchema) ]),
});

export const ProjectTableUpsertWithoutLandTableInputSchema: z.ZodType<Prisma.ProjectTableUpsertWithoutLandTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => ProjectTableUpdateWithoutLandTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutLandTableInputSchema) ]),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutLandTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutLandTableInputSchema) ]),
  where: z.lazy(() => ProjectTableWhereInputSchema).optional(),
});

export const ProjectTableUpdateToOneWithWhereWithoutLandTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateToOneWithWhereWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProjectTableUpdateWithoutLandTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutLandTableInputSchema) ]),
});

export const ProjectTableUpdateWithoutLandTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateWithoutLandTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const ProjectTableUncheckedUpdateWithoutLandTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateWithoutLandTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const PolygonTableUpsertWithWhereUniqueWithoutLandTableInputSchema: z.ZodType<Prisma.PolygonTableUpsertWithWhereUniqueWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => PolygonTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PolygonTableUpdateWithoutLandTableInputSchema), z.lazy(() => PolygonTableUncheckedUpdateWithoutLandTableInputSchema) ]),
  create: z.union([ z.lazy(() => PolygonTableCreateWithoutLandTableInputSchema), z.lazy(() => PolygonTableUncheckedCreateWithoutLandTableInputSchema) ]),
});

export const PolygonTableUpdateWithWhereUniqueWithoutLandTableInputSchema: z.ZodType<Prisma.PolygonTableUpdateWithWhereUniqueWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => PolygonTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PolygonTableUpdateWithoutLandTableInputSchema), z.lazy(() => PolygonTableUncheckedUpdateWithoutLandTableInputSchema) ]),
});

export const PolygonTableUpdateManyWithWhereWithoutLandTableInputSchema: z.ZodType<Prisma.PolygonTableUpdateManyWithWhereWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => PolygonTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PolygonTableUpdateManyMutationInputSchema), z.lazy(() => PolygonTableUncheckedUpdateManyWithoutLandTableInputSchema) ]),
});

export const PolygonTableScalarWhereInputSchema: z.ZodType<Prisma.PolygonTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PolygonTableScalarWhereInputSchema), z.lazy(() => PolygonTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PolygonTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PolygonTableScalarWhereInputSchema), z.lazy(() => PolygonTableScalarWhereInputSchema).array() ]).optional(),
  polygonId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  geometry: z.lazy(() => JsonNullableFilterSchema).optional(),
  polygonNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const SourceTableUpsertWithWhereUniqueWithoutLandTableInputSchema: z.ZodType<Prisma.SourceTableUpsertWithWhereUniqueWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SourceTableUpdateWithoutLandTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutLandTableInputSchema) ]),
  create: z.union([ z.lazy(() => SourceTableCreateWithoutLandTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutLandTableInputSchema) ]),
});

export const SourceTableUpdateWithWhereUniqueWithoutLandTableInputSchema: z.ZodType<Prisma.SourceTableUpdateWithWhereUniqueWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SourceTableUpdateWithoutLandTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutLandTableInputSchema) ]),
});

export const SourceTableUpdateManyWithWhereWithoutLandTableInputSchema: z.ZodType<Prisma.SourceTableUpdateManyWithWhereWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SourceTableUpdateManyMutationInputSchema), z.lazy(() => SourceTableUncheckedUpdateManyWithoutLandTableInputSchema) ]),
});

export const ProjectTableCreateWithoutCropTableInputSchema: z.ZodType<Prisma.ProjectTableCreateWithoutCropTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableUncheckedCreateWithoutCropTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedCreateWithoutCropTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableCreateOrConnectWithoutCropTableInputSchema: z.ZodType<Prisma.ProjectTableCreateOrConnectWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutCropTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutCropTableInputSchema) ]),
});

export const SourceTableCreateWithoutCropTableInputSchema: z.ZodType<Prisma.SourceTableCreateWithoutCropTableInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableUncheckedCreateWithoutCropTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedCreateWithoutCropTableInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableCreateOrConnectWithoutCropTableInputSchema: z.ZodType<Prisma.SourceTableCreateOrConnectWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SourceTableCreateWithoutCropTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutCropTableInputSchema) ]),
});

export const SpeciesTableCreateWithoutCropTableInputSchema: z.ZodType<Prisma.SpeciesTableCreateWithoutCropTableInput> = z.strictObject({
  speciesName: z.string(),
  commonName: z.string(),
  scientificName: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  family: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
});

export const SpeciesTableUncheckedCreateWithoutCropTableInputSchema: z.ZodType<Prisma.SpeciesTableUncheckedCreateWithoutCropTableInput> = z.strictObject({
  speciesName: z.string(),
  commonName: z.string(),
  scientificName: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  family: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
});

export const SpeciesTableCreateOrConnectWithoutCropTableInputSchema: z.ZodType<Prisma.SpeciesTableCreateOrConnectWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => SpeciesTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SpeciesTableCreateWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUncheckedCreateWithoutCropTableInputSchema) ]),
});

export const ProjectTableUpsertWithoutCropTableInputSchema: z.ZodType<Prisma.ProjectTableUpsertWithoutCropTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => ProjectTableUpdateWithoutCropTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutCropTableInputSchema) ]),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutCropTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutCropTableInputSchema) ]),
  where: z.lazy(() => ProjectTableWhereInputSchema).optional(),
});

export const ProjectTableUpdateToOneWithWhereWithoutCropTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateToOneWithWhereWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProjectTableUpdateWithoutCropTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutCropTableInputSchema) ]),
});

export const ProjectTableUpdateWithoutCropTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateWithoutCropTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const ProjectTableUncheckedUpdateWithoutCropTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateWithoutCropTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const SourceTableUpsertWithWhereUniqueWithoutCropTableInputSchema: z.ZodType<Prisma.SourceTableUpsertWithWhereUniqueWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SourceTableUpdateWithoutCropTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutCropTableInputSchema) ]),
  create: z.union([ z.lazy(() => SourceTableCreateWithoutCropTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutCropTableInputSchema) ]),
});

export const SourceTableUpdateWithWhereUniqueWithoutCropTableInputSchema: z.ZodType<Prisma.SourceTableUpdateWithWhereUniqueWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SourceTableUpdateWithoutCropTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutCropTableInputSchema) ]),
});

export const SourceTableUpdateManyWithWhereWithoutCropTableInputSchema: z.ZodType<Prisma.SourceTableUpdateManyWithWhereWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SourceTableUpdateManyMutationInputSchema), z.lazy(() => SourceTableUncheckedUpdateManyWithoutCropTableInputSchema) ]),
});

export const SpeciesTableUpsertWithWhereUniqueWithoutCropTableInputSchema: z.ZodType<Prisma.SpeciesTableUpsertWithWhereUniqueWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => SpeciesTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SpeciesTableUpdateWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUncheckedUpdateWithoutCropTableInputSchema) ]),
  create: z.union([ z.lazy(() => SpeciesTableCreateWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUncheckedCreateWithoutCropTableInputSchema) ]),
});

export const SpeciesTableUpdateWithWhereUniqueWithoutCropTableInputSchema: z.ZodType<Prisma.SpeciesTableUpdateWithWhereUniqueWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => SpeciesTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SpeciesTableUpdateWithoutCropTableInputSchema), z.lazy(() => SpeciesTableUncheckedUpdateWithoutCropTableInputSchema) ]),
});

export const SpeciesTableUpdateManyWithWhereWithoutCropTableInputSchema: z.ZodType<Prisma.SpeciesTableUpdateManyWithWhereWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => SpeciesTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SpeciesTableUpdateManyMutationInputSchema), z.lazy(() => SpeciesTableUncheckedUpdateManyWithoutCropTableInputSchema) ]),
});

export const SpeciesTableScalarWhereInputSchema: z.ZodType<Prisma.SpeciesTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SpeciesTableScalarWhereInputSchema), z.lazy(() => SpeciesTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SpeciesTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SpeciesTableScalarWhereInputSchema), z.lazy(() => SpeciesTableScalarWhereInputSchema).array() ]).optional(),
  speciesName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  commonName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  scientificName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  family: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  reference: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
});

export const ProjectTableCreateWithoutPlantingTableInputSchema: z.ZodType<Prisma.ProjectTableCreateWithoutPlantingTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableUncheckedCreateWithoutPlantingTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedCreateWithoutPlantingTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableCreateOrConnectWithoutPlantingTableInputSchema: z.ZodType<Prisma.ProjectTableCreateOrConnectWithoutPlantingTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutPlantingTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutPlantingTableInputSchema) ]),
});

export const SourceTableCreateWithoutPlantingTableInputSchema: z.ZodType<Prisma.SourceTableCreateWithoutPlantingTableInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableUncheckedCreateWithoutPlantingTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedCreateWithoutPlantingTableInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableCreateOrConnectWithoutPlantingTableInputSchema: z.ZodType<Prisma.SourceTableCreateOrConnectWithoutPlantingTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SourceTableCreateWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutPlantingTableInputSchema) ]),
});

export const ProjectTableUpsertWithoutPlantingTableInputSchema: z.ZodType<Prisma.ProjectTableUpsertWithoutPlantingTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => ProjectTableUpdateWithoutPlantingTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutPlantingTableInputSchema) ]),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutPlantingTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutPlantingTableInputSchema) ]),
  where: z.lazy(() => ProjectTableWhereInputSchema).optional(),
});

export const ProjectTableUpdateToOneWithWhereWithoutPlantingTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateToOneWithWhereWithoutPlantingTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProjectTableUpdateWithoutPlantingTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutPlantingTableInputSchema) ]),
});

export const ProjectTableUpdateWithoutPlantingTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateWithoutPlantingTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const ProjectTableUncheckedUpdateWithoutPlantingTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateWithoutPlantingTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const SourceTableUpsertWithWhereUniqueWithoutPlantingTableInputSchema: z.ZodType<Prisma.SourceTableUpsertWithWhereUniqueWithoutPlantingTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SourceTableUpdateWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutPlantingTableInputSchema) ]),
  create: z.union([ z.lazy(() => SourceTableCreateWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutPlantingTableInputSchema) ]),
});

export const SourceTableUpdateWithWhereUniqueWithoutPlantingTableInputSchema: z.ZodType<Prisma.SourceTableUpdateWithWhereUniqueWithoutPlantingTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SourceTableUpdateWithoutPlantingTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutPlantingTableInputSchema) ]),
});

export const SourceTableUpdateManyWithWhereWithoutPlantingTableInputSchema: z.ZodType<Prisma.SourceTableUpdateManyWithWhereWithoutPlantingTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SourceTableUpdateManyMutationInputSchema), z.lazy(() => SourceTableUncheckedUpdateManyWithoutPlantingTableInputSchema) ]),
});

export const CropTableCreateWithoutSpeciesTableInputSchema: z.ZodType<Prisma.CropTableCreateWithoutSpeciesTableInput> = z.strictObject({
  cropId: z.string(),
  cropName: z.string(),
  speciesLocalName: z.string().optional().nullable(),
  speciesId: z.string().optional().nullable(),
  seedInfo: z.string().optional().nullable(),
  cropStock: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  organizationLocalName: z.string().optional().nullable(),
  cropNotes: z.string().optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedOneWithoutCropTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const CropTableUncheckedCreateWithoutSpeciesTableInputSchema: z.ZodType<Prisma.CropTableUncheckedCreateWithoutSpeciesTableInput> = z.strictObject({
  cropId: z.string(),
  cropName: z.string(),
  projectId: z.string().optional().nullable(),
  speciesLocalName: z.string().optional().nullable(),
  speciesId: z.string().optional().nullable(),
  seedInfo: z.string().optional().nullable(),
  cropStock: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  organizationLocalName: z.string().optional().nullable(),
  cropNotes: z.string().optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const CropTableCreateOrConnectWithoutSpeciesTableInputSchema: z.ZodType<Prisma.CropTableCreateOrConnectWithoutSpeciesTableInput> = z.strictObject({
  where: z.lazy(() => CropTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CropTableCreateWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutSpeciesTableInputSchema) ]),
});

export const CropTableUpsertWithWhereUniqueWithoutSpeciesTableInputSchema: z.ZodType<Prisma.CropTableUpsertWithWhereUniqueWithoutSpeciesTableInput> = z.strictObject({
  where: z.lazy(() => CropTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CropTableUpdateWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUncheckedUpdateWithoutSpeciesTableInputSchema) ]),
  create: z.union([ z.lazy(() => CropTableCreateWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutSpeciesTableInputSchema) ]),
});

export const CropTableUpdateWithWhereUniqueWithoutSpeciesTableInputSchema: z.ZodType<Prisma.CropTableUpdateWithWhereUniqueWithoutSpeciesTableInput> = z.strictObject({
  where: z.lazy(() => CropTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CropTableUpdateWithoutSpeciesTableInputSchema), z.lazy(() => CropTableUncheckedUpdateWithoutSpeciesTableInputSchema) ]),
});

export const CropTableUpdateManyWithWhereWithoutSpeciesTableInputSchema: z.ZodType<Prisma.CropTableUpdateManyWithWhereWithoutSpeciesTableInput> = z.strictObject({
  where: z.lazy(() => CropTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CropTableUpdateManyMutationInputSchema), z.lazy(() => CropTableUncheckedUpdateManyWithoutSpeciesTableInputSchema) ]),
});

export const LandTableCreateWithoutPolygonTableInputSchema: z.ZodType<Prisma.LandTableCreateWithoutPolygonTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedOneWithoutLandTableInputSchema),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const LandTableUncheckedCreateWithoutPolygonTableInputSchema: z.ZodType<Prisma.LandTableUncheckedCreateWithoutPolygonTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  projectId: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const LandTableCreateOrConnectWithoutPolygonTableInputSchema: z.ZodType<Prisma.LandTableCreateOrConnectWithoutPolygonTableInput> = z.strictObject({
  where: z.lazy(() => LandTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => LandTableCreateWithoutPolygonTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutPolygonTableInputSchema) ]),
});

export const LandTableUpsertWithoutPolygonTableInputSchema: z.ZodType<Prisma.LandTableUpsertWithoutPolygonTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => LandTableUpdateWithoutPolygonTableInputSchema), z.lazy(() => LandTableUncheckedUpdateWithoutPolygonTableInputSchema) ]),
  create: z.union([ z.lazy(() => LandTableCreateWithoutPolygonTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutPolygonTableInputSchema) ]),
  where: z.lazy(() => LandTableWhereInputSchema).optional(),
});

export const LandTableUpdateToOneWithWhereWithoutPolygonTableInputSchema: z.ZodType<Prisma.LandTableUpdateToOneWithWhereWithoutPolygonTableInput> = z.strictObject({
  where: z.lazy(() => LandTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => LandTableUpdateWithoutPolygonTableInputSchema), z.lazy(() => LandTableUncheckedUpdateWithoutPolygonTableInputSchema) ]),
});

export const LandTableUpdateWithoutPolygonTableInputSchema: z.ZodType<Prisma.LandTableUpdateWithoutPolygonTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableUpdateOneRequiredWithoutLandTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const LandTableUncheckedUpdateWithoutPolygonTableInputSchema: z.ZodType<Prisma.LandTableUncheckedUpdateWithoutPolygonTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const ProjectTableCreateWithoutPolyTableInputSchema: z.ZodType<Prisma.ProjectTableCreateWithoutPolyTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableUncheckedCreateWithoutPolyTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedCreateWithoutPolyTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableCreateOrConnectWithoutPolyTableInputSchema: z.ZodType<Prisma.ProjectTableCreateOrConnectWithoutPolyTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutPolyTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutPolyTableInputSchema) ]),
});

export const ProjectTableUpsertWithoutPolyTableInputSchema: z.ZodType<Prisma.ProjectTableUpsertWithoutPolyTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => ProjectTableUpdateWithoutPolyTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutPolyTableInputSchema) ]),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutPolyTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutPolyTableInputSchema) ]),
  where: z.lazy(() => ProjectTableWhereInputSchema).optional(),
});

export const ProjectTableUpdateToOneWithWhereWithoutPolyTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateToOneWithWhereWithoutPolyTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProjectTableUpdateWithoutPolyTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutPolyTableInputSchema) ]),
});

export const ProjectTableUpdateWithoutPolyTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateWithoutPolyTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const ProjectTableUncheckedUpdateWithoutPolyTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateWithoutPolyTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const OrganizationLocalTableCreateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateWithoutStakeholderTableInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedCreateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedCreateWithoutStakeholderTableInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  organizationMasterId: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const OrganizationLocalTableCreateOrConnectWithoutStakeholderTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateOrConnectWithoutStakeholderTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutStakeholderTableInputSchema) ]),
});

export const ProjectTableCreateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.ProjectTableCreateWithoutStakeholderTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableUncheckedCreateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedCreateWithoutStakeholderTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableCreateOrConnectWithoutStakeholderTableInputSchema: z.ZodType<Prisma.ProjectTableCreateOrConnectWithoutStakeholderTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutStakeholderTableInputSchema) ]),
});

export const OrganizationLocalTableUpsertWithoutStakeholderTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpsertWithoutStakeholderTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithoutStakeholderTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutStakeholderTableInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutStakeholderTableInputSchema) ]),
  where: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional(),
});

export const OrganizationLocalTableUpdateToOneWithWhereWithoutStakeholderTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateToOneWithWhereWithoutStakeholderTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithoutStakeholderTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutStakeholderTableInputSchema) ]),
});

export const OrganizationLocalTableUpdateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateWithoutStakeholderTableInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedUpdateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedUpdateWithoutStakeholderTableInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const ProjectTableUpsertWithoutStakeholderTableInputSchema: z.ZodType<Prisma.ProjectTableUpsertWithoutStakeholderTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => ProjectTableUpdateWithoutStakeholderTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutStakeholderTableInputSchema) ]),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutStakeholderTableInputSchema) ]),
  where: z.lazy(() => ProjectTableWhereInputSchema).optional(),
});

export const ProjectTableUpdateToOneWithWhereWithoutStakeholderTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateToOneWithWhereWithoutStakeholderTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProjectTableUpdateWithoutStakeholderTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutStakeholderTableInputSchema) ]),
});

export const ProjectTableUpdateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateWithoutStakeholderTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const ProjectTableUncheckedUpdateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateWithoutStakeholderTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const ClaimTableCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.ClaimTableCreateWithoutSourceTableInput> = z.strictObject({
  claimId: z.string(),
  claimCount: z.number().int(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedOneWithoutClaimTableInputSchema),
});

export const ClaimTableUncheckedCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.ClaimTableUncheckedCreateWithoutSourceTableInput> = z.strictObject({
  claimId: z.string(),
  claimCount: z.number().int(),
  organizationLocalId: z.string(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  editedBy: z.string().optional().nullable(),
});

export const ClaimTableCreateOrConnectWithoutSourceTableInputSchema: z.ZodType<Prisma.ClaimTableCreateOrConnectWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => ClaimTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ClaimTableCreateWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const ClaimTableCreateManySourceTableInputEnvelopeSchema: z.ZodType<Prisma.ClaimTableCreateManySourceTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ClaimTableCreateManySourceTableInputSchema), z.lazy(() => ClaimTableCreateManySourceTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const CropTableCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.CropTableCreateWithoutSourceTableInput> = z.strictObject({
  cropId: z.string(),
  cropName: z.string(),
  speciesLocalName: z.string().optional().nullable(),
  speciesId: z.string().optional().nullable(),
  seedInfo: z.string().optional().nullable(),
  cropStock: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  organizationLocalName: z.string().optional().nullable(),
  cropNotes: z.string().optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedOneWithoutCropTableInputSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const CropTableUncheckedCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.CropTableUncheckedCreateWithoutSourceTableInput> = z.strictObject({
  cropId: z.string(),
  cropName: z.string(),
  projectId: z.string().optional().nullable(),
  speciesLocalName: z.string().optional().nullable(),
  speciesId: z.string().optional().nullable(),
  seedInfo: z.string().optional().nullable(),
  cropStock: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  organizationLocalName: z.string().optional().nullable(),
  cropNotes: z.string().optional().nullable(),
  SpeciesTable: z.lazy(() => SpeciesTableUncheckedCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const CropTableCreateOrConnectWithoutSourceTableInputSchema: z.ZodType<Prisma.CropTableCreateOrConnectWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => CropTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CropTableCreateWithoutSourceTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const LandTableCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.LandTableCreateWithoutSourceTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedOneWithoutLandTableInputSchema),
  PolygonTable: z.lazy(() => PolygonTableCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const LandTableUncheckedCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.LandTableUncheckedCreateWithoutSourceTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  projectId: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  PolygonTable: z.lazy(() => PolygonTableUncheckedCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const LandTableCreateOrConnectWithoutSourceTableInputSchema: z.ZodType<Prisma.LandTableCreateOrConnectWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => LandTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => LandTableCreateWithoutSourceTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const OrganizationLocalTableCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateWithoutSourceTableInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedCreateWithoutSourceTableInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  organizationMasterId: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const OrganizationLocalTableCreateOrConnectWithoutSourceTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateOrConnectWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const PlantingTableCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.PlantingTableCreateWithoutSourceTableInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedOneWithoutPlantingTableInputSchema),
});

export const PlantingTableUncheckedCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.PlantingTableUncheckedCreateWithoutSourceTableInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  projectId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
});

export const PlantingTableCreateOrConnectWithoutSourceTableInputSchema: z.ZodType<Prisma.PlantingTableCreateOrConnectWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => PlantingTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PlantingTableCreateWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const ProjectTableCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.ProjectTableCreateWithoutSourceTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableUncheckedCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedCreateWithoutSourceTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableCreateOrConnectWithoutSourceTableInputSchema: z.ZodType<Prisma.ProjectTableCreateOrConnectWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const ClaimTableUpsertWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.ClaimTableUpsertWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => ClaimTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ClaimTableUpdateWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
  create: z.union([ z.lazy(() => ClaimTableCreateWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const ClaimTableUpdateWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.ClaimTableUpdateWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => ClaimTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ClaimTableUpdateWithoutSourceTableInputSchema), z.lazy(() => ClaimTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
});

export const ClaimTableUpdateManyWithWhereWithoutSourceTableInputSchema: z.ZodType<Prisma.ClaimTableUpdateManyWithWhereWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => ClaimTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ClaimTableUpdateManyMutationInputSchema), z.lazy(() => ClaimTableUncheckedUpdateManyWithoutSourceTableInputSchema) ]),
});

export const ClaimTableScalarWhereInputSchema: z.ZodType<Prisma.ClaimTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ClaimTableScalarWhereInputSchema), z.lazy(() => ClaimTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ClaimTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ClaimTableScalarWhereInputSchema), z.lazy(() => ClaimTableScalarWhereInputSchema).array() ]).optional(),
  claimId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  claimCount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sourceId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
});

export const CropTableUpsertWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.CropTableUpsertWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => CropTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CropTableUpdateWithoutSourceTableInputSchema), z.lazy(() => CropTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
  create: z.union([ z.lazy(() => CropTableCreateWithoutSourceTableInputSchema), z.lazy(() => CropTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const CropTableUpdateWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.CropTableUpdateWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => CropTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CropTableUpdateWithoutSourceTableInputSchema), z.lazy(() => CropTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
});

export const CropTableUpdateManyWithWhereWithoutSourceTableInputSchema: z.ZodType<Prisma.CropTableUpdateManyWithWhereWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => CropTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CropTableUpdateManyMutationInputSchema), z.lazy(() => CropTableUncheckedUpdateManyWithoutSourceTableInputSchema) ]),
});

export const LandTableUpsertWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.LandTableUpsertWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => LandTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => LandTableUpdateWithoutSourceTableInputSchema), z.lazy(() => LandTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
  create: z.union([ z.lazy(() => LandTableCreateWithoutSourceTableInputSchema), z.lazy(() => LandTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const LandTableUpdateWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.LandTableUpdateWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => LandTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => LandTableUpdateWithoutSourceTableInputSchema), z.lazy(() => LandTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
});

export const LandTableUpdateManyWithWhereWithoutSourceTableInputSchema: z.ZodType<Prisma.LandTableUpdateManyWithWhereWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => LandTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => LandTableUpdateManyMutationInputSchema), z.lazy(() => LandTableUncheckedUpdateManyWithoutSourceTableInputSchema) ]),
});

export const OrganizationLocalTableUpsertWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpsertWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const OrganizationLocalTableUpdateWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithoutSourceTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
});

export const OrganizationLocalTableUpdateManyWithWhereWithoutSourceTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateManyWithWhereWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => OrganizationLocalTableUpdateManyMutationInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateManyWithoutSourceTableInputSchema) ]),
});

export const OrganizationLocalTableScalarWhereInputSchema: z.ZodType<Prisma.OrganizationLocalTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OrganizationLocalTableScalarWhereInputSchema), z.lazy(() => OrganizationLocalTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationLocalTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationLocalTableScalarWhereInputSchema), z.lazy(() => OrganizationLocalTableScalarWhereInputSchema).array() ]).optional(),
  organizationLocalName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  organizationMasterId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactEmail: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  contactPhone: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  address: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  polyId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  website: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  capacityPerYear: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  organizationNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => FloatNullableFilterSchema), z.number() ]).optional().nullable(),
});

export const PlantingTableUpsertWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.PlantingTableUpsertWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => PlantingTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PlantingTableUpdateWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
  create: z.union([ z.lazy(() => PlantingTableCreateWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const PlantingTableUpdateWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.PlantingTableUpdateWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => PlantingTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PlantingTableUpdateWithoutSourceTableInputSchema), z.lazy(() => PlantingTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
});

export const PlantingTableUpdateManyWithWhereWithoutSourceTableInputSchema: z.ZodType<Prisma.PlantingTableUpdateManyWithWhereWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => PlantingTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PlantingTableUpdateManyMutationInputSchema), z.lazy(() => PlantingTableUncheckedUpdateManyWithoutSourceTableInputSchema) ]),
});

export const ProjectTableUpsertWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.ProjectTableUpsertWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ProjectTableUpdateWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const ProjectTableUpdateWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ProjectTableUpdateWithoutSourceTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
});

export const ProjectTableUpdateManyWithWhereWithoutSourceTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateManyWithWhereWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ProjectTableUpdateManyMutationInputSchema), z.lazy(() => ProjectTableUncheckedUpdateManyWithoutSourceTableInputSchema) ]),
});

export const ProjectTableScalarWhereInputSchema: z.ZodType<Prisma.ProjectTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ProjectTableScalarWhereInputSchema), z.lazy(() => ProjectTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProjectTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProjectTableScalarWhereInputSchema), z.lazy(() => ProjectTableScalarWhereInputSchema).array() ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  platformId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  platform: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => EnumCarbonRegistryTypeNullableFilterSchema), z.lazy(() => CarbonRegistryTypeSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => EnumCarbonRegistryNullableFilterSchema), z.lazy(() => CarbonRegistrySchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectDateEnd: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  projectDateStart: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  registryId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  isPublic: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
});

export const OrganizationLocalTableCreateWithoutClaimTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateWithoutClaimTableInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedCreateWithoutClaimTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedCreateWithoutClaimTableInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  organizationMasterId: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const OrganizationLocalTableCreateOrConnectWithoutClaimTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateOrConnectWithoutClaimTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutClaimTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutClaimTableInputSchema) ]),
});

export const SourceTableCreateWithoutClaimTableInputSchema: z.ZodType<Prisma.SourceTableCreateWithoutClaimTableInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableUncheckedCreateWithoutClaimTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedCreateWithoutClaimTableInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableCreateOrConnectWithoutClaimTableInputSchema: z.ZodType<Prisma.SourceTableCreateOrConnectWithoutClaimTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SourceTableCreateWithoutClaimTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutClaimTableInputSchema) ]),
});

export const OrganizationLocalTableUpsertWithoutClaimTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpsertWithoutClaimTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithoutClaimTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutClaimTableInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutClaimTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutClaimTableInputSchema) ]),
  where: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional(),
});

export const OrganizationLocalTableUpdateToOneWithWhereWithoutClaimTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateToOneWithWhereWithoutClaimTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithoutClaimTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutClaimTableInputSchema) ]),
});

export const OrganizationLocalTableUpdateWithoutClaimTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateWithoutClaimTableInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedUpdateWithoutClaimTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedUpdateWithoutClaimTableInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const SourceTableUpsertWithoutClaimTableInputSchema: z.ZodType<Prisma.SourceTableUpsertWithoutClaimTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => SourceTableUpdateWithoutClaimTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutClaimTableInputSchema) ]),
  create: z.union([ z.lazy(() => SourceTableCreateWithoutClaimTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutClaimTableInputSchema) ]),
  where: z.lazy(() => SourceTableWhereInputSchema).optional(),
});

export const SourceTableUpdateToOneWithWhereWithoutClaimTableInputSchema: z.ZodType<Prisma.SourceTableUpdateToOneWithWhereWithoutClaimTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => SourceTableUpdateWithoutClaimTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutClaimTableInputSchema) ]),
});

export const SourceTableUpdateWithoutClaimTableInputSchema: z.ZodType<Prisma.SourceTableUpdateWithoutClaimTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableUncheckedUpdateWithoutClaimTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateWithoutClaimTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const ClaimTableCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ClaimTableCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  claimId: z.string(),
  claimCount: z.number().int(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  SourceTable: z.lazy(() => SourceTableCreateNestedOneWithoutClaimTableInputSchema),
});

export const ClaimTableUncheckedCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ClaimTableUncheckedCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  claimId: z.string(),
  claimCount: z.number().int(),
  sourceId: z.string(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  editedBy: z.string().optional().nullable(),
});

export const ClaimTableCreateOrConnectWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ClaimTableCreateOrConnectWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => ClaimTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ClaimTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const ClaimTableCreateManyOrganizationLocalTableInputEnvelopeSchema: z.ZodType<Prisma.ClaimTableCreateManyOrganizationLocalTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ClaimTableCreateManyOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableCreateManyOrganizationLocalTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const OrganizationMasterTableCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.OrganizationMasterTableCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  organizationMasterId: z.string(),
  organizationMasterName: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
});

export const OrganizationMasterTableUncheckedCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.OrganizationMasterTableUncheckedCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  organizationMasterId: z.string(),
  organizationMasterName: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
});

export const OrganizationMasterTableCreateOrConnectWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.OrganizationMasterTableCreateOrConnectWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationMasterTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationMasterTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => OrganizationMasterTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const ProjectTableCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ProjectTableCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const ProjectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ProjectTableCreateOrConnectWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const ProjectTableCreateManyOrganizationLocalTableInputEnvelopeSchema: z.ZodType<Prisma.ProjectTableCreateManyOrganizationLocalTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ProjectTableCreateManyOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableCreateManyOrganizationLocalTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const StakeholderTableCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.StakeholderTableCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  stakeholderId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedOneWithoutStakeholderTableInputSchema).optional(),
});

export const StakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  stakeholderId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  projectId: z.string().optional().nullable(),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const StakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.StakeholderTableCreateOrConnectWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => StakeholderTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => StakeholderTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const StakeholderTableCreateManyOrganizationLocalTableInputEnvelopeSchema: z.ZodType<Prisma.StakeholderTableCreateManyOrganizationLocalTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => StakeholderTableCreateManyOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableCreateManyOrganizationLocalTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const SourceTableCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.SourceTableCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  CropTable: z.lazy(() => CropTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  sourceId: z.string(),
  url: z.string(),
  urlType: z.lazy(() => UrlTypeSchema).optional().nullable(),
  parentId: z.string().optional().nullable(),
  parentTable: z.lazy(() => ParentTableSchema).optional().nullable(),
  projectId: z.string().optional().nullable(),
  disclosureType: z.lazy(() => DisclosureTypeSchema).optional().nullable(),
  sourceDescription: z.string().optional().nullable(),
  sourceCredit: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const SourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.SourceTableCreateOrConnectWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SourceTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const ClaimTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ClaimTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => ClaimTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ClaimTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
  create: z.union([ z.lazy(() => ClaimTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const ClaimTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ClaimTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => ClaimTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ClaimTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ClaimTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
});

export const ClaimTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ClaimTableUpdateManyWithWhereWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => ClaimTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ClaimTableUpdateManyMutationInputSchema), z.lazy(() => ClaimTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema) ]),
});

export const OrganizationMasterTableUpsertWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.OrganizationMasterTableUpsertWithoutOrganizationLocalTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => OrganizationMasterTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => OrganizationMasterTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationMasterTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => OrganizationMasterTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
  where: z.lazy(() => OrganizationMasterTableWhereInputSchema).optional(),
});

export const OrganizationMasterTableUpdateToOneWithWhereWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.OrganizationMasterTableUpdateToOneWithWhereWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationMasterTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => OrganizationMasterTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => OrganizationMasterTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
});

export const OrganizationMasterTableUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.OrganizationMasterTableUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  organizationMasterId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const OrganizationMasterTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.OrganizationMasterTableUncheckedUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  organizationMasterId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ProjectTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ProjectTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ProjectTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
  create: z.union([ z.lazy(() => ProjectTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const ProjectTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ProjectTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => ProjectTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
});

export const ProjectTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateManyWithWhereWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => ProjectTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ProjectTableUpdateManyMutationInputSchema), z.lazy(() => ProjectTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema) ]),
});

export const StakeholderTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.StakeholderTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => StakeholderTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => StakeholderTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
  create: z.union([ z.lazy(() => StakeholderTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const StakeholderTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.StakeholderTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => StakeholderTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => StakeholderTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => StakeholderTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
});

export const StakeholderTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.StakeholderTableUpdateManyWithWhereWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => StakeholderTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => StakeholderTableUpdateManyMutationInputSchema), z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema) ]),
});

export const SourceTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.SourceTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SourceTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
  create: z.union([ z.lazy(() => SourceTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const SourceTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.SourceTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SourceTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => SourceTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
});

export const SourceTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.SourceTableUpdateManyWithWhereWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => SourceTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SourceTableUpdateManyMutationInputSchema), z.lazy(() => SourceTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema) ]),
});

export const OrganizationLocalTableCreateWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateWithoutOrganizationMasterTableInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const OrganizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema) ]),
});

export const OrganizationLocalTableCreateManyOrganizationMasterTableInputEnvelopeSchema: z.ZodType<Prisma.OrganizationLocalTableCreateManyOrganizationMasterTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => OrganizationLocalTableCreateManyOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableCreateManyOrganizationMasterTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const OrganizationLocalTableUpsertWithWhereUniqueWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpsertWithWhereUniqueWithoutOrganizationMasterTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutOrganizationMasterTableInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationLocalTableCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema) ]),
});

export const OrganizationLocalTableUpdateWithWhereUniqueWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateWithWhereUniqueWithoutOrganizationMasterTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => OrganizationLocalTableUpdateWithoutOrganizationMasterTableInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateWithoutOrganizationMasterTableInputSchema) ]),
});

export const OrganizationLocalTableUpdateManyWithWhereWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateManyWithWhereWithoutOrganizationMasterTableInput> = z.strictObject({
  where: z.lazy(() => OrganizationLocalTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => OrganizationLocalTableUpdateManyMutationInputSchema), z.lazy(() => OrganizationLocalTableUncheckedUpdateManyWithoutOrganizationMasterTableInputSchema) ]),
});

export const CropTableCreateManyProjectTableInputSchema: z.ZodType<Prisma.CropTableCreateManyProjectTableInput> = z.strictObject({
  cropId: z.string(),
  cropName: z.string(),
  speciesLocalName: z.string().optional().nullable(),
  speciesId: z.string().optional().nullable(),
  seedInfo: z.string().optional().nullable(),
  cropStock: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  organizationLocalName: z.string().optional().nullable(),
  cropNotes: z.string().optional().nullable(),
});

export const LandTableCreateManyProjectTableInputSchema: z.ZodType<Prisma.LandTableCreateManyProjectTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
});

export const PlantingTableCreateManyProjectTableInputSchema: z.ZodType<Prisma.PlantingTableCreateManyProjectTableInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
});

export const PolyTableCreateManyProjectTableInputSchema: z.ZodType<Prisma.PolyTableCreateManyProjectTableInput> = z.strictObject({
  polyId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  randomJson: z.string().optional().nullable(),
  survivalRate: z.number().optional().nullable(),
  liabilityCause: z.string().optional().nullable(),
  ratePerTree: z.number().optional().nullable(),
  motivation: z.string().optional().nullable(),
  restorationType: z.lazy(() => RestorationTypeSchema).optional().nullable(),
  reviews: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
});

export const StakeholderTableCreateManyProjectTableInputSchema: z.ZodType<Prisma.StakeholderTableCreateManyProjectTableInput> = z.strictObject({
  stakeholderId: z.string(),
  organizationLocalId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const CropTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.CropTableUpdateWithoutProjectTableInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutCropTableNestedInputSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const CropTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.CropTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutCropTableNestedInputSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableUncheckedUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const CropTableUncheckedUpdateManyWithoutProjectTableInputSchema: z.ZodType<Prisma.CropTableUncheckedUpdateManyWithoutProjectTableInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const LandTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.LandTableUpdateWithoutProjectTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  PolygonTable: z.lazy(() => PolygonTableUpdateManyWithoutLandTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const LandTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.LandTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  PolygonTable: z.lazy(() => PolygonTableUncheckedUpdateManyWithoutLandTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const LandTableUncheckedUpdateManyWithoutProjectTableInputSchema: z.ZodType<Prisma.LandTableUncheckedUpdateManyWithoutProjectTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PlantingTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.PlantingTableUpdateWithoutProjectTableInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutPlantingTableNestedInputSchema).optional(),
});

export const PlantingTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.PlantingTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutPlantingTableNestedInputSchema).optional(),
});

export const PlantingTableUncheckedUpdateManyWithoutProjectTableInputSchema: z.ZodType<Prisma.PlantingTableUncheckedUpdateManyWithoutProjectTableInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PolyTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.PolyTableUpdateWithoutProjectTableInput> = z.strictObject({
  polyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  randomJson: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  survivalRate: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  liabilityCause: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ratePerTree: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  motivation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  restorationType: z.union([ z.lazy(() => RestorationTypeSchema), z.lazy(() => NullableEnumRestorationTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviews: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PolyTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.PolyTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
  polyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  randomJson: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  survivalRate: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  liabilityCause: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ratePerTree: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  motivation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  restorationType: z.union([ z.lazy(() => RestorationTypeSchema), z.lazy(() => NullableEnumRestorationTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviews: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PolyTableUncheckedUpdateManyWithoutProjectTableInputSchema: z.ZodType<Prisma.PolyTableUncheckedUpdateManyWithoutProjectTableInput> = z.strictObject({
  polyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  randomJson: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  survivalRate: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  liabilityCause: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ratePerTree: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  motivation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  restorationType: z.union([ z.lazy(() => RestorationTypeSchema), z.lazy(() => NullableEnumRestorationTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviews: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const StakeholderTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.StakeholderTableUpdateWithoutProjectTableInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateOneRequiredWithoutStakeholderTableNestedInputSchema).optional(),
});

export const StakeholderTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const StakeholderTableUncheckedUpdateManyWithoutProjectTableInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedUpdateManyWithoutProjectTableInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SourceTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.SourceTableUpdateWithoutProjectTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableUncheckedUpdateManyWithoutProjectTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateManyWithoutProjectTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PolygonTableCreateManyLandTableInputSchema: z.ZodType<Prisma.PolygonTableCreateManyLandTableInput> = z.strictObject({
  polygonId: z.string(),
  landName: z.string().optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
});

export const PolygonTableUpdateWithoutLandTableInputSchema: z.ZodType<Prisma.PolygonTableUpdateWithoutLandTableInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PolygonTableUncheckedUpdateWithoutLandTableInputSchema: z.ZodType<Prisma.PolygonTableUncheckedUpdateWithoutLandTableInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PolygonTableUncheckedUpdateManyWithoutLandTableInputSchema: z.ZodType<Prisma.PolygonTableUncheckedUpdateManyWithoutLandTableInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SourceTableUpdateWithoutLandTableInputSchema: z.ZodType<Prisma.SourceTableUpdateWithoutLandTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableUncheckedUpdateWithoutLandTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateWithoutLandTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableUncheckedUpdateManyWithoutLandTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateManyWithoutLandTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SourceTableUpdateWithoutCropTableInputSchema: z.ZodType<Prisma.SourceTableUpdateWithoutCropTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableUncheckedUpdateWithoutCropTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateWithoutCropTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableUncheckedUpdateManyWithoutCropTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateManyWithoutCropTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SpeciesTableUpdateWithoutCropTableInputSchema: z.ZodType<Prisma.SpeciesTableUpdateWithoutCropTableInput> = z.strictObject({
  speciesName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  commonName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  scientificName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  family: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reference: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SpeciesTableUncheckedUpdateWithoutCropTableInputSchema: z.ZodType<Prisma.SpeciesTableUncheckedUpdateWithoutCropTableInput> = z.strictObject({
  speciesName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  commonName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  scientificName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  family: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reference: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SpeciesTableUncheckedUpdateManyWithoutCropTableInputSchema: z.ZodType<Prisma.SpeciesTableUncheckedUpdateManyWithoutCropTableInput> = z.strictObject({
  speciesName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  commonName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  scientificName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  family: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reference: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SourceTableUpdateWithoutPlantingTableInputSchema: z.ZodType<Prisma.SourceTableUpdateWithoutPlantingTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableUncheckedUpdateWithoutPlantingTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateWithoutPlantingTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableUncheckedUpdateManyWithoutPlantingTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateManyWithoutPlantingTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CropTableUpdateWithoutSpeciesTableInputSchema: z.ZodType<Prisma.CropTableUpdateWithoutSpeciesTableInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableUpdateOneWithoutCropTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const CropTableUncheckedUpdateWithoutSpeciesTableInputSchema: z.ZodType<Prisma.CropTableUncheckedUpdateWithoutSpeciesTableInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const CropTableUncheckedUpdateManyWithoutSpeciesTableInputSchema: z.ZodType<Prisma.CropTableUncheckedUpdateManyWithoutSpeciesTableInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ClaimTableCreateManySourceTableInputSchema: z.ZodType<Prisma.ClaimTableCreateManySourceTableInput> = z.strictObject({
  claimId: z.string(),
  claimCount: z.number().int(),
  organizationLocalId: z.string(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  editedBy: z.string().optional().nullable(),
});

export const ClaimTableUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.ClaimTableUpdateWithoutSourceTableInput> = z.strictObject({
  claimId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  claimCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateOneRequiredWithoutClaimTableNestedInputSchema).optional(),
});

export const ClaimTableUncheckedUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.ClaimTableUncheckedUpdateWithoutSourceTableInput> = z.strictObject({
  claimId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  claimCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ClaimTableUncheckedUpdateManyWithoutSourceTableInputSchema: z.ZodType<Prisma.ClaimTableUncheckedUpdateManyWithoutSourceTableInput> = z.strictObject({
  claimId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  claimCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CropTableUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.CropTableUpdateWithoutSourceTableInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableUpdateOneWithoutCropTableNestedInputSchema).optional(),
  SpeciesTable: z.lazy(() => SpeciesTableUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const CropTableUncheckedUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.CropTableUncheckedUpdateWithoutSourceTableInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  SpeciesTable: z.lazy(() => SpeciesTableUncheckedUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const CropTableUncheckedUpdateManyWithoutSourceTableInputSchema: z.ZodType<Prisma.CropTableUncheckedUpdateManyWithoutSourceTableInput> = z.strictObject({
  cropId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cropName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  speciesId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seedInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropStock: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const LandTableUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.LandTableUpdateWithoutSourceTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableUpdateOneRequiredWithoutLandTableNestedInputSchema).optional(),
  PolygonTable: z.lazy(() => PolygonTableUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const LandTableUncheckedUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.LandTableUncheckedUpdateWithoutSourceTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  PolygonTable: z.lazy(() => PolygonTableUncheckedUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const LandTableUncheckedUpdateManyWithoutSourceTableInputSchema: z.ZodType<Prisma.LandTableUncheckedUpdateManyWithoutSourceTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const OrganizationLocalTableUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateWithoutSourceTableInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  OrganizationMasterTable: z.lazy(() => OrganizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedUpdateWithoutSourceTableInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedUpdateManyWithoutSourceTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedUpdateManyWithoutSourceTableInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PlantingTableUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.PlantingTableUpdateWithoutSourceTableInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableUpdateOneRequiredWithoutPlantingTableNestedInputSchema).optional(),
});

export const PlantingTableUncheckedUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.PlantingTableUncheckedUpdateWithoutSourceTableInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PlantingTableUncheckedUpdateManyWithoutSourceTableInputSchema: z.ZodType<Prisma.PlantingTableUncheckedUpdateManyWithoutSourceTableInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(PrismaDecimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ProjectTableUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateWithoutSourceTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  OrganizationLocalTable: z.lazy(() => OrganizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const ProjectTableUncheckedUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateWithoutSourceTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const ProjectTableUncheckedUpdateManyWithoutSourceTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateManyWithoutSourceTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ClaimTableCreateManyOrganizationLocalTableInputSchema: z.ZodType<Prisma.ClaimTableCreateManyOrganizationLocalTableInput> = z.strictObject({
  claimId: z.string(),
  claimCount: z.number().int(),
  sourceId: z.string(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  editedBy: z.string().optional().nullable(),
});

export const ProjectTableCreateManyOrganizationLocalTableInputSchema: z.ZodType<Prisma.ProjectTableCreateManyOrganizationLocalTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
});

export const StakeholderTableCreateManyOrganizationLocalTableInputSchema: z.ZodType<Prisma.StakeholderTableCreateManyOrganizationLocalTableInput> = z.strictObject({
  stakeholderId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  projectId: z.string().optional().nullable(),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const ClaimTableUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ClaimTableUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  claimId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  claimCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  SourceTable: z.lazy(() => SourceTableUpdateOneRequiredWithoutClaimTableNestedInputSchema).optional(),
});

export const ClaimTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ClaimTableUncheckedUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  claimId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  claimCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ClaimTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ClaimTableUncheckedUpdateManyWithoutOrganizationLocalTableInput> = z.strictObject({
  claimId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  claimCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ProjectTableUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ProjectTableUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const ProjectTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  PolyTable: z.lazy(() => PolyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const ProjectTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.ProjectTableUncheckedUpdateManyWithoutOrganizationLocalTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StakeholderTableUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.StakeholderTableUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ProjectTable: z.lazy(() => ProjectTableUpdateOneWithoutStakeholderTableNestedInputSchema).optional(),
});

export const StakeholderTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const StakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.StakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SourceTableUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.SourceTableUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  CropTable: z.lazy(() => CropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  LandTable: z.lazy(() => LandTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  PlantingTable: z.lazy(() => PlantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const SourceTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.SourceTableUncheckedUpdateManyWithoutOrganizationLocalTableInput> = z.strictObject({
  sourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urlType: z.union([ z.lazy(() => UrlTypeSchema), z.lazy(() => NullableEnumUrlTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => NullableEnumParentTableFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  disclosureType: z.union([ z.lazy(() => DisclosureTypeSchema), z.lazy(() => NullableEnumDisclosureTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceCredit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const OrganizationLocalTableCreateManyOrganizationMasterTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableCreateManyOrganizationMasterTableInput> = z.strictObject({
  organizationLocalName: z.string(),
  organizationLocalId: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  polyId: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  capacityPerYear: z.number().int().optional().nullable(),
  organizationNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLon: z.number().optional().nullable(),
});

export const OrganizationLocalTableUpdateWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateWithoutOrganizationMasterTableInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedUpdateWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedUpdateWithoutOrganizationMasterTableInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  ClaimTable: z.lazy(() => ClaimTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  ProjectTable: z.lazy(() => ProjectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  StakeholderTable: z.lazy(() => StakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  SourceTable: z.lazy(() => SourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const OrganizationLocalTableUncheckedUpdateManyWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.OrganizationLocalTableUncheckedUpdateManyWithoutOrganizationMasterTableInput> = z.strictObject({
  organizationLocalName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contactName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  contactPhone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  address: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polyId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  website: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  capacityPerYear: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const ProjectTableFindFirstArgsSchema: z.ZodType<Prisma.ProjectTableFindFirstArgs> = z.object({
  select: ProjectTableSelectSchema.optional(),
  include: ProjectTableIncludeSchema.optional(),
  where: ProjectTableWhereInputSchema.optional(), 
  orderBy: z.union([ ProjectTableOrderByWithRelationInputSchema.array(), ProjectTableOrderByWithRelationInputSchema ]).optional(),
  cursor: ProjectTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProjectTableScalarFieldEnumSchema, ProjectTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ProjectTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ProjectTableFindFirstOrThrowArgs> = z.object({
  select: ProjectTableSelectSchema.optional(),
  include: ProjectTableIncludeSchema.optional(),
  where: ProjectTableWhereInputSchema.optional(), 
  orderBy: z.union([ ProjectTableOrderByWithRelationInputSchema.array(), ProjectTableOrderByWithRelationInputSchema ]).optional(),
  cursor: ProjectTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProjectTableScalarFieldEnumSchema, ProjectTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ProjectTableFindManyArgsSchema: z.ZodType<Prisma.ProjectTableFindManyArgs> = z.object({
  select: ProjectTableSelectSchema.optional(),
  include: ProjectTableIncludeSchema.optional(),
  where: ProjectTableWhereInputSchema.optional(), 
  orderBy: z.union([ ProjectTableOrderByWithRelationInputSchema.array(), ProjectTableOrderByWithRelationInputSchema ]).optional(),
  cursor: ProjectTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProjectTableScalarFieldEnumSchema, ProjectTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ProjectTableAggregateArgsSchema: z.ZodType<Prisma.ProjectTableAggregateArgs> = z.object({
  where: ProjectTableWhereInputSchema.optional(), 
  orderBy: z.union([ ProjectTableOrderByWithRelationInputSchema.array(), ProjectTableOrderByWithRelationInputSchema ]).optional(),
  cursor: ProjectTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ProjectTableGroupByArgsSchema: z.ZodType<Prisma.ProjectTableGroupByArgs> = z.object({
  where: ProjectTableWhereInputSchema.optional(), 
  orderBy: z.union([ ProjectTableOrderByWithAggregationInputSchema.array(), ProjectTableOrderByWithAggregationInputSchema ]).optional(),
  by: ProjectTableScalarFieldEnumSchema.array(), 
  having: ProjectTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ProjectTableFindUniqueArgsSchema: z.ZodType<Prisma.ProjectTableFindUniqueArgs> = z.object({
  select: ProjectTableSelectSchema.optional(),
  include: ProjectTableIncludeSchema.optional(),
  where: ProjectTableWhereUniqueInputSchema, 
}).strict();

export const ProjectTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ProjectTableFindUniqueOrThrowArgs> = z.object({
  select: ProjectTableSelectSchema.optional(),
  include: ProjectTableIncludeSchema.optional(),
  where: ProjectTableWhereUniqueInputSchema, 
}).strict();

export const LandTableFindFirstArgsSchema: z.ZodType<Prisma.LandTableFindFirstArgs> = z.object({
  select: LandTableSelectSchema.optional(),
  include: LandTableIncludeSchema.optional(),
  where: LandTableWhereInputSchema.optional(), 
  orderBy: z.union([ LandTableOrderByWithRelationInputSchema.array(), LandTableOrderByWithRelationInputSchema ]).optional(),
  cursor: LandTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ LandTableScalarFieldEnumSchema, LandTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const LandTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.LandTableFindFirstOrThrowArgs> = z.object({
  select: LandTableSelectSchema.optional(),
  include: LandTableIncludeSchema.optional(),
  where: LandTableWhereInputSchema.optional(), 
  orderBy: z.union([ LandTableOrderByWithRelationInputSchema.array(), LandTableOrderByWithRelationInputSchema ]).optional(),
  cursor: LandTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ LandTableScalarFieldEnumSchema, LandTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const LandTableFindManyArgsSchema: z.ZodType<Prisma.LandTableFindManyArgs> = z.object({
  select: LandTableSelectSchema.optional(),
  include: LandTableIncludeSchema.optional(),
  where: LandTableWhereInputSchema.optional(), 
  orderBy: z.union([ LandTableOrderByWithRelationInputSchema.array(), LandTableOrderByWithRelationInputSchema ]).optional(),
  cursor: LandTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ LandTableScalarFieldEnumSchema, LandTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const LandTableAggregateArgsSchema: z.ZodType<Prisma.LandTableAggregateArgs> = z.object({
  where: LandTableWhereInputSchema.optional(), 
  orderBy: z.union([ LandTableOrderByWithRelationInputSchema.array(), LandTableOrderByWithRelationInputSchema ]).optional(),
  cursor: LandTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const LandTableGroupByArgsSchema: z.ZodType<Prisma.LandTableGroupByArgs> = z.object({
  where: LandTableWhereInputSchema.optional(), 
  orderBy: z.union([ LandTableOrderByWithAggregationInputSchema.array(), LandTableOrderByWithAggregationInputSchema ]).optional(),
  by: LandTableScalarFieldEnumSchema.array(), 
  having: LandTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const LandTableFindUniqueArgsSchema: z.ZodType<Prisma.LandTableFindUniqueArgs> = z.object({
  select: LandTableSelectSchema.optional(),
  include: LandTableIncludeSchema.optional(),
  where: LandTableWhereUniqueInputSchema, 
}).strict();

export const LandTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.LandTableFindUniqueOrThrowArgs> = z.object({
  select: LandTableSelectSchema.optional(),
  include: LandTableIncludeSchema.optional(),
  where: LandTableWhereUniqueInputSchema, 
}).strict();

export const CropTableFindFirstArgsSchema: z.ZodType<Prisma.CropTableFindFirstArgs> = z.object({
  select: CropTableSelectSchema.optional(),
  include: CropTableIncludeSchema.optional(),
  where: CropTableWhereInputSchema.optional(), 
  orderBy: z.union([ CropTableOrderByWithRelationInputSchema.array(), CropTableOrderByWithRelationInputSchema ]).optional(),
  cursor: CropTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CropTableScalarFieldEnumSchema, CropTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CropTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.CropTableFindFirstOrThrowArgs> = z.object({
  select: CropTableSelectSchema.optional(),
  include: CropTableIncludeSchema.optional(),
  where: CropTableWhereInputSchema.optional(), 
  orderBy: z.union([ CropTableOrderByWithRelationInputSchema.array(), CropTableOrderByWithRelationInputSchema ]).optional(),
  cursor: CropTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CropTableScalarFieldEnumSchema, CropTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CropTableFindManyArgsSchema: z.ZodType<Prisma.CropTableFindManyArgs> = z.object({
  select: CropTableSelectSchema.optional(),
  include: CropTableIncludeSchema.optional(),
  where: CropTableWhereInputSchema.optional(), 
  orderBy: z.union([ CropTableOrderByWithRelationInputSchema.array(), CropTableOrderByWithRelationInputSchema ]).optional(),
  cursor: CropTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CropTableScalarFieldEnumSchema, CropTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CropTableAggregateArgsSchema: z.ZodType<Prisma.CropTableAggregateArgs> = z.object({
  where: CropTableWhereInputSchema.optional(), 
  orderBy: z.union([ CropTableOrderByWithRelationInputSchema.array(), CropTableOrderByWithRelationInputSchema ]).optional(),
  cursor: CropTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const CropTableGroupByArgsSchema: z.ZodType<Prisma.CropTableGroupByArgs> = z.object({
  where: CropTableWhereInputSchema.optional(), 
  orderBy: z.union([ CropTableOrderByWithAggregationInputSchema.array(), CropTableOrderByWithAggregationInputSchema ]).optional(),
  by: CropTableScalarFieldEnumSchema.array(), 
  having: CropTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const CropTableFindUniqueArgsSchema: z.ZodType<Prisma.CropTableFindUniqueArgs> = z.object({
  select: CropTableSelectSchema.optional(),
  include: CropTableIncludeSchema.optional(),
  where: CropTableWhereUniqueInputSchema, 
}).strict();

export const CropTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.CropTableFindUniqueOrThrowArgs> = z.object({
  select: CropTableSelectSchema.optional(),
  include: CropTableIncludeSchema.optional(),
  where: CropTableWhereUniqueInputSchema, 
}).strict();

export const PlantingTableFindFirstArgsSchema: z.ZodType<Prisma.PlantingTableFindFirstArgs> = z.object({
  select: PlantingTableSelectSchema.optional(),
  include: PlantingTableIncludeSchema.optional(),
  where: PlantingTableWhereInputSchema.optional(), 
  orderBy: z.union([ PlantingTableOrderByWithRelationInputSchema.array(), PlantingTableOrderByWithRelationInputSchema ]).optional(),
  cursor: PlantingTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PlantingTableScalarFieldEnumSchema, PlantingTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PlantingTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PlantingTableFindFirstOrThrowArgs> = z.object({
  select: PlantingTableSelectSchema.optional(),
  include: PlantingTableIncludeSchema.optional(),
  where: PlantingTableWhereInputSchema.optional(), 
  orderBy: z.union([ PlantingTableOrderByWithRelationInputSchema.array(), PlantingTableOrderByWithRelationInputSchema ]).optional(),
  cursor: PlantingTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PlantingTableScalarFieldEnumSchema, PlantingTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PlantingTableFindManyArgsSchema: z.ZodType<Prisma.PlantingTableFindManyArgs> = z.object({
  select: PlantingTableSelectSchema.optional(),
  include: PlantingTableIncludeSchema.optional(),
  where: PlantingTableWhereInputSchema.optional(), 
  orderBy: z.union([ PlantingTableOrderByWithRelationInputSchema.array(), PlantingTableOrderByWithRelationInputSchema ]).optional(),
  cursor: PlantingTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PlantingTableScalarFieldEnumSchema, PlantingTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PlantingTableAggregateArgsSchema: z.ZodType<Prisma.PlantingTableAggregateArgs> = z.object({
  where: PlantingTableWhereInputSchema.optional(), 
  orderBy: z.union([ PlantingTableOrderByWithRelationInputSchema.array(), PlantingTableOrderByWithRelationInputSchema ]).optional(),
  cursor: PlantingTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PlantingTableGroupByArgsSchema: z.ZodType<Prisma.PlantingTableGroupByArgs> = z.object({
  where: PlantingTableWhereInputSchema.optional(), 
  orderBy: z.union([ PlantingTableOrderByWithAggregationInputSchema.array(), PlantingTableOrderByWithAggregationInputSchema ]).optional(),
  by: PlantingTableScalarFieldEnumSchema.array(), 
  having: PlantingTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PlantingTableFindUniqueArgsSchema: z.ZodType<Prisma.PlantingTableFindUniqueArgs> = z.object({
  select: PlantingTableSelectSchema.optional(),
  include: PlantingTableIncludeSchema.optional(),
  where: PlantingTableWhereUniqueInputSchema, 
}).strict();

export const PlantingTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PlantingTableFindUniqueOrThrowArgs> = z.object({
  select: PlantingTableSelectSchema.optional(),
  include: PlantingTableIncludeSchema.optional(),
  where: PlantingTableWhereUniqueInputSchema, 
}).strict();

export const SpeciesTableFindFirstArgsSchema: z.ZodType<Prisma.SpeciesTableFindFirstArgs> = z.object({
  select: SpeciesTableSelectSchema.optional(),
  include: SpeciesTableIncludeSchema.optional(),
  where: SpeciesTableWhereInputSchema.optional(), 
  orderBy: z.union([ SpeciesTableOrderByWithRelationInputSchema.array(), SpeciesTableOrderByWithRelationInputSchema ]).optional(),
  cursor: SpeciesTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SpeciesTableScalarFieldEnumSchema, SpeciesTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SpeciesTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SpeciesTableFindFirstOrThrowArgs> = z.object({
  select: SpeciesTableSelectSchema.optional(),
  include: SpeciesTableIncludeSchema.optional(),
  where: SpeciesTableWhereInputSchema.optional(), 
  orderBy: z.union([ SpeciesTableOrderByWithRelationInputSchema.array(), SpeciesTableOrderByWithRelationInputSchema ]).optional(),
  cursor: SpeciesTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SpeciesTableScalarFieldEnumSchema, SpeciesTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SpeciesTableFindManyArgsSchema: z.ZodType<Prisma.SpeciesTableFindManyArgs> = z.object({
  select: SpeciesTableSelectSchema.optional(),
  include: SpeciesTableIncludeSchema.optional(),
  where: SpeciesTableWhereInputSchema.optional(), 
  orderBy: z.union([ SpeciesTableOrderByWithRelationInputSchema.array(), SpeciesTableOrderByWithRelationInputSchema ]).optional(),
  cursor: SpeciesTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SpeciesTableScalarFieldEnumSchema, SpeciesTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SpeciesTableAggregateArgsSchema: z.ZodType<Prisma.SpeciesTableAggregateArgs> = z.object({
  where: SpeciesTableWhereInputSchema.optional(), 
  orderBy: z.union([ SpeciesTableOrderByWithRelationInputSchema.array(), SpeciesTableOrderByWithRelationInputSchema ]).optional(),
  cursor: SpeciesTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SpeciesTableGroupByArgsSchema: z.ZodType<Prisma.SpeciesTableGroupByArgs> = z.object({
  where: SpeciesTableWhereInputSchema.optional(), 
  orderBy: z.union([ SpeciesTableOrderByWithAggregationInputSchema.array(), SpeciesTableOrderByWithAggregationInputSchema ]).optional(),
  by: SpeciesTableScalarFieldEnumSchema.array(), 
  having: SpeciesTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SpeciesTableFindUniqueArgsSchema: z.ZodType<Prisma.SpeciesTableFindUniqueArgs> = z.object({
  select: SpeciesTableSelectSchema.optional(),
  include: SpeciesTableIncludeSchema.optional(),
  where: SpeciesTableWhereUniqueInputSchema, 
}).strict();

export const SpeciesTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SpeciesTableFindUniqueOrThrowArgs> = z.object({
  select: SpeciesTableSelectSchema.optional(),
  include: SpeciesTableIncludeSchema.optional(),
  where: SpeciesTableWhereUniqueInputSchema, 
}).strict();

export const PolygonTableFindFirstArgsSchema: z.ZodType<Prisma.PolygonTableFindFirstArgs> = z.object({
  select: PolygonTableSelectSchema.optional(),
  include: PolygonTableIncludeSchema.optional(),
  where: PolygonTableWhereInputSchema.optional(), 
  orderBy: z.union([ PolygonTableOrderByWithRelationInputSchema.array(), PolygonTableOrderByWithRelationInputSchema ]).optional(),
  cursor: PolygonTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PolygonTableScalarFieldEnumSchema, PolygonTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PolygonTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PolygonTableFindFirstOrThrowArgs> = z.object({
  select: PolygonTableSelectSchema.optional(),
  include: PolygonTableIncludeSchema.optional(),
  where: PolygonTableWhereInputSchema.optional(), 
  orderBy: z.union([ PolygonTableOrderByWithRelationInputSchema.array(), PolygonTableOrderByWithRelationInputSchema ]).optional(),
  cursor: PolygonTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PolygonTableScalarFieldEnumSchema, PolygonTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PolygonTableFindManyArgsSchema: z.ZodType<Prisma.PolygonTableFindManyArgs> = z.object({
  select: PolygonTableSelectSchema.optional(),
  include: PolygonTableIncludeSchema.optional(),
  where: PolygonTableWhereInputSchema.optional(), 
  orderBy: z.union([ PolygonTableOrderByWithRelationInputSchema.array(), PolygonTableOrderByWithRelationInputSchema ]).optional(),
  cursor: PolygonTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PolygonTableScalarFieldEnumSchema, PolygonTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PolygonTableAggregateArgsSchema: z.ZodType<Prisma.PolygonTableAggregateArgs> = z.object({
  where: PolygonTableWhereInputSchema.optional(), 
  orderBy: z.union([ PolygonTableOrderByWithRelationInputSchema.array(), PolygonTableOrderByWithRelationInputSchema ]).optional(),
  cursor: PolygonTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PolygonTableGroupByArgsSchema: z.ZodType<Prisma.PolygonTableGroupByArgs> = z.object({
  where: PolygonTableWhereInputSchema.optional(), 
  orderBy: z.union([ PolygonTableOrderByWithAggregationInputSchema.array(), PolygonTableOrderByWithAggregationInputSchema ]).optional(),
  by: PolygonTableScalarFieldEnumSchema.array(), 
  having: PolygonTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PolygonTableFindUniqueArgsSchema: z.ZodType<Prisma.PolygonTableFindUniqueArgs> = z.object({
  select: PolygonTableSelectSchema.optional(),
  include: PolygonTableIncludeSchema.optional(),
  where: PolygonTableWhereUniqueInputSchema, 
}).strict();

export const PolygonTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PolygonTableFindUniqueOrThrowArgs> = z.object({
  select: PolygonTableSelectSchema.optional(),
  include: PolygonTableIncludeSchema.optional(),
  where: PolygonTableWhereUniqueInputSchema, 
}).strict();

export const PolyTableFindFirstArgsSchema: z.ZodType<Prisma.PolyTableFindFirstArgs> = z.object({
  select: PolyTableSelectSchema.optional(),
  include: PolyTableIncludeSchema.optional(),
  where: PolyTableWhereInputSchema.optional(), 
  orderBy: z.union([ PolyTableOrderByWithRelationInputSchema.array(), PolyTableOrderByWithRelationInputSchema ]).optional(),
  cursor: PolyTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PolyTableScalarFieldEnumSchema, PolyTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PolyTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PolyTableFindFirstOrThrowArgs> = z.object({
  select: PolyTableSelectSchema.optional(),
  include: PolyTableIncludeSchema.optional(),
  where: PolyTableWhereInputSchema.optional(), 
  orderBy: z.union([ PolyTableOrderByWithRelationInputSchema.array(), PolyTableOrderByWithRelationInputSchema ]).optional(),
  cursor: PolyTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PolyTableScalarFieldEnumSchema, PolyTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PolyTableFindManyArgsSchema: z.ZodType<Prisma.PolyTableFindManyArgs> = z.object({
  select: PolyTableSelectSchema.optional(),
  include: PolyTableIncludeSchema.optional(),
  where: PolyTableWhereInputSchema.optional(), 
  orderBy: z.union([ PolyTableOrderByWithRelationInputSchema.array(), PolyTableOrderByWithRelationInputSchema ]).optional(),
  cursor: PolyTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PolyTableScalarFieldEnumSchema, PolyTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PolyTableAggregateArgsSchema: z.ZodType<Prisma.PolyTableAggregateArgs> = z.object({
  where: PolyTableWhereInputSchema.optional(), 
  orderBy: z.union([ PolyTableOrderByWithRelationInputSchema.array(), PolyTableOrderByWithRelationInputSchema ]).optional(),
  cursor: PolyTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PolyTableGroupByArgsSchema: z.ZodType<Prisma.PolyTableGroupByArgs> = z.object({
  where: PolyTableWhereInputSchema.optional(), 
  orderBy: z.union([ PolyTableOrderByWithAggregationInputSchema.array(), PolyTableOrderByWithAggregationInputSchema ]).optional(),
  by: PolyTableScalarFieldEnumSchema.array(), 
  having: PolyTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PolyTableFindUniqueArgsSchema: z.ZodType<Prisma.PolyTableFindUniqueArgs> = z.object({
  select: PolyTableSelectSchema.optional(),
  include: PolyTableIncludeSchema.optional(),
  where: PolyTableWhereUniqueInputSchema, 
}).strict();

export const PolyTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PolyTableFindUniqueOrThrowArgs> = z.object({
  select: PolyTableSelectSchema.optional(),
  include: PolyTableIncludeSchema.optional(),
  where: PolyTableWhereUniqueInputSchema, 
}).strict();

export const StakeholderTableFindFirstArgsSchema: z.ZodType<Prisma.StakeholderTableFindFirstArgs> = z.object({
  select: StakeholderTableSelectSchema.optional(),
  include: StakeholderTableIncludeSchema.optional(),
  where: StakeholderTableWhereInputSchema.optional(), 
  orderBy: z.union([ StakeholderTableOrderByWithRelationInputSchema.array(), StakeholderTableOrderByWithRelationInputSchema ]).optional(),
  cursor: StakeholderTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StakeholderTableScalarFieldEnumSchema, StakeholderTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const StakeholderTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.StakeholderTableFindFirstOrThrowArgs> = z.object({
  select: StakeholderTableSelectSchema.optional(),
  include: StakeholderTableIncludeSchema.optional(),
  where: StakeholderTableWhereInputSchema.optional(), 
  orderBy: z.union([ StakeholderTableOrderByWithRelationInputSchema.array(), StakeholderTableOrderByWithRelationInputSchema ]).optional(),
  cursor: StakeholderTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StakeholderTableScalarFieldEnumSchema, StakeholderTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const StakeholderTableFindManyArgsSchema: z.ZodType<Prisma.StakeholderTableFindManyArgs> = z.object({
  select: StakeholderTableSelectSchema.optional(),
  include: StakeholderTableIncludeSchema.optional(),
  where: StakeholderTableWhereInputSchema.optional(), 
  orderBy: z.union([ StakeholderTableOrderByWithRelationInputSchema.array(), StakeholderTableOrderByWithRelationInputSchema ]).optional(),
  cursor: StakeholderTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StakeholderTableScalarFieldEnumSchema, StakeholderTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const StakeholderTableAggregateArgsSchema: z.ZodType<Prisma.StakeholderTableAggregateArgs> = z.object({
  where: StakeholderTableWhereInputSchema.optional(), 
  orderBy: z.union([ StakeholderTableOrderByWithRelationInputSchema.array(), StakeholderTableOrderByWithRelationInputSchema ]).optional(),
  cursor: StakeholderTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const StakeholderTableGroupByArgsSchema: z.ZodType<Prisma.StakeholderTableGroupByArgs> = z.object({
  where: StakeholderTableWhereInputSchema.optional(), 
  orderBy: z.union([ StakeholderTableOrderByWithAggregationInputSchema.array(), StakeholderTableOrderByWithAggregationInputSchema ]).optional(),
  by: StakeholderTableScalarFieldEnumSchema.array(), 
  having: StakeholderTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const StakeholderTableFindUniqueArgsSchema: z.ZodType<Prisma.StakeholderTableFindUniqueArgs> = z.object({
  select: StakeholderTableSelectSchema.optional(),
  include: StakeholderTableIncludeSchema.optional(),
  where: StakeholderTableWhereUniqueInputSchema, 
}).strict();

export const StakeholderTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.StakeholderTableFindUniqueOrThrowArgs> = z.object({
  select: StakeholderTableSelectSchema.optional(),
  include: StakeholderTableIncludeSchema.optional(),
  where: StakeholderTableWhereUniqueInputSchema, 
}).strict();

export const SourceTableFindFirstArgsSchema: z.ZodType<Prisma.SourceTableFindFirstArgs> = z.object({
  select: SourceTableSelectSchema.optional(),
  include: SourceTableIncludeSchema.optional(),
  where: SourceTableWhereInputSchema.optional(), 
  orderBy: z.union([ SourceTableOrderByWithRelationInputSchema.array(), SourceTableOrderByWithRelationInputSchema ]).optional(),
  cursor: SourceTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SourceTableScalarFieldEnumSchema, SourceTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SourceTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SourceTableFindFirstOrThrowArgs> = z.object({
  select: SourceTableSelectSchema.optional(),
  include: SourceTableIncludeSchema.optional(),
  where: SourceTableWhereInputSchema.optional(), 
  orderBy: z.union([ SourceTableOrderByWithRelationInputSchema.array(), SourceTableOrderByWithRelationInputSchema ]).optional(),
  cursor: SourceTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SourceTableScalarFieldEnumSchema, SourceTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SourceTableFindManyArgsSchema: z.ZodType<Prisma.SourceTableFindManyArgs> = z.object({
  select: SourceTableSelectSchema.optional(),
  include: SourceTableIncludeSchema.optional(),
  where: SourceTableWhereInputSchema.optional(), 
  orderBy: z.union([ SourceTableOrderByWithRelationInputSchema.array(), SourceTableOrderByWithRelationInputSchema ]).optional(),
  cursor: SourceTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SourceTableScalarFieldEnumSchema, SourceTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SourceTableAggregateArgsSchema: z.ZodType<Prisma.SourceTableAggregateArgs> = z.object({
  where: SourceTableWhereInputSchema.optional(), 
  orderBy: z.union([ SourceTableOrderByWithRelationInputSchema.array(), SourceTableOrderByWithRelationInputSchema ]).optional(),
  cursor: SourceTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SourceTableGroupByArgsSchema: z.ZodType<Prisma.SourceTableGroupByArgs> = z.object({
  where: SourceTableWhereInputSchema.optional(), 
  orderBy: z.union([ SourceTableOrderByWithAggregationInputSchema.array(), SourceTableOrderByWithAggregationInputSchema ]).optional(),
  by: SourceTableScalarFieldEnumSchema.array(), 
  having: SourceTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SourceTableFindUniqueArgsSchema: z.ZodType<Prisma.SourceTableFindUniqueArgs> = z.object({
  select: SourceTableSelectSchema.optional(),
  include: SourceTableIncludeSchema.optional(),
  where: SourceTableWhereUniqueInputSchema, 
}).strict();

export const SourceTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SourceTableFindUniqueOrThrowArgs> = z.object({
  select: SourceTableSelectSchema.optional(),
  include: SourceTableIncludeSchema.optional(),
  where: SourceTableWhereUniqueInputSchema, 
}).strict();

export const ClaimTableFindFirstArgsSchema: z.ZodType<Prisma.ClaimTableFindFirstArgs> = z.object({
  select: ClaimTableSelectSchema.optional(),
  include: ClaimTableIncludeSchema.optional(),
  where: ClaimTableWhereInputSchema.optional(), 
  orderBy: z.union([ ClaimTableOrderByWithRelationInputSchema.array(), ClaimTableOrderByWithRelationInputSchema ]).optional(),
  cursor: ClaimTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ClaimTableScalarFieldEnumSchema, ClaimTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ClaimTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ClaimTableFindFirstOrThrowArgs> = z.object({
  select: ClaimTableSelectSchema.optional(),
  include: ClaimTableIncludeSchema.optional(),
  where: ClaimTableWhereInputSchema.optional(), 
  orderBy: z.union([ ClaimTableOrderByWithRelationInputSchema.array(), ClaimTableOrderByWithRelationInputSchema ]).optional(),
  cursor: ClaimTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ClaimTableScalarFieldEnumSchema, ClaimTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ClaimTableFindManyArgsSchema: z.ZodType<Prisma.ClaimTableFindManyArgs> = z.object({
  select: ClaimTableSelectSchema.optional(),
  include: ClaimTableIncludeSchema.optional(),
  where: ClaimTableWhereInputSchema.optional(), 
  orderBy: z.union([ ClaimTableOrderByWithRelationInputSchema.array(), ClaimTableOrderByWithRelationInputSchema ]).optional(),
  cursor: ClaimTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ClaimTableScalarFieldEnumSchema, ClaimTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ClaimTableAggregateArgsSchema: z.ZodType<Prisma.ClaimTableAggregateArgs> = z.object({
  where: ClaimTableWhereInputSchema.optional(), 
  orderBy: z.union([ ClaimTableOrderByWithRelationInputSchema.array(), ClaimTableOrderByWithRelationInputSchema ]).optional(),
  cursor: ClaimTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ClaimTableGroupByArgsSchema: z.ZodType<Prisma.ClaimTableGroupByArgs> = z.object({
  where: ClaimTableWhereInputSchema.optional(), 
  orderBy: z.union([ ClaimTableOrderByWithAggregationInputSchema.array(), ClaimTableOrderByWithAggregationInputSchema ]).optional(),
  by: ClaimTableScalarFieldEnumSchema.array(), 
  having: ClaimTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ClaimTableFindUniqueArgsSchema: z.ZodType<Prisma.ClaimTableFindUniqueArgs> = z.object({
  select: ClaimTableSelectSchema.optional(),
  include: ClaimTableIncludeSchema.optional(),
  where: ClaimTableWhereUniqueInputSchema, 
}).strict();

export const ClaimTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ClaimTableFindUniqueOrThrowArgs> = z.object({
  select: ClaimTableSelectSchema.optional(),
  include: ClaimTableIncludeSchema.optional(),
  where: ClaimTableWhereUniqueInputSchema, 
}).strict();

export const OrganizationLocalTableFindFirstArgsSchema: z.ZodType<Prisma.OrganizationLocalTableFindFirstArgs> = z.object({
  select: OrganizationLocalTableSelectSchema.optional(),
  include: OrganizationLocalTableIncludeSchema.optional(),
  where: OrganizationLocalTableWhereInputSchema.optional(), 
  orderBy: z.union([ OrganizationLocalTableOrderByWithRelationInputSchema.array(), OrganizationLocalTableOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationLocalTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationLocalTableScalarFieldEnumSchema, OrganizationLocalTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OrganizationLocalTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.OrganizationLocalTableFindFirstOrThrowArgs> = z.object({
  select: OrganizationLocalTableSelectSchema.optional(),
  include: OrganizationLocalTableIncludeSchema.optional(),
  where: OrganizationLocalTableWhereInputSchema.optional(), 
  orderBy: z.union([ OrganizationLocalTableOrderByWithRelationInputSchema.array(), OrganizationLocalTableOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationLocalTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationLocalTableScalarFieldEnumSchema, OrganizationLocalTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OrganizationLocalTableFindManyArgsSchema: z.ZodType<Prisma.OrganizationLocalTableFindManyArgs> = z.object({
  select: OrganizationLocalTableSelectSchema.optional(),
  include: OrganizationLocalTableIncludeSchema.optional(),
  where: OrganizationLocalTableWhereInputSchema.optional(), 
  orderBy: z.union([ OrganizationLocalTableOrderByWithRelationInputSchema.array(), OrganizationLocalTableOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationLocalTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationLocalTableScalarFieldEnumSchema, OrganizationLocalTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OrganizationLocalTableAggregateArgsSchema: z.ZodType<Prisma.OrganizationLocalTableAggregateArgs> = z.object({
  where: OrganizationLocalTableWhereInputSchema.optional(), 
  orderBy: z.union([ OrganizationLocalTableOrderByWithRelationInputSchema.array(), OrganizationLocalTableOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationLocalTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const OrganizationLocalTableGroupByArgsSchema: z.ZodType<Prisma.OrganizationLocalTableGroupByArgs> = z.object({
  where: OrganizationLocalTableWhereInputSchema.optional(), 
  orderBy: z.union([ OrganizationLocalTableOrderByWithAggregationInputSchema.array(), OrganizationLocalTableOrderByWithAggregationInputSchema ]).optional(),
  by: OrganizationLocalTableScalarFieldEnumSchema.array(), 
  having: OrganizationLocalTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const OrganizationLocalTableFindUniqueArgsSchema: z.ZodType<Prisma.OrganizationLocalTableFindUniqueArgs> = z.object({
  select: OrganizationLocalTableSelectSchema.optional(),
  include: OrganizationLocalTableIncludeSchema.optional(),
  where: OrganizationLocalTableWhereUniqueInputSchema, 
}).strict();

export const OrganizationLocalTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.OrganizationLocalTableFindUniqueOrThrowArgs> = z.object({
  select: OrganizationLocalTableSelectSchema.optional(),
  include: OrganizationLocalTableIncludeSchema.optional(),
  where: OrganizationLocalTableWhereUniqueInputSchema, 
}).strict();

export const OrganizationMasterTableFindFirstArgsSchema: z.ZodType<Prisma.OrganizationMasterTableFindFirstArgs> = z.object({
  select: OrganizationMasterTableSelectSchema.optional(),
  include: OrganizationMasterTableIncludeSchema.optional(),
  where: OrganizationMasterTableWhereInputSchema.optional(), 
  orderBy: z.union([ OrganizationMasterTableOrderByWithRelationInputSchema.array(), OrganizationMasterTableOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationMasterTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationMasterTableScalarFieldEnumSchema, OrganizationMasterTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OrganizationMasterTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.OrganizationMasterTableFindFirstOrThrowArgs> = z.object({
  select: OrganizationMasterTableSelectSchema.optional(),
  include: OrganizationMasterTableIncludeSchema.optional(),
  where: OrganizationMasterTableWhereInputSchema.optional(), 
  orderBy: z.union([ OrganizationMasterTableOrderByWithRelationInputSchema.array(), OrganizationMasterTableOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationMasterTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationMasterTableScalarFieldEnumSchema, OrganizationMasterTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OrganizationMasterTableFindManyArgsSchema: z.ZodType<Prisma.OrganizationMasterTableFindManyArgs> = z.object({
  select: OrganizationMasterTableSelectSchema.optional(),
  include: OrganizationMasterTableIncludeSchema.optional(),
  where: OrganizationMasterTableWhereInputSchema.optional(), 
  orderBy: z.union([ OrganizationMasterTableOrderByWithRelationInputSchema.array(), OrganizationMasterTableOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationMasterTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationMasterTableScalarFieldEnumSchema, OrganizationMasterTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OrganizationMasterTableAggregateArgsSchema: z.ZodType<Prisma.OrganizationMasterTableAggregateArgs> = z.object({
  where: OrganizationMasterTableWhereInputSchema.optional(), 
  orderBy: z.union([ OrganizationMasterTableOrderByWithRelationInputSchema.array(), OrganizationMasterTableOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationMasterTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const OrganizationMasterTableGroupByArgsSchema: z.ZodType<Prisma.OrganizationMasterTableGroupByArgs> = z.object({
  where: OrganizationMasterTableWhereInputSchema.optional(), 
  orderBy: z.union([ OrganizationMasterTableOrderByWithAggregationInputSchema.array(), OrganizationMasterTableOrderByWithAggregationInputSchema ]).optional(),
  by: OrganizationMasterTableScalarFieldEnumSchema.array(), 
  having: OrganizationMasterTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const OrganizationMasterTableFindUniqueArgsSchema: z.ZodType<Prisma.OrganizationMasterTableFindUniqueArgs> = z.object({
  select: OrganizationMasterTableSelectSchema.optional(),
  include: OrganizationMasterTableIncludeSchema.optional(),
  where: OrganizationMasterTableWhereUniqueInputSchema, 
}).strict();

export const OrganizationMasterTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.OrganizationMasterTableFindUniqueOrThrowArgs> = z.object({
  select: OrganizationMasterTableSelectSchema.optional(),
  include: OrganizationMasterTableIncludeSchema.optional(),
  where: OrganizationMasterTableWhereUniqueInputSchema, 
}).strict();

export const ProjectTableCreateArgsSchema: z.ZodType<Prisma.ProjectTableCreateArgs> = z.object({
  select: ProjectTableSelectSchema.optional(),
  include: ProjectTableIncludeSchema.optional(),
  data: z.union([ ProjectTableCreateInputSchema, ProjectTableUncheckedCreateInputSchema ]),
}).strict();

export const ProjectTableUpsertArgsSchema: z.ZodType<Prisma.ProjectTableUpsertArgs> = z.object({
  select: ProjectTableSelectSchema.optional(),
  include: ProjectTableIncludeSchema.optional(),
  where: ProjectTableWhereUniqueInputSchema, 
  create: z.union([ ProjectTableCreateInputSchema, ProjectTableUncheckedCreateInputSchema ]),
  update: z.union([ ProjectTableUpdateInputSchema, ProjectTableUncheckedUpdateInputSchema ]),
}).strict();

export const ProjectTableCreateManyArgsSchema: z.ZodType<Prisma.ProjectTableCreateManyArgs> = z.object({
  data: z.union([ ProjectTableCreateManyInputSchema, ProjectTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ProjectTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ProjectTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ ProjectTableCreateManyInputSchema, ProjectTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ProjectTableDeleteArgsSchema: z.ZodType<Prisma.ProjectTableDeleteArgs> = z.object({
  select: ProjectTableSelectSchema.optional(),
  include: ProjectTableIncludeSchema.optional(),
  where: ProjectTableWhereUniqueInputSchema, 
}).strict();

export const ProjectTableUpdateArgsSchema: z.ZodType<Prisma.ProjectTableUpdateArgs> = z.object({
  select: ProjectTableSelectSchema.optional(),
  include: ProjectTableIncludeSchema.optional(),
  data: z.union([ ProjectTableUpdateInputSchema, ProjectTableUncheckedUpdateInputSchema ]),
  where: ProjectTableWhereUniqueInputSchema, 
}).strict();

export const ProjectTableUpdateManyArgsSchema: z.ZodType<Prisma.ProjectTableUpdateManyArgs> = z.object({
  data: z.union([ ProjectTableUpdateManyMutationInputSchema, ProjectTableUncheckedUpdateManyInputSchema ]),
  where: ProjectTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ProjectTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ProjectTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ProjectTableUpdateManyMutationInputSchema, ProjectTableUncheckedUpdateManyInputSchema ]),
  where: ProjectTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ProjectTableDeleteManyArgsSchema: z.ZodType<Prisma.ProjectTableDeleteManyArgs> = z.object({
  where: ProjectTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const LandTableCreateArgsSchema: z.ZodType<Prisma.LandTableCreateArgs> = z.object({
  select: LandTableSelectSchema.optional(),
  include: LandTableIncludeSchema.optional(),
  data: z.union([ LandTableCreateInputSchema, LandTableUncheckedCreateInputSchema ]),
}).strict();

export const LandTableUpsertArgsSchema: z.ZodType<Prisma.LandTableUpsertArgs> = z.object({
  select: LandTableSelectSchema.optional(),
  include: LandTableIncludeSchema.optional(),
  where: LandTableWhereUniqueInputSchema, 
  create: z.union([ LandTableCreateInputSchema, LandTableUncheckedCreateInputSchema ]),
  update: z.union([ LandTableUpdateInputSchema, LandTableUncheckedUpdateInputSchema ]),
}).strict();

export const LandTableCreateManyArgsSchema: z.ZodType<Prisma.LandTableCreateManyArgs> = z.object({
  data: z.union([ LandTableCreateManyInputSchema, LandTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const LandTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.LandTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ LandTableCreateManyInputSchema, LandTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const LandTableDeleteArgsSchema: z.ZodType<Prisma.LandTableDeleteArgs> = z.object({
  select: LandTableSelectSchema.optional(),
  include: LandTableIncludeSchema.optional(),
  where: LandTableWhereUniqueInputSchema, 
}).strict();

export const LandTableUpdateArgsSchema: z.ZodType<Prisma.LandTableUpdateArgs> = z.object({
  select: LandTableSelectSchema.optional(),
  include: LandTableIncludeSchema.optional(),
  data: z.union([ LandTableUpdateInputSchema, LandTableUncheckedUpdateInputSchema ]),
  where: LandTableWhereUniqueInputSchema, 
}).strict();

export const LandTableUpdateManyArgsSchema: z.ZodType<Prisma.LandTableUpdateManyArgs> = z.object({
  data: z.union([ LandTableUpdateManyMutationInputSchema, LandTableUncheckedUpdateManyInputSchema ]),
  where: LandTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const LandTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.LandTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ LandTableUpdateManyMutationInputSchema, LandTableUncheckedUpdateManyInputSchema ]),
  where: LandTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const LandTableDeleteManyArgsSchema: z.ZodType<Prisma.LandTableDeleteManyArgs> = z.object({
  where: LandTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CropTableCreateArgsSchema: z.ZodType<Prisma.CropTableCreateArgs> = z.object({
  select: CropTableSelectSchema.optional(),
  include: CropTableIncludeSchema.optional(),
  data: z.union([ CropTableCreateInputSchema, CropTableUncheckedCreateInputSchema ]),
}).strict();

export const CropTableUpsertArgsSchema: z.ZodType<Prisma.CropTableUpsertArgs> = z.object({
  select: CropTableSelectSchema.optional(),
  include: CropTableIncludeSchema.optional(),
  where: CropTableWhereUniqueInputSchema, 
  create: z.union([ CropTableCreateInputSchema, CropTableUncheckedCreateInputSchema ]),
  update: z.union([ CropTableUpdateInputSchema, CropTableUncheckedUpdateInputSchema ]),
}).strict();

export const CropTableCreateManyArgsSchema: z.ZodType<Prisma.CropTableCreateManyArgs> = z.object({
  data: z.union([ CropTableCreateManyInputSchema, CropTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const CropTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.CropTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ CropTableCreateManyInputSchema, CropTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const CropTableDeleteArgsSchema: z.ZodType<Prisma.CropTableDeleteArgs> = z.object({
  select: CropTableSelectSchema.optional(),
  include: CropTableIncludeSchema.optional(),
  where: CropTableWhereUniqueInputSchema, 
}).strict();

export const CropTableUpdateArgsSchema: z.ZodType<Prisma.CropTableUpdateArgs> = z.object({
  select: CropTableSelectSchema.optional(),
  include: CropTableIncludeSchema.optional(),
  data: z.union([ CropTableUpdateInputSchema, CropTableUncheckedUpdateInputSchema ]),
  where: CropTableWhereUniqueInputSchema, 
}).strict();

export const CropTableUpdateManyArgsSchema: z.ZodType<Prisma.CropTableUpdateManyArgs> = z.object({
  data: z.union([ CropTableUpdateManyMutationInputSchema, CropTableUncheckedUpdateManyInputSchema ]),
  where: CropTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CropTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.CropTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ CropTableUpdateManyMutationInputSchema, CropTableUncheckedUpdateManyInputSchema ]),
  where: CropTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CropTableDeleteManyArgsSchema: z.ZodType<Prisma.CropTableDeleteManyArgs> = z.object({
  where: CropTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PlantingTableCreateArgsSchema: z.ZodType<Prisma.PlantingTableCreateArgs> = z.object({
  select: PlantingTableSelectSchema.optional(),
  include: PlantingTableIncludeSchema.optional(),
  data: z.union([ PlantingTableCreateInputSchema, PlantingTableUncheckedCreateInputSchema ]),
}).strict();

export const PlantingTableUpsertArgsSchema: z.ZodType<Prisma.PlantingTableUpsertArgs> = z.object({
  select: PlantingTableSelectSchema.optional(),
  include: PlantingTableIncludeSchema.optional(),
  where: PlantingTableWhereUniqueInputSchema, 
  create: z.union([ PlantingTableCreateInputSchema, PlantingTableUncheckedCreateInputSchema ]),
  update: z.union([ PlantingTableUpdateInputSchema, PlantingTableUncheckedUpdateInputSchema ]),
}).strict();

export const PlantingTableCreateManyArgsSchema: z.ZodType<Prisma.PlantingTableCreateManyArgs> = z.object({
  data: z.union([ PlantingTableCreateManyInputSchema, PlantingTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PlantingTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PlantingTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ PlantingTableCreateManyInputSchema, PlantingTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PlantingTableDeleteArgsSchema: z.ZodType<Prisma.PlantingTableDeleteArgs> = z.object({
  select: PlantingTableSelectSchema.optional(),
  include: PlantingTableIncludeSchema.optional(),
  where: PlantingTableWhereUniqueInputSchema, 
}).strict();

export const PlantingTableUpdateArgsSchema: z.ZodType<Prisma.PlantingTableUpdateArgs> = z.object({
  select: PlantingTableSelectSchema.optional(),
  include: PlantingTableIncludeSchema.optional(),
  data: z.union([ PlantingTableUpdateInputSchema, PlantingTableUncheckedUpdateInputSchema ]),
  where: PlantingTableWhereUniqueInputSchema, 
}).strict();

export const PlantingTableUpdateManyArgsSchema: z.ZodType<Prisma.PlantingTableUpdateManyArgs> = z.object({
  data: z.union([ PlantingTableUpdateManyMutationInputSchema, PlantingTableUncheckedUpdateManyInputSchema ]),
  where: PlantingTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PlantingTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PlantingTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PlantingTableUpdateManyMutationInputSchema, PlantingTableUncheckedUpdateManyInputSchema ]),
  where: PlantingTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PlantingTableDeleteManyArgsSchema: z.ZodType<Prisma.PlantingTableDeleteManyArgs> = z.object({
  where: PlantingTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SpeciesTableCreateArgsSchema: z.ZodType<Prisma.SpeciesTableCreateArgs> = z.object({
  select: SpeciesTableSelectSchema.optional(),
  include: SpeciesTableIncludeSchema.optional(),
  data: z.union([ SpeciesTableCreateInputSchema, SpeciesTableUncheckedCreateInputSchema ]),
}).strict();

export const SpeciesTableUpsertArgsSchema: z.ZodType<Prisma.SpeciesTableUpsertArgs> = z.object({
  select: SpeciesTableSelectSchema.optional(),
  include: SpeciesTableIncludeSchema.optional(),
  where: SpeciesTableWhereUniqueInputSchema, 
  create: z.union([ SpeciesTableCreateInputSchema, SpeciesTableUncheckedCreateInputSchema ]),
  update: z.union([ SpeciesTableUpdateInputSchema, SpeciesTableUncheckedUpdateInputSchema ]),
}).strict();

export const SpeciesTableCreateManyArgsSchema: z.ZodType<Prisma.SpeciesTableCreateManyArgs> = z.object({
  data: z.union([ SpeciesTableCreateManyInputSchema, SpeciesTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SpeciesTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SpeciesTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ SpeciesTableCreateManyInputSchema, SpeciesTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SpeciesTableDeleteArgsSchema: z.ZodType<Prisma.SpeciesTableDeleteArgs> = z.object({
  select: SpeciesTableSelectSchema.optional(),
  include: SpeciesTableIncludeSchema.optional(),
  where: SpeciesTableWhereUniqueInputSchema, 
}).strict();

export const SpeciesTableUpdateArgsSchema: z.ZodType<Prisma.SpeciesTableUpdateArgs> = z.object({
  select: SpeciesTableSelectSchema.optional(),
  include: SpeciesTableIncludeSchema.optional(),
  data: z.union([ SpeciesTableUpdateInputSchema, SpeciesTableUncheckedUpdateInputSchema ]),
  where: SpeciesTableWhereUniqueInputSchema, 
}).strict();

export const SpeciesTableUpdateManyArgsSchema: z.ZodType<Prisma.SpeciesTableUpdateManyArgs> = z.object({
  data: z.union([ SpeciesTableUpdateManyMutationInputSchema, SpeciesTableUncheckedUpdateManyInputSchema ]),
  where: SpeciesTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SpeciesTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SpeciesTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SpeciesTableUpdateManyMutationInputSchema, SpeciesTableUncheckedUpdateManyInputSchema ]),
  where: SpeciesTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SpeciesTableDeleteManyArgsSchema: z.ZodType<Prisma.SpeciesTableDeleteManyArgs> = z.object({
  where: SpeciesTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PolygonTableCreateArgsSchema: z.ZodType<Prisma.PolygonTableCreateArgs> = z.object({
  select: PolygonTableSelectSchema.optional(),
  include: PolygonTableIncludeSchema.optional(),
  data: z.union([ PolygonTableCreateInputSchema, PolygonTableUncheckedCreateInputSchema ]),
}).strict();

export const PolygonTableUpsertArgsSchema: z.ZodType<Prisma.PolygonTableUpsertArgs> = z.object({
  select: PolygonTableSelectSchema.optional(),
  include: PolygonTableIncludeSchema.optional(),
  where: PolygonTableWhereUniqueInputSchema, 
  create: z.union([ PolygonTableCreateInputSchema, PolygonTableUncheckedCreateInputSchema ]),
  update: z.union([ PolygonTableUpdateInputSchema, PolygonTableUncheckedUpdateInputSchema ]),
}).strict();

export const PolygonTableCreateManyArgsSchema: z.ZodType<Prisma.PolygonTableCreateManyArgs> = z.object({
  data: z.union([ PolygonTableCreateManyInputSchema, PolygonTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PolygonTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PolygonTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ PolygonTableCreateManyInputSchema, PolygonTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PolygonTableDeleteArgsSchema: z.ZodType<Prisma.PolygonTableDeleteArgs> = z.object({
  select: PolygonTableSelectSchema.optional(),
  include: PolygonTableIncludeSchema.optional(),
  where: PolygonTableWhereUniqueInputSchema, 
}).strict();

export const PolygonTableUpdateArgsSchema: z.ZodType<Prisma.PolygonTableUpdateArgs> = z.object({
  select: PolygonTableSelectSchema.optional(),
  include: PolygonTableIncludeSchema.optional(),
  data: z.union([ PolygonTableUpdateInputSchema, PolygonTableUncheckedUpdateInputSchema ]),
  where: PolygonTableWhereUniqueInputSchema, 
}).strict();

export const PolygonTableUpdateManyArgsSchema: z.ZodType<Prisma.PolygonTableUpdateManyArgs> = z.object({
  data: z.union([ PolygonTableUpdateManyMutationInputSchema, PolygonTableUncheckedUpdateManyInputSchema ]),
  where: PolygonTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PolygonTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PolygonTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PolygonTableUpdateManyMutationInputSchema, PolygonTableUncheckedUpdateManyInputSchema ]),
  where: PolygonTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PolygonTableDeleteManyArgsSchema: z.ZodType<Prisma.PolygonTableDeleteManyArgs> = z.object({
  where: PolygonTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PolyTableCreateArgsSchema: z.ZodType<Prisma.PolyTableCreateArgs> = z.object({
  select: PolyTableSelectSchema.optional(),
  include: PolyTableIncludeSchema.optional(),
  data: z.union([ PolyTableCreateInputSchema, PolyTableUncheckedCreateInputSchema ]),
}).strict();

export const PolyTableUpsertArgsSchema: z.ZodType<Prisma.PolyTableUpsertArgs> = z.object({
  select: PolyTableSelectSchema.optional(),
  include: PolyTableIncludeSchema.optional(),
  where: PolyTableWhereUniqueInputSchema, 
  create: z.union([ PolyTableCreateInputSchema, PolyTableUncheckedCreateInputSchema ]),
  update: z.union([ PolyTableUpdateInputSchema, PolyTableUncheckedUpdateInputSchema ]),
}).strict();

export const PolyTableCreateManyArgsSchema: z.ZodType<Prisma.PolyTableCreateManyArgs> = z.object({
  data: z.union([ PolyTableCreateManyInputSchema, PolyTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PolyTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PolyTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ PolyTableCreateManyInputSchema, PolyTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PolyTableDeleteArgsSchema: z.ZodType<Prisma.PolyTableDeleteArgs> = z.object({
  select: PolyTableSelectSchema.optional(),
  include: PolyTableIncludeSchema.optional(),
  where: PolyTableWhereUniqueInputSchema, 
}).strict();

export const PolyTableUpdateArgsSchema: z.ZodType<Prisma.PolyTableUpdateArgs> = z.object({
  select: PolyTableSelectSchema.optional(),
  include: PolyTableIncludeSchema.optional(),
  data: z.union([ PolyTableUpdateInputSchema, PolyTableUncheckedUpdateInputSchema ]),
  where: PolyTableWhereUniqueInputSchema, 
}).strict();

export const PolyTableUpdateManyArgsSchema: z.ZodType<Prisma.PolyTableUpdateManyArgs> = z.object({
  data: z.union([ PolyTableUpdateManyMutationInputSchema, PolyTableUncheckedUpdateManyInputSchema ]),
  where: PolyTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PolyTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PolyTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PolyTableUpdateManyMutationInputSchema, PolyTableUncheckedUpdateManyInputSchema ]),
  where: PolyTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PolyTableDeleteManyArgsSchema: z.ZodType<Prisma.PolyTableDeleteManyArgs> = z.object({
  where: PolyTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const StakeholderTableCreateArgsSchema: z.ZodType<Prisma.StakeholderTableCreateArgs> = z.object({
  select: StakeholderTableSelectSchema.optional(),
  include: StakeholderTableIncludeSchema.optional(),
  data: z.union([ StakeholderTableCreateInputSchema, StakeholderTableUncheckedCreateInputSchema ]),
}).strict();

export const StakeholderTableUpsertArgsSchema: z.ZodType<Prisma.StakeholderTableUpsertArgs> = z.object({
  select: StakeholderTableSelectSchema.optional(),
  include: StakeholderTableIncludeSchema.optional(),
  where: StakeholderTableWhereUniqueInputSchema, 
  create: z.union([ StakeholderTableCreateInputSchema, StakeholderTableUncheckedCreateInputSchema ]),
  update: z.union([ StakeholderTableUpdateInputSchema, StakeholderTableUncheckedUpdateInputSchema ]),
}).strict();

export const StakeholderTableCreateManyArgsSchema: z.ZodType<Prisma.StakeholderTableCreateManyArgs> = z.object({
  data: z.union([ StakeholderTableCreateManyInputSchema, StakeholderTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const StakeholderTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.StakeholderTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ StakeholderTableCreateManyInputSchema, StakeholderTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const StakeholderTableDeleteArgsSchema: z.ZodType<Prisma.StakeholderTableDeleteArgs> = z.object({
  select: StakeholderTableSelectSchema.optional(),
  include: StakeholderTableIncludeSchema.optional(),
  where: StakeholderTableWhereUniqueInputSchema, 
}).strict();

export const StakeholderTableUpdateArgsSchema: z.ZodType<Prisma.StakeholderTableUpdateArgs> = z.object({
  select: StakeholderTableSelectSchema.optional(),
  include: StakeholderTableIncludeSchema.optional(),
  data: z.union([ StakeholderTableUpdateInputSchema, StakeholderTableUncheckedUpdateInputSchema ]),
  where: StakeholderTableWhereUniqueInputSchema, 
}).strict();

export const StakeholderTableUpdateManyArgsSchema: z.ZodType<Prisma.StakeholderTableUpdateManyArgs> = z.object({
  data: z.union([ StakeholderTableUpdateManyMutationInputSchema, StakeholderTableUncheckedUpdateManyInputSchema ]),
  where: StakeholderTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const StakeholderTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.StakeholderTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ StakeholderTableUpdateManyMutationInputSchema, StakeholderTableUncheckedUpdateManyInputSchema ]),
  where: StakeholderTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const StakeholderTableDeleteManyArgsSchema: z.ZodType<Prisma.StakeholderTableDeleteManyArgs> = z.object({
  where: StakeholderTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SourceTableCreateArgsSchema: z.ZodType<Prisma.SourceTableCreateArgs> = z.object({
  select: SourceTableSelectSchema.optional(),
  include: SourceTableIncludeSchema.optional(),
  data: z.union([ SourceTableCreateInputSchema, SourceTableUncheckedCreateInputSchema ]),
}).strict();

export const SourceTableUpsertArgsSchema: z.ZodType<Prisma.SourceTableUpsertArgs> = z.object({
  select: SourceTableSelectSchema.optional(),
  include: SourceTableIncludeSchema.optional(),
  where: SourceTableWhereUniqueInputSchema, 
  create: z.union([ SourceTableCreateInputSchema, SourceTableUncheckedCreateInputSchema ]),
  update: z.union([ SourceTableUpdateInputSchema, SourceTableUncheckedUpdateInputSchema ]),
}).strict();

export const SourceTableCreateManyArgsSchema: z.ZodType<Prisma.SourceTableCreateManyArgs> = z.object({
  data: z.union([ SourceTableCreateManyInputSchema, SourceTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SourceTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SourceTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ SourceTableCreateManyInputSchema, SourceTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SourceTableDeleteArgsSchema: z.ZodType<Prisma.SourceTableDeleteArgs> = z.object({
  select: SourceTableSelectSchema.optional(),
  include: SourceTableIncludeSchema.optional(),
  where: SourceTableWhereUniqueInputSchema, 
}).strict();

export const SourceTableUpdateArgsSchema: z.ZodType<Prisma.SourceTableUpdateArgs> = z.object({
  select: SourceTableSelectSchema.optional(),
  include: SourceTableIncludeSchema.optional(),
  data: z.union([ SourceTableUpdateInputSchema, SourceTableUncheckedUpdateInputSchema ]),
  where: SourceTableWhereUniqueInputSchema, 
}).strict();

export const SourceTableUpdateManyArgsSchema: z.ZodType<Prisma.SourceTableUpdateManyArgs> = z.object({
  data: z.union([ SourceTableUpdateManyMutationInputSchema, SourceTableUncheckedUpdateManyInputSchema ]),
  where: SourceTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SourceTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SourceTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SourceTableUpdateManyMutationInputSchema, SourceTableUncheckedUpdateManyInputSchema ]),
  where: SourceTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SourceTableDeleteManyArgsSchema: z.ZodType<Prisma.SourceTableDeleteManyArgs> = z.object({
  where: SourceTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ClaimTableCreateArgsSchema: z.ZodType<Prisma.ClaimTableCreateArgs> = z.object({
  select: ClaimTableSelectSchema.optional(),
  include: ClaimTableIncludeSchema.optional(),
  data: z.union([ ClaimTableCreateInputSchema, ClaimTableUncheckedCreateInputSchema ]),
}).strict();

export const ClaimTableUpsertArgsSchema: z.ZodType<Prisma.ClaimTableUpsertArgs> = z.object({
  select: ClaimTableSelectSchema.optional(),
  include: ClaimTableIncludeSchema.optional(),
  where: ClaimTableWhereUniqueInputSchema, 
  create: z.union([ ClaimTableCreateInputSchema, ClaimTableUncheckedCreateInputSchema ]),
  update: z.union([ ClaimTableUpdateInputSchema, ClaimTableUncheckedUpdateInputSchema ]),
}).strict();

export const ClaimTableCreateManyArgsSchema: z.ZodType<Prisma.ClaimTableCreateManyArgs> = z.object({
  data: z.union([ ClaimTableCreateManyInputSchema, ClaimTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ClaimTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ClaimTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ ClaimTableCreateManyInputSchema, ClaimTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ClaimTableDeleteArgsSchema: z.ZodType<Prisma.ClaimTableDeleteArgs> = z.object({
  select: ClaimTableSelectSchema.optional(),
  include: ClaimTableIncludeSchema.optional(),
  where: ClaimTableWhereUniqueInputSchema, 
}).strict();

export const ClaimTableUpdateArgsSchema: z.ZodType<Prisma.ClaimTableUpdateArgs> = z.object({
  select: ClaimTableSelectSchema.optional(),
  include: ClaimTableIncludeSchema.optional(),
  data: z.union([ ClaimTableUpdateInputSchema, ClaimTableUncheckedUpdateInputSchema ]),
  where: ClaimTableWhereUniqueInputSchema, 
}).strict();

export const ClaimTableUpdateManyArgsSchema: z.ZodType<Prisma.ClaimTableUpdateManyArgs> = z.object({
  data: z.union([ ClaimTableUpdateManyMutationInputSchema, ClaimTableUncheckedUpdateManyInputSchema ]),
  where: ClaimTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ClaimTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ClaimTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ClaimTableUpdateManyMutationInputSchema, ClaimTableUncheckedUpdateManyInputSchema ]),
  where: ClaimTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ClaimTableDeleteManyArgsSchema: z.ZodType<Prisma.ClaimTableDeleteManyArgs> = z.object({
  where: ClaimTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OrganizationLocalTableCreateArgsSchema: z.ZodType<Prisma.OrganizationLocalTableCreateArgs> = z.object({
  select: OrganizationLocalTableSelectSchema.optional(),
  include: OrganizationLocalTableIncludeSchema.optional(),
  data: z.union([ OrganizationLocalTableCreateInputSchema, OrganizationLocalTableUncheckedCreateInputSchema ]),
}).strict();

export const OrganizationLocalTableUpsertArgsSchema: z.ZodType<Prisma.OrganizationLocalTableUpsertArgs> = z.object({
  select: OrganizationLocalTableSelectSchema.optional(),
  include: OrganizationLocalTableIncludeSchema.optional(),
  where: OrganizationLocalTableWhereUniqueInputSchema, 
  create: z.union([ OrganizationLocalTableCreateInputSchema, OrganizationLocalTableUncheckedCreateInputSchema ]),
  update: z.union([ OrganizationLocalTableUpdateInputSchema, OrganizationLocalTableUncheckedUpdateInputSchema ]),
}).strict();

export const OrganizationLocalTableCreateManyArgsSchema: z.ZodType<Prisma.OrganizationLocalTableCreateManyArgs> = z.object({
  data: z.union([ OrganizationLocalTableCreateManyInputSchema, OrganizationLocalTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const OrganizationLocalTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.OrganizationLocalTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ OrganizationLocalTableCreateManyInputSchema, OrganizationLocalTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const OrganizationLocalTableDeleteArgsSchema: z.ZodType<Prisma.OrganizationLocalTableDeleteArgs> = z.object({
  select: OrganizationLocalTableSelectSchema.optional(),
  include: OrganizationLocalTableIncludeSchema.optional(),
  where: OrganizationLocalTableWhereUniqueInputSchema, 
}).strict();

export const OrganizationLocalTableUpdateArgsSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateArgs> = z.object({
  select: OrganizationLocalTableSelectSchema.optional(),
  include: OrganizationLocalTableIncludeSchema.optional(),
  data: z.union([ OrganizationLocalTableUpdateInputSchema, OrganizationLocalTableUncheckedUpdateInputSchema ]),
  where: OrganizationLocalTableWhereUniqueInputSchema, 
}).strict();

export const OrganizationLocalTableUpdateManyArgsSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateManyArgs> = z.object({
  data: z.union([ OrganizationLocalTableUpdateManyMutationInputSchema, OrganizationLocalTableUncheckedUpdateManyInputSchema ]),
  where: OrganizationLocalTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OrganizationLocalTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.OrganizationLocalTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ OrganizationLocalTableUpdateManyMutationInputSchema, OrganizationLocalTableUncheckedUpdateManyInputSchema ]),
  where: OrganizationLocalTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OrganizationLocalTableDeleteManyArgsSchema: z.ZodType<Prisma.OrganizationLocalTableDeleteManyArgs> = z.object({
  where: OrganizationLocalTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OrganizationMasterTableCreateArgsSchema: z.ZodType<Prisma.OrganizationMasterTableCreateArgs> = z.object({
  select: OrganizationMasterTableSelectSchema.optional(),
  include: OrganizationMasterTableIncludeSchema.optional(),
  data: z.union([ OrganizationMasterTableCreateInputSchema, OrganizationMasterTableUncheckedCreateInputSchema ]),
}).strict();

export const OrganizationMasterTableUpsertArgsSchema: z.ZodType<Prisma.OrganizationMasterTableUpsertArgs> = z.object({
  select: OrganizationMasterTableSelectSchema.optional(),
  include: OrganizationMasterTableIncludeSchema.optional(),
  where: OrganizationMasterTableWhereUniqueInputSchema, 
  create: z.union([ OrganizationMasterTableCreateInputSchema, OrganizationMasterTableUncheckedCreateInputSchema ]),
  update: z.union([ OrganizationMasterTableUpdateInputSchema, OrganizationMasterTableUncheckedUpdateInputSchema ]),
}).strict();

export const OrganizationMasterTableCreateManyArgsSchema: z.ZodType<Prisma.OrganizationMasterTableCreateManyArgs> = z.object({
  data: z.union([ OrganizationMasterTableCreateManyInputSchema, OrganizationMasterTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const OrganizationMasterTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.OrganizationMasterTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ OrganizationMasterTableCreateManyInputSchema, OrganizationMasterTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const OrganizationMasterTableDeleteArgsSchema: z.ZodType<Prisma.OrganizationMasterTableDeleteArgs> = z.object({
  select: OrganizationMasterTableSelectSchema.optional(),
  include: OrganizationMasterTableIncludeSchema.optional(),
  where: OrganizationMasterTableWhereUniqueInputSchema, 
}).strict();

export const OrganizationMasterTableUpdateArgsSchema: z.ZodType<Prisma.OrganizationMasterTableUpdateArgs> = z.object({
  select: OrganizationMasterTableSelectSchema.optional(),
  include: OrganizationMasterTableIncludeSchema.optional(),
  data: z.union([ OrganizationMasterTableUpdateInputSchema, OrganizationMasterTableUncheckedUpdateInputSchema ]),
  where: OrganizationMasterTableWhereUniqueInputSchema, 
}).strict();

export const OrganizationMasterTableUpdateManyArgsSchema: z.ZodType<Prisma.OrganizationMasterTableUpdateManyArgs> = z.object({
  data: z.union([ OrganizationMasterTableUpdateManyMutationInputSchema, OrganizationMasterTableUncheckedUpdateManyInputSchema ]),
  where: OrganizationMasterTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OrganizationMasterTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.OrganizationMasterTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ OrganizationMasterTableUpdateManyMutationInputSchema, OrganizationMasterTableUncheckedUpdateManyInputSchema ]),
  where: OrganizationMasterTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OrganizationMasterTableDeleteManyArgsSchema: z.ZodType<Prisma.OrganizationMasterTableDeleteManyArgs> = z.object({
  where: OrganizationMasterTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();