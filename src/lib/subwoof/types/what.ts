import { z } from 'zod';

export { WhatPageDataSchema } from '../../contracts/osem';
import { WhatPageDataSchema } from '../../contracts/osem';

export const AvailableTableSchema = z.object({
	tableName: z.string()
});

export type WhatPageData = z.infer<typeof WhatPageDataSchema>;
