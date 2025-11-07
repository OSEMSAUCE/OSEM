import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Database from 'better-sqlite3';

// Database path - update this when data source changes
const DB_PATH = '/Users/chrisharris/Library/CloudStorage/Dropbox/DEV_PROJECTS/retreever/staging/staging.db';

interface PolygonRow {
	polygonId: string;
	landId: string;
	landName: string | null;
	geometry: string;
	type: string;
	polygonNotes: string | null;
}

interface GeoJSONFeature {
	type: 'Feature';
	id: string;
	geometry: {
		type: 'Polygon' | 'MultiPolygon';
		coordinates: number[][][] | number[][][][];
	};
	properties: {
		landId: string;
		landName: string | null;
		polygonId: string;
		polygonNotes: string | null;
	};
}

interface GeoJSONFeatureCollection {
	type: 'FeatureCollection';
	features: GeoJSONFeature[];
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

		// Transform to GeoJSON FeatureCollection
		const features: GeoJSONFeature[] = rows.map((row) => {
			// Parse the geometry string (it's stored as a JSON string)
			const coordinates = JSON.parse(row.geometry);

			return {
				type: 'Feature',
				id: row.polygonId,
				geometry: {
					type: row.type as 'Polygon' | 'MultiPolygon',
					coordinates: coordinates
				},
				properties: {
					landId: row.landId,
					landName: row.landName,
					polygonId: row.polygonId,
					polygonNotes: row.polygonNotes
				}
			};
		});

		const featureCollection: GeoJSONFeatureCollection = {
			type: 'FeatureCollection',
			features: features
		};

		// Close database
		db.close();

		// Return GeoJSON
		return json(featureCollection);
	} catch (error) {
		console.error('Error fetching polygons:', error);
		return json(
			{
				error: 'Failed to fetch polygons',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
