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
				deleted: false,
			},
			update: {
				score: result.score,
				pointsAvailible: Math.round(result.pointsAvailable),
				pointsScored: Math.round(result.pointsScored),
			},
		});
	}

	return results;
}

// ============================================================================
// Steps 9-12: Organization Scoring (bulk SQL — single query for all orgs)
// ============================================================================

interface OrgRow {
	org_key: string;
	organization_id: string;
	org_points_scored: bigint | number;
	org_points_availible: bigint | number;
	claim_counted: bigint | number;
	claim_count_ave: number | null;
	stakeholder_type: string | null;
}

// biome-ignore lint/suspicious/noExplicitAny: Prisma client type varies by context
export async function runAllOrgScores(db: any): Promise<OrgScoreResult[]> {
	// Single query: aggregate project scores, plantings, claims, and stakeholder type per org
	const rows: OrgRow[] = await db.$queryRaw`
		WITH org_projects AS (
			SELECT DISTINCT
				COALESCE(ol."organizationMasterId", ol."organizationLocalId") AS org_key,
				ol."organizationLocalId",
				st."projectId",
				st."stakeholderType"
			FROM "StakeholderTable" st
			JOIN "OrganizationLocalTable" ol USING ("organizationLocalId")
			WHERE ol.deleted = false
			  AND st."projectId" IS NOT NULL
		),
		score_agg AS (
			SELECT
				op.org_key,
				MIN(op."organizationLocalId") AS organization_id,
				SUM(s."pointsScored") AS org_points_scored,
				SUM(s."pointsAvailible") AS org_points_availible
			FROM (SELECT DISTINCT org_key, "organizationLocalId", "projectId" FROM org_projects) op
			JOIN "Score" s ON s."projectId" = op."projectId" AND s.deleted = false
			GROUP BY op.org_key
		),
		planting_agg AS (
			SELECT
				op.org_key,
				SUM(COALESCE(p.planted, 0)) AS claim_counted
			FROM org_projects op
			JOIN "PlantingTable" p ON p."projectId" = op."projectId"
			GROUP BY op.org_key
		),
		claim_agg AS (
			SELECT
				COALESCE(ol."organizationMasterId", ol."organizationLocalId") AS org_key,
				AVG(c."claimCount") AS claim_count_ave
			FROM "ClaimTable" c
			JOIN "OrganizationLocalTable" ol ON ol."organizationLocalId" = c."organizationLocalId"
			WHERE c.deleted = false AND ol.deleted = false
			GROUP BY org_key
		),
		stakeholder_mode AS (
			SELECT DISTINCT ON (org_key)
				org_key,
				"stakeholderType" AS stakeholder_type
			FROM (
				SELECT org_key, "stakeholderType", COUNT(*) AS cnt
				FROM org_projects
				WHERE "stakeholderType" IS NOT NULL
				GROUP BY org_key, "stakeholderType"
			) sub
			ORDER BY org_key, cnt DESC
		)
		SELECT
			sa.org_key,
			sa.organization_id,
			sa.org_points_scored,
			sa.org_points_availible,
			COALESCE(pa.claim_counted, 0) AS claim_counted,
			ca.claim_count_ave,
			sm.stakeholder_type
		FROM score_agg sa
		LEFT JOIN planting_agg pa ON pa.org_key = sa.org_key
		LEFT JOIN claim_agg ca ON ca.org_key = sa.org_key
		LEFT JOIN stakeholder_mode sm ON sm.org_key = sa.org_key
	`;

	// Convert to OrgScoreResult and compute derived fields
	const results: OrgScoreResult[] = rows.map((row) => {
		const orgPointsScored = Number(row.org_points_scored);
		const orgPointsAvailible = Number(row.org_points_availible);
		const claimCounted = Number(row.claim_counted);
		const claimCountAve = row.claim_count_ave ? Math.round(Number(row.claim_count_ave)) : 0;

		const orgSubScore = orgPointsAvailible > 0
			? (orgPointsScored / orgPointsAvailible) * 100
			: 0;

		// If no claims, planted count = claim total (100%)
		const effectiveClaimAve = claimCountAve > 0 ? claimCountAve : claimCounted;
		const claimPercent = effectiveClaimAve > 0
			? (claimCounted / effectiveClaimAve) * 100
			: 0;

		const orgSubScoreByClaim = Math.round(orgSubScore * (claimPercent / 100));

		return {
			organizationMasterId: row.org_key,
			organizationId: row.organization_id,
			orgSubScore,
			orgPointsScored,
			orgPointsAvailible,
			claimCountAve,
			claimCounted,
			claimPercent,
			orgSubScoreByClaim,
			stakeholderType: row.stakeholder_type,
			stakeholderAverage: 0,
			orgScore: orgSubScoreByClaim,
			orgPercentile: 0,
		};
	});

	// Calculate stakeholder averages and percentiles
	const byType: Record<string, OrgScoreResult[]> = {};
	for (const r of results) {
		const type = r.stakeholderType ?? "_none";
		if (!byType[type]) byType[type] = [];
		byType[type].push(r);
	}

	for (const [, group] of Object.entries(byType)) {
		const avg = group.reduce((sum, r) => sum + r.orgSubScoreByClaim, 0) / group.length;
		const sorted = [...group].sort((a, b) => a.orgSubScoreByClaim - b.orgSubScoreByClaim);

		for (const r of group) {
			r.stakeholderAverage = avg;
			r.orgScore = r.orgSubScoreByClaim;
			const rank = sorted.findIndex((s) => s.organizationMasterId === r.organizationMasterId);
			r.orgPercentile = Math.round(((rank + 1) / sorted.length) * 100);
		}
	}

	// Bulk upsert all org scores
	for (const result of results) {
		await db.orgScore.upsert({
			where: { organizationMasterId: result.organizationMasterId },
			create: {
				orgScoreId: `${result.organizationMasterId}-score`,
				organizationId: result.organizationId,
				organizationMasterId: result.organizationMasterId,
				orgScore: result.orgScore,
				orgPercentile: result.orgPercentile,
				orgSubScore: result.orgSubScore,
				orgPointsAvailible: Math.round(result.orgPointsAvailible),
				orgPointsScored: Math.round(result.orgPointsScored),
				claimCounted: result.claimCounted,
				orgSubScoreByClaim: result.orgSubScoreByClaim,
				stakeholderType: result.stakeholderType,
				stakeholderAverage: result.stakeholderAverage,
				orgScoreDate: new Date(),
				deleted: false,
			},
			update: {
				organizationId: result.organizationId,
				orgScore: result.orgScore,
				orgPercentile: result.orgPercentile,
				orgSubScore: result.orgSubScore,
				orgPointsAvailible: Math.round(result.orgPointsAvailible),
				orgPointsScored: Math.round(result.orgPointsScored),
				claimCounted: result.claimCounted,
				orgSubScoreByClaim: result.orgSubScoreByClaim,
				stakeholderType: result.stakeholderType,
				stakeholderAverage: result.stakeholderAverage,
				orgScoreDate: new Date(),
			},
		});
	}

	return results;
}

// Re-export config for convenience
export { relevantTables, scoreMatrix, ignoreList, polygonCalc, scoreRecord, polymorphicTables, DEFAULT_ATTRIBUTE_SCORE } from "./scoreConfig";
export type { RecordScore, ProjectScoreResult, ScoreBreakdown, RelevantTable, OrgScoreResult } from "./scoreConfig";
