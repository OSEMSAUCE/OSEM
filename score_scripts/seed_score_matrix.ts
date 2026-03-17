#!/usr/bin/env tsx
/**
 * seed_score_matrix.ts - Populate ScoreMatrixTable with field point weights
 *
 * Run once after creating ScoreMatrixTable to set anomaly weights.
 * Non-listed fields default to 1 point in scoring logic.
 *
 * Usage: tsx seed_score_matrix.ts
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
    max: 2,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Initial anomaly weights
const FIELD_WEIGHTS = [
    {
        fieldName: "geometry",
        pointsAvailable: 20,
        description: "GeoJSON geometry data",
    },
    {
        fieldName: "polygonId",
        pointsAvailable: 20,
        description: "Polygon identifier",
    },
    {
        fieldName: "latitude",
        pointsAvailable: 5,
        description: "Latitude coordinate",
    },
    {
        fieldName: "longitude",
        pointsAvailable: 5,
        description: "Longitude coordinate",
    },
    {
        fieldName: "cropName",
        pointsAvailable: 5,
        description: "Crop/species name",
    },
    {
        fieldName: "speciesId",
        pointsAvailable: 5,
        description: "Species identifier",
    },
    {
        fieldName: "plantingDate",
        pointsAvailable: 5,
        description: "Date of planting",
    },
    {
        fieldName: "plantedQty",
        pointsAvailable: 3,
        description: "Quantity planted",
    },
    {
        fieldName: "stakeholderType",
        pointsAvailable: 2,
        description: "Type of stakeholder",
    },
    {
        fieldName: "organizationKey",
        pointsAvailable: 2,
        description: "Organization identifier",
    },
    {
        fieldName: "pricePerUnitUSD",
        pointsAvailable: 2,
        description: "Price per unit in USD",
    },
    {
        fieldName: "pricePerUnit",
        pointsAvailable: 2,
        description: "Price per unit (local currency)",
    },
    {
        fieldName: "plotCenter",
        pointsAvailable: 5,
        description: "Plot center coordinates",
    },
    { fieldName: "radius", pointsAvailable: 5, description: "Plot radius" },
    // TODO: Add randomJson fields with 0.5 points each when implementing JSON field scoring
];

async function seedScoreMatrix() {
    console.log("🌱 Seeding ScoreMatrixTable...");

    // Clear existing data
    await prisma.scoreMatrixTable.deleteMany({});
    console.log("  ✓ Cleared existing records");

    // Insert field weights
    await prisma.scoreMatrixTable.createMany({
        data: FIELD_WEIGHTS,
    });

    console.log(
        `  ✓ Inserted ${FIELD_WEIGHTS.length} field weight configurations`,
    );
    console.log("\n📊 Field weights:");
    for (const field of FIELD_WEIGHTS) {
        console.log(
            `  ${field.fieldName.padEnd(20)} → ${field.pointsAvailable} points`,
        );
    }
    console.log("\n✅ ScoreMatrixTable seeded successfully");
    console.log(
        "💡 All other fields default to 1 point (handled in application logic)",
    );

    await pool.end();
}

seedScoreMatrix()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    });
