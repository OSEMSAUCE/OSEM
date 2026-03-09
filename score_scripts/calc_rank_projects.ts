#!/usr/bin/env tsx
/**
 * calc_rank_projects.ts - Project Percentile Ranking
 *
 * Re-calculates percentiles for ALL projects using SQL window function.
 * Always operates on all projects (global operation).
 *
 * Performance: <1 second for 10,000 projects (SQL window function is fast)
 *
 * Usage:
 *   tsx OSEM/score_scripts/calc_rank_projects.ts
 *   or via CLI.sh: ./CLI.sh rank_projects
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

export async function rank_projects(): Promise<void> {
    console.log("\n📊 Re-calculating project percentiles...");

    await prisma.$executeRawUnsafe(`
        UPDATE "ProjectScore_agg_helper" ps
        SET "project_rank" = ranked."project_rank"
        FROM (
            SELECT
                "aggProjectScoreId",
                ROUND(PERCENT_RANK() OVER (ORDER BY "project_score") * 100)::int AS "project_rank"
            FROM "ProjectScore_agg_helper"
            WHERE "project_score" IS NOT NULL
        ) ranked
        WHERE ps."aggProjectScoreId" = ranked."aggProjectScoreId"
    `);

    console.log("✅ Project percentiles updated");
    await pool.end();
}

// Allow running standalone
if (import.meta.url === `file://${process.argv[1]}`) {
    rank_projects()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
