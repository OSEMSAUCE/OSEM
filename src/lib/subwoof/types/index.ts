import { z } from 'zod';
import { Prisma } from '../lib/generated/prisma-postgres';
// TEST 9:44 
/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// DECIMAL
//------------------------------------------------------

export const DecimalJsLikeSchema: z.ZodType<Prisma.DecimalJsLike> = z.object({
  d: z.array(z.number()),
  e: z.number(),
  s: z.number(),
  toFixed: z.any(),
})

export const DECIMAL_STRING_REGEX = /^(?:-?Infinity|NaN|-?(?:0[bB][01]+(?:\.[01]+)?(?:[pP][-+]?\d+)?|0[oO][0-7]+(?:\.[0-7]+)?(?:[pP][-+]?\d+)?|0[xX][\da-fA-F]+(?:\.[\da-fA-F]+)?(?:[pP][-+]?\d+)?|(?:\d+|\d*\.\d+)(?:[eE][-+]?\d+)?))$/;

export const isValidDecimalInput =
  (v?: null | string | number | Prisma.DecimalJsLike): v is string | number | Prisma.DecimalJsLike => {
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

export const ProjectTableScalarFieldEnumSchema = z.enum(['projectId','projectName','url','platformId','platform','projectNotes','createdAt','lastEditedAt','deleted','isPublic','carbonRegistryType','carbonRegistry','employmentClaim','employmentClaimDescription','projectDateEnd','projectDateStart','registryId']);

export const LandTableScalarFieldEnumSchema = z.enum(['landId','landName','projectId','hectares','gpsLat','gpsLon','landNotes','createdAt','lastEditedAt','treatmentType','editedBy','deleted','preparation']);

export const CropTableScalarFieldEnumSchema = z.enum(['cropId','cropName','projectId','speciesLocalName','speciesId','seedInfo','cropStock','createdAt','lastEditedAt','editedBy','deleted','organizationLocalName','cropNotes']);

export const PlantingTableScalarFieldEnumSchema = z.enum(['plantingId','planted','projectId','parentId','parentTable','allocated','plantingDate','createdAt','lastEditedAt','deleted','units','unitType','pricePerUnit','currency']);

export const SpeciesTableScalarFieldEnumSchema = z.enum(['speciesName','commonName','scientificName','type','family','reference','createdAt','lastEditedAt','editedBy','deleted']);

export const PolygonTableScalarFieldEnumSchema = z.enum(['polygonId','landId','landName','geometry','coordinates','type','polygonNotes','lastEditedAt']);

export const PolyTableScalarFieldEnumSchema = z.enum(['polyId','parentId','parentTable','projectId','randomJson','survivalRate','liabilityCause','ratePerTree','motivation','restorationType','reviews','createdAt','lastEditedAt','editedBy','deleted']);

export const StakeholderTableScalarFieldEnumSchema = z.enum(['stakeholderId','organizationLocalId','parentId','parentTable','projectId','stakeholderType','lastEditedAt','createdAt']);

export const SourceTableScalarFieldEnumSchema = z.enum(['sourceId','url','urlType','parentId','parentTable','projectId','disclosureType','sourceDescription','sourceCredit','lastEditedAt','createdAt']);

export const OrganizationLocalTableScalarFieldEnumSchema = z.enum(['organizationLocalName','organizationLocalId','organizationMasterId','contactName','contactEmail','contactPhone','address','polyId','website','capacityPerYear','organizationNotes','createdAt','lastEditedAt','editedBy','deleted','gpsLat','gpsLon']);

export const OrganizationMasterTableScalarFieldEnumSchema = z.enum(['organizationMasterId','organizationMasterName','officialWebsite','officialAddress','officialEmail','createdAt','lastEditedAt','editedBy']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const ParentTableSchema = z.enum(['projectTable','landTable','cropTable','plantingTable','organizationTable','sourceTable','stakeholderTable']);

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

export const projectTableSchema = z.object({
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
  isPublic: z.boolean(),
  employmentClaim: z.number().int().nullable(),
  employmentClaimDescription: z.string().nullable(),
  projectDateEnd: z.coerce.date().nullable(),
  projectDateStart: z.coerce.date().nullable(),
  registryId: z.string().nullable(),
})

export type projectTable = z.infer<typeof projectTableSchema>

/////////////////////////////////////////
// PROJECT TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const projectTablePartialSchema = projectTableSchema.partial()

export type projectTablePartial = z.infer<typeof projectTablePartialSchema>

// PROJECT TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const projectTableOptionalDefaultsSchema = projectTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
  isPublic: z.boolean().optional(),
}))

export type projectTableOptionalDefaults = z.infer<typeof projectTableOptionalDefaultsSchema>

// PROJECT TABLE RELATION SCHEMA
//------------------------------------------------------

export type projectTableRelations = {
  cropTable: cropTableWithRelations[];
  landTable: landTableWithRelations[];
  plantingTable: plantingTableWithRelations[];
  polyTable: polyTableWithRelations[];
  organizationLocalTable?: organizationLocalTableWithRelations | null;
  stakeholderTable: stakeholderTableWithRelations[];
  sourceTable: sourceTableWithRelations[];
};

export type projectTableWithRelations = z.infer<typeof projectTableSchema> & projectTableRelations

export const projectTableWithRelationsSchema: z.ZodType<projectTableWithRelations> = projectTableSchema.merge(z.object({
  cropTable: z.lazy(() => cropTableWithRelationsSchema).array(),
  landTable: z.lazy(() => landTableWithRelationsSchema).array(),
  plantingTable: z.lazy(() => plantingTableWithRelationsSchema).array(),
  polyTable: z.lazy(() => polyTableWithRelationsSchema).array(),
  organizationLocalTable: z.lazy(() => organizationLocalTableWithRelationsSchema).nullable(),
  stakeholderTable: z.lazy(() => stakeholderTableWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTableWithRelationsSchema).array(),
}))

// PROJECT TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type projectTableOptionalDefaultsRelations = {
  cropTable: cropTableOptionalDefaultsWithRelations[];
  landTable: landTableOptionalDefaultsWithRelations[];
  plantingTable: plantingTableOptionalDefaultsWithRelations[];
  polyTable: polyTableOptionalDefaultsWithRelations[];
  organizationLocalTable?: organizationLocalTableOptionalDefaultsWithRelations | null;
  stakeholderTable: stakeholderTableOptionalDefaultsWithRelations[];
  sourceTable: sourceTableOptionalDefaultsWithRelations[];
};

export type projectTableOptionalDefaultsWithRelations = z.infer<typeof projectTableOptionalDefaultsSchema> & projectTableOptionalDefaultsRelations

export const projectTableOptionalDefaultsWithRelationsSchema: z.ZodType<projectTableOptionalDefaultsWithRelations> = projectTableOptionalDefaultsSchema.merge(z.object({
  cropTable: z.lazy(() => cropTableOptionalDefaultsWithRelationsSchema).array(),
  landTable: z.lazy(() => landTableOptionalDefaultsWithRelationsSchema).array(),
  plantingTable: z.lazy(() => plantingTableOptionalDefaultsWithRelationsSchema).array(),
  polyTable: z.lazy(() => polyTableOptionalDefaultsWithRelationsSchema).array(),
  organizationLocalTable: z.lazy(() => organizationLocalTableOptionalDefaultsWithRelationsSchema).nullable(),
  stakeholderTable: z.lazy(() => stakeholderTableOptionalDefaultsWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTableOptionalDefaultsWithRelationsSchema).array(),
}))

// PROJECT TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type projectTablePartialRelations = {
  cropTable?: cropTablePartialWithRelations[];
  landTable?: landTablePartialWithRelations[];
  plantingTable?: plantingTablePartialWithRelations[];
  polyTable?: polyTablePartialWithRelations[];
  organizationLocalTable?: organizationLocalTablePartialWithRelations | null;
  stakeholderTable?: stakeholderTablePartialWithRelations[];
  sourceTable?: sourceTablePartialWithRelations[];
};

export type projectTablePartialWithRelations = z.infer<typeof projectTablePartialSchema> & projectTablePartialRelations

