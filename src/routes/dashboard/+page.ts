import type { PageLoad } from './$types';
import type { Land } from '$lib/types/land';

// GeoJSON Feature structure matching the /api/polygons response
interface GeoJSONFeature {
	id: string; // This is polygonId from your database
	properties: {
		projectId?: string;
		projectName?: string;
		landName?: string;
		hectares?: string;
		treatmentType?: string;
		preparation?: string;
		gpsLat?: number;
		gpsLon?: number;
	};
}

export const load: PageLoad = async ({ fetch }) => {
	const response = await fetch('/api/polygons');
	const data = await response.json();

	// Extract unique projects from the polygon data
	// Note: Your API doesn't return projectId in properties, only projectName
	// So we'll use projectName as the unique identifier for now
	const projectMap = new Map<string, { projectId: string; projectName: string }>();
	data.features.forEach((feature: GeoJSONFeature) => {
		const projectName = feature.properties.projectName;
		if (projectName && !projectMap.has(projectName)) {
			// Using projectName as projectId since API doesn't expose projectId
			projectMap.set(projectName, { projectId: projectName, projectName });
		}
	});
	const projects = Array.from(projectMap.values());

	// Transform GeoJSON features to Land objects
	const lands: Land[] = data.features.map((feature: GeoJSONFeature) => ({
		landId: feature.id, // This is polygonId from your database
		landName: feature.properties.landName || 'Unknown',
		projectId: feature.properties.projectName || '', // Using projectName as ID
		projectName: feature.properties.projectName || 'N/A',
		hectares: feature.properties.hectares
			? parseFloat(feature.properties.hectares.replace(' ha', ''))
			: undefined,
		treatmentType: feature.properties.treatmentType || undefined,
		preparation: feature.properties.preparation || undefined,
		gpsLat: feature.properties.gpsLat || undefined,
		gpsLon: feature.properties.gpsLon || undefined
	}));

	return {
		projects,
		lands
	};
};
