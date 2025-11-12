import type { ColumnDef } from '@tanstack/table-core';
import type { Crop } from '$lib/types/crop';

export const columns: ColumnDef<Crop>[] = [
	{
		accessorKey: 'cropName',
		header: 'Crop Name',
		cell: ({ row }) => row.getValue('cropName')
	},
	{
		accessorKey: 'projectName',
		header: 'Project',
		cell: ({ row }) => row.getValue('projectName') || 'N/A'
	},
	{
		accessorKey: 'speciesLocalName',
		header: 'Species (Local)',
		cell: ({ row }) => row.getValue('speciesLocalName') || 'N/A'
	},
	{
		accessorKey: 'seedInfo',
		header: 'Seed Info',
		cell: ({ row }) => row.getValue('seedInfo') || 'N/A'
	},
	{
		accessorKey: 'cropStock',
		header: 'Stock',
		cell: ({ row }) => row.getValue('cropStock') || 'N/A'
	}
];
