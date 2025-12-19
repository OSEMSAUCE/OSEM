import type { ServerLoad } from '@sveltejs/kit';
import { WhoPageDataSchema } from '../../types/who';
import { getApiBaseUrlOrThrow } from '../../config/apiBaseUrl';

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

	const apiBaseUrl = getApiBaseUrlOrThrow();
	const apiUrl = `${apiBaseUrl}/api/who${params.toString() ? `?${params.toString()}` : ''}`;
	const response = await fetch(apiUrl);

	if (!response.ok) {
		const body = await response.text().catch(() => '');
		throw new Error(
			`Failed to fetch who data (${response.status} ${response.statusText}) from ${apiUrl}${body ? `: ${body}` : ''}`
		);
	}

	const json = await response.json();
	return WhoPageDataSchema.parse(json);
};
