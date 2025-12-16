// Re-export types from bentoGrid
export * from './bentoGrid';

export * from './what';
export * from './who';

// Define OrganizationLocalTable type for OSEM standalone use
// This mirrors the Prisma-generated type from ReTreever
export interface OrganizationLocalTable {
	organizationLocalId: string;
	organizationLocalName: string | null;
	organizationLocalAddress: string | null;
	organizationLocalWebsite: string | null;
	organizationLocalEmail: string | null;
	organizationLocalPhone: string | null;
	organizationLocalDescription: string | null;
	gpsLat: number | null;
	gpsLon: number | null;
	organizationMasterId: string | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}

// Define ProjectTable type
export interface ProjectTable {
	projectId: string;
	projectName: string | null;
	projectDescription: string | null;
	projectStatus: string | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}
