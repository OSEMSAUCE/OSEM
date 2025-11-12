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
	// Land fields
	hectares: number | null;
	gpsLat: number | null;
	gpsLon: number | null;
	landNotes: string | null;
	treatmentType: string | null;
	preparation: string | null;
	// Project fields
	projectId: string | null;
	projectName: string | null;
	url: string | null;
	platform: string | null;
	projectNotes: string | null;
	carbonRegistryType: string | null;
	carbonRegistry: string | null;
	employmentClaim: number | null;
	employmentClaimDescription: string | null;
	projectDateEnd: string | null;
	projectDateStart: string | null;
	registryId: string | null;
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
		// Land properties
		landName: string | null;
		hectares: string | null;
		gpsLat: number | null;
		gpsLon: number | null;
		landNotes: string | null;
		treatmentType: string | null;
		preparation: string | null;
		treesPlantedLand: number | null;
		// Project properties
		projectName: string | null;
		url: string | null;
		platform: string | null;
		projectNotes: string | null;
		carbonRegistryType: string | null;
		carbonRegistry: string | null;
		employmentClaim: number | null;
		employmentClaimDescription: string | null;
		projectDateEnd: string | null;
		projectDateStart: string | null;
		registryId: string | null;
		treesPlantedProject: number | null;
		// Polygon properties
		polygonNotes: string | null;
		// Stakeholder properties
		stakeholders: string | null;
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
				-- Land table fields
				l.hectares,
				l.gpsLat,
				l.gpsLon,
				l.landNotes,
				l.treatmentType,
				l.preparation,
				l.projectId,
				-- Project table fields
				pr.projectName,
				pr.url,
				pr.platform,
				pr.projectNotes,
				pr.carbonRegistryType,
				pr.carbonRegistry,
				pr.employmentClaim,
				pr.employmentClaimDescription,
				pr.projectDateEnd,
				pr.projectDateStart,
				pr.registryId
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

			// Get hectares from database only - NO CALCULATIONS
			let hectares: string | null = null;
			if (row.hectares) {
				hectares = `${row.hectares.toFixed(1)} ha`;
			}

			const feature: GeoJSONFeature = {
				type: 'Feature',
				id: row.polygonId,
				geometry: {
					type: row.type as 'Polygon' | 'MultiPolygon',
					coordinates: coordinates
				},
				properties: {
					// Land properties
					landName: landName,
					hectares: hectares,
					gpsLat: row.gpsLat,
					gpsLon: row.gpsLon,
					landNotes: row.landNotes,
					treatmentType: row.treatmentType,
					preparation: row.preparation,
					treesPlantedLand: treesPlantedLand,
					// Project properties
					projectName: row.projectName,
					url: row.url,
					platform: row.platform,
					projectNotes: row.projectNotes,
					carbonRegistryType: row.carbonRegistryType,
					carbonRegistry: row.carbonRegistry,
					employmentClaim: row.employmentClaim,
					employmentClaimDescription: row.employmentClaimDescription,
					projectDateEnd: row.projectDateEnd,
					projectDateStart: row.projectDateStart,
					registryId: row.registryId,
					treesPlantedProject: treesPlantedProject,
					// Polygon properties
					polygonNotes: row.polygonNotes,
					// Stakeholder properties
					stakeholders: stakeholders
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
