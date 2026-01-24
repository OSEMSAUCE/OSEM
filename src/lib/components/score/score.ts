// Make this score algorithm here.
import { supabase } from "../../supabase";

// ============================================================================
// STEP 1: Define relevant tables and their scorable attributes
// ============================================================================
const relevantTables = ["ProjectTable", "LandTable", "PolygonTable", "CropTable", "PlantingTable", "PolyTable", "OrganizationLocalTable", "StakeholderTable", "SourceTable"] as const;

type RelevantTable = (typeof relevantTables)[number];

// Step 1: Get attributes dynamically from record keys (DRY approach)
// No need to hardcode - just read keys from fetched data and filter out ignored ones

// ============================================================================
// STEP 3: Higher-value attribute scoring legend
// ============================================================================
const higherAttScoreLegend: Record<string, number> = {
	// Polygon-related (handled separately via polygonCalc)
	polygonId: 20, // Full polygon = 20 points
	geometry: 20, // If geometry exists
	// GPS coordinates
	gpsLat: 5,
	gpsLon: 5,
	// Crop/Species info
	cropName: 5,
	speciesId: 5,
	// Planting details
	plantingDate: 5,
	planted: 3,
	// Stakeholder
	stakeholderType: 2,
	organizationLocalId: 2,
	// Financial
	pricePerUnitUSD: 2,
	pricePerUnit: 2,
};

// Default score for attributes not in higherAttScoreLegend
const DEFAULT_ATTRIBUTE_SCORE = 1;

// ============================================================================
// STEP 3: Ignore list - attributes that should NOT be scored
// ============================================================================
const ignoreList = [
	"id",
	"lastEditedAt",
	"editedBy",
	"deleted",
	"createdAt",
	// Also ignore system/FK fields that don't represent "data quality"
	"parentTable",
	"parentId",
];

// ============================================================================
// STEP 4: Polygon density calculation
// Returns points based on trees/ha density
// ============================================================================
function polygonCalc(treesPlanted: number, hectares: number): number {
	if (!hectares || hectares <= 0) return 0;
	const treesPerHa = treesPlanted / hectares;

	if (treesPerHa >= 200) return 20; // Full points for good density
	if (treesPerHa >= 10) return 2; // Partial points
	return 0; // Too sparse, no points
}

// ============================================================================
// STEP 2 & 5: Score a single record from any table
// Returns { pointsScored, pointsAvailable, breakdown }
// ============================================================================
interface ScoreBreakdown {
	attribute: string;
	points: number;
	populated: boolean;
}

interface RecordScore {
	pointsScored: number;
	pointsAvailable: number;
	breakdown: ScoreBreakdown[];
}

function scoreRecord(record: Record<string, unknown>): RecordScore {
	const attributes = Object.keys(record);
	const breakdown: ScoreBreakdown[] = [];
	let pointsScored = 0;
	let pointsAvailable = 0;

	for (const attr of attributes) {
		// Skip ignored attributes
		if (ignoreList.includes(attr)) continue;

		const points = higherAttScoreLegend[attr] ?? DEFAULT_ATTRIBUTE_SCORE;
		const value = record[attr];
		const populated = value !== null && value !== undefined && value !== "";

		pointsAvailable += points;
		if (populated) {
			pointsScored += points;
		}

		breakdown.push({ attribute: attr, points, populated });
	}

	return { pointsScored, pointsAvailable, breakdown };
}

// ============================================================================
// Tables that are polymorphic (bonus points, not counted in pointsAvailable)
// Per user: stakeholders etc. are bonus - orgs can exceed 100% with extras
// ============================================================================
const polymorphicTables: RelevantTable[] = ["StakeholderTable", "OrganizationLocalTable"];

// ============================================================================
// STEP 5-7: Calculate total project score across all related records
// Step 5: pointsScored - sum all populated attribute points
// Step 6: pointsAvailable - sum all potential points (excluding polymorphic)
// Step 7: score = pointsScored / pointsAvailable * 100
// ============================================================================
interface ProjectScoreResult {
	projectId: string;
	pointsScored: number;
	pointsAvailable: number;
	score: number; // percentage (can exceed 100% with polymorphic bonus)
	polygonScore: number; // from polygonCalc
	tableBreakdown: Record<RelevantTable, { scored: number; available: number; count: number }>;
}

async function calculateProjectScore(projectId: string): Promise<ProjectScoreResult> {
	let totalScored = 0;
	let totalAvailable = 0;
	let polygonScoreTotal = 0;
	const tableBreakdown = {} as ProjectScoreResult["tableBreakdown"];

	// First, get lands for this project to calculate polygon density
	const { data: lands } = await supabase.from("LandTable").select("landId").eq("projectId", projectId);
	const landIds = (lands ?? []).map((l) => l.landId);

	// Get planted trees per land for polygonCalc
	const plantedPerLand: Record<string, number> = {};
	if (landIds.length > 0) {
		const { data: plantings } = await supabase.from("PlantingTable").select("parentId, planted").eq("parentTable", "LandTable").in("parentId", landIds);

		for (const p of plantings ?? []) {
			plantedPerLand[p.parentId] = (plantedPerLand[p.parentId] ?? 0) + (p.planted ?? 0);
		}
	}

	// Get polygons for density scoring
	if (landIds.length > 0) {
		const { data: polygons } = await supabase.from("PolygonTable").select("landId, hectaresCalc, geometry").in("landId", landIds);

		for (const poly of polygons ?? []) {
			if (poly.geometry && poly.hectaresCalc) {
				const treesPlanted = plantedPerLand[poly.landId] ?? 0;
				polygonScoreTotal += polygonCalc(treesPlanted, Number(poly.hectaresCalc));
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
			const { data: stakeholders } = await supabase.from("StakeholderTable").select("organizationLocalId").eq("projectId", projectId);
			const orgIds = [...new Set((stakeholders ?? []).map((s) => s.organizationLocalId))];
			if (orgIds.length === 0) continue;
			query = supabase.from(tableName).select("*").in("organizationLocalId", orgIds);
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
		const { data: projects } = await supabase.from("ProjectTable").select("projectId").limit(1);
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
		console.log(`   ${table}: ${data.scored}/${data.available} (${data.count} records)`);
	}
}

// ============================================================================
// Export for use
// ============================================================================
export { relevantTables, higherAttScoreLegend, ignoreList, polygonCalc, scoreRecord, calculateProjectScore, testScore };
export type { RecordScore, ProjectScoreResult, ScoreBreakdown };
