import type { ServerLoad } from "@sveltejs/kit";
import { PUBLIC_API_URL } from "$env/static/public";
import { WhatPageDataSchema } from "../../lib/types/what";

export const load: ServerLoad = async ({
    url,
    fetch,
}: {
    url: URL;
    fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>;
}) => {
    const projectIdParam = url.searchParams.get("projectId");
    const tableParam = url.searchParams.get("table");

    // Build query params
    const params = new URLSearchParams();

    if (projectIdParam) params.set("projectId", projectIdParam);
    if (tableParam) params.set("table", tableParam);

    const fallback = {
        selectedProjectId: projectIdParam,
        selectedTable: tableParam,
        projects: [],
        availableTables: [],
        tableData: [],
        tableCounts: {},
        projectScore: null,
        scoreReport: null,
        lazy: Promise.resolve({
            tableData: [] as Record<string, unknown>[],
            tableCounts: {} as Record<string, number>,
        }),
    };

    const base = PUBLIC_API_URL.replace(/\/$/, "");

    // Fast fetch: projects + score only, no table data
    const fastParams = new URLSearchParams(params);
    fastParams.set("fast", "1");
    const fastUrl = `${base}/api/what?${fastParams}`;

    let response: Response;
    try {
        response = await fetch(fastUrl, {
            signal: AbortSignal.timeout(30_000),
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("❌ what API unreachable:", msg);
        return { ...fallback, error: `API unreachable: ${msg}` };
    }

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error(
            `❌ what API ${response.status}:`,
            body.substring(0, 500),
        );
        return {
            ...fallback,
            error: `API error ${response.status}: ${body.substring(0, 200)}`,
        };
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
        const text = await response.text();
        console.error(
            "🚨 API returned non-JSON response:",
            text.substring(0, 500),
        );
        return { ...fallback, error: `API returned non-JSON (${contentType})` };
    }

    let json: unknown;
    try {
        json = await response.json();
    } catch {
        console.error("🚨 Failed to parse JSON from what API");
        return { ...fallback, error: "API returned unparseable JSON" };
    }

    const parsed = WhatPageDataSchema.safeParse(json);
    if (!parsed.success) {
        console.error("❌ SCHEMA VALIDATION FAILED:", parsed.error);
        return { ...fallback, error: "API returned unexpected data shape" };
    }

    // Fetch scoreReport separately if a project is selected
    let scoreReport = null;
    if (parsed.data.selectedProjectId) {
        try {
            const reportUrl = `${base}/api/score/report?projectId=${encodeURIComponent(parsed.data.selectedProjectId)}`;
            const reportRes = await fetch(reportUrl, {
                signal: AbortSignal.timeout(30_000),
            });
            if (reportRes.ok) {
                scoreReport = await reportRes.json();
            }
        } catch {
            console.error("⚠️ Failed to fetch score report");
        }
    }

    // Stream table data separately — don't block the initial render
    const fullUrl = `${base}/api/what?${params}`;
    const lazy = projectIdParam
        ? fetch(fullUrl, { signal: AbortSignal.timeout(60_000) })
              .then((r) => r.json())
              .then((d) => ({
                  tableData: (d.tableData ?? []) as Record<string, unknown>[],
                  tableCounts: (d.tableCounts ?? {}) as Record<string, number>,
              }))
              .catch(() => ({ tableData: [], tableCounts: {} }))
        : Promise.resolve({
              tableData: [] as Record<string, unknown>[],
              tableCounts: {} as Record<string, number>,
          });

    return { ...parsed.data, scoreReport, lazy };
};
