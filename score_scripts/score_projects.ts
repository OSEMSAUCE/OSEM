#!/usr/bin/env tsx
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../prisma/generated/prisma-postgres/client.js";
import { seedScoreMatrixIfEmpty } from "./scoreMatrix.js";

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

const DEFAULT_FIELD_POINTS = config.defaults.fieldPoints;

function isSystemField(fieldName: string): boolean {
    return (
        fieldName.endsWith("Key") ||
        fieldName.endsWith("At") ||
        fieldName.endsWith("By") ||
        fieldName === "platformId" ||
        fieldName === "randomJson" ||
        fieldName === "errored" ||
        fieldName === "created" ||
        fieldName === "updated" ||
        fieldName === "duplicated" ||
        fieldName === "errorMessage" ||
        fieldName === "parentTable" ||
        fieldName === "parentKey"
    );
}

/**
 * Load the live field weights from ScoreMatrixTable — the source of truth.
 *
 * Bootstraps the table from scoreMatrix.ts if (and only if) it is empty, so a
 * run can never silently score with a flat matrix where every field is worth
 * 1pt and `geometry` (normally 20) is no more valuable than a text blurb.
 * A populated table is never modified here.
 */
async function loadScoreMatrix(): Promise<Map<string, number>> {
    await seedScoreMatrixIfEmpty(prisma);

    const rows = await prisma.scoreMatrixTable.findMany({
        select: { fieldName: true, pointsAvailable: true },
    });
    return new Map(rows.map((r) => [r.fieldName, r.pointsAvailable]));
}

function getFieldPoints(
    fieldName: string,
    scoreMatrix: Map<string, number>,
): number {
    if (isSystemField(fieldName)) return 0;
    return scoreMatrix.get(fieldName) ?? DEFAULT_FIELD_POINTS;
}

export async function score_projects(projectKeys: string[]): Promise<void> {
    console.log(`\n📊 Scoring ${projectKeys.length} dirty projects...`);
    const scoreMatrix = await loadScoreMatrix();

    for (const projectKey of projectKeys) {
        const project = await prisma.projectTable.findUnique({
            where: { projectKey },
            include: {
                LandTable: true,
                CropTable: true,
                PlantingTable: true,
                MiscTable: true,
                StakeholderTable: true,
                SourceTable: true,
            },
        });

        if (!project) continue;

        const granularScores: Array<{
            granularProjectScoreId: string;
            projectKey: string;
            pointsAwarded: number;
            fieldName: string;
            isAwarded: boolean;
            pointsAvailable: number;
        }> = [];

        const allTables = {
            ProjectTable: [project],
            LandTable: project.LandTable || [],
            CropTable: project.CropTable || [],
            PlantingTable: project.PlantingTable || [],
            MiscTable: project.MiscTable || [],
            StakeholderTable: project.StakeholderTable || [],
            SourceTable: project.SourceTable || [],
        };

        for (const [tableName, records] of Object.entries(allTables)) {
            for (const record of records) {
                for (const [fieldName, value] of Object.entries(record)) {
                    const points = getFieldPoints(fieldName, scoreMatrix);
                    if (points === 0) continue;

                    const awarded =
                        value !== null && value !== undefined && value !== "";

                    granularScores.push({
                        granularProjectScoreId: crypto.randomUUID(),
                        projectKey,
                        pointsAwarded: awarded ? points : 0,
                        fieldName: `${tableName}.${fieldName}`,
                        isAwarded: awarded,
                        pointsAvailable: points,
                    });
                }
            }
        }

        await prisma.projectScoreByFieldTable.deleteMany({
            where: { projectKey },
        });
        if (granularScores.length > 0) {
            await prisma.projectScoreByFieldTable.createMany({
                data: granularScores,
            });
        }

        const scorePointsAvailable = granularScores.reduce(
            (sum, s) => sum + s.pointsAvailable,
            0,
        );
        const scorePointsScored = granularScores
            .filter((s) => s.isAwarded)
            .reduce((sum, s) => sum + s.pointsAwarded, 0);
        const scoreProject =
            scorePointsAvailable > 0
                ? scorePointsScored / scorePointsAvailable
                : 0;

        await prisma.projectTable.update({
            where: { projectKey },
            data: {
                scoreProject,
                scorePointsAvailable,
                scorePointsScored,
                scoreLastUpdatedAt: new Date(),
                scoreProjectFlag: false,
            },
        });
    }

    console.log(`✅ Scored ${projectKeys.length} projects`);
}

/**
 * Re-rank ALL projects by percentile. Cheap: one UPDATE ... PERCENT_RANK()
 * statement covering the whole table, ~1s regardless of project count.
 *
 * Because ranking is global and nearly free while scoring is per-project and
 * slow, the correct cadence is "score only what changed, then re-rank
 * everything" — that keeps percentiles exact without a full rescore.
 * Safe to call repeatedly.
 */
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
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const batchSize = args[0]
        ? Number.parseInt(args[0], 10)
        : config.batch.projects.defaultSize;

    // Count total dirty projects upfront
    const totalDirty = await prisma.projectTable.count({
        where: {
            deletedAt: null,
            scoreProjectFlag: true,
        },
    });
    console.log(`\n📋 Found ${totalDirty} dirty projects to score`);

    if (totalDirty === 0) {
        console.log("✅ No dirty projects to score");
        await pool.end();
        process.exit(0);
    }

    let totalScored = 0;
    let batchNum = 0;

    // Loop until no more dirty projects
    while (true) {
        const projectsToScore = await prisma.projectTable.findMany({
            select: { projectKey: true },
            where: {
                deletedAt: null,
                scoreProjectFlag: true,
            },
            take: batchSize,
            orderBy: { scoreLastUpdatedAt: "asc" },
        });

        if (projectsToScore.length === 0) {
            console.log(
                `\n✅ All dirty projects scored. Total: ${totalScored}`,
            );
            break;
        }

        batchNum++;
        const remaining = totalDirty - totalScored;
        console.log(
            `\n📦 Batch ${batchNum}: ${projectsToScore.length} projects (${remaining} remaining)`,
        );

        await score_projects(projectsToScore.map((p) => p.projectKey));
        totalScored += projectsToScore.length;
    }

    await rank_projects();
    await pool.end();
    process.exit(0);
}
