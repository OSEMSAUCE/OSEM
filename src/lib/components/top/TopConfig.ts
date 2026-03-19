export type EntityType = "project" | "organization";

export interface TopConfig {
	entityType: EntityType;
	labels: {
		scoreLabel: string;
	};
}

export function createProjectConfig(): TopConfig {
	return {
		entityType: "project",
		labels: {
			scoreLabel: "PROJECT SCORE",
		},
	};
}

export function createOrganizationConfig(): TopConfig {
	return {
		entityType: "organization",
		labels: {
			scoreLabel: "ORGANIZATION SCORE",
		},
	};
}
