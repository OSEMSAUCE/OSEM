// Land entity type definition - matches landTable schema

export interface Land {
	landId: string;
	landName: string;
	projectId: string;
	hectares?: number; // Decimal in schema
	gpsLat?: number; // Decimal in schema
	gpsLon?: number; // Decimal in schema
	landNotes?: string;
	createdAt?: string;
	lastEditedAt?: string;
	treatmentType?: string; // TreatmentType enum
	editedBy?: string;
	deleted?: boolean;
	preparation?: string;

	// Joined data from related tables
	projectName?: string; // From projectTable
}

export interface LandFilter {
	searchQuery?: string;
	projectId?: string;
	minArea?: number;
	maxArea?: number;
	treatmentType?: string;
}
