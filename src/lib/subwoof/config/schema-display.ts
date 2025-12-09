/**
 * SINGLE SOURCE OF TRUTH for Schema Display Logic
 *
 * This file controls how database tables and columns are displayed to the user.
 * It centralizes "Natural Keys" (what column represents the record) and
 * "Attribute Labels" (friendly names for columns).
 */

// 1. NATURAL KEY MAP
// Defines the "Human ID" for each table.
// When the system sees 'landId', it knows to look up 'landName' in 'landTable'.
export const NATURAL_KEY_MAP = {
	landTable: {
		idField: 'landId',
		displayField: 'landName'
	},
	projectTable: {
		idField: 'projectId',
		displayField: 'projectName'
	},
	cropTable: {
		idField: 'cropId',
		displayField: 'cropName'
	},
	organizationLocalTable: {
		idField: 'organizationLocalId',
		displayField: 'organizationLocalName'
	},
	plantingTable: {
		idField: 'plantingId',
		// Planting usually doesn't have a direct name, often uses landName or a code
		displayField: 'plantingId'
	},
	stakeholderTable: {
		idField: 'stakeholderId',
		displayField: 'stakeholderName' // Assuming generic pattern, verify against DB if possible
	},
	userTable: {
		idField: 'userId',
		displayField: 'email' // or name
	}
} as const;

// Helper to get the natural key column for a given table name
export const getNaturalKeyColumn = (tableName: string): string => {
	// @ts-expect-error - rigid types not needed for this runtime helper
	return NATURAL_KEY_MAP[tableName]?.displayField || 'id';
};

// 2. ATTRIBUTE LABELS (The "As..." clause)
// ONLY define labels that need custom formatting.
// Everything else uses automatic camelCase → Title Case conversion.
// Example: "landArea" → "Land Area" (automatic, don't define it)
//          "geoJson" → "Geo Json" (automatic, but override to "Geometry" below)
export const ATTRIBUTE_LABELS: Record<string, string> = {
	// IDs that need special formatting
	organizationLocalId: 'Org ID',

	// Fields that don't convert nicely
	geoJson: 'Geometry',
	landArea: 'Area (ha)', // Override to add units

	// Timestamp shortcuts
	createdAt: 'Created',
	updatedAt: 'Updated',
	lastEditedAt: 'Last Edit',

	// Organization-specific (Master vs Local)
	organizationLocalName: 'Organization',
	organizationMasterName: 'Organization (Master)',
	organizationLocalAddress: 'Address',
	organizationMasterAddress: 'Address (Master)',

	// Add ONLY the weird ones here...
	// Most columns work fine with automatic conversion
};

// Helper to get label with fallback to title case
export const getAttributeLabel = (key: string): string => {
	if (ATTRIBUTE_LABELS[key]) {
		return ATTRIBUTE_LABELS[key];
	}

	// Fallback: Convert camelCase to Title Case
	// e.g., 'someFieldName' -> 'Some Field Name'
	return key
		.replace(/([A-Z])/g, ' $1') // Add space before caps
		.replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
		.trim();
};

// 4. HIDDEN COLUMNS
// Columns to NEVER show in data tables
export const HIDDEN_COLUMNS = [
	'cropId',
	'deleted',
	'landId',
	'lastEditedBy',
	'lastEditedAt',
	'organizationLocalId',
	'parentId',
	'plantingId',
	'polyId',
	'polygon',
	'projectId',
	'parentTable',
	'platformId',
	'sourceId',
	'stakeholderId',
	'randomJson',
	'registryId'
] as const;

// 3. TABLE LABELS
// Friendly names for the tables themselves
export const TABLE_LABELS: Record<string, string> = {
	projectTable: 'Projects',
	landTable: 'Land Units',
	cropTable: 'Crops',
	organizationLocalTable: 'Organizations',
	plantingTable: 'Plantings',
	stakeholderTable: 'Stakeholders',
	userTable: 'Users'
};

export const getTableLabel = (tableName: string): string => {
	return TABLE_LABELS[tableName] || getAttributeLabel(tableName);
};
