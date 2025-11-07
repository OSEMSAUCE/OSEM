import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Database from 'better-sqlite3';
import * as turf from '@turf/turf';

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
		centroid?: [number, number]; // [lng, lat]
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

			const feature: GeoJSONFeature = {
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

			// Calculate centroid for the polygon
			try {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const centroid = turf.centroid(feature as any);
				feature.properties.centroid = centroid.geometry.coordinates as [number, number];
			} catch {
				// If centroid calculation fails, use first coordinate as fallback
				if (row.type === 'Polygon' && coordinates[0]?.[0]) {
					feature.properties.centroid = [coordinates[0][0][0], coordinates[0][0][1]];
				} else if (row.type === 'MultiPolygon' && coordinates[0]?.[0]?.[0]) {
					feature.properties.centroid = [coordinates[0][0][0][0], coordinates[0][0][0][1]];
				}
			}

			return feature;
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
