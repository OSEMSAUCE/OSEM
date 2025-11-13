import type { PageLoad } from './$types';
import type { Land } from '$lib/types/land';
import type { Crop } from '$lib/types/crop';
import type { Planting } from '$lib/types/planting';
import type { Project } from '$lib/types/project';

// Disable SSR to fix bits-ui portal issue
export const ssr = false;

// baseURL
const RETREEVER_API_BASE = 'https://retreever-api.fly.dev/api';

interface LandsAPIResponse {
	data: Land[];
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
}

interface CropsAPIResponse {
	data: Crop[];
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
}

interface PlantingsAPIResponse {
	data: Planting[];
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
}

interface ProjectsAPIResponse {
	projects: Project[];
}

interface SchemaTable {
	endpoint: string;
	columns: Array<{
		name: string;
		type: string;
		key?: boolean;
		foreignKey?: string;
	}>;
}

interface SchemaResponse {
	[tableName: string]: SchemaTable;
}

export const load: PageLoad = async ({ url }) => {
	// Get project ID and table name from URL parameters
	const projectIdParam = url.searchParams.get('project');
	const tableParam = url.searchParams.get('table');

	try {
		// Fetch schema to get available tables
		console.log('Fetching schema from:', `${RETREEVER_API_BASE}/schema`);
		let availableTables: Array<{ tableName: string; endpoint: string }> = [];
		try {
			const schemaResponse = await fetch(`${RETREEVER_API_BASE}/schema`, {
				headers: {
					Accept: 'application/json'
				}
			});
			if (schemaResponse.ok) {
				const schema: SchemaResponse = await schemaResponse.json();
				// Filter tables that have projectId in their columns (tables that can be filtered by project)
				availableTables = Object.entries(schema)
					.filter(([_, tableInfo]) => tableInfo.columns.some((col) => col.name === 'projectId'))
					.map(([tableName, tableInfo]) => ({
						tableName,
						endpoint: tableInfo.endpoint
					}));
				console.log('Available tables:', availableTables);
			}
		} catch (schemaError) {
			console.error('Error fetching schema:', schemaError);
		}

		// Fetch all projects directly from ReTreever API
		console.log('Fetching projects from:', `${RETREEVER_API_BASE}/projects`);
		const projectsResponse = await fetch(`${RETREEVER_API_BASE}/projects`, {
			headers: {
				Accept: 'application/json'
			}
		});

		if (!projectsResponse.ok) {
			const errorText = await projectsResponse.text();
			console.error(
				'Failed to fetch projects:',
				projectsResponse.status,
				projectsResponse.statusText,
				errorText
			);
			return {
				projects: [],
				tableData: [],
				availableTables,
				selectedProjectId: null,
				selectedTable: null,
				error: `API error ${projectsResponse.status}: ${projectsResponse.statusText}`
			};
		}

		const projectsData: ProjectsAPIResponse = await projectsResponse.json();
		const projects = projectsData.projects || [];

		console.log('Fetched projects:', projects.length);

		// Only set defaults if no project is specified
		const selectedProjectId = projectIdParam;
		const selectedTable = tableParam;

		// Fetch data for the selected table and project
		let tableData: any[] = [];
		if (selectedProjectId && selectedTable) {
			try {
				// Find the endpoint for the selected table from schema
				const tableInfo = availableTables.find((t) => t.tableName === selectedTable);
				if (!tableInfo) {
					console.error('Unknown table:', selectedTable);
					return {
						projects,
						tableData: [],
						availableTables,
						selectedProjectId,
						selectedTable,
						error: `Unknown table: ${selectedTable}`
					};
				}

				const endpoint = `${RETREEVER_API_BASE}${tableInfo.endpoint.replace('/api', '')}?projectId=${encodeURIComponent(selectedProjectId)}`;

				console.log(`Fetching ${selectedTable} for project:`, selectedProjectId);
				const dataResponse = await fetch(endpoint, {
					headers: {
						Accept: 'application/json'
					}
				});

				if (dataResponse.ok) {
					const responseData: LandsAPIResponse | CropsAPIResponse | PlantingsAPIResponse =
						await dataResponse.json();
					tableData = responseData.data || [];

					// Flatten projectName for easier access
					const selectedProject = projects.find((p) => p.projectId === selectedProjectId);
					if (selectedTable === 'landTable') {
						tableData = tableData.map((item: any) => ({
							...item,
							projectName: item.projectTable?.projectName || selectedProject?.projectName || ''
						}));
					}

					console.log(`Fetched ${selectedTable}:`, tableData.length);
				} else {
					const errorText = await dataResponse.text();
					console.error(
						`Failed to fetch ${selectedTable}:`,
						dataResponse.status,
						dataResponse.statusText,
						errorText
					);
				}
			} catch (error) {
				console.error(`Error fetching ${selectedTable}:`, error);
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
		console.error('Error loading dashboard data:', error);
		return {
			projects: [],
			tableData: [],
			availableTables: [],
			selectedProjectId: null,
			selectedTable: null,
			error: error instanceof Error ? error.message : 'Unknown error loading data'
		};
	}
};
