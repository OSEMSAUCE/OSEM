#!/usr/bin/env tsx

/**
 * Calculate organization scores and primary stakeholder types
 *
 * Run after orchestrator completes to aggregate project scores into org scores.
 * Separate from orchestrator to avoid concurrency issues between project and org upserts.
 *
 * Usage:
 *   tsx scripts/calculateOrgScores.ts
 *   or via MASTER.sh: ./MASTER.sh calculate_org_scores
 */

import crypto from "node:crypto";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/lib/generated/prisma-postgres/client.js";

const pool = new Pool({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function calculateOrgScores() {
    console.log("\n🏢 Calculating organization scores...\n");

    // Get all master organizations
    const masterOrgs = await prisma.organizationTable.findMany({
        where: { deletedAt: null },
        select: {
            organizationId: true,
            organizationName: true,
        },
    });

    console.log(`Found ${masterOrgs.length} organizations to score`);

    // Get all local org IDs mapped to master orgs
    const localOrgs = await prisma.organizationLocalTable.findMany({
        where: { deletedAt: null },
        select: {
            organizationLocalId: true,
            organizationId: true,
        },
    });

    const localsByMaster = new Map<string, string[]>();
    for (const local of localOrgs) {
        if (!local.organizationId) continue;
        if (!localsByMaster.has(local.organizationId)) {
            localsByMaster.set(local.organizationId, []);
        }
        localsByMaster
            .get(local.organizationId)!
            .push(local.organizationLocalId);
    }

    let scored = 0;

    for (const master of masterOrgs) {
        const localIds = localsByMaster.get(master.organizationId) ?? [];
        if (localIds.length === 0) {
            console.log(`  ⚠️  ${master.organizationName}: no local orgs`);
            continue;
        }

        // Get project IDs linked to this org via StakeholderTable
        const stakeholders = await prisma.stakeholderTable.findMany({
            where: {
                organizationLocalId: { in: localIds },
            },
            select: {
                projectId: true,
            },
        });

        const projectIds = [...new Set(stakeholders.map(s => s.projectId).filter((id): id is string => id !== null))];

        if (projectIds.length === 0) {
            console.log(`  ⚠️  ${master.organizationName}: no projects linked via stakeholders`);
            continue;
        }

        // Get project scores for those projects
        const projectScores =
            await prisma.projectScore_agg_helper.findMany({
                where: {
                    projectId: { in: projectIds },
                    deletedAt: null,
                },
                select: {
                    projectScore: true,
                    pointsAvailible: true,
                    pointsScored: true,
                },
            });

        if (projectScores.length === 0) {
            console.log(`  ⚠️  ${master.organizationName}: no scored projects`);
            continue;
        }

        // Calculate pre-claim score as average of project scores
        const preClaimScore =
            projectScores.reduce((sum, ps) => sum + Number(ps.projectScore), 0) /
            projectScores.length;

        // Also track total points for reference (not used in score calculation)
        const orgPointsAvailable = projectScores.reduce(
            (sum, ps) => sum + ps.pointsAvailible,
            0,
        );
        const orgPointsScored = projectScores.reduce(
            (sum, ps) => sum + ps.pointsScored,
            0,
        );

        // Aggregate tree claims from ClaimTable
        const claimData = await prisma.claimTable.aggregate({
            where: {
                organizationId: master.organizationId,
                deletedAt: null,
            },
            _sum: { claimCount: true },
        });
        const totalClaimed = claimData._sum.claimCount || 0;

        // Aggregate planted trees from PlantingTable across all projects (using projectIds from stakeholders)
        const plantingData = await prisma.plantingTable.aggregate({
            where: {
                projectId: { in: projectIds },
                deletedAt: null,
            },
            _sum: { planted: true },
        });
        const totalPlanted = plantingData._sum?.planted || 0;

        // Calculate disclosure ratio (capped at 1.0)
        const claimVsPlanted =
            totalClaimed > 0
                ? Math.min(totalPlanted / totalClaimed, 1.0)
                : 1.0;

        // Calculate final org score (preClaimScore penalized by disclosure ratio)
        const orgScore = preClaimScore * Number(claimVsPlanted);

        // Calculate primary stakeholder type from both StakeholderTable and SourceTable
        const stakeholderTypes = await prisma.$queryRaw<
            Array<{ stakeholderType: string; count: bigint }>
        >`
            SELECT "stakeholderType", COUNT(*) as count
            FROM (
                SELECT "stakeholderType" 
                FROM "StakeholderTable" 
                WHERE "organizationLocalId" IN (${localIds.join("','")})
                  AND "stakeholderType" IS NOT NULL
                  AND "deletedAt" IS NULL
                UNION ALL
                SELECT "stakeholderType"
                FROM "SourceTable"
                WHERE "organizationLocalId" IN (${localIds.join("','")})
                  AND "stakeholderType" IS NOT NULL
                  AND "deletedAt" IS NULL
            ) combined
            GROUP BY "stakeholderType"
            ORDER BY count DESC
            LIMIT 1
        `;

        const primaryStakeholderType =
            stakeholderTypes.length > 0
                ? stakeholderTypes[0].stakeholderType
                : null;

        // Upsert org score
        await prisma.orgScore_agg_helper.upsert({
            where: { organizationId: master.organizationId },
            create: {
                orgScoreId: crypto.randomUUID(),
                organizationId: master.organizationId,
                preClaimScore,
                orgPointsAvailable,
                orgPointsScored,
                totalClaimed,
                totalPlanted,
                claimVsPlanted,
                orgScore,
                primaryStakeholderType,
            },
            update: {
                preClaimScore,
                orgPointsAvailable,
                orgPointsScored,
                totalClaimed,
                totalPlanted,
                claimVsPlanted,
                orgScore,
                primaryStakeholderType,
            },
        });

        scored++;
        console.log(
            `  ✅ ${master.organizationName}: ${preClaimScore.toFixed(1)}% → ${orgScore.toFixed(1)}% (${projectScores.length} projects, ${(Number(claimVsPlanted) * 100).toFixed(0)}% disclosed) - ${primaryStakeholderType || "no type"}`,
        );
    }

    // Calculate percentiles
    console.log("\n📊 Calculating percentiles...");

    // Overall percentile - rank among ALL orgs (using orgScore)
    await prisma.$executeRawUnsafe(`
        UPDATE "OrgScore_agg_helper" os
        SET "orgPercentile" = ranked."orgPercentile"
        FROM (
            SELECT
                "orgScoreId",
                ROUND(PERCENT_RANK() OVER (ORDER BY "orgScore") * 100)::int AS "orgPercentile"
            FROM "OrgScore_agg_helper"
            WHERE "orgScore" IS NOT NULL
        ) ranked
        WHERE os."orgScoreId" = ranked."orgScoreId"
    `);

    // Percentile by type - rank among orgs of SAME stakeholder type only (using orgScore)
    await prisma.$executeRawUnsafe(`
        UPDATE "OrgScore_agg_helper" os
        SET "orgPercentileByType" = ranked."orgPercentileByType"
        FROM (
            SELECT
                "orgScoreId",
                ROUND(PERCENT_RANK() OVER (
                    PARTITION BY "primaryStakeholderType"
                    ORDER BY "orgScore"
                ) * 100)::int AS "orgPercentileByType"
            FROM "OrgScore_agg_helper"
            WHERE "primaryStakeholderType" IS NOT NULL
              AND "orgScore" IS NOT NULL
        ) ranked
        WHERE os."orgScoreId" = ranked."orgScoreId"
    `);

    console.log(`\n✅ Scored ${scored} organizations`);
    console.log(`✅ Percentiles calculated (overall + by type)\n`);
}

calculateOrgScores()
    .catch((e) => {
        console.error("❌ Error calculating org scores:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
