import type { PageServerLoad } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const projectIdParam = url.searchParams.get('project');
	const tableParam = url.searchParams.get('table');

	// Build query params
	const params = new URLSearchParams();
	if (projectIdParam) params.set('project', projectIdParam);
	if (tableParam) params.set('table', tableParam);

	// Fetch directly from API server
	const apiUrl = `${PUBLIC_API_URL}/api/what${params.toString() ? `?${params.toString()}` : ''}`;
	const response = await fetch(apiUrl);

	if (!response.ok) {
		throw new Error(`Failed to fetch what data: ${response.statusText}`);
	}

	const data = await response.json();
	return data;
};
