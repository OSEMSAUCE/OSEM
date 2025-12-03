import type { PageServerLoad } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const projectIdParam = url.searchParams.get('project');
	// Always fetch organizationLocalTable for this route
	const tableParam = 'organizationLocalTable';

	// Build query params
	const params = new URLSearchParams();
	if (projectIdParam) params.set('project', projectIdParam);
	params.set('table', tableParam);

	// Fetch directly from API server
	const apiUrl = `${PUBLIC_API_URL}/api/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
	const response = await fetch(apiUrl);

	if (!response.ok) {
		throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
	}

	const data = await response.json();

	// Return in the format the map page expects
	return {
		organizations: data.tableData || []
	};
};