export const projectTablePartialWithRelationsSchema: z.ZodType<projectTablePartialWithRelations> = projectTablePartialSchema.merge(z.object({
  cropTable: z.lazy(() => cropTablePartialWithRelationsSchema).array(),
  landTable: z.lazy(() => landTablePartialWithRelationsSchema).array(),
  plantingTable: z.lazy(() => plantingTablePartialWithRelationsSchema).array(),
  polyTable: z.lazy(() => polyTablePartialWithRelationsSchema).array(),
  organizationLocalTable: z.lazy(() => organizationLocalTablePartialWithRelationsSchema).nullable(),
  stakeholderTable: z.lazy(() => stakeholderTablePartialWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
})).partial()

export type projectTableOptionalDefaultsWithPartialRelations = z.infer<typeof projectTableOptionalDefaultsSchema> & projectTablePartialRelations

export const projectTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<projectTableOptionalDefaultsWithPartialRelations> = projectTableOptionalDefaultsSchema.merge(z.object({
  cropTable: z.lazy(() => cropTablePartialWithRelationsSchema).array(),
  landTable: z.lazy(() => landTablePartialWithRelationsSchema).array(),
  plantingTable: z.lazy(() => plantingTablePartialWithRelationsSchema).array(),
  polyTable: z.lazy(() => polyTablePartialWithRelationsSchema).array(),
  organizationLocalTable: z.lazy(() => organizationLocalTablePartialWithRelationsSchema).nullable(),
  stakeholderTable: z.lazy(() => stakeholderTablePartialWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
}).partial())

export type projectTableWithPartialRelations = z.infer<typeof projectTableSchema> & projectTablePartialRelations

export const projectTableWithPartialRelationsSchema: z.ZodType<projectTableWithPartialRelations> = projectTableSchema.merge(z.object({
  cropTable: z.lazy(() => cropTablePartialWithRelationsSchema).array(),
  landTable: z.lazy(() => landTablePartialWithRelationsSchema).array(),
  plantingTable: z.lazy(() => plantingTablePartialWithRelationsSchema).array(),
  polyTable: z.lazy(() => polyTablePartialWithRelationsSchema).array(),
  organizationLocalTable: z.lazy(() => organizationLocalTablePartialWithRelationsSchema).nullable(),
  stakeholderTable: z.lazy(() => stakeholderTablePartialWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// LAND TABLE SCHEMA
/////////////////////////////////////////

export const landTableSchema = z.object({
  treatmentType: TreatmentTypeSchema.nullable(),
  landId: z.string(),
  landName: z.string(),
  projectId: z.string(),
  hectares: z.instanceof(Prisma.Decimal, { message: "Field 'hectares' must be a Decimal. Location: ['Models', 'landTable']"}).nullable(),
  gpsLat: z.instanceof(Prisma.Decimal, { message: "Field 'gpsLat' must be a Decimal. Location: ['Models', 'landTable']"}).nullable(),
  gpsLon: z.instanceof(Prisma.Decimal, { message: "Field 'gpsLon' must be a Decimal. Location: ['Models', 'landTable']"}).nullable(),
  landNotes: z.string().nullable(),
  createdAt: z.coerce.date(),
  lastEditedAt: z.coerce.date(),
  editedBy: z.string().nullable(),
  deleted: z.boolean(),
  preparation: z.string().nullable(),
})

export type landTable = z.infer<typeof landTableSchema>

/////////////////////////////////////////
// LAND TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const landTablePartialSchema = landTableSchema.partial()

export type landTablePartial = z.infer<typeof landTablePartialSchema>

// LAND TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const landTableOptionalDefaultsSchema = landTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type landTableOptionalDefaults = z.infer<typeof landTableOptionalDefaultsSchema>

// LAND TABLE RELATION SCHEMA
//------------------------------------------------------

export type landTableRelations = {
  projectTable: projectTableWithRelations;
  polygonTable: polygonTableWithRelations[];
  sourceTable: sourceTableWithRelations[];
};

export type landTableWithRelations = z.infer<typeof landTableSchema> & landTableRelations

export const landTableWithRelationsSchema: z.ZodType<landTableWithRelations> = landTableSchema.merge(z.object({
  projectTable: z.lazy(() => projectTableWithRelationsSchema),
  polygonTable: z.lazy(() => polygonTableWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTableWithRelationsSchema).array(),
}))

// LAND TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type landTableOptionalDefaultsRelations = {
  projectTable: projectTableOptionalDefaultsWithRelations;
  polygonTable: polygonTableOptionalDefaultsWithRelations[];
  sourceTable: sourceTableOptionalDefaultsWithRelations[];
};

export type landTableOptionalDefaultsWithRelations = z.infer<typeof landTableOptionalDefaultsSchema> & landTableOptionalDefaultsRelations

export const landTableOptionalDefaultsWithRelationsSchema: z.ZodType<landTableOptionalDefaultsWithRelations> = landTableOptionalDefaultsSchema.merge(z.object({
  projectTable: z.lazy(() => projectTableOptionalDefaultsWithRelationsSchema),
  polygonTable: z.lazy(() => polygonTableOptionalDefaultsWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTableOptionalDefaultsWithRelationsSchema).array(),
}))

// LAND TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type landTablePartialRelations = {
  projectTable?: projectTablePartialWithRelations;
  polygonTable?: polygonTablePartialWithRelations[];
  sourceTable?: sourceTablePartialWithRelations[];
};

export type landTablePartialWithRelations = z.infer<typeof landTablePartialSchema> & landTablePartialRelations

export const landTablePartialWithRelationsSchema: z.ZodType<landTablePartialWithRelations> = landTablePartialSchema.merge(z.object({
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema),
  polygonTable: z.lazy(() => polygonTablePartialWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
})).partial()

export type landTableOptionalDefaultsWithPartialRelations = z.infer<typeof landTableOptionalDefaultsSchema> & landTablePartialRelations

export const landTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<landTableOptionalDefaultsWithPartialRelations> = landTableOptionalDefaultsSchema.merge(z.object({
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema),
  polygonTable: z.lazy(() => polygonTablePartialWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
}).partial())

export type landTableWithPartialRelations = z.infer<typeof landTableSchema> & landTablePartialRelations

export const landTableWithPartialRelationsSchema: z.ZodType<landTableWithPartialRelations> = landTableSchema.merge(z.object({
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema),
  polygonTable: z.lazy(() => polygonTablePartialWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// CROP TABLE SCHEMA
/////////////////////////////////////////

export const cropTableSchema = z.object({
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

export type cropTable = z.infer<typeof cropTableSchema>

/////////////////////////////////////////
// CROP TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const cropTablePartialSchema = cropTableSchema.partial()

export type cropTablePartial = z.infer<typeof cropTablePartialSchema>

// CROP TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const cropTableOptionalDefaultsSchema = cropTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type cropTableOptionalDefaults = z.infer<typeof cropTableOptionalDefaultsSchema>

// CROP TABLE RELATION SCHEMA
//------------------------------------------------------

export type cropTableRelations = {
  projectTable?: projectTableWithRelations | null;
  sourceTable: sourceTableWithRelations[];
  speciesTable: speciesTableWithRelations[];
};

export type cropTableWithRelations = z.infer<typeof cropTableSchema> & cropTableRelations

export const cropTableWithRelationsSchema: z.ZodType<cropTableWithRelations> = cropTableSchema.merge(z.object({
  projectTable: z.lazy(() => projectTableWithRelationsSchema).nullable(),
  sourceTable: z.lazy(() => sourceTableWithRelationsSchema).array(),
  speciesTable: z.lazy(() => speciesTableWithRelationsSchema).array(),
}))

// CROP TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type cropTableOptionalDefaultsRelations = {
  projectTable?: projectTableOptionalDefaultsWithRelations | null;
  sourceTable: sourceTableOptionalDefaultsWithRelations[];
  speciesTable: speciesTableOptionalDefaultsWithRelations[];
};

export type cropTableOptionalDefaultsWithRelations = z.infer<typeof cropTableOptionalDefaultsSchema> & cropTableOptionalDefaultsRelations

export const cropTableOptionalDefaultsWithRelationsSchema: z.ZodType<cropTableOptionalDefaultsWithRelations> = cropTableOptionalDefaultsSchema.merge(z.object({
  projectTable: z.lazy(() => projectTableOptionalDefaultsWithRelationsSchema).nullable(),
  sourceTable: z.lazy(() => sourceTableOptionalDefaultsWithRelationsSchema).array(),
  speciesTable: z.lazy(() => speciesTableOptionalDefaultsWithRelationsSchema).array(),
}))

// CROP TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type cropTablePartialRelations = {
  projectTable?: projectTablePartialWithRelations | null;
  sourceTable?: sourceTablePartialWithRelations[];
  speciesTable?: speciesTablePartialWithRelations[];
};

export type cropTablePartialWithRelations = z.infer<typeof cropTablePartialSchema> & cropTablePartialRelations

export const cropTablePartialWithRelationsSchema: z.ZodType<cropTablePartialWithRelations> = cropTablePartialSchema.merge(z.object({
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema).nullable(),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
  speciesTable: z.lazy(() => speciesTablePartialWithRelationsSchema).array(),
})).partial()

export type cropTableOptionalDefaultsWithPartialRelations = z.infer<typeof cropTableOptionalDefaultsSchema> & cropTablePartialRelations

export const cropTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<cropTableOptionalDefaultsWithPartialRelations> = cropTableOptionalDefaultsSchema.merge(z.object({
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema).nullable(),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
  speciesTable: z.lazy(() => speciesTablePartialWithRelationsSchema).array(),
}).partial())

export type cropTableWithPartialRelations = z.infer<typeof cropTableSchema> & cropTablePartialRelations

export const cropTableWithPartialRelationsSchema: z.ZodType<cropTableWithPartialRelations> = cropTableSchema.merge(z.object({
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema).nullable(),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
  speciesTable: z.lazy(() => speciesTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// PLANTING TABLE SCHEMA
/////////////////////////////////////////

export const plantingTableSchema = z.object({
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
  units: z.instanceof(Prisma.Decimal, { message: "Field 'units' must be a Decimal. Location: ['Models', 'plantingTable']"}).nullable(),
  pricePerUnit: z.instanceof(Prisma.Decimal, { message: "Field 'pricePerUnit' must be a Decimal. Location: ['Models', 'plantingTable']"}).nullable(),
  currency: z.string().nullable(),
})

export type plantingTable = z.infer<typeof plantingTableSchema>

/////////////////////////////////////////
// PLANTING TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const plantingTablePartialSchema = plantingTableSchema.partial()

export type plantingTablePartial = z.infer<typeof plantingTablePartialSchema>

// PLANTING TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const plantingTableOptionalDefaultsSchema = plantingTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type plantingTableOptionalDefaults = z.infer<typeof plantingTableOptionalDefaultsSchema>

// PLANTING TABLE RELATION SCHEMA
//------------------------------------------------------

export type plantingTableRelations = {
  projectTable: projectTableWithRelations;
  sourceTable: sourceTableWithRelations[];
};

export type plantingTableWithRelations = z.infer<typeof plantingTableSchema> & plantingTableRelations

export const plantingTableWithRelationsSchema: z.ZodType<plantingTableWithRelations> = plantingTableSchema.merge(z.object({
  projectTable: z.lazy(() => projectTableWithRelationsSchema),
  sourceTable: z.lazy(() => sourceTableWithRelationsSchema).array(),
}))

// PLANTING TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type plantingTableOptionalDefaultsRelations = {
  projectTable: projectTableOptionalDefaultsWithRelations;
  sourceTable: sourceTableOptionalDefaultsWithRelations[];
};

export type plantingTableOptionalDefaultsWithRelations = z.infer<typeof plantingTableOptionalDefaultsSchema> & plantingTableOptionalDefaultsRelations

export const plantingTableOptionalDefaultsWithRelationsSchema: z.ZodType<plantingTableOptionalDefaultsWithRelations> = plantingTableOptionalDefaultsSchema.merge(z.object({
  projectTable: z.lazy(() => projectTableOptionalDefaultsWithRelationsSchema),
  sourceTable: z.lazy(() => sourceTableOptionalDefaultsWithRelationsSchema).array(),
}))

// PLANTING TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type plantingTablePartialRelations = {
  projectTable?: projectTablePartialWithRelations;
  sourceTable?: sourceTablePartialWithRelations[];
};

export type plantingTablePartialWithRelations = z.infer<typeof plantingTablePartialSchema> & plantingTablePartialRelations

export const plantingTablePartialWithRelationsSchema: z.ZodType<plantingTablePartialWithRelations> = plantingTablePartialSchema.merge(z.object({
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
})).partial()

export type plantingTableOptionalDefaultsWithPartialRelations = z.infer<typeof plantingTableOptionalDefaultsSchema> & plantingTablePartialRelations

export const plantingTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<plantingTableOptionalDefaultsWithPartialRelations> = plantingTableOptionalDefaultsSchema.merge(z.object({
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
}).partial())

export type plantingTableWithPartialRelations = z.infer<typeof plantingTableSchema> & plantingTablePartialRelations

export const plantingTableWithPartialRelationsSchema: z.ZodType<plantingTableWithPartialRelations> = plantingTableSchema.merge(z.object({
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// SPECIES TABLE SCHEMA
/////////////////////////////////////////

export const speciesTableSchema = z.object({
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

export type speciesTable = z.infer<typeof speciesTableSchema>

/////////////////////////////////////////
// SPECIES TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const speciesTablePartialSchema = speciesTableSchema.partial()

export type speciesTablePartial = z.infer<typeof speciesTablePartialSchema>

// SPECIES TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const speciesTableOptionalDefaultsSchema = speciesTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type speciesTableOptionalDefaults = z.infer<typeof speciesTableOptionalDefaultsSchema>

// SPECIES TABLE RELATION SCHEMA
//------------------------------------------------------

export type speciesTableRelations = {
  cropTable: cropTableWithRelations[];
};

export type speciesTableWithRelations = z.infer<typeof speciesTableSchema> & speciesTableRelations

export const speciesTableWithRelationsSchema: z.ZodType<speciesTableWithRelations> = speciesTableSchema.merge(z.object({
  cropTable: z.lazy(() => cropTableWithRelationsSchema).array(),
}))

// SPECIES TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type speciesTableOptionalDefaultsRelations = {
  cropTable: cropTableOptionalDefaultsWithRelations[];
};

export type speciesTableOptionalDefaultsWithRelations = z.infer<typeof speciesTableOptionalDefaultsSchema> & speciesTableOptionalDefaultsRelations

export const speciesTableOptionalDefaultsWithRelationsSchema: z.ZodType<speciesTableOptionalDefaultsWithRelations> = speciesTableOptionalDefaultsSchema.merge(z.object({
  cropTable: z.lazy(() => cropTableOptionalDefaultsWithRelationsSchema).array(),
}))

// SPECIES TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type speciesTablePartialRelations = {
  cropTable?: cropTablePartialWithRelations[];
};

export type speciesTablePartialWithRelations = z.infer<typeof speciesTablePartialSchema> & speciesTablePartialRelations

export const speciesTablePartialWithRelationsSchema: z.ZodType<speciesTablePartialWithRelations> = speciesTablePartialSchema.merge(z.object({
  cropTable: z.lazy(() => cropTablePartialWithRelationsSchema).array(),
})).partial()

export type speciesTableOptionalDefaultsWithPartialRelations = z.infer<typeof speciesTableOptionalDefaultsSchema> & speciesTablePartialRelations

export const speciesTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<speciesTableOptionalDefaultsWithPartialRelations> = speciesTableOptionalDefaultsSchema.merge(z.object({
  cropTable: z.lazy(() => cropTablePartialWithRelationsSchema).array(),
}).partial())

export type speciesTableWithPartialRelations = z.infer<typeof speciesTableSchema> & speciesTablePartialRelations

export const speciesTableWithPartialRelationsSchema: z.ZodType<speciesTableWithPartialRelations> = speciesTableSchema.merge(z.object({
  cropTable: z.lazy(() => cropTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// POLYGON TABLE SCHEMA
/////////////////////////////////////////

export const polygonTableSchema = z.object({
  polygonId: z.string(),
  landId: z.string(),
  landName: z.string().nullable(),
  geometry: z.string().nullable(),
  coordinates: z.string().nullable(),
  type: z.string().nullable(),
  polygonNotes: z.string().nullable(),
  lastEditedAt: z.coerce.date(),
})

export type polygonTable = z.infer<typeof polygonTableSchema>

/////////////////////////////////////////
// POLYGON TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const polygonTablePartialSchema = polygonTableSchema.partial()

export type polygonTablePartial = z.infer<typeof polygonTablePartialSchema>

// POLYGON TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const polygonTableOptionalDefaultsSchema = polygonTableSchema.merge(z.object({
  lastEditedAt: z.coerce.date().optional(),
}))

export type polygonTableOptionalDefaults = z.infer<typeof polygonTableOptionalDefaultsSchema>

// POLYGON TABLE RELATION SCHEMA
//------------------------------------------------------

export type polygonTableRelations = {
  landTable: landTableWithRelations;
};

export type polygonTableWithRelations = z.infer<typeof polygonTableSchema> & polygonTableRelations

export const polygonTableWithRelationsSchema: z.ZodType<polygonTableWithRelations> = polygonTableSchema.merge(z.object({
  landTable: z.lazy(() => landTableWithRelationsSchema),
}))

// POLYGON TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type polygonTableOptionalDefaultsRelations = {
  landTable: landTableOptionalDefaultsWithRelations;
};

export type polygonTableOptionalDefaultsWithRelations = z.infer<typeof polygonTableOptionalDefaultsSchema> & polygonTableOptionalDefaultsRelations

export const polygonTableOptionalDefaultsWithRelationsSchema: z.ZodType<polygonTableOptionalDefaultsWithRelations> = polygonTableOptionalDefaultsSchema.merge(z.object({
  landTable: z.lazy(() => landTableOptionalDefaultsWithRelationsSchema),
}))

// POLYGON TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type polygonTablePartialRelations = {
  landTable?: landTablePartialWithRelations;
};

export type polygonTablePartialWithRelations = z.infer<typeof polygonTablePartialSchema> & polygonTablePartialRelations

export const polygonTablePartialWithRelationsSchema: z.ZodType<polygonTablePartialWithRelations> = polygonTablePartialSchema.merge(z.object({
  landTable: z.lazy(() => landTablePartialWithRelationsSchema),
})).partial()

export type polygonTableOptionalDefaultsWithPartialRelations = z.infer<typeof polygonTableOptionalDefaultsSchema> & polygonTablePartialRelations

export const polygonTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<polygonTableOptionalDefaultsWithPartialRelations> = polygonTableOptionalDefaultsSchema.merge(z.object({
  landTable: z.lazy(() => landTablePartialWithRelationsSchema),
}).partial())

export type polygonTableWithPartialRelations = z.infer<typeof polygonTableSchema> & polygonTablePartialRelations

export const polygonTableWithPartialRelationsSchema: z.ZodType<polygonTableWithPartialRelations> = polygonTableSchema.merge(z.object({
  landTable: z.lazy(() => landTablePartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// POLY TABLE SCHEMA
/////////////////////////////////////////

export const polyTableSchema = z.object({
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

export type polyTable = z.infer<typeof polyTableSchema>

/////////////////////////////////////////
// POLY TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const polyTablePartialSchema = polyTableSchema.partial()

export type polyTablePartial = z.infer<typeof polyTablePartialSchema>

// POLY TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const polyTableOptionalDefaultsSchema = polyTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type polyTableOptionalDefaults = z.infer<typeof polyTableOptionalDefaultsSchema>

// POLY TABLE RELATION SCHEMA
//------------------------------------------------------

export type polyTableRelations = {
  projectTable: projectTableWithRelations;
};

export type polyTableWithRelations = z.infer<typeof polyTableSchema> & polyTableRelations

export const polyTableWithRelationsSchema: z.ZodType<polyTableWithRelations> = polyTableSchema.merge(z.object({
  projectTable: z.lazy(() => projectTableWithRelationsSchema),
}))

// POLY TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type polyTableOptionalDefaultsRelations = {
  projectTable: projectTableOptionalDefaultsWithRelations;
};

export type polyTableOptionalDefaultsWithRelations = z.infer<typeof polyTableOptionalDefaultsSchema> & polyTableOptionalDefaultsRelations

export const polyTableOptionalDefaultsWithRelationsSchema: z.ZodType<polyTableOptionalDefaultsWithRelations> = polyTableOptionalDefaultsSchema.merge(z.object({
  projectTable: z.lazy(() => projectTableOptionalDefaultsWithRelationsSchema),
}))

// POLY TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type polyTablePartialRelations = {
  projectTable?: projectTablePartialWithRelations;
};

export type polyTablePartialWithRelations = z.infer<typeof polyTablePartialSchema> & polyTablePartialRelations

export const polyTablePartialWithRelationsSchema: z.ZodType<polyTablePartialWithRelations> = polyTablePartialSchema.merge(z.object({
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema),
})).partial()

export type polyTableOptionalDefaultsWithPartialRelations = z.infer<typeof polyTableOptionalDefaultsSchema> & polyTablePartialRelations

export const polyTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<polyTableOptionalDefaultsWithPartialRelations> = polyTableOptionalDefaultsSchema.merge(z.object({
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema),
}).partial())

export type polyTableWithPartialRelations = z.infer<typeof polyTableSchema> & polyTablePartialRelations

export const polyTableWithPartialRelationsSchema: z.ZodType<polyTableWithPartialRelations> = polyTableSchema.merge(z.object({
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// STAKEHOLDER TABLE SCHEMA
/////////////////////////////////////////

export const stakeholderTableSchema = z.object({
  parentTable: ParentTableSchema,
  stakeholderType: StakeholderTypeSchema.nullable(),
  stakeholderId: z.string(),
  organizationLocalId: z.string(),
  parentId: z.string(),
  projectId: z.string().nullable(),
  lastEditedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export type stakeholderTable = z.infer<typeof stakeholderTableSchema>

/////////////////////////////////////////
// STAKEHOLDER TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const stakeholderTablePartialSchema = stakeholderTableSchema.partial()

export type stakeholderTablePartial = z.infer<typeof stakeholderTablePartialSchema>

// STAKEHOLDER TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const stakeholderTableOptionalDefaultsSchema = stakeholderTableSchema.merge(z.object({
  lastEditedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type stakeholderTableOptionalDefaults = z.infer<typeof stakeholderTableOptionalDefaultsSchema>

// STAKEHOLDER TABLE RELATION SCHEMA
//------------------------------------------------------

export type stakeholderTableRelations = {
  organizationLocalTable: organizationLocalTableWithRelations;
  projectTable?: projectTableWithRelations | null;
};

export type stakeholderTableWithRelations = z.infer<typeof stakeholderTableSchema> & stakeholderTableRelations

export const stakeholderTableWithRelationsSchema: z.ZodType<stakeholderTableWithRelations> = stakeholderTableSchema.merge(z.object({
  organizationLocalTable: z.lazy(() => organizationLocalTableWithRelationsSchema),
  projectTable: z.lazy(() => projectTableWithRelationsSchema).nullable(),
}))

// STAKEHOLDER TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type stakeholderTableOptionalDefaultsRelations = {
  organizationLocalTable: organizationLocalTableOptionalDefaultsWithRelations;
  projectTable?: projectTableOptionalDefaultsWithRelations | null;
};

export type stakeholderTableOptionalDefaultsWithRelations = z.infer<typeof stakeholderTableOptionalDefaultsSchema> & stakeholderTableOptionalDefaultsRelations

export const stakeholderTableOptionalDefaultsWithRelationsSchema: z.ZodType<stakeholderTableOptionalDefaultsWithRelations> = stakeholderTableOptionalDefaultsSchema.merge(z.object({
  organizationLocalTable: z.lazy(() => organizationLocalTableOptionalDefaultsWithRelationsSchema),
  projectTable: z.lazy(() => projectTableOptionalDefaultsWithRelationsSchema).nullable(),
}))

// STAKEHOLDER TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type stakeholderTablePartialRelations = {
  organizationLocalTable?: organizationLocalTablePartialWithRelations;
  projectTable?: projectTablePartialWithRelations | null;
};

export type stakeholderTablePartialWithRelations = z.infer<typeof stakeholderTablePartialSchema> & stakeholderTablePartialRelations

export const stakeholderTablePartialWithRelationsSchema: z.ZodType<stakeholderTablePartialWithRelations> = stakeholderTablePartialSchema.merge(z.object({
  organizationLocalTable: z.lazy(() => organizationLocalTablePartialWithRelationsSchema),
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema).nullable(),
})).partial()

export type stakeholderTableOptionalDefaultsWithPartialRelations = z.infer<typeof stakeholderTableOptionalDefaultsSchema> & stakeholderTablePartialRelations

export const stakeholderTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<stakeholderTableOptionalDefaultsWithPartialRelations> = stakeholderTableOptionalDefaultsSchema.merge(z.object({
  organizationLocalTable: z.lazy(() => organizationLocalTablePartialWithRelationsSchema),
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema).nullable(),
}).partial())

export type stakeholderTableWithPartialRelations = z.infer<typeof stakeholderTableSchema> & stakeholderTablePartialRelations

export const stakeholderTableWithPartialRelationsSchema: z.ZodType<stakeholderTableWithPartialRelations> = stakeholderTableSchema.merge(z.object({
  organizationLocalTable: z.lazy(() => organizationLocalTablePartialWithRelationsSchema),
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema).nullable(),
}).partial())

/////////////////////////////////////////
// SOURCE TABLE SCHEMA
/////////////////////////////////////////

export const sourceTableSchema = z.object({
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

export type sourceTable = z.infer<typeof sourceTableSchema>

/////////////////////////////////////////
// SOURCE TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const sourceTablePartialSchema = sourceTableSchema.partial()

export type sourceTablePartial = z.infer<typeof sourceTablePartialSchema>

// SOURCE TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const sourceTableOptionalDefaultsSchema = sourceTableSchema.merge(z.object({
  lastEditedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type sourceTableOptionalDefaults = z.infer<typeof sourceTableOptionalDefaultsSchema>

// SOURCE TABLE RELATION SCHEMA
//------------------------------------------------------

export type sourceTableRelations = {
  cropTable: cropTableWithRelations[];
  landTable: landTableWithRelations[];
  organizationLocalTable: organizationLocalTableWithRelations[];
  plantingTable: plantingTableWithRelations[];
  projectTable: projectTableWithRelations[];
};

export type sourceTableWithRelations = z.infer<typeof sourceTableSchema> & sourceTableRelations

export const sourceTableWithRelationsSchema: z.ZodType<sourceTableWithRelations> = sourceTableSchema.merge(z.object({
  cropTable: z.lazy(() => cropTableWithRelationsSchema).array(),
  landTable: z.lazy(() => landTableWithRelationsSchema).array(),
  organizationLocalTable: z.lazy(() => organizationLocalTableWithRelationsSchema).array(),
  plantingTable: z.lazy(() => plantingTableWithRelationsSchema).array(),
  projectTable: z.lazy(() => projectTableWithRelationsSchema).array(),
}))

// SOURCE TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type sourceTableOptionalDefaultsRelations = {
  cropTable: cropTableOptionalDefaultsWithRelations[];
  landTable: landTableOptionalDefaultsWithRelations[];
  organizationLocalTable: organizationLocalTableOptionalDefaultsWithRelations[];
  plantingTable: plantingTableOptionalDefaultsWithRelations[];
  projectTable: projectTableOptionalDefaultsWithRelations[];
};

export type sourceTableOptionalDefaultsWithRelations = z.infer<typeof sourceTableOptionalDefaultsSchema> & sourceTableOptionalDefaultsRelations

export const sourceTableOptionalDefaultsWithRelationsSchema: z.ZodType<sourceTableOptionalDefaultsWithRelations> = sourceTableOptionalDefaultsSchema.merge(z.object({
  cropTable: z.lazy(() => cropTableOptionalDefaultsWithRelationsSchema).array(),
  landTable: z.lazy(() => landTableOptionalDefaultsWithRelationsSchema).array(),
  organizationLocalTable: z.lazy(() => organizationLocalTableOptionalDefaultsWithRelationsSchema).array(),
  plantingTable: z.lazy(() => plantingTableOptionalDefaultsWithRelationsSchema).array(),
  projectTable: z.lazy(() => projectTableOptionalDefaultsWithRelationsSchema).array(),
}))

// SOURCE TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type sourceTablePartialRelations = {
  cropTable?: cropTablePartialWithRelations[];
  landTable?: landTablePartialWithRelations[];
  organizationLocalTable?: organizationLocalTablePartialWithRelations[];
  plantingTable?: plantingTablePartialWithRelations[];
  projectTable?: projectTablePartialWithRelations[];
};

export type sourceTablePartialWithRelations = z.infer<typeof sourceTablePartialSchema> & sourceTablePartialRelations

export const sourceTablePartialWithRelationsSchema: z.ZodType<sourceTablePartialWithRelations> = sourceTablePartialSchema.merge(z.object({
  cropTable: z.lazy(() => cropTablePartialWithRelationsSchema).array(),
  landTable: z.lazy(() => landTablePartialWithRelationsSchema).array(),
  organizationLocalTable: z.lazy(() => organizationLocalTablePartialWithRelationsSchema).array(),
  plantingTable: z.lazy(() => plantingTablePartialWithRelationsSchema).array(),
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema).array(),
})).partial()

export type sourceTableOptionalDefaultsWithPartialRelations = z.infer<typeof sourceTableOptionalDefaultsSchema> & sourceTablePartialRelations

export const sourceTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<sourceTableOptionalDefaultsWithPartialRelations> = sourceTableOptionalDefaultsSchema.merge(z.object({
  cropTable: z.lazy(() => cropTablePartialWithRelationsSchema).array(),
  landTable: z.lazy(() => landTablePartialWithRelationsSchema).array(),
  organizationLocalTable: z.lazy(() => organizationLocalTablePartialWithRelationsSchema).array(),
  plantingTable: z.lazy(() => plantingTablePartialWithRelationsSchema).array(),
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema).array(),
}).partial())

export type sourceTableWithPartialRelations = z.infer<typeof sourceTableSchema> & sourceTablePartialRelations

export const sourceTableWithPartialRelationsSchema: z.ZodType<sourceTableWithPartialRelations> = sourceTableSchema.merge(z.object({
  cropTable: z.lazy(() => cropTablePartialWithRelationsSchema).array(),
  landTable: z.lazy(() => landTablePartialWithRelationsSchema).array(),
  organizationLocalTable: z.lazy(() => organizationLocalTablePartialWithRelationsSchema).array(),
  plantingTable: z.lazy(() => plantingTablePartialWithRelationsSchema).array(),
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// ORGANIZATION LOCAL TABLE SCHEMA
/////////////////////////////////////////

export const organizationLocalTableSchema = z.object({
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

export type organizationLocalTable = z.infer<typeof organizationLocalTableSchema>

/////////////////////////////////////////
// ORGANIZATION LOCAL TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const organizationLocalTablePartialSchema = organizationLocalTableSchema.partial()

export type organizationLocalTablePartial = z.infer<typeof organizationLocalTablePartialSchema>

// ORGANIZATION LOCAL TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const organizationLocalTableOptionalDefaultsSchema = organizationLocalTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
}))

export type organizationLocalTableOptionalDefaults = z.infer<typeof organizationLocalTableOptionalDefaultsSchema>

// ORGANIZATION LOCAL TABLE RELATION SCHEMA
//------------------------------------------------------

export type organizationLocalTableRelations = {
  organizationMasterTable?: organizationMasterTableWithRelations | null;
  projectTable: projectTableWithRelations[];
  stakeholderTable: stakeholderTableWithRelations[];
  sourceTable: sourceTableWithRelations[];
};

export type organizationLocalTableWithRelations = z.infer<typeof organizationLocalTableSchema> & organizationLocalTableRelations

export const organizationLocalTableWithRelationsSchema: z.ZodType<organizationLocalTableWithRelations> = organizationLocalTableSchema.merge(z.object({
  organizationMasterTable: z.lazy(() => organizationMasterTableWithRelationsSchema).nullable(),
  projectTable: z.lazy(() => projectTableWithRelationsSchema).array(),
  stakeholderTable: z.lazy(() => stakeholderTableWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTableWithRelationsSchema).array(),
}))

// ORGANIZATION LOCAL TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type organizationLocalTableOptionalDefaultsRelations = {
  organizationMasterTable?: organizationMasterTableOptionalDefaultsWithRelations | null;
  projectTable: projectTableOptionalDefaultsWithRelations[];
  stakeholderTable: stakeholderTableOptionalDefaultsWithRelations[];
  sourceTable: sourceTableOptionalDefaultsWithRelations[];
};

export type organizationLocalTableOptionalDefaultsWithRelations = z.infer<typeof organizationLocalTableOptionalDefaultsSchema> & organizationLocalTableOptionalDefaultsRelations

export const organizationLocalTableOptionalDefaultsWithRelationsSchema: z.ZodType<organizationLocalTableOptionalDefaultsWithRelations> = organizationLocalTableOptionalDefaultsSchema.merge(z.object({
  organizationMasterTable: z.lazy(() => organizationMasterTableOptionalDefaultsWithRelationsSchema).nullable(),
  projectTable: z.lazy(() => projectTableOptionalDefaultsWithRelationsSchema).array(),
  stakeholderTable: z.lazy(() => stakeholderTableOptionalDefaultsWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTableOptionalDefaultsWithRelationsSchema).array(),
}))

// ORGANIZATION LOCAL TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type organizationLocalTablePartialRelations = {
  organizationMasterTable?: organizationMasterTablePartialWithRelations | null;
  projectTable?: projectTablePartialWithRelations[];
  stakeholderTable?: stakeholderTablePartialWithRelations[];
  sourceTable?: sourceTablePartialWithRelations[];
};

export type organizationLocalTablePartialWithRelations = z.infer<typeof organizationLocalTablePartialSchema> & organizationLocalTablePartialRelations

export const organizationLocalTablePartialWithRelationsSchema: z.ZodType<organizationLocalTablePartialWithRelations> = organizationLocalTablePartialSchema.merge(z.object({
  organizationMasterTable: z.lazy(() => organizationMasterTablePartialWithRelationsSchema).nullable(),
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema).array(),
  stakeholderTable: z.lazy(() => stakeholderTablePartialWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
})).partial()

export type organizationLocalTableOptionalDefaultsWithPartialRelations = z.infer<typeof organizationLocalTableOptionalDefaultsSchema> & organizationLocalTablePartialRelations

export const organizationLocalTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<organizationLocalTableOptionalDefaultsWithPartialRelations> = organizationLocalTableOptionalDefaultsSchema.merge(z.object({
  organizationMasterTable: z.lazy(() => organizationMasterTablePartialWithRelationsSchema).nullable(),
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema).array(),
  stakeholderTable: z.lazy(() => stakeholderTablePartialWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
}).partial())

export type organizationLocalTableWithPartialRelations = z.infer<typeof organizationLocalTableSchema> & organizationLocalTablePartialRelations

export const organizationLocalTableWithPartialRelationsSchema: z.ZodType<organizationLocalTableWithPartialRelations> = organizationLocalTableSchema.merge(z.object({
  organizationMasterTable: z.lazy(() => organizationMasterTablePartialWithRelationsSchema).nullable(),
  projectTable: z.lazy(() => projectTablePartialWithRelationsSchema).array(),
  stakeholderTable: z.lazy(() => stakeholderTablePartialWithRelationsSchema).array(),
  sourceTable: z.lazy(() => sourceTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// ORGANIZATION MASTER TABLE SCHEMA
/////////////////////////////////////////

export const organizationMasterTableSchema = z.object({
  organizationMasterId: z.string(),
  organizationMasterName: z.string(),
  officialWebsite: z.string().nullable(),
  officialAddress: z.string().nullable(),
  officialEmail: z.string().nullable(),
  createdAt: z.coerce.date(),
  lastEditedAt: z.coerce.date(),
  editedBy: z.string().nullable(),
})

export type organizationMasterTable = z.infer<typeof organizationMasterTableSchema>

/////////////////////////////////////////
// ORGANIZATION MASTER TABLE PARTIAL SCHEMA
/////////////////////////////////////////

export const organizationMasterTablePartialSchema = organizationMasterTableSchema.partial()

export type organizationMasterTablePartial = z.infer<typeof organizationMasterTablePartialSchema>

// ORGANIZATION MASTER TABLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const organizationMasterTableOptionalDefaultsSchema = organizationMasterTableSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  lastEditedAt: z.coerce.date().optional(),
}))

export type organizationMasterTableOptionalDefaults = z.infer<typeof organizationMasterTableOptionalDefaultsSchema>

// ORGANIZATION MASTER TABLE RELATION SCHEMA
//------------------------------------------------------

export type organizationMasterTableRelations = {
  organizationLocalTable: organizationLocalTableWithRelations[];
};

export type organizationMasterTableWithRelations = z.infer<typeof organizationMasterTableSchema> & organizationMasterTableRelations

export const organizationMasterTableWithRelationsSchema: z.ZodType<organizationMasterTableWithRelations> = organizationMasterTableSchema.merge(z.object({
  organizationLocalTable: z.lazy(() => organizationLocalTableWithRelationsSchema).array(),
}))

// ORGANIZATION MASTER TABLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type organizationMasterTableOptionalDefaultsRelations = {
  organizationLocalTable: organizationLocalTableOptionalDefaultsWithRelations[];
};

export type organizationMasterTableOptionalDefaultsWithRelations = z.infer<typeof organizationMasterTableOptionalDefaultsSchema> & organizationMasterTableOptionalDefaultsRelations

export const organizationMasterTableOptionalDefaultsWithRelationsSchema: z.ZodType<organizationMasterTableOptionalDefaultsWithRelations> = organizationMasterTableOptionalDefaultsSchema.merge(z.object({
  organizationLocalTable: z.lazy(() => organizationLocalTableOptionalDefaultsWithRelationsSchema).array(),
}))

// ORGANIZATION MASTER TABLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type organizationMasterTablePartialRelations = {
  organizationLocalTable?: organizationLocalTablePartialWithRelations[];
};

export type organizationMasterTablePartialWithRelations = z.infer<typeof organizationMasterTablePartialSchema> & organizationMasterTablePartialRelations

export const organizationMasterTablePartialWithRelationsSchema: z.ZodType<organizationMasterTablePartialWithRelations> = organizationMasterTablePartialSchema.merge(z.object({
  organizationLocalTable: z.lazy(() => organizationLocalTablePartialWithRelationsSchema).array(),
})).partial()

export type organizationMasterTableOptionalDefaultsWithPartialRelations = z.infer<typeof organizationMasterTableOptionalDefaultsSchema> & organizationMasterTablePartialRelations

export const organizationMasterTableOptionalDefaultsWithPartialRelationsSchema: z.ZodType<organizationMasterTableOptionalDefaultsWithPartialRelations> = organizationMasterTableOptionalDefaultsSchema.merge(z.object({
  organizationLocalTable: z.lazy(() => organizationLocalTablePartialWithRelationsSchema).array(),
}).partial())

export type organizationMasterTableWithPartialRelations = z.infer<typeof organizationMasterTableSchema> & organizationMasterTablePartialRelations

export const organizationMasterTableWithPartialRelationsSchema: z.ZodType<organizationMasterTableWithPartialRelations> = organizationMasterTableSchema.merge(z.object({
  organizationLocalTable: z.lazy(() => organizationLocalTablePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// PROJECT TABLE
//------------------------------------------------------

export const projectTableIncludeSchema: z.ZodType<Prisma.projectTableInclude> = z.object({
  cropTable: z.union([z.boolean(),z.lazy(() => cropTableFindManyArgsSchema)]).optional(),
  landTable: z.union([z.boolean(),z.lazy(() => landTableFindManyArgsSchema)]).optional(),
  plantingTable: z.union([z.boolean(),z.lazy(() => plantingTableFindManyArgsSchema)]).optional(),
  polyTable: z.union([z.boolean(),z.lazy(() => polyTableFindManyArgsSchema)]).optional(),
  organizationLocalTable: z.union([z.boolean(),z.lazy(() => organizationLocalTableArgsSchema)]).optional(),
  stakeholderTable: z.union([z.boolean(),z.lazy(() => stakeholderTableFindManyArgsSchema)]).optional(),
  sourceTable: z.union([z.boolean(),z.lazy(() => sourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProjectTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const projectTableArgsSchema: z.ZodType<Prisma.projectTableDefaultArgs> = z.object({
  select: z.lazy(() => projectTableSelectSchema).optional(),
  include: z.lazy(() => projectTableIncludeSchema).optional(),
}).strict();

export const projectTableCountOutputTypeArgsSchema: z.ZodType<Prisma.projectTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => projectTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const projectTableCountOutputTypeSelectSchema: z.ZodType<Prisma.projectTableCountOutputTypeSelect> = z.object({
  cropTable: z.boolean().optional(),
  landTable: z.boolean().optional(),
  plantingTable: z.boolean().optional(),
  polyTable: z.boolean().optional(),
  stakeholderTable: z.boolean().optional(),
  sourceTable: z.boolean().optional(),
}).strict();

export const projectTableSelectSchema: z.ZodType<Prisma.projectTableSelect> = z.object({
  projectId: z.boolean().optional(),
  projectName: z.boolean().optional(),
  url: z.boolean().optional(),
  platformId: z.boolean().optional(),
  platform: z.boolean().optional(),
  projectNotes: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  deleted: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.boolean().optional(),
  carbonRegistry: z.boolean().optional(),
  employmentClaim: z.boolean().optional(),
  employmentClaimDescription: z.boolean().optional(),
  projectDateEnd: z.boolean().optional(),
  projectDateStart: z.boolean().optional(),
  registryId: z.boolean().optional(),
  cropTable: z.union([z.boolean(),z.lazy(() => cropTableFindManyArgsSchema)]).optional(),
  landTable: z.union([z.boolean(),z.lazy(() => landTableFindManyArgsSchema)]).optional(),
  plantingTable: z.union([z.boolean(),z.lazy(() => plantingTableFindManyArgsSchema)]).optional(),
  polyTable: z.union([z.boolean(),z.lazy(() => polyTableFindManyArgsSchema)]).optional(),
  organizationLocalTable: z.union([z.boolean(),z.lazy(() => organizationLocalTableArgsSchema)]).optional(),
  stakeholderTable: z.union([z.boolean(),z.lazy(() => stakeholderTableFindManyArgsSchema)]).optional(),
  sourceTable: z.union([z.boolean(),z.lazy(() => sourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProjectTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// LAND TABLE
//------------------------------------------------------

export const landTableIncludeSchema: z.ZodType<Prisma.landTableInclude> = z.object({
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableArgsSchema)]).optional(),
  polygonTable: z.union([z.boolean(),z.lazy(() => polygonTableFindManyArgsSchema)]).optional(),
  sourceTable: z.union([z.boolean(),z.lazy(() => sourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => LandTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const landTableArgsSchema: z.ZodType<Prisma.landTableDefaultArgs> = z.object({
  select: z.lazy(() => landTableSelectSchema).optional(),
  include: z.lazy(() => landTableIncludeSchema).optional(),
}).strict();

export const landTableCountOutputTypeArgsSchema: z.ZodType<Prisma.landTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => landTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const landTableCountOutputTypeSelectSchema: z.ZodType<Prisma.landTableCountOutputTypeSelect> = z.object({
  polygonTable: z.boolean().optional(),
  sourceTable: z.boolean().optional(),
}).strict();

export const landTableSelectSchema: z.ZodType<Prisma.landTableSelect> = z.object({
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
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableArgsSchema)]).optional(),
  polygonTable: z.union([z.boolean(),z.lazy(() => polygonTableFindManyArgsSchema)]).optional(),
  sourceTable: z.union([z.boolean(),z.lazy(() => sourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => LandTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// CROP TABLE
//------------------------------------------------------

export const cropTableIncludeSchema: z.ZodType<Prisma.cropTableInclude> = z.object({
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableArgsSchema)]).optional(),
  sourceTable: z.union([z.boolean(),z.lazy(() => sourceTableFindManyArgsSchema)]).optional(),
  speciesTable: z.union([z.boolean(),z.lazy(() => speciesTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CropTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const cropTableArgsSchema: z.ZodType<Prisma.cropTableDefaultArgs> = z.object({
  select: z.lazy(() => cropTableSelectSchema).optional(),
  include: z.lazy(() => cropTableIncludeSchema).optional(),
}).strict();

export const cropTableCountOutputTypeArgsSchema: z.ZodType<Prisma.cropTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => cropTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const cropTableCountOutputTypeSelectSchema: z.ZodType<Prisma.cropTableCountOutputTypeSelect> = z.object({
  sourceTable: z.boolean().optional(),
  speciesTable: z.boolean().optional(),
}).strict();

export const cropTableSelectSchema: z.ZodType<Prisma.cropTableSelect> = z.object({
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
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableArgsSchema)]).optional(),
  sourceTable: z.union([z.boolean(),z.lazy(() => sourceTableFindManyArgsSchema)]).optional(),
  speciesTable: z.union([z.boolean(),z.lazy(() => speciesTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CropTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// PLANTING TABLE
//------------------------------------------------------

export const plantingTableIncludeSchema: z.ZodType<Prisma.plantingTableInclude> = z.object({
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableArgsSchema)]).optional(),
  sourceTable: z.union([z.boolean(),z.lazy(() => sourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PlantingTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const plantingTableArgsSchema: z.ZodType<Prisma.plantingTableDefaultArgs> = z.object({
  select: z.lazy(() => plantingTableSelectSchema).optional(),
  include: z.lazy(() => plantingTableIncludeSchema).optional(),
}).strict();

export const plantingTableCountOutputTypeArgsSchema: z.ZodType<Prisma.plantingTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => plantingTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const plantingTableCountOutputTypeSelectSchema: z.ZodType<Prisma.plantingTableCountOutputTypeSelect> = z.object({
  sourceTable: z.boolean().optional(),
}).strict();

export const plantingTableSelectSchema: z.ZodType<Prisma.plantingTableSelect> = z.object({
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
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableArgsSchema)]).optional(),
  sourceTable: z.union([z.boolean(),z.lazy(() => sourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PlantingTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// SPECIES TABLE
//------------------------------------------------------

export const speciesTableIncludeSchema: z.ZodType<Prisma.speciesTableInclude> = z.object({
  cropTable: z.union([z.boolean(),z.lazy(() => cropTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SpeciesTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const speciesTableArgsSchema: z.ZodType<Prisma.speciesTableDefaultArgs> = z.object({
  select: z.lazy(() => speciesTableSelectSchema).optional(),
  include: z.lazy(() => speciesTableIncludeSchema).optional(),
}).strict();

export const speciesTableCountOutputTypeArgsSchema: z.ZodType<Prisma.speciesTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => speciesTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const speciesTableCountOutputTypeSelectSchema: z.ZodType<Prisma.speciesTableCountOutputTypeSelect> = z.object({
  cropTable: z.boolean().optional(),
}).strict();

export const speciesTableSelectSchema: z.ZodType<Prisma.speciesTableSelect> = z.object({
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
  cropTable: z.union([z.boolean(),z.lazy(() => cropTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SpeciesTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// POLYGON TABLE
//------------------------------------------------------

export const polygonTableIncludeSchema: z.ZodType<Prisma.polygonTableInclude> = z.object({
  landTable: z.union([z.boolean(),z.lazy(() => landTableArgsSchema)]).optional(),
}).strict();

export const polygonTableArgsSchema: z.ZodType<Prisma.polygonTableDefaultArgs> = z.object({
  select: z.lazy(() => polygonTableSelectSchema).optional(),
  include: z.lazy(() => polygonTableIncludeSchema).optional(),
}).strict();

export const polygonTableSelectSchema: z.ZodType<Prisma.polygonTableSelect> = z.object({
  polygonId: z.boolean().optional(),
  landId: z.boolean().optional(),
  landName: z.boolean().optional(),
  geometry: z.boolean().optional(),
  coordinates: z.boolean().optional(),
  type: z.boolean().optional(),
  polygonNotes: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  landTable: z.union([z.boolean(),z.lazy(() => landTableArgsSchema)]).optional(),
}).strict()

// POLY TABLE
//------------------------------------------------------

export const polyTableIncludeSchema: z.ZodType<Prisma.polyTableInclude> = z.object({
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableArgsSchema)]).optional(),
}).strict();

export const polyTableArgsSchema: z.ZodType<Prisma.polyTableDefaultArgs> = z.object({
  select: z.lazy(() => polyTableSelectSchema).optional(),
  include: z.lazy(() => polyTableIncludeSchema).optional(),
}).strict();

export const polyTableSelectSchema: z.ZodType<Prisma.polyTableSelect> = z.object({
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
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableArgsSchema)]).optional(),
}).strict()

// STAKEHOLDER TABLE
//------------------------------------------------------

export const stakeholderTableIncludeSchema: z.ZodType<Prisma.stakeholderTableInclude> = z.object({
  organizationLocalTable: z.union([z.boolean(),z.lazy(() => organizationLocalTableArgsSchema)]).optional(),
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableArgsSchema)]).optional(),
}).strict();

export const stakeholderTableArgsSchema: z.ZodType<Prisma.stakeholderTableDefaultArgs> = z.object({
  select: z.lazy(() => stakeholderTableSelectSchema).optional(),
  include: z.lazy(() => stakeholderTableIncludeSchema).optional(),
}).strict();

export const stakeholderTableSelectSchema: z.ZodType<Prisma.stakeholderTableSelect> = z.object({
  stakeholderId: z.boolean().optional(),
  organizationLocalId: z.boolean().optional(),
  parentId: z.boolean().optional(),
  parentTable: z.boolean().optional(),
  projectId: z.boolean().optional(),
  stakeholderType: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  organizationLocalTable: z.union([z.boolean(),z.lazy(() => organizationLocalTableArgsSchema)]).optional(),
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableArgsSchema)]).optional(),
}).strict()

// SOURCE TABLE
//------------------------------------------------------

export const sourceTableIncludeSchema: z.ZodType<Prisma.sourceTableInclude> = z.object({
  cropTable: z.union([z.boolean(),z.lazy(() => cropTableFindManyArgsSchema)]).optional(),
  landTable: z.union([z.boolean(),z.lazy(() => landTableFindManyArgsSchema)]).optional(),
  organizationLocalTable: z.union([z.boolean(),z.lazy(() => organizationLocalTableFindManyArgsSchema)]).optional(),
  plantingTable: z.union([z.boolean(),z.lazy(() => plantingTableFindManyArgsSchema)]).optional(),
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SourceTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const sourceTableArgsSchema: z.ZodType<Prisma.sourceTableDefaultArgs> = z.object({
  select: z.lazy(() => sourceTableSelectSchema).optional(),
  include: z.lazy(() => sourceTableIncludeSchema).optional(),
}).strict();

export const sourceTableCountOutputTypeArgsSchema: z.ZodType<Prisma.sourceTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => sourceTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const sourceTableCountOutputTypeSelectSchema: z.ZodType<Prisma.sourceTableCountOutputTypeSelect> = z.object({
  cropTable: z.boolean().optional(),
  landTable: z.boolean().optional(),
  organizationLocalTable: z.boolean().optional(),
  plantingTable: z.boolean().optional(),
  projectTable: z.boolean().optional(),
}).strict();

export const sourceTableSelectSchema: z.ZodType<Prisma.sourceTableSelect> = z.object({
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
  cropTable: z.union([z.boolean(),z.lazy(() => cropTableFindManyArgsSchema)]).optional(),
  landTable: z.union([z.boolean(),z.lazy(() => landTableFindManyArgsSchema)]).optional(),
  organizationLocalTable: z.union([z.boolean(),z.lazy(() => organizationLocalTableFindManyArgsSchema)]).optional(),
  plantingTable: z.union([z.boolean(),z.lazy(() => plantingTableFindManyArgsSchema)]).optional(),
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SourceTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// ORGANIZATION LOCAL TABLE
//------------------------------------------------------

export const organizationLocalTableIncludeSchema: z.ZodType<Prisma.organizationLocalTableInclude> = z.object({
  organizationMasterTable: z.union([z.boolean(),z.lazy(() => organizationMasterTableArgsSchema)]).optional(),
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableFindManyArgsSchema)]).optional(),
  stakeholderTable: z.union([z.boolean(),z.lazy(() => stakeholderTableFindManyArgsSchema)]).optional(),
  sourceTable: z.union([z.boolean(),z.lazy(() => sourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const organizationLocalTableArgsSchema: z.ZodType<Prisma.organizationLocalTableDefaultArgs> = z.object({
  select: z.lazy(() => organizationLocalTableSelectSchema).optional(),
  include: z.lazy(() => organizationLocalTableIncludeSchema).optional(),
}).strict();

export const organizationLocalTableCountOutputTypeArgsSchema: z.ZodType<Prisma.organizationLocalTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => organizationLocalTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const organizationLocalTableCountOutputTypeSelectSchema: z.ZodType<Prisma.organizationLocalTableCountOutputTypeSelect> = z.object({
  projectTable: z.boolean().optional(),
  stakeholderTable: z.boolean().optional(),
  sourceTable: z.boolean().optional(),
}).strict();

export const organizationLocalTableSelectSchema: z.ZodType<Prisma.organizationLocalTableSelect> = z.object({
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
  organizationMasterTable: z.union([z.boolean(),z.lazy(() => organizationMasterTableArgsSchema)]).optional(),
  projectTable: z.union([z.boolean(),z.lazy(() => projectTableFindManyArgsSchema)]).optional(),
  stakeholderTable: z.union([z.boolean(),z.lazy(() => stakeholderTableFindManyArgsSchema)]).optional(),
  sourceTable: z.union([z.boolean(),z.lazy(() => sourceTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrganizationLocalTableCountOutputTypeArgsSchema)]).optional(),
}).strict()

// ORGANIZATION MASTER TABLE
//------------------------------------------------------

export const organizationMasterTableIncludeSchema: z.ZodType<Prisma.organizationMasterTableInclude> = z.object({
  organizationLocalTable: z.union([z.boolean(),z.lazy(() => organizationLocalTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrganizationMasterTableCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const organizationMasterTableArgsSchema: z.ZodType<Prisma.organizationMasterTableDefaultArgs> = z.object({
  select: z.lazy(() => organizationMasterTableSelectSchema).optional(),
  include: z.lazy(() => organizationMasterTableIncludeSchema).optional(),
}).strict();

export const organizationMasterTableCountOutputTypeArgsSchema: z.ZodType<Prisma.organizationMasterTableCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => organizationMasterTableCountOutputTypeSelectSchema).nullish(),
}).strict();

export const organizationMasterTableCountOutputTypeSelectSchema: z.ZodType<Prisma.organizationMasterTableCountOutputTypeSelect> = z.object({
  organizationLocalTable: z.boolean().optional(),
}).strict();

export const organizationMasterTableSelectSchema: z.ZodType<Prisma.organizationMasterTableSelect> = z.object({
  organizationMasterId: z.boolean().optional(),
  organizationMasterName: z.boolean().optional(),
  officialWebsite: z.boolean().optional(),
  officialAddress: z.boolean().optional(),
  officialEmail: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  lastEditedAt: z.boolean().optional(),
  editedBy: z.boolean().optional(),
  organizationLocalTable: z.union([z.boolean(),z.lazy(() => organizationLocalTableFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrganizationMasterTableCountOutputTypeArgsSchema)]).optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const projectTableWhereInputSchema: z.ZodType<Prisma.projectTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => projectTableWhereInputSchema), z.lazy(() => projectTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => projectTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => projectTableWhereInputSchema), z.lazy(() => projectTableWhereInputSchema).array() ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  platformId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  platform: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  isPublic: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => EnumCarbonRegistryTypeNullableFilterSchema), z.lazy(() => CarbonRegistryTypeSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => EnumCarbonRegistryNullableFilterSchema), z.lazy(() => CarbonRegistrySchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectDateEnd: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  projectDateStart: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  registryId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  cropTable: z.lazy(() => CropTableListRelationFilterSchema).optional(),
  landTable: z.lazy(() => LandTableListRelationFilterSchema).optional(),
  plantingTable: z.lazy(() => PlantingTableListRelationFilterSchema).optional(),
  polyTable: z.lazy(() => PolyTableListRelationFilterSchema).optional(),
  organizationLocalTable: z.union([ z.lazy(() => OrganizationLocalTableNullableScalarRelationFilterSchema), z.lazy(() => organizationLocalTableWhereInputSchema) ]).optional().nullable(),
  stakeholderTable: z.lazy(() => StakeholderTableListRelationFilterSchema).optional(),
  sourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
});

export const projectTableOrderByWithRelationInputSchema: z.ZodType<Prisma.projectTableOrderByWithRelationInput> = z.strictObject({
  projectId: z.lazy(() => SortOrderSchema).optional(),
  projectName: z.lazy(() => SortOrderSchema).optional(),
  url: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  platformId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  platform: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  isPublic: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistryType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  carbonRegistry: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  employmentClaim: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  employmentClaimDescription: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectDateEnd: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectDateStart: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  registryId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  cropTable: z.lazy(() => cropTableOrderByRelationAggregateInputSchema).optional(),
  landTable: z.lazy(() => landTableOrderByRelationAggregateInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableOrderByRelationAggregateInputSchema).optional(),
  polyTable: z.lazy(() => polyTableOrderByRelationAggregateInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableOrderByWithRelationInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableOrderByRelationAggregateInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableOrderByRelationAggregateInputSchema).optional(),
});

export const projectTableWhereUniqueInputSchema: z.ZodType<Prisma.projectTableWhereUniqueInput> = z.object({
  projectId: z.string(),
})
.and(z.strictObject({
  projectId: z.string().optional(),
  AND: z.union([ z.lazy(() => projectTableWhereInputSchema), z.lazy(() => projectTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => projectTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => projectTableWhereInputSchema), z.lazy(() => projectTableWhereInputSchema).array() ]).optional(),
  projectName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  platformId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  platform: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  isPublic: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => EnumCarbonRegistryTypeNullableFilterSchema), z.lazy(() => CarbonRegistryTypeSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => EnumCarbonRegistryNullableFilterSchema), z.lazy(() => CarbonRegistrySchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectDateEnd: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  projectDateStart: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  registryId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  cropTable: z.lazy(() => CropTableListRelationFilterSchema).optional(),
  landTable: z.lazy(() => LandTableListRelationFilterSchema).optional(),
  plantingTable: z.lazy(() => PlantingTableListRelationFilterSchema).optional(),
  polyTable: z.lazy(() => PolyTableListRelationFilterSchema).optional(),
  organizationLocalTable: z.union([ z.lazy(() => OrganizationLocalTableNullableScalarRelationFilterSchema), z.lazy(() => organizationLocalTableWhereInputSchema) ]).optional().nullable(),
  stakeholderTable: z.lazy(() => StakeholderTableListRelationFilterSchema).optional(),
  sourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
}));

export const projectTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.projectTableOrderByWithAggregationInput> = z.strictObject({
  projectId: z.lazy(() => SortOrderSchema).optional(),
  projectName: z.lazy(() => SortOrderSchema).optional(),
  url: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  platformId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  platform: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deleted: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  isPublic: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistryType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  carbonRegistry: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  employmentClaim: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  employmentClaimDescription: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectDateEnd: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  projectDateStart: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  registryId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => projectTableCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => projectTableAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => projectTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => projectTableMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => projectTableSumOrderByAggregateInputSchema).optional(),
});

export const projectTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.projectTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => projectTableScalarWhereWithAggregatesInputSchema), z.lazy(() => projectTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => projectTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => projectTableScalarWhereWithAggregatesInputSchema), z.lazy(() => projectTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  projectId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  projectName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  platformId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  platform: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  projectNotes: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableWithAggregatesFilterSchema), z.boolean() ]).optional().nullable(),
  isPublic: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => EnumCarbonRegistryTypeNullableWithAggregatesFilterSchema), z.lazy(() => CarbonRegistryTypeSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => EnumCarbonRegistryNullableWithAggregatesFilterSchema), z.lazy(() => CarbonRegistrySchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  projectDateEnd: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  projectDateStart: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  registryId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const landTableWhereInputSchema: z.ZodType<Prisma.landTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => landTableWhereInputSchema), z.lazy(() => landTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => landTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => landTableWhereInputSchema), z.lazy(() => landTableWhereInputSchema).array() ]).optional(),
  landId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  hectares: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  landNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => EnumTreatmentTypeNullableFilterSchema), z.lazy(() => TreatmentTypeSchema) ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  preparation: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectTable: z.union([ z.lazy(() => ProjectTableScalarRelationFilterSchema), z.lazy(() => projectTableWhereInputSchema) ]).optional(),
  polygonTable: z.lazy(() => PolygonTableListRelationFilterSchema).optional(),
  sourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
});

export const landTableOrderByWithRelationInputSchema: z.ZodType<Prisma.landTableOrderByWithRelationInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableOrderByWithRelationInputSchema).optional(),
  polygonTable: z.lazy(() => polygonTableOrderByRelationAggregateInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableOrderByRelationAggregateInputSchema).optional(),
});

export const landTableWhereUniqueInputSchema: z.ZodType<Prisma.landTableWhereUniqueInput> = z.object({
  landId: z.string(),
})
.and(z.strictObject({
  landId: z.string().optional(),
  AND: z.union([ z.lazy(() => landTableWhereInputSchema), z.lazy(() => landTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => landTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => landTableWhereInputSchema), z.lazy(() => landTableWhereInputSchema).array() ]).optional(),
  landName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  hectares: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  landNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => EnumTreatmentTypeNullableFilterSchema), z.lazy(() => TreatmentTypeSchema) ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  preparation: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectTable: z.union([ z.lazy(() => ProjectTableScalarRelationFilterSchema), z.lazy(() => projectTableWhereInputSchema) ]).optional(),
  polygonTable: z.lazy(() => PolygonTableListRelationFilterSchema).optional(),
  sourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
}));

export const landTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.landTableOrderByWithAggregationInput> = z.strictObject({
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
  _count: z.lazy(() => landTableCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => landTableAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => landTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => landTableMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => landTableSumOrderByAggregateInputSchema).optional(),
});

export const landTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.landTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => landTableScalarWhereWithAggregatesInputSchema), z.lazy(() => landTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => landTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => landTableScalarWhereWithAggregatesInputSchema), z.lazy(() => landTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  landId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  projectId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  hectares: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  landNotes: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => EnumTreatmentTypeNullableWithAggregatesFilterSchema), z.lazy(() => TreatmentTypeSchema) ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableWithAggregatesFilterSchema), z.boolean() ]).optional().nullable(),
  preparation: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const cropTableWhereInputSchema: z.ZodType<Prisma.cropTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => cropTableWhereInputSchema), z.lazy(() => cropTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => cropTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => cropTableWhereInputSchema), z.lazy(() => cropTableWhereInputSchema).array() ]).optional(),
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
  projectTable: z.union([ z.lazy(() => ProjectTableNullableScalarRelationFilterSchema), z.lazy(() => projectTableWhereInputSchema) ]).optional().nullable(),
  sourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
  speciesTable: z.lazy(() => SpeciesTableListRelationFilterSchema).optional(),
});

export const cropTableOrderByWithRelationInputSchema: z.ZodType<Prisma.cropTableOrderByWithRelationInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableOrderByWithRelationInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableOrderByRelationAggregateInputSchema).optional(),
  speciesTable: z.lazy(() => speciesTableOrderByRelationAggregateInputSchema).optional(),
});

export const cropTableWhereUniqueInputSchema: z.ZodType<Prisma.cropTableWhereUniqueInput> = z.union([
  z.object({
    cropId: z.string(),
    projectId_cropName: z.lazy(() => cropTableProjectIdCropNameCompoundUniqueInputSchema),
  }),
  z.object({
    cropId: z.string(),
  }),
  z.object({
    projectId_cropName: z.lazy(() => cropTableProjectIdCropNameCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  cropId: z.string().optional(),
  projectId_cropName: z.lazy(() => cropTableProjectIdCropNameCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => cropTableWhereInputSchema), z.lazy(() => cropTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => cropTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => cropTableWhereInputSchema), z.lazy(() => cropTableWhereInputSchema).array() ]).optional(),
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
  projectTable: z.union([ z.lazy(() => ProjectTableNullableScalarRelationFilterSchema), z.lazy(() => projectTableWhereInputSchema) ]).optional().nullable(),
  sourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
  speciesTable: z.lazy(() => SpeciesTableListRelationFilterSchema).optional(),
}));

export const cropTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.cropTableOrderByWithAggregationInput> = z.strictObject({
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
  _count: z.lazy(() => cropTableCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => cropTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => cropTableMinOrderByAggregateInputSchema).optional(),
});

export const cropTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.cropTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => cropTableScalarWhereWithAggregatesInputSchema), z.lazy(() => cropTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => cropTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => cropTableScalarWhereWithAggregatesInputSchema), z.lazy(() => cropTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
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

export const plantingTableWhereInputSchema: z.ZodType<Prisma.plantingTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => plantingTableWhereInputSchema), z.lazy(() => plantingTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => plantingTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => plantingTableWhereInputSchema), z.lazy(() => plantingTableWhereInputSchema).array() ]).optional(),
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
  units: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => EnumUnitTypeNullableFilterSchema), z.lazy(() => UnitTypeSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  currency: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectTable: z.union([ z.lazy(() => ProjectTableScalarRelationFilterSchema), z.lazy(() => projectTableWhereInputSchema) ]).optional(),
  sourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
});

export const plantingTableOrderByWithRelationInputSchema: z.ZodType<Prisma.plantingTableOrderByWithRelationInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableOrderByWithRelationInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableOrderByRelationAggregateInputSchema).optional(),
});

export const plantingTableWhereUniqueInputSchema: z.ZodType<Prisma.plantingTableWhereUniqueInput> = z.object({
  plantingId: z.string(),
})
.and(z.strictObject({
  plantingId: z.string().optional(),
  AND: z.union([ z.lazy(() => plantingTableWhereInputSchema), z.lazy(() => plantingTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => plantingTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => plantingTableWhereInputSchema), z.lazy(() => plantingTableWhereInputSchema).array() ]).optional(),
  planted: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  allocated: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  plantingDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  units: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => EnumUnitTypeNullableFilterSchema), z.lazy(() => UnitTypeSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  currency: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectTable: z.union([ z.lazy(() => ProjectTableScalarRelationFilterSchema), z.lazy(() => projectTableWhereInputSchema) ]).optional(),
  sourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
}));

export const plantingTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.plantingTableOrderByWithAggregationInput> = z.strictObject({
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
  _count: z.lazy(() => plantingTableCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => plantingTableAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => plantingTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => plantingTableMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => plantingTableSumOrderByAggregateInputSchema).optional(),
});

export const plantingTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.plantingTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => plantingTableScalarWhereWithAggregatesInputSchema), z.lazy(() => plantingTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => plantingTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => plantingTableScalarWhereWithAggregatesInputSchema), z.lazy(() => plantingTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
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
  units: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => EnumUnitTypeNullableWithAggregatesFilterSchema), z.lazy(() => UnitTypeSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  currency: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const speciesTableWhereInputSchema: z.ZodType<Prisma.speciesTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => speciesTableWhereInputSchema), z.lazy(() => speciesTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => speciesTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => speciesTableWhereInputSchema), z.lazy(() => speciesTableWhereInputSchema).array() ]).optional(),
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
  cropTable: z.lazy(() => CropTableListRelationFilterSchema).optional(),
});

