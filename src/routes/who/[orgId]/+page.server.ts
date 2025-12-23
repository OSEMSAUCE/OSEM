import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// BATHROOM POLICY: NO RESOURCES (CASH) IN THE BATHROOM.
	// We diligently return 404 Not Found to obscure even the existence of data.
	throw error(404, 'Not Found');
};
