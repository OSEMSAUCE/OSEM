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
                    pct_score: true,
                    sum_points_available: true,
                    sum_points_scored: true,
                },
            });

        if (projectScores.length === 0) {
            console.log(`  ⚠️  ${master.organizationName}: no scored projects`);
            continue;
        }

        // Calculate pre-claim score as average of project scores
        const pct_pre_claim =
            projectScores.reduce((sum, ps) => sum + Number(ps.pct_score), 0) /
            projectScores.length;

        // Also track total points for reference (not used in score calculation)
        const sum_points_available = projectScores.reduce(
            (sum, ps) => sum + ps.sum_points_available,
            0,
        );
        const sum_points_scored = projectScores.reduce(
            (sum, ps) => sum + ps.sum_points_scored,
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
        const sum_claimed = claimData._sum.claimCount || 0;

        // Aggregate planted trees from PlantingTable across all projects (using projectIds from stakeholders)
        const plantingData = await prisma.plantingTable.aggregate({
            where: {
                projectId: { in: projectIds },
                deletedAt: null,
            },
            _sum: { planted: true },
        });
        const sum_planted = plantingData._sum?.planted || 0;

        // Calculate disclosure ratio (capped at 1.0)
        const ratio_claim_disclosure =
            sum_claimed > 0
                ? Math.min(sum_planted / sum_claimed, 1.0)
                : 1.0;

        // Calculate final org score (pct_pre_claim penalized by disclosure ratio)
        const pct_final = pct_pre_claim * Number(ratio_claim_disclosure);

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
                pct_pre_claim,
                sum_points_available,
                sum_points_scored,
                sum_claimed,
                sum_planted,
                ratio_claim_disclosure,
                pct_final,
                primaryStakeholderType,
            },
            update: {
                pct_pre_claim,
                sum_points_available,
                sum_points_scored,
                sum_claimed,
                sum_planted,
                ratio_claim_disclosure,
                pct_final,
                primaryStakeholderType,
            },
        });

        scored++;
        console.log(
            `  ✅ ${master.organizationName}: ${pct_pre_claim.toFixed(1)}% → ${pct_final.toFixed(1)}% (${projectScores.length} projects, ${(Number(ratio_claim_disclosure) * 100).toFixed(0)}% disclosed) - ${primaryStakeholderType || "no type"}`,
        );
    }

    // Calculate percentiles
    console.log("\n📊 Calculating percentiles...");

    // Overall percentile - rank among ALL orgs (using pct_final)
    await prisma.$executeRawUnsafe(`
        UPDATE "OrgScore_agg_helper" os
        SET "rank_percentile" = ranked."rank_percentile"
        FROM (
            SELECT
                "orgScoreId",
                ROUND(PERCENT_RANK() OVER (ORDER BY "pct_final") * 100)::int AS "rank_percentile"
            FROM "OrgScore_agg_helper"
            WHERE "pct_final" IS NOT NULL
        ) ranked
        WHERE os."orgScoreId" = ranked."orgScoreId"
    `);

    // Percentile by type - rank among orgs of SAME stakeholder type only (using pct_final)
    await prisma.$executeRawUnsafe(`
        UPDATE "OrgScore_agg_helper" os
        SET "rank_percentile_by_type" = ranked."rank_percentile_by_type"
        FROM (
            SELECT
                "orgScoreId",
                ROUND(PERCENT_RANK() OVER (
                    PARTITION BY "primaryStakeholderType"
                    ORDER BY "pct_final"
                ) * 100)::int AS "rank_percentile_by_type"
            FROM "OrgScore_agg_helper"
            WHERE "primaryStakeholderType" IS NOT NULL
              AND "pct_final" IS NOT NULL
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
