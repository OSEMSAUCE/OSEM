import type { PageLoad } from './$types';
import type { Land } from '$lib/types/land';
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

interface ProjectsAPIResponse {
	projects: Project[];
}

export const load: PageLoad = async ({ url }) => {
	// Get project ID from URL parameter
	const projectIdParam = url.searchParams.get('project');

	try {
		// Fetch all projects directly from ReTreever API
		console.log('Fetching projects from:', `${RETREEVER_API_BASE}/projects`);
		const projectsResponse = await fetch(`${RETREEVER_API_BASE}/projects`, {
			headers: {
				'Accept': 'application/json'
			}
		});

		if (!projectsResponse.ok) {
			const errorText = await projectsResponse.text();
			console.error('Failed to fetch projects:', projectsResponse.status, projectsResponse.statusText, errorText);
			return {
				projects: [],
				lands: [],
				selectedProjectId: null,
				error: `API error ${projectsResponse.status}: ${projectsResponse.statusText}`
			};
		}

		const projectsData: ProjectsAPIResponse = await projectsResponse.json();
		const projects = projectsData.projects || [];

		console.log('Fetched projects:', projects.length);

		// If no project specified in URL and we have projects, default to first one
		const selectedProjectId = projectIdParam || (projects.length > 0 ? projects[0].projectId : null);

		// Fetch lands for the selected project
		let lands: Land[] = [];
		if (selectedProjectId) {
			try {
				console.log('Fetching lands for project:', selectedProjectId);
				const landsResponse = await fetch(
					`${RETREEVER_API_BASE}/lands?projectId=${encodeURIComponent(selectedProjectId)}`,
					{
						headers: {
							'Accept': 'application/json'
						}
					}
				);

				if (landsResponse.ok) {
					const landsData: LandsAPIResponse = await landsResponse.json();
					lands = (landsData.data || []).map((land) => ({
						...land,
						// Flatten projectName for easier access
						projectName: land.projectTable?.projectName || ''
					}));
					console.log('Fetched lands:', lands.length);
				} else {
					const errorText = await landsResponse.text();
					console.error('Failed to fetch lands:', landsResponse.status, landsResponse.statusText, errorText);
				}
			} catch (error) {
				console.error('Error fetching lands:', error);
			}
		}

		return {
			projects,
			lands,
			selectedProjectId
		};
	} catch (error) {
		console.error('Error loading dashboard data:', error);
		return {
			projects: [],
			lands: [],
			selectedProjectId: null,
			error: error instanceof Error ? error.message : 'Unknown error loading data'
		};
	}
};
