// Shared TypeScript types for project data

export interface Project {
	id: string;
	name: string;
	description?: string;
	geometry: GeoJSON.Geometry;
	properties: ProjectProperties;
}

export interface ProjectProperties {
	// Core info
	organizationName?: string;
	country?: string;
	region?: string;

	// Metrics
	areaHectares?: number;
	carbonTonnes?: number;
	speciesCount?: number;

	// Dates
	createdAt: string;
	updatedAt?: string;
	startDate?: string;

	// Classification
	projectType?: string;
	biome?: string;
	interventionType?: string;
}

export interface ProjectFilter {
	searchQuery?: string;
	country?: string;
	projectType?: string;
	minArea?: number;
	maxArea?: number;
}

export interface MapBounds {
	north: number;
	south: number;
	east: number;
	west: number;
}
