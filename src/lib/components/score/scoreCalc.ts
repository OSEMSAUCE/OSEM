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
	type OrgScoreResult,
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
				pointsAvailible: Math.round(result.pointsAvailable),
				pointsScored: Math.round(result.pointsScored),
				polygonToLand: result.polygonScore,
				deleted: false,
			},
			update: {
				score: result.score,
				pointsAvailible: Math.round(result.pointsAvailable),
				pointsScored: Math.round(result.pointsScored),
				polygonToLand: result.polygonScore,
			},
		});
	}

	return results;
}

// ============================================================================
// Steps 9-12: Organization Scoring
// ============================================================================

// biome-ignore lint/suspicious/noExplicitAny: Prisma client type varies by context
export async function calculateOrgScore(db: any, organizationMasterId: string): Promise<OrgScoreResult> {
	// Get all local orgs under this master
	const localOrgs = await db.organizationLocalTable.findMany({
		where: { organizationMasterId },
		select: { organizationLocalId: true },
	});
	const localOrgIds = localOrgs.map((o: { organizationLocalId: string }) => o.organizationLocalId);

	if (localOrgIds.length === 0) {
		throw new Error(`No local orgs found for master org ${organizationMasterId}`);
	}

	// Step 9: Get all projects linked via stakeholders
	const stakeholders = await db.stakeholderTable.findMany({
		where: { organizationLocalId: { in: localOrgIds } },
		select: { projectId: true, stakeholderType: true },
	});

	const projectIds = [...new Set(
		stakeholders
			.map((s: { projectId: string | null }) => s.projectId)
			.filter(Boolean),
	)] as string[];

	// Aggregate project scores from Score table
	let orgPointsScored = 0;
	let orgPointsAvailible = 0;

	if (projectIds.length > 0) {
		const scores = await db.score.findMany({
			where: { projectId: { in: projectIds }, deleted: false },
			select: { pointsScored: true, pointsAvailible: true },
		});
		for (const s of scores) {
			orgPointsScored += s.pointsScored;
			orgPointsAvailible += s.pointsAvailible;
		}
	}

	const orgSubScore = orgPointsAvailible > 0
		? (orgPointsScored / orgPointsAvailible) * 100
		: 0;

	// Step 10: claimPercent
	const claims = await db.claimTable.findMany({
		where: { organizationLocalId: { in: localOrgIds }, deleted: false },
		select: { claimCount: true },
	});

	const claimCountAve = claims.length > 0
		? Math.round(claims.reduce((sum: number, c: { claimCount: number }) => sum + c.claimCount, 0) / claims.length)
		: 0;

	// Count actual trees planted across all org's projects
	let claimCounted = 0;
	if (projectIds.length > 0) {
		const plantings = await db.plantingTable.findMany({
			where: { projectId: { in: projectIds } },
			select: { planted: true },
		});
		claimCounted = plantings.reduce((sum: number, p: { planted: number | null }) => sum + (p.planted ?? 0), 0);
	}

	// If no claims, use actual planted count as the claim total
	const effectiveClaimAve = claimCountAve > 0 ? claimCountAve : claimCounted;
	const claimPercent = effectiveClaimAve > 0
		? (claimCounted / effectiveClaimAve) * 100
		: 0;

	// Step 11: Most popular stakeholderType
	const typeCounts: Record<string, number> = {};
	for (const s of stakeholders) {
		if (s.stakeholderType) {
			typeCounts[s.stakeholderType] = (typeCounts[s.stakeholderType] ?? 0) + 1;
		}
	}
	const stakeholderType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

	// Step 12: orgScore = orgSubScore weighted by claimPercent
	const orgSubScoreByClaim = Math.round(orgSubScore * (claimPercent / 100));

	return {
		organizationMasterId,
		organizationId: localOrgIds[0],
		orgSubScore,
		orgPointsScored,
		orgPointsAvailible,
		claimCountAve,
		claimCounted,
		claimPercent,
		orgSubScoreByClaim,
		stakeholderType,
		stakeholderAverage: 0, // filled in by runAllOrgScores after all orgs calculated
		orgScore: orgSubScoreByClaim, // updated after percentile calc
		orgPercentile: 0, // filled in by runAllOrgScores
	};
}