export const speciesTableOrderByWithRelationInputSchema: z.ZodType<Prisma.speciesTableOrderByWithRelationInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableOrderByRelationAggregateInputSchema).optional(),
});

export const speciesTableWhereUniqueInputSchema: z.ZodType<Prisma.speciesTableWhereUniqueInput> = z.object({
  speciesName: z.string(),
})
.and(z.strictObject({
  speciesName: z.string().optional(),
  AND: z.union([ z.lazy(() => speciesTableWhereInputSchema), z.lazy(() => speciesTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => speciesTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => speciesTableWhereInputSchema), z.lazy(() => speciesTableWhereInputSchema).array() ]).optional(),
  commonName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  scientificName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  family: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  reference: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  cropTable: z.lazy(() => CropTableListRelationFilterSchema).optional(),
}));

export const speciesTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.speciesTableOrderByWithAggregationInput> = z.strictObject({
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
  _count: z.lazy(() => speciesTableCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => speciesTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => speciesTableMinOrderByAggregateInputSchema).optional(),
});

export const speciesTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.speciesTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => speciesTableScalarWhereWithAggregatesInputSchema), z.lazy(() => speciesTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => speciesTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => speciesTableScalarWhereWithAggregatesInputSchema), z.lazy(() => speciesTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
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

export const polygonTableWhereInputSchema: z.ZodType<Prisma.polygonTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => polygonTableWhereInputSchema), z.lazy(() => polygonTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => polygonTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => polygonTableWhereInputSchema), z.lazy(() => polygonTableWhereInputSchema).array() ]).optional(),
  polygonId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  geometry: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  coordinates: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  polygonNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  landTable: z.union([ z.lazy(() => LandTableScalarRelationFilterSchema), z.lazy(() => landTableWhereInputSchema) ]).optional(),
});

export const polygonTableOrderByWithRelationInputSchema: z.ZodType<Prisma.polygonTableOrderByWithRelationInput> = z.strictObject({
  polygonId: z.lazy(() => SortOrderSchema).optional(),
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  geometry: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  coordinates: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  polygonNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  landTable: z.lazy(() => landTableOrderByWithRelationInputSchema).optional(),
});

export const polygonTableWhereUniqueInputSchema: z.ZodType<Prisma.polygonTableWhereUniqueInput> = z.object({
  polygonId: z.string(),
})
.and(z.strictObject({
  polygonId: z.string().optional(),
  AND: z.union([ z.lazy(() => polygonTableWhereInputSchema), z.lazy(() => polygonTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => polygonTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => polygonTableWhereInputSchema), z.lazy(() => polygonTableWhereInputSchema).array() ]).optional(),
  landId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  geometry: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  coordinates: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  polygonNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  landTable: z.union([ z.lazy(() => LandTableScalarRelationFilterSchema), z.lazy(() => landTableWhereInputSchema) ]).optional(),
}));

export const polygonTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.polygonTableOrderByWithAggregationInput> = z.strictObject({
  polygonId: z.lazy(() => SortOrderSchema).optional(),
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  geometry: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  coordinates: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  polygonNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => polygonTableCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => polygonTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => polygonTableMinOrderByAggregateInputSchema).optional(),
});

export const polygonTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.polygonTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => polygonTableScalarWhereWithAggregatesInputSchema), z.lazy(() => polygonTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => polygonTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => polygonTableScalarWhereWithAggregatesInputSchema), z.lazy(() => polygonTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  polygonId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  landId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  geometry: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  coordinates: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  polygonNotes: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const polyTableWhereInputSchema: z.ZodType<Prisma.polyTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => polyTableWhereInputSchema), z.lazy(() => polyTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => polyTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => polyTableWhereInputSchema), z.lazy(() => polyTableWhereInputSchema).array() ]).optional(),
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
  projectTable: z.union([ z.lazy(() => ProjectTableScalarRelationFilterSchema), z.lazy(() => projectTableWhereInputSchema) ]).optional(),
});

export const polyTableOrderByWithRelationInputSchema: z.ZodType<Prisma.polyTableOrderByWithRelationInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableOrderByWithRelationInputSchema).optional(),
});

export const polyTableWhereUniqueInputSchema: z.ZodType<Prisma.polyTableWhereUniqueInput> = z.object({
  polyId: z.string(),
})
.and(z.strictObject({
  polyId: z.string().optional(),
  AND: z.union([ z.lazy(() => polyTableWhereInputSchema), z.lazy(() => polyTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => polyTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => polyTableWhereInputSchema), z.lazy(() => polyTableWhereInputSchema).array() ]).optional(),
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
  projectTable: z.union([ z.lazy(() => ProjectTableScalarRelationFilterSchema), z.lazy(() => projectTableWhereInputSchema) ]).optional(),
}));

export const polyTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.polyTableOrderByWithAggregationInput> = z.strictObject({
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
  _count: z.lazy(() => polyTableCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => polyTableAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => polyTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => polyTableMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => polyTableSumOrderByAggregateInputSchema).optional(),
});

export const polyTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.polyTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => polyTableScalarWhereWithAggregatesInputSchema), z.lazy(() => polyTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => polyTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => polyTableScalarWhereWithAggregatesInputSchema), z.lazy(() => polyTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
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

export const stakeholderTableWhereInputSchema: z.ZodType<Prisma.stakeholderTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => stakeholderTableWhereInputSchema), z.lazy(() => stakeholderTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => stakeholderTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => stakeholderTableWhereInputSchema), z.lazy(() => stakeholderTableWhereInputSchema).array() ]).optional(),
  stakeholderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => EnumStakeholderTypeNullableFilterSchema), z.lazy(() => StakeholderTypeSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  organizationLocalTable: z.union([ z.lazy(() => OrganizationLocalTableScalarRelationFilterSchema), z.lazy(() => organizationLocalTableWhereInputSchema) ]).optional(),
  projectTable: z.union([ z.lazy(() => ProjectTableNullableScalarRelationFilterSchema), z.lazy(() => projectTableWhereInputSchema) ]).optional().nullable(),
});

export const stakeholderTableOrderByWithRelationInputSchema: z.ZodType<Prisma.stakeholderTableOrderByWithRelationInput> = z.strictObject({
  stakeholderId: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableOrderByWithRelationInputSchema).optional(),
  projectTable: z.lazy(() => projectTableOrderByWithRelationInputSchema).optional(),
});

export const stakeholderTableWhereUniqueInputSchema: z.ZodType<Prisma.stakeholderTableWhereUniqueInput> = z.object({
  stakeholderId: z.string(),
})
.and(z.strictObject({
  stakeholderId: z.string().optional(),
  AND: z.union([ z.lazy(() => stakeholderTableWhereInputSchema), z.lazy(() => stakeholderTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => stakeholderTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => stakeholderTableWhereInputSchema), z.lazy(() => stakeholderTableWhereInputSchema).array() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => EnumStakeholderTypeNullableFilterSchema), z.lazy(() => StakeholderTypeSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  organizationLocalTable: z.union([ z.lazy(() => OrganizationLocalTableScalarRelationFilterSchema), z.lazy(() => organizationLocalTableWhereInputSchema) ]).optional(),
  projectTable: z.union([ z.lazy(() => ProjectTableNullableScalarRelationFilterSchema), z.lazy(() => projectTableWhereInputSchema) ]).optional().nullable(),
}));

export const stakeholderTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.stakeholderTableOrderByWithAggregationInput> = z.strictObject({
  stakeholderId: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => stakeholderTableCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => stakeholderTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => stakeholderTableMinOrderByAggregateInputSchema).optional(),
});

export const stakeholderTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.stakeholderTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => stakeholderTableScalarWhereWithAggregatesInputSchema), z.lazy(() => stakeholderTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => stakeholderTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => stakeholderTableScalarWhereWithAggregatesInputSchema), z.lazy(() => stakeholderTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  stakeholderId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableWithAggregatesFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => EnumStakeholderTypeNullableWithAggregatesFilterSchema), z.lazy(() => StakeholderTypeSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const sourceTableWhereInputSchema: z.ZodType<Prisma.sourceTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => sourceTableWhereInputSchema), z.lazy(() => sourceTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => sourceTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => sourceTableWhereInputSchema), z.lazy(() => sourceTableWhereInputSchema).array() ]).optional(),
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
  cropTable: z.lazy(() => CropTableListRelationFilterSchema).optional(),
  landTable: z.lazy(() => LandTableListRelationFilterSchema).optional(),
  organizationLocalTable: z.lazy(() => OrganizationLocalTableListRelationFilterSchema).optional(),
  plantingTable: z.lazy(() => PlantingTableListRelationFilterSchema).optional(),
  projectTable: z.lazy(() => ProjectTableListRelationFilterSchema).optional(),
});

export const sourceTableOrderByWithRelationInputSchema: z.ZodType<Prisma.sourceTableOrderByWithRelationInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableOrderByRelationAggregateInputSchema).optional(),
  landTable: z.lazy(() => landTableOrderByRelationAggregateInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableOrderByRelationAggregateInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableOrderByRelationAggregateInputSchema).optional(),
  projectTable: z.lazy(() => projectTableOrderByRelationAggregateInputSchema).optional(),
});

export const sourceTableWhereUniqueInputSchema: z.ZodType<Prisma.sourceTableWhereUniqueInput> = z.object({
  sourceId: z.string(),
})
.and(z.strictObject({
  sourceId: z.string().optional(),
  AND: z.union([ z.lazy(() => sourceTableWhereInputSchema), z.lazy(() => sourceTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => sourceTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => sourceTableWhereInputSchema), z.lazy(() => sourceTableWhereInputSchema).array() ]).optional(),
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
  cropTable: z.lazy(() => CropTableListRelationFilterSchema).optional(),
  landTable: z.lazy(() => LandTableListRelationFilterSchema).optional(),
  organizationLocalTable: z.lazy(() => OrganizationLocalTableListRelationFilterSchema).optional(),
  plantingTable: z.lazy(() => PlantingTableListRelationFilterSchema).optional(),
  projectTable: z.lazy(() => ProjectTableListRelationFilterSchema).optional(),
}));

export const sourceTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.sourceTableOrderByWithAggregationInput> = z.strictObject({
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
  _count: z.lazy(() => sourceTableCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => sourceTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => sourceTableMinOrderByAggregateInputSchema).optional(),
});

export const sourceTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.sourceTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => sourceTableScalarWhereWithAggregatesInputSchema), z.lazy(() => sourceTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => sourceTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => sourceTableScalarWhereWithAggregatesInputSchema), z.lazy(() => sourceTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
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

export const organizationLocalTableWhereInputSchema: z.ZodType<Prisma.organizationLocalTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => organizationLocalTableWhereInputSchema), z.lazy(() => organizationLocalTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => organizationLocalTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => organizationLocalTableWhereInputSchema), z.lazy(() => organizationLocalTableWhereInputSchema).array() ]).optional(),
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
  organizationMasterTable: z.union([ z.lazy(() => OrganizationMasterTableNullableScalarRelationFilterSchema), z.lazy(() => organizationMasterTableWhereInputSchema) ]).optional().nullable(),
  projectTable: z.lazy(() => ProjectTableListRelationFilterSchema).optional(),
  stakeholderTable: z.lazy(() => StakeholderTableListRelationFilterSchema).optional(),
  sourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
});

export const organizationLocalTableOrderByWithRelationInputSchema: z.ZodType<Prisma.organizationLocalTableOrderByWithRelationInput> = z.strictObject({
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
  organizationMasterTable: z.lazy(() => organizationMasterTableOrderByWithRelationInputSchema).optional(),
  projectTable: z.lazy(() => projectTableOrderByRelationAggregateInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableOrderByRelationAggregateInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableOrderByRelationAggregateInputSchema).optional(),
});

export const organizationLocalTableWhereUniqueInputSchema: z.ZodType<Prisma.organizationLocalTableWhereUniqueInput> = z.union([
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
  AND: z.union([ z.lazy(() => organizationLocalTableWhereInputSchema), z.lazy(() => organizationLocalTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => organizationLocalTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => organizationLocalTableWhereInputSchema), z.lazy(() => organizationLocalTableWhereInputSchema).array() ]).optional(),
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
  organizationMasterTable: z.union([ z.lazy(() => OrganizationMasterTableNullableScalarRelationFilterSchema), z.lazy(() => organizationMasterTableWhereInputSchema) ]).optional().nullable(),
  projectTable: z.lazy(() => ProjectTableListRelationFilterSchema).optional(),
  stakeholderTable: z.lazy(() => StakeholderTableListRelationFilterSchema).optional(),
  sourceTable: z.lazy(() => SourceTableListRelationFilterSchema).optional(),
}));

export const organizationLocalTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.organizationLocalTableOrderByWithAggregationInput> = z.strictObject({
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
  _count: z.lazy(() => organizationLocalTableCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => organizationLocalTableAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => organizationLocalTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => organizationLocalTableMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => organizationLocalTableSumOrderByAggregateInputSchema).optional(),
});

export const organizationLocalTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.organizationLocalTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => organizationLocalTableScalarWhereWithAggregatesInputSchema), z.lazy(() => organizationLocalTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => organizationLocalTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => organizationLocalTableScalarWhereWithAggregatesInputSchema), z.lazy(() => organizationLocalTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
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

export const organizationMasterTableWhereInputSchema: z.ZodType<Prisma.organizationMasterTableWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => organizationMasterTableWhereInputSchema), z.lazy(() => organizationMasterTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => organizationMasterTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => organizationMasterTableWhereInputSchema), z.lazy(() => organizationMasterTableWhereInputSchema).array() ]).optional(),
  organizationMasterId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  organizationMasterName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  officialWebsite: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  officialAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  officialEmail: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  organizationLocalTable: z.lazy(() => OrganizationLocalTableListRelationFilterSchema).optional(),
});

export const organizationMasterTableOrderByWithRelationInputSchema: z.ZodType<Prisma.organizationMasterTableOrderByWithRelationInput> = z.strictObject({
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterName: z.lazy(() => SortOrderSchema).optional(),
  officialWebsite: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  officialAddress: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  officialEmail: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableOrderByRelationAggregateInputSchema).optional(),
});

export const organizationMasterTableWhereUniqueInputSchema: z.ZodType<Prisma.organizationMasterTableWhereUniqueInput> = z.union([
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
  AND: z.union([ z.lazy(() => organizationMasterTableWhereInputSchema), z.lazy(() => organizationMasterTableWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => organizationMasterTableWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => organizationMasterTableWhereInputSchema), z.lazy(() => organizationMasterTableWhereInputSchema).array() ]).optional(),
  officialWebsite: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  officialAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  officialEmail: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  organizationLocalTable: z.lazy(() => OrganizationLocalTableListRelationFilterSchema).optional(),
}));

export const organizationMasterTableOrderByWithAggregationInputSchema: z.ZodType<Prisma.organizationMasterTableOrderByWithAggregationInput> = z.strictObject({
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterName: z.lazy(() => SortOrderSchema).optional(),
  officialWebsite: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  officialAddress: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  officialEmail: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastEditedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  editedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => organizationMasterTableCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => organizationMasterTableMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => organizationMasterTableMinOrderByAggregateInputSchema).optional(),
});

export const organizationMasterTableScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.organizationMasterTableScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => organizationMasterTableScalarWhereWithAggregatesInputSchema), z.lazy(() => organizationMasterTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => organizationMasterTableScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => organizationMasterTableScalarWhereWithAggregatesInputSchema), z.lazy(() => organizationMasterTableScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  organizationMasterId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  organizationMasterName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  officialWebsite: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  officialAddress: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  officialEmail: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const projectTableCreateInputSchema: z.ZodType<Prisma.projectTableCreateInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  landTable: z.lazy(() => landTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableUncheckedCreateInputSchema: z.ZodType<Prisma.projectTableUncheckedCreateInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableUpdateInputSchema: z.ZodType<Prisma.projectTableUpdateInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const projectTableUncheckedUpdateInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const projectTableCreateManyInputSchema: z.ZodType<Prisma.projectTableCreateManyInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
});

export const projectTableUpdateManyMutationInputSchema: z.ZodType<Prisma.projectTableUpdateManyMutationInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const projectTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateManyInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const landTableCreateInputSchema: z.ZodType<Prisma.landTableCreateInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  projectTable: z.lazy(() => projectTableCreateNestedOneWithoutLandTableInputSchema),
  polygonTable: z.lazy(() => polygonTableCreateNestedManyWithoutLandTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const landTableUncheckedCreateInputSchema: z.ZodType<Prisma.landTableUncheckedCreateInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  projectId: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  polygonTable: z.lazy(() => polygonTableUncheckedCreateNestedManyWithoutLandTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const landTableUpdateInputSchema: z.ZodType<Prisma.landTableUpdateInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectTable: z.lazy(() => projectTableUpdateOneRequiredWithoutLandTableNestedInputSchema).optional(),
  polygonTable: z.lazy(() => polygonTableUpdateManyWithoutLandTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const landTableUncheckedUpdateInputSchema: z.ZodType<Prisma.landTableUncheckedUpdateInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polygonTable: z.lazy(() => polygonTableUncheckedUpdateManyWithoutLandTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const landTableCreateManyInputSchema: z.ZodType<Prisma.landTableCreateManyInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  projectId: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
});

export const landTableUpdateManyMutationInputSchema: z.ZodType<Prisma.landTableUpdateManyMutationInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const landTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.landTableUncheckedUpdateManyInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const cropTableCreateInputSchema: z.ZodType<Prisma.cropTableCreateInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableCreateNestedOneWithoutCropTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutCropTableInputSchema).optional(),
  speciesTable: z.lazy(() => speciesTableCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const cropTableUncheckedCreateInputSchema: z.ZodType<Prisma.cropTableUncheckedCreateInput> = z.strictObject({
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
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutCropTableInputSchema).optional(),
  speciesTable: z.lazy(() => speciesTableUncheckedCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const cropTableUpdateInputSchema: z.ZodType<Prisma.cropTableUpdateInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUpdateOneWithoutCropTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutCropTableNestedInputSchema).optional(),
  speciesTable: z.lazy(() => speciesTableUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const cropTableUncheckedUpdateInputSchema: z.ZodType<Prisma.cropTableUncheckedUpdateInput> = z.strictObject({
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
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutCropTableNestedInputSchema).optional(),
  speciesTable: z.lazy(() => speciesTableUncheckedUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const cropTableCreateManyInputSchema: z.ZodType<Prisma.cropTableCreateManyInput> = z.strictObject({
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

export const cropTableUpdateManyMutationInputSchema: z.ZodType<Prisma.cropTableUpdateManyMutationInput> = z.strictObject({
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

export const cropTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.cropTableUncheckedUpdateManyInput> = z.strictObject({
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

export const plantingTableCreateInputSchema: z.ZodType<Prisma.plantingTableCreateInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
  projectTable: z.lazy(() => projectTableCreateNestedOneWithoutPlantingTableInputSchema),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutPlantingTableInputSchema).optional(),
});

export const plantingTableUncheckedCreateInputSchema: z.ZodType<Prisma.plantingTableUncheckedCreateInput> = z.strictObject({
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
  units: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutPlantingTableInputSchema).optional(),
});

export const plantingTableUpdateInputSchema: z.ZodType<Prisma.plantingTableUpdateInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectTable: z.lazy(() => projectTableUpdateOneRequiredWithoutPlantingTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutPlantingTableNestedInputSchema).optional(),
});

export const plantingTableUncheckedUpdateInputSchema: z.ZodType<Prisma.plantingTableUncheckedUpdateInput> = z.strictObject({
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
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutPlantingTableNestedInputSchema).optional(),
});

export const plantingTableCreateManyInputSchema: z.ZodType<Prisma.plantingTableCreateManyInput> = z.strictObject({
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
  units: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
});

export const plantingTableUpdateManyMutationInputSchema: z.ZodType<Prisma.plantingTableUpdateManyMutationInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const plantingTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.plantingTableUncheckedUpdateManyInput> = z.strictObject({
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
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const speciesTableCreateInputSchema: z.ZodType<Prisma.speciesTableCreateInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutSpeciesTableInputSchema).optional(),
});

export const speciesTableUncheckedCreateInputSchema: z.ZodType<Prisma.speciesTableUncheckedCreateInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutSpeciesTableInputSchema).optional(),
});

export const speciesTableUpdateInputSchema: z.ZodType<Prisma.speciesTableUpdateInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUpdateManyWithoutSpeciesTableNestedInputSchema).optional(),
});

export const speciesTableUncheckedUpdateInputSchema: z.ZodType<Prisma.speciesTableUncheckedUpdateInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutSpeciesTableNestedInputSchema).optional(),
});

export const speciesTableCreateManyInputSchema: z.ZodType<Prisma.speciesTableCreateManyInput> = z.strictObject({
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

export const speciesTableUpdateManyMutationInputSchema: z.ZodType<Prisma.speciesTableUpdateManyMutationInput> = z.strictObject({
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

export const speciesTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.speciesTableUncheckedUpdateManyInput> = z.strictObject({
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

export const polygonTableCreateInputSchema: z.ZodType<Prisma.polygonTableCreateInput> = z.strictObject({
  polygonId: z.string(),
  landName: z.string().optional().nullable(),
  geometry: z.string().optional().nullable(),
  coordinates: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  polygonNotes: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  landTable: z.lazy(() => landTableCreateNestedOneWithoutPolygonTableInputSchema),
});

export const polygonTableUncheckedCreateInputSchema: z.ZodType<Prisma.polygonTableUncheckedCreateInput> = z.strictObject({
  polygonId: z.string(),
  landId: z.string(),
  landName: z.string().optional().nullable(),
  geometry: z.string().optional().nullable(),
  coordinates: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  polygonNotes: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
});

export const polygonTableUpdateInputSchema: z.ZodType<Prisma.polygonTableUpdateInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  coordinates: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landTable: z.lazy(() => landTableUpdateOneRequiredWithoutPolygonTableNestedInputSchema).optional(),
});

export const polygonTableUncheckedUpdateInputSchema: z.ZodType<Prisma.polygonTableUncheckedUpdateInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  coordinates: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const polygonTableCreateManyInputSchema: z.ZodType<Prisma.polygonTableCreateManyInput> = z.strictObject({
  polygonId: z.string(),
  landId: z.string(),
  landName: z.string().optional().nullable(),
  geometry: z.string().optional().nullable(),
  coordinates: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  polygonNotes: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
});

export const polygonTableUpdateManyMutationInputSchema: z.ZodType<Prisma.polygonTableUpdateManyMutationInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  coordinates: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const polygonTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.polygonTableUncheckedUpdateManyInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  coordinates: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const polyTableCreateInputSchema: z.ZodType<Prisma.polyTableCreateInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableCreateNestedOneWithoutPolyTableInputSchema),
});

export const polyTableUncheckedCreateInputSchema: z.ZodType<Prisma.polyTableUncheckedCreateInput> = z.strictObject({
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

export const polyTableUpdateInputSchema: z.ZodType<Prisma.polyTableUpdateInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUpdateOneRequiredWithoutPolyTableNestedInputSchema).optional(),
});

export const polyTableUncheckedUpdateInputSchema: z.ZodType<Prisma.polyTableUncheckedUpdateInput> = z.strictObject({
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

export const polyTableCreateManyInputSchema: z.ZodType<Prisma.polyTableCreateManyInput> = z.strictObject({
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

export const polyTableUpdateManyMutationInputSchema: z.ZodType<Prisma.polyTableUpdateManyMutationInput> = z.strictObject({
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

export const polyTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.polyTableUncheckedUpdateManyInput> = z.strictObject({
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

export const stakeholderTableCreateInputSchema: z.ZodType<Prisma.stakeholderTableCreateInput> = z.strictObject({
  stakeholderId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedOneWithoutStakeholderTableInputSchema),
  projectTable: z.lazy(() => projectTableCreateNestedOneWithoutStakeholderTableInputSchema).optional(),
});

export const stakeholderTableUncheckedCreateInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedCreateInput> = z.strictObject({
  stakeholderId: z.string(),
  organizationLocalId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  projectId: z.string().optional().nullable(),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const stakeholderTableUpdateInputSchema: z.ZodType<Prisma.stakeholderTableUpdateInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateOneRequiredWithoutStakeholderTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUpdateOneWithoutStakeholderTableNestedInputSchema).optional(),
});

export const stakeholderTableUncheckedUpdateInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedUpdateInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const stakeholderTableCreateManyInputSchema: z.ZodType<Prisma.stakeholderTableCreateManyInput> = z.strictObject({
  stakeholderId: z.string(),
  organizationLocalId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  projectId: z.string().optional().nullable(),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const stakeholderTableUpdateManyMutationInputSchema: z.ZodType<Prisma.stakeholderTableUpdateManyMutationInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const stakeholderTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedUpdateManyInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const sourceTableCreateInputSchema: z.ZodType<Prisma.sourceTableCreateInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  landTable: z.lazy(() => landTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const sourceTableUncheckedCreateInputSchema: z.ZodType<Prisma.sourceTableUncheckedCreateInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const sourceTableUpdateInputSchema: z.ZodType<Prisma.sourceTableUpdateInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const sourceTableUncheckedUpdateInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const sourceTableCreateManyInputSchema: z.ZodType<Prisma.sourceTableCreateManyInput> = z.strictObject({
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

export const sourceTableUpdateManyMutationInputSchema: z.ZodType<Prisma.sourceTableUpdateManyMutationInput> = z.strictObject({
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

export const sourceTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateManyInput> = z.strictObject({
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

export const organizationLocalTableCreateInputSchema: z.ZodType<Prisma.organizationLocalTableCreateInput> = z.strictObject({
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
  organizationMasterTable: z.lazy(() => organizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const organizationLocalTableUncheckedCreateInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedCreateInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const organizationLocalTableUpdateInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateInput> = z.strictObject({
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
  organizationMasterTable: z.lazy(() => organizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const organizationLocalTableUncheckedUpdateInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedUpdateInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const organizationLocalTableCreateManyInputSchema: z.ZodType<Prisma.organizationLocalTableCreateManyInput> = z.strictObject({
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

export const organizationLocalTableUpdateManyMutationInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateManyMutationInput> = z.strictObject({
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

export const organizationLocalTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedUpdateManyInput> = z.strictObject({
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

export const organizationMasterTableCreateInputSchema: z.ZodType<Prisma.organizationMasterTableCreateInput> = z.strictObject({
  organizationMasterId: z.string(),
  organizationMasterName: z.string(),
  officialWebsite: z.string().optional().nullable(),
  officialAddress: z.string().optional().nullable(),
  officialEmail: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedManyWithoutOrganizationMasterTableInputSchema).optional(),
});

export const organizationMasterTableUncheckedCreateInputSchema: z.ZodType<Prisma.organizationMasterTableUncheckedCreateInput> = z.strictObject({
  organizationMasterId: z.string(),
  organizationMasterName: z.string(),
  officialWebsite: z.string().optional().nullable(),
  officialAddress: z.string().optional().nullable(),
  officialEmail: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUncheckedCreateNestedManyWithoutOrganizationMasterTableInputSchema).optional(),
});

export const organizationMasterTableUpdateInputSchema: z.ZodType<Prisma.organizationMasterTableUpdateInput> = z.strictObject({
  organizationMasterId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  officialWebsite: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  officialAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  officialEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateManyWithoutOrganizationMasterTableNestedInputSchema).optional(),
});

export const organizationMasterTableUncheckedUpdateInputSchema: z.ZodType<Prisma.organizationMasterTableUncheckedUpdateInput> = z.strictObject({
  organizationMasterId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  officialWebsite: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  officialAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  officialEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUncheckedUpdateManyWithoutOrganizationMasterTableNestedInputSchema).optional(),
});

export const organizationMasterTableCreateManyInputSchema: z.ZodType<Prisma.organizationMasterTableCreateManyInput> = z.strictObject({
  organizationMasterId: z.string(),
  organizationMasterName: z.string(),
  officialWebsite: z.string().optional().nullable(),
  officialAddress: z.string().optional().nullable(),
  officialEmail: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
});

export const organizationMasterTableUpdateManyMutationInputSchema: z.ZodType<Prisma.organizationMasterTableUpdateManyMutationInput> = z.strictObject({
  organizationMasterId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  officialWebsite: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  officialAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  officialEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const organizationMasterTableUncheckedUpdateManyInputSchema: z.ZodType<Prisma.organizationMasterTableUncheckedUpdateManyInput> = z.strictObject({
  organizationMasterId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  officialWebsite: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  officialAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  officialEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
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

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
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

export const CropTableListRelationFilterSchema: z.ZodType<Prisma.CropTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => cropTableWhereInputSchema).optional(),
  some: z.lazy(() => cropTableWhereInputSchema).optional(),
  none: z.lazy(() => cropTableWhereInputSchema).optional(),
});

export const LandTableListRelationFilterSchema: z.ZodType<Prisma.LandTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => landTableWhereInputSchema).optional(),
  some: z.lazy(() => landTableWhereInputSchema).optional(),
  none: z.lazy(() => landTableWhereInputSchema).optional(),
});

export const PlantingTableListRelationFilterSchema: z.ZodType<Prisma.PlantingTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => plantingTableWhereInputSchema).optional(),
  some: z.lazy(() => plantingTableWhereInputSchema).optional(),
  none: z.lazy(() => plantingTableWhereInputSchema).optional(),
});

export const PolyTableListRelationFilterSchema: z.ZodType<Prisma.PolyTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => polyTableWhereInputSchema).optional(),
  some: z.lazy(() => polyTableWhereInputSchema).optional(),
  none: z.lazy(() => polyTableWhereInputSchema).optional(),
});

export const OrganizationLocalTableNullableScalarRelationFilterSchema: z.ZodType<Prisma.OrganizationLocalTableNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => organizationLocalTableWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => organizationLocalTableWhereInputSchema).optional().nullable(),
});

export const StakeholderTableListRelationFilterSchema: z.ZodType<Prisma.StakeholderTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => stakeholderTableWhereInputSchema).optional(),
  some: z.lazy(() => stakeholderTableWhereInputSchema).optional(),
  none: z.lazy(() => stakeholderTableWhereInputSchema).optional(),
});

export const SourceTableListRelationFilterSchema: z.ZodType<Prisma.SourceTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => sourceTableWhereInputSchema).optional(),
  some: z.lazy(() => sourceTableWhereInputSchema).optional(),
  none: z.lazy(() => sourceTableWhereInputSchema).optional(),
});

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.strictObject({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional(),
});

export const cropTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.cropTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const landTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.landTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const plantingTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.plantingTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const polyTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.polyTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const stakeholderTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.stakeholderTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const sourceTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.sourceTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const projectTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.projectTableCountOrderByAggregateInput> = z.strictObject({
  projectId: z.lazy(() => SortOrderSchema).optional(),
  projectName: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  platformId: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  projectNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  isPublic: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistryType: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistry: z.lazy(() => SortOrderSchema).optional(),
  employmentClaim: z.lazy(() => SortOrderSchema).optional(),
  employmentClaimDescription: z.lazy(() => SortOrderSchema).optional(),
  projectDateEnd: z.lazy(() => SortOrderSchema).optional(),
  projectDateStart: z.lazy(() => SortOrderSchema).optional(),
  registryId: z.lazy(() => SortOrderSchema).optional(),
});

export const projectTableAvgOrderByAggregateInputSchema: z.ZodType<Prisma.projectTableAvgOrderByAggregateInput> = z.strictObject({
  employmentClaim: z.lazy(() => SortOrderSchema).optional(),
});

export const projectTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.projectTableMaxOrderByAggregateInput> = z.strictObject({
  projectId: z.lazy(() => SortOrderSchema).optional(),
  projectName: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  platformId: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  projectNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  isPublic: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistryType: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistry: z.lazy(() => SortOrderSchema).optional(),
  employmentClaim: z.lazy(() => SortOrderSchema).optional(),
  employmentClaimDescription: z.lazy(() => SortOrderSchema).optional(),
  projectDateEnd: z.lazy(() => SortOrderSchema).optional(),
  projectDateStart: z.lazy(() => SortOrderSchema).optional(),
  registryId: z.lazy(() => SortOrderSchema).optional(),
});

export const projectTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.projectTableMinOrderByAggregateInput> = z.strictObject({
  projectId: z.lazy(() => SortOrderSchema).optional(),
  projectName: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  platformId: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  projectNotes: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  deleted: z.lazy(() => SortOrderSchema).optional(),
  isPublic: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistryType: z.lazy(() => SortOrderSchema).optional(),
  carbonRegistry: z.lazy(() => SortOrderSchema).optional(),
  employmentClaim: z.lazy(() => SortOrderSchema).optional(),
  employmentClaimDescription: z.lazy(() => SortOrderSchema).optional(),
  projectDateEnd: z.lazy(() => SortOrderSchema).optional(),
  projectDateStart: z.lazy(() => SortOrderSchema).optional(),
  registryId: z.lazy(() => SortOrderSchema).optional(),
});

export const projectTableSumOrderByAggregateInputSchema: z.ZodType<Prisma.projectTableSumOrderByAggregateInput> = z.strictObject({
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

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
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

export const DecimalNullableFilterSchema: z.ZodType<Prisma.DecimalNullableFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableFilterSchema) ]).optional().nullable(),
});

export const EnumTreatmentTypeNullableFilterSchema: z.ZodType<Prisma.EnumTreatmentTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  in: z.lazy(() => TreatmentTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => TreatmentTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NestedEnumTreatmentTypeNullableFilterSchema) ]).optional().nullable(),
});

