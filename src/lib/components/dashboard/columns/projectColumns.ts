import type { ProjectWithStats } from '$lib/types/project';

type Column<T> = {
	key: keyof T;
	header: string;
	cell?: (row: T) => string;
};

export const columns: Column<ProjectWithStats>[] = [
	{
		key: 'projectName',
		header: 'Project Name'
	},
	{
		key: 'landCount',
		header: 'Land Parcels',
		cell: (row) => (row.landCount !== undefined ? row.landCount.toString() : '0')
	},
	{
		key: 'totalHectares',
		header: 'Total Area',
		cell: (row) =>
			row.totalHectares
				? `${row.totalHectares.toLocaleString('en-US', { maximumFractionDigits: 2 })} ha`
				: '0 ha'
	},
	{
		key: 'platform',
		header: 'Platform',
		cell: (row) => row.platform || 'N/A'
	}
];
