import { PUBLIC_API_URL } from '$env/static/public';
import { error } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';

export const _WhoOrgDetailPageDataSchema = z.object({
	org: z.unknown()
});

export const load: ServerLoad = async ({
	params,
	fetch
}: {
	params: Record<string, string>;
	fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>;
}) => {
	const { orgId } = params;

	try {
		const apiUrl = `${PUBLIC_API_URL.replace(/\/$/, '')}/api/who/${orgId}`;
		const response = await fetch(apiUrl);

		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, `Organization not found: ${orgId}`);
			}
			throw error(response.status, `API error: ${response.statusText}`);
		}

		const json = await response.json();
		const parsed = _WhoOrgDetailPageDataSchema.safeParse(json);
		if (!parsed.success) {
			console.error('OSEM org detail validation error:', parsed.error);
			throw error(502, 'API returned invalid organization payload');
		}
		return parsed.data;
	} catch (err) {
		console.error('OSEM org detail error:', err);
		if ((err as any).status) throw err;
		throw error(500, 'Failed to load organization from API');
	}
};
