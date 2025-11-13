// Land entity type definition - matches ReTreever API response

export interface Land {
	landId: string;
	landName: string;
	projectId: string;
	hectares?: number | null;
	gpsLat?: number | null;
	gpsLon?: number | null;
	landNotes?: string | null;
	treatmentType?: string | null;
	preparation?: string | null;

	// Joined data from related tables
	projectTable?: {
		projectName: string;
	};
	projectName?: string; // Flattened from projectTable

	// Polygon data
	polygonTable?: Array<{
		landId: string;
		polygonId: string;
		landName: string;
		geometry: string;
		coordinates: string;
		type: string;
		polygonNotes: string | null;
		lastEditedAt: string;
	}>;
}

export interface LandFilter {
	searchQuery?: string;
	projectId?: string;
	minArea?: number;
	maxArea?: number;
	treatmentType?: string;
}
