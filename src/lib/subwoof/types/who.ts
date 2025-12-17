import { z } from 'zod';

export {
	WhoOrganizationSchema,
	WhoPageDataSchema
} from '../../contracts/osem';

import {
	WhoOrganizationSchema,
	WhoPageDataSchema
} from '../../contracts/osem';

export type WhoPageData = z.infer<typeof WhoPageDataSchema>;
