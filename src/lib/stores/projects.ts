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

		if ($filters.minArea !== undefined) {
			result = result.filter((p) => {
				// Parse hectares from "120.5 ha" format
				const hectaresStr = p.properties.hectares;
				if (!hectaresStr) return false;
				const hectaresNum = parseFloat(hectaresStr.replace(' ha', ''));
				return !isNaN(hectaresNum) && hectaresNum >= $filters.minArea!;
			});
		}

		if ($filters.maxArea !== undefined) {
			result = result.filter((p) => {
				// Parse hectares from "120.5 ha" format
				const hectaresStr = p.properties.hectares;
				if (!hectaresStr) return false;
				const hectaresNum = parseFloat(hectaresStr.replace(' ha', ''));
				return !isNaN(hectaresNum) && hectaresNum <= $filters.maxArea!;
			});
		}

		return result;
	}
);

// Selected project (for detail view)
export const selectedProject = writable<Project | null>(null);
