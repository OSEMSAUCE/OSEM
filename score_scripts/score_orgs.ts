#!/usr/bin/env tsx
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../src/lib/generated/prisma-postgres/client.js";

const connectionString = process.env.DIRECT_URL;
if (!connectionString) throw new Error("DIRECT_URL is not set!");

const pool = new pg.Pool({
    connectionString,
    max: 5,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function score_orgs(orgIds?: string[]): Promise<void> {
    const orgsToScore = orgIds
        ? await prisma.organizationTable.findMany({
              where: { organizationKey: { in: orgIds } },
              select: { organizationKey: true },
          })
        : await prisma.organizationTable.findMany({
              select: { organizationKey: true },
          });

    console.log(`\n🏢 Scoring ${orgsToScore.length} organizations...`);

    for (const { organizationKey } of orgsToScore) {
        const childOrgs = await prisma.organizationTable.findMany({
            where: { organizationKey },
            select: { organizationKey: true },
        });

        const localOrgIds = childOrgs.map((lo) => lo.organizationKey);
        if (localOrgIds.length === 0) continue;

        const projectScores = await prisma.$queryRaw<
            Array<{
                scoreProject: number;
                scorePointsAvailable: number;
                scorePointsScored: number;
            }>
        >`
            SELECT DISTINCT 
                pt."scoreProject",
                pt."scorePointsAvailable",
                pt."scorePointsScored"
            FROM "ProjectTable" pt
            INNER JOIN "StakeholderTable" st ON pt."projectKey" = st."projectKey"
            WHERE st."organizationKey" = ANY(${localOrgIds}::text[])
              AND pt."scoreProject" IS NOT NULL
        `;

        const scoreOrgPreClaim =
            projectScores.length > 0
                ? projectScores.reduce(
                      (sum, p) => sum + Number(p.scoreProject),
                      0,
                  ) / projectScores.length
                : 0;
        const scorePointsAvailable = projectScores.reduce(
            (sum, p) => sum + Number(p.scorePointsAvailable || 0),
            0,
        );
        const scorePointsScored = projectScores.reduce(
            (sum, p) => sum + Number(p.scorePointsScored || 0),
            0,
        );

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

        await prisma.organizationTable.update({
            where: { organizationKey },
            data: {
                scoreOrgPreClaim,
                scorePointsAvailable,
                scorePointsScored,
                scoreSumClaimed,
                scoreSumPlantedQty,
                scoreSumUndisclosed,
                scoreOrgFinal,
                primaryStakeholderType,
                scoreLastUpdated: new Date(),
            },
        });
    }

    console.log(`✅ Scored ${orgsToScore.length} organizations`);
    await pool.end();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const testOrgIds = process.argv.slice(2);
    score_orgs(testOrgIds.length > 0 ? testOrgIds : undefined)
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
