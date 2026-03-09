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
    const orgs = await prisma.orgScore_helper.findMany({
        take: 10,
        orderBy: { org_pct_pre_claim: "desc" },
    });

    console.log(`\nFound ${orgs.length} organizations with scores\n`);

    for (const org of orgs) {
        // Get org name separately
        const orgData = await prisma.organizationTable.findUnique({
            where: { organizationId: org.organizationId },
            select: { organizationName: true },
        });
        const orgName = orgData?.organizationName || "Unknown";
        const org_pct_pre_claim = Number(org.org_pct_pre_claim);
        const org_pct_final = org.org_pct_final ? Number(org.org_pct_final) : null;
        const sum_undisclosed = org.sum_undisclosed || 0;
        const sum_claimed = org.sum_claimed || 0;
        const sum_planted = org.sum_planted || 0;
        const ratio_disclosure = sum_claimed > 0 ? sum_planted / sum_claimed : 1.0;

        console.log(`\n📊 ${orgName}`);
        console.log(`   ${"─".repeat(80)}`);
        console.log(
            `   Pre-Claim Score:  ${org_pct_pre_claim.toFixed(2)}% (average of project scores)`,
        );
        console.log(
            `   Trees Claimed:    ${sum_claimed.toLocaleString()} trees`,
        );
        console.log(
            `   Trees Verified:   ${sum_planted.toLocaleString()} trees`,
        );
        console.log(
            `   Trees Undisclosed: ${sum_undisclosed.toLocaleString()} trees (${sum_claimed > 0 ? ((sum_undisclosed / sum_claimed) * 100).toFixed(1) : "N/A"}%)`,
        );
        console.log(
            `   Disclosure Ratio: ${(ratio_disclosure * 100).toFixed(1)}%`,
        );
        console.log(
            `   Final Org Score:  ${org_pct_final !== null ? org_pct_final.toFixed(2) : "N/A"}% ${org_pct_final !== null && org_pct_final < org_pct_pre_claim ? "⚠️ PENALIZED" : "✓"}`,
        );
        console.log(
            `   Overall Rank: ${org.org_rank_overall !== null ? org.org_rank_overall + "th" : "N/A"}`,
        );
        console.log(
            `   Type Rank:    ${org.org_rank_by_type !== null ? org.org_rank_by_type + "th" : "N/A"} (${org.primaryStakeholderType || "no type"})`,
        );

        // Verify calculation
        if (org_pct_final !== null) {
            const expected_org_pct_final = org_pct_pre_claim * ratio_disclosure;
            const diff = Math.abs(org_pct_final - expected_org_pct_final);
            if (diff > 0.01) {
                console.log(
                    `   ❌ CALCULATION ERROR: Expected ${expected_org_pct_final.toFixed(2)}%, got ${org_pct_final.toFixed(2)}%`,
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
