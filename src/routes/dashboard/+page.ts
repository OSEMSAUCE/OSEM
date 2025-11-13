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

export const load: PageLoad = async ({ url }) => {
	// Get project ID and table name from URL parameters
	const projectIdParam = url.searchParams.get('project');
	const tableParam = url.searchParams.get('table');

	try {
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
				let endpoint = '';
				switch (selectedTable) {
					case 'lands':
						endpoint = `${RETREEVER_API_BASE}/lands?projectId=${encodeURIComponent(selectedProjectId)}`;
						break;
					case 'crops':
						endpoint = `${RETREEVER_API_BASE}/crops?projectId=${encodeURIComponent(selectedProjectId)}`;
						break;
					case 'plantings':
						endpoint = `${RETREEVER_API_BASE}/plantings?projectId=${encodeURIComponent(selectedProjectId)}`;
						break;
					default:
						console.error('Unknown table:', selectedTable);
						return {
							projects,
							tableData: [],
							selectedProjectId,
							selectedTable,
							error: `Unknown table: ${selectedTable}`
						};
				}

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
					if (selectedTable === 'lands') {
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
			selectedProjectId,
			selectedTable
		};
	} catch (error) {
		console.error('Error loading dashboard data:', error);
		return {
			projects: [],
			tableData: [],
			selectedProjectId: null,
			selectedTable: null,
			error: error instanceof Error ? error.message : 'Unknown error loading data'
		};
	}
};
