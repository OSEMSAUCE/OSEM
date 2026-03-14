#!/usr/bin/env tsx
/**
 * calc_batch_score_orgs.ts - Batch Organization Scoring
 *
 * Scores ONLY the specified organizations.
 * Aggregates project scores and applies claim disclosure penalty.
 *
 * Performance: ~2-3 seconds for all orgs (they're fast - just averages)
 *
 * Usage:
 *   import { batch_score_orgs } from './calc_batch_score_orgs.ts';
 *   await batch_score_orgs(orgIds);
 */

import crypto from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../src/lib/generated/prisma-postgres/client.js";

const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
    throw new Error("DIRECT_URL is not set!");
}

const pool = new pg.Pool({
    connectionString,
    max: 5,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function batch_score_orgs(orgIds?: string[]): Promise<void> {
    // If no orgIds provided, score all orgs (they're fast anyway)
    const orgsToScore = orgIds
        ? await prisma.organizationTable.findMany({
              where: { organizationKey: { in: orgIds } },
              select: { organizationKey: true },
          })
        : await prisma.organizationTable.findMany({
              select: { organizationKey: true },
          });

    console.log(`\n🏢 Batch scoring ${orgsToScore.length} organizations...`);

    for (const { organizationKey } of orgsToScore) {
        // Get all local orgs for this parent org
        const localOrgs = await prisma.organizationTable.findMany({
            where: { organizationKey },
            select: { organizationKey: true },
        });

        const localOrgIds = localOrgs.map((lo) => lo.organizationKey);
        if (localOrgIds.length === 0) continue;

        // Get all projects via StakeholderTable
        const projectScores = await prisma.$queryRaw<
            Array<{ project_score: number }>
        >`
            SELECT DISTINCT ps."project_score"
            FROM "ProjectScore_agg_helper" ps
            INNER JOIN "StakeholderTable" st ON ps."projectKey" = st."projectKey"
            WHERE st."organizationKey" = ANY(${localOrgIds}::text[])
              AND ps."project_score" IS NOT NULL
        `;

        if (projectScores.length === 0) continue;

        const org_score_pre_claim =
            projectScores.reduce((sum, p) => sum + Number(p.project_score), 0) /
            projectScores.length;

        // Get claim data
        const claims = await prisma.claimTable.findMany({
            where: { organizationKey },
            select: { claimCount: true },
        });
        const sum_claimed = claims.reduce(
            (sum, c) => sum + (c.claimCount || 0),
            0,
        );

        const plantings = await prisma.$queryRaw<Array<{ planted: number }>>`
            SELECT p."planted"
            FROM "PlantingTable" p
            INNER JOIN "ProjectTable" pt ON p."projectKey" = pt."projectKey"
            INNER JOIN "StakeholderTable" st ON pt."projectKey" = st."projectKey"
            WHERE st."organizationKey" = ANY(${localOrgIds}::text[])
              AND p."planted" IS NOT NULL
        `;
        const sum_planted = plantings.reduce(
            (sum, p) => sum + (p.planted || 0),
            0,
        );

        const sum_undisclosed = sum_claimed - sum_planted;
        const ratio_disclosure =
            sum_claimed > 0 ? sum_planted / sum_claimed : 1.0;
        const org_score_final = org_score_pre_claim * ratio_disclosure;

        // Get primary stakeholder type
        const stakeholderTypes = await prisma.$queryRaw<
            Array<{ stakeholderType: string; count: bigint }>
        >`
            SELECT st."stakeholderType", COUNT(*) as count
            FROM "StakeholderTable" st
            WHERE st."organizationKey" = ANY(${localOrgIds}::text[])
              AND st."stakeholderType" IS NOT NULL
            GROUP BY st."stakeholderType"
            ORDER BY count DESC
            LIMIT 1
        `;
        const primaryStakeholderType =
            stakeholderTypes[0]?.stakeholderType || null;
        const localDate = new Date(Date.now() - 7 * 60 * 60 * 1000);
        const now = localDate.toISOString().replace("T", " ").substring(0, 19);

        await prisma.orgScore_helper.upsert({
            where: { organizationKey },
            create: {
                orgScoreId: crypto.randomUUID(),
                organizationKey,
                org_score_pre_claim,
                sum_claimed,
                sum_planted,
                sum_undisclosed,
                org_score_final,
                primaryStakeholderType,
                lastUpdatedHuman: now,
            },
            update: {
                org_score_pre_claim,
                sum_claimed,
                sum_planted,
                sum_undisclosed,
                org_score_final,
                primaryStakeholderType,
                lastUpdatedHuman: now,
            },
        });
    }

    console.log(`✅ Batch scored ${orgsToScore.length} organizations`);
    await pool.end();
}

// Allow running standalone for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const testOrgIds = process.argv.slice(2);
    if (testOrgIds.length === 0) {
        console.log("No org IDs provided - scoring all organizations");
        batch_score_orgs()
            .then(() => process.exit(0))
            .catch((e) => {
                console.error(e);
                process.exit(1);
            });
    } else {
        batch_score_orgs(testOrgIds)
            .then(() => process.exit(0))
            .catch((e) => {
                console.error(e);
                process.exit(1);
            });
    }
}
