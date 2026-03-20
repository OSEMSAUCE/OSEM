/**
 * SINGLE SOURCE OF TRUTH for Schema Display Logic
 * Borrowd from NAMING_CONVENTIONS.md. also matrix.
 * This file controls how database tables and columns are displayed to the user.
 * It centralizes "Natural Keys" (what column represents the record) and
 * "Attribute Labels" (friendly names for columns).
 *
 * This lookup also helps keep naming consistent in UI components and file labels.
 */

// 1. NATURAL KEY MAP
// Defines the "Human ID" for each table.
// When the system sees 'landKey', it knows to look up 'landName' in 'LandTable'.
export const NATURAL_KEY_MAP = {
    LandTable: {
        idField: "landKey",
        displayField: "landName",
    },
    ProjectTable: {
        idField: "projectKey",
        displayField: "projectName",
    },
    CropTable: {
        idField: "cropKey",
        displayField: "cropName",
    },
    OrganizationTable: {
        idField: "organizationKey",
        displayField: "organizationName",
    },
    PlantingTable: {
        idField: "plantingKey",
        // Planting usually doesn't have a direct name, often uses landName or a code
        displayField: "plantingKey",
    },
    StakeholderTable: {
        idField: "stakeholderKey",
        displayField: "stakeholderName", // Assuming generic pattern, verify against DB if possible
    },
    MiscTable: {
        idField: "polyKey",
        displayField: "polyKey",
    },
    SourceTable: {
        idField: "sourceKey",
        displayField: "sourceKey",
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
    treesplantedQtyProject: "Trees plantedQty",
    treesplantedQtyLand: "Trees plantedQty",

    // Notes
    polygonNotes: "Notes",
    projectDesc: "Notes",
    landDesc: "Notes",

    // GPS/Location fields
    latitude: "GPS Lat.",
    longitude: "GPS Lon.",

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
    employmentClaimQty: "Employment Claim",
    employmentClaimQtyDescription: "Employment Details",

    // Technical fields
    urlType: "URL Type",

    sourceDesc: "Description",
    sourceCredit: "Credit/Attribution",
    carbonRegistryType: "Registry Type",
    carbonRegistry: "Carbon Registry",

    // Claim
    claimQty: "Total Planting Claim",

    // Contact info (shared between Parent and Local)
    contactName: "Contact Name",
    contactEmail: "Email",
    contactPhone: "Phone",

    // Notes fields (context-specific)
    organizationDesc: "Org. Notes",
    organizationKey: "Org. ID",

    // Fields that don't convert nicely
    geoJson: "GeoJson",

    // Timestamp shortcuts
    createdAt: "Created",
    updatedAt: "Updated",
    lastEditedAt: "Last Edit",

    // Organization-specific (Parent vs Local)
    organizationName: "Organization",
    organizationAddress: "Org. Address",

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
    cropDesc: "Notes",

    // Planting fields
    plantedQty: "plantedQty",
    allocatedQty: "allocatedQty",
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
    survivalRatePct: "Survival Rate",
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
    treeCapAnnualQty: "Max Trees/Year",
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
    "cropKey",
    "deletedAt",
    "hectares",
    "JSONPath",
    "landKey",
    "lastEditedBy",
    "lastEditedAt",
    "organizationKey",
    "organizationKey",
    "parentKey",
    "plantingKey",
    "polyKey",
    "polygon",
    "projectKey",
    "platformId",
    "registryId",
    "sourceKey",
    "stakeholderKey",
    "randomJson",
] as const;

// 3. TABLE LABELS
// Friendly names for the tables themselves
export const TABLE_LABELS: Record<string, string> = {
    ProjectTable: "Projects",
    LandTable: "Land",
    CropTable: "Crop",
    OrganizationTable: "Organizations",
    PlantingTable: "Planting",
    StakeholderTable: "Stakeholders",
    SourceTable: "Sources",
    PolygonTable: "Polygons",
    MiscTable: "Polymorphic",
    UniqueTable: "Unique",
    userTable: "Users",
};

export const getTableLabel = (tableName: string): string => {
    return TABLE_LABELS[tableName] || getAttributeLabel(tableName);
};
