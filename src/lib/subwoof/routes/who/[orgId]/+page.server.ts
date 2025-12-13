import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { orgId } = params;

	try {
		// Use relative URL - SvelteKit's fetch handles this correctly
		const apiUrl = `/api/who/${orgId}`;
		const response = await fetch(apiUrl);

		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, `Organization not found: ${orgId}`);
			}
			throw error(response.status, `API error: ${response.statusText}`);
		}

		const data = await response.json();
		return data;
	} catch (err) {
		console.error('OSEM org detail error:', err);
		if ((err as any).status) throw err;
		throw error(500, 'Failed to load organization from API');
	}
};
