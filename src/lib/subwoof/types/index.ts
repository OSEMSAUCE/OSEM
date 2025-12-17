// Re-export types from bentoGrid
export * from './bentoGrid';

export * from './what';
export * from './who';

// Define OrganizationLocalTable type for OSEM standalone use
// This mirrors the Prisma-generated type from ReTreever
export interface OrganizationLocalTable {
	organizationLocalId: string;
	organizationLocalName?: string | null;
	organizationLocalAddress?: string | null;
	address?: string | null;
	organizationLocalWebsite?: string | null;
	website?: string | null;
	organizationLocalEmail?: string | null;
	email?: string | null;
	organizationLocalPhone?: string | null;
	phone?: string | null;
	organizationLocalDescription?: string | null;
	description?: string | null;
	gpsLat?: number | null;
	gpsLon?: number | null;
	organizationMasterId?: string | null;
	createdAt?: Date | string | null;
	updatedAt?: Date | string | null;
}

// Define ProjectTable type
export interface ProjectTable {
	projectId: string;
	projectName: string | null;
	url?: string | null;
	platformId?: string | null;
	platform?: string | null;
	projectNotes?: string | null;
	createdAt?: Date | string | null;
	lastEditedAt?: Date | string | null;
	deleted?: boolean | null;
	carbonRegistryType?: string | null;
	carbonRegistry?: string | null;
	employmentClaim?: number | null;
	employmentClaimDescription?: string | null;
	projectDateEnd?: Date | string | null;
	projectDateStart?: Date | string | null;
	registryId?: string | null;
	isPublic?: boolean;
}
