import type { PageServerLoad } from './$types';
import { apiClient } from '$lib/apiClient';

// Define types for our API responses
type Project = {
	projectId: string;
	projectName: string;
};

type TableData = {
	id: string;
	[key: string]: any;
};

export const load: PageServerLoad = async ({ url }) => {
	const projectIdParam = url.searchParams.get('project');
	const tableParam = url.searchParams.get('table');

	try {
		const availableTables = [
			{ tableName: 'LandTable' },
			{ tableName: 'CropTable' },
			{ tableName: 'PlantingTable' },
			{ tableName: 'PolyTable' },
			{ tableName: 'StakeholderTable' }
		];

		// Fetch projects from the API
		const projects: Project[] = await apiClient.get('/api/projects');

		let selectedProjectId = projectIdParam;
		let selectedTable = tableParam;
		let tableData: TableData[] = [];

		const validTableNames = new Set<string>([
			'ProjectTable',
			...availableTables.map((t) => t.tableName)
		]);

		// If no table is selected or it's invalid, default to ProjectTable
		if (!selectedTable || !validTableNames.has(selectedTable)) {
			selectedTable = 'ProjectTable';
			selectedProjectId = null;
		}

		// If no project is selected but we need one, try to use the first available project
		if (!selectedProjectId && selectedTable !== 'ProjectTable') {
			selectedProjectId = projects[0]?.projectId || null;
			if (!selectedProjectId) {
				selectedTable = 'ProjectTable';
			}
		}

		// If we have a selected project and table, fetch the data
		if (selectedTable === 'ProjectTable') {
			// For the projects table, we already have the data
			tableData = projects.map((p) => ({
				id: p.projectId,
				name: p.projectName,
				...p
			}));
		} else if (selectedProjectId) {
			// For other tables, fetch the data from the API
			try {
				const endpoint = `/api/${selectedTable.toLowerCase().replace('table', 's')}`;
				const queryParams = new URLSearchParams({
					projectId: selectedProjectId,
					limit: '100' // Adjust the limit as needed
				});

				const response = await apiClient.get(`${endpoint}?${queryParams}`);
				tableData = Array.isArray(response) ? response : [];
			} catch (error) {
				console.error(`Error fetching ${selectedTable}:`, error);
				tableData = [];
			}
		}

		return {
			projects,
			tableData,
			availableTables,
			selectedProjectId,
			selectedTable
		};
	} catch (error) {
		console.error('Dashboard error:', error);
		return {
			projects: [],
			tableData: [],
			availableTables: [],
			selectedProjectId: null,
			selectedTable: null,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
};
