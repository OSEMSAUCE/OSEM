/**
 * BOOTSTRAP VALUES ONLY — the database is the source of truth.
 *
 * `ScoreMatrixTable` in the DB holds the live field point values. Edit weights
 * there (SQL / Studio) and re-run scoring — no code change, no deploy.
 *
 * This constant exists solely to populate an EMPTY table. If the table already
 * has rows, nothing here is ever written and nothing is ever deleted, so
 * hand-edited weights always survive.
 *
 * Fields NOT in the table default to 1 point (via scoreConfig.json).
 * System fields (keys, timestamps, etc.) return 0 via isSystemField() in score_projects.ts.
 */

export const SCORE_MATRIX: Record<string, { points: number; description: string }> = {
	// 20 points — proves the site physically exists
	geometry: { points: 20, description: "GeoJSON polygon data" },

	// 5 points — high-value verification fields
	latitude: { points: 5, description: "GPS coordinate" },
	longitude: { points: 5, description: "GPS coordinate" },
	cropName: { points: 5, description: "Species identification" },
	speciesId: { points: 5, description: "Species identification" },
	plantingDate: { points: 5, description: "Temporal data" },
	plotCenter: { points: 5, description: "Circular plot geometry" },
	radius: { points: 5, description: "Circular plot geometry" },

	// 3 points — quantified impact
	plantedQty: { points: 3, description: "Quantified impact" },

	// 2 points — classification and economic data
	stakeholderCategory: { points: 2, description: "Stakeholder classification" },
	pricePerUnit: { points: 2, description: "Economic data" },
	pricePerUnitUSD: { points: 2, description: "Economic data" },
};

/**
 * Populate ScoreMatrixTable ONLY if it is completely empty.
 *
 * Non-destructive by design: if the table has any rows, this is a no-op and the
 * DB keeps whatever weights are in it. Nothing is ever updated or deleted, so
 * the database always wins over the constant above.
 *
 * Called automatically by score_projects.ts before every scoring run, so the
 * matrix can never silently sit empty (which would flatten every field to 1pt).
 *
 * Accepts an existing PrismaClient so callers reuse their connection pool.
 * Returns the number of rows created (0 when the table was already populated).
 */
export async function seedScoreMatrixIfEmpty(
	// biome-ignore lint/suspicious/noExplicitAny: PrismaClient type varies by import path
	prisma: any,
): Promise<number> {
	const existing = await prisma.scoreMatrixTable.count();
	if (existing > 0) return 0;

	console.log("⚠️  ScoreMatrixTable is empty — bootstrapping from scoreMatrix.ts");

	const rows = Object.entries(SCORE_MATRIX).map(([fieldName, { points, description }]) => ({
		fieldName,
		pointsAvailable: points,
		description,
	}));

	await prisma.scoreMatrixTable.createMany({ data: rows });

	for (const row of rows) {
		console.log(`  ${row.fieldName}: ${row.pointsAvailable} pts`);
	}
	console.log(`✅ Seeded ${rows.length} field weights. The DB is now the source of truth —`);
	console.log("   edit ScoreMatrixTable directly to retune; this file won't overwrite it.");

	return rows.length;
}

/**
 * Standalone entry point.
 * Run: tsx harness/score_scripts/scoreMatrix.ts
 *
 * Seeds an empty table, or prints the live DB weights if already populated.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
	const { readFileSync } = await import("node:fs");
	const { dirname, join } = await import("node:path");
	const { fileURLToPath } = await import("node:url");
	const { PrismaPg } = await import("@prisma/adapter-pg");
	const pg = await import("pg");
	const { PrismaClient } = await import("../../prisma/generated/prisma-postgres/client.js");

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	const config = JSON.parse(readFileSync(join(__dirname, "scoreConfig.json"), "utf8"));

	const connectionString = process.env.DATABASE_MIGRATIONS_DEV_URL;
	if (!connectionString) throw new Error("DATABASE_MIGRATIONS_DEV_URL is not set!");

	const pool = new pg.default.Pool({
		connectionString,
		max: config.pool.maxConnections,
		ssl: { rejectUnauthorized: false },
	});
	const adapter = new PrismaPg(pool);
	const prisma = new PrismaClient({ adapter });

	const seeded = await seedScoreMatrixIfEmpty(prisma);

	if (seeded === 0) {
		const live = await prisma.scoreMatrixTable.findMany({
			orderBy: [{ pointsAvailable: "desc" }, { fieldName: "asc" }],
		});
		console.log(`ScoreMatrixTable already populated — ${live.length} live weights (DB is source of truth):`);
		for (const row of live) {
			console.log(`  ${row.fieldName}: ${row.pointsAvailable} pts`);
		}
		console.log("\nNothing written. To change a weight, UPDATE the row in the DB.");
	}

	console.log("Done.");
	await pool.end();
	process.exit(0);
}
