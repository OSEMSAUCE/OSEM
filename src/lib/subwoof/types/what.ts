import { z } from 'zod';

export const AvailableTableSchema = z.object({
	tableName: z.string()
});

export const WhatPageDataSchema = z.object({
	selectedProjectId: z.string().nullable(),
	selectedTable: z.string().nullable(),
	projects: z.array(
		z.object({
			projectId: z.string(),
			projectName: z.string().nullable()
		})
	),
	availableTables: z.array(AvailableTableSchema),
	tableData: z.array(z.record(z.string(), z.unknown())),
	error: z.string().nullable().optional()
});

export type WhatPageData = z.infer<typeof WhatPageDataSchema>;
