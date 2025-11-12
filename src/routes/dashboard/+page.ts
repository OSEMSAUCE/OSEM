import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const response = await fetch('/api/polygons');
	const data = await response.json();

	// Transform the polygon data to match our table structure
	const projects = data.features.map((feature: any) => ({
		landName: feature.properties.landName || 'Unknown',
		projectName: feature.properties.projectName || 'N/A',
		platform: feature.properties.platform || 'N/A',
		hectares: feature.properties.hectares || 0
		
	}));

	return {
		projects,
		
	};
};

// export const demo2 = "demo2";