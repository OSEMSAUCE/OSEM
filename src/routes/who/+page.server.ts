import { PUBLIC_API_URL } from '$env/static/public';
import type { ServerLoad } from '@sveltejs/kit';
import { WhoPageDataSchema } from '../../types/who';

export const load: ServerLoad = async ({
	url,
	fetch
}: {
	url: URL;
	fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>;
}) => {
	const projectIdParam = url.searchParams.get('project');
	// Build query params
	// NOTE: /api/who currently does not accept query params; keep this ready for future filtering.
	const params = new URLSearchParams();
	if (projectIdParam) params.set('project', projectIdParam);

	const apiUrl = `${PUBLIC_API_URL.replace(/\/$/, '')}/api/who${params.toString() ? `?${params.toString()}` : ''}`;
	const response = await fetch(apiUrl);

	if (!response.ok) {
		const body = await response.text().catch(() => '');
		throw new Error(
			`Failed to fetch who data (${response.status} ${response.statusText}) from ${apiUrl}${body ? `: ${body}` : ''}`
		);
	}

	const json = await response.json();
	const parsed = WhoPageDataSchema.safeParse(json);
	if (!parsed.success) {
		throw new Error(
			`Who page response did not match schema from ${apiUrl}: ${parsed.error.message}`
		);
	}
	return parsed.data;
};
