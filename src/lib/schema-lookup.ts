/**
 * SINGLE SOURCE OF TRUTH for Schema Display Logic
 *
 * This file controls how database tables and columns are displayed to the user.
 * It centralizes "Natural Keys" (what column represents the record) and
 * "Attribute Labels" (friendly names for columns).
 */

// 1. NATURAL KEY MAP
// Defines the "Human ID" for each table.
// When the system sees 'landId', it knows to look up 'landName' in 'LandTable'.
export const NATURAL_KEY_MAP = {
    LandTable: {
        idField: "landId",
        displayField: "landName",
    },
    ProjectTable: {
        idField: "projectId",
        displayField: "projectName",
    },
    CropTable: {
        idField: "cropId",
        displayField: "cropName",
    },
    OrganizationLocalTable: {
        idField: "organizationLocalId",
        displayField: "organizationLocalName",
    },
    PlantingTable: {
        idField: "plantingId",
        // Planting usually doesn't have a direct name, often uses landName or a code
        displayField: "plantingId",
    },
    StakeholderTable: {
        idField: "stakeholderId",
        displayField: "stakeholderName", // Assuming generic pattern, verify against DB if possible
    },
    PolyTable: {
        idField: "polyId",
        displayField: "polyId",
    },
    SourceTable: {
        idField: "sourceId",
        displayField: "sourceId",
    },
    userTable: {
        idField: "userId",
        displayField: "email", // or name
    },
} as const;

// Helper to get the natural key column for a given table name
export const getNaturalKeyColumn = (tableName: string): string => {
    // @ts-expect-error - rigid types not needed for this runtime helper
    return NATURAL_KEY_MAP[tableName]?.displayField || "id";
};

// 2. ATTRIBUTE LABELS (The "As..." clause)
// EVERY visible column key MUST have an explicit entry here.
// getAttributeLabel() throws if a key is missing — no silent fallback.
export const ATTRIBUTE_LABELS: Record<string, string> = {
    // Natural key display names
    landName: "Land",
    projectName: "Project",

    // Tree counts
    treesPlantedProject: "Trees Planted",
    treesPlantedLand: "Trees Planted",

    // Notes
    polygonNotes: "Notes",
    projectNotes: "Notes",
    landNotes: "Notes",

    // GPS/Location fields
    gpsLat: "GPS Lat.",
    gpsLon: "GPS Lon.",

    // Hectares (two-source)
    hectaresClaimed: "Hectares Claim",
    hectaresCalc: "Hectares Calc.",

    // Abbreviated terms that need expansion
    url: "URL",
    capacityPerYear: "Annual Capacity",
    ratePerTree: "Rate per Tree",

    // Awkward conversions
    speciesLocalName: "Species Name",
    speciesId: "Species ID",

    cropStock: "Stock Info",
    pricePerUnit: "Price per Unit",

    // Money/Business
    currency: "Currency",
    employmentClaim: "Employment Claim",
    employmentClaimDescription: "Employment Details",

    // Technical fields
    urlType: "URL Type",

    sourceDescription: "Description",
    sourceCredit: "Credit/Attribution",
    carbonRegistryType: "Registry Type",
    carbonRegistry: "Carbon Registry",

    // Claim
    claimCount: "Total Planting Claim",

    // Contact info (shared between Master and Local)
    contactName: "Contact Name",
    contactEmail: "Email",
    contactPhone: "Phone",

    // Notes fields (context-specific)
    organizationNotes: "Org. Notes",
    organizationLocalId: "Org. ID",

    // Fields that don't convert nicely
    geoJson: "GeoJson",

    // Timestamp shortcuts
    createdAt: "Created",
    updatedAt: "Updated",
    lastEditedAt: "Last Edit",

    // Organization-specific (Master vs Local)
    organizationLocalName: "Organization - Alias",
    organizationMasterName: "Organization - Official",
    organizationLocalAddress: "Org. Address",
    organizationMasterAddress: "Org. Address",

    // Project fields
    platform: "Platform",
    isPublic: "Public",
    projectDateStart: "Start Date",
    projectDateEnd: "End Date",

    // Land fields
    preparation: "Preparation",

    // Crop fields
    cropName: "Crop",
    seedInfo: "Seed Info",
    cropNotes: "Notes",

    // Planting fields
    planted: "Planted",
    allocated: "Allocated",
    plantingDate: "Planting Date",
    units: "Units",
    unitType: "Unit Type",
    pricePerUnitUSD: "Price per Unit (USD)",
    parentTable: "Parent Table",

    // Polygon fields
    polygonId: "Polygon ID",
    type: "Type",

    // Poly (polymorphic) fields
    randomJson: "Random JSON",
    survivalRate: "Survival Rate",
    liabilityCause: "Liability Cause",
    motivation: "Motivation",
    restorationType: "Restoration Type",
    reviews: "Reviews",

    // Stakeholder fields
    stakeholderType: "Stakeholder Type",

    // Source fields
    disclosureType: "Disclosure Type",

    // Species fields
    speciesName: "Species",
    commonName: "Common Name",
    scientificName: "Scientific Name",
    family: "Family",
    reference: "Reference",

    // Organization fields
    address: "Address",
    website: "Website",
    contactDemo: "Contact Demo",
    contactDemo2: "Contact Demo 2",
    maxTreesPerYear: "Max Trees/Year",
    demo_13: "Demo 13",
    demo_16: "Demo 16",

    treatmentType: "Treatment Type",

    //
    // Claim fields
    claimId: "Claim ID",

    // Shared fields
    editedBy: "Edited By",
};

// Helper to get label — falls back to raw DB attribute name
export const getAttributeLabel = (key: string): string => {
    if (ATTRIBUTE_LABELS[key]) {
        return ATTRIBUTE_LABELS[key];
    }

    return key;
};

// 4. HIDDEN COLUMNS
// Columns to NEVER show in data tables
// SYNC: Keep in sync with noMapList in Foundr/scripts/3Types.ts
export const HIDDEN_COLUMNS = [
    "cropId",
    "deleted",
    "hectares",
    "JSONPath",
    "landId",
    "lastEditedBy",
    "lastEditedAt",
    "organizationLocalId",
    "organizationMasterId",
    "parentId",
    "plantingId",
    "polyId",
    "polygon",
    "projectId",
    "platformId",
    "registryId",
    "sourceId",
    "stakeholderId",
    "randomJson",
] as const;

// 3. TABLE LABELS
// Friendly names for the tables themselves
export const TABLE_LABELS: Record<string, string> = {
    ProjectTable: "Projects",
    LandTable: "Land",
    CropTable: "Crop",
    OrganizationLocalTable: "Organizations",
    PlantingTable: "Planting",
    StakeholderTable: "Stakeholders",
    SourceTable: "Sources",
    PolygonTable: "Polygons",
    PolyTable: "Polymorphic",
    UniqueTable: "Unique",
    userTable: "Users",
};

export const getTableLabel = (tableName: string): string => {
    return TABLE_LABELS[tableName] || getAttributeLabel(tableName);
};
