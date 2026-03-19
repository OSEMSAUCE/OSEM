export type EntityType = "project" | "organization";

export interface TopConfig {
	entityType: EntityType;
	theme: "osem" | "retriever";
	labels: {
		entityName: string;
		entityNamePlural: string;
		scoreLabel: string;
	};
	dataKeys: {
		key: string;
		name: string;
		slug?: string;
	};
	features: {
		showMapButton?: boolean;
		showRank?: boolean;
		showScore?: boolean;
		showTables?: boolean;
	};
}

export function createProjectConfig(theme: "osem" | "retriever" = "osem"): TopConfig {
	return {
		entityType: "project",
		theme,
		labels: {
			entityName: "Project",
			entityNamePlural: "Projects",
			scoreLabel: "PROJECT SCORE",
		},
		dataKeys: {
			key: "projectKey",
			name: "projectName",
			slug: "projectSlug",
		},
		features: {
			showMapButton: true,
			showRank: true,
			showScore: true,
			showTables: true,
		},
	};
}

export function createOrganizationConfig(theme: "osem" | "retriever" = "osem"): TopConfig {
	return {
		entityType: "organization",
		theme,
		labels: {
			entityName: "Organization",
			entityNamePlural: "Organizations",
			scoreLabel: "ORGANIZATION SCORE",
		},
		dataKeys: {
			key: "organizationKey",
			name: "organizationName",
			slug: "organizationSlug",
		},
		features: {
			showMapButton: false,
			showRank: true,
			showScore: true,
			showTables: true,
		},
	};
}
