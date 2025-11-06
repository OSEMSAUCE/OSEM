// API client for fetching project data
import type { Project, MapBounds } from '$lib/types/project';

/**
 * Fetch projects from the API
 * TODO: Connect to treevr database
 */
export async function fetchProjects(
	bounds?: MapBounds,
	isAuthenticated: boolean = false
): Promise<Project[]> {
	// For now, return empty array
	// In the future, this will fetch from treevr
	const limit = isAuthenticated ? 10000 : 100;

	console.log('Fetching projects', { bounds, limit });

	// Placeholder for future API implementation
	return [];
}

/**
 * Fetch a single project by ID
 */
export async function fetchProject(id: string): Promise<Project | null> {
	console.log('Fetching project', id);
	// TODO: Implement
	return null;
}
