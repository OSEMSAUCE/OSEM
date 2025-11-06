// Svelte store for project data and filters
import { writable, derived } from 'svelte/store';
import type { Project, ProjectFilter } from '$lib/types/project';

// All loaded projects
export const projects = writable<Project[]>([]);

// Active filters
export const filters = writable<ProjectFilter>({});

// Filtered projects based on active filters
export const filteredProjects = derived(
	[projects, filters],
	([$projects, $filters]) => {
		let result = $projects;

		if ($filters.searchQuery) {
			const query = $filters.searchQuery.toLowerCase();
			result = result.filter(
				(p) =>
					p.name.toLowerCase().includes(query) ||
					p.description?.toLowerCase().includes(query)
			);
		}

		if ($filters.country) {
			result = result.filter((p) => p.properties.country === $filters.country);
		}

		if ($filters.projectType) {
			result = result.filter((p) => p.properties.projectType === $filters.projectType);
		}

		if ($filters.minArea !== undefined) {
			result = result.filter((p) => (p.properties.areaHectares ?? 0) >= $filters.minArea!);
		}

		if ($filters.maxArea !== undefined) {
			result = result.filter((p) => (p.properties.areaHectares ?? 0) <= $filters.maxArea!);
		}

		return result;
	}
);

// Selected project (for detail view)
export const selectedProject = writable<Project | null>(null);
