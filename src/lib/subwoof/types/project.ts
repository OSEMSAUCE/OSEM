// Shared TypeScript types for project data

export interface Project {
	projectId: string;
	projectName: string;
}

export interface ProjectWithStats extends Project {
	landCount?: number;
	totalHectares?: number;
	platform?: string;
}

// Legacy GeoJSON project interface
export interface ProjectGeoJSON {
	id: string;
	name: string;
	description?: string;
	geometry: GeoJSON.Geometry;
	properties: ProjectProperties;
}

export interface ProjectProperties {
	// Land properties (from landTable)
	landName?: string;
	hectares?: string; // Formatted as "120.5 ha" from API
	gpsLat?: number;
	gpsLon?: number;
	landNotes?: string;
	treatmentType?: string;
	preparation?: string;
	treesPlantedLand?: number;

	// Project properties (from projectTable)
	projectName?: string;
	url?: string;
	platform?: string;
	projectNotes?: string;
	carbonRegistryType?: string;
	carbonRegistry?: string;
	employmentClaim?: string;
	employmentClaimDescription?: string;
	projectDateStart?: string;
	projectDateEnd?: string;
	registryId?: string;
	treesPlantedProject?: number;

	// Polygon properties (from polygonTable)
	polygonNotes?: string;

	// Stakeholder properties (from stakeholderTable + organizationLocalTable)
	stakeholders?: string; // Comma-separated organization names

	// Calculated properties
	centroid?: [number, number]; // [lng, lat]

	// System timestamps (from various tables)
	createdAt?: string;
	lastEditedAt?: string;
}

export interface ProjectFilter {
	searchQuery?: string;
	minArea?: number; // Filters by hectares (parsed from "120.5 ha" format)
	maxArea?: number;
}

export interface MapBounds {
	north: number;
	south: number;
	east: number;
	west: number;
}
