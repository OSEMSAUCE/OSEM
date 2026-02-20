// Score algorithm — uses shared config from scoreConfig.ts
import { supabase } from "../../supabase";
import {
    type ProjectScoreResult,
    polygonCalc,
    polymorphicTables,
    type RelevantTable,
    relevantTables,
    scoreRecord,
} from "./scoreConfig";

async function calculateProjectScore(
    projectId: string,
): Promise<ProjectScoreResult> {
    let totalScored = 0;
    let totalAvailable = 0;
    let polygonScoreTotal = 0;
    const tableBreakdown = {} as ProjectScoreResult["tableBreakdown"];

    // First, get lands for this project to calculate polygon density
    const { data: lands } = await supabase
        .from("LandTable")
        .select("landId")
        .eq("projectId", projectId);
    const landIds = (lands ?? []).map((l) => l.landId);

    // Get planted trees per land for polygonCalc
    const plantedPerLand: Record<string, number> = {};
    if (landIds.length > 0) {
        const { data: plantings } = await supabase
            .from("PlantingTable")
            .select("parentId, planted")
            .eq("parentTable", "LandTable")
            .in("parentId", landIds);

        for (const p of plantings ?? []) {
            plantedPerLand[p.parentId] =
                (plantedPerLand[p.parentId] ?? 0) + (p.planted ?? 0);
        }
    }

    // Get polygons for density scoring
    if (landIds.length > 0) {
        const { data: polygons } = await supabase
            .from("PolygonTable")
            .select("landId, hectaresCalc, geometry")
            .in("landId", landIds);

        for (const poly of polygons ?? []) {
            if (poly.geometry && poly.hectaresCalc) {
                const treesPlanted = plantedPerLand[poly.landId] ?? 0;
                polygonScoreTotal += polygonCalc(
                    treesPlanted,
                    Number(poly.hectaresCalc),
                );
            }
        }
    }

    // Fetch and score each relevant table's records for this project
    for (const tableName of relevantTables) {
        let query = supabase.from(tableName).select("*");

        // Handle tables without direct projectId
        if (tableName === "PolygonTable") {
            if (landIds.length === 0) continue;
            query = supabase.from(tableName).select("*").in("landId", landIds);
        } else if (tableName === "OrganizationLocalTable") {
            // Get via StakeholderTable linkage
            const { data: stakeholders } = await supabase
                .from("StakeholderTable")
                .select("organizationLocalId")
                .eq("projectId", projectId);
            const orgIds = [
                ...new Set(
                    (stakeholders ?? []).map((s) => s.organizationLocalId),
                ),
            ];
            if (orgIds.length === 0) continue;
            query = supabase
                .from(tableName)
                .select("*")
                .in("organizationLocalId", orgIds);
        } else {
            query = query.eq("projectId", projectId);
        }

        const { data, error } = await query;

        if (error) {
            console.error(`Error fetching ${tableName}:`, error);
            continue;
        }

        let tableScored = 0;
        let tableAvailable = 0;
        const isPolymorphic = polymorphicTables.includes(tableName);

        for (const record of data ?? []) {
            const { pointsScored, pointsAvailable } = scoreRecord(record);
            tableScored += pointsScored;
            // Polymorphic tables don't add to available (they're bonus points)
            if (!isPolymorphic) {
                tableAvailable += pointsAvailable;
            }
        }

        tableBreakdown[tableName] = {
            scored: tableScored,
            available: tableAvailable,
            count: data?.length ?? 0,
        };

        totalScored += tableScored;
        totalAvailable += tableAvailable;
    }

    // Add polygon density score to total
    totalScored += polygonScoreTotal;

    return {
        projectId,
        pointsScored: totalScored,
        pointsAvailable: totalAvailable,
        score: totalAvailable > 0 ? (totalScored / totalAvailable) * 100 : 0,
        polygonScore: polygonScoreTotal,
        tableBreakdown,
    };
}

// ============================================================================
// Test function - run to verify scoring works
// ============================================================================
async function testScore(projectId?: string): Promise<void> {
    // If no projectId provided, get the first project from DB
    if (!projectId) {
        const { data: projects } = await supabase
            .from("ProjectTable")
            .select("projectId")
            .limit(1);
        if (!projects?.length) {
            console.log("No projects found in DB to test");
            return;
        }
        projectId = projects[0].projectId;
    }

    console.log(`\n🧪 Testing score for project: ${projectId}\n`);
    const result = await calculateProjectScore(projectId!);

    console.log("📊 Results:");
    console.log(`   Points Scored: ${result.pointsScored}`);
    console.log(`   Points Available: ${result.pointsAvailable}`);
    console.log(`   Score: ${result.score.toFixed(2)}%`);
    console.log(`   Polygon Density Score: ${result.polygonScore}`);
    console.log("\n📋 Table Breakdown:");
    for (const [table, data] of Object.entries(result.tableBreakdown)) {
        console.log(
            `   ${table}: ${data.scored}/${data.available} (${data.count} records)`,
        );
    }
}

// ============================================================================
// Export for use
// ============================================================================
export { calculateProjectScore, testScore };
export type {
    ProjectScoreResult,
    RecordScore,
    RelevantTable,
    ScoreBreakdown,
} from "./scoreConfig";
export {
    DEFAULT_ATTRIBUTE_SCORE,
    ignoreList,
    polygonCalc,
    polymorphicTables,
    relevantTables,
    scoreMatrix,
    scoreRecord,
} from "./scoreConfig";
