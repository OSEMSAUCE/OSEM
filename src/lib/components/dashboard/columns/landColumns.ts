import type { ColumnDef } from '@tanstack/table-core';
import type { Land } from '$lib/types/land';

export const columns: ColumnDef<Land>[] = [
	{
		accessorKey: 'landName',
		header: 'Land Name',
		cell: ({ row }) => row.getValue('landName')
	},
	{
		accessorKey: 'projectName',
		header: 'Project',
		cell: ({ row }) => row.getValue('projectName') || 'N/A'
	},
	{
		accessorKey: 'hectares',
		header: 'Hectares',
		cell: ({ row }) => {
			const hectares = row.getValue('hectares') as number | undefined;
			return hectares ? hectares.toLocaleString('en-US', { maximumFractionDigits: 2 }) : 'N/A';
		}
	},
	{
		accessorKey: 'treatmentType',
		header: 'Treatment Type',
		cell: ({ row }) => row.getValue('treatmentType') || 'N/A'
	},
	{
		accessorKey: 'preparation',
		header: 'Preparation',
		cell: ({ row }) => row.getValue('preparation') || 'N/A'
	}
];
