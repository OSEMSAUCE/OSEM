import type { ColumnDef } from '@tanstack/table-core';
import type { Planting } from '$lib/types/planting';

export const columns: ColumnDef<Planting>[] = [
	{
		accessorKey: 'plantingDate',
		header: 'Planting Date',
		cell: ({ row }) => {
			const date = row.getValue('plantingDate') as string | undefined;
			if (!date) return 'N/A';
			return new Date(date).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		}
	},
	{
		accessorKey: 'projectName',
		header: 'Project',
		cell: ({ row }) => row.getValue('projectName') || 'N/A'
	},
	{
		accessorKey: 'landName',
		header: 'Land',
		cell: ({ row }) => row.getValue('landName') || 'N/A'
	},
	{
		accessorKey: 'cropName',
		header: 'Crop',
		cell: ({ row }) => row.getValue('cropName') || 'N/A'
	},
	{
		accessorKey: 'planted',
		header: 'Planted',
		cell: ({ row }) => {
			const planted = row.getValue('planted') as number | undefined;
			return planted ? planted.toLocaleString('en-US') : 'N/A';
		}
	},
	{
		accessorKey: 'units',
		header: 'Units',
		cell: ({ row }) => {
			const units = row.getValue('units') as number | undefined;
			const unitType = row.original.unitType;
			if (!units) return 'N/A';
			return `${units.toLocaleString('en-US')} ${unitType || ''}`.trim();
		}
	}
];
