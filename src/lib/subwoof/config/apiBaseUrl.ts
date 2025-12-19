import { PUBLIC_API_URL } from '$env/static/public';

const normalizeBaseUrl = (raw: string): string => raw.trim().replace(/\/$/, '');

const canonicalizeRetreeverHost = (baseUrl: string): string => {
	let url: URL;
	try {
		url = new URL(baseUrl);
	} catch {
		throw new Error(`PUBLIC_API_URL must be a valid absolute URL. Got: ${baseUrl}`);
	}

	if (url.host === 'retreever.org') {
		url.host = 'www.retreever.org';
	}

	return url.toString().replace(/\/$/, '');
};

export const getApiBaseUrlOrThrow = (): string => {
	const raw = PUBLIC_API_URL;
	if (!raw) {
		throw new Error('PUBLIC_API_URL is required (set it in .env for local dev and in Vercel env vars for deployments).');
	}

	const normalized = normalizeBaseUrl(raw);
	return canonicalizeRetreeverHost(normalized);
};
