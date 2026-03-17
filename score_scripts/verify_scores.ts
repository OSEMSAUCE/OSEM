#!/usr/bin/env tsx
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

async function verifyScores() {
    const projectKey = process.argv[2] || "a-treesforseas%3A%20dry%20forest%20restoration";
    const orgKey = process.argv[3] || "a-treesforseas";

    console.log("\n📊 Verifying Scores\n");

    const project = await prisma.projectTable.findUnique({
        where: { projectKey },
        select: {
            projectKey: true,
            projectName: true,
            scoreProject: true,
            scoreProjectRank: true,
            scorePointsAvailable: true,
            scorePointsScored: true,
        },
    });

    const org = await prisma.organizationTable.findUnique({
        where: { organizationKey: orgKey },
        select: {
            organizationKey: true,
            organizationName: true,
            scoreOrgFinal: true,
            scoreRankOverall: true,
            scorePointsAvailable: true,
            scorePointsScored: true,
        },
    });

    console.log("PROJECT:", JSON.stringify(project, null, 2));
    console.log("\nORG:", JSON.stringify(org, null, 2));

    await pool.end();
}

verifyScores()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
