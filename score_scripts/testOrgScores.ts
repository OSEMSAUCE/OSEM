#!/usr/bin/env tsx

/**
 * Test org score calculations on a few organizations
 * Shows preClaimScore → orgScore transformation with claim penalty
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/lib/generated/prisma-postgres/client.js";

const pool = new Pool({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testOrgScores() {
    console.log("\n🧪 Testing Org Score Calculations\n");
    console.log("=".repeat(100));

    // Get a few orgs with scores
    const orgs = await prisma.orgScore_agg_helper.findMany({
        take: 10,
        orderBy: { preClaimScore: "desc" },
    });

    console.log(`\nFound ${orgs.length} organizations with scores\n`);

    for (const org of orgs) {
        // Get org name separately
        const orgData = await prisma.organizationTable.findUnique({
            where: { organizationId: org.organizationId },
            select: { organizationName: true },
        });
        const orgName = orgData?.organizationName || "Unknown";
        const preClaimScore = Number(org.preClaimScore);
        const orgScore = org.orgScore ? Number(org.orgScore) : null;
        const claimVsPlanted = org.claimVsPlanted
            ? Number(org.claimVsPlanted)
            : null;
        const totalClaimed = org.totalClaimed || 0;
        const totalPlanted = org.totalPlanted || 0;

        console.log(`\n📊 ${orgName}`);
        console.log(`   ${"─".repeat(80)}`);
        console.log(
            `   Pre-Claim Score:  ${preClaimScore.toFixed(2)}% (average of project scores)`,
        );
        console.log(
            `   Trees Claimed:    ${totalClaimed.toLocaleString()} trees`,
        );
        console.log(
            `   Trees Verified:   ${totalPlanted.toLocaleString()} trees`,
        );
        console.log(
            `   Disclosure Ratio: ${claimVsPlanted ? (claimVsPlanted * 100).toFixed(1) : "N/A"}%`,
        );
        console.log(
            `   Final Org Score:  ${orgScore !== null ? orgScore.toFixed(2) : "N/A"}% ${orgScore !== null && orgScore < preClaimScore ? "⚠️ PENALIZED" : "✓"}`,
        );
        console.log(
            `   Overall Percentile: ${org.orgPercentile !== null ? org.orgPercentile + "th" : "N/A"}`,
        );
        console.log(
            `   Type Percentile:    ${org.orgPercentileByType !== null ? org.orgPercentileByType + "th" : "N/A"} (${org.primaryStakeholderType || "no type"})`,
        );

        // Verify calculation
        if (orgScore !== null && claimVsPlanted !== null) {
            const expectedOrgScore = preClaimScore * claimVsPlanted;
            const diff = Math.abs(orgScore - expectedOrgScore);
            if (diff > 0.01) {
                console.log(
                    `   ❌ CALCULATION ERROR: Expected ${expectedOrgScore.toFixed(2)}%, got ${orgScore.toFixed(2)}%`,
                );
            }
        }
    }

    console.log("\n" + "=".repeat(100));
    console.log("\n✅ Test complete\n");
}

testOrgScores()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
