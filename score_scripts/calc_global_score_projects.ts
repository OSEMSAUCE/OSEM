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
 *   tsx OSEM/score_scripts/calc_global_score_projects.ts
 *   or via CLI.sh: ./CLI.sh global_score_projects
 */

import { batch_score_projects } from "./calc_batch_score_projects.js";
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

async function global_score_projects() {
    console.log("\n📊 Global project scoring - fetching all projects...");
    
    const allProjects = await prisma.projectTable.findMany({
        select: { projectId: true },
    });

    console.log(`Found ${allProjects.length} projects to score\n`);

    const projectIds = allProjects.map(p => p.projectId);
    await batch_score_projects(projectIds);

    console.log("\n✅ Global project scoring complete");
}

global_score_projects()
    .catch((e) => {
        console.error("❌ Error calculating project scores:", e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
        pool.end();
    });
