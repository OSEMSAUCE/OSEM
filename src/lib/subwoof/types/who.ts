import { z } from 'zod';

export {
	WhoOrganizationSchema,
	WhoPageDataSchema
} from '../../contracts/zodSchemas';

import {
	WhoOrganizationSchema,
	WhoPageDataSchema
} from '../../contracts/zodSchemas';

export type WhoPageData = z.infer<typeof WhoPageDataSchema>;