export const ProjectTableScalarRelationFilterSchema: z.ZodType<Prisma.ProjectTableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => projectTableWhereInputSchema).optional(),
  isNot: z.lazy(() => projectTableWhereInputSchema).optional(),
});

export const PolygonTableListRelationFilterSchema: z.ZodType<Prisma.PolygonTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => polygonTableWhereInputSchema).optional(),
  some: z.lazy(() => polygonTableWhereInputSchema).optional(),
  none: z.lazy(() => polygonTableWhereInputSchema).optional(),
});

export const polygonTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.polygonTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const landTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.landTableCountOrderByAggregateInput> = z.strictObject({
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

export const landTableAvgOrderByAggregateInputSchema: z.ZodType<Prisma.landTableAvgOrderByAggregateInput> = z.strictObject({
  hectares: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const landTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.landTableMaxOrderByAggregateInput> = z.strictObject({
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

export const landTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.landTableMinOrderByAggregateInput> = z.strictObject({
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

export const landTableSumOrderByAggregateInputSchema: z.ZodType<Prisma.landTableSumOrderByAggregateInput> = z.strictObject({
  hectares: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const DecimalNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DecimalNullableWithAggregatesFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableWithAggregatesFilterSchema) ]).optional().nullable(),
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
  is: z.lazy(() => projectTableWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => projectTableWhereInputSchema).optional().nullable(),
});

export const SpeciesTableListRelationFilterSchema: z.ZodType<Prisma.SpeciesTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => speciesTableWhereInputSchema).optional(),
  some: z.lazy(() => speciesTableWhereInputSchema).optional(),
  none: z.lazy(() => speciesTableWhereInputSchema).optional(),
});

export const speciesTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.speciesTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const cropTableProjectIdCropNameCompoundUniqueInputSchema: z.ZodType<Prisma.cropTableProjectIdCropNameCompoundUniqueInput> = z.strictObject({
  projectId: z.string(),
  cropName: z.string(),
});

export const cropTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.cropTableCountOrderByAggregateInput> = z.strictObject({
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

export const cropTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.cropTableMaxOrderByAggregateInput> = z.strictObject({
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

export const cropTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.cropTableMinOrderByAggregateInput> = z.strictObject({
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

export const plantingTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.plantingTableCountOrderByAggregateInput> = z.strictObject({
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

export const plantingTableAvgOrderByAggregateInputSchema: z.ZodType<Prisma.plantingTableAvgOrderByAggregateInput> = z.strictObject({
  planted: z.lazy(() => SortOrderSchema).optional(),
  allocated: z.lazy(() => SortOrderSchema).optional(),
  units: z.lazy(() => SortOrderSchema).optional(),
  pricePerUnit: z.lazy(() => SortOrderSchema).optional(),
});

export const plantingTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.plantingTableMaxOrderByAggregateInput> = z.strictObject({
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

export const plantingTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.plantingTableMinOrderByAggregateInput> = z.strictObject({
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

export const plantingTableSumOrderByAggregateInputSchema: z.ZodType<Prisma.plantingTableSumOrderByAggregateInput> = z.strictObject({
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

export const speciesTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.speciesTableCountOrderByAggregateInput> = z.strictObject({
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

export const speciesTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.speciesTableMaxOrderByAggregateInput> = z.strictObject({
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

export const speciesTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.speciesTableMinOrderByAggregateInput> = z.strictObject({
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

export const LandTableScalarRelationFilterSchema: z.ZodType<Prisma.LandTableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => landTableWhereInputSchema).optional(),
  isNot: z.lazy(() => landTableWhereInputSchema).optional(),
});

export const polygonTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.polygonTableCountOrderByAggregateInput> = z.strictObject({
  polygonId: z.lazy(() => SortOrderSchema).optional(),
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.lazy(() => SortOrderSchema).optional(),
  geometry: z.lazy(() => SortOrderSchema).optional(),
  coordinates: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  polygonNotes: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const polygonTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.polygonTableMaxOrderByAggregateInput> = z.strictObject({
  polygonId: z.lazy(() => SortOrderSchema).optional(),
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.lazy(() => SortOrderSchema).optional(),
  geometry: z.lazy(() => SortOrderSchema).optional(),
  coordinates: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  polygonNotes: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const polygonTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.polygonTableMinOrderByAggregateInput> = z.strictObject({
  polygonId: z.lazy(() => SortOrderSchema).optional(),
  landId: z.lazy(() => SortOrderSchema).optional(),
  landName: z.lazy(() => SortOrderSchema).optional(),
  geometry: z.lazy(() => SortOrderSchema).optional(),
  coordinates: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  polygonNotes: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
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

export const polyTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.polyTableCountOrderByAggregateInput> = z.strictObject({
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

export const polyTableAvgOrderByAggregateInputSchema: z.ZodType<Prisma.polyTableAvgOrderByAggregateInput> = z.strictObject({
  survivalRate: z.lazy(() => SortOrderSchema).optional(),
  ratePerTree: z.lazy(() => SortOrderSchema).optional(),
});

export const polyTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.polyTableMaxOrderByAggregateInput> = z.strictObject({
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

export const polyTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.polyTableMinOrderByAggregateInput> = z.strictObject({
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

export const polyTableSumOrderByAggregateInputSchema: z.ZodType<Prisma.polyTableSumOrderByAggregateInput> = z.strictObject({
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
  is: z.lazy(() => organizationLocalTableWhereInputSchema).optional(),
  isNot: z.lazy(() => organizationLocalTableWhereInputSchema).optional(),
});

export const stakeholderTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.stakeholderTableCountOrderByAggregateInput> = z.strictObject({
  stakeholderId: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  stakeholderType: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const stakeholderTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.stakeholderTableMaxOrderByAggregateInput> = z.strictObject({
  stakeholderId: z.lazy(() => SortOrderSchema).optional(),
  organizationLocalId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional(),
  parentTable: z.lazy(() => SortOrderSchema).optional(),
  projectId: z.lazy(() => SortOrderSchema).optional(),
  stakeholderType: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const stakeholderTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.stakeholderTableMinOrderByAggregateInput> = z.strictObject({
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

export const OrganizationLocalTableListRelationFilterSchema: z.ZodType<Prisma.OrganizationLocalTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => organizationLocalTableWhereInputSchema).optional(),
  some: z.lazy(() => organizationLocalTableWhereInputSchema).optional(),
  none: z.lazy(() => organizationLocalTableWhereInputSchema).optional(),
});

export const ProjectTableListRelationFilterSchema: z.ZodType<Prisma.ProjectTableListRelationFilter> = z.strictObject({
  every: z.lazy(() => projectTableWhereInputSchema).optional(),
  some: z.lazy(() => projectTableWhereInputSchema).optional(),
  none: z.lazy(() => projectTableWhereInputSchema).optional(),
});

export const organizationLocalTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.organizationLocalTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const projectTableOrderByRelationAggregateInputSchema: z.ZodType<Prisma.projectTableOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const sourceTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.sourceTableCountOrderByAggregateInput> = z.strictObject({
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

export const sourceTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.sourceTableMaxOrderByAggregateInput> = z.strictObject({
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

export const sourceTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.sourceTableMinOrderByAggregateInput> = z.strictObject({
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

export const OrganizationMasterTableNullableScalarRelationFilterSchema: z.ZodType<Prisma.OrganizationMasterTableNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => organizationMasterTableWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => organizationMasterTableWhereInputSchema).optional().nullable(),
});

export const organizationLocalTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.organizationLocalTableCountOrderByAggregateInput> = z.strictObject({
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

export const organizationLocalTableAvgOrderByAggregateInputSchema: z.ZodType<Prisma.organizationLocalTableAvgOrderByAggregateInput> = z.strictObject({
  capacityPerYear: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const organizationLocalTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.organizationLocalTableMaxOrderByAggregateInput> = z.strictObject({
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

export const organizationLocalTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.organizationLocalTableMinOrderByAggregateInput> = z.strictObject({
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

export const organizationLocalTableSumOrderByAggregateInputSchema: z.ZodType<Prisma.organizationLocalTableSumOrderByAggregateInput> = z.strictObject({
  capacityPerYear: z.lazy(() => SortOrderSchema).optional(),
  gpsLat: z.lazy(() => SortOrderSchema).optional(),
  gpsLon: z.lazy(() => SortOrderSchema).optional(),
});

export const organizationMasterTableCountOrderByAggregateInputSchema: z.ZodType<Prisma.organizationMasterTableCountOrderByAggregateInput> = z.strictObject({
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterName: z.lazy(() => SortOrderSchema).optional(),
  officialWebsite: z.lazy(() => SortOrderSchema).optional(),
  officialAddress: z.lazy(() => SortOrderSchema).optional(),
  officialEmail: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
});

export const organizationMasterTableMaxOrderByAggregateInputSchema: z.ZodType<Prisma.organizationMasterTableMaxOrderByAggregateInput> = z.strictObject({
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterName: z.lazy(() => SortOrderSchema).optional(),
  officialWebsite: z.lazy(() => SortOrderSchema).optional(),
  officialAddress: z.lazy(() => SortOrderSchema).optional(),
  officialEmail: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
});

export const organizationMasterTableMinOrderByAggregateInputSchema: z.ZodType<Prisma.organizationMasterTableMinOrderByAggregateInput> = z.strictObject({
  organizationMasterId: z.lazy(() => SortOrderSchema).optional(),
  organizationMasterName: z.lazy(() => SortOrderSchema).optional(),
  officialWebsite: z.lazy(() => SortOrderSchema).optional(),
  officialAddress: z.lazy(() => SortOrderSchema).optional(),
  officialEmail: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  lastEditedAt: z.lazy(() => SortOrderSchema).optional(),
  editedBy: z.lazy(() => SortOrderSchema).optional(),
});

export const cropTableCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.cropTableCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => cropTableCreateWithoutProjectTableInputSchema), z.lazy(() => cropTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => cropTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => cropTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => cropTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => cropTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
});

export const landTableCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.landTableCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => landTableCreateWithoutProjectTableInputSchema), z.lazy(() => landTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => landTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => landTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => landTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => landTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
});

export const plantingTableCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.plantingTableCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => plantingTableCreateWithoutProjectTableInputSchema), z.lazy(() => plantingTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => plantingTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => plantingTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => plantingTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => plantingTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => plantingTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
});

export const polyTableCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.polyTableCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => polyTableCreateWithoutProjectTableInputSchema), z.lazy(() => polyTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => polyTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => polyTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => polyTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => polyTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => polyTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => polyTableWhereUniqueInputSchema), z.lazy(() => polyTableWhereUniqueInputSchema).array() ]).optional(),
});

export const organizationLocalTableCreateNestedOneWithoutProjectTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateNestedOneWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutProjectTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutProjectTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => organizationLocalTableCreateOrConnectWithoutProjectTableInputSchema).optional(),
  connect: z.lazy(() => organizationLocalTableWhereUniqueInputSchema).optional(),
});

export const stakeholderTableCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.stakeholderTableCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => stakeholderTableCreateWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => stakeholderTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => stakeholderTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => stakeholderTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
});

export const sourceTableCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.sourceTableCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutProjectTableInputSchema), z.lazy(() => sourceTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const cropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.cropTableUncheckedCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => cropTableCreateWithoutProjectTableInputSchema), z.lazy(() => cropTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => cropTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => cropTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => cropTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => cropTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
});

export const landTableUncheckedCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.landTableUncheckedCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => landTableCreateWithoutProjectTableInputSchema), z.lazy(() => landTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => landTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => landTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => landTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => landTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
});

export const plantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.plantingTableUncheckedCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => plantingTableCreateWithoutProjectTableInputSchema), z.lazy(() => plantingTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => plantingTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => plantingTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => plantingTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => plantingTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => plantingTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
});

export const polyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.polyTableUncheckedCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => polyTableCreateWithoutProjectTableInputSchema), z.lazy(() => polyTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => polyTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => polyTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => polyTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => polyTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => polyTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => polyTableWhereUniqueInputSchema), z.lazy(() => polyTableWhereUniqueInputSchema).array() ]).optional(),
});

export const stakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => stakeholderTableCreateWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => stakeholderTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => stakeholderTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => stakeholderTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
});

export const sourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedCreateNestedManyWithoutProjectTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutProjectTableInputSchema), z.lazy(() => sourceTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
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

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.strictObject({
  set: z.boolean().optional(),
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

export const cropTableUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.cropTableUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => cropTableCreateWithoutProjectTableInputSchema), z.lazy(() => cropTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => cropTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => cropTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => cropTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => cropTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => cropTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => cropTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => cropTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => cropTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => cropTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => cropTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => cropTableScalarWhereInputSchema), z.lazy(() => cropTableScalarWhereInputSchema).array() ]).optional(),
});

export const landTableUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.landTableUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => landTableCreateWithoutProjectTableInputSchema), z.lazy(() => landTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => landTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => landTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => landTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => landTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => landTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => landTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => landTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => landTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => landTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => landTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => landTableScalarWhereInputSchema), z.lazy(() => landTableScalarWhereInputSchema).array() ]).optional(),
});

export const plantingTableUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.plantingTableUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => plantingTableCreateWithoutProjectTableInputSchema), z.lazy(() => plantingTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => plantingTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => plantingTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => plantingTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => plantingTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => plantingTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => plantingTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => plantingTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => plantingTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => plantingTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => plantingTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => plantingTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => plantingTableScalarWhereInputSchema), z.lazy(() => plantingTableScalarWhereInputSchema).array() ]).optional(),
});

export const polyTableUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.polyTableUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => polyTableCreateWithoutProjectTableInputSchema), z.lazy(() => polyTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => polyTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => polyTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => polyTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => polyTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => polyTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => polyTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => polyTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => polyTableWhereUniqueInputSchema), z.lazy(() => polyTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => polyTableWhereUniqueInputSchema), z.lazy(() => polyTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => polyTableWhereUniqueInputSchema), z.lazy(() => polyTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => polyTableWhereUniqueInputSchema), z.lazy(() => polyTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => polyTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => polyTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => polyTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => polyTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => polyTableScalarWhereInputSchema), z.lazy(() => polyTableScalarWhereInputSchema).array() ]).optional(),
});

export const organizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateOneWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutProjectTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutProjectTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => organizationLocalTableCreateOrConnectWithoutProjectTableInputSchema).optional(),
  upsert: z.lazy(() => organizationLocalTableUpsertWithoutProjectTableInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => organizationLocalTableWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => organizationLocalTableWhereInputSchema) ]).optional(),
  connect: z.lazy(() => organizationLocalTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => organizationLocalTableUpdateToOneWithWhereWithoutProjectTableInputSchema), z.lazy(() => organizationLocalTableUpdateWithoutProjectTableInputSchema), z.lazy(() => organizationLocalTableUncheckedUpdateWithoutProjectTableInputSchema) ]).optional(),
});

export const stakeholderTableUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.stakeholderTableUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => stakeholderTableCreateWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => stakeholderTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => stakeholderTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => stakeholderTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => stakeholderTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => stakeholderTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => stakeholderTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => stakeholderTableScalarWhereInputSchema), z.lazy(() => stakeholderTableScalarWhereInputSchema).array() ]).optional(),
});

export const sourceTableUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.sourceTableUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutProjectTableInputSchema), z.lazy(() => sourceTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => sourceTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => sourceTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => sourceTableScalarWhereInputSchema), z.lazy(() => sourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const cropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.cropTableUncheckedUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => cropTableCreateWithoutProjectTableInputSchema), z.lazy(() => cropTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => cropTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => cropTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => cropTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => cropTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => cropTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => cropTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => cropTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => cropTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => cropTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => cropTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => cropTableScalarWhereInputSchema), z.lazy(() => cropTableScalarWhereInputSchema).array() ]).optional(),
});

export const landTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.landTableUncheckedUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => landTableCreateWithoutProjectTableInputSchema), z.lazy(() => landTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => landTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => landTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => landTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => landTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => landTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => landTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => landTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => landTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => landTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => landTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => landTableScalarWhereInputSchema), z.lazy(() => landTableScalarWhereInputSchema).array() ]).optional(),
});

export const plantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.plantingTableUncheckedUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => plantingTableCreateWithoutProjectTableInputSchema), z.lazy(() => plantingTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => plantingTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => plantingTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => plantingTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => plantingTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => plantingTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => plantingTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => plantingTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => plantingTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => plantingTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => plantingTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => plantingTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => plantingTableScalarWhereInputSchema), z.lazy(() => plantingTableScalarWhereInputSchema).array() ]).optional(),
});

export const polyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.polyTableUncheckedUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => polyTableCreateWithoutProjectTableInputSchema), z.lazy(() => polyTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => polyTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => polyTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => polyTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => polyTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => polyTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => polyTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => polyTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => polyTableWhereUniqueInputSchema), z.lazy(() => polyTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => polyTableWhereUniqueInputSchema), z.lazy(() => polyTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => polyTableWhereUniqueInputSchema), z.lazy(() => polyTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => polyTableWhereUniqueInputSchema), z.lazy(() => polyTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => polyTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => polyTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => polyTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => polyTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => polyTableScalarWhereInputSchema), z.lazy(() => polyTableScalarWhereInputSchema).array() ]).optional(),
});

export const stakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => stakeholderTableCreateWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => stakeholderTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => stakeholderTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => stakeholderTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => stakeholderTableCreateManyProjectTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => stakeholderTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => stakeholderTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => stakeholderTableScalarWhereInputSchema), z.lazy(() => stakeholderTableScalarWhereInputSchema).array() ]).optional(),
});

export const sourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateManyWithoutProjectTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutProjectTableInputSchema), z.lazy(() => sourceTableCreateWithoutProjectTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutProjectTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutProjectTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutProjectTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutProjectTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutProjectTableInputSchema), z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutProjectTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => sourceTableUpdateManyWithWhereWithoutProjectTableInputSchema), z.lazy(() => sourceTableUpdateManyWithWhereWithoutProjectTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => sourceTableScalarWhereInputSchema), z.lazy(() => sourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const projectTableCreateNestedOneWithoutLandTableInputSchema: z.ZodType<Prisma.projectTableCreateNestedOneWithoutLandTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutLandTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutLandTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => projectTableCreateOrConnectWithoutLandTableInputSchema).optional(),
  connect: z.lazy(() => projectTableWhereUniqueInputSchema).optional(),
});

export const polygonTableCreateNestedManyWithoutLandTableInputSchema: z.ZodType<Prisma.polygonTableCreateNestedManyWithoutLandTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => polygonTableCreateWithoutLandTableInputSchema), z.lazy(() => polygonTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => polygonTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => polygonTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => polygonTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => polygonTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => polygonTableCreateManyLandTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => polygonTableWhereUniqueInputSchema), z.lazy(() => polygonTableWhereUniqueInputSchema).array() ]).optional(),
});

export const sourceTableCreateNestedManyWithoutLandTableInputSchema: z.ZodType<Prisma.sourceTableCreateNestedManyWithoutLandTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutLandTableInputSchema), z.lazy(() => sourceTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const polygonTableUncheckedCreateNestedManyWithoutLandTableInputSchema: z.ZodType<Prisma.polygonTableUncheckedCreateNestedManyWithoutLandTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => polygonTableCreateWithoutLandTableInputSchema), z.lazy(() => polygonTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => polygonTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => polygonTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => polygonTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => polygonTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => polygonTableCreateManyLandTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => polygonTableWhereUniqueInputSchema), z.lazy(() => polygonTableWhereUniqueInputSchema).array() ]).optional(),
});

export const sourceTableUncheckedCreateNestedManyWithoutLandTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedCreateNestedManyWithoutLandTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutLandTableInputSchema), z.lazy(() => sourceTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const NullableDecimalFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDecimalFieldUpdateOperationsInput> = z.strictObject({
  set: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  increment: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  decrement: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  multiply: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  divide: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
});

export const NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumTreatmentTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
});

export const projectTableUpdateOneRequiredWithoutLandTableNestedInputSchema: z.ZodType<Prisma.projectTableUpdateOneRequiredWithoutLandTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutLandTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutLandTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => projectTableCreateOrConnectWithoutLandTableInputSchema).optional(),
  upsert: z.lazy(() => projectTableUpsertWithoutLandTableInputSchema).optional(),
  connect: z.lazy(() => projectTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => projectTableUpdateToOneWithWhereWithoutLandTableInputSchema), z.lazy(() => projectTableUpdateWithoutLandTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutLandTableInputSchema) ]).optional(),
});

export const polygonTableUpdateManyWithoutLandTableNestedInputSchema: z.ZodType<Prisma.polygonTableUpdateManyWithoutLandTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => polygonTableCreateWithoutLandTableInputSchema), z.lazy(() => polygonTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => polygonTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => polygonTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => polygonTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => polygonTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => polygonTableUpsertWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => polygonTableUpsertWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => polygonTableCreateManyLandTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => polygonTableWhereUniqueInputSchema), z.lazy(() => polygonTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => polygonTableWhereUniqueInputSchema), z.lazy(() => polygonTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => polygonTableWhereUniqueInputSchema), z.lazy(() => polygonTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => polygonTableWhereUniqueInputSchema), z.lazy(() => polygonTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => polygonTableUpdateWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => polygonTableUpdateWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => polygonTableUpdateManyWithWhereWithoutLandTableInputSchema), z.lazy(() => polygonTableUpdateManyWithWhereWithoutLandTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => polygonTableScalarWhereInputSchema), z.lazy(() => polygonTableScalarWhereInputSchema).array() ]).optional(),
});

export const sourceTableUpdateManyWithoutLandTableNestedInputSchema: z.ZodType<Prisma.sourceTableUpdateManyWithoutLandTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutLandTableInputSchema), z.lazy(() => sourceTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => sourceTableUpdateManyWithWhereWithoutLandTableInputSchema), z.lazy(() => sourceTableUpdateManyWithWhereWithoutLandTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => sourceTableScalarWhereInputSchema), z.lazy(() => sourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const polygonTableUncheckedUpdateManyWithoutLandTableNestedInputSchema: z.ZodType<Prisma.polygonTableUncheckedUpdateManyWithoutLandTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => polygonTableCreateWithoutLandTableInputSchema), z.lazy(() => polygonTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => polygonTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => polygonTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => polygonTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => polygonTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => polygonTableUpsertWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => polygonTableUpsertWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => polygonTableCreateManyLandTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => polygonTableWhereUniqueInputSchema), z.lazy(() => polygonTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => polygonTableWhereUniqueInputSchema), z.lazy(() => polygonTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => polygonTableWhereUniqueInputSchema), z.lazy(() => polygonTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => polygonTableWhereUniqueInputSchema), z.lazy(() => polygonTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => polygonTableUpdateWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => polygonTableUpdateWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => polygonTableUpdateManyWithWhereWithoutLandTableInputSchema), z.lazy(() => polygonTableUpdateManyWithWhereWithoutLandTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => polygonTableScalarWhereInputSchema), z.lazy(() => polygonTableScalarWhereInputSchema).array() ]).optional(),
});

export const sourceTableUncheckedUpdateManyWithoutLandTableNestedInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateManyWithoutLandTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutLandTableInputSchema), z.lazy(() => sourceTableCreateWithoutLandTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutLandTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutLandTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutLandTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutLandTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutLandTableInputSchema), z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutLandTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => sourceTableUpdateManyWithWhereWithoutLandTableInputSchema), z.lazy(() => sourceTableUpdateManyWithWhereWithoutLandTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => sourceTableScalarWhereInputSchema), z.lazy(() => sourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const projectTableCreateNestedOneWithoutCropTableInputSchema: z.ZodType<Prisma.projectTableCreateNestedOneWithoutCropTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutCropTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutCropTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => projectTableCreateOrConnectWithoutCropTableInputSchema).optional(),
  connect: z.lazy(() => projectTableWhereUniqueInputSchema).optional(),
});

export const sourceTableCreateNestedManyWithoutCropTableInputSchema: z.ZodType<Prisma.sourceTableCreateNestedManyWithoutCropTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutCropTableInputSchema), z.lazy(() => sourceTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const speciesTableCreateNestedManyWithoutCropTableInputSchema: z.ZodType<Prisma.speciesTableCreateNestedManyWithoutCropTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => speciesTableCreateWithoutCropTableInputSchema), z.lazy(() => speciesTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => speciesTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => speciesTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => speciesTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => speciesTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => speciesTableWhereUniqueInputSchema), z.lazy(() => speciesTableWhereUniqueInputSchema).array() ]).optional(),
});

export const sourceTableUncheckedCreateNestedManyWithoutCropTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedCreateNestedManyWithoutCropTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutCropTableInputSchema), z.lazy(() => sourceTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const speciesTableUncheckedCreateNestedManyWithoutCropTableInputSchema: z.ZodType<Prisma.speciesTableUncheckedCreateNestedManyWithoutCropTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => speciesTableCreateWithoutCropTableInputSchema), z.lazy(() => speciesTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => speciesTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => speciesTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => speciesTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => speciesTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => speciesTableWhereUniqueInputSchema), z.lazy(() => speciesTableWhereUniqueInputSchema).array() ]).optional(),
});

export const projectTableUpdateOneWithoutCropTableNestedInputSchema: z.ZodType<Prisma.projectTableUpdateOneWithoutCropTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutCropTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutCropTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => projectTableCreateOrConnectWithoutCropTableInputSchema).optional(),
  upsert: z.lazy(() => projectTableUpsertWithoutCropTableInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => projectTableWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => projectTableWhereInputSchema) ]).optional(),
  connect: z.lazy(() => projectTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => projectTableUpdateToOneWithWhereWithoutCropTableInputSchema), z.lazy(() => projectTableUpdateWithoutCropTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutCropTableInputSchema) ]).optional(),
});

export const sourceTableUpdateManyWithoutCropTableNestedInputSchema: z.ZodType<Prisma.sourceTableUpdateManyWithoutCropTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutCropTableInputSchema), z.lazy(() => sourceTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => sourceTableUpdateManyWithWhereWithoutCropTableInputSchema), z.lazy(() => sourceTableUpdateManyWithWhereWithoutCropTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => sourceTableScalarWhereInputSchema), z.lazy(() => sourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const speciesTableUpdateManyWithoutCropTableNestedInputSchema: z.ZodType<Prisma.speciesTableUpdateManyWithoutCropTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => speciesTableCreateWithoutCropTableInputSchema), z.lazy(() => speciesTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => speciesTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => speciesTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => speciesTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => speciesTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => speciesTableUpsertWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => speciesTableUpsertWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => speciesTableWhereUniqueInputSchema), z.lazy(() => speciesTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => speciesTableWhereUniqueInputSchema), z.lazy(() => speciesTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => speciesTableWhereUniqueInputSchema), z.lazy(() => speciesTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => speciesTableWhereUniqueInputSchema), z.lazy(() => speciesTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => speciesTableUpdateWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => speciesTableUpdateWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => speciesTableUpdateManyWithWhereWithoutCropTableInputSchema), z.lazy(() => speciesTableUpdateManyWithWhereWithoutCropTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => speciesTableScalarWhereInputSchema), z.lazy(() => speciesTableScalarWhereInputSchema).array() ]).optional(),
});

export const sourceTableUncheckedUpdateManyWithoutCropTableNestedInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateManyWithoutCropTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutCropTableInputSchema), z.lazy(() => sourceTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => sourceTableUpdateManyWithWhereWithoutCropTableInputSchema), z.lazy(() => sourceTableUpdateManyWithWhereWithoutCropTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => sourceTableScalarWhereInputSchema), z.lazy(() => sourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const speciesTableUncheckedUpdateManyWithoutCropTableNestedInputSchema: z.ZodType<Prisma.speciesTableUncheckedUpdateManyWithoutCropTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => speciesTableCreateWithoutCropTableInputSchema), z.lazy(() => speciesTableCreateWithoutCropTableInputSchema).array(), z.lazy(() => speciesTableUncheckedCreateWithoutCropTableInputSchema), z.lazy(() => speciesTableUncheckedCreateWithoutCropTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => speciesTableCreateOrConnectWithoutCropTableInputSchema), z.lazy(() => speciesTableCreateOrConnectWithoutCropTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => speciesTableUpsertWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => speciesTableUpsertWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => speciesTableWhereUniqueInputSchema), z.lazy(() => speciesTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => speciesTableWhereUniqueInputSchema), z.lazy(() => speciesTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => speciesTableWhereUniqueInputSchema), z.lazy(() => speciesTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => speciesTableWhereUniqueInputSchema), z.lazy(() => speciesTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => speciesTableUpdateWithWhereUniqueWithoutCropTableInputSchema), z.lazy(() => speciesTableUpdateWithWhereUniqueWithoutCropTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => speciesTableUpdateManyWithWhereWithoutCropTableInputSchema), z.lazy(() => speciesTableUpdateManyWithWhereWithoutCropTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => speciesTableScalarWhereInputSchema), z.lazy(() => speciesTableScalarWhereInputSchema).array() ]).optional(),
});

export const projectTableCreateNestedOneWithoutPlantingTableInputSchema: z.ZodType<Prisma.projectTableCreateNestedOneWithoutPlantingTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutPlantingTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutPlantingTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => projectTableCreateOrConnectWithoutPlantingTableInputSchema).optional(),
  connect: z.lazy(() => projectTableWhereUniqueInputSchema).optional(),
});

export const sourceTableCreateNestedManyWithoutPlantingTableInputSchema: z.ZodType<Prisma.sourceTableCreateNestedManyWithoutPlantingTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutPlantingTableInputSchema), z.lazy(() => sourceTableCreateWithoutPlantingTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutPlantingTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutPlantingTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutPlantingTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const sourceTableUncheckedCreateNestedManyWithoutPlantingTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedCreateNestedManyWithoutPlantingTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutPlantingTableInputSchema), z.lazy(() => sourceTableCreateWithoutPlantingTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutPlantingTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutPlantingTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutPlantingTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumParentTableFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumParentTableFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => ParentTableSchema).optional(),
});

