#!/usr/bin/env tsx
/**
 * calc_batch_score_projects.ts - Batch Project Scoring
 *
 * Scores ONLY the specified projects (granular + aggregated).
 * Called by orchestrator after batch upsert.
 *
 * Performance: ~2-5 seconds for 50 projects
 *
 * Usage:
 *   import { batch_score_projects } from './calc_batch_score_projects.ts';
 *   await batch_score_projects(projectKeys);
 */

import crypto from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../src/lib/generated/prisma-postgres/client.js";

const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
    throw new Error("DIRECT_URL is not set!");
}

const pool = new pg.Pool({
    connectionString,
    max: 2,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const DEFAULT_FIELD_POINTS = 1;
type ScoreableRecord = Record<string, unknown>;
type GranularScoreRow = {
    granularProjectScoreId: string;
    projectKey: string;
    pointsAwarded: number;
    fieldName: string;
    isAwarded: boolean;
    pointsAvailable: number;
};

const SYSTEM_FIELDS = [
    "projectKey",
    "landKey",
    "cropKey",
    "plantingKey",
    "polygonId",
    "polyKey",
    "stakeholderKey",
    "sourceKey",
    "organizationKey",
    "organizationKey",
    "lastEditedAt",
    "editedBy",
    "deletedAt",
    "createdAt",
    "parentTable",
    "parentKey",
    "platformId",
    "randomJson",
    "errored",
    "created",
    "updated",
    "duplicated",
    "errorMessage",
];

function getFieldPointsWithSystemFilter(
    fieldName: string,
    scoreMatrix: Map<string, number>,
): number {
    if (SYSTEM_FIELDS.includes(fieldName)) return 0;
    return scoreMatrix.get(fieldName) ?? DEFAULT_FIELD_POINTS;
}

async function loadScoreMatrix(): Promise<Map<string, number>> {
    const rows = await prisma.scoreMatrixTable.findMany({
        select: {
            fieldName: true,
            pointsAvailable: true,
        },
    });
    return new Map(
        rows.map((row: { fieldName: string; pointsAvailable: number }) => [
            row.fieldName,
            row.pointsAvailable,
        ]),
    );
}

const SCORED_TABLES = [
    "ProjectTable",
    "LandTable",
    "CropTable",
    "PlantingTable",
    "PolygonTable",
    "PolyTable",
    "StakeholderTable",
    "SourceTable",
];
const BONUSABLE_TABLES = [
    "CropTable",
    "SourceTable",
    "StakeholderTable",
    "PlantingTable",
];

const BASELINE_FIELDS: Record<string, string[]> = {
    CropTable: [
        "cropName",
        "speciesLocalName",
        "speciesId",
        "seedInfo",
        "cropStock",
        "organizationName",
        "cropDesc",
    ],
    SourceTable: [
        "url",
        "urlType",
        "disclosureType",
        "sourceDesc",
        "sourceCredit",
        "stakeholderType",
    ],
    StakeholderTable: ["organizationKey", "stakeholderType"],
    PlantingTable: [
        "plantedQty",
        "allocatedQty",
        "plantingDate",
        "units",
        "unitType",
        "pricePerUnit",
        "currency",
        "pricePerUnitUSD",
    ],
};

export async function batch_score_projects(
    projectKeys: string[],
    debug = false,
): Promise<void> {
    console.log(`\n📊 Batch scoring ${projectKeys.length} projects...`);
    const batchStartTime = Date.now();
    const scoreMatrix = await loadScoreMatrix();

    if (debug) {
        console.log(
            `  ✓ Loaded ${scoreMatrix.size} score matrix overrides (default=${DEFAULT_FIELD_POINTS})`,
        );
    }

    for (let idx = 0; idx < projectKeys.length; idx++) {
        const projectKey = projectKeys[idx];
        const projectStartTime = Date.now();

        if (debug)
            console.log(
                `  [${idx + 1}/${projectKeys.length}] Fetching project ${projectKey}...`,
            );
        const project = await prisma.projectTable.findUnique({
            where: { projectKey },
            include: {
                LandTable: true,
                CropTable: true,
                PlantingTable: true,
                PolyTable: true,
                StakeholderTable: true,
                SourceTable: true,
            },
        });

        if (!project) {
            if (debug) console.log(`  ⚠️  Project not found, skipping`);
            continue;
        }

        const fetchTime = Date.now() - projectStartTime;
        if (debug)
            console.log(`  ✓ Fetched in ${fetchTime}ms, calculating scores...`);

        const granularScores: GranularScoreRow[] = [];

        for (const tableName of SCORED_TABLES) {
            const tableRecords: ScoreableRecord[] =
                tableName === "ProjectTable"
                    ? [project as ScoreableRecord]
                    : ((project as Record<string, unknown>)[tableName] as
                          | ScoreableRecord[]
                          | undefined) || [];
            const isBonusable = BONUSABLE_TABLES.includes(tableName);

            if (isBonusable && tableRecords.length === 0) {
                const baselineFields = BASELINE_FIELDS[tableName] || [];
                for (const fieldName of baselineFields) {
                    const points = getFieldPointsWithSystemFilter(
                        fieldName,
                        scoreMatrix,
                    );
                    if (points === 0) continue;

                    granularScores.push({
                        granularProjectScoreId: crypto.randomUUID(),
                        projectKey,
                        pointsAwarded: 0,
                        fieldName: `${tableName}.${fieldName}`,
                        isAwarded: false,
                        pointsAvailable: points,
                    });
                }
                continue;
            }

            for (
                let recordIndex = 0;
                recordIndex < tableRecords.length;
                recordIndex++
            ) {
                const record = tableRecords[recordIndex];
                const isFirstRecord = recordIndex === 0;

                for (const [fieldName, value] of Object.entries(record)) {
                    const points = getFieldPointsWithSystemFilter(
                        fieldName,
                        scoreMatrix,
                    );
                    if (points === 0) continue;

                    const awarded =
                        value !== null && value !== undefined && value !== "";

                    if (isBonusable && !isFirstRecord && !awarded) {
                        continue;
                    }

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

        const calcTime = Date.now() - projectStartTime - fetchTime;
        if (debug)
            console.log(
                `  ✓ Calculated ${granularScores.length} granular scores in ${calcTime}ms, writing to DB...`,
            );

        // Batch write granular scores (delete old + create new)
        const upsertStartTime = Date.now();
        if (debug)
            console.log(
                `  💾 Batch writing ${granularScores.length} granular scores...`,
            );

        // Delete existing granular scores for this project
        await prisma.projectScoreByFieldTable.deleteMany({
            where: { projectKey },
        });

        // Insert all new scores in one batch
        if (granularScores.length > 0) {
            await prisma.projectScoreByFieldTable.createMany({
                data: granularScores,
            });
        }

        // Calculate aggregated score for this project
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

        // Update ProjectTable with aggregated score
        await prisma.projectTable.update({
            where: { projectKey },
            data: {
                scoreProject,
                scorePointsAvailable,
                scorePointsScored,
                scoreLastUpdated: new Date(),
            },
        });

        const upsertTime = Date.now() - upsertStartTime;
        const totalProjectTime = Date.now() - projectStartTime;
        if (debug)
            console.log(
                `  ✓ DB writes in ${upsertTime}ms | Total: ${totalProjectTime}ms\n`,
            );
    }

    const totalBatchTime = ((Date.now() - batchStartTime) / 1000).toFixed(1);
    console.log(
        `✅ Batch scored ${projectKeys.length} projects in ${totalBatchTime}s`,
    );
    await pool.end();
}

// Allow running standalone for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const testprojectKeys = process.argv.slice(2);
    if (testprojectKeys.length === 0) {
        console.error(
            "Usage: tsx calc_batch_score_projects.ts <projectKey1> <projectKey2> ...",
        );
        process.exit(1);
    }
    batch_score_projects(testprojectKeys)
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
