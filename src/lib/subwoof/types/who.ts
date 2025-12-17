import { z } from 'zod';
import { OrganizationLocalTableSchema } from '$generated/zod-prisma-types';

export const WhoOrganizationSchema = OrganizationLocalTableSchema.partial();

export const WhoPageDataSchema = z.object({
	organizations: z.array(WhoOrganizationSchema),
	error: z.string().optional()
});

export type WhoPageData = z.infer<typeof WhoPageDataSchema>;
