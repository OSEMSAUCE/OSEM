// ============================================================================
// Score Calc — calculates project scores using Prisma.
// Takes a db client as parameter so it works from API routes (getDb)
// without any RLS/permission issues.
// ============================================================================
import {
	relevantTables,
	polymorphicTables,
	polygonCalc,
	scoreRecord,
	type ProjectScoreResult,
} from "./scoreConfig";

// ============================================================================
// Calculate score for a single project
// ============================================================================
// biome-ignore lint/suspicious/noExplicitAny: Prisma client type varies by context
export async function calculateProjectScore(db: any, projectId: string): Promise<ProjectScoreResult> {
	let totalScored = 0;
	let totalAvailable = 0;
	let polygonScoreTotal = 0;
	const tableBreakdown = {} as ProjectScoreResult["tableBreakdown"];

	// Get lands for this project to calculate polygon density
	const lands = await db.landTable.findMany({
		where: { projectId },
		select: { landId: true },
	});
	const landIds: string[] = lands.map((l: { landId: string }) => l.landId);

	// Get planted trees per land for polygonCalc
	const plantedPerLand: Record<string, number> = {};
	if (landIds.length > 0) {
		const plantings = await db.plantingTable.findMany({
			where: { parentTable: "landTable", parentId: { in: landIds } },
			select: { parentId: true, planted: true },
		});

		for (const p of plantings) {
			plantedPerLand[p.parentId] = (plantedPerLand[p.parentId] ?? 0) + (p.planted ?? 0);
		}
	}

	// Get polygons for density scoring
	if (landIds.length > 0) {
		const polygons = await db.polygonTable.findMany({
			where: { landId: { in: landIds } },
			select: { landId: true, hectaresCalc: true, geometry: true },
		});

		for (const poly of polygons) {
			if (poly.geometry && poly.hectaresCalc) {
				const treesPlanted = plantedPerLand[poly.landId] ?? 0;
				polygonScoreTotal += polygonCalc(treesPlanted, Number(poly.hectaresCalc));
			}
		}
	}

	// Score each relevant table's records for this project
	for (const tableName of relevantTables) {
		// biome-ignore lint/suspicious/noExplicitAny: dynamic table access
		let records: any[];

		if (tableName === "PolygonTable") {
			if (landIds.length === 0) continue;
			records = await db.polygonTable.findMany({ where: { landId: { in: landIds } } });
		} else if (tableName === "OrganizationLocalTable") {
			// Get via StakeholderTable linkage
			const stakeholders = await db.stakeholderTable.findMany({
				where: { projectId },
				select: { organizationLocalId: true },
			});
			const orgIds = [...new Set(stakeholders.map((s: { organizationLocalId: string }) => s.organizationLocalId))];
			if (orgIds.length === 0) continue;
			records = await db.organizationLocalTable.findMany({ where: { organizationLocalId: { in: orgIds } } });
		} else {
			// Map table name to Prisma model accessor
			const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
			records = await db[modelName].findMany({ where: { projectId } });
		}

		let tableScored = 0;
		let tableAvailable = 0;
		const isPolymorphic = polymorphicTables.includes(tableName);

		for (const record of records) {
			const { pointsScored, pointsAvailable } = scoreRecord(record);
			tableScored += pointsScored;
			// Polymorphic tables don't add to available (they're bonus points)
			if (!isPolymorphic) {
				tableAvailable += pointsAvailable;
			}
		}

		tableBreakdown[tableName] = {
			scored: tableScored,
			available: tableAvailable,
			count: records.length,
		};

		totalScored += tableScored;
		totalAvailable += tableAvailable;
	}

	// Add polygon density score to total
	totalScored += polygonScoreTotal;

	return {
		projectId,
		pointsScored: totalScored,
		pointsAvailable: totalAvailable,
		score: totalAvailable > 0 ? (totalScored / totalAvailable) * 100 : 0,
		polygonScore: polygonScoreTotal,
		tableBreakdown,
	};
}

// ============================================================================
// Run scoring for all projects and upsert results
// ============================================================================
// biome-ignore lint/suspicious/noExplicitAny: Prisma client type varies by context
export async function runAllScores(db: any): Promise<ProjectScoreResult[]> {
	const projects = await db.projectTable.findMany({
		select: { projectId: true, projectName: true },
	});

	if (!projects || projects.length === 0) {
		throw new Error("No projects found in database");
	}

	const results: ProjectScoreResult[] = [];

	for (const project of projects) {
		const result = await calculateProjectScore(db, project.projectId);
		results.push(result);
	}

	// Upsert all scores
	for (const result of results) {
		await db.score.upsert({
			where: { projectId: result.projectId },
			create: {
				scoreId: crypto.randomUUID(),
				projectId: result.projectId,
				score: result.score,
				pointsAvailible: result.pointsAvailable,
				pointsScored: result.pointsScored,
				polygonToLand: result.polygonScore,
				deleted: false,
			},
			update: {
				score: result.score,
				pointsAvailible: result.pointsAvailable,
				pointsScored: result.pointsScored,
				polygonToLand: result.polygonScore,
			},
		});
	}

	return results;
}

// Re-export config for convenience
export { relevantTables, higherAttScoreLegend, ignoreList, polygonCalc, scoreRecord, polymorphicTables, DEFAULT_ATTRIBUTE_SCORE } from "./scoreConfig";
export type { RecordScore, ProjectScoreResult, ScoreBreakdown, RelevantTable } from "./scoreConfig";
