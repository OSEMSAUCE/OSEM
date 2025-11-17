import type { Land } from '$lib/types/land';
import type { Crop } from '$lib/types/crop';
import type { Planting } from '$lib/types/planting';
import type { ProjectWithStats } from '$lib/types/project';

export const mockProjects: ProjectWithStats[] = [
	{
		projectId: 1,
		projectName: 'Demo Reforestation Project',
		landCount: 3,
		totalHectares: 245.5,
		platform: 'OSEM Demo'
	},
	{
		projectId: 2,
		projectName: 'Coastal Restoration',
		landCount: 2,
		totalHectares: 156.2,
		platform: 'OSEM Demo'
	}
];

export const mockLands: Land[] = [
	{
		landId: 1,
		landName: 'North Parcel',
		projectId: 1,
		projectName: 'Demo Reforestation Project',
		hectares: 120.5,
		treatmentType: 'Reforestation',
		preparation: 'Site Prepared'
	},
	{
		landId: 2,
		landName: 'South Parcel',
		projectId: 1,
		projectName: 'Demo Reforestation Project',
		hectares: 85.0,
		treatmentType: 'Enrichment Planting',
		preparation: 'Natural Regeneration'
	},
	{
		landId: 3,
		landName: 'East Parcel',
		projectId: 1,
		projectName: 'Demo Reforestation Project',
		hectares: 40.0,
		treatmentType: 'Agroforestry',
		preparation: 'Site Prepared'
	},
	{
		landId: 4,
		landName: 'Coastal Strip A',
		projectId: 2,
		projectName: 'Coastal Restoration',
		hectares: 78.2,
		treatmentType: 'Mangrove Restoration',
		preparation: 'Site Prepared'
	},
	{
		landId: 5,
		landName: 'Coastal Strip B',
		projectId: 2,
		projectName: 'Coastal Restoration',
		hectares: 78.0,
		treatmentType: 'Mangrove Restoration',
		preparation: 'Natural Regeneration'
	}
];

export const mockCrops: Crop[] = [
	{
		cropId: 1,
		cropName: 'Cedar Mix 2024',
		projectId: 1,
		projectName: 'Demo Reforestation Project',
		speciesLocalName: 'Western Red Cedar',
		seedInfo: 'Coastal Seed Source',
		cropStock: 'Bare Root'
	},
	{
		cropId: 2,
		cropName: 'Douglas Fir Mix',
		projectId: 1,
		projectName: 'Demo Reforestation Project',
		speciesLocalName: 'Douglas Fir',
		seedInfo: 'Local Provenance',
		cropStock: 'Container'
	},
	{
		cropId: 3,
		cropName: 'Mangrove Seedlings',
		projectId: 2,
		projectName: 'Coastal Restoration',
		speciesLocalName: 'Red Mangrove',
		seedInfo: 'Local Collection',
		cropStock: 'Propagules'
	}
];

export const mockPlantings: Planting[] = [
	{
		plantingId: 1,
		plantingDate: '2024-03-15',
		projectId: 1,
		projectName: 'Demo Reforestation Project',
		landId: 1,
		landName: 'North Parcel',
		cropId: 1,
		cropName: 'Cedar Mix 2024',
		planted: 12500,
		units: 12500,
		unitType: 'trees'
	},
	{
		plantingId: 2,
		plantingDate: '2024-04-20',
		projectId: 1,
		projectName: 'Demo Reforestation Project',
		landId: 2,
		landName: 'South Parcel',
		cropId: 2,
		cropName: 'Douglas Fir Mix',
		planted: 8500,
		units: 8500,
		unitType: 'trees'
	},
	{
		plantingId: 3,
		plantingDate: '2024-05-10',
		projectId: 2,
		projectName: 'Coastal Restoration',
		landId: 4,
		landName: 'Coastal Strip A',
		cropId: 3,
		cropName: 'Mangrove Seedlings',
		planted: 15000,
		units: 15000,
		unitType: 'propagules'
	}
];

export const mockAvailableTables = [
	{ tableName: 'projectTable' },
	{ tableName: 'landTable' },
	{ tableName: 'cropTable' },
	{ tableName: 'plantingTable' }
];
