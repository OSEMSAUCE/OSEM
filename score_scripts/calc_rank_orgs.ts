#!/usr/bin/env tsx
/**
 * calc_rank_orgs.ts - Organization Percentile Ranking
 *
 * Re-calculates percentiles for ALL organizations using SQL window function.
 * Always operates on all orgs (global operation).
 * Calculates both overall rank and rank-by-type.
 *
 * Performance: <1 second for all orgs (SQL window function is fast)
 *
 * Usage:
 *   tsx OSEM/score_scripts/calc_rank_orgs.ts
 *   or via CLI.sh: ./CLI.sh rank_orgs
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

export async function rank_orgs(): Promise<void> {
    console.log("\n📊 Re-calculating org percentiles...");

    // Overall percentile
    await prisma.$executeRawUnsafe(`
        UPDATE "OrgScore_helper" os
        SET "org_rank_overall" = ranked."org_rank_overall"
        FROM (
            SELECT
                "orgScoreId",
                ROUND(PERCENT_RANK() OVER (ORDER BY "org_score_final") * 100)::int AS "org_rank_overall"
            FROM "OrgScore_helper"
            WHERE "org_score_final" IS NOT NULL
        ) ranked
        WHERE os."orgScoreId" = ranked."orgScoreId"
    `);

    // Percentile by type
    await prisma.$executeRawUnsafe(`
        UPDATE "OrgScore_helper" os
        SET "org_rank_by_type" = ranked."org_rank_by_type"
        FROM (
            SELECT
                "orgScoreId",
                ROUND(PERCENT_RANK() OVER (
                    PARTITION BY "primaryStakeholderType"
                    ORDER BY "org_score_final"
                ) * 100)::int AS "org_rank_by_type"
            FROM "OrgScore_helper"
            WHERE "primaryStakeholderType" IS NOT NULL
              AND "org_score_final" IS NOT NULL
        ) ranked
        WHERE os."orgScoreId" = ranked."orgScoreId"
    `);

    console.log("✅ Org percentiles updated");
    await pool.end();
}

// Allow running standalone
if (import.meta.url === `file://${process.argv[1]}`) {
    rank_orgs()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
