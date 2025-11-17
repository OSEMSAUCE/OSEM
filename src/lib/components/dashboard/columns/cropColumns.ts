import type { Crop } from '$lib/types/crop';

type Column<T> = {
	key: keyof T;
	header: string;
	cell?: (row: T) => string;
};

export const columns: Column<Crop>[] = [
	{
		key: 'cropName',
		header: 'Crop Name'
	},
	{
		key: 'projectName',
		header: 'Project',
		cell: (row) => row.projectName || 'N/A'
	},
	{
		key: 'speciesLocalName',
		header: 'Species (Local)',
		cell: (row) => row.speciesLocalName || 'N/A'
	},
	{
		key: 'seedInfo',
		header: 'Seed Info',
		cell: (row) => row.seedInfo || 'N/A'
	},
	{
		key: 'cropStock',
		header: 'Stock',
		cell: (row) => row.cropStock || 'N/A'
	}
];
