import type { Planting } from '$lib/types/planting';

type Column<T> = {
	key: keyof T;
	header: string;
	cell?: (row: T) => string;
};

export const columns: Column<Planting>[] = [
	{
		key: 'plantingDate',
		header: 'Planting Date',
		cell: (row) => {
			if (!row.plantingDate) return 'N/A';
			return new Date(row.plantingDate).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		}
	},
	{
		key: 'projectName',
		header: 'Project',
		cell: (row) => row.projectName || 'N/A'
	},
	{
		key: 'landName',
		header: 'Land',
		cell: (row) => row.landName || 'N/A'
	},
	{
		key: 'cropName',
		header: 'Crop',
		cell: (row) => row.cropName || 'N/A'
	},
	{
		key: 'planted',
		header: 'Planted',
		cell: (row) => (row.planted ? row.planted.toLocaleString('en-US') : 'N/A')
	},
	{
		key: 'units',
		header: 'Units',
		cell: (row) => {
			if (!row.units) return 'N/A';
			return `${row.units.toLocaleString('en-US')} ${row.unitType || ''}`.trim();
		}
	}
];
