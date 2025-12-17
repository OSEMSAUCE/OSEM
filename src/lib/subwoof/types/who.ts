import { z } from 'zod';

import {
	WhoOrganizationSchema,
	WhoPageDataSchema
} from '../../contracts/zodSchemas';

export { WhoOrganizationSchema, WhoPageDataSchema };

export type WhoPageData = z.infer<typeof WhoPageDataSchema>;
