#!/usr/bin/env tsx
/**
 * calc_batch_scores.ts - Batch Score Calculation for Orchestrator
 * 
 * Fast batch scoring: only score new projects, then re-rank everything.
 * Called by orchestrator after each batch upsert.
 * 
 * Performance:
 * - batch_score_projects: ~2-5 seconds (only new projects)
 * - rank_projects: <1 second (SQL window function on all projects)
 * - batch_score_orgs: ~2-3 seconds (recalc all orgs - they're fast)
 * - rank_orgs: <1 second (SQL window function on all orgs)
 * Total: ~5-10 seconds vs minutes for full recalculation
 * 
 * Usage (from orchestrator):
 *   import { batchScore } from './calc_batch_scores.ts';
 *   await batchScore(batchProjectIds);
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
    max: 5,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Field scoring matrix - matches calculateProjectScores.ts
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

/**
 * Step 1: Calculate scores for batch of new projects only
 */
async function batch_score_projects(projectIds: string[]): Promise<void> {
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
        const project_pct_score = sum_points_available > 0 
            ? (sum_points_scored / sum_points_available) * 100 
            : 0;

        await prisma.projectScore_agg_helper.upsert({
            where: { projectId },
            create: {
                aggProjectScoreId: crypto.randomUUID(),
                projectId,
                project_pct_score,
                sum_points_available,
                sum_points_scored,
            },
            update: {
                project_pct_score,
                sum_points_available,
                sum_points_scored,
            },
        });
    }

    console.log(`✅ Batch scored ${projectIds.length} projects`);
}

/**
 * Step 2: Re-calculate percentiles for ALL projects (fast SQL window function)
 */
async function rank_projects(): Promise<void> {
    console.log("\n📊 Re-calculating project percentiles...");

    await prisma.$executeRawUnsafe(`
        UPDATE "ProjectScore_agg_helper" ps
        SET "project_rank" = ranked."project_rank"
        FROM (
            SELECT
                "aggProjectScoreId",
                ROUND(PERCENT_RANK() OVER (ORDER BY "project_pct_score") * 100)::int AS "project_rank"
            FROM "ProjectScore_agg_helper"
            WHERE "project_pct_score" IS NOT NULL
        ) ranked
        WHERE ps."aggProjectScoreId" = ranked."aggProjectScoreId"
    `);

    console.log("✅ Project percentiles updated");
}

/**
 * Step 3: Recalculate ALL org scores (fast enough to just do everything)
 */
