#!/usr/bin/env tsx
import crypto from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../src/lib/generated/prisma-postgres/client.js";

const connectionString = process.env.DIRECT_URL;
if (!connectionString) throw new Error("DIRECT_URL is not set!");

const pool = new pg.Pool({
    connectionString,
    max: 2,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_FIELD_POINTS = 1;

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

async function loadScoreMatrix(): Promise<Map<string, number>> {
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
    console.log(`\n📊 Scoring ${projectKeys.length} projects...`);
    const scoreMatrix = await loadScoreMatrix();

    for (const projectKey of projectKeys) {
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
            PolyTable: project.PolyTable || [],
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
                scoreLastUpdated: new Date(),
            },
        });
    }

    console.log(`✅ Scored ${projectKeys.length} projects`);
    await pool.end();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const target = args[0] ? Number.parseInt(args[0], 10) : 100;

    const projectsToScore = await prisma.projectTable.findMany({
        select: { projectKey: true },
        where: { deletedAt: null },
        take: target,
        orderBy: { scoreLastUpdated: "asc" },
    });

    score_projects(projectsToScore.map((p) => p.projectKey))
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
