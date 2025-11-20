import type { PageServerLoad } from './$types';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

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

		// Fetch projects from ReTreever API (no database credentials needed!)
		const projectsResponse = await fetch(`${API_BASE_URL}/api/projects`);
		if (!projectsResponse.ok) {
			throw new Error('Failed to fetch projects from API');
		}
		const projectsData = await projectsResponse.json();
		const projects = projectsData.data.map((p: { projectId: string; projectName: string }) => ({
			projectId: p.projectId,
			projectName: p.projectName
		}));

		let selectedProjectId = projectIdParam;
		let selectedTable = tableParam;

		const validTableNames = new Set<string>([
			'ProjectTable',
			...availableTables.map((t) => t.tableName)
		]);

		if (!selectedTable || !validTableNames.has(selectedTable)) {
			selectedTable = 'ProjectTable';
			selectedProjectId = null;
		}

		if (!selectedProjectId && !selectedTable) {
			selectedTable = 'ProjectTable';
		} else if (!selectedProjectId && selectedTable && selectedTable !== 'ProjectTable') {
			selectedProjectId = projects[0]?.projectId || null;
			selectedTable = 'LandTable';
		} else if (selectedProjectId && !selectedTable) {
			selectedTable = 'LandTable';
		}

		let tableData: unknown[] = [];

		// Fetch table data from ReTreever API
		if (selectedTable === 'ProjectTable') {
			const response = await fetch(`${API_BASE_URL}/api/projects`);
			if (response.ok) {
				const data = await response.json();
				tableData = data.data;
			}
		} else if (selectedProjectId && selectedTable === 'LandTable') {
			const response = await fetch(`${API_BASE_URL}/api/lands?projectId=${selectedProjectId}`);
			if (response.ok) {
				const data = await response.json();
				tableData = data.data;
			}
		} else if (selectedProjectId && selectedTable === 'CropTable') {
			const response = await fetch(`${API_BASE_URL}/api/crops?projectId=${selectedProjectId}`);
			if (response.ok) {
				const data = await response.json();
				tableData = data.data;
			}
		} else if (selectedProjectId && selectedTable === 'PlantingTable') {
			const response = await fetch(`${API_BASE_URL}/api/plantings?projectId=${selectedProjectId}`);
			if (response.ok) {
				const data = await response.json();
				tableData = data.data;
			}
		} else if (selectedProjectId && selectedTable === 'PolyTable') {
			const response = await fetch(`${API_BASE_URL}/api/poly?projectId=${selectedProjectId}`);
			if (response.ok) {
				const data = await response.json();
				tableData = data.data;
			}
		} else if (selectedProjectId && selectedTable === 'StakeholderTable') {
			const response = await fetch(
				`${API_BASE_URL}/api/stakeholders?projectId=${selectedProjectId}`
			);
			if (response.ok) {
				const data = await response.json();
				tableData = data.data;
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
