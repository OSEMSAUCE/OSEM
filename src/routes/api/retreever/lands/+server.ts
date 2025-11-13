import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const RETREEVER_API_BASE = 'https://retreever-api.fly.dev/api';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const projectId = url.searchParams.get('projectId');

		if (!projectId) {
			return json({ error: 'projectId parameter is required' }, { status: 400 });
		}

		const response = await fetch(`${RETREEVER_API_BASE}/lands?projectId=${encodeURIComponent(projectId)}`);

		if (!response.ok) {
			throw new Error(`API responded with status ${response.status}`);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Error fetching lands from ReTreever API:', error);
		return json(
			{
				error: 'Failed to fetch lands',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
