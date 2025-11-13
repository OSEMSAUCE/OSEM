import type { ColumnDef } from '@tanstack/table-core';
import type { ProjectWithStats } from '$lib/types/project';

export const columns: ColumnDef<ProjectWithStats>[] = [
	{
		accessorKey: 'projectName',
		header: 'Project Name',
		cell: ({ row }) => row.getValue('projectName')
	},
	{
		accessorKey: 'landCount',
		header: 'Land Parcels',
		cell: ({ row }) => {
			const count = row.getValue('landCount') as number | undefined;
			return count !== undefined ? count.toString() : '0';
		}
	},
	{
		accessorKey: 'totalHectares',
		header: 'Total Area',
		cell: ({ row }) => {
			const hectares = row.getValue('totalHectares') as number | undefined;
			return hectares
				? `${hectares.toLocaleString('en-US', { maximumFractionDigits: 2 })} ha`
				: '0 ha';
		}
	},
	{
		accessorKey: 'platform',
		header: 'Platform',
		cell: ({ row }) => row.getValue('platform') || 'N/A'
	}
];
