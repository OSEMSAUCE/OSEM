import { z } from 'zod';

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
	updatedAt: z.union([z.string(), z.date()]).nullable().optional()
});

export const WhoPageDataSchema = z.object({
	organizations: z.array(WhoOrganizationSchema),
	error: z.string().optional()
});

export type WhoPageData = z.infer<typeof WhoPageDataSchema>;
