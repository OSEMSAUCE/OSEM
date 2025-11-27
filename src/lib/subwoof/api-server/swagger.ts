import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'ReTreever API',
			version: '1.0.0',
			description: `# ReTreever API - Global Reforestation Data

**Making reforestation transparent and accountable**

This API provides programmatic access to reforestation project data aggregated by **Foundr**, a data pipeline that consolidates information from multiple sources into a single source of truth for global reforestation efforts.

## What is ReTreever?

ReTreever is an open-source project that tracks and verifies tree planting projects worldwide. This API serves the aggregated data to make reforestation efforts transparent and hold contractors and organizations accountable.

## Why This API Exists

Tree planting offsets are notoriously sketchy. Unlike sports statistics or financial data, there's no authoritative source for reforestation data. ReTreever aims to be that source - like MLB stats for trees.

The challenge: Trees don't move, so they should be easy to track. The solution: Aggregate data from multiple sources, verify locations with GIS data, and make it all publicly accessible.

## Data Coverage

- **Projects**: Reforestation and afforestation projects worldwide
- **Lands**: Individual land parcels with GPS coordinates and hectare measurements
- **Polygons**: GeoJSON boundary data for precise map visualization
- **Metadata**: Treatment types, preparation methods, stakeholder information

## Key Features

- **GeoJSON Support**: All polygon data follows GeoJSON specification for easy mapping
- **Pagination & Filtering**: Efficient data access for large datasets
- **CORS Protection**: Browser access limited to authorized domains
- **No Authentication**: Public data, freely accessible (CORS-protected)
- **PostgreSQL Backend**: Reliable database updated regularly from the pipeline

## Getting Started

1. Browse the endpoints below
2. Try out API calls directly in this UI (click "Try it out")
3. Use the production URL: \`https://ReTreever-api-v2.fly.dev\`
4. Build amazing applications that hold the world accountable for its reforestation promises

## CORS Configuration

The API accepts requests from:
- \`https://ReTreever.org\`
- \`https://app.ReTreever.org\`

For local development, additional origins are allowed. Contact us to whitelist your domain.

## Support

- Production API: https://ReTreever-api-v2.fly.dev
- Documentation: https://github.com/yourusername/vigilantree
- Issues: Open a GitHub issue for questions or bug reports
`,
			contact: {
				name: 'ReTreever API Support',
				url: 'https://ReTreever.org'
			}
		},
		servers: [
			{
				url: 'https://ReTreever-api-v2.fly.dev',
				description: 'Production server'
			},
			{
				url: 'http://localhost:3000',
				description: 'Development server'
			}
		],
		tags: [
			{
				name: 'Projects',
				description: 'Project management endpoints'
			},
			{
				name: 'Lands',
				description: 'Land parcel endpoints with pagination and filtering'
			},
			{
				name: 'Polygons',
				description: 'GeoJSON polygon data for mapping'
			}
		],
		components: {
			schemas: {
				Project: {
					type: 'object',
					properties: {
						projectId: {
							type: 'string',
							description: 'Unique project identifier',
							example: 'proj_123'
						},
						projectName: {
							type: 'string',
							description: 'Display name of the project',
							example: 'Amazon Reforestation Project'
						}
					}
				},
				ProjectsResponse: {
					type: 'object',
					properties: {
						projects: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/Project'
							}
						}
					}
				},
				PolygonWithTables: {
					type: 'object',
					properties: {
						polygonId: {
							type: 'string',
							example: 'poly_123'
						},
						landId: {
							type: 'string',
							example: 'land_123'
						},
						landName: {
							type: 'string',
							example: 'North Sector A'
						},
						geometry: {
							type: 'string',
							description: 'GeoJSON geometry as JSON string'
						},
						coordinates: {
							type: 'string',
							description: 'Coordinates as JSON string'
						},
						type: {
							type: 'string',
							enum: ['Polygon', 'MultiPolygon'],
							example: 'Polygon'
						}
					}
				},
				LandWithTables: {
					type: 'object',
					required: ['landId', 'landName', 'projectId'],
					properties: {
						landId: {
							type: 'string',
							description: 'Unique land parcel identifier',
							example: 'land_123'
						},
						landName: {
							type: 'string',
							description: 'Display name of the land',
							example: 'North Sector A'
						},
						projectId: {
							type: 'string',
							description: 'Foreign key to project',
							example: 'proj_123'
						},
						hectares: {
							type: 'number',
							nullable: true,
							description: 'Size in hectares',
							example: 123.45
						},
						treatmentType: {
							type: 'string',
							nullable: true,
							description: 'Type of treatment',
							example: 'ARR'
						},
						preparation: {
							type: 'string',
							nullable: true,
							description: 'Preparation method',
							example: 'Manual clearing'
						},
						gpsLat: {
							type: 'number',
							nullable: true,
							description: 'GPS latitude',
							example: -3.4653
						},
						gpsLon: {
							type: 'number',
							nullable: true,
							description: 'GPS longitude',
							example: -62.2159
						},
						landNotes: {
							type: 'string',
							nullable: true,
							description: 'Additional notes',
							example: 'Primary restoration area'
						},
						projectTable: {
							type: 'object',
							properties: {
								projectName: {
									type: 'string',
									example: 'Amazon Reforestation Project'
								}
							}
						},
						polygonTable: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/PolygonWithTables'
							}
						}
					}
				},
				PaginationMeta: {
					type: 'object',
					properties: {
						page: {
							type: 'integer',
							description: 'Current page number',
							example: 1
						},
						pageSize: {
							type: 'integer',
							description: 'Number of items per page',
							example: 10
						},
						totalItems: {
							type: 'integer',
							description: 'Total number of items',
							example: 45
						},
						totalPages: {
							type: 'integer',
							description: 'Total number of pages',
							example: 5
						}
					}
				},
				LandsResponse: {
					type: 'object',
					properties: {
						data: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/LandWithTables'
							}
						},
						pagination: {
							$ref: '#/components/schemas/PaginationMeta'
						}
					}
				},
				GeoJSONFeature: {
					type: 'object',
					properties: {
						type: {
							type: 'string',
							enum: ['Feature'],
							example: 'Feature'
						},
						id: {
							type: 'string',
							example: 'poly_123'
						},
						geometry: {
							type: 'object',
							properties: {
								type: {
									type: 'string',
									enum: ['Polygon', 'MultiPolygon'],
									example: 'Polygon'
								},
								coordinates: {
									type: 'array',
									description: 'GeoJSON coordinates array'
								}
							}
						},
						properties: {
							type: 'object',
							properties: {
								landName: {
									type: 'string',
									example: 'North Sector A'
								},
								projectId: {
									type: 'string',
									example: 'proj_123'
								},
								projectName: {
									type: 'string',
									example: 'Amazon Reforestation Project'
								},
								hectares: {
									type: 'string',
									example: '123.4 ha'
								},
								treatmentType: {
									type: 'string',
									nullable: true,
									example: 'ARR'
								},
								preparation: {
									type: 'string',
									nullable: true,
									example: 'Manual clearing'
								},
								gpsLat: {
									type: 'number',
									nullable: true,
									example: -3.4653
								},
								gpsLon: {
									type: 'number',
									nullable: true,
									example: -62.2159
								},
								stakeholders: {
									type: 'string',
									example: 'WWF, Local Community Group'
								},
								centroid: {
									type: 'array',
									items: {
										type: 'number'
									},
									nullable: true,
									example: [-62.2152, -3.4647]
								}
							}
						}
					}
				},
				PolygonsResponse: {
					type: 'object',
					properties: {
						type: {
							type: 'string',
							enum: ['FeatureCollection'],
							example: 'FeatureCollection'
						},
						features: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/GeoJSONFeature'
							}
						}
					}
				},
				Error: {
					type: 'object',
					properties: {
						error: {
							type: 'string',
							description: 'Error message',
							example: 'Internal server error'
						}
					}
				}
			}
		}
	},
	apis: ['./api/routes/*.ts', './api/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