export const NullableEnumUnitTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumUnitTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => UnitTypeSchema).optional().nullable(),
});

export const projectTableUpdateOneRequiredWithoutPlantingTableNestedInputSchema: z.ZodType<Prisma.projectTableUpdateOneRequiredWithoutPlantingTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutPlantingTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutPlantingTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => projectTableCreateOrConnectWithoutPlantingTableInputSchema).optional(),
  upsert: z.lazy(() => projectTableUpsertWithoutPlantingTableInputSchema).optional(),
  connect: z.lazy(() => projectTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => projectTableUpdateToOneWithWhereWithoutPlantingTableInputSchema), z.lazy(() => projectTableUpdateWithoutPlantingTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutPlantingTableInputSchema) ]).optional(),
});

export const sourceTableUpdateManyWithoutPlantingTableNestedInputSchema: z.ZodType<Prisma.sourceTableUpdateManyWithoutPlantingTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutPlantingTableInputSchema), z.lazy(() => sourceTableCreateWithoutPlantingTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutPlantingTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutPlantingTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutPlantingTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutPlantingTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutPlantingTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => sourceTableUpdateManyWithWhereWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUpdateManyWithWhereWithoutPlantingTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => sourceTableScalarWhereInputSchema), z.lazy(() => sourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const sourceTableUncheckedUpdateManyWithoutPlantingTableNestedInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateManyWithoutPlantingTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutPlantingTableInputSchema), z.lazy(() => sourceTableCreateWithoutPlantingTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutPlantingTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutPlantingTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutPlantingTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutPlantingTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutPlantingTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => sourceTableUpdateManyWithWhereWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUpdateManyWithWhereWithoutPlantingTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => sourceTableScalarWhereInputSchema), z.lazy(() => sourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const cropTableCreateNestedManyWithoutSpeciesTableInputSchema: z.ZodType<Prisma.cropTableCreateNestedManyWithoutSpeciesTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => cropTableCreateWithoutSpeciesTableInputSchema), z.lazy(() => cropTableCreateWithoutSpeciesTableInputSchema).array(), z.lazy(() => cropTableUncheckedCreateWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutSpeciesTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => cropTableCreateOrConnectWithoutSpeciesTableInputSchema), z.lazy(() => cropTableCreateOrConnectWithoutSpeciesTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
});

export const cropTableUncheckedCreateNestedManyWithoutSpeciesTableInputSchema: z.ZodType<Prisma.cropTableUncheckedCreateNestedManyWithoutSpeciesTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => cropTableCreateWithoutSpeciesTableInputSchema), z.lazy(() => cropTableCreateWithoutSpeciesTableInputSchema).array(), z.lazy(() => cropTableUncheckedCreateWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutSpeciesTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => cropTableCreateOrConnectWithoutSpeciesTableInputSchema), z.lazy(() => cropTableCreateOrConnectWithoutSpeciesTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
});

export const cropTableUpdateManyWithoutSpeciesTableNestedInputSchema: z.ZodType<Prisma.cropTableUpdateManyWithoutSpeciesTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => cropTableCreateWithoutSpeciesTableInputSchema), z.lazy(() => cropTableCreateWithoutSpeciesTableInputSchema).array(), z.lazy(() => cropTableUncheckedCreateWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutSpeciesTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => cropTableCreateOrConnectWithoutSpeciesTableInputSchema), z.lazy(() => cropTableCreateOrConnectWithoutSpeciesTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => cropTableUpsertWithWhereUniqueWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUpsertWithWhereUniqueWithoutSpeciesTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => cropTableUpdateWithWhereUniqueWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUpdateWithWhereUniqueWithoutSpeciesTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => cropTableUpdateManyWithWhereWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUpdateManyWithWhereWithoutSpeciesTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => cropTableScalarWhereInputSchema), z.lazy(() => cropTableScalarWhereInputSchema).array() ]).optional(),
});

export const cropTableUncheckedUpdateManyWithoutSpeciesTableNestedInputSchema: z.ZodType<Prisma.cropTableUncheckedUpdateManyWithoutSpeciesTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => cropTableCreateWithoutSpeciesTableInputSchema), z.lazy(() => cropTableCreateWithoutSpeciesTableInputSchema).array(), z.lazy(() => cropTableUncheckedCreateWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutSpeciesTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => cropTableCreateOrConnectWithoutSpeciesTableInputSchema), z.lazy(() => cropTableCreateOrConnectWithoutSpeciesTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => cropTableUpsertWithWhereUniqueWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUpsertWithWhereUniqueWithoutSpeciesTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => cropTableUpdateWithWhereUniqueWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUpdateWithWhereUniqueWithoutSpeciesTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => cropTableUpdateManyWithWhereWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUpdateManyWithWhereWithoutSpeciesTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => cropTableScalarWhereInputSchema), z.lazy(() => cropTableScalarWhereInputSchema).array() ]).optional(),
});

export const landTableCreateNestedOneWithoutPolygonTableInputSchema: z.ZodType<Prisma.landTableCreateNestedOneWithoutPolygonTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => landTableCreateWithoutPolygonTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutPolygonTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => landTableCreateOrConnectWithoutPolygonTableInputSchema).optional(),
  connect: z.lazy(() => landTableWhereUniqueInputSchema).optional(),
});

export const landTableUpdateOneRequiredWithoutPolygonTableNestedInputSchema: z.ZodType<Prisma.landTableUpdateOneRequiredWithoutPolygonTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => landTableCreateWithoutPolygonTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutPolygonTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => landTableCreateOrConnectWithoutPolygonTableInputSchema).optional(),
  upsert: z.lazy(() => landTableUpsertWithoutPolygonTableInputSchema).optional(),
  connect: z.lazy(() => landTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => landTableUpdateToOneWithWhereWithoutPolygonTableInputSchema), z.lazy(() => landTableUpdateWithoutPolygonTableInputSchema), z.lazy(() => landTableUncheckedUpdateWithoutPolygonTableInputSchema) ]).optional(),
});

export const projectTableCreateNestedOneWithoutPolyTableInputSchema: z.ZodType<Prisma.projectTableCreateNestedOneWithoutPolyTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutPolyTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutPolyTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => projectTableCreateOrConnectWithoutPolyTableInputSchema).optional(),
  connect: z.lazy(() => projectTableWhereUniqueInputSchema).optional(),
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

export const projectTableUpdateOneRequiredWithoutPolyTableNestedInputSchema: z.ZodType<Prisma.projectTableUpdateOneRequiredWithoutPolyTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutPolyTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutPolyTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => projectTableCreateOrConnectWithoutPolyTableInputSchema).optional(),
  upsert: z.lazy(() => projectTableUpsertWithoutPolyTableInputSchema).optional(),
  connect: z.lazy(() => projectTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => projectTableUpdateToOneWithWhereWithoutPolyTableInputSchema), z.lazy(() => projectTableUpdateWithoutPolyTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutPolyTableInputSchema) ]).optional(),
});

export const organizationLocalTableCreateNestedOneWithoutStakeholderTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateNestedOneWithoutStakeholderTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutStakeholderTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => organizationLocalTableCreateOrConnectWithoutStakeholderTableInputSchema).optional(),
  connect: z.lazy(() => organizationLocalTableWhereUniqueInputSchema).optional(),
});

export const projectTableCreateNestedOneWithoutStakeholderTableInputSchema: z.ZodType<Prisma.projectTableCreateNestedOneWithoutStakeholderTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutStakeholderTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => projectTableCreateOrConnectWithoutStakeholderTableInputSchema).optional(),
  connect: z.lazy(() => projectTableWhereUniqueInputSchema).optional(),
});

export const NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumStakeholderTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
});

export const organizationLocalTableUpdateOneRequiredWithoutStakeholderTableNestedInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateOneRequiredWithoutStakeholderTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutStakeholderTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => organizationLocalTableCreateOrConnectWithoutStakeholderTableInputSchema).optional(),
  upsert: z.lazy(() => organizationLocalTableUpsertWithoutStakeholderTableInputSchema).optional(),
  connect: z.lazy(() => organizationLocalTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => organizationLocalTableUpdateToOneWithWhereWithoutStakeholderTableInputSchema), z.lazy(() => organizationLocalTableUpdateWithoutStakeholderTableInputSchema), z.lazy(() => organizationLocalTableUncheckedUpdateWithoutStakeholderTableInputSchema) ]).optional(),
});

export const projectTableUpdateOneWithoutStakeholderTableNestedInputSchema: z.ZodType<Prisma.projectTableUpdateOneWithoutStakeholderTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutStakeholderTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => projectTableCreateOrConnectWithoutStakeholderTableInputSchema).optional(),
  upsert: z.lazy(() => projectTableUpsertWithoutStakeholderTableInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => projectTableWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => projectTableWhereInputSchema) ]).optional(),
  connect: z.lazy(() => projectTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => projectTableUpdateToOneWithWhereWithoutStakeholderTableInputSchema), z.lazy(() => projectTableUpdateWithoutStakeholderTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutStakeholderTableInputSchema) ]).optional(),
});

export const cropTableCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.cropTableCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => cropTableCreateWithoutSourceTableInputSchema), z.lazy(() => cropTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => cropTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => cropTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => cropTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
});

export const landTableCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.landTableCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => landTableCreateWithoutSourceTableInputSchema), z.lazy(() => landTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => landTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => landTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => landTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
});

export const organizationLocalTableCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => organizationLocalTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => organizationLocalTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
});

export const plantingTableCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.plantingTableCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => plantingTableCreateWithoutSourceTableInputSchema), z.lazy(() => plantingTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => plantingTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => plantingTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => plantingTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => plantingTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
});

export const projectTableCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.projectTableCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutSourceTableInputSchema), z.lazy(() => projectTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => projectTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => projectTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => projectTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
});

export const cropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.cropTableUncheckedCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => cropTableCreateWithoutSourceTableInputSchema), z.lazy(() => cropTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => cropTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => cropTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => cropTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
});

export const landTableUncheckedCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.landTableUncheckedCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => landTableCreateWithoutSourceTableInputSchema), z.lazy(() => landTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => landTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => landTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => landTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
});

export const organizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => organizationLocalTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => organizationLocalTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
});

export const plantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.plantingTableUncheckedCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => plantingTableCreateWithoutSourceTableInputSchema), z.lazy(() => plantingTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => plantingTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => plantingTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => plantingTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => plantingTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
});

export const projectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema: z.ZodType<Prisma.projectTableUncheckedCreateNestedManyWithoutSourceTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutSourceTableInputSchema), z.lazy(() => projectTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => projectTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => projectTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => projectTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
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

export const cropTableUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.cropTableUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => cropTableCreateWithoutSourceTableInputSchema), z.lazy(() => cropTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => cropTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => cropTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => cropTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => cropTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => cropTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => cropTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => cropTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => cropTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => cropTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => cropTableScalarWhereInputSchema), z.lazy(() => cropTableScalarWhereInputSchema).array() ]).optional(),
});

export const landTableUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.landTableUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => landTableCreateWithoutSourceTableInputSchema), z.lazy(() => landTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => landTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => landTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => landTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => landTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => landTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => landTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => landTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => landTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => landTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => landTableScalarWhereInputSchema), z.lazy(() => landTableScalarWhereInputSchema).array() ]).optional(),
});

export const organizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => organizationLocalTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => organizationLocalTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => organizationLocalTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => organizationLocalTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => organizationLocalTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => organizationLocalTableScalarWhereInputSchema), z.lazy(() => organizationLocalTableScalarWhereInputSchema).array() ]).optional(),
});

export const plantingTableUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.plantingTableUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => plantingTableCreateWithoutSourceTableInputSchema), z.lazy(() => plantingTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => plantingTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => plantingTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => plantingTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => plantingTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => plantingTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => plantingTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => plantingTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => plantingTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => plantingTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => plantingTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => plantingTableScalarWhereInputSchema), z.lazy(() => plantingTableScalarWhereInputSchema).array() ]).optional(),
});

export const projectTableUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.projectTableUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutSourceTableInputSchema), z.lazy(() => projectTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => projectTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => projectTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => projectTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => projectTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => projectTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => projectTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => projectTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => projectTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => projectTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => projectTableScalarWhereInputSchema), z.lazy(() => projectTableScalarWhereInputSchema).array() ]).optional(),
});

export const cropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.cropTableUncheckedUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => cropTableCreateWithoutSourceTableInputSchema), z.lazy(() => cropTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => cropTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => cropTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => cropTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => cropTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => cropTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => cropTableWhereUniqueInputSchema), z.lazy(() => cropTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => cropTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => cropTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => cropTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => cropTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => cropTableScalarWhereInputSchema), z.lazy(() => cropTableScalarWhereInputSchema).array() ]).optional(),
});

export const landTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.landTableUncheckedUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => landTableCreateWithoutSourceTableInputSchema), z.lazy(() => landTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => landTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => landTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => landTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => landTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => landTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => landTableWhereUniqueInputSchema), z.lazy(() => landTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => landTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => landTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => landTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => landTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => landTableScalarWhereInputSchema), z.lazy(() => landTableScalarWhereInputSchema).array() ]).optional(),
});

export const organizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => organizationLocalTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => organizationLocalTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => organizationLocalTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => organizationLocalTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => organizationLocalTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => organizationLocalTableScalarWhereInputSchema), z.lazy(() => organizationLocalTableScalarWhereInputSchema).array() ]).optional(),
});

export const plantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.plantingTableUncheckedUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => plantingTableCreateWithoutSourceTableInputSchema), z.lazy(() => plantingTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => plantingTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => plantingTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => plantingTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => plantingTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => plantingTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => plantingTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => plantingTableWhereUniqueInputSchema), z.lazy(() => plantingTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => plantingTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => plantingTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => plantingTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => plantingTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => plantingTableScalarWhereInputSchema), z.lazy(() => plantingTableScalarWhereInputSchema).array() ]).optional(),
});

export const projectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateManyWithoutSourceTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutSourceTableInputSchema), z.lazy(() => projectTableCreateWithoutSourceTableInputSchema).array(), z.lazy(() => projectTableUncheckedCreateWithoutSourceTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutSourceTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => projectTableCreateOrConnectWithoutSourceTableInputSchema), z.lazy(() => projectTableCreateOrConnectWithoutSourceTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => projectTableUpsertWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => projectTableUpsertWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => projectTableUpdateWithWhereUniqueWithoutSourceTableInputSchema), z.lazy(() => projectTableUpdateWithWhereUniqueWithoutSourceTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => projectTableUpdateManyWithWhereWithoutSourceTableInputSchema), z.lazy(() => projectTableUpdateManyWithWhereWithoutSourceTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => projectTableScalarWhereInputSchema), z.lazy(() => projectTableScalarWhereInputSchema).array() ]).optional(),
});

export const organizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.organizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationMasterTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => organizationMasterTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => organizationMasterTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).optional(),
  connect: z.lazy(() => organizationMasterTableWhereUniqueInputSchema).optional(),
});

export const projectTableCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.projectTableCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => projectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => projectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => projectTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
});

export const stakeholderTableCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.stakeholderTableCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => stakeholderTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => stakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => stakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => stakeholderTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
});

export const sourceTableCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.sourceTableCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const projectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.projectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => projectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => projectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => projectTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
});

export const stakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => stakeholderTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => stakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => stakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => stakeholderTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
});

export const sourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
});

export const organizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.organizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationMasterTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => organizationMasterTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => organizationMasterTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).optional(),
  upsert: z.lazy(() => organizationMasterTableUpsertWithoutOrganizationLocalTableInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => organizationMasterTableWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => organizationMasterTableWhereInputSchema) ]).optional(),
  connect: z.lazy(() => organizationMasterTableWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => organizationMasterTableUpdateToOneWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => organizationMasterTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => organizationMasterTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]).optional(),
});

export const projectTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.projectTableUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => projectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => projectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => projectTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => projectTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => projectTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => projectTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => projectTableScalarWhereInputSchema), z.lazy(() => projectTableScalarWhereInputSchema).array() ]).optional(),
});

export const stakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.stakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => stakeholderTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => stakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => stakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => stakeholderTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => stakeholderTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => stakeholderTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => stakeholderTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => stakeholderTableScalarWhereInputSchema), z.lazy(() => stakeholderTableScalarWhereInputSchema).array() ]).optional(),
});

export const sourceTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.sourceTableUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => sourceTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => sourceTableScalarWhereInputSchema), z.lazy(() => sourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const projectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => projectTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => projectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => projectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => projectTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => projectTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => projectTableWhereUniqueInputSchema), z.lazy(() => projectTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => projectTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => projectTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => projectTableScalarWhereInputSchema), z.lazy(() => projectTableScalarWhereInputSchema).array() ]).optional(),
});

export const stakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => stakeholderTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => stakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => stakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => stakeholderTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => stakeholderTableCreateManyOrganizationLocalTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => stakeholderTableWhereUniqueInputSchema), z.lazy(() => stakeholderTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => stakeholderTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => stakeholderTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => stakeholderTableScalarWhereInputSchema), z.lazy(() => stakeholderTableScalarWhereInputSchema).array() ]).optional(),
});

export const sourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => sourceTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableCreateWithoutOrganizationLocalTableInputSchema).array(), z.lazy(() => sourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => sourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => sourceTableWhereUniqueInputSchema), z.lazy(() => sourceTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => sourceTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => sourceTableScalarWhereInputSchema), z.lazy(() => sourceTableScalarWhereInputSchema).array() ]).optional(),
});

export const organizationLocalTableCreateNestedManyWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateNestedManyWithoutOrganizationMasterTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableCreateWithoutOrganizationMasterTableInputSchema).array(), z.lazy(() => organizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => organizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => organizationLocalTableCreateManyOrganizationMasterTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
});

export const organizationLocalTableUncheckedCreateNestedManyWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedCreateNestedManyWithoutOrganizationMasterTableInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableCreateWithoutOrganizationMasterTableInputSchema).array(), z.lazy(() => organizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => organizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => organizationLocalTableCreateManyOrganizationMasterTableInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
});

export const organizationLocalTableUpdateManyWithoutOrganizationMasterTableNestedInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateManyWithoutOrganizationMasterTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableCreateWithoutOrganizationMasterTableInputSchema).array(), z.lazy(() => organizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => organizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => organizationLocalTableUpsertWithWhereUniqueWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUpsertWithWhereUniqueWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => organizationLocalTableCreateManyOrganizationMasterTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => organizationLocalTableUpdateWithWhereUniqueWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUpdateWithWhereUniqueWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => organizationLocalTableUpdateManyWithWhereWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUpdateManyWithWhereWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => organizationLocalTableScalarWhereInputSchema), z.lazy(() => organizationLocalTableScalarWhereInputSchema).array() ]).optional(),
});

export const organizationLocalTableUncheckedUpdateManyWithoutOrganizationMasterTableNestedInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedUpdateManyWithoutOrganizationMasterTableNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableCreateWithoutOrganizationMasterTableInputSchema).array(), z.lazy(() => organizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => organizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => organizationLocalTableUpsertWithWhereUniqueWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUpsertWithWhereUniqueWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  createMany: z.lazy(() => organizationLocalTableCreateManyOrganizationMasterTableInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => organizationLocalTableWhereUniqueInputSchema), z.lazy(() => organizationLocalTableWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => organizationLocalTableUpdateWithWhereUniqueWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUpdateWithWhereUniqueWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => organizationLocalTableUpdateManyWithWhereWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUpdateManyWithWhereWithoutOrganizationMasterTableInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => organizationLocalTableScalarWhereInputSchema), z.lazy(() => organizationLocalTableScalarWhereInputSchema).array() ]).optional(),
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

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
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

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
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

export const NestedDecimalNullableFilterSchema: z.ZodType<Prisma.NestedDecimalNullableFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumTreatmentTypeNullableFilterSchema: z.ZodType<Prisma.NestedEnumTreatmentTypeNullableFilter> = z.strictObject({
  equals: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  in: z.lazy(() => TreatmentTypeSchema).array().optional().nullable(),
  notIn: z.lazy(() => TreatmentTypeSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NestedEnumTreatmentTypeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDecimalNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDecimalNullableWithAggregatesFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableWithAggregatesFilterSchema) ]).optional().nullable(),
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

export const cropTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.cropTableCreateWithoutProjectTableInput> = z.strictObject({
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
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutCropTableInputSchema).optional(),
  speciesTable: z.lazy(() => speciesTableCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const cropTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.cropTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
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
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutCropTableInputSchema).optional(),
  speciesTable: z.lazy(() => speciesTableUncheckedCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const cropTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.cropTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => cropTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => cropTableCreateWithoutProjectTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const cropTableCreateManyProjectTableInputEnvelopeSchema: z.ZodType<Prisma.cropTableCreateManyProjectTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => cropTableCreateManyProjectTableInputSchema), z.lazy(() => cropTableCreateManyProjectTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const landTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.landTableCreateWithoutProjectTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  polygonTable: z.lazy(() => polygonTableCreateNestedManyWithoutLandTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const landTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.landTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  polygonTable: z.lazy(() => polygonTableUncheckedCreateNestedManyWithoutLandTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const landTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.landTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => landTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => landTableCreateWithoutProjectTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const landTableCreateManyProjectTableInputEnvelopeSchema: z.ZodType<Prisma.landTableCreateManyProjectTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => landTableCreateManyProjectTableInputSchema), z.lazy(() => landTableCreateManyProjectTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const plantingTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.plantingTableCreateWithoutProjectTableInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutPlantingTableInputSchema).optional(),
});

export const plantingTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.plantingTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutPlantingTableInputSchema).optional(),
});

export const plantingTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.plantingTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => plantingTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => plantingTableCreateWithoutProjectTableInputSchema), z.lazy(() => plantingTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const plantingTableCreateManyProjectTableInputEnvelopeSchema: z.ZodType<Prisma.plantingTableCreateManyProjectTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => plantingTableCreateManyProjectTableInputSchema), z.lazy(() => plantingTableCreateManyProjectTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const polyTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.polyTableCreateWithoutProjectTableInput> = z.strictObject({
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

export const polyTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.polyTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
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

export const polyTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.polyTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => polyTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => polyTableCreateWithoutProjectTableInputSchema), z.lazy(() => polyTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const polyTableCreateManyProjectTableInputEnvelopeSchema: z.ZodType<Prisma.polyTableCreateManyProjectTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => polyTableCreateManyProjectTableInputSchema), z.lazy(() => polyTableCreateManyProjectTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const organizationLocalTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateWithoutProjectTableInput> = z.strictObject({
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
  organizationMasterTable: z.lazy(() => organizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const organizationLocalTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
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
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const organizationLocalTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => organizationLocalTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutProjectTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const stakeholderTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.stakeholderTableCreateWithoutProjectTableInput> = z.strictObject({
  stakeholderId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedOneWithoutStakeholderTableInputSchema),
});

export const stakeholderTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
  stakeholderId: z.string(),
  organizationLocalId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const stakeholderTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.stakeholderTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => stakeholderTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => stakeholderTableCreateWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const stakeholderTableCreateManyProjectTableInputEnvelopeSchema: z.ZodType<Prisma.stakeholderTableCreateManyProjectTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => stakeholderTableCreateManyProjectTableInputSchema), z.lazy(() => stakeholderTableCreateManyProjectTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const sourceTableCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.sourceTableCreateWithoutProjectTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  landTable: z.lazy(() => landTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const sourceTableUncheckedCreateWithoutProjectTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedCreateWithoutProjectTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const sourceTableCreateOrConnectWithoutProjectTableInputSchema: z.ZodType<Prisma.sourceTableCreateOrConnectWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => sourceTableCreateWithoutProjectTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const cropTableUpsertWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.cropTableUpsertWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => cropTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => cropTableUpdateWithoutProjectTableInputSchema), z.lazy(() => cropTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => cropTableCreateWithoutProjectTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const cropTableUpdateWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.cropTableUpdateWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => cropTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => cropTableUpdateWithoutProjectTableInputSchema), z.lazy(() => cropTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const cropTableUpdateManyWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.cropTableUpdateManyWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => cropTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => cropTableUpdateManyMutationInputSchema), z.lazy(() => cropTableUncheckedUpdateManyWithoutProjectTableInputSchema) ]),
});

export const cropTableScalarWhereInputSchema: z.ZodType<Prisma.cropTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => cropTableScalarWhereInputSchema), z.lazy(() => cropTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => cropTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => cropTableScalarWhereInputSchema), z.lazy(() => cropTableScalarWhereInputSchema).array() ]).optional(),
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

export const landTableUpsertWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.landTableUpsertWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => landTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => landTableUpdateWithoutProjectTableInputSchema), z.lazy(() => landTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => landTableCreateWithoutProjectTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const landTableUpdateWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.landTableUpdateWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => landTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => landTableUpdateWithoutProjectTableInputSchema), z.lazy(() => landTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const landTableUpdateManyWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.landTableUpdateManyWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => landTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => landTableUpdateManyMutationInputSchema), z.lazy(() => landTableUncheckedUpdateManyWithoutProjectTableInputSchema) ]),
});

export const landTableScalarWhereInputSchema: z.ZodType<Prisma.landTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => landTableScalarWhereInputSchema), z.lazy(() => landTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => landTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => landTableScalarWhereInputSchema), z.lazy(() => landTableScalarWhereInputSchema).array() ]).optional(),
  landId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  hectares: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLat: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  gpsLon: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  landNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => EnumTreatmentTypeNullableFilterSchema), z.lazy(() => TreatmentTypeSchema) ]).optional().nullable(),
  editedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  preparation: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
});

export const plantingTableUpsertWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.plantingTableUpsertWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => plantingTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => plantingTableUpdateWithoutProjectTableInputSchema), z.lazy(() => plantingTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => plantingTableCreateWithoutProjectTableInputSchema), z.lazy(() => plantingTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const plantingTableUpdateWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.plantingTableUpdateWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => plantingTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => plantingTableUpdateWithoutProjectTableInputSchema), z.lazy(() => plantingTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const plantingTableUpdateManyWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.plantingTableUpdateManyWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => plantingTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => plantingTableUpdateManyMutationInputSchema), z.lazy(() => plantingTableUncheckedUpdateManyWithoutProjectTableInputSchema) ]),
});

export const plantingTableScalarWhereInputSchema: z.ZodType<Prisma.plantingTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => plantingTableScalarWhereInputSchema), z.lazy(() => plantingTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => plantingTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => plantingTableScalarWhereInputSchema), z.lazy(() => plantingTableScalarWhereInputSchema).array() ]).optional(),
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
  units: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => EnumUnitTypeNullableFilterSchema), z.lazy(() => UnitTypeSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  currency: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
});

export const polyTableUpsertWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.polyTableUpsertWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => polyTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => polyTableUpdateWithoutProjectTableInputSchema), z.lazy(() => polyTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => polyTableCreateWithoutProjectTableInputSchema), z.lazy(() => polyTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const polyTableUpdateWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.polyTableUpdateWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => polyTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => polyTableUpdateWithoutProjectTableInputSchema), z.lazy(() => polyTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const polyTableUpdateManyWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.polyTableUpdateManyWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => polyTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => polyTableUpdateManyMutationInputSchema), z.lazy(() => polyTableUncheckedUpdateManyWithoutProjectTableInputSchema) ]),
});

export const polyTableScalarWhereInputSchema: z.ZodType<Prisma.polyTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => polyTableScalarWhereInputSchema), z.lazy(() => polyTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => polyTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => polyTableScalarWhereInputSchema), z.lazy(() => polyTableScalarWhereInputSchema).array() ]).optional(),
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

export const organizationLocalTableUpsertWithoutProjectTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpsertWithoutProjectTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => organizationLocalTableUpdateWithoutProjectTableInputSchema), z.lazy(() => organizationLocalTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutProjectTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutProjectTableInputSchema) ]),
  where: z.lazy(() => organizationLocalTableWhereInputSchema).optional(),
});

export const organizationLocalTableUpdateToOneWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateToOneWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => organizationLocalTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => organizationLocalTableUpdateWithoutProjectTableInputSchema), z.lazy(() => organizationLocalTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const organizationLocalTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateWithoutProjectTableInput> = z.strictObject({
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
  organizationMasterTable: z.lazy(() => organizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const organizationLocalTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
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
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const stakeholderTableUpsertWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.stakeholderTableUpsertWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => stakeholderTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => stakeholderTableUpdateWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => stakeholderTableCreateWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const stakeholderTableUpdateWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.stakeholderTableUpdateWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => stakeholderTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => stakeholderTableUpdateWithoutProjectTableInputSchema), z.lazy(() => stakeholderTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const stakeholderTableUpdateManyWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.stakeholderTableUpdateManyWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => stakeholderTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => stakeholderTableUpdateManyMutationInputSchema), z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutProjectTableInputSchema) ]),
});

export const stakeholderTableScalarWhereInputSchema: z.ZodType<Prisma.stakeholderTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => stakeholderTableScalarWhereInputSchema), z.lazy(() => stakeholderTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => stakeholderTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => stakeholderTableScalarWhereInputSchema), z.lazy(() => stakeholderTableScalarWhereInputSchema).array() ]).optional(),
  stakeholderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  organizationLocalId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  parentTable: z.union([ z.lazy(() => EnumParentTableFilterSchema), z.lazy(() => ParentTableSchema) ]).optional(),
  projectId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => EnumStakeholderTypeNullableFilterSchema), z.lazy(() => StakeholderTypeSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const sourceTableUpsertWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.sourceTableUpsertWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => sourceTableUpdateWithoutProjectTableInputSchema), z.lazy(() => sourceTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
  create: z.union([ z.lazy(() => sourceTableCreateWithoutProjectTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutProjectTableInputSchema) ]),
});

export const sourceTableUpdateWithWhereUniqueWithoutProjectTableInputSchema: z.ZodType<Prisma.sourceTableUpdateWithWhereUniqueWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => sourceTableUpdateWithoutProjectTableInputSchema), z.lazy(() => sourceTableUncheckedUpdateWithoutProjectTableInputSchema) ]),
});

export const sourceTableUpdateManyWithWhereWithoutProjectTableInputSchema: z.ZodType<Prisma.sourceTableUpdateManyWithWhereWithoutProjectTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => sourceTableUpdateManyMutationInputSchema), z.lazy(() => sourceTableUncheckedUpdateManyWithoutProjectTableInputSchema) ]),
});

export const sourceTableScalarWhereInputSchema: z.ZodType<Prisma.sourceTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => sourceTableScalarWhereInputSchema), z.lazy(() => sourceTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => sourceTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => sourceTableScalarWhereInputSchema), z.lazy(() => sourceTableScalarWhereInputSchema).array() ]).optional(),
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

export const projectTableCreateWithoutLandTableInputSchema: z.ZodType<Prisma.projectTableCreateWithoutLandTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableUncheckedCreateWithoutLandTableInputSchema: z.ZodType<Prisma.projectTableUncheckedCreateWithoutLandTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableCreateOrConnectWithoutLandTableInputSchema: z.ZodType<Prisma.projectTableCreateOrConnectWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => projectTableCreateWithoutLandTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutLandTableInputSchema) ]),
});

export const polygonTableCreateWithoutLandTableInputSchema: z.ZodType<Prisma.polygonTableCreateWithoutLandTableInput> = z.strictObject({
  polygonId: z.string(),
  landName: z.string().optional().nullable(),
  geometry: z.string().optional().nullable(),
  coordinates: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  polygonNotes: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
});

export const polygonTableUncheckedCreateWithoutLandTableInputSchema: z.ZodType<Prisma.polygonTableUncheckedCreateWithoutLandTableInput> = z.strictObject({
  polygonId: z.string(),
  landName: z.string().optional().nullable(),
  geometry: z.string().optional().nullable(),
  coordinates: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  polygonNotes: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
});

export const polygonTableCreateOrConnectWithoutLandTableInputSchema: z.ZodType<Prisma.polygonTableCreateOrConnectWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => polygonTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => polygonTableCreateWithoutLandTableInputSchema), z.lazy(() => polygonTableUncheckedCreateWithoutLandTableInputSchema) ]),
});

export const polygonTableCreateManyLandTableInputEnvelopeSchema: z.ZodType<Prisma.polygonTableCreateManyLandTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => polygonTableCreateManyLandTableInputSchema), z.lazy(() => polygonTableCreateManyLandTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const sourceTableCreateWithoutLandTableInputSchema: z.ZodType<Prisma.sourceTableCreateWithoutLandTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const sourceTableUncheckedCreateWithoutLandTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedCreateWithoutLandTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const sourceTableCreateOrConnectWithoutLandTableInputSchema: z.ZodType<Prisma.sourceTableCreateOrConnectWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => sourceTableCreateWithoutLandTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutLandTableInputSchema) ]),
});

export const projectTableUpsertWithoutLandTableInputSchema: z.ZodType<Prisma.projectTableUpsertWithoutLandTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => projectTableUpdateWithoutLandTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutLandTableInputSchema) ]),
  create: z.union([ z.lazy(() => projectTableCreateWithoutLandTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutLandTableInputSchema) ]),
  where: z.lazy(() => projectTableWhereInputSchema).optional(),
});

export const projectTableUpdateToOneWithWhereWithoutLandTableInputSchema: z.ZodType<Prisma.projectTableUpdateToOneWithWhereWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => projectTableUpdateWithoutLandTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutLandTableInputSchema) ]),
});

export const projectTableUpdateWithoutLandTableInputSchema: z.ZodType<Prisma.projectTableUpdateWithoutLandTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const projectTableUncheckedUpdateWithoutLandTableInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateWithoutLandTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const polygonTableUpsertWithWhereUniqueWithoutLandTableInputSchema: z.ZodType<Prisma.polygonTableUpsertWithWhereUniqueWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => polygonTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => polygonTableUpdateWithoutLandTableInputSchema), z.lazy(() => polygonTableUncheckedUpdateWithoutLandTableInputSchema) ]),
  create: z.union([ z.lazy(() => polygonTableCreateWithoutLandTableInputSchema), z.lazy(() => polygonTableUncheckedCreateWithoutLandTableInputSchema) ]),
});

