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
 *   await batch_score_projects(projectIds);
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

// Field scoring matrix
function getFieldPoints(fieldName: string): number {
    const systemFields = [
        "projectId", "landId", "cropId", "plantingId", "polygonId", "polyId",
        "stakeholderId", "sourceId", "organizationLocalId", "organizationId",
        "lastEditedAt", "editedBy", "deletedAt", "createdAt", "parentTable",
        "parentId", "platformId", "randomJson", "errored", "created", "updated",
        "duplicated", "errorMessage",
    ];
    if (systemFields.includes(fieldName)) return 0;

    if (fieldName === "geometry") return 20;
    if (["gpsLat", "gpsLon", "cropName", "speciesId", "plantingDate", "plotCenter", "radius"].includes(fieldName)) return 5;
    if (fieldName === "planted") return 3;
    if (["stakeholderType", "pricePerUnitUSD", "pricePerUnit"].includes(fieldName)) return 2;
    return 1;
}

const SCORED_TABLES = ["ProjectTable", "LandTable", "CropTable", "PlantingTable", "PolygonTable", "PolyTable", "StakeholderTable", "SourceTable"];
const BONUSABLE_TABLES = ["CropTable", "SourceTable", "StakeholderTable", "PlantingTable"];

const BASELINE_FIELDS: Record<string, string[]> = {
    CropTable: ["cropName", "speciesLocalName", "speciesId", "seedInfo", "cropStock", "organizationLocalName", "cropNotes"],
    SourceTable: ["url", "urlType", "disclosureType", "sourceDescription", "sourceCredit", "stakeholderType"],
    StakeholderTable: ["organizationLocalId", "stakeholderType"],
    PlantingTable: ["planted", "allocated", "plantingDate", "units", "unitType", "pricePerUnit", "currency", "pricePerUnitUSD"],
};

export async function batch_score_projects(projectIds: string[]): Promise<void> {
    console.log(`\n📊 Batch scoring ${projectIds.length} projects...`);

    for (const projectId of projectIds) {
        const project = await prisma.projectTable.findUnique({
            where: { projectId },
            include: {
                LandTable: true,
                CropTable: true,
                PlantingTable: true,
                PolyTable: true,
                StakeholderTable: true,
                SourceTable: true,
            },
        });

        if (!project) continue;

        const granularScores: any[] = [];
        
        for (const tableName of SCORED_TABLES) {
            const tableRecords = tableName === "ProjectTable" ? [project] : ((project as any)[tableName] || []);
            const isBonusable = BONUSABLE_TABLES.includes(tableName);

            if (isBonusable && tableRecords.length === 0) {
                const baselineFields = BASELINE_FIELDS[tableName] || [];
                for (const fieldName of baselineFields) {
                    const points = getFieldPoints(fieldName);
                    if (points === 0) continue;

                    granularScores.push({
                        granularProjectScoreId: `${projectId}-${tableName}.${fieldName}`,
                        projectId,
                        sum_field_score: points,
                        field_name: `${tableName}.${fieldName}`,
                        is_awarded: false,
                        sum_points_per_field: points,
                    });
                }
                continue;
            }

            for (let recordIndex = 0; recordIndex < tableRecords.length; recordIndex++) {
                const record = tableRecords[recordIndex];
                const isFirstRecord = recordIndex === 0;

                for (const [fieldName, value] of Object.entries(record)) {
                    const points = getFieldPoints(fieldName);
                    if (points === 0) continue;

                    const awarded = value !== null && value !== undefined && value !== "";

                    if (isBonusable && !isFirstRecord && !awarded) {
                        continue;
                    }

                    granularScores.push({
                        granularProjectScoreId: `${projectId}-${tableName}.${fieldName}`,
                        projectId,
                        sum_field_score: points,
                        field_name: `${tableName}.${fieldName}`,
                        is_awarded: awarded,
                        sum_points_per_field: points,
                    });
                }
            }
        }

        // Upsert granular scores
        for (const score of granularScores) {
            await prisma.projectScore_granular_helper.upsert({
                where: { granularProjectScoreId: score.granularProjectScoreId },
                create: score,
                update: {
                    sum_field_score: score.sum_field_score,
                    is_awarded: score.is_awarded,
                    sum_points_per_field: score.sum_points_per_field,
                },
            });
        }

        // Calculate aggregated score for this project
        const sum_points_available = granularScores.reduce((sum, s) => sum + s.sum_points_per_field, 0);
        const sum_points_scored = granularScores
            .filter(s => s.is_awarded)
            .reduce((sum, s) => sum + s.sum_field_score, 0);
        const project_score = sum_points_available > 0 
            ? (sum_points_scored / sum_points_available) 
            : 0;

        const localDate = new Date(Date.now() - 7 * 60 * 60 * 1000);
        const now = localDate.toISOString().replace('T', ' ').substring(0, 19);
        
        await prisma.projectScore_agg_helper.upsert({
            where: { projectId },
            create: {
                aggProjectScoreId: crypto.randomUUID(),
                projectId,
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
    }

    console.log(`✅ Batch scored ${projectIds.length} projects`);
    await pool.end();
}

// Allow running standalone for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const testProjectIds = process.argv.slice(2);
    if (testProjectIds.length === 0) {
        console.error("Usage: tsx calc_batch_score_projects.ts <projectId1> <projectId2> ...");
        process.exit(1);
    }
    batch_score_projects(testProjectIds)
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
