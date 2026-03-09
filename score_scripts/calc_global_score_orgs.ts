#!/usr/bin/env tsx
/**
 * calc_global_score_orgs.ts - Full Organization Score Calculation
 *
 * Scores ALL organizations in the database.
 * Aggregates project scores to organization level and applies claim disclosure penalty.
 *
 * Performance: ~2-3 seconds for all orgs (just averages and aggregations)
 *
 * Usage:
 *   tsx OSEM/score_scripts/calc_global_score_orgs.ts
 *   or via CLI.sh: ./CLI.sh global_score_orgs
 */

import { batch_score_orgs } from "./calc_batch_score_orgs.js";

async function global_score_orgs() {
    console.log("\n🏢 Global organization scoring - scoring all organizations...");
    
    // batch_score_orgs with no args scores all orgs
    await batch_score_orgs();

    console.log("\n✅ Global organization scoring complete");
}

global_score_orgs()
    .catch((e) => {
        console.error("❌ Error calculating org scores:", e);
        process.exit(1);
    });
