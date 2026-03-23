import { z } from "zod";

export const WhoOrganizationSchema = z.object({
    organizationKey: z.string(),
    organizationName: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    contactEmail: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
    updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
    // Include aggregated data from linked local orgs
    claims: z.array(z.any()).optional(),
    OrganizationTable: z
        .array(
            z.object({
                organizationKey: z.string(),
                organizationName: z.string().nullable().optional(),
            }),
        )
        .optional(),
});

export const WhoPageDataSchema = z.object({
    organizations: z.array(WhoOrganizationSchema),
    error: z.string().optional(),
});

export type WhoOrganization = z.infer<typeof WhoOrganizationSchema>;
export type WhoPageData = z.infer<typeof WhoPageDataSchema>;

export const WhatProjectSchema = z.object({
    projectKey: z.string(),
    projectName: z.string().nullable(),
    url: z.string().nullable().optional(),
    platform: z.string().nullable().optional(),
    platformId: z.string().nullable().optional(),
    projectDesc: z.string().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
    lastEditedAt: z.union([z.string(), z.date()]).nullable().optional(),
    deleted: z.boolean().nullable().optional(),
    carbonRegistryType: z.string().nullable().optional(),
    carbonRegistry: z.string().nullable().optional(),
    employmentClaimQty: z.number().int().nullable().optional(),
    employmentClaimQtyDescription: z.string().nullable().optional(),
    projectEndDt: z.union([z.string(), z.date()]).nullable().optional(),
    projectStartDt: z.union([z.string(), z.date()]).nullable().optional(),
    registryId: z.string().nullable().optional(),
    isPublic: z.boolean().optional(),
});

export const ProjectScoreSchema = z.object({
    score: z.number(),
    pointsScored: z.number().int(),
    pointsAvailible: z.number().int(),
    percentile: z.number().int().nullable().optional(),
});

export const ScoreReportFieldSchema = z.object({
    Table: z.string(),
    Attribute: z.string(),
    Points: z.number(),
    HasData: z.boolean(),
    Value: z.unknown().nullable(),
    DataType: z.string(),
});

export const ScoreReportSchema = z.object({
    projectKey: z.string(),
    scorePercentage: z.number(),
    totalScoredPoints: z.number(),
    totalPossiblePoints: z.number(),
    percentile: z.number().int().nullable().optional(),
    fieldsAnalyzed: z.number(),
    allFields: z.array(ScoreReportFieldSchema),
});

export const WhatPageDataSchema = z.object({
    selectedprojectKey: z.string().nullable(),
    selectedTable: z.string().nullable(),
    projects: z.array(WhatProjectSchema),
    availableTables: z.array(z.object({ tableName: z.string() })),
    tableData: z.array(z.record(z.string(), z.unknown())),
    tableCounts: z.record(z.string(), z.number().int()),
    projectScore: ProjectScoreSchema.nullable().optional(),
    scoreReport: ScoreReportSchema.nullable().optional(),
    error: z.string().nullable().optional(),
});

export type WhatPageData = z.infer<typeof WhatPageDataSchema>;
