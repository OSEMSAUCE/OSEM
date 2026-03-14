// Re-export types from bentoGrid
export * from "./bentoGrid";

export * from "./what";
export * from "./who";

// Define OrganizationTable type for OSEM standalone use
// This mirrors the Prisma-generated type from ReTreever
export interface OrganizationTable {
    organizationKey: string;
    organizationName?: string | null;
    organizationAddress?: string | null;
    address?: string | null;
    organizationWebsite?: string | null;
    website?: string | null;
    organizationEmail?: string | null;
    email?: string | null;
    organizationPhone?: string | null;
    phone?: string | null;
    organizationDescription?: string | null;
    description?: string | null;
    gpsLat?: number | null;
    gpsLon?: number | null;
    organizationKey?: string | null;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
}

export interface OrganizationTable {
    organizationKey: string;
    organizationName: string;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    address?: string | null;
    website?: string | null;
    organizationNotes?: string | null;
    createdAt?: Date | string | null;
    lastEditedAt?: Date | string | null;
    editedBy?: string | null;
    deleted?: boolean | null;
    gpsLat?: number | null;
    gpsLon?: number | null;
    maxTreesPerYear?: number | null;
    primaryStakeholderType?: string | null;
}

// Define ProjectTable type
export interface ProjectTable {
    projectKey: string;
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
