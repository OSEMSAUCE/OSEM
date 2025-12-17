import { z } from 'zod';

export { WhatPageDataSchema } from '../../contracts/zodSchemas';
import { WhatPageDataSchema } from '../../contracts/zodSchemas';

export const AvailableTableSchema = z.object({
	tableName: z.string()
});

export type WhatPageData = z.infer<typeof WhatPageDataSchema>;