export const polygonTableUpdateWithWhereUniqueWithoutLandTableInputSchema: z.ZodType<Prisma.polygonTableUpdateWithWhereUniqueWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => polygonTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => polygonTableUpdateWithoutLandTableInputSchema), z.lazy(() => polygonTableUncheckedUpdateWithoutLandTableInputSchema) ]),
});

export const polygonTableUpdateManyWithWhereWithoutLandTableInputSchema: z.ZodType<Prisma.polygonTableUpdateManyWithWhereWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => polygonTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => polygonTableUpdateManyMutationInputSchema), z.lazy(() => polygonTableUncheckedUpdateManyWithoutLandTableInputSchema) ]),
});

export const polygonTableScalarWhereInputSchema: z.ZodType<Prisma.polygonTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => polygonTableScalarWhereInputSchema), z.lazy(() => polygonTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => polygonTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => polygonTableScalarWhereInputSchema), z.lazy(() => polygonTableScalarWhereInputSchema).array() ]).optional(),
  polygonId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  landName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  geometry: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  coordinates: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  polygonNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const sourceTableUpsertWithWhereUniqueWithoutLandTableInputSchema: z.ZodType<Prisma.sourceTableUpsertWithWhereUniqueWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => sourceTableUpdateWithoutLandTableInputSchema), z.lazy(() => sourceTableUncheckedUpdateWithoutLandTableInputSchema) ]),
  create: z.union([ z.lazy(() => sourceTableCreateWithoutLandTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutLandTableInputSchema) ]),
});

export const sourceTableUpdateWithWhereUniqueWithoutLandTableInputSchema: z.ZodType<Prisma.sourceTableUpdateWithWhereUniqueWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => sourceTableUpdateWithoutLandTableInputSchema), z.lazy(() => sourceTableUncheckedUpdateWithoutLandTableInputSchema) ]),
});

export const sourceTableUpdateManyWithWhereWithoutLandTableInputSchema: z.ZodType<Prisma.sourceTableUpdateManyWithWhereWithoutLandTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => sourceTableUpdateManyMutationInputSchema), z.lazy(() => sourceTableUncheckedUpdateManyWithoutLandTableInputSchema) ]),
});

export const projectTableCreateWithoutCropTableInputSchema: z.ZodType<Prisma.projectTableCreateWithoutCropTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  landTable: z.lazy(() => landTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableUncheckedCreateWithoutCropTableInputSchema: z.ZodType<Prisma.projectTableUncheckedCreateWithoutCropTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  landTable: z.lazy(() => landTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableCreateOrConnectWithoutCropTableInputSchema: z.ZodType<Prisma.projectTableCreateOrConnectWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => projectTableCreateWithoutCropTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutCropTableInputSchema) ]),
});

export const sourceTableCreateWithoutCropTableInputSchema: z.ZodType<Prisma.sourceTableCreateWithoutCropTableInput> = z.strictObject({
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
  landTable: z.lazy(() => landTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const sourceTableUncheckedCreateWithoutCropTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedCreateWithoutCropTableInput> = z.strictObject({
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
  landTable: z.lazy(() => landTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const sourceTableCreateOrConnectWithoutCropTableInputSchema: z.ZodType<Prisma.sourceTableCreateOrConnectWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => sourceTableCreateWithoutCropTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutCropTableInputSchema) ]),
});

export const speciesTableCreateWithoutCropTableInputSchema: z.ZodType<Prisma.speciesTableCreateWithoutCropTableInput> = z.strictObject({
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

export const speciesTableUncheckedCreateWithoutCropTableInputSchema: z.ZodType<Prisma.speciesTableUncheckedCreateWithoutCropTableInput> = z.strictObject({
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

export const speciesTableCreateOrConnectWithoutCropTableInputSchema: z.ZodType<Prisma.speciesTableCreateOrConnectWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => speciesTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => speciesTableCreateWithoutCropTableInputSchema), z.lazy(() => speciesTableUncheckedCreateWithoutCropTableInputSchema) ]),
});

export const projectTableUpsertWithoutCropTableInputSchema: z.ZodType<Prisma.projectTableUpsertWithoutCropTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => projectTableUpdateWithoutCropTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutCropTableInputSchema) ]),
  create: z.union([ z.lazy(() => projectTableCreateWithoutCropTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutCropTableInputSchema) ]),
  where: z.lazy(() => projectTableWhereInputSchema).optional(),
});

export const projectTableUpdateToOneWithWhereWithoutCropTableInputSchema: z.ZodType<Prisma.projectTableUpdateToOneWithWhereWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => projectTableUpdateWithoutCropTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutCropTableInputSchema) ]),
});

export const projectTableUpdateWithoutCropTableInputSchema: z.ZodType<Prisma.projectTableUpdateWithoutCropTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landTable: z.lazy(() => landTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const projectTableUncheckedUpdateWithoutCropTableInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateWithoutCropTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landTable: z.lazy(() => landTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const sourceTableUpsertWithWhereUniqueWithoutCropTableInputSchema: z.ZodType<Prisma.sourceTableUpsertWithWhereUniqueWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => sourceTableUpdateWithoutCropTableInputSchema), z.lazy(() => sourceTableUncheckedUpdateWithoutCropTableInputSchema) ]),
  create: z.union([ z.lazy(() => sourceTableCreateWithoutCropTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutCropTableInputSchema) ]),
});

export const sourceTableUpdateWithWhereUniqueWithoutCropTableInputSchema: z.ZodType<Prisma.sourceTableUpdateWithWhereUniqueWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => sourceTableUpdateWithoutCropTableInputSchema), z.lazy(() => sourceTableUncheckedUpdateWithoutCropTableInputSchema) ]),
});

export const sourceTableUpdateManyWithWhereWithoutCropTableInputSchema: z.ZodType<Prisma.sourceTableUpdateManyWithWhereWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => sourceTableUpdateManyMutationInputSchema), z.lazy(() => sourceTableUncheckedUpdateManyWithoutCropTableInputSchema) ]),
});

export const speciesTableUpsertWithWhereUniqueWithoutCropTableInputSchema: z.ZodType<Prisma.speciesTableUpsertWithWhereUniqueWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => speciesTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => speciesTableUpdateWithoutCropTableInputSchema), z.lazy(() => speciesTableUncheckedUpdateWithoutCropTableInputSchema) ]),
  create: z.union([ z.lazy(() => speciesTableCreateWithoutCropTableInputSchema), z.lazy(() => speciesTableUncheckedCreateWithoutCropTableInputSchema) ]),
});

export const speciesTableUpdateWithWhereUniqueWithoutCropTableInputSchema: z.ZodType<Prisma.speciesTableUpdateWithWhereUniqueWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => speciesTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => speciesTableUpdateWithoutCropTableInputSchema), z.lazy(() => speciesTableUncheckedUpdateWithoutCropTableInputSchema) ]),
});

export const speciesTableUpdateManyWithWhereWithoutCropTableInputSchema: z.ZodType<Prisma.speciesTableUpdateManyWithWhereWithoutCropTableInput> = z.strictObject({
  where: z.lazy(() => speciesTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => speciesTableUpdateManyMutationInputSchema), z.lazy(() => speciesTableUncheckedUpdateManyWithoutCropTableInputSchema) ]),
});

export const speciesTableScalarWhereInputSchema: z.ZodType<Prisma.speciesTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => speciesTableScalarWhereInputSchema), z.lazy(() => speciesTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => speciesTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => speciesTableScalarWhereInputSchema), z.lazy(() => speciesTableScalarWhereInputSchema).array() ]).optional(),
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

export const projectTableCreateWithoutPlantingTableInputSchema: z.ZodType<Prisma.projectTableCreateWithoutPlantingTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  landTable: z.lazy(() => landTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableUncheckedCreateWithoutPlantingTableInputSchema: z.ZodType<Prisma.projectTableUncheckedCreateWithoutPlantingTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableCreateOrConnectWithoutPlantingTableInputSchema: z.ZodType<Prisma.projectTableCreateOrConnectWithoutPlantingTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => projectTableCreateWithoutPlantingTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutPlantingTableInputSchema) ]),
});

export const sourceTableCreateWithoutPlantingTableInputSchema: z.ZodType<Prisma.sourceTableCreateWithoutPlantingTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  landTable: z.lazy(() => landTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const sourceTableUncheckedCreateWithoutPlantingTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedCreateWithoutPlantingTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const sourceTableCreateOrConnectWithoutPlantingTableInputSchema: z.ZodType<Prisma.sourceTableCreateOrConnectWithoutPlantingTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => sourceTableCreateWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutPlantingTableInputSchema) ]),
});

export const projectTableUpsertWithoutPlantingTableInputSchema: z.ZodType<Prisma.projectTableUpsertWithoutPlantingTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => projectTableUpdateWithoutPlantingTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutPlantingTableInputSchema) ]),
  create: z.union([ z.lazy(() => projectTableCreateWithoutPlantingTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutPlantingTableInputSchema) ]),
  where: z.lazy(() => projectTableWhereInputSchema).optional(),
});

export const projectTableUpdateToOneWithWhereWithoutPlantingTableInputSchema: z.ZodType<Prisma.projectTableUpdateToOneWithWhereWithoutPlantingTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => projectTableUpdateWithoutPlantingTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutPlantingTableInputSchema) ]),
});

export const projectTableUpdateWithoutPlantingTableInputSchema: z.ZodType<Prisma.projectTableUpdateWithoutPlantingTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const projectTableUncheckedUpdateWithoutPlantingTableInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateWithoutPlantingTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const sourceTableUpsertWithWhereUniqueWithoutPlantingTableInputSchema: z.ZodType<Prisma.sourceTableUpsertWithWhereUniqueWithoutPlantingTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => sourceTableUpdateWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUncheckedUpdateWithoutPlantingTableInputSchema) ]),
  create: z.union([ z.lazy(() => sourceTableCreateWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutPlantingTableInputSchema) ]),
});

export const sourceTableUpdateWithWhereUniqueWithoutPlantingTableInputSchema: z.ZodType<Prisma.sourceTableUpdateWithWhereUniqueWithoutPlantingTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => sourceTableUpdateWithoutPlantingTableInputSchema), z.lazy(() => sourceTableUncheckedUpdateWithoutPlantingTableInputSchema) ]),
});

export const sourceTableUpdateManyWithWhereWithoutPlantingTableInputSchema: z.ZodType<Prisma.sourceTableUpdateManyWithWhereWithoutPlantingTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => sourceTableUpdateManyMutationInputSchema), z.lazy(() => sourceTableUncheckedUpdateManyWithoutPlantingTableInputSchema) ]),
});

export const cropTableCreateWithoutSpeciesTableInputSchema: z.ZodType<Prisma.cropTableCreateWithoutSpeciesTableInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableCreateNestedOneWithoutCropTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const cropTableUncheckedCreateWithoutSpeciesTableInputSchema: z.ZodType<Prisma.cropTableUncheckedCreateWithoutSpeciesTableInput> = z.strictObject({
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
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const cropTableCreateOrConnectWithoutSpeciesTableInputSchema: z.ZodType<Prisma.cropTableCreateOrConnectWithoutSpeciesTableInput> = z.strictObject({
  where: z.lazy(() => cropTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => cropTableCreateWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutSpeciesTableInputSchema) ]),
});

export const cropTableUpsertWithWhereUniqueWithoutSpeciesTableInputSchema: z.ZodType<Prisma.cropTableUpsertWithWhereUniqueWithoutSpeciesTableInput> = z.strictObject({
  where: z.lazy(() => cropTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => cropTableUpdateWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUncheckedUpdateWithoutSpeciesTableInputSchema) ]),
  create: z.union([ z.lazy(() => cropTableCreateWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutSpeciesTableInputSchema) ]),
});

export const cropTableUpdateWithWhereUniqueWithoutSpeciesTableInputSchema: z.ZodType<Prisma.cropTableUpdateWithWhereUniqueWithoutSpeciesTableInput> = z.strictObject({
  where: z.lazy(() => cropTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => cropTableUpdateWithoutSpeciesTableInputSchema), z.lazy(() => cropTableUncheckedUpdateWithoutSpeciesTableInputSchema) ]),
});

export const cropTableUpdateManyWithWhereWithoutSpeciesTableInputSchema: z.ZodType<Prisma.cropTableUpdateManyWithWhereWithoutSpeciesTableInput> = z.strictObject({
  where: z.lazy(() => cropTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => cropTableUpdateManyMutationInputSchema), z.lazy(() => cropTableUncheckedUpdateManyWithoutSpeciesTableInputSchema) ]),
});

export const landTableCreateWithoutPolygonTableInputSchema: z.ZodType<Prisma.landTableCreateWithoutPolygonTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  projectTable: z.lazy(() => projectTableCreateNestedOneWithoutLandTableInputSchema),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const landTableUncheckedCreateWithoutPolygonTableInputSchema: z.ZodType<Prisma.landTableUncheckedCreateWithoutPolygonTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  projectId: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const landTableCreateOrConnectWithoutPolygonTableInputSchema: z.ZodType<Prisma.landTableCreateOrConnectWithoutPolygonTableInput> = z.strictObject({
  where: z.lazy(() => landTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => landTableCreateWithoutPolygonTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutPolygonTableInputSchema) ]),
});

export const landTableUpsertWithoutPolygonTableInputSchema: z.ZodType<Prisma.landTableUpsertWithoutPolygonTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => landTableUpdateWithoutPolygonTableInputSchema), z.lazy(() => landTableUncheckedUpdateWithoutPolygonTableInputSchema) ]),
  create: z.union([ z.lazy(() => landTableCreateWithoutPolygonTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutPolygonTableInputSchema) ]),
  where: z.lazy(() => landTableWhereInputSchema).optional(),
});

export const landTableUpdateToOneWithWhereWithoutPolygonTableInputSchema: z.ZodType<Prisma.landTableUpdateToOneWithWhereWithoutPolygonTableInput> = z.strictObject({
  where: z.lazy(() => landTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => landTableUpdateWithoutPolygonTableInputSchema), z.lazy(() => landTableUncheckedUpdateWithoutPolygonTableInputSchema) ]),
});

export const landTableUpdateWithoutPolygonTableInputSchema: z.ZodType<Prisma.landTableUpdateWithoutPolygonTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectTable: z.lazy(() => projectTableUpdateOneRequiredWithoutLandTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const landTableUncheckedUpdateWithoutPolygonTableInputSchema: z.ZodType<Prisma.landTableUncheckedUpdateWithoutPolygonTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const projectTableCreateWithoutPolyTableInputSchema: z.ZodType<Prisma.projectTableCreateWithoutPolyTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  landTable: z.lazy(() => landTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableUncheckedCreateWithoutPolyTableInputSchema: z.ZodType<Prisma.projectTableUncheckedCreateWithoutPolyTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableCreateOrConnectWithoutPolyTableInputSchema: z.ZodType<Prisma.projectTableCreateOrConnectWithoutPolyTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => projectTableCreateWithoutPolyTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutPolyTableInputSchema) ]),
});

export const projectTableUpsertWithoutPolyTableInputSchema: z.ZodType<Prisma.projectTableUpsertWithoutPolyTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => projectTableUpdateWithoutPolyTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutPolyTableInputSchema) ]),
  create: z.union([ z.lazy(() => projectTableCreateWithoutPolyTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutPolyTableInputSchema) ]),
  where: z.lazy(() => projectTableWhereInputSchema).optional(),
});

export const projectTableUpdateToOneWithWhereWithoutPolyTableInputSchema: z.ZodType<Prisma.projectTableUpdateToOneWithWhereWithoutPolyTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => projectTableUpdateWithoutPolyTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutPolyTableInputSchema) ]),
});

export const projectTableUpdateWithoutPolyTableInputSchema: z.ZodType<Prisma.projectTableUpdateWithoutPolyTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const projectTableUncheckedUpdateWithoutPolyTableInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateWithoutPolyTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const organizationLocalTableCreateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateWithoutStakeholderTableInput> = z.strictObject({
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
  organizationMasterTable: z.lazy(() => organizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const organizationLocalTableUncheckedCreateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedCreateWithoutStakeholderTableInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const organizationLocalTableCreateOrConnectWithoutStakeholderTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateOrConnectWithoutStakeholderTableInput> = z.strictObject({
  where: z.lazy(() => organizationLocalTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutStakeholderTableInputSchema) ]),
});

export const projectTableCreateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.projectTableCreateWithoutStakeholderTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  landTable: z.lazy(() => landTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableUncheckedCreateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.projectTableUncheckedCreateWithoutStakeholderTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableCreateOrConnectWithoutStakeholderTableInputSchema: z.ZodType<Prisma.projectTableCreateOrConnectWithoutStakeholderTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => projectTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutStakeholderTableInputSchema) ]),
});

export const organizationLocalTableUpsertWithoutStakeholderTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpsertWithoutStakeholderTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => organizationLocalTableUpdateWithoutStakeholderTableInputSchema), z.lazy(() => organizationLocalTableUncheckedUpdateWithoutStakeholderTableInputSchema) ]),
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutStakeholderTableInputSchema) ]),
  where: z.lazy(() => organizationLocalTableWhereInputSchema).optional(),
});

export const organizationLocalTableUpdateToOneWithWhereWithoutStakeholderTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateToOneWithWhereWithoutStakeholderTableInput> = z.strictObject({
  where: z.lazy(() => organizationLocalTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => organizationLocalTableUpdateWithoutStakeholderTableInputSchema), z.lazy(() => organizationLocalTableUncheckedUpdateWithoutStakeholderTableInputSchema) ]),
});

export const organizationLocalTableUpdateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateWithoutStakeholderTableInput> = z.strictObject({
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
  organizationMasterTable: z.lazy(() => organizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const organizationLocalTableUncheckedUpdateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedUpdateWithoutStakeholderTableInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const projectTableUpsertWithoutStakeholderTableInputSchema: z.ZodType<Prisma.projectTableUpsertWithoutStakeholderTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => projectTableUpdateWithoutStakeholderTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutStakeholderTableInputSchema) ]),
  create: z.union([ z.lazy(() => projectTableCreateWithoutStakeholderTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutStakeholderTableInputSchema) ]),
  where: z.lazy(() => projectTableWhereInputSchema).optional(),
});

export const projectTableUpdateToOneWithWhereWithoutStakeholderTableInputSchema: z.ZodType<Prisma.projectTableUpdateToOneWithWhereWithoutStakeholderTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => projectTableUpdateWithoutStakeholderTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutStakeholderTableInputSchema) ]),
});

export const projectTableUpdateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.projectTableUpdateWithoutStakeholderTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const projectTableUncheckedUpdateWithoutStakeholderTableInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateWithoutStakeholderTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const cropTableCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.cropTableCreateWithoutSourceTableInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableCreateNestedOneWithoutCropTableInputSchema).optional(),
  speciesTable: z.lazy(() => speciesTableCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const cropTableUncheckedCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.cropTableUncheckedCreateWithoutSourceTableInput> = z.strictObject({
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
  speciesTable: z.lazy(() => speciesTableUncheckedCreateNestedManyWithoutCropTableInputSchema).optional(),
});

export const cropTableCreateOrConnectWithoutSourceTableInputSchema: z.ZodType<Prisma.cropTableCreateOrConnectWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => cropTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => cropTableCreateWithoutSourceTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const landTableCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.landTableCreateWithoutSourceTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  projectTable: z.lazy(() => projectTableCreateNestedOneWithoutLandTableInputSchema),
  polygonTable: z.lazy(() => polygonTableCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const landTableUncheckedCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.landTableUncheckedCreateWithoutSourceTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  projectId: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
  polygonTable: z.lazy(() => polygonTableUncheckedCreateNestedManyWithoutLandTableInputSchema).optional(),
});

export const landTableCreateOrConnectWithoutSourceTableInputSchema: z.ZodType<Prisma.landTableCreateOrConnectWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => landTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => landTableCreateWithoutSourceTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const organizationLocalTableCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateWithoutSourceTableInput> = z.strictObject({
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
  organizationMasterTable: z.lazy(() => organizationMasterTableCreateNestedOneWithoutOrganizationLocalTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const organizationLocalTableUncheckedCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedCreateWithoutSourceTableInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const organizationLocalTableCreateOrConnectWithoutSourceTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateOrConnectWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => organizationLocalTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const plantingTableCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.plantingTableCreateWithoutSourceTableInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
  projectTable: z.lazy(() => projectTableCreateNestedOneWithoutPlantingTableInputSchema),
});

export const plantingTableUncheckedCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.plantingTableUncheckedCreateWithoutSourceTableInput> = z.strictObject({
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
  units: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
});

export const plantingTableCreateOrConnectWithoutSourceTableInputSchema: z.ZodType<Prisma.plantingTableCreateOrConnectWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => plantingTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => plantingTableCreateWithoutSourceTableInputSchema), z.lazy(() => plantingTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const projectTableCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.projectTableCreateWithoutSourceTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  landTable: z.lazy(() => landTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableCreateNestedOneWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableUncheckedCreateWithoutSourceTableInputSchema: z.ZodType<Prisma.projectTableUncheckedCreateWithoutSourceTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableCreateOrConnectWithoutSourceTableInputSchema: z.ZodType<Prisma.projectTableCreateOrConnectWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => projectTableCreateWithoutSourceTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const cropTableUpsertWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.cropTableUpsertWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => cropTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => cropTableUpdateWithoutSourceTableInputSchema), z.lazy(() => cropTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
  create: z.union([ z.lazy(() => cropTableCreateWithoutSourceTableInputSchema), z.lazy(() => cropTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const cropTableUpdateWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.cropTableUpdateWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => cropTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => cropTableUpdateWithoutSourceTableInputSchema), z.lazy(() => cropTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
});

export const cropTableUpdateManyWithWhereWithoutSourceTableInputSchema: z.ZodType<Prisma.cropTableUpdateManyWithWhereWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => cropTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => cropTableUpdateManyMutationInputSchema), z.lazy(() => cropTableUncheckedUpdateManyWithoutSourceTableInputSchema) ]),
});

export const landTableUpsertWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.landTableUpsertWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => landTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => landTableUpdateWithoutSourceTableInputSchema), z.lazy(() => landTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
  create: z.union([ z.lazy(() => landTableCreateWithoutSourceTableInputSchema), z.lazy(() => landTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const landTableUpdateWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.landTableUpdateWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => landTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => landTableUpdateWithoutSourceTableInputSchema), z.lazy(() => landTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
});

export const landTableUpdateManyWithWhereWithoutSourceTableInputSchema: z.ZodType<Prisma.landTableUpdateManyWithWhereWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => landTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => landTableUpdateManyMutationInputSchema), z.lazy(() => landTableUncheckedUpdateManyWithoutSourceTableInputSchema) ]),
});

export const organizationLocalTableUpsertWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpsertWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => organizationLocalTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => organizationLocalTableUpdateWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const organizationLocalTableUpdateWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => organizationLocalTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => organizationLocalTableUpdateWithoutSourceTableInputSchema), z.lazy(() => organizationLocalTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
});

export const organizationLocalTableUpdateManyWithWhereWithoutSourceTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateManyWithWhereWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => organizationLocalTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => organizationLocalTableUpdateManyMutationInputSchema), z.lazy(() => organizationLocalTableUncheckedUpdateManyWithoutSourceTableInputSchema) ]),
});

export const organizationLocalTableScalarWhereInputSchema: z.ZodType<Prisma.organizationLocalTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => organizationLocalTableScalarWhereInputSchema), z.lazy(() => organizationLocalTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => organizationLocalTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => organizationLocalTableScalarWhereInputSchema), z.lazy(() => organizationLocalTableScalarWhereInputSchema).array() ]).optional(),
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

export const plantingTableUpsertWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.plantingTableUpsertWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => plantingTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => plantingTableUpdateWithoutSourceTableInputSchema), z.lazy(() => plantingTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
  create: z.union([ z.lazy(() => plantingTableCreateWithoutSourceTableInputSchema), z.lazy(() => plantingTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const plantingTableUpdateWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.plantingTableUpdateWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => plantingTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => plantingTableUpdateWithoutSourceTableInputSchema), z.lazy(() => plantingTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
});

export const plantingTableUpdateManyWithWhereWithoutSourceTableInputSchema: z.ZodType<Prisma.plantingTableUpdateManyWithWhereWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => plantingTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => plantingTableUpdateManyMutationInputSchema), z.lazy(() => plantingTableUncheckedUpdateManyWithoutSourceTableInputSchema) ]),
});

export const projectTableUpsertWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.projectTableUpsertWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => projectTableUpdateWithoutSourceTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
  create: z.union([ z.lazy(() => projectTableCreateWithoutSourceTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutSourceTableInputSchema) ]),
});

export const projectTableUpdateWithWhereUniqueWithoutSourceTableInputSchema: z.ZodType<Prisma.projectTableUpdateWithWhereUniqueWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => projectTableUpdateWithoutSourceTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutSourceTableInputSchema) ]),
});

export const projectTableUpdateManyWithWhereWithoutSourceTableInputSchema: z.ZodType<Prisma.projectTableUpdateManyWithWhereWithoutSourceTableInput> = z.strictObject({
  where: z.lazy(() => projectTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => projectTableUpdateManyMutationInputSchema), z.lazy(() => projectTableUncheckedUpdateManyWithoutSourceTableInputSchema) ]),
});

export const projectTableScalarWhereInputSchema: z.ZodType<Prisma.projectTableScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => projectTableScalarWhereInputSchema), z.lazy(() => projectTableScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => projectTableScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => projectTableScalarWhereInputSchema), z.lazy(() => projectTableScalarWhereInputSchema).array() ]).optional(),
  projectId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  projectName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  platformId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  platform: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  lastEditedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deleted: z.union([ z.lazy(() => BoolNullableFilterSchema), z.boolean() ]).optional().nullable(),
  isPublic: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => EnumCarbonRegistryTypeNullableFilterSchema), z.lazy(() => CarbonRegistryTypeSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => EnumCarbonRegistryNullableFilterSchema), z.lazy(() => CarbonRegistrySchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  projectDateEnd: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  projectDateStart: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  registryId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
});

export const organizationMasterTableCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.organizationMasterTableCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  organizationMasterId: z.string(),
  organizationMasterName: z.string(),
  officialWebsite: z.string().optional().nullable(),
  officialAddress: z.string().optional().nullable(),
  officialEmail: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
});

export const organizationMasterTableUncheckedCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.organizationMasterTableUncheckedCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  organizationMasterId: z.string(),
  organizationMasterName: z.string(),
  officialWebsite: z.string().optional().nullable(),
  officialAddress: z.string().optional().nullable(),
  officialEmail: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  editedBy: z.string().optional().nullable(),
});

export const organizationMasterTableCreateOrConnectWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.organizationMasterTableCreateOrConnectWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => organizationMasterTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => organizationMasterTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => organizationMasterTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const projectTableCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.projectTableCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  landTable: z.lazy(() => landTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.projectTableUncheckedCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutProjectTableInputSchema).optional(),
});

export const projectTableCreateOrConnectWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.projectTableCreateOrConnectWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => projectTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const projectTableCreateManyOrganizationLocalTableInputEnvelopeSchema: z.ZodType<Prisma.projectTableCreateManyOrganizationLocalTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => projectTableCreateManyOrganizationLocalTableInputSchema), z.lazy(() => projectTableCreateManyOrganizationLocalTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const stakeholderTableCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.stakeholderTableCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  stakeholderId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  projectTable: z.lazy(() => projectTableCreateNestedOneWithoutStakeholderTableInputSchema).optional(),
});

export const stakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedCreateWithoutOrganizationLocalTableInput> = z.strictObject({
  stakeholderId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  projectId: z.string().optional().nullable(),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const stakeholderTableCreateOrConnectWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.stakeholderTableCreateOrConnectWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => stakeholderTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => stakeholderTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const stakeholderTableCreateManyOrganizationLocalTableInputEnvelopeSchema: z.ZodType<Prisma.stakeholderTableCreateManyOrganizationLocalTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => stakeholderTableCreateManyOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableCreateManyOrganizationLocalTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const sourceTableCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.sourceTableCreateWithoutOrganizationLocalTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  landTable: z.lazy(() => landTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const sourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedCreateWithoutOrganizationLocalTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUncheckedCreateNestedManyWithoutSourceTableInputSchema).optional(),
});

export const sourceTableCreateOrConnectWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.sourceTableCreateOrConnectWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => sourceTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const organizationMasterTableUpsertWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.organizationMasterTableUpsertWithoutOrganizationLocalTableInput> = z.strictObject({
  update: z.union([ z.lazy(() => organizationMasterTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => organizationMasterTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
  create: z.union([ z.lazy(() => organizationMasterTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => organizationMasterTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
  where: z.lazy(() => organizationMasterTableWhereInputSchema).optional(),
});

export const organizationMasterTableUpdateToOneWithWhereWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.organizationMasterTableUpdateToOneWithWhereWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => organizationMasterTableWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => organizationMasterTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => organizationMasterTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
});

export const organizationMasterTableUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.organizationMasterTableUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  organizationMasterId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  officialWebsite: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  officialAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  officialEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const organizationMasterTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.organizationMasterTableUncheckedUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  organizationMasterId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationMasterName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  officialWebsite: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  officialAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  officialEmail: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const projectTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.projectTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => projectTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
  create: z.union([ z.lazy(() => projectTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const projectTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.projectTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => projectTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => projectTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => projectTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
});

export const projectTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.projectTableUpdateManyWithWhereWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => projectTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => projectTableUpdateManyMutationInputSchema), z.lazy(() => projectTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema) ]),
});

export const stakeholderTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.stakeholderTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => stakeholderTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => stakeholderTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
  create: z.union([ z.lazy(() => stakeholderTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const stakeholderTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.stakeholderTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => stakeholderTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => stakeholderTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => stakeholderTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
});

export const stakeholderTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.stakeholderTableUpdateManyWithWhereWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => stakeholderTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => stakeholderTableUpdateManyMutationInputSchema), z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema) ]),
});

export const sourceTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.sourceTableUpsertWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => sourceTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
  create: z.union([ z.lazy(() => sourceTableCreateWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUncheckedCreateWithoutOrganizationLocalTableInputSchema) ]),
});

export const sourceTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.sourceTableUpdateWithWhereUniqueWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => sourceTableUpdateWithoutOrganizationLocalTableInputSchema), z.lazy(() => sourceTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema) ]),
});

export const sourceTableUpdateManyWithWhereWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.sourceTableUpdateManyWithWhereWithoutOrganizationLocalTableInput> = z.strictObject({
  where: z.lazy(() => sourceTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => sourceTableUpdateManyMutationInputSchema), z.lazy(() => sourceTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema) ]),
});

export const organizationLocalTableCreateWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateWithoutOrganizationMasterTableInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const organizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedCreateNestedManyWithoutOrganizationLocalTableInputSchema).optional(),
});

export const organizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateOrConnectWithoutOrganizationMasterTableInput> = z.strictObject({
  where: z.lazy(() => organizationLocalTableWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema) ]),
});

export const organizationLocalTableCreateManyOrganizationMasterTableInputEnvelopeSchema: z.ZodType<Prisma.organizationLocalTableCreateManyOrganizationMasterTableInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => organizationLocalTableCreateManyOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableCreateManyOrganizationMasterTableInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const organizationLocalTableUpsertWithWhereUniqueWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpsertWithWhereUniqueWithoutOrganizationMasterTableInput> = z.strictObject({
  where: z.lazy(() => organizationLocalTableWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => organizationLocalTableUpdateWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUncheckedUpdateWithoutOrganizationMasterTableInputSchema) ]),
  create: z.union([ z.lazy(() => organizationLocalTableCreateWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUncheckedCreateWithoutOrganizationMasterTableInputSchema) ]),
});

export const organizationLocalTableUpdateWithWhereUniqueWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateWithWhereUniqueWithoutOrganizationMasterTableInput> = z.strictObject({
  where: z.lazy(() => organizationLocalTableWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => organizationLocalTableUpdateWithoutOrganizationMasterTableInputSchema), z.lazy(() => organizationLocalTableUncheckedUpdateWithoutOrganizationMasterTableInputSchema) ]),
});

export const organizationLocalTableUpdateManyWithWhereWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateManyWithWhereWithoutOrganizationMasterTableInput> = z.strictObject({
  where: z.lazy(() => organizationLocalTableScalarWhereInputSchema),
  data: z.union([ z.lazy(() => organizationLocalTableUpdateManyMutationInputSchema), z.lazy(() => organizationLocalTableUncheckedUpdateManyWithoutOrganizationMasterTableInputSchema) ]),
});

