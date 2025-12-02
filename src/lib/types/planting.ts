// Planting entity type definition - matches plantingTable schema

export type ParentTableType =
	| 'projectTable'
	| 'landTable'
	| 'cropTable'
	| 'plantingTable'
	| 'organizationTable'
	| 'sourceTable'
	| 'stakeholderTable';

export type UnitType = 'cCO2e' | 'hectare' | 'acre' | 'tree' | 'credits' | 'project' | 'land';

export interface Planting {
	plantingId: string;
	planted?: number; // Number of trees planted
	projectId: string;
	parentId: string; // Polymorphic FK - could reference landTable, cropTable, etc
	parentTable: ParentTableType; // Indicates which table parentId references
	allocated?: number;
	plantingDate?: string;
	createdAt?: string;
	lastEditedAt?: string;
	deleted?: boolean;

	// Generic unitized activity fields
	units?: number; // Decimal in schema
	unitType?: UnitType;
	pricePerUnit?: number; // Decimal in schema
	currency?: string;

	// Joined data from related tables (for display)
	projectName?: string; // From projectTable
	landName?: string; // From landTable (when parentTable = 'landTable')
	cropName?: string; // From cropTable (when parentTable = 'cropTable')
}

export interface PlantingFilter {
	searchQuery?: string;
	projectId?: string;
	parentId?: string;
	parentTable?: ParentTableType;
	dateFrom?: string;
	dateTo?: string;
}
