export type StageEntity = "organization" | "project";

export type StageRoutePath = "/who" | "/what";

export type StagePageData = {
	entity: StageEntity;
	heading: string;
	description: string;
	routePath: StageRoutePath;
};
