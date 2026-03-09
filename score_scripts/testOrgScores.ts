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
        orderBy: { pct_pre_claim: "desc" },
    });

    console.log(`\nFound ${orgs.length} organizations with scores\n`);

    for (const org of orgs) {
        // Get org name separately
        const orgData = await prisma.organizationTable.findUnique({
            where: { organizationId: org.organizationId },
            select: { organizationName: true },
        });
        const orgName = orgData?.organizationName || "Unknown";
        const pct_pre_claim = Number(org.pct_pre_claim);
        const pct_final = org.pct_final ? Number(org.pct_final) : null;
        const ratio_claim_disclosure = org.ratio_claim_disclosure
            ? Number(org.ratio_claim_disclosure)
            : null;
        const sum_claimed = org.sum_claimed || 0;
        const sum_planted = org.sum_planted || 0;

        console.log(`\n📊 ${orgName}`);
        console.log(`   ${"─".repeat(80)}`);
        console.log(
            `   Pre-Claim Score:  ${pct_pre_claim.toFixed(2)}% (average of project scores)`,
        );
        console.log(
            `   Trees Claimed:    ${sum_claimed.toLocaleString()} trees`,
        );
        console.log(
            `   Trees Verified:   ${sum_planted.toLocaleString()} trees`,
        );
        console.log(
            `   Disclosure Ratio: ${ratio_claim_disclosure ? (ratio_claim_disclosure * 100).toFixed(1) : "N/A"}%`,
        );
        console.log(
            `   Final Org Score:  ${pct_final !== null ? pct_final.toFixed(2) : "N/A"}% ${pct_final !== null && pct_final < pct_pre_claim ? "⚠️ PENALIZED" : "✓"}`,
        );
        console.log(
            `   Overall Percentile: ${org.rank_percentile !== null ? org.rank_percentile + "th" : "N/A"}`,
        );
        console.log(
            `   Type Percentile:    ${org.rank_percentile_by_type !== null ? org.rank_percentile_by_type + "th" : "N/A"} (${org.primaryStakeholderType || "no type"})`,
        );

        // Verify calculation
        if (pct_final !== null && ratio_claim_disclosure !== null) {
            const expected_pct_final = pct_pre_claim * ratio_claim_disclosure;
            const diff = Math.abs(pct_final - expected_pct_final);
            if (diff > 0.01) {
                console.log(
                    `   ❌ CALCULATION ERROR: Expected ${expected_pct_final.toFixed(2)}%, got ${pct_final.toFixed(2)}%`,
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
