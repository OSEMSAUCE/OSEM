// ============================================================================
// Score Config — single source of truth for scoring config, types, and pure fns.
// Imported by scoreCalc.ts and the /api/score route.
// ============================================================================

// ============================================================================
// STEP 1: Define relevant tables and their scorable attributes
// ============================================================================
export const relevantTables = ["ProjectTable", "LandTable", "PolygonTable", "CropTable", "PlantingTable", "PolyTable", "OrganizationLocalTable", "StakeholderTable", "SourceTable"] as const;

export type RelevantTable = (typeof relevantTables)[number];

// ============================================================================
// STEP 3: Attribute scoring matrix
// ============================================================================
export const scoreMatrix: Record<string, number> = {
	// Note project attributes default to 1 point per attribute.
	// The following have outsized value for transparency:
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
	// Survey
	plotCenter: 5,
	radius: 5,
};

// Default score for attributes not in scoreMatrix
export const DEFAULT_ATTRIBUTE_SCORE = 1;

// ============================================================================
// STEP 3: Ignore list - attributes that should NOT be scored
// ============================================================================
export const ignoreList = [
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
// Tables that are polymorphic (bonus points, not counted in pointsAvailable)
// Per user: stakeholders etc. are bonus - orgs can exceed 100% with extras
// ============================================================================
export const polymorphicTables: RelevantTable[] = ["StakeholderTable", "OrganizationLocalTable"];

// ============================================================================
// Types
// ============================================================================
export interface ScoreBreakdown {
	attribute: string;
	points: number;
	populated: boolean;
}

export interface RecordScore {
	pointsScored: number;
	pointsAvailable: number;
	breakdown: ScoreBreakdown[];
}

export interface ProjectScoreResult {
	projectId: string;
	pointsScored: number;
	pointsAvailable: number;
	score: number; // percentage (can exceed 100% with polymorphic bonus)
	polygonScore: number; // from polygonCalc
	tableBreakdown: Record<RelevantTable, { scored: number; available: number; count: number }>;
}

// ============================================================================
// Org Score types (Steps 9-12)
// ============================================================================
export interface OrgScoreResult {
	organizationMasterId: string;
	organizationId: string; // first local org id
	orgSubScore: number; // aggregate project score %
	orgPointsScored: number;
	orgPointsAvailible: number;
	claimCountAve: number; // average of all claim counts
	claimCounted: number; // actual trees counted across projects (sum of PlantingTable.planted)
	claimPercent: number; // claimCounted / claimCountAve * 100
	orgSubScoreByClaim: number; // orgSubScore * (claimPercent / 100)
	stakeholderType: string | null; // most popular stakeholder type
	stakeholderAverage: number; // average orgSubScoreByClaim for this stakeholderType
	orgScore: number; // final score
	orgPercentile: number; // percentile within stakeholderType
}

// ============================================================================
// STEP 4: Polygon density calculation
// Returns points based on trees/ha density
// ============================================================================
export function polygonCalc(treesPlanted: number, hectares: number): number {
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
export function scoreRecord(record: Record<string, unknown>): RecordScore {
	const attributes = Object.keys(record);
	const breakdown: ScoreBreakdown[] = [];
	let pointsScored = 0;
	let pointsAvailable = 0;

	for (const attr of attributes) {
		// Skip ignored attributes
		if (ignoreList.includes(attr)) continue;

		const points = scoreMatrix[attr] ?? DEFAULT_ATTRIBUTE_SCORE;
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
