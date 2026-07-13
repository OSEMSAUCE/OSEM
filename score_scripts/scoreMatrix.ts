/**
 * Source of truth for field point values.
 * ScoreMatrixTable in the database is seeded FROM this file.
 * If you change values here, re-run this script to update the DB.
 *
 * Fields NOT listed here default to 1 point (via scoreConfig.json).
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
 * Seed the ScoreMatrixTable in the database from this file.
 * Run: tsx OSEM/score_scripts/scoreMatrix.ts
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

	const connectionString = process.env.DIRECT_URL;
	if (!connectionString) throw new Error("DIRECT_URL is not set!");

	const pool = new pg.default.Pool({
		connectionString,
		max: config.pool.maxConnections,
		ssl: { rejectUnauthorized: false },
	});
	const adapter = new PrismaPg(pool);
	const prisma = new PrismaClient({ adapter });

	console.log("Seeding ScoreMatrixTable...");

	for (const [fieldName, { points, description }] of Object.entries(SCORE_MATRIX)) {
		await prisma.scoreMatrixTable.upsert({
			where: { fieldName },
			create: {
				fieldName,
				pointsAvailable: points,
				description,
			},
			update: {
				pointsAvailable: points,
				description,
			},
		});
		console.log(`  ${fieldName}: ${points} pts`);
	}

	// Delete any DB rows not in this file (stale entries)
	const validFields = Object.keys(SCORE_MATRIX);
	const deleted = await prisma.scoreMatrixTable.deleteMany({
		where: { fieldName: { notIn: validFields } },
	});
	if (deleted.count > 0) {
		console.log(`  Removed ${deleted.count} stale entries`);
	}

	console.log("Done.");
	await pool.end();
	process.exit(0);
}
