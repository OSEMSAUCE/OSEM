#!/usr/bin/env tsx
/**
 * Calculate project aggregated scores from granular score helper table
 *
 * This is the SINGLE SOURCE OF TRUTH for project score calculation.
 * Reads from ProjectScore_granular_helper, calculates aggregated scores.
 *
 * Usage:
 *   tsx scripts/calculateProjectScores.ts
 *   or via MASTER.sh: ./MASTER.sh calculate_project_scores
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

// Field scoring matrix - SINGLE SOURCE OF TRUTH
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
    CropTable: [
        "cropName",
        "speciesLocalName",
        "speciesId",
        "seedInfo",
        "cropStock",
        "organizationLocalName",
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
    StakeholderTable: [
        "organizationLocalId",
        "stakeholderType",
    ],
    PlantingTable: [
        "planted",
        "allocated",
        "plantingDate",
        "units",
        "unitType",
        "pricePerUnit",
        "currency",
        "pricePerUnitUSD",
    ],
};

async function backfillMissingGranularScores(aggregateEvery: number = 100, limit?: number) {
    console.log("\n🔄 Step 1: Backfilling missing granular scores...\n");

    // Find projects without granular scores
    const allProjects = await prisma.projectTable.findMany({ select: { projectId: true } });
    const projectsWithScores = await prisma.$queryRaw<Array<{ projectId: string }>>`
        SELECT DISTINCT "projectId" FROM "ProjectScore_granular_helper"
    `;
    const scoredIds = new Set(projectsWithScores.map(p => p.projectId));
    let missingProjects = allProjects.filter(p => !scoredIds.has(p.projectId));

    console.log(`Total projects: ${allProjects.length}`);
    console.log(`Projects with scores: ${projectsWithScores.length}`);
    console.log(`Missing scores: ${missingProjects.length}`);
    if (limit) {
        console.log(`Limit: processing only ${limit} projects`);
        missingProjects = missingProjects.slice(0, limit);
    }
    console.log(`Aggregation frequency: every ${aggregateEvery} projects\n`);

    if (missingProjects.length === 0) {
        console.log("✅ All projects already have granular scores\n");
        return;
    }

    console.log(`\n📝 Generating granular scores for ${missingProjects.length} projects...\n`);

    let processed = 0;
    const recentProjectIds: string[] = [];
    for (const { projectId } of missingProjects) {
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

            // For bonusable tables with no records, create baseline granular scores (all awarded=false)
            if (isBonusable && tableRecords.length === 0) {
                const baselineFields = BASELINE_FIELDS[tableName] || [];
                for (const fieldName of baselineFields) {
                    const points = getFieldPoints(fieldName);
                    if (points === 0) continue;

                    granularScores.push({
                        granularScoreId: `${projectId}-${tableName}.${fieldName}`,
                        projectId,
                        AttributeScore: points,
                        attributeName: `${tableName}.${fieldName}`,
                        awarded: false,
                        pointsPerAttribute: points,
                        lastUpdated: new Date(),
                        lastUpdatedHuman: new Date().toLocaleString("en-US", {
                            timeZone: "America/Los_Angeles",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                        }),
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

                    // Bonusable table logic:
                    // - First record: all fields count (establishes baseline)
                    // - Additional records: only populated fields count (bonus points, skip empty fields)
                    if (isBonusable && !isFirstRecord && !awarded) {
                        continue;
                    }

                    granularScores.push({
                        granularScoreId: `${projectId}-${tableName}.${fieldName}`,
                        projectId,
                        AttributeScore: points,
                        attributeName: `${tableName}.${fieldName}`,
                        awarded,
                        pointsPerAttribute: points,
                        lastUpdated: new Date(),
                        lastUpdatedHuman: new Date().toLocaleString("en-US", {
                            timeZone: "America/Los_Angeles",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                        }),
                    });
                }
            }
        }

        if (granularScores.length > 0) {
            await prisma.projectScore_granular_helper.createMany({
                data: granularScores,
                skipDuplicates: true,
            });
        }

        processed++;
        recentProjectIds.push(projectId);

        // Periodic aggregation
        if (processed % aggregateEvery === 0) {
            console.log(`  📊 Calculating aggregated scores for last ${aggregateEvery} projects...`);
            const calculated = await calculateAggregatedScoresForProjects(recentProjectIds);
            console.log(`  ✅ Processed ${processed}/${missingProjects.length} projects (${calculated} aggregated)`);
            recentProjectIds.length = 0;
        } else if (processed % 10 === 0) {
            console.log(`  Processed ${processed}/${missingProjects.length} projects`);
        }
    }

    // Calculate aggregated scores for remaining projects
    if (recentProjectIds.length > 0) {
        console.log(`\n📊 Calculating aggregated scores for final ${recentProjectIds.length} projects...`);
        await calculateAggregatedScoresForProjects(recentProjectIds);
    }

    console.log(`\n✅ Backfill complete: ${processed} projects processed\n`);
}

async function calculateAggregatedScoresForProjects(projectIds: string[]) {
    let calculated = 0;

    for (const projectId of projectIds) {
        // Get all granular scores for this project
        const granularScores =
            await prisma.projectScore_granular_helper.findMany({
                where: { projectId },
                select: {
                    awarded: true,
                    pointsPerAttribute: true,
                },
            });

        // Calculate totals
        let pointsScored = 0;
        let pointsAvailable = 0;

        for (const score of granularScores) {
            pointsAvailable += score.pointsPerAttribute;
            if (score.awarded) {
                pointsScored += score.pointsPerAttribute;
            }
        }

        // Calculate percentage score
        const projectScore =
            pointsAvailable > 0 ? (pointsScored / pointsAvailable) * 100 : 0;

        // Upsert aggregated score
        await prisma.projectScore_agg_helper.upsert({
            where: { projectId },
            create: {
                aggScoreId: `score-${projectId}`,
                projectId,
                projectScore,
                pointsAvailible: pointsAvailable,
                pointsScored,
                projectPercentile: null,
                deletedAt: null,
            },
            update: {
                projectScore,
                pointsAvailible: pointsAvailable,
                pointsScored,
            },
        });

        calculated++;
    }

    return calculated;
}

async function calculateProjectScores() {
    console.log("\n📊 Step 2: Calculating project aggregated scores...\n");

    // Get all projects with granular scores
    const projectsWithScores = await prisma.$queryRaw<
        Array<{ projectId: string }>
    >`
        SELECT DISTINCT "projectId"
        FROM "ProjectScore_granular_helper"
    `;

    console.log(
        `Found ${projectsWithScores.length} projects with granular scores`,
    );

    const projectIds = projectsWithScores.map(p => p.projectId);
    const calculated = await calculateAggregatedScoresForProjects(projectIds);

    // Calculate percentiles
    console.log("\n📊 Calculating percentiles...");

    await prisma.$executeRawUnsafe(`
        UPDATE "ProjectScore_agg_helper" ps
        SET "projectPercentile" = ranked."projectPercentile"
        FROM (
            SELECT
                "aggScoreId",
                ROUND(PERCENT_RANK() OVER (ORDER BY "projectScore") * 100)::int AS "projectPercentile"
            FROM "ProjectScore_agg_helper"
            WHERE "deletedAt" IS NULL
        ) ranked
        WHERE ps."aggScoreId" = ranked."aggScoreId"
    `);

    console.log(`\n✅ Calculated ${calculated} project aggregated scores`);
    console.log(`✅ Percentiles calculated\n`);
}

async function main() {
    // Parse command-line arguments: [limit] [aggregateEvery]
    // Usage: tsx calculateProjectScores.ts 10        (limit to 10 projects, aggregate every 100)
    //        tsx calculateProjectScores.ts 10 5      (limit to 10 projects, aggregate every 5)
    const limit = process.argv[2] ? parseInt(process.argv[2]) : undefined;
    const aggregateEvery = process.argv[3] ? parseInt(process.argv[3]) : 100;
    
    if (aggregateEvery < 1) {
        console.error("❌ Aggregation frequency must be >= 1");
        process.exit(1);
    }

    await backfillMissingGranularScores(aggregateEvery, limit);
    await calculateProjectScores();
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
