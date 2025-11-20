import type { PageServerLoad } from './$types';
import { db } from '$lib/server/database/client';

export const load: PageServerLoad = async ({ url }) => {
	const projectIdParam = url.searchParams.get('project');
	const tableParam = url.searchParams.get('table');

	try {
		const availableTables = [
			{ tableName: 'LandTable' },
			{ tableName: 'CropTable' },
			{ tableName: 'PlantingTable' },
			{ tableName: 'PolyTable' },
			{ tableName: 'StakeholderTable' }
		];

		const projects = await db.projectTable.findMany({
			where: { deleted: false },
			select: { projectId: true, projectName: true },
			orderBy: { projectName: 'asc' }
		});

		let selectedProjectId = projectIdParam;
		let selectedTable = tableParam;

		const validTableNames = new Set<string>([
			'ProjectTable',
			...availableTables.map((t) => t.tableName)
		]);

		if (!selectedTable || !validTableNames.has(selectedTable)) {
			selectedTable = 'ProjectTable';
			selectedProjectId = null;
		}

		if (!selectedProjectId && !selectedTable) {
			selectedTable = 'ProjectTable';
		} else if (!selectedProjectId && selectedTable && selectedTable !== 'ProjectTable') {
			selectedProjectId = projects[0]?.projectId || null;
			selectedTable = 'LandTable';
		} else if (selectedProjectId && !selectedTable) {
			selectedTable = 'LandTable';
		}

		let tableData: unknown[] = [];

		if (selectedTable === 'ProjectTable') {
			tableData = await db.projectTable.findMany({ where: { deleted: false } });
		} else if (selectedProjectId && selectedTable === 'LandTable') {
			tableData = await db.landTable.findMany({
				where: { projectId: selectedProjectId, deleted: false }
			});
		} else if (selectedProjectId && selectedTable === 'CropTable') {
			tableData = await db.cropTable.findMany({
				where: { projectId: selectedProjectId, deleted: false }
			});
		} else if (selectedProjectId && selectedTable === 'PlantingTable') {
			tableData = await db.plantingTable.findMany({
				where: { projectId: selectedProjectId, deleted: false }
			});
		} else if (selectedProjectId && selectedTable === 'PolyTable') {
			tableData = await db.polyTable.findMany({
				where: { projectId: selectedProjectId, deleted: false }
			});
		} else if (selectedProjectId && selectedTable === 'StakeholderTable') {
			tableData = await db.stakeholderTable.findMany({
				where: { projectId: selectedProjectId }
			});
		}

		return {
			projects,
			tableData,
			availableTables,
			selectedProjectId,
			selectedTable
		};
	} catch (error) {
		console.error('Dashboard error:', error);
		return {
			projects: [],
			tableData: [],
			availableTables: [],
			selectedProjectId: null,
			selectedTable: null,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
};
