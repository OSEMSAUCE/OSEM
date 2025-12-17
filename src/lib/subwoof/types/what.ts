import { z } from 'zod';

import { WhatPageDataSchema } from '../../contracts/zodSchemas';

export const AvailableTableSchema = z.object({
	tableName: z.string()
});

export { WhatPageDataSchema };
export type WhatPageData = z.infer<typeof WhatPageDataSchema>;