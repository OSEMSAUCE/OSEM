import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

type GeoJSONFeature = {
	type: 'Feature';
	id: string;
	geometry: {
		type: 'Polygon' | 'MultiPolygon';
		coordinates: number[][][] | number[][][][];
	};
	properties: Record<string, any>;
};

const prisma = new PrismaClient();

// Helper function to calculate centroid
function calculateCentroid(coordinates: number[][][] | number[][][][]): [number, number] | null {
	try {
		let allPoints: number[][] = [];

		// Flatten coordinates to get all points
		if (Array.isArray(coordinates[0][0][0])) {
			// MultiPolygon
			const multiPoly = coordinates as number[][][][];
			multiPoly.forEach((polygon) => {
				polygon[0].forEach((point) => allPoints.push(point));
			});
		} else {
			// Polygon
			const polygon = coordinates as number[][][];
			allPoints = polygon[0];
		}

		const sum = allPoints.reduce(
			(acc, point) => {
				return [acc[0] + point[0], acc[1] + point[1]];
			},
			[0, 0]
		);

		return [sum[0] / allPoints.length, sum[1] / allPoints.length];
	} catch (error) {
		console.error('Error calculating centroid:', error);
		return null;
	}
}

export async function getPolygons(req: Request, res: Response): Promise<void> {
	try {
		const { projectId } = req.query;

		// Build where clause for lands
		const landWhere: any = {
			deleted: false
		};

		if (projectId) {
			landWhere.projectId = projectId as string;
		}

		// Get all lands with their polygons
		const lands = await prisma.landTable.findMany({
			where: landWhere,
			include: {
				projectTable: {
					select: {
						projectId: true,
						projectName: true
					}
				},
				polygonTable: {
					where: {
						geometry: {
							not: null
						}
					}
				}
			}
		});

		// Build GeoJSON features
		const features: GeoJSONFeature[] = [];

		for (const land of lands) {
			// Get stakeholders for the project (for display purposes)
			const stakeholders = await prisma.stakeholderTable.findMany({
				where: {
					projectId: land.projectId
				},
				include: {
					organizationLocalTable: {
						select: {
							organizationLocalName: true
						}
					}
				}
			});

			const stakeholderNames = stakeholders
				.map((s) => s.organizationLocalTable?.organizationLocalName)
				.filter(Boolean)
				.join(', ');

			// Process each polygon for this land
			for (const polygon of land.polygonTable) {
				if (!polygon.geometry) continue;

				try {
					const geometryObj = JSON.parse(polygon.geometry);
					const coordinates = geometryObj.coordinates || JSON.parse(polygon.coordinates || '[]');
					const centroid = calculateCentroid(coordinates);

					const feature: GeoJSONFeature = {
						type: 'Feature',
						id: polygon.polygonId,
						geometry: {
							type: (polygon.type || 'Polygon') as 'Polygon' | 'MultiPolygon',
							coordinates: coordinates
						},
						properties: {
							landName: land.landName,
							projectId: land.projectId,
							projectName: land.projectTable?.projectName || '',
							hectares: land.hectares ? `${Number(land.hectares).toFixed(1)} ha` : '0 ha',
							treatmentType: land.treatmentType,
							preparation: land.preparation,
							gpsLat: land.gpsLat ? Number(land.gpsLat) : null,
							gpsLon: land.gpsLon ? Number(land.gpsLon) : null,
							stakeholders: stakeholderNames,
							centroid: centroid
						}
					};

					features.push(feature);
				} catch (error) {
					console.error(`Error processing polygon ${polygon.polygonId}:`, error);
				}
			}
		}

		const response: PolygonsResponse = {
			type: 'FeatureCollection',
			features: features
		};

		res.json(response);
	} catch (error) {
		console.error('Error fetching polygons:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
}
