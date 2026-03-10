#!/usr/bin/env tsx

/**
 * calc_global_score_projects.ts - Full Project Score Calculation
 *
 * Scores ALL projects in the database (granular + aggregated).
 * This is the SINGLE SOURCE OF TRUTH for project score calculation.
 * Reads from ProjectScore_granular_helper, calculates aggregated scores.
 *
 * Performance: ~5-10 minutes for 10,000 projects (granular scoring is expensive)
 *
 * Usage:
 *   tsx OSEM/score_scripts/calc_global_score_projects.ts [limit] [batchSize] [debug]
 *   tsx OSEM/score_scripts/calc_global_score_projects.ts 100 25 debug  # Score first 100 projects, 25 at a time, with debug logs
 *   or via CLI.sh: ./CLI.sh global_score_projects
 */

import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../src/lib/generated/prisma-postgres/client.js";
import { batch_score_projects } from "./calc_batch_score_projects.js";

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

async function global_score_projects(
    limit?: number,
    batchSize = 50,
    debug = false,
) {
    console.log("\n📊 Global project scoring - fetching all projects...");

    const allProjects = await prisma.projectTable.findMany({
        select: { projectId: true },
        take: limit,
    });

    console.log(
        `Found ${allProjects.length} projects to score (batch size: ${batchSize})${debug ? " [DEBUG MODE]" : ""}\n`,
    );

    const projectIds = allProjects.map((p) => p.projectId);

    // Process in batches
    for (let i = 0; i < projectIds.length; i += batchSize) {
        const batch = projectIds.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(projectIds.length / batchSize);

        console.log(
            `\n📦 Batch ${batchNum}/${totalBatches} (projects ${i + 1}-${Math.min(i + batchSize, projectIds.length)})`,
        );
        await batch_score_projects(batch, debug);
    }

    console.log("\n✅ Global project scoring complete");
}

// Parse CLI args
const limitArg = process.argv[2]
    ? Number.parseInt(process.argv[2], 10)
    : undefined;
const batchSizeArg = process.argv[3]
    ? Number.parseInt(process.argv[3], 10)
    : 50;
const debugArg = process.argv[4] === "debug";

global_score_projects(limitArg, batchSizeArg, debugArg)
    .catch((e) => {
        console.error("❌ Error calculating project scores:", e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
        pool.end();
    });
