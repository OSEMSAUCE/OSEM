import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // BATHROOM POLICY: NO RESOURCES (CASH) IN THE BATHROOM.
    // We return empty data structures to prevent any public data leakage until strict filtering is assured.
    return {
        organizations: [],
        error: null
    };
};
