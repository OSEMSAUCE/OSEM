import { PUBLIC_API_URL } from '$env/static/public';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { orgId } = params;

	try {
		const apiUrl = `${PUBLIC_API_URL}/api/dashboard/orgs/${orgId}`;
		console.log('OSEM fetching org from:', apiUrl);

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
