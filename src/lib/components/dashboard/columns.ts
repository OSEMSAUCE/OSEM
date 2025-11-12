import type { ColumnDef } from '@tanstack/table-core';

export type Project = {
	landName: string;
	projectName: string;
	platform: string;
	area: number;
};

export const columns: ColumnDef<Project>[] = [
	{
		accessorKey: 'landName',
		header: 'landName',
		cell: ({ row }) => {
			return `<div class="font-medium">${row.getValue('landName')}</div>`;
		}
	},
	{
		accessorKey: 'projectName',
		header: 'projectName',
		cell: ({ row }) => row.getValue('projectName')
	},
	{
		accessorKey: 'platform',
		header: 'platform',
		cell: ({ row }) => row.getValue('platform')
	}
];
