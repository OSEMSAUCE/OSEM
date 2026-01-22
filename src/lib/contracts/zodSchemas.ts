import { z } from "zod";

export const WhoOrganizationSchema = z.object({
	organizationLocalId: z.string(),
	organizationLocalName: z.string().nullable().optional(),
	organizationLocalAddress: z.string().nullable().optional(),
	organizationLocalWebsite: z.string().nullable().optional(),
	organizationLocalEmail: z.string().nullable().optional(),
	organizationLocalPhone: z.string().nullable().optional(),
	organizationLocalDescription: z.string().nullable().optional(),
	gpsLat: z.number().nullable().optional(),
	gpsLon: z.number().nullable().optional(),
	organizationMasterId: z.string().nullable().optional(),
	createdAt: z.union([z.string(), z.date()]).nullable().optional(),
	updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
});

export const WhoPageDataSchema = z.object({
	organizations: z.array(WhoOrganizationSchema),
	error: z.string().optional(),
});

export type WhoOrganization = z.infer<typeof WhoOrganizationSchema>;
export type WhoPageData = z.infer<typeof WhoPageDataSchema>;

export const WhatProjectSchema = z.object({
	projectId: z.string(),
	projectName: z.string().nullable(),
	url: z.string().nullable().optional(),
	platform: z.string().nullable().optional(),
	platformId: z.string().nullable().optional(),
	projectNotes: z.string().nullable().optional(),
	createdAt: z.union([z.string(), z.date()]).nullable().optional(),
	lastEditedAt: z.union([z.string(), z.date()]).nullable().optional(),
	deleted: z.boolean().nullable().optional(),
	carbonRegistryType: z.string().nullable().optional(),
	carbonRegistry: z.string().nullable().optional(),
	employmentClaim: z.number().int().nullable().optional(),
	employmentClaimDescription: z.string().nullable().optional(),
	projectDateEnd: z.union([z.string(), z.date()]).nullable().optional(),
	projectDateStart: z.union([z.string(), z.date()]).nullable().optional(),
	registryId: z.string().nullable().optional(),
	isPublic: z.boolean().optional(),
});

export const WhatPageDataSchema = z.object({
	selectedProjectId: z.string().nullable(),
	selectedTable: z.string().nullable(),
	projects: z.array(WhatProjectSchema),
	availableTables: z.array(z.object({ tableName: z.string() })),
	tableData: z.array(z.record(z.string(), z.unknown())),
	tableCounts: z.record(z.string(), z.number().int()),
	error: z.string().nullable().optional(),
});

export type WhatPageData = z.infer<typeof WhatPageDataSchema>;