async function batch_score_orgs(): Promise<void> {
    console.log(`\n🏢 Recalculating all organization scores...`);

    // Get all master organizations
    const allOrgs = await prisma.organizationTable.findMany({
        select: { organizationId: true },
    });

    console.log(`📊 Processing ${allOrgs.length} organizations...`);

    for (const { organizationId } of allOrgs) {
        // Get all local orgs for this master org
        const localOrgs = await prisma.organizationLocalTable.findMany({
            where: { organizationId },
            select: { organizationLocalId: true },
        });

        const localOrgIds = localOrgs.map(lo => lo.organizationLocalId);
        if (localOrgIds.length === 0) continue;

        // Get all projects via StakeholderTable
        const projectScores = await prisma.$queryRaw<Array<{ project_pct_score: number }>>`
            SELECT DISTINCT ps."project_pct_score"
            FROM "ProjectScore_agg_helper" ps
            INNER JOIN "StakeholderTable" st ON ps."projectId" = st."projectId"
            WHERE st."organizationLocalId" = ANY(${localOrgIds}::text[])
              AND ps."project_pct_score" IS NOT NULL
        `;

        if (projectScores.length === 0) continue;

        const org_pct_pre_claim = projectScores.reduce((sum, p) => sum + Number(p.project_pct_score), 0) / projectScores.length;

        // Get claim data
        const claims = await prisma.claimTable.findMany({
            where: { organizationId },
            select: { claimCount: true },
        });
        const sum_claimed = claims.reduce((sum, c) => sum + (c.claimCount || 0), 0);

        const plantings = await prisma.$queryRaw<Array<{ planted: number }>>`
            SELECT p."planted"
            FROM "PlantingTable" p
            INNER JOIN "ProjectTable" pt ON p."projectId" = pt."projectId"
            INNER JOIN "StakeholderTable" st ON pt."projectId" = st."projectId"
            WHERE st."organizationLocalId" = ANY(${localOrgIds}::text[])
              AND p."planted" IS NOT NULL
        `;
        const sum_planted = plantings.reduce((sum, p) => sum + (p.planted || 0), 0);

        const sum_undisclosed = sum_claimed - sum_planted;
        const ratio_disclosure = sum_claimed > 0 ? sum_planted / sum_claimed : 1.0;
        const org_pct_final = org_pct_pre_claim * ratio_disclosure;

        // Get primary stakeholder type
        const stakeholderTypes = await prisma.$queryRaw<Array<{ stakeholderType: string; count: bigint }>>`
            SELECT st."stakeholderType", COUNT(*) as count
            FROM "StakeholderTable" st
            WHERE st."organizationLocalId" = ANY(${localOrgIds}::text[])
              AND st."stakeholderType" IS NOT NULL
            GROUP BY st."stakeholderType"
            ORDER BY count DESC
            LIMIT 1
        `;
        const primaryStakeholderType = stakeholderTypes[0]?.stakeholderType || null;

        await prisma.orgScore_helper.upsert({
            where: { organizationId },
            create: {
                orgScoreId: crypto.randomUUID(),
                organizationId,
                org_pct_pre_claim,
                sum_claimed,
                sum_planted,
                sum_undisclosed,
                org_pct_final,
                primaryStakeholderType,
            },
            update: {
                org_pct_pre_claim,
                sum_claimed,
                sum_planted,
                sum_undisclosed,
                org_pct_final,
                primaryStakeholderType,
            },
        });
    }

    console.log(`✅ Recalculated ${allOrgs.length} organizations`);
}

/**
 * Step 4: Re-calculate percentiles for ALL orgs (fast SQL window function)
 */
async function rank_orgs(): Promise<void> {
    console.log("\n📊 Re-calculating org percentiles...");

    // Overall percentile
    await prisma.$executeRawUnsafe(`
        UPDATE "OrgScore_helper" os
        SET "org_rank_overall" = ranked."org_rank_overall"
        FROM (
            SELECT
                "orgScoreId",
                ROUND(PERCENT_RANK() OVER (ORDER BY "org_pct_final") * 100)::int AS "org_rank_overall"
            FROM "OrgScore_helper"
            WHERE "org_pct_final" IS NOT NULL
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
                    ORDER BY "org_pct_final"
                ) * 100)::int AS "org_rank_by_type"
            FROM "OrgScore_helper"
            WHERE "primaryStakeholderType" IS NOT NULL
              AND "org_pct_final" IS NOT NULL
        ) ranked
        WHERE os."orgScoreId" = ranked."orgScoreId"
    `);

    console.log("✅ Org percentiles updated");
}

/**
 * Main entry point: Incremental batch scoring
 * Call this from orchestrator after batch upsert completes
 */
export async function batchScore(batchProjectIds: string[]): Promise<void> {
    const startTime = Date.now();
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🚀 INCREMENTAL BATCH SCORING - ${batchProjectIds.length} projects`);
    console.log(`${"=".repeat(80)}`);

    try {
        // 1. Calculate scores for new batch only
        await batch_score_projects(batchProjectIds);

        // 2. Re-rank ALL projects (fast SQL)
        await rank_projects();

        // 3. Recalculate ALL org scores (fast - just averages)
        await batch_score_orgs();

        // 4. Re-rank ALL orgs (fast SQL)
        await rank_orgs();

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n${"=".repeat(80)}`);
        console.log(`✅ INCREMENTAL SCORING COMPLETE - ${elapsed}s`);
        console.log(`${"=".repeat(80)}\n`);
    } catch (error) {
        console.error("❌ Incremental scoring failed:", error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Allow running standalone for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const testProjectIds = process.argv.slice(2);
    if (testProjectIds.length === 0) {
        console.error("Usage: tsx calculateScoresIncremental.ts <projectId1> <projectId2> ...");
        process.exit(1);
    }
    batchScore(testProjectIds)
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
