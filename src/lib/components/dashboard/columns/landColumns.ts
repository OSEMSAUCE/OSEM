import type { Land } from '$lib/types/land';

type Column<T> = {
	key: keyof T;
	header: string;
	cell?: (row: T) => string;
};

export const columns: Column<Land>[] = [
	{
		key: 'landName',
		header: 'Land Name'
	},
	{
		key: 'projectName',
		header: 'Project',
		cell: (row) => row.projectName || 'N/A'
	},
	{
		key: 'hectares',
		header: 'Hectares',
		cell: (row) =>
			row.hectares ? row.hectares.toLocaleString('en-US', { maximumFractionDigits: 2 }) : 'N/A'
	},
	{
		key: 'treatmentType',
		header: 'Treatment Type',
		cell: (row) => row.treatmentType || 'N/A'
	},
	{
		key: 'preparation',
		header: 'Preparation',
		cell: (row) => row.preparation || 'N/A'
	}
];
