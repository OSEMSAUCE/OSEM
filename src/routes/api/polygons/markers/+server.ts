import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Database from 'better-sqlite3';
import * as turf from '@turf/turf';

// Database path - update this when data source changes
const DB_PATH =
	'/Users/chrisharris/Library/CloudStorage/Dropbox/DEV_PROJECTS/retreever/staging/staging.db';

interface PolygonRow {
	polygonId: string;
	landId: string;
	landName: string | null;
	geometry: string;
	type: string;
	polygonNotes: string | null;
}

interface MarkerFeature {
	type: 'Feature';
	id: string;
	geometry: {
		type: 'Point';
		coordinates: [number, number];
	};
	properties: {
		landId: string;
		landName: string | null;
		polygonId: string;
		polygonNotes: string | null;
	};
}

interface MarkerFeatureCollection {
	type: 'FeatureCollection';
	features: MarkerFeature[];
}

export const GET: RequestHandler = async () => {
	try {
		// Open database in read-only mode
		const db = new Database(DB_PATH, { readonly: true });

		// Query all polygons
		const stmt = db.prepare(`
			SELECT polygonId, landId, landName, geometry, type, polygonNotes
			FROM polygonTable
		`);
		const rows = stmt.all() as PolygonRow[];

		// Transform to Point features at centroids
		const features: MarkerFeature[] = rows
			.map((row) => {
				try {
					// Parse the geometry string
					const coordinates = JSON.parse(row.geometry);

					// Create temporary feature for centroid calculation
					const tempFeature = {
						type: 'Feature' as const,
						geometry: {
							type: row.type as 'Polygon' | 'MultiPolygon',
							coordinates: coordinates
						},
						properties: {}
					};

					// Calculate centroid
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const centroid = turf.centroid(tempFeature as any);

					return {
						type: 'Feature' as const,
						id: row.polygonId,
						geometry: {
							type: 'Point' as const,
							coordinates: centroid.geometry.coordinates as [number, number]
						},
						properties: {
							landId: row.landId,
							landName: row.landName,
							polygonId: row.polygonId,
							polygonNotes: row.polygonNotes
						}
					};
				} catch {
					// If anything fails, skip this feature
					return null;
				}
			})
			.filter((f): f is MarkerFeature => f !== null);

		const featureCollection: MarkerFeatureCollection = {
			type: 'FeatureCollection',
			features: features
		};

		// Close database
		db.close();

		// Return GeoJSON
		return json(featureCollection);
	} catch (error) {
		console.error('Error fetching markers:', error);
		return json(
			{
				error: 'Failed to fetch markers',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
