import { PUBLIC_API_URL } from '$env/static/public';
import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({
	url,
	fetch
}: {
	url: URL;
	fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>;
}) => {
	const projectIdParam = url.searchParams.get('project');
	// Always fetch OrganizationLocalTable for this route
	const tableParam = 'OrganizationLocalTable';

	// Build query params
	const params = new URLSearchParams();
	if (projectIdParam) params.set('project', projectIdParam);
	params.set('table', tableParam);

	const apiUrl = `${PUBLIC_API_URL.replace(/\/$/, '')}/api/who${params.toString() ? `?${params.toString()}` : ''}`;
	const response = await fetch(apiUrl);

	if (!response.ok) {
		const body = await response.text().catch(() => '');
		throw new Error(
			`Failed to fetch who data (${response.status} ${response.statusText}) from ${apiUrl}${body ? `: ${body}` : ''}`
		);
	}

	const data = await response.json();

	// Return organizations directly
	return {
		organizations: data.organizations || []
	};
};
