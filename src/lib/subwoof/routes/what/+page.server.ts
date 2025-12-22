import { PUBLIC_API_URL } from '$env/static/public';
import type { ServerLoad } from '@sveltejs/kit';
import { WhatPageDataSchema } from '../../types/what';


export const load: ServerLoad = async ({
	url,
	fetch
}: {
	url: URL;
	fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>;
}) => {
	const projectIdParam = url.searchParams.get('project');
	const tableParam = url.searchParams.get('table');

	// Build query params
	const params = new URLSearchParams();
	
	if (projectIdParam) params.set('project', projectIdParam);
	if (tableParam) params.set('table', tableParam);

	// OSEM calls ReTreever's API (no PIN, subject to denylist)
	const apiUrl = `${PUBLIC_API_URL.replace(/\/$/, '')}/api/what${params.toString() ? `?${params.toString()}` : ''}`;
	console.log(`🔧 [OSEM Load] Fetching from ReTreever API: ${apiUrl}`);
	// this calls to OSEM's version of the what endpoint 22 Dec 2025 
	// - FIND WHERE THIS FETCH IS. thats where the limiter is. 
	const response = await fetch(apiUrl);

	if (!response.ok) {
		const body = await response.text().catch(() => '');
		throw new Error(
			`Failed to fetch what data (${response.status} ${response.statusText}) from ${apiUrl}${body ? `: ${body}` : ''}`
		);
	}

	const json = await response.json();
	const parsed = WhatPageDataSchema.safeParse(json);
	if (!parsed.success) {
		console.error('OSEM what page validation error:', parsed.error);
		throw new Error('API returned invalid what payload');
	}
	return parsed.data;
};
