#!/usr/bin/env tsx

/**
 * calc_global_score_projects.ts - Full Project Score Calculation
 *
 * Cleanup rescoring runner: scores projects in bounded chunks.
 * Default run rescoring target is 100 projects, processed in chunks of 10.
 * Ordered by oldest score first so unscored/stale projects are refreshed first.
 *
 * Performance: ~5-10 minutes for 10,000 projects (granular scoring is expensive)
 *
 * Usage:
 *   tsx OSEM/score_scripts/calc_global_score_projects.ts [target] [chunk] [debug]
 *   tsx OSEM/score_scripts/calc_global_score_projects.ts 1000 100 debug
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

async function global_score_projects(target = 100, chunk = 10, debug = false) {
    console.log(
        "\n📊 Global project scoring - fetching projects (oldest scores first)...",
    );

    // Get all projects with their score lastUpdated timestamp
    // Order by lastUpdated ASC NULLS FIRST so we score:
    // 1. Projects never scored (null)
    // 2. Projects with oldest scores
    const allProjectsWithScores = await prisma.projectTable.findMany({
        select: {
            projectKey: true,
            scoreLastUpdated: true,
        },
        where: { deletedAt: null },
        take: target,
        orderBy: {
            scoreLastUpdated: "asc",
        },
    });

    const allProjects = allProjectsWithScores.map((p) => ({
        projectKey: p.projectKey,
    }));

    console.log(
        `Found ${allProjects.length} projects to score (target: ${target}, chunk: ${chunk})${debug ? " [DEBUG MODE]" : ""}\n`,
    );

    const projectKeys = allProjects.map((p) => p.projectKey);

    // Process in batches
    for (let i = 0; i < projectKeys.length; i += chunk) {
        const batch = projectKeys.slice(i, i + chunk);
        const batchNum = Math.floor(i / chunk) + 1;
        const totalBatches = Math.ceil(projectKeys.length / chunk);

        console.log(
            `\n📦 Batch ${batchNum}/${totalBatches} (projects ${i + 1}-${Math.min(i + chunk, projectKeys.length)})`,
        );
        await batch_score_projects(batch, debug);
    }

    console.log("\n✅ Global project scoring complete");
}

// Parse CLI args
const targetArg = process.argv[2] ? Number.parseInt(process.argv[2], 10) : 100;
const chunkArg = process.argv[3] ? Number.parseInt(process.argv[3], 10) : 10;
const debugArg = process.argv[4] === "debug";

global_score_projects(targetArg, chunkArg, debugArg)
    .catch((e) => {
        console.error("❌ Error calculating project scores:", e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
        pool.end();
    });