export const cropTableCreateManyProjectTableInputSchema: z.ZodType<Prisma.cropTableCreateManyProjectTableInput> = z.strictObject({
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

export const landTableCreateManyProjectTableInputSchema: z.ZodType<Prisma.landTableCreateManyProjectTableInput> = z.strictObject({
  landId: z.string(),
  landName: z.string(),
  hectares: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLat: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  gpsLon: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  landNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  treatmentType: z.lazy(() => TreatmentTypeSchema).optional().nullable(),
  editedBy: z.string().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  preparation: z.string().optional().nullable(),
});

export const plantingTableCreateManyProjectTableInputSchema: z.ZodType<Prisma.plantingTableCreateManyProjectTableInput> = z.strictObject({
  plantingId: z.string(),
  planted: z.number().int().optional().nullable(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  allocated: z.number().int().optional().nullable(),
  plantingDate: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  units: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unitType: z.lazy(() => UnitTypeSchema).optional().nullable(),
  pricePerUnit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  currency: z.string().optional().nullable(),
});

export const polyTableCreateManyProjectTableInputSchema: z.ZodType<Prisma.polyTableCreateManyProjectTableInput> = z.strictObject({
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

export const stakeholderTableCreateManyProjectTableInputSchema: z.ZodType<Prisma.stakeholderTableCreateManyProjectTableInput> = z.strictObject({
  stakeholderId: z.string(),
  organizationLocalId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const cropTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.cropTableUpdateWithoutProjectTableInput> = z.strictObject({
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
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutCropTableNestedInputSchema).optional(),
  speciesTable: z.lazy(() => speciesTableUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const cropTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.cropTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
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
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutCropTableNestedInputSchema).optional(),
  speciesTable: z.lazy(() => speciesTableUncheckedUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const cropTableUncheckedUpdateManyWithoutProjectTableInputSchema: z.ZodType<Prisma.cropTableUncheckedUpdateManyWithoutProjectTableInput> = z.strictObject({
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

export const landTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.landTableUpdateWithoutProjectTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polygonTable: z.lazy(() => polygonTableUpdateManyWithoutLandTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const landTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.landTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polygonTable: z.lazy(() => polygonTableUncheckedUpdateManyWithoutLandTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const landTableUncheckedUpdateManyWithoutProjectTableInputSchema: z.ZodType<Prisma.landTableUncheckedUpdateManyWithoutProjectTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const plantingTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.plantingTableUpdateWithoutProjectTableInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutPlantingTableNestedInputSchema).optional(),
});

export const plantingTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.plantingTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutPlantingTableNestedInputSchema).optional(),
});

export const plantingTableUncheckedUpdateManyWithoutProjectTableInputSchema: z.ZodType<Prisma.plantingTableUncheckedUpdateManyWithoutProjectTableInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const polyTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.polyTableUpdateWithoutProjectTableInput> = z.strictObject({
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

export const polyTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.polyTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
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

export const polyTableUncheckedUpdateManyWithoutProjectTableInputSchema: z.ZodType<Prisma.polyTableUncheckedUpdateManyWithoutProjectTableInput> = z.strictObject({
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

export const stakeholderTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.stakeholderTableUpdateWithoutProjectTableInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateOneRequiredWithoutStakeholderTableNestedInputSchema).optional(),
});

export const stakeholderTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const stakeholderTableUncheckedUpdateManyWithoutProjectTableInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedUpdateManyWithoutProjectTableInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationLocalId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const sourceTableUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.sourceTableUpdateWithoutProjectTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const sourceTableUncheckedUpdateWithoutProjectTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateWithoutProjectTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const sourceTableUncheckedUpdateManyWithoutProjectTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateManyWithoutProjectTableInput> = z.strictObject({
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

export const polygonTableCreateManyLandTableInputSchema: z.ZodType<Prisma.polygonTableCreateManyLandTableInput> = z.strictObject({
  polygonId: z.string(),
  landName: z.string().optional().nullable(),
  geometry: z.string().optional().nullable(),
  coordinates: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  polygonNotes: z.string().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
});

export const polygonTableUpdateWithoutLandTableInputSchema: z.ZodType<Prisma.polygonTableUpdateWithoutLandTableInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  coordinates: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const polygonTableUncheckedUpdateWithoutLandTableInputSchema: z.ZodType<Prisma.polygonTableUncheckedUpdateWithoutLandTableInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  coordinates: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const polygonTableUncheckedUpdateManyWithoutLandTableInputSchema: z.ZodType<Prisma.polygonTableUncheckedUpdateManyWithoutLandTableInput> = z.strictObject({
  polygonId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  geometry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  coordinates: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polygonNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const sourceTableUpdateWithoutLandTableInputSchema: z.ZodType<Prisma.sourceTableUpdateWithoutLandTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const sourceTableUncheckedUpdateWithoutLandTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateWithoutLandTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const sourceTableUncheckedUpdateManyWithoutLandTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateManyWithoutLandTableInput> = z.strictObject({
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

export const sourceTableUpdateWithoutCropTableInputSchema: z.ZodType<Prisma.sourceTableUpdateWithoutCropTableInput> = z.strictObject({
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
  landTable: z.lazy(() => landTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const sourceTableUncheckedUpdateWithoutCropTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateWithoutCropTableInput> = z.strictObject({
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
  landTable: z.lazy(() => landTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const sourceTableUncheckedUpdateManyWithoutCropTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateManyWithoutCropTableInput> = z.strictObject({
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

export const speciesTableUpdateWithoutCropTableInputSchema: z.ZodType<Prisma.speciesTableUpdateWithoutCropTableInput> = z.strictObject({
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

export const speciesTableUncheckedUpdateWithoutCropTableInputSchema: z.ZodType<Prisma.speciesTableUncheckedUpdateWithoutCropTableInput> = z.strictObject({
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

export const speciesTableUncheckedUpdateManyWithoutCropTableInputSchema: z.ZodType<Prisma.speciesTableUncheckedUpdateManyWithoutCropTableInput> = z.strictObject({
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

export const sourceTableUpdateWithoutPlantingTableInputSchema: z.ZodType<Prisma.sourceTableUpdateWithoutPlantingTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const sourceTableUncheckedUpdateWithoutPlantingTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateWithoutPlantingTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const sourceTableUncheckedUpdateManyWithoutPlantingTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateManyWithoutPlantingTableInput> = z.strictObject({
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

export const cropTableUpdateWithoutSpeciesTableInputSchema: z.ZodType<Prisma.cropTableUpdateWithoutSpeciesTableInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUpdateOneWithoutCropTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const cropTableUncheckedUpdateWithoutSpeciesTableInputSchema: z.ZodType<Prisma.cropTableUncheckedUpdateWithoutSpeciesTableInput> = z.strictObject({
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
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const cropTableUncheckedUpdateManyWithoutSpeciesTableInputSchema: z.ZodType<Prisma.cropTableUncheckedUpdateManyWithoutSpeciesTableInput> = z.strictObject({
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

export const cropTableUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.cropTableUpdateWithoutSourceTableInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUpdateOneWithoutCropTableNestedInputSchema).optional(),
  speciesTable: z.lazy(() => speciesTableUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const cropTableUncheckedUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.cropTableUncheckedUpdateWithoutSourceTableInput> = z.strictObject({
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
  speciesTable: z.lazy(() => speciesTableUncheckedUpdateManyWithoutCropTableNestedInputSchema).optional(),
});

export const cropTableUncheckedUpdateManyWithoutSourceTableInputSchema: z.ZodType<Prisma.cropTableUncheckedUpdateManyWithoutSourceTableInput> = z.strictObject({
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

export const landTableUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.landTableUpdateWithoutSourceTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectTable: z.lazy(() => projectTableUpdateOneRequiredWithoutLandTableNestedInputSchema).optional(),
  polygonTable: z.lazy(() => polygonTableUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const landTableUncheckedUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.landTableUncheckedUpdateWithoutSourceTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  polygonTable: z.lazy(() => polygonTableUncheckedUpdateManyWithoutLandTableNestedInputSchema).optional(),
});

export const landTableUncheckedUpdateManyWithoutSourceTableInputSchema: z.ZodType<Prisma.landTableUncheckedUpdateManyWithoutSourceTableInput> = z.strictObject({
  landId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  landName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hectares: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLat: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  gpsLon: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  treatmentType: z.union([ z.lazy(() => TreatmentTypeSchema), z.lazy(() => NullableEnumTreatmentTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  editedBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preparation: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const organizationLocalTableUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateWithoutSourceTableInput> = z.strictObject({
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
  organizationMasterTable: z.lazy(() => organizationMasterTableUpdateOneWithoutOrganizationLocalTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const organizationLocalTableUncheckedUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedUpdateWithoutSourceTableInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const organizationLocalTableUncheckedUpdateManyWithoutSourceTableInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedUpdateManyWithoutSourceTableInput> = z.strictObject({
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

export const plantingTableUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.plantingTableUpdateWithoutSourceTableInput> = z.strictObject({
  plantingId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planted: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  allocated: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  plantingDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectTable: z.lazy(() => projectTableUpdateOneRequiredWithoutPlantingTableNestedInputSchema).optional(),
});

export const plantingTableUncheckedUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.plantingTableUncheckedUpdateWithoutSourceTableInput> = z.strictObject({
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
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const plantingTableUncheckedUpdateManyWithoutSourceTableInputSchema: z.ZodType<Prisma.plantingTableUncheckedUpdateManyWithoutSourceTableInput> = z.strictObject({
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
  units: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unitType: z.union([ z.lazy(() => UnitTypeSchema), z.lazy(() => NullableEnumUnitTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pricePerUnit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const projectTableUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.projectTableUpdateWithoutSourceTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  organizationLocalTable: z.lazy(() => organizationLocalTableUpdateOneWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const projectTableUncheckedUpdateWithoutSourceTableInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateWithoutSourceTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const projectTableUncheckedUpdateManyWithoutSourceTableInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateManyWithoutSourceTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platform: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const projectTableCreateManyOrganizationLocalTableInputSchema: z.ZodType<Prisma.projectTableCreateManyOrganizationLocalTableInput> = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  url: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
  projectNotes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  deleted: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
  carbonRegistryType: z.lazy(() => CarbonRegistryTypeSchema).optional().nullable(),
  carbonRegistry: z.lazy(() => CarbonRegistrySchema).optional().nullable(),
  employmentClaim: z.number().int().optional().nullable(),
  employmentClaimDescription: z.string().optional().nullable(),
  projectDateEnd: z.coerce.date().optional().nullable(),
  projectDateStart: z.coerce.date().optional().nullable(),
  registryId: z.string().optional().nullable(),
});

export const stakeholderTableCreateManyOrganizationLocalTableInputSchema: z.ZodType<Prisma.stakeholderTableCreateManyOrganizationLocalTableInput> = z.strictObject({
  stakeholderId: z.string(),
  parentId: z.string(),
  parentTable: z.lazy(() => ParentTableSchema),
  projectId: z.string().optional().nullable(),
  stakeholderType: z.lazy(() => StakeholderTypeSchema).optional().nullable(),
  lastEditedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export const projectTableUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.projectTableUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const projectTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  polyTable: z.lazy(() => polyTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutProjectTableNestedInputSchema).optional(),
});

export const projectTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.projectTableUncheckedUpdateManyWithoutOrganizationLocalTableInput> = z.strictObject({
  projectId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  projectName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  platformId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deleted: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isPublic: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  carbonRegistryType: z.union([ z.lazy(() => CarbonRegistryTypeSchema), z.lazy(() => NullableEnumCarbonRegistryTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  carbonRegistry: z.union([ z.lazy(() => CarbonRegistrySchema), z.lazy(() => NullableEnumCarbonRegistryFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaim: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  employmentClaimDescription: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectDateStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  registryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const stakeholderTableUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.stakeholderTableUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  projectTable: z.lazy(() => projectTableUpdateOneWithoutStakeholderTableNestedInputSchema).optional(),
});

export const stakeholderTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const stakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.stakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableInput> = z.strictObject({
  stakeholderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentTable: z.union([ z.lazy(() => ParentTableSchema), z.lazy(() => EnumParentTableFieldUpdateOperationsInputSchema) ]).optional(),
  projectId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stakeholderType: z.union([ z.lazy(() => StakeholderTypeSchema), z.lazy(() => NullableEnumStakeholderTypeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastEditedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const sourceTableUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.sourceTableUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const sourceTableUncheckedUpdateWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateWithoutOrganizationLocalTableInput> = z.strictObject({
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
  cropTable: z.lazy(() => cropTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  landTable: z.lazy(() => landTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  plantingTable: z.lazy(() => plantingTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
  projectTable: z.lazy(() => projectTableUncheckedUpdateManyWithoutSourceTableNestedInputSchema).optional(),
});

export const sourceTableUncheckedUpdateManyWithoutOrganizationLocalTableInputSchema: z.ZodType<Prisma.sourceTableUncheckedUpdateManyWithoutOrganizationLocalTableInput> = z.strictObject({
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

export const organizationLocalTableCreateManyOrganizationMasterTableInputSchema: z.ZodType<Prisma.organizationLocalTableCreateManyOrganizationMasterTableInput> = z.strictObject({
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

export const organizationLocalTableUpdateWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.organizationLocalTableUpdateWithoutOrganizationMasterTableInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const organizationLocalTableUncheckedUpdateWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedUpdateWithoutOrganizationMasterTableInput> = z.strictObject({
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
  projectTable: z.lazy(() => projectTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  stakeholderTable: z.lazy(() => stakeholderTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
  sourceTable: z.lazy(() => sourceTableUncheckedUpdateManyWithoutOrganizationLocalTableNestedInputSchema).optional(),
});

export const organizationLocalTableUncheckedUpdateManyWithoutOrganizationMasterTableInputSchema: z.ZodType<Prisma.organizationLocalTableUncheckedUpdateManyWithoutOrganizationMasterTableInput> = z.strictObject({
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

export const projectTableFindFirstArgsSchema: z.ZodType<Prisma.projectTableFindFirstArgs> = z.object({
  select: projectTableSelectSchema.optional(),
  include: projectTableIncludeSchema.optional(),
  where: projectTableWhereInputSchema.optional(), 
  orderBy: z.union([ projectTableOrderByWithRelationInputSchema.array(), projectTableOrderByWithRelationInputSchema ]).optional(),
  cursor: projectTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProjectTableScalarFieldEnumSchema, ProjectTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const projectTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.projectTableFindFirstOrThrowArgs> = z.object({
  select: projectTableSelectSchema.optional(),
  include: projectTableIncludeSchema.optional(),
  where: projectTableWhereInputSchema.optional(), 
  orderBy: z.union([ projectTableOrderByWithRelationInputSchema.array(), projectTableOrderByWithRelationInputSchema ]).optional(),
  cursor: projectTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProjectTableScalarFieldEnumSchema, ProjectTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const projectTableFindManyArgsSchema: z.ZodType<Prisma.projectTableFindManyArgs> = z.object({
  select: projectTableSelectSchema.optional(),
  include: projectTableIncludeSchema.optional(),
  where: projectTableWhereInputSchema.optional(), 
  orderBy: z.union([ projectTableOrderByWithRelationInputSchema.array(), projectTableOrderByWithRelationInputSchema ]).optional(),
  cursor: projectTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProjectTableScalarFieldEnumSchema, ProjectTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const projectTableAggregateArgsSchema: z.ZodType<Prisma.projectTableAggregateArgs> = z.object({
  where: projectTableWhereInputSchema.optional(), 
  orderBy: z.union([ projectTableOrderByWithRelationInputSchema.array(), projectTableOrderByWithRelationInputSchema ]).optional(),
  cursor: projectTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const projectTableGroupByArgsSchema: z.ZodType<Prisma.projectTableGroupByArgs> = z.object({
  where: projectTableWhereInputSchema.optional(), 
  orderBy: z.union([ projectTableOrderByWithAggregationInputSchema.array(), projectTableOrderByWithAggregationInputSchema ]).optional(),
  by: ProjectTableScalarFieldEnumSchema.array(), 
  having: projectTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const projectTableFindUniqueArgsSchema: z.ZodType<Prisma.projectTableFindUniqueArgs> = z.object({
  select: projectTableSelectSchema.optional(),
  include: projectTableIncludeSchema.optional(),
  where: projectTableWhereUniqueInputSchema, 
}).strict();

export const projectTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.projectTableFindUniqueOrThrowArgs> = z.object({
  select: projectTableSelectSchema.optional(),
  include: projectTableIncludeSchema.optional(),
  where: projectTableWhereUniqueInputSchema, 
}).strict();

export const landTableFindFirstArgsSchema: z.ZodType<Prisma.landTableFindFirstArgs> = z.object({
  select: landTableSelectSchema.optional(),
  include: landTableIncludeSchema.optional(),
  where: landTableWhereInputSchema.optional(), 
  orderBy: z.union([ landTableOrderByWithRelationInputSchema.array(), landTableOrderByWithRelationInputSchema ]).optional(),
  cursor: landTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ LandTableScalarFieldEnumSchema, LandTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const landTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.landTableFindFirstOrThrowArgs> = z.object({
  select: landTableSelectSchema.optional(),
  include: landTableIncludeSchema.optional(),
  where: landTableWhereInputSchema.optional(), 
  orderBy: z.union([ landTableOrderByWithRelationInputSchema.array(), landTableOrderByWithRelationInputSchema ]).optional(),
  cursor: landTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ LandTableScalarFieldEnumSchema, LandTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const landTableFindManyArgsSchema: z.ZodType<Prisma.landTableFindManyArgs> = z.object({
  select: landTableSelectSchema.optional(),
  include: landTableIncludeSchema.optional(),
  where: landTableWhereInputSchema.optional(), 
  orderBy: z.union([ landTableOrderByWithRelationInputSchema.array(), landTableOrderByWithRelationInputSchema ]).optional(),
  cursor: landTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ LandTableScalarFieldEnumSchema, LandTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const landTableAggregateArgsSchema: z.ZodType<Prisma.landTableAggregateArgs> = z.object({
  where: landTableWhereInputSchema.optional(), 
  orderBy: z.union([ landTableOrderByWithRelationInputSchema.array(), landTableOrderByWithRelationInputSchema ]).optional(),
  cursor: landTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const landTableGroupByArgsSchema: z.ZodType<Prisma.landTableGroupByArgs> = z.object({
  where: landTableWhereInputSchema.optional(), 
  orderBy: z.union([ landTableOrderByWithAggregationInputSchema.array(), landTableOrderByWithAggregationInputSchema ]).optional(),
  by: LandTableScalarFieldEnumSchema.array(), 
  having: landTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const landTableFindUniqueArgsSchema: z.ZodType<Prisma.landTableFindUniqueArgs> = z.object({
  select: landTableSelectSchema.optional(),
  include: landTableIncludeSchema.optional(),
  where: landTableWhereUniqueInputSchema, 
}).strict();

export const landTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.landTableFindUniqueOrThrowArgs> = z.object({
  select: landTableSelectSchema.optional(),
  include: landTableIncludeSchema.optional(),
  where: landTableWhereUniqueInputSchema, 
}).strict();

export const cropTableFindFirstArgsSchema: z.ZodType<Prisma.cropTableFindFirstArgs> = z.object({
  select: cropTableSelectSchema.optional(),
  include: cropTableIncludeSchema.optional(),
  where: cropTableWhereInputSchema.optional(), 
  orderBy: z.union([ cropTableOrderByWithRelationInputSchema.array(), cropTableOrderByWithRelationInputSchema ]).optional(),
  cursor: cropTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CropTableScalarFieldEnumSchema, CropTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const cropTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.cropTableFindFirstOrThrowArgs> = z.object({
  select: cropTableSelectSchema.optional(),
  include: cropTableIncludeSchema.optional(),
  where: cropTableWhereInputSchema.optional(), 
  orderBy: z.union([ cropTableOrderByWithRelationInputSchema.array(), cropTableOrderByWithRelationInputSchema ]).optional(),
  cursor: cropTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CropTableScalarFieldEnumSchema, CropTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const cropTableFindManyArgsSchema: z.ZodType<Prisma.cropTableFindManyArgs> = z.object({
  select: cropTableSelectSchema.optional(),
  include: cropTableIncludeSchema.optional(),
  where: cropTableWhereInputSchema.optional(), 
  orderBy: z.union([ cropTableOrderByWithRelationInputSchema.array(), cropTableOrderByWithRelationInputSchema ]).optional(),
  cursor: cropTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CropTableScalarFieldEnumSchema, CropTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const cropTableAggregateArgsSchema: z.ZodType<Prisma.cropTableAggregateArgs> = z.object({
  where: cropTableWhereInputSchema.optional(), 
  orderBy: z.union([ cropTableOrderByWithRelationInputSchema.array(), cropTableOrderByWithRelationInputSchema ]).optional(),
  cursor: cropTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const cropTableGroupByArgsSchema: z.ZodType<Prisma.cropTableGroupByArgs> = z.object({
  where: cropTableWhereInputSchema.optional(), 
  orderBy: z.union([ cropTableOrderByWithAggregationInputSchema.array(), cropTableOrderByWithAggregationInputSchema ]).optional(),
  by: CropTableScalarFieldEnumSchema.array(), 
  having: cropTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const cropTableFindUniqueArgsSchema: z.ZodType<Prisma.cropTableFindUniqueArgs> = z.object({
  select: cropTableSelectSchema.optional(),
  include: cropTableIncludeSchema.optional(),
  where: cropTableWhereUniqueInputSchema, 
}).strict();

export const cropTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.cropTableFindUniqueOrThrowArgs> = z.object({
  select: cropTableSelectSchema.optional(),
  include: cropTableIncludeSchema.optional(),
  where: cropTableWhereUniqueInputSchema, 
}).strict();

export const plantingTableFindFirstArgsSchema: z.ZodType<Prisma.plantingTableFindFirstArgs> = z.object({
  select: plantingTableSelectSchema.optional(),
  include: plantingTableIncludeSchema.optional(),
  where: plantingTableWhereInputSchema.optional(), 
  orderBy: z.union([ plantingTableOrderByWithRelationInputSchema.array(), plantingTableOrderByWithRelationInputSchema ]).optional(),
  cursor: plantingTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PlantingTableScalarFieldEnumSchema, PlantingTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const plantingTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.plantingTableFindFirstOrThrowArgs> = z.object({
  select: plantingTableSelectSchema.optional(),
  include: plantingTableIncludeSchema.optional(),
  where: plantingTableWhereInputSchema.optional(), 
  orderBy: z.union([ plantingTableOrderByWithRelationInputSchema.array(), plantingTableOrderByWithRelationInputSchema ]).optional(),
  cursor: plantingTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PlantingTableScalarFieldEnumSchema, PlantingTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const plantingTableFindManyArgsSchema: z.ZodType<Prisma.plantingTableFindManyArgs> = z.object({
  select: plantingTableSelectSchema.optional(),
  include: plantingTableIncludeSchema.optional(),
  where: plantingTableWhereInputSchema.optional(), 
  orderBy: z.union([ plantingTableOrderByWithRelationInputSchema.array(), plantingTableOrderByWithRelationInputSchema ]).optional(),
  cursor: plantingTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PlantingTableScalarFieldEnumSchema, PlantingTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const plantingTableAggregateArgsSchema: z.ZodType<Prisma.plantingTableAggregateArgs> = z.object({
  where: plantingTableWhereInputSchema.optional(), 
  orderBy: z.union([ plantingTableOrderByWithRelationInputSchema.array(), plantingTableOrderByWithRelationInputSchema ]).optional(),
  cursor: plantingTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const plantingTableGroupByArgsSchema: z.ZodType<Prisma.plantingTableGroupByArgs> = z.object({
  where: plantingTableWhereInputSchema.optional(), 
  orderBy: z.union([ plantingTableOrderByWithAggregationInputSchema.array(), plantingTableOrderByWithAggregationInputSchema ]).optional(),
  by: PlantingTableScalarFieldEnumSchema.array(), 
  having: plantingTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const plantingTableFindUniqueArgsSchema: z.ZodType<Prisma.plantingTableFindUniqueArgs> = z.object({
  select: plantingTableSelectSchema.optional(),
  include: plantingTableIncludeSchema.optional(),
  where: plantingTableWhereUniqueInputSchema, 
}).strict();

export const plantingTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.plantingTableFindUniqueOrThrowArgs> = z.object({
  select: plantingTableSelectSchema.optional(),
  include: plantingTableIncludeSchema.optional(),
  where: plantingTableWhereUniqueInputSchema, 
}).strict();

export const speciesTableFindFirstArgsSchema: z.ZodType<Prisma.speciesTableFindFirstArgs> = z.object({
  select: speciesTableSelectSchema.optional(),
  include: speciesTableIncludeSchema.optional(),
  where: speciesTableWhereInputSchema.optional(), 
  orderBy: z.union([ speciesTableOrderByWithRelationInputSchema.array(), speciesTableOrderByWithRelationInputSchema ]).optional(),
  cursor: speciesTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SpeciesTableScalarFieldEnumSchema, SpeciesTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const speciesTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.speciesTableFindFirstOrThrowArgs> = z.object({
  select: speciesTableSelectSchema.optional(),
  include: speciesTableIncludeSchema.optional(),
  where: speciesTableWhereInputSchema.optional(), 
  orderBy: z.union([ speciesTableOrderByWithRelationInputSchema.array(), speciesTableOrderByWithRelationInputSchema ]).optional(),
  cursor: speciesTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SpeciesTableScalarFieldEnumSchema, SpeciesTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const speciesTableFindManyArgsSchema: z.ZodType<Prisma.speciesTableFindManyArgs> = z.object({
  select: speciesTableSelectSchema.optional(),
  include: speciesTableIncludeSchema.optional(),
  where: speciesTableWhereInputSchema.optional(), 
  orderBy: z.union([ speciesTableOrderByWithRelationInputSchema.array(), speciesTableOrderByWithRelationInputSchema ]).optional(),
  cursor: speciesTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SpeciesTableScalarFieldEnumSchema, SpeciesTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const speciesTableAggregateArgsSchema: z.ZodType<Prisma.speciesTableAggregateArgs> = z.object({
  where: speciesTableWhereInputSchema.optional(), 
  orderBy: z.union([ speciesTableOrderByWithRelationInputSchema.array(), speciesTableOrderByWithRelationInputSchema ]).optional(),
  cursor: speciesTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const speciesTableGroupByArgsSchema: z.ZodType<Prisma.speciesTableGroupByArgs> = z.object({
  where: speciesTableWhereInputSchema.optional(), 
  orderBy: z.union([ speciesTableOrderByWithAggregationInputSchema.array(), speciesTableOrderByWithAggregationInputSchema ]).optional(),
  by: SpeciesTableScalarFieldEnumSchema.array(), 
  having: speciesTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const speciesTableFindUniqueArgsSchema: z.ZodType<Prisma.speciesTableFindUniqueArgs> = z.object({
  select: speciesTableSelectSchema.optional(),
  include: speciesTableIncludeSchema.optional(),
  where: speciesTableWhereUniqueInputSchema, 
}).strict();

export const speciesTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.speciesTableFindUniqueOrThrowArgs> = z.object({
  select: speciesTableSelectSchema.optional(),
  include: speciesTableIncludeSchema.optional(),
  where: speciesTableWhereUniqueInputSchema, 
}).strict();

export const polygonTableFindFirstArgsSchema: z.ZodType<Prisma.polygonTableFindFirstArgs> = z.object({
  select: polygonTableSelectSchema.optional(),
  include: polygonTableIncludeSchema.optional(),
  where: polygonTableWhereInputSchema.optional(), 
  orderBy: z.union([ polygonTableOrderByWithRelationInputSchema.array(), polygonTableOrderByWithRelationInputSchema ]).optional(),
  cursor: polygonTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PolygonTableScalarFieldEnumSchema, PolygonTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const polygonTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.polygonTableFindFirstOrThrowArgs> = z.object({
  select: polygonTableSelectSchema.optional(),
  include: polygonTableIncludeSchema.optional(),
  where: polygonTableWhereInputSchema.optional(), 
  orderBy: z.union([ polygonTableOrderByWithRelationInputSchema.array(), polygonTableOrderByWithRelationInputSchema ]).optional(),
  cursor: polygonTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PolygonTableScalarFieldEnumSchema, PolygonTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const polygonTableFindManyArgsSchema: z.ZodType<Prisma.polygonTableFindManyArgs> = z.object({
  select: polygonTableSelectSchema.optional(),
  include: polygonTableIncludeSchema.optional(),
  where: polygonTableWhereInputSchema.optional(), 
  orderBy: z.union([ polygonTableOrderByWithRelationInputSchema.array(), polygonTableOrderByWithRelationInputSchema ]).optional(),
  cursor: polygonTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PolygonTableScalarFieldEnumSchema, PolygonTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const polygonTableAggregateArgsSchema: z.ZodType<Prisma.polygonTableAggregateArgs> = z.object({
  where: polygonTableWhereInputSchema.optional(), 
  orderBy: z.union([ polygonTableOrderByWithRelationInputSchema.array(), polygonTableOrderByWithRelationInputSchema ]).optional(),
  cursor: polygonTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const polygonTableGroupByArgsSchema: z.ZodType<Prisma.polygonTableGroupByArgs> = z.object({
  where: polygonTableWhereInputSchema.optional(), 
  orderBy: z.union([ polygonTableOrderByWithAggregationInputSchema.array(), polygonTableOrderByWithAggregationInputSchema ]).optional(),
  by: PolygonTableScalarFieldEnumSchema.array(), 
  having: polygonTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const polygonTableFindUniqueArgsSchema: z.ZodType<Prisma.polygonTableFindUniqueArgs> = z.object({
  select: polygonTableSelectSchema.optional(),
  include: polygonTableIncludeSchema.optional(),
  where: polygonTableWhereUniqueInputSchema, 
}).strict();

export const polygonTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.polygonTableFindUniqueOrThrowArgs> = z.object({
  select: polygonTableSelectSchema.optional(),
  include: polygonTableIncludeSchema.optional(),
  where: polygonTableWhereUniqueInputSchema, 
}).strict();

export const polyTableFindFirstArgsSchema: z.ZodType<Prisma.polyTableFindFirstArgs> = z.object({
  select: polyTableSelectSchema.optional(),
  include: polyTableIncludeSchema.optional(),
  where: polyTableWhereInputSchema.optional(), 
  orderBy: z.union([ polyTableOrderByWithRelationInputSchema.array(), polyTableOrderByWithRelationInputSchema ]).optional(),
  cursor: polyTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PolyTableScalarFieldEnumSchema, PolyTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const polyTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.polyTableFindFirstOrThrowArgs> = z.object({
  select: polyTableSelectSchema.optional(),
  include: polyTableIncludeSchema.optional(),
  where: polyTableWhereInputSchema.optional(), 
  orderBy: z.union([ polyTableOrderByWithRelationInputSchema.array(), polyTableOrderByWithRelationInputSchema ]).optional(),
  cursor: polyTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PolyTableScalarFieldEnumSchema, PolyTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const polyTableFindManyArgsSchema: z.ZodType<Prisma.polyTableFindManyArgs> = z.object({
  select: polyTableSelectSchema.optional(),
  include: polyTableIncludeSchema.optional(),
  where: polyTableWhereInputSchema.optional(), 
  orderBy: z.union([ polyTableOrderByWithRelationInputSchema.array(), polyTableOrderByWithRelationInputSchema ]).optional(),
  cursor: polyTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PolyTableScalarFieldEnumSchema, PolyTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const polyTableAggregateArgsSchema: z.ZodType<Prisma.polyTableAggregateArgs> = z.object({
  where: polyTableWhereInputSchema.optional(), 
  orderBy: z.union([ polyTableOrderByWithRelationInputSchema.array(), polyTableOrderByWithRelationInputSchema ]).optional(),
  cursor: polyTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const polyTableGroupByArgsSchema: z.ZodType<Prisma.polyTableGroupByArgs> = z.object({
  where: polyTableWhereInputSchema.optional(), 
  orderBy: z.union([ polyTableOrderByWithAggregationInputSchema.array(), polyTableOrderByWithAggregationInputSchema ]).optional(),
  by: PolyTableScalarFieldEnumSchema.array(), 
  having: polyTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const polyTableFindUniqueArgsSchema: z.ZodType<Prisma.polyTableFindUniqueArgs> = z.object({
  select: polyTableSelectSchema.optional(),
  include: polyTableIncludeSchema.optional(),
  where: polyTableWhereUniqueInputSchema, 
}).strict();

export const polyTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.polyTableFindUniqueOrThrowArgs> = z.object({
  select: polyTableSelectSchema.optional(),
  include: polyTableIncludeSchema.optional(),
  where: polyTableWhereUniqueInputSchema, 
}).strict();

export const stakeholderTableFindFirstArgsSchema: z.ZodType<Prisma.stakeholderTableFindFirstArgs> = z.object({
  select: stakeholderTableSelectSchema.optional(),
  include: stakeholderTableIncludeSchema.optional(),
  where: stakeholderTableWhereInputSchema.optional(), 
  orderBy: z.union([ stakeholderTableOrderByWithRelationInputSchema.array(), stakeholderTableOrderByWithRelationInputSchema ]).optional(),
  cursor: stakeholderTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StakeholderTableScalarFieldEnumSchema, StakeholderTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const stakeholderTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.stakeholderTableFindFirstOrThrowArgs> = z.object({
  select: stakeholderTableSelectSchema.optional(),
  include: stakeholderTableIncludeSchema.optional(),
  where: stakeholderTableWhereInputSchema.optional(), 
  orderBy: z.union([ stakeholderTableOrderByWithRelationInputSchema.array(), stakeholderTableOrderByWithRelationInputSchema ]).optional(),
  cursor: stakeholderTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StakeholderTableScalarFieldEnumSchema, StakeholderTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const stakeholderTableFindManyArgsSchema: z.ZodType<Prisma.stakeholderTableFindManyArgs> = z.object({
  select: stakeholderTableSelectSchema.optional(),
  include: stakeholderTableIncludeSchema.optional(),
  where: stakeholderTableWhereInputSchema.optional(), 
  orderBy: z.union([ stakeholderTableOrderByWithRelationInputSchema.array(), stakeholderTableOrderByWithRelationInputSchema ]).optional(),
  cursor: stakeholderTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StakeholderTableScalarFieldEnumSchema, StakeholderTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const stakeholderTableAggregateArgsSchema: z.ZodType<Prisma.stakeholderTableAggregateArgs> = z.object({
  where: stakeholderTableWhereInputSchema.optional(), 
  orderBy: z.union([ stakeholderTableOrderByWithRelationInputSchema.array(), stakeholderTableOrderByWithRelationInputSchema ]).optional(),
  cursor: stakeholderTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const stakeholderTableGroupByArgsSchema: z.ZodType<Prisma.stakeholderTableGroupByArgs> = z.object({
  where: stakeholderTableWhereInputSchema.optional(), 
  orderBy: z.union([ stakeholderTableOrderByWithAggregationInputSchema.array(), stakeholderTableOrderByWithAggregationInputSchema ]).optional(),
  by: StakeholderTableScalarFieldEnumSchema.array(), 
  having: stakeholderTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const stakeholderTableFindUniqueArgsSchema: z.ZodType<Prisma.stakeholderTableFindUniqueArgs> = z.object({
  select: stakeholderTableSelectSchema.optional(),
  include: stakeholderTableIncludeSchema.optional(),
  where: stakeholderTableWhereUniqueInputSchema, 
}).strict();

export const stakeholderTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.stakeholderTableFindUniqueOrThrowArgs> = z.object({
  select: stakeholderTableSelectSchema.optional(),
  include: stakeholderTableIncludeSchema.optional(),
  where: stakeholderTableWhereUniqueInputSchema, 
}).strict();

export const sourceTableFindFirstArgsSchema: z.ZodType<Prisma.sourceTableFindFirstArgs> = z.object({
  select: sourceTableSelectSchema.optional(),
  include: sourceTableIncludeSchema.optional(),
  where: sourceTableWhereInputSchema.optional(), 
  orderBy: z.union([ sourceTableOrderByWithRelationInputSchema.array(), sourceTableOrderByWithRelationInputSchema ]).optional(),
  cursor: sourceTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SourceTableScalarFieldEnumSchema, SourceTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const sourceTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.sourceTableFindFirstOrThrowArgs> = z.object({
  select: sourceTableSelectSchema.optional(),
  include: sourceTableIncludeSchema.optional(),
  where: sourceTableWhereInputSchema.optional(), 
  orderBy: z.union([ sourceTableOrderByWithRelationInputSchema.array(), sourceTableOrderByWithRelationInputSchema ]).optional(),
  cursor: sourceTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SourceTableScalarFieldEnumSchema, SourceTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const sourceTableFindManyArgsSchema: z.ZodType<Prisma.sourceTableFindManyArgs> = z.object({
  select: sourceTableSelectSchema.optional(),
  include: sourceTableIncludeSchema.optional(),
  where: sourceTableWhereInputSchema.optional(), 
  orderBy: z.union([ sourceTableOrderByWithRelationInputSchema.array(), sourceTableOrderByWithRelationInputSchema ]).optional(),
  cursor: sourceTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SourceTableScalarFieldEnumSchema, SourceTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const sourceTableAggregateArgsSchema: z.ZodType<Prisma.sourceTableAggregateArgs> = z.object({
  where: sourceTableWhereInputSchema.optional(), 
  orderBy: z.union([ sourceTableOrderByWithRelationInputSchema.array(), sourceTableOrderByWithRelationInputSchema ]).optional(),
  cursor: sourceTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const sourceTableGroupByArgsSchema: z.ZodType<Prisma.sourceTableGroupByArgs> = z.object({
  where: sourceTableWhereInputSchema.optional(), 
  orderBy: z.union([ sourceTableOrderByWithAggregationInputSchema.array(), sourceTableOrderByWithAggregationInputSchema ]).optional(),
  by: SourceTableScalarFieldEnumSchema.array(), 
  having: sourceTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const sourceTableFindUniqueArgsSchema: z.ZodType<Prisma.sourceTableFindUniqueArgs> = z.object({
  select: sourceTableSelectSchema.optional(),
  include: sourceTableIncludeSchema.optional(),
  where: sourceTableWhereUniqueInputSchema, 
}).strict();

export const sourceTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.sourceTableFindUniqueOrThrowArgs> = z.object({
  select: sourceTableSelectSchema.optional(),
  include: sourceTableIncludeSchema.optional(),
  where: sourceTableWhereUniqueInputSchema, 
}).strict();

export const organizationLocalTableFindFirstArgsSchema: z.ZodType<Prisma.organizationLocalTableFindFirstArgs> = z.object({
  select: organizationLocalTableSelectSchema.optional(),
  include: organizationLocalTableIncludeSchema.optional(),
  where: organizationLocalTableWhereInputSchema.optional(), 
  orderBy: z.union([ organizationLocalTableOrderByWithRelationInputSchema.array(), organizationLocalTableOrderByWithRelationInputSchema ]).optional(),
  cursor: organizationLocalTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationLocalTableScalarFieldEnumSchema, OrganizationLocalTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const organizationLocalTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.organizationLocalTableFindFirstOrThrowArgs> = z.object({
  select: organizationLocalTableSelectSchema.optional(),
  include: organizationLocalTableIncludeSchema.optional(),
  where: organizationLocalTableWhereInputSchema.optional(), 
  orderBy: z.union([ organizationLocalTableOrderByWithRelationInputSchema.array(), organizationLocalTableOrderByWithRelationInputSchema ]).optional(),
  cursor: organizationLocalTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationLocalTableScalarFieldEnumSchema, OrganizationLocalTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const organizationLocalTableFindManyArgsSchema: z.ZodType<Prisma.organizationLocalTableFindManyArgs> = z.object({
  select: organizationLocalTableSelectSchema.optional(),
  include: organizationLocalTableIncludeSchema.optional(),
  where: organizationLocalTableWhereInputSchema.optional(), 
  orderBy: z.union([ organizationLocalTableOrderByWithRelationInputSchema.array(), organizationLocalTableOrderByWithRelationInputSchema ]).optional(),
  cursor: organizationLocalTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationLocalTableScalarFieldEnumSchema, OrganizationLocalTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const organizationLocalTableAggregateArgsSchema: z.ZodType<Prisma.organizationLocalTableAggregateArgs> = z.object({
  where: organizationLocalTableWhereInputSchema.optional(), 
  orderBy: z.union([ organizationLocalTableOrderByWithRelationInputSchema.array(), organizationLocalTableOrderByWithRelationInputSchema ]).optional(),
  cursor: organizationLocalTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const organizationLocalTableGroupByArgsSchema: z.ZodType<Prisma.organizationLocalTableGroupByArgs> = z.object({
  where: organizationLocalTableWhereInputSchema.optional(), 
  orderBy: z.union([ organizationLocalTableOrderByWithAggregationInputSchema.array(), organizationLocalTableOrderByWithAggregationInputSchema ]).optional(),
  by: OrganizationLocalTableScalarFieldEnumSchema.array(), 
  having: organizationLocalTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const organizationLocalTableFindUniqueArgsSchema: z.ZodType<Prisma.organizationLocalTableFindUniqueArgs> = z.object({
  select: organizationLocalTableSelectSchema.optional(),
  include: organizationLocalTableIncludeSchema.optional(),
  where: organizationLocalTableWhereUniqueInputSchema, 
}).strict();

export const organizationLocalTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.organizationLocalTableFindUniqueOrThrowArgs> = z.object({
  select: organizationLocalTableSelectSchema.optional(),
  include: organizationLocalTableIncludeSchema.optional(),
  where: organizationLocalTableWhereUniqueInputSchema, 
}).strict();

export const organizationMasterTableFindFirstArgsSchema: z.ZodType<Prisma.organizationMasterTableFindFirstArgs> = z.object({
  select: organizationMasterTableSelectSchema.optional(),
  include: organizationMasterTableIncludeSchema.optional(),
  where: organizationMasterTableWhereInputSchema.optional(), 
  orderBy: z.union([ organizationMasterTableOrderByWithRelationInputSchema.array(), organizationMasterTableOrderByWithRelationInputSchema ]).optional(),
  cursor: organizationMasterTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationMasterTableScalarFieldEnumSchema, OrganizationMasterTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const organizationMasterTableFindFirstOrThrowArgsSchema: z.ZodType<Prisma.organizationMasterTableFindFirstOrThrowArgs> = z.object({
  select: organizationMasterTableSelectSchema.optional(),
  include: organizationMasterTableIncludeSchema.optional(),
  where: organizationMasterTableWhereInputSchema.optional(), 
  orderBy: z.union([ organizationMasterTableOrderByWithRelationInputSchema.array(), organizationMasterTableOrderByWithRelationInputSchema ]).optional(),
  cursor: organizationMasterTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationMasterTableScalarFieldEnumSchema, OrganizationMasterTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const organizationMasterTableFindManyArgsSchema: z.ZodType<Prisma.organizationMasterTableFindManyArgs> = z.object({
  select: organizationMasterTableSelectSchema.optional(),
  include: organizationMasterTableIncludeSchema.optional(),
  where: organizationMasterTableWhereInputSchema.optional(), 
  orderBy: z.union([ organizationMasterTableOrderByWithRelationInputSchema.array(), organizationMasterTableOrderByWithRelationInputSchema ]).optional(),
  cursor: organizationMasterTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationMasterTableScalarFieldEnumSchema, OrganizationMasterTableScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const organizationMasterTableAggregateArgsSchema: z.ZodType<Prisma.organizationMasterTableAggregateArgs> = z.object({
  where: organizationMasterTableWhereInputSchema.optional(), 
  orderBy: z.union([ organizationMasterTableOrderByWithRelationInputSchema.array(), organizationMasterTableOrderByWithRelationInputSchema ]).optional(),
  cursor: organizationMasterTableWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const organizationMasterTableGroupByArgsSchema: z.ZodType<Prisma.organizationMasterTableGroupByArgs> = z.object({
  where: organizationMasterTableWhereInputSchema.optional(), 
  orderBy: z.union([ organizationMasterTableOrderByWithAggregationInputSchema.array(), organizationMasterTableOrderByWithAggregationInputSchema ]).optional(),
  by: OrganizationMasterTableScalarFieldEnumSchema.array(), 
  having: organizationMasterTableScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const organizationMasterTableFindUniqueArgsSchema: z.ZodType<Prisma.organizationMasterTableFindUniqueArgs> = z.object({
  select: organizationMasterTableSelectSchema.optional(),
  include: organizationMasterTableIncludeSchema.optional(),
  where: organizationMasterTableWhereUniqueInputSchema, 
}).strict();

export const organizationMasterTableFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.organizationMasterTableFindUniqueOrThrowArgs> = z.object({
  select: organizationMasterTableSelectSchema.optional(),
  include: organizationMasterTableIncludeSchema.optional(),
  where: organizationMasterTableWhereUniqueInputSchema, 
}).strict();

export const projectTableCreateArgsSchema: z.ZodType<Prisma.projectTableCreateArgs> = z.object({
  select: projectTableSelectSchema.optional(),
  include: projectTableIncludeSchema.optional(),
  data: z.union([ projectTableCreateInputSchema, projectTableUncheckedCreateInputSchema ]),
}).strict();

export const projectTableUpsertArgsSchema: z.ZodType<Prisma.projectTableUpsertArgs> = z.object({
  select: projectTableSelectSchema.optional(),
  include: projectTableIncludeSchema.optional(),
  where: projectTableWhereUniqueInputSchema, 
  create: z.union([ projectTableCreateInputSchema, projectTableUncheckedCreateInputSchema ]),
  update: z.union([ projectTableUpdateInputSchema, projectTableUncheckedUpdateInputSchema ]),
}).strict();

export const projectTableCreateManyArgsSchema: z.ZodType<Prisma.projectTableCreateManyArgs> = z.object({
  data: z.union([ projectTableCreateManyInputSchema, projectTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const projectTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.projectTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ projectTableCreateManyInputSchema, projectTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const projectTableDeleteArgsSchema: z.ZodType<Prisma.projectTableDeleteArgs> = z.object({
  select: projectTableSelectSchema.optional(),
  include: projectTableIncludeSchema.optional(),
  where: projectTableWhereUniqueInputSchema, 
}).strict();

export const projectTableUpdateArgsSchema: z.ZodType<Prisma.projectTableUpdateArgs> = z.object({
  select: projectTableSelectSchema.optional(),
  include: projectTableIncludeSchema.optional(),
  data: z.union([ projectTableUpdateInputSchema, projectTableUncheckedUpdateInputSchema ]),
  where: projectTableWhereUniqueInputSchema, 
}).strict();

export const projectTableUpdateManyArgsSchema: z.ZodType<Prisma.projectTableUpdateManyArgs> = z.object({
  data: z.union([ projectTableUpdateManyMutationInputSchema, projectTableUncheckedUpdateManyInputSchema ]),
  where: projectTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const projectTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.projectTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ projectTableUpdateManyMutationInputSchema, projectTableUncheckedUpdateManyInputSchema ]),
  where: projectTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const projectTableDeleteManyArgsSchema: z.ZodType<Prisma.projectTableDeleteManyArgs> = z.object({
  where: projectTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const landTableCreateArgsSchema: z.ZodType<Prisma.landTableCreateArgs> = z.object({
  select: landTableSelectSchema.optional(),
  include: landTableIncludeSchema.optional(),
  data: z.union([ landTableCreateInputSchema, landTableUncheckedCreateInputSchema ]),
}).strict();

export const landTableUpsertArgsSchema: z.ZodType<Prisma.landTableUpsertArgs> = z.object({
  select: landTableSelectSchema.optional(),
  include: landTableIncludeSchema.optional(),
  where: landTableWhereUniqueInputSchema, 
  create: z.union([ landTableCreateInputSchema, landTableUncheckedCreateInputSchema ]),
  update: z.union([ landTableUpdateInputSchema, landTableUncheckedUpdateInputSchema ]),
}).strict();

export const landTableCreateManyArgsSchema: z.ZodType<Prisma.landTableCreateManyArgs> = z.object({
  data: z.union([ landTableCreateManyInputSchema, landTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const landTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.landTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ landTableCreateManyInputSchema, landTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const landTableDeleteArgsSchema: z.ZodType<Prisma.landTableDeleteArgs> = z.object({
  select: landTableSelectSchema.optional(),
  include: landTableIncludeSchema.optional(),
  where: landTableWhereUniqueInputSchema, 
}).strict();

export const landTableUpdateArgsSchema: z.ZodType<Prisma.landTableUpdateArgs> = z.object({
  select: landTableSelectSchema.optional(),
  include: landTableIncludeSchema.optional(),
  data: z.union([ landTableUpdateInputSchema, landTableUncheckedUpdateInputSchema ]),
  where: landTableWhereUniqueInputSchema, 
}).strict();

export const landTableUpdateManyArgsSchema: z.ZodType<Prisma.landTableUpdateManyArgs> = z.object({
  data: z.union([ landTableUpdateManyMutationInputSchema, landTableUncheckedUpdateManyInputSchema ]),
  where: landTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const landTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.landTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ landTableUpdateManyMutationInputSchema, landTableUncheckedUpdateManyInputSchema ]),
  where: landTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const landTableDeleteManyArgsSchema: z.ZodType<Prisma.landTableDeleteManyArgs> = z.object({
  where: landTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const cropTableCreateArgsSchema: z.ZodType<Prisma.cropTableCreateArgs> = z.object({
  select: cropTableSelectSchema.optional(),
  include: cropTableIncludeSchema.optional(),
  data: z.union([ cropTableCreateInputSchema, cropTableUncheckedCreateInputSchema ]),
}).strict();

export const cropTableUpsertArgsSchema: z.ZodType<Prisma.cropTableUpsertArgs> = z.object({
  select: cropTableSelectSchema.optional(),
  include: cropTableIncludeSchema.optional(),
  where: cropTableWhereUniqueInputSchema, 
  create: z.union([ cropTableCreateInputSchema, cropTableUncheckedCreateInputSchema ]),
  update: z.union([ cropTableUpdateInputSchema, cropTableUncheckedUpdateInputSchema ]),
}).strict();

export const cropTableCreateManyArgsSchema: z.ZodType<Prisma.cropTableCreateManyArgs> = z.object({
  data: z.union([ cropTableCreateManyInputSchema, cropTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const cropTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.cropTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ cropTableCreateManyInputSchema, cropTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const cropTableDeleteArgsSchema: z.ZodType<Prisma.cropTableDeleteArgs> = z.object({
  select: cropTableSelectSchema.optional(),
  include: cropTableIncludeSchema.optional(),
  where: cropTableWhereUniqueInputSchema, 
}).strict();

export const cropTableUpdateArgsSchema: z.ZodType<Prisma.cropTableUpdateArgs> = z.object({
  select: cropTableSelectSchema.optional(),
  include: cropTableIncludeSchema.optional(),
  data: z.union([ cropTableUpdateInputSchema, cropTableUncheckedUpdateInputSchema ]),
  where: cropTableWhereUniqueInputSchema, 
}).strict();

export const cropTableUpdateManyArgsSchema: z.ZodType<Prisma.cropTableUpdateManyArgs> = z.object({
  data: z.union([ cropTableUpdateManyMutationInputSchema, cropTableUncheckedUpdateManyInputSchema ]),
  where: cropTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const cropTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.cropTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ cropTableUpdateManyMutationInputSchema, cropTableUncheckedUpdateManyInputSchema ]),
  where: cropTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const cropTableDeleteManyArgsSchema: z.ZodType<Prisma.cropTableDeleteManyArgs> = z.object({
  where: cropTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const plantingTableCreateArgsSchema: z.ZodType<Prisma.plantingTableCreateArgs> = z.object({
  select: plantingTableSelectSchema.optional(),
  include: plantingTableIncludeSchema.optional(),
  data: z.union([ plantingTableCreateInputSchema, plantingTableUncheckedCreateInputSchema ]),
}).strict();

export const plantingTableUpsertArgsSchema: z.ZodType<Prisma.plantingTableUpsertArgs> = z.object({
  select: plantingTableSelectSchema.optional(),
  include: plantingTableIncludeSchema.optional(),
  where: plantingTableWhereUniqueInputSchema, 
  create: z.union([ plantingTableCreateInputSchema, plantingTableUncheckedCreateInputSchema ]),
  update: z.union([ plantingTableUpdateInputSchema, plantingTableUncheckedUpdateInputSchema ]),
}).strict();

export const plantingTableCreateManyArgsSchema: z.ZodType<Prisma.plantingTableCreateManyArgs> = z.object({
  data: z.union([ plantingTableCreateManyInputSchema, plantingTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const plantingTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.plantingTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ plantingTableCreateManyInputSchema, plantingTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const plantingTableDeleteArgsSchema: z.ZodType<Prisma.plantingTableDeleteArgs> = z.object({
  select: plantingTableSelectSchema.optional(),
  include: plantingTableIncludeSchema.optional(),
  where: plantingTableWhereUniqueInputSchema, 
}).strict();

export const plantingTableUpdateArgsSchema: z.ZodType<Prisma.plantingTableUpdateArgs> = z.object({
  select: plantingTableSelectSchema.optional(),
  include: plantingTableIncludeSchema.optional(),
  data: z.union([ plantingTableUpdateInputSchema, plantingTableUncheckedUpdateInputSchema ]),
  where: plantingTableWhereUniqueInputSchema, 
}).strict();

export const plantingTableUpdateManyArgsSchema: z.ZodType<Prisma.plantingTableUpdateManyArgs> = z.object({
  data: z.union([ plantingTableUpdateManyMutationInputSchema, plantingTableUncheckedUpdateManyInputSchema ]),
  where: plantingTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const plantingTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.plantingTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ plantingTableUpdateManyMutationInputSchema, plantingTableUncheckedUpdateManyInputSchema ]),
  where: plantingTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const plantingTableDeleteManyArgsSchema: z.ZodType<Prisma.plantingTableDeleteManyArgs> = z.object({
  where: plantingTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const speciesTableCreateArgsSchema: z.ZodType<Prisma.speciesTableCreateArgs> = z.object({
  select: speciesTableSelectSchema.optional(),
  include: speciesTableIncludeSchema.optional(),
  data: z.union([ speciesTableCreateInputSchema, speciesTableUncheckedCreateInputSchema ]),
}).strict();

export const speciesTableUpsertArgsSchema: z.ZodType<Prisma.speciesTableUpsertArgs> = z.object({
  select: speciesTableSelectSchema.optional(),
  include: speciesTableIncludeSchema.optional(),
  where: speciesTableWhereUniqueInputSchema, 
  create: z.union([ speciesTableCreateInputSchema, speciesTableUncheckedCreateInputSchema ]),
  update: z.union([ speciesTableUpdateInputSchema, speciesTableUncheckedUpdateInputSchema ]),
}).strict();

export const speciesTableCreateManyArgsSchema: z.ZodType<Prisma.speciesTableCreateManyArgs> = z.object({
  data: z.union([ speciesTableCreateManyInputSchema, speciesTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const speciesTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.speciesTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ speciesTableCreateManyInputSchema, speciesTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const speciesTableDeleteArgsSchema: z.ZodType<Prisma.speciesTableDeleteArgs> = z.object({
  select: speciesTableSelectSchema.optional(),
  include: speciesTableIncludeSchema.optional(),
  where: speciesTableWhereUniqueInputSchema, 
}).strict();

export const speciesTableUpdateArgsSchema: z.ZodType<Prisma.speciesTableUpdateArgs> = z.object({
  select: speciesTableSelectSchema.optional(),
  include: speciesTableIncludeSchema.optional(),
  data: z.union([ speciesTableUpdateInputSchema, speciesTableUncheckedUpdateInputSchema ]),
  where: speciesTableWhereUniqueInputSchema, 
}).strict();

export const speciesTableUpdateManyArgsSchema: z.ZodType<Prisma.speciesTableUpdateManyArgs> = z.object({
  data: z.union([ speciesTableUpdateManyMutationInputSchema, speciesTableUncheckedUpdateManyInputSchema ]),
  where: speciesTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const speciesTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.speciesTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ speciesTableUpdateManyMutationInputSchema, speciesTableUncheckedUpdateManyInputSchema ]),
  where: speciesTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const speciesTableDeleteManyArgsSchema: z.ZodType<Prisma.speciesTableDeleteManyArgs> = z.object({
  where: speciesTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const polygonTableCreateArgsSchema: z.ZodType<Prisma.polygonTableCreateArgs> = z.object({
  select: polygonTableSelectSchema.optional(),
  include: polygonTableIncludeSchema.optional(),
  data: z.union([ polygonTableCreateInputSchema, polygonTableUncheckedCreateInputSchema ]),
}).strict();

export const polygonTableUpsertArgsSchema: z.ZodType<Prisma.polygonTableUpsertArgs> = z.object({
  select: polygonTableSelectSchema.optional(),
  include: polygonTableIncludeSchema.optional(),
  where: polygonTableWhereUniqueInputSchema, 
  create: z.union([ polygonTableCreateInputSchema, polygonTableUncheckedCreateInputSchema ]),
  update: z.union([ polygonTableUpdateInputSchema, polygonTableUncheckedUpdateInputSchema ]),
}).strict();

export const polygonTableCreateManyArgsSchema: z.ZodType<Prisma.polygonTableCreateManyArgs> = z.object({
  data: z.union([ polygonTableCreateManyInputSchema, polygonTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const polygonTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.polygonTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ polygonTableCreateManyInputSchema, polygonTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const polygonTableDeleteArgsSchema: z.ZodType<Prisma.polygonTableDeleteArgs> = z.object({
  select: polygonTableSelectSchema.optional(),
  include: polygonTableIncludeSchema.optional(),
  where: polygonTableWhereUniqueInputSchema, 
}).strict();

export const polygonTableUpdateArgsSchema: z.ZodType<Prisma.polygonTableUpdateArgs> = z.object({
  select: polygonTableSelectSchema.optional(),
  include: polygonTableIncludeSchema.optional(),
  data: z.union([ polygonTableUpdateInputSchema, polygonTableUncheckedUpdateInputSchema ]),
  where: polygonTableWhereUniqueInputSchema, 
}).strict();

export const polygonTableUpdateManyArgsSchema: z.ZodType<Prisma.polygonTableUpdateManyArgs> = z.object({
  data: z.union([ polygonTableUpdateManyMutationInputSchema, polygonTableUncheckedUpdateManyInputSchema ]),
  where: polygonTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const polygonTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.polygonTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ polygonTableUpdateManyMutationInputSchema, polygonTableUncheckedUpdateManyInputSchema ]),
  where: polygonTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const polygonTableDeleteManyArgsSchema: z.ZodType<Prisma.polygonTableDeleteManyArgs> = z.object({
  where: polygonTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const polyTableCreateArgsSchema: z.ZodType<Prisma.polyTableCreateArgs> = z.object({
  select: polyTableSelectSchema.optional(),
  include: polyTableIncludeSchema.optional(),
  data: z.union([ polyTableCreateInputSchema, polyTableUncheckedCreateInputSchema ]),
}).strict();

export const polyTableUpsertArgsSchema: z.ZodType<Prisma.polyTableUpsertArgs> = z.object({
  select: polyTableSelectSchema.optional(),
  include: polyTableIncludeSchema.optional(),
  where: polyTableWhereUniqueInputSchema, 
  create: z.union([ polyTableCreateInputSchema, polyTableUncheckedCreateInputSchema ]),
  update: z.union([ polyTableUpdateInputSchema, polyTableUncheckedUpdateInputSchema ]),
}).strict();

export const polyTableCreateManyArgsSchema: z.ZodType<Prisma.polyTableCreateManyArgs> = z.object({
  data: z.union([ polyTableCreateManyInputSchema, polyTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const polyTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.polyTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ polyTableCreateManyInputSchema, polyTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const polyTableDeleteArgsSchema: z.ZodType<Prisma.polyTableDeleteArgs> = z.object({
  select: polyTableSelectSchema.optional(),
  include: polyTableIncludeSchema.optional(),
  where: polyTableWhereUniqueInputSchema, 
}).strict();

export const polyTableUpdateArgsSchema: z.ZodType<Prisma.polyTableUpdateArgs> = z.object({
  select: polyTableSelectSchema.optional(),
  include: polyTableIncludeSchema.optional(),
  data: z.union([ polyTableUpdateInputSchema, polyTableUncheckedUpdateInputSchema ]),
  where: polyTableWhereUniqueInputSchema, 
}).strict();

export const polyTableUpdateManyArgsSchema: z.ZodType<Prisma.polyTableUpdateManyArgs> = z.object({
  data: z.union([ polyTableUpdateManyMutationInputSchema, polyTableUncheckedUpdateManyInputSchema ]),
  where: polyTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const polyTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.polyTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ polyTableUpdateManyMutationInputSchema, polyTableUncheckedUpdateManyInputSchema ]),
  where: polyTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const polyTableDeleteManyArgsSchema: z.ZodType<Prisma.polyTableDeleteManyArgs> = z.object({
  where: polyTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const stakeholderTableCreateArgsSchema: z.ZodType<Prisma.stakeholderTableCreateArgs> = z.object({
  select: stakeholderTableSelectSchema.optional(),
  include: stakeholderTableIncludeSchema.optional(),
  data: z.union([ stakeholderTableCreateInputSchema, stakeholderTableUncheckedCreateInputSchema ]),
}).strict();

export const stakeholderTableUpsertArgsSchema: z.ZodType<Prisma.stakeholderTableUpsertArgs> = z.object({
  select: stakeholderTableSelectSchema.optional(),
  include: stakeholderTableIncludeSchema.optional(),
  where: stakeholderTableWhereUniqueInputSchema, 
  create: z.union([ stakeholderTableCreateInputSchema, stakeholderTableUncheckedCreateInputSchema ]),
  update: z.union([ stakeholderTableUpdateInputSchema, stakeholderTableUncheckedUpdateInputSchema ]),
}).strict();

export const stakeholderTableCreateManyArgsSchema: z.ZodType<Prisma.stakeholderTableCreateManyArgs> = z.object({
  data: z.union([ stakeholderTableCreateManyInputSchema, stakeholderTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const stakeholderTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.stakeholderTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ stakeholderTableCreateManyInputSchema, stakeholderTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const stakeholderTableDeleteArgsSchema: z.ZodType<Prisma.stakeholderTableDeleteArgs> = z.object({
  select: stakeholderTableSelectSchema.optional(),
  include: stakeholderTableIncludeSchema.optional(),
  where: stakeholderTableWhereUniqueInputSchema, 
}).strict();

export const stakeholderTableUpdateArgsSchema: z.ZodType<Prisma.stakeholderTableUpdateArgs> = z.object({
  select: stakeholderTableSelectSchema.optional(),
  include: stakeholderTableIncludeSchema.optional(),
  data: z.union([ stakeholderTableUpdateInputSchema, stakeholderTableUncheckedUpdateInputSchema ]),
  where: stakeholderTableWhereUniqueInputSchema, 
}).strict();

export const stakeholderTableUpdateManyArgsSchema: z.ZodType<Prisma.stakeholderTableUpdateManyArgs> = z.object({
  data: z.union([ stakeholderTableUpdateManyMutationInputSchema, stakeholderTableUncheckedUpdateManyInputSchema ]),
  where: stakeholderTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const stakeholderTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.stakeholderTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ stakeholderTableUpdateManyMutationInputSchema, stakeholderTableUncheckedUpdateManyInputSchema ]),
  where: stakeholderTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const stakeholderTableDeleteManyArgsSchema: z.ZodType<Prisma.stakeholderTableDeleteManyArgs> = z.object({
  where: stakeholderTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const sourceTableCreateArgsSchema: z.ZodType<Prisma.sourceTableCreateArgs> = z.object({
  select: sourceTableSelectSchema.optional(),
  include: sourceTableIncludeSchema.optional(),
  data: z.union([ sourceTableCreateInputSchema, sourceTableUncheckedCreateInputSchema ]),
}).strict();

export const sourceTableUpsertArgsSchema: z.ZodType<Prisma.sourceTableUpsertArgs> = z.object({
  select: sourceTableSelectSchema.optional(),
  include: sourceTableIncludeSchema.optional(),
  where: sourceTableWhereUniqueInputSchema, 
  create: z.union([ sourceTableCreateInputSchema, sourceTableUncheckedCreateInputSchema ]),
  update: z.union([ sourceTableUpdateInputSchema, sourceTableUncheckedUpdateInputSchema ]),
}).strict();

export const sourceTableCreateManyArgsSchema: z.ZodType<Prisma.sourceTableCreateManyArgs> = z.object({
  data: z.union([ sourceTableCreateManyInputSchema, sourceTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const sourceTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.sourceTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ sourceTableCreateManyInputSchema, sourceTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const sourceTableDeleteArgsSchema: z.ZodType<Prisma.sourceTableDeleteArgs> = z.object({
  select: sourceTableSelectSchema.optional(),
  include: sourceTableIncludeSchema.optional(),
  where: sourceTableWhereUniqueInputSchema, 
}).strict();

export const sourceTableUpdateArgsSchema: z.ZodType<Prisma.sourceTableUpdateArgs> = z.object({
  select: sourceTableSelectSchema.optional(),
  include: sourceTableIncludeSchema.optional(),
  data: z.union([ sourceTableUpdateInputSchema, sourceTableUncheckedUpdateInputSchema ]),
  where: sourceTableWhereUniqueInputSchema, 
}).strict();

export const sourceTableUpdateManyArgsSchema: z.ZodType<Prisma.sourceTableUpdateManyArgs> = z.object({
  data: z.union([ sourceTableUpdateManyMutationInputSchema, sourceTableUncheckedUpdateManyInputSchema ]),
  where: sourceTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const sourceTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.sourceTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ sourceTableUpdateManyMutationInputSchema, sourceTableUncheckedUpdateManyInputSchema ]),
  where: sourceTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const sourceTableDeleteManyArgsSchema: z.ZodType<Prisma.sourceTableDeleteManyArgs> = z.object({
  where: sourceTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const organizationLocalTableCreateArgsSchema: z.ZodType<Prisma.organizationLocalTableCreateArgs> = z.object({
  select: organizationLocalTableSelectSchema.optional(),
  include: organizationLocalTableIncludeSchema.optional(),
  data: z.union([ organizationLocalTableCreateInputSchema, organizationLocalTableUncheckedCreateInputSchema ]),
}).strict();

export const organizationLocalTableUpsertArgsSchema: z.ZodType<Prisma.organizationLocalTableUpsertArgs> = z.object({
  select: organizationLocalTableSelectSchema.optional(),
  include: organizationLocalTableIncludeSchema.optional(),
  where: organizationLocalTableWhereUniqueInputSchema, 
  create: z.union([ organizationLocalTableCreateInputSchema, organizationLocalTableUncheckedCreateInputSchema ]),
  update: z.union([ organizationLocalTableUpdateInputSchema, organizationLocalTableUncheckedUpdateInputSchema ]),
}).strict();

export const organizationLocalTableCreateManyArgsSchema: z.ZodType<Prisma.organizationLocalTableCreateManyArgs> = z.object({
  data: z.union([ organizationLocalTableCreateManyInputSchema, organizationLocalTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const organizationLocalTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.organizationLocalTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ organizationLocalTableCreateManyInputSchema, organizationLocalTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const organizationLocalTableDeleteArgsSchema: z.ZodType<Prisma.organizationLocalTableDeleteArgs> = z.object({
  select: organizationLocalTableSelectSchema.optional(),
  include: organizationLocalTableIncludeSchema.optional(),
  where: organizationLocalTableWhereUniqueInputSchema, 
}).strict();

export const organizationLocalTableUpdateArgsSchema: z.ZodType<Prisma.organizationLocalTableUpdateArgs> = z.object({
  select: organizationLocalTableSelectSchema.optional(),
  include: organizationLocalTableIncludeSchema.optional(),
  data: z.union([ organizationLocalTableUpdateInputSchema, organizationLocalTableUncheckedUpdateInputSchema ]),
  where: organizationLocalTableWhereUniqueInputSchema, 
}).strict();

export const organizationLocalTableUpdateManyArgsSchema: z.ZodType<Prisma.organizationLocalTableUpdateManyArgs> = z.object({
  data: z.union([ organizationLocalTableUpdateManyMutationInputSchema, organizationLocalTableUncheckedUpdateManyInputSchema ]),
  where: organizationLocalTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const organizationLocalTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.organizationLocalTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ organizationLocalTableUpdateManyMutationInputSchema, organizationLocalTableUncheckedUpdateManyInputSchema ]),
  where: organizationLocalTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const organizationLocalTableDeleteManyArgsSchema: z.ZodType<Prisma.organizationLocalTableDeleteManyArgs> = z.object({
  where: organizationLocalTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const organizationMasterTableCreateArgsSchema: z.ZodType<Prisma.organizationMasterTableCreateArgs> = z.object({
  select: organizationMasterTableSelectSchema.optional(),
  include: organizationMasterTableIncludeSchema.optional(),
  data: z.union([ organizationMasterTableCreateInputSchema, organizationMasterTableUncheckedCreateInputSchema ]),
}).strict();

export const organizationMasterTableUpsertArgsSchema: z.ZodType<Prisma.organizationMasterTableUpsertArgs> = z.object({
  select: organizationMasterTableSelectSchema.optional(),
  include: organizationMasterTableIncludeSchema.optional(),
  where: organizationMasterTableWhereUniqueInputSchema, 
  create: z.union([ organizationMasterTableCreateInputSchema, organizationMasterTableUncheckedCreateInputSchema ]),
  update: z.union([ organizationMasterTableUpdateInputSchema, organizationMasterTableUncheckedUpdateInputSchema ]),
}).strict();

export const organizationMasterTableCreateManyArgsSchema: z.ZodType<Prisma.organizationMasterTableCreateManyArgs> = z.object({
  data: z.union([ organizationMasterTableCreateManyInputSchema, organizationMasterTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const organizationMasterTableCreateManyAndReturnArgsSchema: z.ZodType<Prisma.organizationMasterTableCreateManyAndReturnArgs> = z.object({
  data: z.union([ organizationMasterTableCreateManyInputSchema, organizationMasterTableCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const organizationMasterTableDeleteArgsSchema: z.ZodType<Prisma.organizationMasterTableDeleteArgs> = z.object({
  select: organizationMasterTableSelectSchema.optional(),
  include: organizationMasterTableIncludeSchema.optional(),
  where: organizationMasterTableWhereUniqueInputSchema, 
}).strict();

export const organizationMasterTableUpdateArgsSchema: z.ZodType<Prisma.organizationMasterTableUpdateArgs> = z.object({
  select: organizationMasterTableSelectSchema.optional(),
  include: organizationMasterTableIncludeSchema.optional(),
  data: z.union([ organizationMasterTableUpdateInputSchema, organizationMasterTableUncheckedUpdateInputSchema ]),
  where: organizationMasterTableWhereUniqueInputSchema, 
}).strict();

export const organizationMasterTableUpdateManyArgsSchema: z.ZodType<Prisma.organizationMasterTableUpdateManyArgs> = z.object({
  data: z.union([ organizationMasterTableUpdateManyMutationInputSchema, organizationMasterTableUncheckedUpdateManyInputSchema ]),
  where: organizationMasterTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const organizationMasterTableUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.organizationMasterTableUpdateManyAndReturnArgs> = z.object({
  data: z.union([ organizationMasterTableUpdateManyMutationInputSchema, organizationMasterTableUncheckedUpdateManyInputSchema ]),
  where: organizationMasterTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const organizationMasterTableDeleteManyArgsSchema: z.ZodType<Prisma.organizationMasterTableDeleteManyArgs> = z.object({
  where: organizationMasterTableWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();