// For server-side usage (in +page.server.ts files)
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

// For client-side usage (in +page.svelte files)
const getApiBaseUrl = () => {
	if (typeof window !== 'undefined') {
		return import.meta.env.VITE_API_URL || 'http://localhost:3001';
	}
	return API_BASE_URL;
};

export const apiClient = {
	async get(endpoint: string, options: RequestInit = {}) {
		const baseUrl = getApiBaseUrl();
		const response = await fetch(`${baseUrl}${endpoint}`, {
			...options,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			credentials: 'include'
		});

		if (!response.ok) {
			const error = await response.text().catch(() => 'API request failed');
			throw new Error(error || 'API request failed');
		}

		return response.json();
	}

	// Add other HTTP methods as needed (POST, PUT, DELETE, etc.)
};

export default apiClient;
