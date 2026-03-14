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
import { getFieldPoints } from "./score_field_points.js";

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

function getFieldPointsWithSystemFilter(fieldName: string): number {
    if (SYSTEM_FIELDS.includes(fieldName)) return 0;
    return getFieldPoints(fieldName);
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
        "cropNotes",
    ],
    SourceTable: [
        "url",
        "urlType",
        "disclosureType",
        "sourceDescription",
        "sourceCredit",
        "stakeholderType",
    ],
    StakeholderTable: ["organizationKey", "stakeholderType"],
    PlantingTable: [
        "plantedCount",
        "allocated",
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

        const granularScores: any[] = [];

        for (const tableName of SCORED_TABLES) {
            const tableRecords =
                tableName === "ProjectTable"
                    ? [project]
                    : (project as any)[tableName] || [];
            const isBonusable = BONUSABLE_TABLES.includes(tableName);

            if (isBonusable && tableRecords.length === 0) {
                const baselineFields = BASELINE_FIELDS[tableName] || [];
                for (const fieldName of baselineFields) {
                    const points = getFieldPointsWithSystemFilter(fieldName);
                    if (points === 0) continue;

                    granularScores.push({
                        granularProjectScoreId: crypto.randomUUID(),
                        projectKey,
                        sum_field_score: points,
                        field_name: `${tableName}.${fieldName}`,
                        is_awarded: false,
                        sum_points_per_field: points,
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
                    const points = getFieldPointsWithSystemFilter(fieldName);
                    if (points === 0) continue;

                    const awarded =
                        value !== null && value !== undefined && value !== "";

                    if (isBonusable && !isFirstRecord && !awarded) {
                        continue;
                    }

                    granularScores.push({
                        granularProjectScoreId: crypto.randomUUID(),
                        projectKey,
                        sum_field_score: points,
                        field_name: `${tableName}.${fieldName}`,
                        is_awarded: awarded,
                        sum_points_per_field: points,
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
        await prisma.projectScore_granular_helper.deleteMany({
            where: { projectKey },
        });

        // Insert all new scores in one batch
        if (granularScores.length > 0) {
            await prisma.projectScore_granular_helper.createMany({
                data: granularScores,
            });
        }

        // Calculate aggregated score for this project
        const sum_points_available = granularScores.reduce(
            (sum, s) => sum + s.sum_points_per_field,
            0,
        );
        const sum_points_scored = granularScores
            .filter((s) => s.is_awarded)
            .reduce((sum, s) => sum + s.sum_field_score, 0);
        const project_score =
            sum_points_available > 0
                ? sum_points_scored / sum_points_available
                : 0;

        const localDate = new Date(Date.now() - 7 * 60 * 60 * 1000);
        const now = localDate.toISOString().replace("T", " ").substring(0, 19);

        await prisma.projectScore_agg_helper.upsert({
            where: { projectKey },
            create: {
                aggProjectScoreId: crypto.randomUUID(),
                projectKey,
                project_score,
                sum_points_available,
                sum_points_scored,
                lastUpdatedHuman: now,
            },
            update: {
                project_score,
                sum_points_available,
                sum_points_scored,
                lastUpdatedHuman: now,
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
