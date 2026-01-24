// Make this score algorithm here.
import { supabase } from "../../supabase";

// ============================================================================
// STEP 1: Define relevant tables and their scorable attributes
// ============================================================================
const relevantTables = ["ProjectTable", "LandTable", "PlantingTable", "PolyTable", "OrganizationLocalTable", "StakeholderTable", "SourceTable"] as const;

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
// STEP 5: Calculate total project score across all related records
// ============================================================================
interface ProjectScoreResult {
	projectId: string;
	pointsScored: number;
	pointsAvailable: number;
	score: number; // percentage
	tableBreakdown: Record<RelevantTable, { scored: number; available: number; count: number }>;
}

async function calculateProjectScore(projectId: string): Promise<ProjectScoreResult> {
	let totalScored = 0;
	let totalAvailable = 0;
	const tableBreakdown = {} as ProjectScoreResult["tableBreakdown"];

	// Fetch and score each relevant table's records for this project
	for (const tableName of relevantTables) {
		const { data, error } = await supabase.from(tableName).select("*").eq("projectId", projectId);

		if (error) {
			console.error(`Error fetching ${tableName}:`, error);
			continue;
		}

		let tableScored = 0;
		let tableAvailable = 0;

		for (const record of data ?? []) {
			const { pointsScored, pointsAvailable } = scoreRecord(record);
			tableScored += pointsScored;
			tableAvailable += pointsAvailable;
		}

		tableBreakdown[tableName] = {
			scored: tableScored,
			available: tableAvailable,
			count: data?.length ?? 0,
		};

		totalScored += tableScored;
		totalAvailable += tableAvailable;
	}

	return {
		projectId,
		pointsScored: totalScored,
		pointsAvailable: totalAvailable,
		score: totalAvailable > 0 ? (totalScored / totalAvailable) * 100 : 0,
		tableBreakdown,
	};
}

// ============================================================================
// Export for use
// ============================================================================
export { relevantTables, higherAttScoreLegend, ignoreList, polygonCalc, scoreRecord, calculateProjectScore };
export type { RecordScore, ProjectScoreResult, ScoreBreakdown };
