export type StageEntity = "organization" | "project";

export type StageRoutePath = "/who" | "/what";

export type OrganizationDetail = {
    organizationKey: string;
    organizationName: string | null;
    organizationDesc: string | null;
    website: string | null;
    primaryStakeholderCategory: string | null;
    scoreRankOverall: number | null;
    scoreOrgFinal: number | null;
    scorePointsAvailable: number | null;
    scorePointsScored: number | null;
};

export type ProjectDetail = {
    projectKey: string;
    projectName: string | null;
    projectDesc: string | null;
    scoreProjectRank: number | null;
    scoreProject: number | null;
    scorePointsAvailable: number | null;
    scorePointsScored: number | null;
    projectStartDt: string | null;
    projectEndDt: string | null;
};

export type EntityDetail =
    | { entity: "organization"; data: OrganizationDetail }
    | { entity: "project"; data: ProjectDetail };

export type StagePageData = {
    entity: StageEntity;
    heading: string;
    description: string;
    routePath: StageRoutePath;
    selectedEntity?: EntityDetail;
};
