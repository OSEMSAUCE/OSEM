import type { PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const projectIdParam = url.searchParams.get('project');
	const tableParam = url.searchParams.get('table');

	// Build query params
	const params = new URLSearchParams();
	if (projectIdParam) params.set('project', projectIdParam);
	if (tableParam) params.set('table', tableParam);

	// Use relative URL - SvelteKit's fetch handles this correctly on both server and client
	const apiUrl = `/api/what${params.toString() ? `?${params.toString()}` : ''}`;
	const response = await fetch(apiUrl);

	if (!response.ok) {
		throw new Error(`Failed to fetch what data: ${response.statusText}`);
	}

	const data = await response.json();
	return data;
};
