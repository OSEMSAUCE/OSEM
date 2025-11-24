import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getProjects } from '../controllers/projectsController.js';
import { getLands } from '../controllers/landsController.js';
import { getPolygons } from '../controllers/polygonsController.js';

const router = Router();
const prisma = new PrismaClient();

// Generic handler for simple table queries
function createTableHandler(tableName: string) {
	return async (req: Request, res: Response): Promise<void> => {
		try {
			const { page = '1', pageSize = '100', ...filters } = req.query;
			const pageNum = Math.max(1, parseInt(page as string, 10));
			const pageSizeNum = Math.min(1000, Math.max(1, parseInt(pageSize as string, 10)));
			const skip = (pageNum - 1) * pageSizeNum;

			const where: any = { deleted: false };
			Object.keys(filters).forEach((key) => {
				if (filters[key]) where[key] = filters[key];
			});

			const table = (prisma as any)[tableName];
			const totalItems = await table.count({ where });
			const data = await table.findMany({ where, skip, take: pageSizeNum });

			res.json({
				data,
				pagination: {
					page: pageNum,
					pageSize: pageSizeNum,
					totalItems,
					totalPages: Math.ceil(totalItems / pageSizeNum)
				}
			});
		} catch (error) {
			console.error(`Error fetching ${tableName}:`, error);
			res.status(500).json({ error: 'Internal server error' });
		}
	};
}

