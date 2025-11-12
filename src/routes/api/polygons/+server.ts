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
	hectares: number | null;
	projectName: string | null;
	platform: string | null;
	projectId: string | null;
}

interface StakeholderRow {
	organizationLocalName: string;
	stakeholderType: string | null;
}

interface GeoJSONFeature {
	type: 'Feature';
	id: string;
	geometry: {
		type: 'Polygon' | 'MultiPolygon';
		coordinates: number[][][] | number[][][][];
	};
	properties: {
		landName: string | null;
		projectName: string | null;
		platform: string | null;
		area: string | null; // e.g., "120.5 ha"
		stakeholders: string | null; // Comma-separated list
		notes: string | null;
		treesPlantedProject: number | null; // Project-level planting total
		treesPlantedLand: number | null; // Land-level planting total
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

		// Query polygons with JOINs to get related data
		const stmt = db.prepare(`
			SELECT
				p.polygonId,
				p.landId,
				p.landName,
				p.geometry,
				p.type,
				p.polygonNotes,
				l.hectares,
				l.projectId,
				pr.projectName,
				pr.platform
			FROM polygonTable p
			LEFT JOIN landTable l ON p.landId = l.landId
			LEFT JOIN projectTable pr ON l.projectId = pr.projectId
		`);
		const rows = stmt.all() as PolygonRow[];

		// Prepare stakeholder query
		const stakeholderStmt = db.prepare(`
			SELECT DISTINCT o.organizationLocalName, s.stakeholderType
			FROM stakeholderTable s
			JOIN organizationLocalTable o ON s.organizationLocalId = o.organizationLocalId
			WHERE s.parentId = ? OR s.projectId = ?
		`);

		// Prepare planting queries
		const projectPlantingStmt = db.prepare(`
			SELECT SUM(planted) as total
			FROM plantingTable
			WHERE projectId = ? AND parentType = 'projectTable' AND deleted = 0
		`);

		const landPlantingStmt = db.prepare(`
			SELECT SUM(planted) as total
			FROM plantingTable
			WHERE parentId = ? AND parentType = 'landTable' AND deleted = 0
		`);

		// Transform to GeoJSON FeatureCollection
		const features: GeoJSONFeature[] = rows.map((row) => {
			// Parse the geometry string (it's stored as a JSON string)
			const coordinates = JSON.parse(row.geometry);

			// Extract landName from landId if not present
			let landName = row.landName;
			if (!landName && row.landId.includes('landName:')) {
				const match = row.landId.match(/landName:([^|]+)/);
				if (match) {
					landName = match[1].trim();
				}
			}

			// Get stakeholders for this land/project
			const stakeholderRows = stakeholderStmt.all(
				row.landId,
				row.projectId
			) as StakeholderRow[];
			const stakeholders =
				stakeholderRows.length > 0
					? stakeholderRows.map((s) => s.organizationLocalName).join(', ')
					: null;

			// Get planting data for project and land
			const projectPlantingResult = row.projectId
				? (projectPlantingStmt.get(row.projectId) as { total: number | null } | undefined)
				: undefined;
			const landPlantingResult = landPlantingStmt.get(row.landId) as
				| { total: number | null }
				| undefined;

			const treesPlantedProject = projectPlantingResult?.total ?? null;
			const treesPlantedLand = landPlantingResult?.total ?? null;

			// Get area from database only - NO CALCULATIONS
			let area: string | null = null;
			if (row.hectares) {
				area = `${row.hectares.toFixed(1)} ha`;
			}

			const feature: GeoJSONFeature = {
				type: 'Feature',
				id: row.polygonId,
				geometry: {
					type: row.type as 'Polygon' | 'MultiPolygon',
					coordinates: coordinates
				},
				properties: {
					landName: landName,
					projectName: row.projectName,
					platform: row.platform,
					area: area,
					stakeholders: stakeholders,
					notes: row.polygonNotes,
					treesPlantedProject: treesPlantedProject,
					treesPlantedLand: treesPlantedLand
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
