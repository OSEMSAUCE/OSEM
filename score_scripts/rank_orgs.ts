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

export async function rank_orgs(): Promise<void> {
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
        SET "scoreRankByType" = ranked."scoreRankByType"
        FROM (
            SELECT
                "organizationKey",
                ROUND(PERCENT_RANK() OVER (
                    PARTITION BY "primaryStakeholderType"
                    ORDER BY "scoreOrgFinal"
                ) * 100)::int AS "scoreRankByType"
            FROM "OrganizationTable"
            WHERE "primaryStakeholderType" IS NOT NULL
              AND "scoreOrgFinal" IS NOT NULL
        ) ranked
        WHERE ot."organizationKey" = ranked."organizationKey"
    `);

    console.log("✅ Organizations ranked");
    await pool.end();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    rank_orgs()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