/**
 * @openapi
 * /api/projects:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get all projects
 *     description: Returns a list of all active projects
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectsResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/projects', getProjects);

/**
 * @openapi
 * /api/lands:
 *   get:
 *     tags:
 *       - Lands
 *     summary: Get lands with pagination
 *     description: Returns a paginated list of land parcels with filtering and sorting capabilities
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter lands by project ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (starts at 1)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: landName
 *         description: Column to sort by (landName, projectName, hectares, etc.)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort direction
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for land name (case-insensitive contains)
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LandsResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/lands', getLands);

/**
 * @openapi
 * /api/polygons:
 *   get:
 *     tags:
 *       - Polygons
 *     summary: Get GeoJSON polygons
 *     description: Returns GeoJSON formatted polygon data for map visualization
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter polygons by project ID
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PolygonsResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/polygons', getPolygons);

// Schema/metadata endpoint - lists all columns for each table
router.get('/schema', (req: Request, res: Response) => {
	const schema = {
		projectTable: {
			endpoint: '/api/projects',
			columns: [
				{ name: 'projectId', type: 'string', key: true },
				{ name: 'projectName', type: 'string' },
				{ name: 'url', type: 'string' },
				{ name: 'platformId', type: 'string' },
				{ name: 'platform', type: 'string' },
				{ name: 'projectNotes', type: 'string' },
				{ name: 'createdAt', type: 'datetime' },
				{ name: 'lastEditedAt', type: 'datetime' },
				// { name: 'deleted', type: 'boolean' },
				{ name: 'carbonRegistryType', type: 'string' },
				{ name: 'carbonRegistry', type: 'string' },
				{ name: 'employmentClaim', type: 'number' },
				{ name: 'employmentClaimDescription', type: 'string' },
				{ name: 'projectDateEnd', type: 'datetime' },
				{ name: 'projectDateStart', type: 'datetime' },
				{ name: 'registryId', type: 'string' }
			]
		},
		landTable: {
			endpoint: '/api/lands',
			columns: [
				{ name: 'landId', type: 'string', key: true },
				{ name: 'landName', type: 'string' },
				{ name: 'projectId', type: 'string', foreignKey: 'projectTable' },
				{ name: 'hectares', type: 'number' },
				{ name: 'gpsLat', type: 'number' },
				{ name: 'gpsLon', type: 'number' },
				{ name: 'landNotes', type: 'string' },
				{ name: 'createdAt', type: 'datetime' },
				{ name: 'lastEditedAt', type: 'datetime' },
				{ name: 'treatmentType', type: 'string' },
				{ name: 'editedBy', type: 'string' },
				// { name: 'deleted', type: 'boolean' },
				{ name: 'preparation', type: 'string' }
			]
		},
		cropTable: {
			endpoint: '/api/crops',
			columns: [
				{ name: 'cropId', type: 'string', key: true },
				{ name: 'cropName', type: 'string' },
				{ name: 'projectId', type: 'string', foreignKey: 'projectTable' },
				{ name: 'speciesLocalName', type: 'string' },
				{ name: 'speciesId', type: 'string' },
				{ name: 'seedInfo', type: 'string' },
				{ name: 'cropStock', type: 'string' },
				{ name: 'createdAt', type: 'datetime' },
				{ name: 'lastEditedAt', type: 'datetime' },
				{ name: 'editedBy', type: 'string' },
				// { name: 'deleted', type: 'boolean' },
				{ name: 'organizationLocalName', type: 'string' },
				{ name: 'cropNotes', type: 'string' }
			]
		},
		plantingTable: {
			endpoint: '/api/plantings',
			columns: [
				{ name: 'plantingId', type: 'string', key: true },
				{ name: 'planted', type: 'number' },
				{ name: 'projectId', type: 'string', foreignKey: 'projectTable' },
				{ name: 'parentId', type: 'string' },
				{ name: 'parentType', type: 'string' },
				{ name: 'allocated', type: 'number' },
				{ name: 'plantingDate', type: 'datetime' },
				{ name: 'createdAt', type: 'datetime' },
				{ name: 'lastEditedAt', type: 'datetime' },
				// { name: 'deleted', type: 'boolean' },
				{ name: 'units', type: 'number' },
				{ name: 'unitType', type: 'string' },
				{ name: 'pricePerUnit', type: 'number' },
				{ name: 'currency', type: 'string' }
			]
		},
		speciesTable: {
			endpoint: '/api/species',
			columns: [
				{ name: 'speciesName', type: 'string', key: true },
				{ name: 'commonName', type: 'string' },
				{ name: 'scientificName', type: 'string' },
				{ name: 'type', type: 'string' },
				{ name: 'family', type: 'string' },
				{ name: 'reference', type: 'string' },
				{ name: 'createdAt', type: 'datetime' },
				{ name: 'lastEditedAt', type: 'datetime' },
				{ name: 'editedBy', type: 'string' }
				// { name: 'deleted', type: 'boolean' },
			]
		},
		polygonTable: {
			endpoint: '/api/polygon-data',
			columns: [
				{ name: 'polygonId', type: 'string', key: true },
				{ name: 'landId', type: 'string', foreignKey: 'landTable' },
				{ name: 'landName', type: 'string' },
				{ name: 'geometry', type: 'string' },
				{ name: 'coordinates', type: 'string' },
				{ name: 'type', type: 'string' },
				{ name: 'polygonNotes', type: 'string' },
				{ name: 'lastEditedAt', type: 'datetime' }
			]
		},
		polyTable: {
			endpoint: '/api/poly',
			columns: [
				{ name: 'polyId', type: 'string', key: true },
				{ name: 'parentId', type: 'string' },
				{ name: 'parentType', type: 'string' },
				{ name: 'projectId', type: 'string', foreignKey: 'projectTable' },
				{ name: 'randomJson', type: 'string' },
				{ name: 'survivalRate', type: 'number' },
				{ name: 'liabilityCause', type: 'string' },
				{ name: 'ratePerTree', type: 'number' },
				{ name: 'motivation', type: 'string' },
				{ name: 'restorationType', type: 'string' },
				{ name: 'reviews', type: 'string' },
				{ name: 'createdAt', type: 'datetime' },
				{ name: 'lastEditedAt', type: 'datetime' },
				{ name: 'editedBy', type: 'string' }
				// { name: 'deleted', type: 'boolean' },
			]
		},
		stakeholderTable: {
			endpoint: '/api/stakeholders',
			columns: [
				{ name: 'stakeholderId', type: 'string', key: true },
				{ name: 'organizationLocalId', type: 'string', foreignKey: 'organizationLocalTable' },
				{ name: 'parentId', type: 'string' },
				{ name: 'parentType', type: 'string' },
				{ name: 'projectId', type: 'string', foreignKey: 'projectTable' },
				{ name: 'stakeholderType', type: 'string' },
				{ name: 'lastEditedAt', type: 'datetime' },
				{ name: 'createdAt', type: 'datetime' }
			]
		},
		sourceTable: {
			endpoint: '/api/sources',
			columns: [
				{ name: 'sourceId', type: 'string', key: true },
				{ name: 'url', type: 'string' },
				{ name: 'urlType', type: 'string' },
				{ name: 'parentId', type: 'string' },
				{ name: 'parentType', type: 'string' },
				{ name: 'projectId', type: 'string', foreignKey: 'projectTable' },
				{ name: 'disclosureType', type: 'string' },
				{ name: 'sourceDescription', type: 'string' },
				{ name: 'sourceCredit', type: 'string' },
				{ name: 'lastEditedAt', type: 'datetime' },
				{ name: 'createdAt', type: 'datetime' }
			]
		},
		organizationLocalTable: {
			endpoint: '/api/organizations',
			columns: [
				{ name: 'organizationLocalId', type: 'string', key: true },
				{ name: 'organizationLocalName', type: 'string' },
				{ name: 'organizationMasterId', type: 'string', foreignKey: 'organizationMasterTable' },
				{ name: 'contactName', type: 'string' },
				{ name: 'contactEmail', type: 'string' },
				{ name: 'contactPhone', type: 'string' },
				{ name: 'address', type: 'string' },
				// { name: 'polyId', type: 'string' },
				{ name: 'website', type: 'string' },
				{ name: 'capacityPerYear', type: 'number' },
				{ name: 'organizationNotes', type: 'string' },
				{ name: 'createdAt', type: 'datetime' },
				{ name: 'lastEditedAt', type: 'datetime' },
				{ name: 'editedBy', type: 'string' },
				{ name: 'deleted', type: 'boolean' },
				{ name: 'gpsLat', type: 'number' },
				{ name: 'gpsLon', type: 'number' }
			]
		},
		organizationMasterTable: {
			endpoint: '/api/organizations-master',
			columns: [
				// { name: 'organizationMasterId', type: 'string', key: true },
				{ name: 'organizationMasterName', type: 'string' },
				{ name: 'organizationNotes', type: 'string' },
				// { name: 'createdAt', type: 'datetime' },
				{ name: 'lastEditedAt', type: 'datetime' }
				// { name: 'editedBy', type: 'string' },
				// { name: 'deleted', type: 'boolean' },
			]
		}
	};

	res.json(schema);
});

// Simple table endpoints - return all columns
router.get('/crops', createTableHandler('cropTable'));
router.get('/plantings', createTableHandler('plantingTable'));
router.get('/species', createTableHandler('speciesTable'));
router.get('/polygon-data', createTableHandler('polygonTable'));
router.get('/poly', createTableHandler('polyTable'));
router.get('/stakeholders', createTableHandler('stakeholderTable'));
router.get('/sources', createTableHandler('sourceTable'));
router.get('/organizations', createTableHandler('organizationLocalTable'));
router.get('/organizations-master', createTableHandler('organizationMasterTable'));

export default router;
