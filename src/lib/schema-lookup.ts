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
// ONLY define labels that need custom formatting.
// Everything else uses automatic camelCase → Title Case conversion.
// Example: "landArea" → "Land Area" (automatic, don't define it)
//          "geoJson" → "Geo Json" (automatic, but override to "Geometry" below)
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
};

// Helper to get label with fallback to title case
export const getAttributeLabel = (key: string): string => {
	if (ATTRIBUTE_LABELS[key]) {
		return ATTRIBUTE_LABELS[key];
	}

	// Fallback: Convert camelCase to Title Case
	// e.g., 'someFieldName' -> 'Some Field Name'
	return key
		.replace(/([A-Z])/g, " $1") // Add space before caps
		.replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
		.trim();
};

// 4. HIDDEN COLUMNS
// Columns to NEVER show in data tables
export const HIDDEN_COLUMNS = [
	"cropId",
	"deleted",
	"landId",
	"lastEditedBy",
	"lastEditedAt",
	"organizationLocalId",
	"parentId",
	"plantingId",
	"polyId",
	"polygon",
	"projectId",
	"parentTable",
	"platformId",
	"sourceId",
	"stakeholderId",
	"randomJson",
	"registryId",
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
	userTable: "Users",
};

export const getTableLabel = (tableName: string): string => {
	return TABLE_LABELS[tableName] || getAttributeLabel(tableName);
};
