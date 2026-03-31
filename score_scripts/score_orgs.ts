#!/usr/bin/env tsx
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../prisma/generated/prisma-postgres/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(
    readFileSync(join(__dirname, "scoreConfig.json"), "utf8"),
);

const connectionString = process.env.DIRECT_URL;
if (!connectionString) throw new Error("DIRECT_URL is not set!");

const pool = new pg.Pool({
    connectionString,
    max: config.pool.maxConnections,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function score_orgs(
    orgIds?: string[],
    batchSize?: number,
): Promise<void> {
    const orgsToScore = orgIds
        ? await prisma.organizationTable.findMany({
              where: {
                  organizationKey: { in: orgIds },
                  scoreOrgFlag: true,
              },
              select: { organizationKey: true },
          })
        : await prisma.organizationTable.findMany({
              where: { scoreOrgFlag: true },
              select: { organizationKey: true },
              take: batchSize,
              orderBy: { scoreLastUpdatedAt: "asc" },
          });

    console.log(`\n🏢 Scoring ${orgsToScore.length} dirty organizations...`);

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

        const stakeholderCategories = await prisma.$queryRaw<
            Array<{ stakeholderCategory: string; count: bigint }>
        >`
            SELECT st."stakeholderCategory", COUNT(*) as count
            FROM "StakeholderTable" st
            WHERE st."organizationKey" = ANY(${localOrgIds}::text[])
              AND st."stakeholderCategory" IS NOT NULL
            GROUP BY st."stakeholderCategory"
            ORDER BY count DESC
            LIMIT 1
        `;
        const primaryStakeholderCategory =
            stakeholderCategories[0]?.stakeholderCategory || null;

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
                primaryStakeholderCategory,
                scoreLastUpdatedAt: new Date(),
                scoreOrgFlag: false,
            },
        });
    }

    console.log(`✅ Scored ${orgsToScore.length} organizations`);
}

async function rank_orgs(): Promise<void> {
    console.log("\n📊 Ranking organizations...");

    await prisma.$executeRawUnsafe(`
        UPDATE "OrganizationTable" ot
        SET "scoreRankOverall" = ranked."scoreRankOverall"
        FROM (
            SELECT
                "organizationKey",
                ROUND(PERCENT_RANK() OVER (ORDER BY "scoreOrgFinal") * 100)::int AS "scoreRankOverall"
            FROM "OrganizationTable"
            WHERE "scoreOrgFinal" IS NOT NULL
        ) ranked
        WHERE ot."organizationKey" = ranked."organizationKey"
    `);

    await prisma.$executeRawUnsafe(`
        UPDATE "OrganizationTable" ot
        SET "scoreRankByCategory" = ranked."scoreRankByCategory"
        FROM (
            SELECT
                "organizationKey",
                ROUND(PERCENT_RANK() OVER (
                    PARTITION BY "primaryStakeholderCategory"
                    ORDER BY "scoreOrgFinal"
                ) * 100)::int AS "scoreRankByCategory"
            FROM "OrganizationTable"
            WHERE "primaryStakeholderCategory" IS NOT NULL
              AND "scoreOrgFinal" IS NOT NULL
        ) ranked
        WHERE ot."organizationKey" = ranked."organizationKey"
    `);

    console.log("✅ Organizations ranked");
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const batchSize = args[0]
        ? Number.parseInt(args[0], 10)
        : config.batch.organizations.defaultSize;
    const testOrgIds = args.slice(1);

    // If specific org IDs provided, just score those
    if (testOrgIds.length > 0) {
        await score_orgs(testOrgIds, batchSize);
        await rank_orgs();
        await pool.end();
        process.exit(0);
    }

    // Count total dirty orgs upfront
    const totalDirty = await prisma.organizationTable.count({
        where: { scoreOrgFlag: true },
    });
    console.log(`\n📋 Found ${totalDirty} dirty organizations to score`);

    if (totalDirty === 0) {
        console.log("✅ No dirty organizations to score");
        await pool.end();
        process.exit(0);
    }

    let totalScored = 0;
    let batchNum = 0;

    while (true) {
        const orgsToScore = await prisma.organizationTable.findMany({
            where: { scoreOrgFlag: true },
            select: { organizationKey: true },
            take: batchSize,
            orderBy: { scoreLastUpdatedAt: "asc" },
        });

        if (orgsToScore.length === 0) {
            console.log(
                `\n✅ All dirty organizations scored. Total: ${totalScored}`,
            );
            break;
        }

        batchNum++;
        const remaining = totalDirty - totalScored;
        console.log(
            `\n📦 Batch ${batchNum}: ${orgsToScore.length} organizations (${remaining} remaining)`,
        );

        await score_orgs(
            orgsToScore.map((o) => o.organizationKey),
            batchSize,
        );
        totalScored += orgsToScore.length;
    }

    await rank_orgs();
    await pool.end();
    process.exit(0);
}
