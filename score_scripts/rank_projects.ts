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

export async function rank_projects(): Promise<void> {
    console.log("\n📊 Ranking projects...");

    await prisma.$executeRawUnsafe(`
        UPDATE "ProjectTable" pt
        SET "scoreProjectRank" = ranked."scoreProjectRank"
        FROM (
            SELECT
                "projectKey",
                ROUND(PERCENT_RANK() OVER (ORDER BY "scoreProject") * 100)::int AS "scoreProjectRank"
            FROM "ProjectTable"
            WHERE "scoreProject" IS NOT NULL
              AND "deletedAt" IS NULL
        ) ranked
        WHERE pt."projectKey" = ranked."projectKey"
    `);

    console.log("✅ Projects ranked");
    await pool.end();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    rank_projects()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