// biome-ignore lint/suspicious/noExplicitAny: Prisma client type varies by context
export async function runAllOrgScores(db: any): Promise<OrgScoreResult[]> {
	const masterOrgs = await db.organizationMasterTable.findMany({
		where: { deleted: false },
		select: { organizationMasterId: true },
	});

	if (!masterOrgs || masterOrgs.length === 0) {
		throw new Error("No master organizations found");
	}

	const results: OrgScoreResult[] = [];

	for (const org of masterOrgs) {
		try {
			const result = await calculateOrgScore(db, org.organizationMasterId);
			results.push(result);
		} catch {
			// Skip orgs with no local orgs
		}
	}

	// Calculate stakeholder averages and percentiles
	const byType: Record<string, OrgScoreResult[]> = {};
	for (const r of results) {
		const type = r.stakeholderType ?? "_none";
		if (!byType[type]) byType[type] = [];
		byType[type].push(r);
	}

	for (const [, group] of Object.entries(byType)) {
		const avg = group.reduce((sum, r) => sum + r.orgSubScoreByClaim, 0) / group.length;
		// Sort ascending for percentile calc
		const sorted = [...group].sort((a, b) => a.orgSubScoreByClaim - b.orgSubScoreByClaim);

		for (const r of group) {
			r.stakeholderAverage = avg;
			r.orgScore = r.orgSubScoreByClaim;
			// Percentile: % of orgs in this type that score <= this org
			const rank = sorted.findIndex((s) => s.organizationMasterId === r.organizationMasterId);
			r.orgPercentile = Math.round(((rank + 1) / sorted.length) * 100);
		}
	}

	// Upsert all org scores
	for (const result of results) {
		await db.orgScore.upsert({
			where: { orgScoreId: `${result.organizationMasterId}-score` },
			create: {
				orgScoreId: `${result.organizationMasterId}-score`,
				organizationId: result.organizationId,
				organizationMasterId: result.organizationMasterId,
				orgScore: result.orgScore,
				orgPercentile: result.orgPercentile,
				orgSubScore: result.orgSubScore,
				orgPointsAvailible: Math.round(result.orgPointsAvailible),
				orgPointsScored: Math.round(result.orgPointsScored),
				claimCountAve: result.claimCountAve,
				claimCounted: result.claimCounted,
				claimPercent: result.claimPercent,
				orgSubScoreByClaim: result.orgSubScoreByClaim,
				stakeholderType: result.stakeholderType,
				stakeholderAverage: result.stakeholderAverage,
				deleted: false,
			},
			update: {
				organizationId: result.organizationId,
				orgScore: result.orgScore,
				orgPercentile: result.orgPercentile,
				orgSubScore: result.orgSubScore,
				orgPointsAvailible: Math.round(result.orgPointsAvailible),
				orgPointsScored: Math.round(result.orgPointsScored),
				claimCountAve: result.claimCountAve,
				claimCounted: result.claimCounted,
				claimPercent: result.claimPercent,
				orgSubScoreByClaim: result.orgSubScoreByClaim,
				stakeholderType: result.stakeholderType,
				stakeholderAverage: result.stakeholderAverage,
			},
		});
	}

	return results;
}

// Re-export config for convenience
export { relevantTables, higherAttScoreLegend, ignoreList, polygonCalc, scoreRecord, polymorphicTables, DEFAULT_ATTRIBUTE_SCORE } from "./scoreConfig";
export type { RecordScore, ProjectScoreResult, ScoreBreakdown, RelevantTable, OrgScoreResult } from "./scoreConfig";
