import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const RETREEVER_API_BASE = 'https://retreever-api.fly.dev/api';

export const GET: RequestHandler = async () => {
	try {
		const response = await fetch(`${RETREEVER_API_BASE}/projects`);

		if (!response.ok) {
			throw new Error(`API responded with status ${response.status}`);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Error fetching projects from ReTreever API:', error);
		return json(
			{
				error: 'Failed to fetch projects',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
