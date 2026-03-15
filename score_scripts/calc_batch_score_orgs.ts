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
            Array<{ scoreProject: number }>
        >`
            SELECT DISTINCT pt."scoreProject"
            FROM "ProjectTable" pt
            INNER JOIN "StakeholderTable" st ON pt."projectKey" = st."projectKey"
            WHERE st."organizationKey" = ANY(${localOrgIds}::text[])
              AND pt."scoreProject" IS NOT NULL
        `;

        if (projectScores.length === 0) continue;

        const scoreOrgPreClaim =
            projectScores.reduce((sum, p) => sum + Number(p.scoreProject), 0) /
            projectScores.length;

        // Get claim data
        const claims = await prisma.claimTable.findMany({
            where: { organizationKey },
            select: { claimQty: true },
        });
        const scoreSumClaimed = claims.reduce(
            (sum, c) => sum + (c.claimQty || 0),
            0,
        );

        const plantings = await prisma.$queryRaw<Array<{ plantedQty: number }>>`
            SELECT p."plantedQty"
            FROM "PlantingTable" p
            INNER JOIN "ProjectTable" pt ON p."projectKey" = pt."projectKey"
            INNER JOIN "StakeholderTable" st ON pt."projectKey" = st."projectKey"
            WHERE st."organizationKey" = ANY(${localOrgIds}::text[])
              AND p."plantedQty" IS NOT NULL
        `;
        const scoreSumPlantedQty = plantings.reduce(
            (sum, p) => sum + (p.plantedQty || 0),
            0,
        );

        const scoreSumUndisclosed = scoreSumClaimed - scoreSumPlantedQty;
        const ratioDisclosure =
            scoreSumClaimed > 0 ? scoreSumPlantedQty / scoreSumClaimed : 1.0;
        const scoreOrgFinal = scoreOrgPreClaim * ratioDisclosure;

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

        // Update OrganizationTable with score fields
        await prisma.organizationTable.update({
            where: { organizationKey },
            data: {
                scoreOrgPreClaim,
                scoreSumClaimed,
                scoreSumPlantedQty,
                scoreSumUndisclosed,
                scoreOrgFinal,
                primaryStakeholderType,
                scoreLastUpdated: new Date(),
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
