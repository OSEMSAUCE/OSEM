import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const projectIdParam = url.searchParams.get('project');
	// Always fetch OrganizationLocalTable for this route
	const tableParam = 'OrganizationLocalTable';

	// Build query params
	const params = new URLSearchParams();
	if (projectIdParam) params.set('project', projectIdParam);
	params.set('table', tableParam);

	// Use relative URL - SvelteKit's fetch handles this correctly
	const apiUrl = `/api/who${params.toString() ? `?${params.toString()}` : ''}`;
	const response = await fetch(apiUrl);

	if (!response.ok) {
		throw new Error(`Failed to fetch what data: ${response.statusText}`);
	}

	const data = await response.json();

	// Return organizations directly
	return {
		organizations: data.organizations || []
	};
};
