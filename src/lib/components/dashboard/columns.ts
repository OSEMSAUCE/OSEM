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
		header: 'Land Name',
		cell: ({ row }) => {
			return `<div class="font-medium">${row.getValue('landName')}</div>`;
		}
	},
	{
		accessorKey: 'projectName',
		header: 'Project Name',
		cell: ({ row }) => row.getValue('projectName')
	},
	{
		accessorKey: 'platform',
		header: 'Platform',
		cell: ({ row }) => row.getValue('platform')
	},
	{
		accessorKey: 'area',
		header: 'Area (ha)',
		cell: ({ row }) => {
			const value = row.getValue('area') as number;
			return value.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ha';
		}
	}
];
